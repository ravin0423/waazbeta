import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2, ShieldCheck, Clock, CheckCircle2, XCircle, QrCode, Banknote, Eye,
  AlertTriangle, TrendingUp, Download, RefreshCw, Search,
  Mail, MessageSquare, Image, ChevronLeft, ChevronRight,
  Info, ExternalLink, User, Shield, ListChecks
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, differenceInDays, subDays, subHours } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface EnrichedDevice {
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
  updated_at: string;
  user_id: string;
  approved_at: string | null;
  approved_by: string | null;
  rejected_at: string | null;
  rejected_by: string | null;
  rejection_reason: string | null;
  gadget_category_id: string | null;
  subscription_plan_id: string | null;
  google_location_pin: string | null;
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  customer_joined: string;
  plan_name: string;
  plan_price: number;
  plan_code: string;
  category_name: string;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string | null;
}

const REJECTION_REASONS = [
  'Unclear device photos',
  'Suspicious purchase date',
  'Device not supported',
  'Duplicate registration',
  'Fraud suspected',
  'Missing required documents',
  'Device too old (>3 years)',
  'Other',
];

const INFO_REQUEST_OPTIONS = [
  'Clearer device photo',
  'Receipt/purchase proof',
  'Serial number verification',
  'Warranty documents',
  'IMEI number',
  'Other',
];

const PAGE_SIZE = 20;

