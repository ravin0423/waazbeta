import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldCheck, Clock, CheckCircle2, XCircle, QrCode, Banknote, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface PendingDevice {
  id: string;
  product_name: string;
  serial_number: string;
  imei_number: string | null;
  whatsapp_number: string;
  address: string;
  payment_method: string | null;
  payment_status: string;
  upi_transaction_id: string | null;
  status: string;
  created_at: string;
  user_id: string;
  customer_email?: string;
  customer_name?: string;
  plan_name?: string;
  plan_price?: number;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string | null;
}

const AdminDeviceApprovals = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<PendingDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<PendingDevice | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'active' | 'rejected'>('pending');

  const fetchDevices = async () => {
    setLoading(true);
    const { data: devicesData } = await supabase
      .from('customer_devices')
      .select('*')
      .eq('status', filter)
      .order('created_at', { ascending: false });

    if (!devicesData) { setDevices([]); setLoading(false); return; }

    // Fetch profiles and plans for display
    const userIds = [...new Set(devicesData.map(d => d.user_id))];
    const planIds = [...new Set(devicesData.map(d => d.subscription_plan_id).filter(Boolean))];

    const [profilesRes, plansRes] = await Promise.all([
      supabase.from('profiles').select('id, full_name, email').in('id', userIds),
      planIds.length > 0 ? supabase.from('subscription_plans').select('id, name, annual_price').in('id', planIds) : Promise.resolve({ data: [] }),
    ]);

    const profiles = new Map((profilesRes.data || []).map(p => [p.id, p]));
    const plans = new Map(((plansRes.data || []) as any[]).map(p => [p.id, p]));

    const enriched: PendingDevice[] = devicesData.map(d => {
      const profile = profiles.get(d.user_id);
      const plan = plans.get(d.subscription_plan_id || '');
      return {
        ...d,
        customer_email: profile?.email || '',
        customer_name: profile?.full_name || '',
        plan_name: plan?.name || '',
        plan_price: plan?.annual_price || 0,
      } as PendingDevice;
    });

    setDevices(enriched);
    setLoading(false);
  };

  const fetchChecklist = async () => {
    const { data } = await supabase
      .from('approval_checklist_items' as any)
      .select('id, label, description')
      .eq('is_active', true)
      .order('display_order');
    setChecklistItems((data as any[]) || []);
  };

  useEffect(() => { fetchDevices(); }, [filter]);
  useEffect(() => { fetchChecklist(); }, []);

  const openApprovalDialog = (device: PendingDevice) => {
    setSelectedDevice(device);
    setCheckedItems(new Set());
    setDialogOpen(true);
  };

  const toggleCheck = (itemId: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const allChecked = checklistItems.length > 0 && checkedItems.size === checklistItems.length;

  const handleApprove = async () => {
    if (!selectedDevice || !user) return;
    setProcessing(true);

    // Save checklist checks
    const checksToInsert = checklistItems.map(item => ({
      device_id: selectedDevice.id,
      checklist_item_id: item.id,
      is_checked: checkedItems.has(item.id),
      checked_by: user.id,
      checked_at: new Date().toISOString(),
    }));

    if (checksToInsert.length > 0) {
      await supabase.from('device_approval_checks' as any).insert(checksToInsert as any);
    }

    // Approve the device
    const { error } = await supabase
      .from('customer_devices')
      .update({
        status: 'active',
        payment_status: 'confirmed',
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      } as any)
      .eq('id', selectedDevice.id);

    setProcessing(false);
    setDialogOpen(false);

    if (error) {
      toast.error('Failed to approve');
    } else {
      toast.success(`Device approved for ${selectedDevice.customer_name}`);
      fetchDevices();
    }
  };

  const handleReject = async () => {
    if (!selectedDevice) return;
    if (!confirm('Are you sure you want to reject this subscription?')) return;
    setProcessing(true);

    await supabase
      .from('customer_devices')
      .update({ status: 'rejected', payment_status: 'rejected' } as any)
      .eq('id', selectedDevice.id);

    setProcessing(false);
    setDialogOpen(false);
    toast.success('Subscription rejected');
    fetchDevices();
  };

  const getPaymentBadge = (device: PendingDevice) => {
    if (device.payment_method === 'upi') {
      return (
        <Badge variant="outline" className="gap-1">
          <QrCode size={12} /> UPI
        </Badge>
      );
    }
    if (device.payment_method === 'cash') {
      return (
        <Badge variant="outline" className="gap-1">
          <Banknote size={12} /> Cash
        </Badge>
      );
    }
    return <Badge variant="secondary">Not set</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <ShieldCheck size={24} className="text-primary" />
            Subscription Approvals
          </h1>
          <p className="text-muted-foreground text-sm">Review and approve customer subscription activations</p>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(['pending', 'active', 'rejected'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f === 'pending' && <Clock size={14} className="mr-1" />}
              {f === 'active' && <CheckCircle2 size={14} className="mr-1" />}
              {f === 'rejected' && <XCircle size={14} className="mr-1" />}
              {f}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : devices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShieldCheck size={48} className="mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No {filter} subscriptions found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {devices.map(device => (
              <Card key={device.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{device.customer_name || 'Unknown'}</p>
                        <span className="text-xs text-muted-foreground">({device.customer_email})</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                        <span>📱 {device.product_name}</span>
                        <span>🔑 {device.serial_number}</span>
                        {device.imei_number && <span>📟 IMEI: {device.imei_number}</span>}
                      </div>
                      <div className="flex items-center gap-3 text-sm flex-wrap">
                        <span className="text-muted-foreground">Plan: <span className="font-medium text-foreground">{device.plan_name}</span></span>
                        <span className="font-bold text-primary">₹{Number(device.plan_price || 0).toLocaleString('en-IN')}</span>
                        {getPaymentBadge(device)}
                        {device.upi_transaction_id && (
                          <span className="text-xs bg-muted px-2 py-0.5 rounded font-mono">TXN: {device.upi_transaction_id}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Submitted: {new Date(device.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {filter === 'pending' && (
                      <Button onClick={() => openApprovalDialog(device)} size="sm">
                        <Eye size={14} className="mr-1" /> Review
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Approval Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-primary" />
              Review Subscription
            </DialogTitle>
            <DialogDescription>Complete all checklist items before approving</DialogDescription>
          </DialogHeader>

          {selectedDevice && (
            <div className="space-y-4">
              {/* Device details */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
                <p><span className="text-muted-foreground">Customer:</span> <strong>{selectedDevice.customer_name}</strong></p>
                <p><span className="text-muted-foreground">Email:</span> {selectedDevice.customer_email}</p>
                <p><span className="text-muted-foreground">WhatsApp:</span> {selectedDevice.whatsapp_number}</p>
                <p><span className="text-muted-foreground">Product:</span> {selectedDevice.product_name}</p>
                <p><span className="text-muted-foreground">Serial:</span> {selectedDevice.serial_number}</p>
                {selectedDevice.imei_number && <p><span className="text-muted-foreground">IMEI:</span> {selectedDevice.imei_number}</p>}
                <p><span className="text-muted-foreground">Plan:</span> {selectedDevice.plan_name} — ₹{Number(selectedDevice.plan_price || 0).toLocaleString('en-IN')}</p>
                <p><span className="text-muted-foreground">Address:</span> {selectedDevice.address}</p>
                <div className="border-t border-border pt-2 mt-2">
                  <p className="flex items-center gap-2">
                    <span className="text-muted-foreground">Payment:</span>
                    {getPaymentBadge(selectedDevice)}
                    {selectedDevice.upi_transaction_id && (
                      <span className="font-mono text-xs bg-background border border-border px-2 py-0.5 rounded">
                        TXN: {selectedDevice.upi_transaction_id}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Checklist */}
              {checklistItems.length > 0 ? (
                <div className="space-y-3">
                  <p className="font-semibold text-sm">Approval Checklist</p>
                  {checklistItems.map(item => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        checkedItems.has(item.id) ? 'border-primary/40 bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => toggleCheck(item.id)}
                    >
                      <Checkbox
                        checked={checkedItems.has(item.id)}
                        onCheckedChange={() => toggleCheck(item.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                  {!allChecked && (
                    <p className="text-xs text-destructive">Complete all checklist items to enable approval</p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  No checklist items configured. Go to Approval Checklist settings to add items.
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={handleReject} disabled={processing}>
              <XCircle size={14} className="mr-1" /> Reject
            </Button>
            <Button onClick={handleApprove} disabled={processing || (checklistItems.length > 0 && !allChecked)}>
              {processing && <Loader2 size={14} className="animate-spin mr-1" />}
              <CheckCircle2 size={14} className="mr-1" /> Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDeviceApprovals;
