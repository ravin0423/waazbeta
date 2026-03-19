import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import {
  Loader2, Smartphone, Shield, Clock, Check, X, FileText,
  AlertTriangle, RefreshCw, ChevronRight, Calendar, Wrench
} from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { cn } from '@/lib/utils';
import RenewalModal from '@/components/RenewalModal';

const getSubStatus = (device: any) => {
  if (!device.subscription_end) return { label: device.status, variant: 'default' as const, daysLeft: null };
  const daysLeft = differenceInDays(new Date(device.subscription_end), new Date());
  if (daysLeft < 0) return { label: 'Expired', variant: 'expired' as const, daysLeft };
  if (daysLeft <= 30) return { label: `Expires in ${daysLeft}d`, variant: 'expiring' as const, daysLeft };
  return { label: `Active • ${daysLeft}d left`, variant: 'active' as const, daysLeft };
};

const CustomerDevices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Detail sheet
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Renewal
  const [renewalDevice, setRenewalDevice] = useState<any>(null);

  const fetchDevices = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('customer_devices')
      .select('*, gadget_categories(name), subscription_plans(id, name, code, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setDevices(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  // Real-time
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('customer-devices-page-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customer_devices', filter: `user_id=eq.${user.id}` }, () => fetchDevices())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, fetchDevices]);

  const openDetail = async (device: any) => {
    setSelectedDevice(device);
    setLoadingDetail(true);
    const { data } = await supabase
      .from('service_claims')
      .select('id, issue_type, status, created_at, description')
      .eq('device_id', device.id)
      .order('created_at', { ascending: false });
    setClaims(data || []);
    setLoadingDetail(false);
  };

  const activeDevices = devices.filter(d => d.status === 'active');
  const pendingDevices = devices.filter(d => d.status === 'pending');
  const otherDevices = devices.filter(d => d.status !== 'active' && d.status !== 'pending');

  const claimStatusColor = (status: string) => {
    if (['resolved', 'completed'].includes(status)) return 'bg-emerald-600 text-white';
    if (['pending', 'submitted'].includes(status)) return 'border-amber-500 text-amber-600';
    if (['rejected', 'declined'].includes(status)) return 'bg-destructive text-destructive-foreground';
    return 'bg-primary text-primary-foreground';
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold mb-1">My Devices</h1>
            <p className="text-muted-foreground">Manage your registered devices and coverage</p>
          </div>
          <Button onClick={() => navigate('/customer/register-device')} className="gap-2">
            <Smartphone size={16} /> Register Device
          </Button>
        </div>

        {loading ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={24} /></CardContent></Card>
        ) : devices.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Smartphone size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No devices registered yet.</p>
              <Button onClick={() => navigate('/customer/register-device')}>Register Your First Device</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="shadow-card border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Active Devices</p>
                  <p className="text-2xl font-heading font-bold text-emerald-600">{activeDevices.length}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                  <p className="text-2xl font-heading font-bold text-amber-600">{pendingDevices.length}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Devices</p>
                  <p className="text-2xl font-heading font-bold">{devices.length}</p>
                </CardContent>
              </Card>
            </div>

            {/* Device List */}
            <div className="space-y-3">
              {devices.map(device => {
                const sub = getSubStatus(device);
                const plan = device.subscription_plans;
                return (
                  <Card
                    key={device.id}
                    className="shadow-card cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openDetail(device)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Smartphone size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold truncate">{device.product_name}</p>
                            <Badge variant="outline" className={cn(
                              "text-xs shrink-0",
                              sub.variant === 'active' && 'border-emerald-500 text-emerald-600',
                              sub.variant === 'expiring' && 'border-amber-500 text-amber-600',
                              sub.variant === 'expired' && 'border-destructive text-destructive',
                              sub.variant === 'default' && device.status === 'pending' && 'border-amber-500 text-amber-600',
                              sub.variant === 'default' && device.status === 'rejected' && 'border-destructive text-destructive',
                            )}>
                              {device.status === 'pending' ? 'Pending' : device.status === 'rejected' ? 'Rejected' : sub.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            {plan && <span>{plan.name}</span>}
                            <span>Serial: {device.serial_number}</span>
                            {device.imei_number && <span>IMEI: {device.imei_number}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {device.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); navigate('/customer/claims'); }}
                            >
                              <FileText size={14} className="mr-1" /> File Claim
                            </Button>
                          )}
                          <ChevronRight size={16} className="text-muted-foreground" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </motion.div>

      {/* Device Detail Sheet */}
      <Sheet open={!!selectedDevice} onOpenChange={(open) => { if (!open) setSelectedDevice(null); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{selectedDevice?.product_name}</SheetTitle>
            <SheetDescription>{selectedDevice?.gadget_categories?.name || 'Device Details'}</SheetDescription>
          </SheetHeader>

          {selectedDevice && (
            <div className="space-y-5 mt-5">
              {/* Device Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Smartphone size={16} /> Device Information</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Product</p>
                    <p className="font-medium">{selectedDevice.product_name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Serial Number</p>
                    <p className="font-medium">{selectedDevice.serial_number}</p>
                  </div>
                  {selectedDevice.imei_number && (
                    <div>
                      <p className="text-muted-foreground">IMEI</p>
                      <p className="font-medium">{selectedDevice.imei_number}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Registered</p>
                    <p className="font-medium">{format(new Date(selectedDevice.created_at), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <Badge variant="outline" className={cn(
                      selectedDevice.status === 'active' && 'border-emerald-500 text-emerald-600',
                      selectedDevice.status === 'pending' && 'border-amber-500 text-amber-600',
                      selectedDevice.status === 'rejected' && 'border-destructive text-destructive',
                    )}>{selectedDevice.status}</Badge>
                  </div>
                  <div>
                    <p className="text-muted-foreground">WhatsApp</p>
                    <p className="font-medium">{selectedDevice.whatsapp_number}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Coverage Details */}
              {selectedDevice.subscription_plans && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Shield size={16} /> Coverage Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium">{selectedDevice.subscription_plans.name}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Annual Price</span>
                      <span className="font-medium">₹{Number(selectedDevice.subscription_plans.annual_price).toLocaleString('en-IN')}</span>
                    </div>
                    {selectedDevice.subscription_start && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Coverage Start</span>
                        <span className="font-medium">{format(new Date(selectedDevice.subscription_start), 'dd MMM yyyy')}</span>
                      </div>
                    )}
                    {selectedDevice.subscription_end && (() => {
                      const sub = getSubStatus(selectedDevice);
                      const totalDays = selectedDevice.subscription_start
                        ? differenceInDays(new Date(selectedDevice.subscription_end), new Date(selectedDevice.subscription_start))
                        : 365;
                      const elapsed = selectedDevice.subscription_start
                        ? differenceInDays(new Date(), new Date(selectedDevice.subscription_start))
                        : 0;
                      const pct = Math.max(0, Math.min(100, (elapsed / totalDays) * 100));
                      return (
                        <>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Coverage End</span>
                            <span className={cn("font-medium", sub.variant === 'expired' && 'text-destructive', sub.variant === 'expiring' && 'text-amber-600')}>
                              {format(new Date(selectedDevice.subscription_end), 'dd MMM yyyy')}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                              <span>Coverage Used</span>
                              <span>{sub.daysLeft !== null && sub.daysLeft >= 0 ? `${sub.daysLeft} days remaining` : 'Expired'}</span>
                            </div>
                            <Progress value={pct} className="h-2" />
                          </div>
                        </>
                      );
                    })()}
                    {selectedDevice.auto_renew && (
                      <p className="flex items-center gap-1 text-xs text-emerald-600"><RefreshCw size={12} /> Auto-renew enabled</p>
                    )}

                    {/* Coverage Breakdown */}
                    <div className="pt-2">
                      <p className="text-xs font-medium text-muted-foreground mb-2">What's Covered</p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Hardware Failure', v: selectedDevice.subscription_plans.covers_hardware_failure },
                          { label: 'Battery Issues', v: selectedDevice.subscription_plans.covers_battery },
                          { label: 'Motherboard', v: selectedDevice.subscription_plans.covers_motherboard },
                          { label: 'Accidental Damage', v: selectedDevice.subscription_plans.covers_accidental_damage },
                          { label: 'Liquid Damage', v: selectedDevice.subscription_plans.covers_liquid_damage },
                        ].map(f => (
                          <span key={f.label} className={cn("inline-flex items-center gap-1 text-xs px-2 py-1 rounded",
                            f.v ? 'bg-emerald-50 text-emerald-700' : 'bg-muted text-muted-foreground')}>
                            {f.v ? <Check size={12} /> : <X size={12} />} {f.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Claim History */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2"><Wrench size={16} /> Claim History</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingDetail ? (
                    <div className="py-6 text-center"><Loader2 size={20} className="animate-spin text-primary mx-auto" /></div>
                  ) : claims.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No claims filed for this device</p>
                  ) : (
                    <div className="space-y-2">
                      {claims.map(claim => (
                        <div
                          key={claim.id}
                          className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/customer/claims/${claim.id}`)}
                        >
                          <div>
                            <p className="text-sm font-medium">{claim.issue_type}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(claim.created_at), 'dd MMM yyyy')}</p>
                          </div>
                          <Badge variant="outline" className={claimStatusColor(claim.status)}>{claim.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="space-y-2">
                {selectedDevice.status === 'active' && (
                  <>
                    <Button className="w-full gap-2" onClick={() => { setSelectedDevice(null); navigate('/customer/claims'); }}>
                      <FileText size={16} /> File a Claim
                    </Button>
                    <Button variant="outline" className="w-full gap-2" onClick={() => { setSelectedDevice(null); setRenewalDevice(selectedDevice); }}>
                      <RefreshCw size={16} /> Renew / Upgrade Plan
                    </Button>
                  </>
                )}
                {selectedDevice.status === 'rejected' && (
                  <Button className="w-full gap-2" onClick={() => { setSelectedDevice(null); navigate('/customer/register-device'); }}>
                    <Smartphone size={16} /> Resubmit Device
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {renewalDevice && (
        <RenewalModal
          open={!!renewalDevice}
          onOpenChange={(open) => { if (!open) setRenewalDevice(null); }}
          device={renewalDevice}
          onRenewed={fetchDevices}
        />
      )}
    </DashboardLayout>
  );
};

export default CustomerDevices;