const AdminDeviceApprovals = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<EnrichedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  // Stats
  const [pendingCount, setPendingCount] = useState(0);
  const [approvedTodayCount, setApprovedTodayCount] = useState(0);
  const [rejectedTodayCount, setRejectedTodayCount] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);

  // Detail drawer
  const [selectedDevice, setSelectedDevice] = useState<EnrichedDevice | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectMessage, setRejectMessage] = useState('');

  // Info request dialog
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [infoNeeded, setInfoNeeded] = useState<Set<string>>(new Set());
  const [infoMessage, setInfoMessage] = useState('');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkApproveOpen, setBulkApproveOpen] = useState(false);
  const [bulkRejectOpen, setBulkRejectOpen] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Device photos
  const [devicePhotos, setDevicePhotos] = useState<string[]>([]);
  const [photoViewerOpen, setPhotoViewerOpen] = useState(false);
  const [photoViewerUrl, setPhotoViewerUrl] = useState('');

  const fetchStats = useCallback(async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [pending, approvedToday, rejectedToday, total] = await Promise.all([
      supabase.from('customer_devices').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('customer_devices').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('approved_at', todayISO),
      supabase.from('customer_devices').select('id', { count: 'exact', head: true }).eq('status', 'rejected').gte('rejected_at', todayISO),
      supabase.from('customer_devices').select('id', { count: 'exact', head: true }).in('status', ['active', 'rejected']),
    ]);

    setPendingCount(pending.count || 0);
    setApprovedTodayCount(approvedToday.count || 0);
    setRejectedTodayCount(rejectedToday.count || 0);
    setTotalProcessed(total.count || 0);
  }, []);

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('customer_devices')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filter === 'pending') query = query.eq('status', 'pending');
    else if (filter === 'active') query = query.eq('status', 'active');
    else if (filter === 'rejected') query = query.eq('status', 'rejected');

    const { data: devicesData, count } = await query;
    if (!devicesData) { setDevices([]); setLoading(false); return; }

    setTotalCount(count || 0);

    const userIds = [...new Set(devicesData.map(d => d.user_id))];
    const planIds = [...new Set(devicesData.map(d => d.subscription_plan_id).filter(Boolean))] as string[];
    const catIds = [...new Set(devicesData.map(d => d.gadget_category_id).filter(Boolean))] as string[];

    const [profilesRes, plansRes, catsRes] = await Promise.all([
      userIds.length > 0 ? supabase.from('profiles').select('id, full_name, email, phone, created_at').in('id', userIds) : Promise.resolve({ data: [] }),
      planIds.length > 0 ? supabase.from('subscription_plans').select('id, name, annual_price, code').in('id', planIds) : Promise.resolve({ data: [] }),
      catIds.length > 0 ? supabase.from('gadget_categories').select('id, name').in('id', catIds) : Promise.resolve({ data: [] }),
    ]);

    const profiles = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
    const plans = new Map((plansRes.data || []).map((p: any) => [p.id, p]));
    const cats = new Map((catsRes.data || []).map((c: any) => [c.id, c]));

    const enriched: EnrichedDevice[] = devicesData.map(d => {
      const profile = profiles.get(d.user_id);
      const plan = plans.get(d.subscription_plan_id || '');
      const cat = cats.get(d.gadget_category_id || '');
      return {
        ...d,
        customer_email: profile?.email || '',
        customer_name: profile?.full_name || 'Unknown',
        customer_phone: profile?.phone || null,
        customer_joined: profile?.created_at || d.created_at,
        plan_name: plan?.name || '—',
        plan_price: plan?.annual_price || 0,
        plan_code: plan?.code || '',
        category_name: cat?.name || d.product_name,
      } as EnrichedDevice;
    });

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const filtered = enriched.filter(d =>
        d.customer_name.toLowerCase().includes(q) ||
        d.customer_email.toLowerCase().includes(q) ||
        d.product_name.toLowerCase().includes(q) ||
        d.serial_number.toLowerCase().includes(q) ||
        (d.imei_number || '').toLowerCase().includes(q)
      );
      setDevices(filtered);
    } else {
      setDevices(enriched);
    }
    setLoading(false);
  }, [filter, page, searchQuery]);

  const fetchChecklist = async () => {
    const { data } = await supabase
      .from('approval_checklist_items')
      .select('id, label, description')
      .eq('is_active', true)
      .order('display_order');
    setChecklistItems((data as ChecklistItem[]) || []);
  };

  const fetchDevicePhotos = async (deviceId: string) => {
    const { data } = await supabase.storage.from('device-proofs').list(deviceId);
    if (data && data.length > 0) {
      const urls = data.map(f => {
        const { data: urlData } = supabase.storage.from('device-proofs').getPublicUrl(`${deviceId}/${f.name}`);
        return urlData.publicUrl;
      });
      setDevicePhotos(urls);
    } else {
      setDevicePhotos([]);
    }
  };

  useEffect(() => { fetchDevices(); fetchStats(); }, [fetchDevices, fetchStats]);
  useEffect(() => { fetchChecklist(); }, []);

  // Realtime subscription for new devices
  useEffect(() => {
    const channel = supabase
      .channel('device-approvals-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customer_devices' }, () => {
        fetchDevices();
        fetchStats();
        toast.info('New device submitted for review');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customer_devices' }, () => {
        fetchDevices();
        fetchStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDevices, fetchStats]);

  const openDetailDrawer = async (device: EnrichedDevice) => {
    setSelectedDevice(device);
    setCheckedItems(new Set());
    setDrawerOpen(true);
    await fetchDevicePhotos(device.id);
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allChecked = checklistItems.length > 0 && checkedItems.size === checklistItems.length;

  const createAuditLog = async (deviceId: string, action: string, reason?: string, notes?: string) => {
    await supabase.from('device_approval_logs').insert({
      device_id: deviceId,
      action,
      admin_id: user?.id,
      reason: reason || null,
      notes: notes || null,
    } as any);
  };

  const createNotification = async (userId: string, type: string, title: string, message: string, relatedId?: string) => {
    await supabase.from('notifications').insert({
      user_id: userId,
      type,
      title,
      message,
      related_id: relatedId || null,
    } as any);
  };

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
      await supabase.from('device_approval_checks').insert(checksToInsert as any);
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const { error } = await supabase
      .from('customer_devices')
      .update({
        status: 'active',
        payment_status: 'confirmed',
        approved_by: user.id,
        approved_at: now.toISOString(),
        subscription_start: now.toISOString().split('T')[0],
        subscription_end: endDate.toISOString().split('T')[0],
      } as any)
      .eq('id', selectedDevice.id);

    if (!error) {
      await Promise.all([
        createAuditLog(selectedDevice.id, 'approved', undefined, `Approved by admin`),
        createNotification(
          selectedDevice.user_id,
          'device_approved',
          'Device Approved! 🎉',
          `Your device ${selectedDevice.product_name} has been approved. You can now file claims.`,
          selectedDevice.id
        ),
      ]);
      toast.success(`Device approved for ${selectedDevice.customer_name}`);
    } else {
      toast.error('Failed to approve device');
    }

    setProcessing(false);
    setDrawerOpen(false);
    fetchDevices();
    fetchStats();
  };

  const handleReject = async () => {
    if (!selectedDevice || !user || !rejectReason) return;
    setProcessing(true);

    const fullReason = rejectReason === 'Other' ? rejectMessage : rejectReason;
    const message = rejectMessage || `Your device was rejected for: ${fullReason}. Please fix the issue and resubmit.`;

    const { error } = await supabase
      .from('customer_devices')
      .update({
        status: 'rejected',
        payment_status: 'rejected',
        rejection_reason: fullReason,
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
      } as any)
      .eq('id', selectedDevice.id);

    if (!error) {
      await Promise.all([
        createAuditLog(selectedDevice.id, 'rejected', fullReason, message),
        createNotification(
          selectedDevice.user_id,
          'device_rejected',
          'Device Rejected',
          message,
          selectedDevice.id
        ),
      ]);
      toast.success('Device rejected');
    } else {
      toast.error('Failed to reject device');
    }

    setProcessing(false);
    setRejectDialogOpen(false);
    setDrawerOpen(false);
    setRejectReason('');
    setRejectMessage('');
    fetchDevices();
    fetchStats();
  };

  const handleRequestInfo = async () => {
    if (!selectedDevice || !user || infoNeeded.size === 0) return;
    setProcessing(true);

    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 48);

    await supabase.from('device_info_requests').insert({
      device_id: selectedDevice.id,
      info_needed: Array.from(infoNeeded),
      message: infoMessage || 'Please provide the requested information within 48 hours.',
      requested_by: user.id,
      deadline: deadline.toISOString(),
      status: 'pending',
    } as any);

    await Promise.all([
      createAuditLog(selectedDevice.id, 'info_requested', undefined, `Info requested: ${Array.from(infoNeeded).join(', ')}`),
      createNotification(
        selectedDevice.user_id,
        'info_requested',
        'Additional Information Needed',
        infoMessage || `We need additional information for your device ${selectedDevice.product_name}: ${Array.from(infoNeeded).join(', ')}. Please provide within 48 hours.`,
        selectedDevice.id
      ),
    ]);

    toast.success('Information request sent');
    setProcessing(false);
    setInfoDialogOpen(false);
    setInfoNeeded(new Set());
    setInfoMessage('');
  };

  // Bulk operations
  const toggleSelectAll = () => {
    if (selectedIds.size === devices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(devices.map(d => d.id)));
    }
  };

  const toggleSelectDevice = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkApprove = async () => {
    if (!user) return;
    setBulkProcessing(true);

    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const ids = Array.from(selectedIds);
    const selectedDevices = devices.filter(d => selectedIds.has(d.id));

    const { error } = await supabase
      .from('customer_devices')
      .update({
        status: 'active',
        payment_status: 'confirmed',
        approved_by: user.id,
        approved_at: now.toISOString(),
        subscription_start: now.toISOString().split('T')[0],
        subscription_end: endDate.toISOString().split('T')[0],
      } as any)
      .in('id', ids);

    if (!error) {
      // Create logs and notifications for each
      await Promise.all(selectedDevices.flatMap(d => [
        createAuditLog(d.id, 'approved', undefined, 'Bulk approved by admin'),
        createNotification(d.user_id, 'device_approved', 'Device Approved! 🎉', `Your device ${d.product_name} has been approved.`, d.id),
      ]));
      toast.success(`${ids.length} devices approved`);
    } else {
      toast.error('Bulk approve failed');
    }

    setBulkProcessing(false);
    setBulkApproveOpen(false);
    setSelectedIds(new Set());
    fetchDevices();
    fetchStats();
  };

  const handleBulkReject = async () => {
    if (!user || !bulkRejectReason) return;
    setBulkProcessing(true);

    const ids = Array.from(selectedIds);
    const selectedDevices = devices.filter(d => selectedIds.has(d.id));

    const { error } = await supabase
      .from('customer_devices')
      .update({
        status: 'rejected',
        payment_status: 'rejected',
        rejection_reason: bulkRejectReason,
        rejected_at: new Date().toISOString(),
        rejected_by: user.id,
      } as any)
      .in('id', ids);

    if (!error) {
      await Promise.all(selectedDevices.flatMap(d => [
        createAuditLog(d.id, 'rejected', bulkRejectReason, 'Bulk rejected'),
        createNotification(d.user_id, 'device_rejected', 'Device Rejected', `Your device ${d.product_name} was rejected: ${bulkRejectReason}`, d.id),
      ]));
      toast.success(`${ids.length} devices rejected`);
    } else {
      toast.error('Bulk reject failed');
    }

    setBulkProcessing(false);
    setBulkRejectOpen(false);
    setBulkRejectReason('');
    setSelectedIds(new Set());
    fetchDevices();
    fetchStats();
  };

  const handleExportCSV = () => {
    const headers = ['Customer', 'Email', 'Device', 'Serial', 'IMEI', 'Plan', 'Price', 'Status', 'Submitted'];
    const rows = devices.map(d => [
      d.customer_name, d.customer_email, d.product_name, d.serial_number,
      d.imei_number || '', d.plan_name, d.plan_price, d.status,
      format(new Date(d.created_at), 'dd/MM/yyyy HH:mm'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `device-queue-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getRiskScore = (device: EnrichedDevice) => {
    let score = 0;
    const daysSinceCreated = differenceInDays(new Date(), new Date(device.created_at));
    const customerAge = differenceInDays(new Date(), new Date(device.customer_joined));

    if (!device.imei_number) score += 15;
    if (customerAge < 7) score += 20;
    if (!device.upi_transaction_id && device.payment_method === 'cash') score += 10;
    if (daysSinceCreated < 1) score += 5;

    return Math.min(score, 100);
  };

  const getRiskBadge = (score: number) => {
    if (score <= 30) return <Badge className="bg-success/10 text-success border-success/20">Low Risk</Badge>;
    if (score <= 60) return <Badge className="bg-warning/10 text-warning border-warning/20">Medium Risk</Badge>;
    return <Badge className="bg-destructive/10 text-destructive border-destructive/20">High Risk</Badge>;
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <ShieldCheck size={24} className="text-primary" />
              Device Approval Queue
            </h1>
            <p className="text-muted-foreground text-sm">Review, approve, or reject customer device registrations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
              <Download size={14} /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => { fetchDevices(); fetchStats(); }} className="gap-1.5">
              <RefreshCw size={14} /> Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={cn("cursor-pointer transition-shadow hover:shadow-md", filter === 'pending' && "ring-2 ring-warning")} onClick={() => { setFilter('pending'); setPage(0); }}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Pending</p>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                </div>
                <motion.div animate={{ scale: pendingCount > 0 ? [1, 1.1, 1] : 1 }} transition={{ repeat: pendingCount > 0 ? Infinity : 0, duration: 2 }}>
                  <Clock size={28} className="text-warning" />
                </motion.div>
              </div>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer transition-shadow hover:shadow-md", filter === 'active' && "ring-2 ring-success")} onClick={() => { setFilter('active'); setPage(0); }}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Approved Today</p>
                  <p className="text-2xl font-bold">{approvedTodayCount}</p>
                </div>
                <CheckCircle2 size={28} className="text-success" />
              </div>
            </CardContent>
          </Card>
          <Card className={cn("cursor-pointer transition-shadow hover:shadow-md", filter === 'rejected' && "ring-2 ring-destructive")} onClick={() => { setFilter('rejected'); setPage(0); }}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Rejected Today</p>
                  <p className="text-2xl font-bold">{rejectedTodayCount}</p>
                </div>
                <XCircle size={28} className="text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => { setFilter('all'); setPage(0); }}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Processed</p>
                  <p className="text-2xl font-bold">{totalProcessed}</p>
                </div>
                <TrendingUp size={28} className="text-info" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, serial, IMEI..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
              className="pl-9 h-9"
            />
          </div>
          <Select value={filter} onValueChange={v => { setFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions Toolbar */}
        <AnimatePresence>
          {selectedIds.size > 0 && filter === 'pending' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border"
            >
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground gap-1" onClick={() => setBulkApproveOpen(true)}>
                <CheckCircle2 size={14} /> Bulk Approve
              </Button>
              <Button size="sm" variant="destructive" className="gap-1" onClick={() => setBulkRejectOpen(true)}>
                <XCircle size={14} /> Bulk Reject
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Devices Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : devices.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShieldCheck size={48} className="mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No {filter === 'all' ? '' : filter} devices found.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {filter === 'pending' && (
                      <TableHead className="w-10">
                        <Checkbox
                          checked={selectedIds.size === devices.length && devices.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                    )}
                    <TableHead>Device</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden lg:table-cell">Plan</TableHead>
                    <TableHead className="hidden md:table-cell">Payment</TableHead>
                    <TableHead className="hidden lg:table-cell">Risk</TableHead>
                    <TableHead className="hidden md:table-cell">Photos</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map(device => {
                    const risk = getRiskScore(device);
                    const daysAgo = differenceInDays(new Date(), new Date(device.created_at));

                    return (
                      <TableRow key={device.id} className="group">
                        {filter === 'pending' && (
                          <TableCell>
                            <Checkbox
                              checked={selectedIds.has(device.id)}
                              onCheckedChange={() => toggleSelectDevice(device.id)}
                            />
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="min-w-[140px]">
                            <p className="font-medium text-sm">{device.product_name}</p>
                            <p className="text-xs text-muted-foreground">SN: {device.serial_number}</p>
                            {device.imei_number && <p className="text-xs text-muted-foreground">IMEI: {device.imei_number}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-[120px]">
                            <p className="font-medium text-sm">{device.customer_name}</p>
                            <p className="text-xs text-muted-foreground">{device.customer_email}</p>
                            <p className="text-xs text-muted-foreground">{daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div>
                            <p className="text-sm font-medium">{device.plan_name}</p>
                            <p className="text-xs text-primary font-semibold">₹{Number(device.plan_price).toLocaleString('en-IN')}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {device.payment_method === 'upi' ? (
                            <Badge variant="outline" className="gap-1"><QrCode size={10} /> UPI</Badge>
                          ) : device.payment_method === 'cash' ? (
                            <Badge variant="outline" className="gap-1"><Banknote size={10} /> Cash</Badge>
                          ) : (
                            <Badge variant="secondary">—</Badge>
                          )}
                          {device.upi_transaction_id && (
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{device.upi_transaction_id}</p>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {getRiskBadge(risk)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Image size={10} /> View
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {device.status === 'pending' && <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>}
                          {device.status === 'active' && <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>}
                          {device.status === 'rejected' && <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => openDetailDrawer(device)}>
                              <Eye size={12} /> Details
                            </Button>
                            {device.status === 'pending' && (
                              <>
                                <Button size="sm" variant="destructive" className="h-8" onClick={() => {
                                  setSelectedDevice(device);
                                  setRejectDialogOpen(true);
                                }}>
                                  <XCircle size={12} />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}
                </p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft size={14} />
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Detail Drawer */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              Device Review
            </SheetTitle>
            <SheetDescription>Review device details and make a decision</SheetDescription>
          </SheetHeader>

          {selectedDevice && (
            <div className="mt-4 space-y-5">
              {/* Status */}
              <div className="flex items-center gap-2">
                {selectedDevice.status === 'pending' && <Badge className="bg-warning/10 text-warning">Pending Approval</Badge>}
                {selectedDevice.status === 'active' && <Badge className="bg-success/10 text-success">Approved</Badge>}
                {selectedDevice.status === 'rejected' && <Badge className="bg-destructive/10 text-destructive">Rejected</Badge>}
                {getRiskBadge(getRiskScore(selectedDevice))}
              </div>

              {/* Device Info */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Info size={14} /> Device Information</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Device:</span> <strong>{selectedDevice.product_name}</strong></p>
                  <p><span className="text-muted-foreground">Category:</span> {selectedDevice.category_name}</p>
                  <p><span className="text-muted-foreground">Serial:</span> <span className="font-mono">{selectedDevice.serial_number}</span></p>
                  {selectedDevice.imei_number && <p><span className="text-muted-foreground">IMEI:</span> <span className="font-mono">{selectedDevice.imei_number}</span></p>}
                  <p><span className="text-muted-foreground">Submitted:</span> {format(new Date(selectedDevice.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><User size={14} /> Customer Information</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> <strong>{selectedDevice.customer_name}</strong></p>
                  <p><span className="text-muted-foreground">Email:</span> {selectedDevice.customer_email}</p>
                  {selectedDevice.customer_phone && <p><span className="text-muted-foreground">Phone:</span> {selectedDevice.customer_phone}</p>}
                  <p><span className="text-muted-foreground">WhatsApp:</span> {selectedDevice.whatsapp_number}</p>
                  <p><span className="text-muted-foreground">Address:</span> {selectedDevice.address}</p>
                  <p><span className="text-muted-foreground">Customer Since:</span> {format(new Date(selectedDevice.customer_joined), 'dd MMM yyyy')} ({differenceInDays(new Date(), new Date(selectedDevice.customer_joined))} days)</p>
                  <div className="flex gap-2 pt-1">
                    <a href={`https://wa.me/${selectedDevice.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs"><MessageSquare size={10} /> WhatsApp</Button>
                    </a>
                    <a href={`mailto:${selectedDevice.customer_email}`}>
                      <Button variant="outline" size="sm" className="h-7 gap-1 text-xs"><Mail size={10} /> Email</Button>
                    </a>
                  </div>
                </div>
              </div>

              {/* Plan & Payment */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Shield size={14} /> Plan & Payment</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Plan:</span> <strong>{selectedDevice.plan_name}</strong> ({selectedDevice.plan_code})</p>
                  <p><span className="text-muted-foreground">Price:</span> <strong className="text-primary">₹{Number(selectedDevice.plan_price).toLocaleString('en-IN')}/yr</strong></p>
                  <p className="flex items-center gap-2">
                    <span className="text-muted-foreground">Payment:</span>
                    {selectedDevice.payment_method === 'upi' ? (
                      <Badge variant="outline" className="gap-1"><QrCode size={10} /> UPI</Badge>
                    ) : selectedDevice.payment_method === 'cash' ? (
                      <Badge variant="outline" className="gap-1"><Banknote size={10} /> Cash</Badge>
                    ) : '—'}
                  </p>
                  {selectedDevice.upi_transaction_id && (
                    <p><span className="text-muted-foreground">Transaction ID:</span> <span className="font-mono text-xs bg-background border border-border px-2 py-0.5 rounded">{selectedDevice.upi_transaction_id}</span></p>
                  )}
                </div>
              </div>

              {/* Device Photos */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Image size={14} /> Documents & Photos</h4>
                {devicePhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {devicePhotos.map((url, i) => (
                      <div key={i} className="relative cursor-pointer rounded-lg overflow-hidden border border-border aspect-square" onClick={() => { setPhotoViewerUrl(url); setPhotoViewerOpen(true); }}>
                        <img src={url} alt={`Device photo ${i + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-foreground/0 hover:bg-foreground/10 transition-colors flex items-center justify-center">
                          <ExternalLink size={16} className="text-background opacity-0 group-hover:opacity-100" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Image size={24} className="mx-auto text-muted-foreground/40 mb-1" />
                    <p className="text-xs text-muted-foreground">No photos uploaded</p>
                  </div>
                )}
              </div>

              {/* Approval Checklist */}
              {selectedDevice.status === 'pending' && checklistItems.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><ListCheck size={14} /> Verification Checklist</h4>
                  <div className="space-y-2">
                    {checklistItems.map(item => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm",
                          checkedItems.has(item.id) ? "border-primary/40 bg-primary/5" : "border-border"
                        )}
                        onClick={() => toggleCheck(item.id)}
                      >
                        <Checkbox checked={checkedItems.has(item.id)} className="mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{item.label}</p>
                          {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                        </div>
                      </div>
                    ))}
                    {!allChecked && <p className="text-xs text-destructive">Complete all items to enable approval</p>}
                  </div>
                </div>
              )}

              {/* Approved Info */}
              {selectedDevice.status === 'active' && selectedDevice.approved_at && (
                <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-success flex items-center gap-1.5"><CheckCircle2 size={14} /> Approved</p>
                  <p className="text-xs text-muted-foreground mt-1">on {format(new Date(selectedDevice.approved_at), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
              )}

              {/* Rejected Info */}
              {selectedDevice.status === 'rejected' && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-destructive flex items-center gap-1.5"><XCircle size={14} /> Rejected</p>
                  {selectedDevice.rejection_reason && <p className="text-xs mt-1"><span className="text-muted-foreground">Reason:</span> {selectedDevice.rejection_reason}</p>}
                  {selectedDevice.rejected_at && <p className="text-xs text-muted-foreground mt-1">on {format(new Date(selectedDevice.rejected_at), 'dd MMM yyyy, hh:mm a')}</p>}
                </div>
              )}

              <Separator />

              {/* Action Buttons */}
              {selectedDevice.status === 'pending' && (
                <div className="space-y-3">
                  <Button
                    className="w-full bg-success hover:bg-success/90 text-success-foreground gap-2"
                    onClick={handleApprove}
                    disabled={processing || (checklistItems.length > 0 && !allChecked)}
                  >
                    {processing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Approve Device
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={() => setRejectDialogOpen(true)}
                    disabled={processing}
                  >
                    <XCircle size={14} /> Reject Device
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 border-warning text-warning hover:bg-warning/10"
                    onClick={() => setInfoDialogOpen(true)}
                    disabled={processing}
                  >
                    <AlertTriangle size={14} /> Request More Info
                  </Button>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Photo Viewer */}
      <Dialog open={photoViewerOpen} onOpenChange={setPhotoViewerOpen}>
        <DialogContent className="max-w-2xl p-2">
          <img src={photoViewerUrl} alt="Device photo" className="w-full h-auto rounded-lg" />
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><XCircle size={18} /> Reject Device</DialogTitle>
            <DialogDescription>Provide a reason for rejection. The customer will be notified.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={rejectReason} onValueChange={setRejectReason}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>
                {REJECTION_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Message to customer (explain what to fix and how to resubmit)..."
              value={rejectMessage}
              onChange={e => setRejectMessage(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || processing}>
              {processing && <Loader2 size={14} className="animate-spin mr-1" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Request Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning"><AlertTriangle size={18} /> Request Information</DialogTitle>
            <DialogDescription>Select what additional information is needed. Customer has 48 hours to respond.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {INFO_REQUEST_OPTIONS.map(opt => (
              <div key={opt} className="flex items-center gap-2.5">
                <Checkbox
                  checked={infoNeeded.has(opt)}
                  onCheckedChange={() => {
                    setInfoNeeded(prev => {
                      const next = new Set(prev);
                      next.has(opt) ? next.delete(opt) : next.add(opt);
                      return next;
                    });
                  }}
                />
                <span className="text-sm">{opt}</span>
              </div>
            ))}
            <Textarea
              placeholder="Custom message to customer..."
              value={infoMessage}
              onChange={e => setInfoMessage(e.target.value)}
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoDialogOpen(false)}>Cancel</Button>
            <Button className="bg-warning hover:bg-warning/90 text-warning-foreground" onClick={handleRequestInfo} disabled={infoNeeded.size === 0 || processing}>
              {processing && <Loader2 size={14} className="animate-spin mr-1" />}
              Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve Dialog */}
      <Dialog open={bulkApproveOpen} onOpenChange={setBulkApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Approve {selectedIds.size} Devices</DialogTitle>
            <DialogDescription>All selected devices will be approved and customers notified.</DialogDescription>
          </DialogHeader>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {devices.filter(d => selectedIds.has(d.id)).map(d => (
              <p key={d.id} className="text-sm">• {d.customer_name} — {d.product_name}</p>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkApproveOpen(false)}>Cancel</Button>
            <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={handleBulkApprove} disabled={bulkProcessing}>
              {bulkProcessing && <Loader2 size={14} className="animate-spin mr-1" />}
              Approve All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject Dialog */}
      <Dialog open={bulkRejectOpen} onOpenChange={setBulkRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Bulk Reject {selectedIds.size} Devices</DialogTitle>
            <DialogDescription>All selected devices will be rejected with the same reason.</DialogDescription>
          </DialogHeader>
          <Select value={bulkRejectReason} onValueChange={setBulkRejectReason}>
            <SelectTrigger><SelectValue placeholder="Select rejection reason" /></SelectTrigger>
            <SelectContent>
              {REJECTION_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkReject} disabled={!bulkRejectReason || bulkProcessing}>
              {bulkProcessing && <Loader2 size={14} className="animate-spin mr-1" />}
              Reject All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

// Quick approve without opening drawer (skips checklist for convenience)
const handleQuickApprove = async (device: EnrichedDevice) => {
  // This is handled inline in the component
};

// Missing icon import used in drawer
const User = ({ size, className }: { size: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);

const Shield = ({ size, className }: { size: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></svg>
);

const ListCheck = ({ size, className }: { size: number; className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M11 18H3"/><path d="m15 18 2 2 4-4"/><path d="M16 12H3"/><path d="M16 6H3"/></svg>
);

export default AdminDeviceApprovals;
