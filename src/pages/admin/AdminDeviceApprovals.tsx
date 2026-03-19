import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Loader2, ShieldCheck, Clock, CheckCircle2, XCircle, QrCode, Banknote, Eye,
  AlertTriangle, TrendingUp, Download, RefreshCw, Search, Copy,
  Mail, MessageSquare, Image, ChevronLeft, ChevronRight, ZoomIn,
  Info, ExternalLink, User, Shield, ListChecks, Flag, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
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
  customer_device_count: number;
  plan_name: string;
  plan_price: number;
  plan_code: string;
  category_name: string;
}

interface ChecklistItem { id: string; label: string; description: string | null; }
interface DuplicateMatch { id: string; product_name: string; serial_number: string; imei_number: string | null; status: string; user_id: string; customer_name: string; created_at: string; match_type: string; }

// --- Constants ---
const REJECTION_REASONS = [
  'Unclear device photos', 'Suspicious purchase date', 'Device not supported',
  'Duplicate registration', 'Fraud suspected', 'Missing required documents',
  'Device too old (>3 years)', 'Invalid serial number', 'Photo quality too low',
  'Device appears stolen', 'Other',
];
const INFO_REQUEST_OPTIONS = [
  'Clearer device photo', 'Receipt/purchase proof', 'Serial number verification',
  'Warranty documents', 'IMEI number', 'Other',
];
const PHOTO_QUALITY_CHECKS = [
  'Clear image quality', 'Device clearly visible', 'Serial number visible',
  'No watermark detected', 'Original photo (not screenshot)',
];
const PAGE_SIZE = 20;

// --- Helpers ---
const validateIMEI = (imei: string | null): { valid: boolean; message: string } => {
  if (!imei) return { valid: true, message: 'Not provided' };
  if (!/^\d{15}$/.test(imei)) return { valid: false, message: `Invalid format (${imei.length} digits, need 15)` };
  // Luhn check
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let d = parseInt(imei[i]);
    if (i % 2 !== 0) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
  }
  const check = (10 - (sum % 10)) % 10;
  if (check !== parseInt(imei[14])) return { valid: false, message: 'Invalid checksum (Luhn)' };
  return { valid: true, message: 'Valid IMEI format ✓' };
};

const maskValue = (val: string, showChars = 8) => {
  if (val.length <= showChars) return val;
  return val.slice(0, showChars) + '••••';
};

const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  toast.success('Copied to clipboard');
};

// --- Component ---
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

  // Duplicate detection
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [duplicatesLoading, setDuplicatesLoading] = useState(false);

  // Photo quality
  const [photoQualityChecks, setPhotoQualityChecks] = useState<Set<string>>(new Set());

  // Reject dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectMessage, setRejectMessage] = useState('');

  // Flag dialog
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flagReason, setFlagReason] = useState('');
  const [flagPriority, setFlagPriority] = useState('normal');

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

  // --- Data Fetching ---
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

    const [profilesRes, plansRes, catsRes, deviceCountsRes] = await Promise.all([
      userIds.length > 0 ? supabase.from('profiles').select('id, full_name, email, phone, created_at').in('id', userIds) : Promise.resolve({ data: [] }),
      planIds.length > 0 ? supabase.from('subscription_plans').select('id, name, annual_price, code').in('id', planIds) : Promise.resolve({ data: [] }),
      catIds.length > 0 ? supabase.from('gadget_categories').select('id, name').in('id', catIds) : Promise.resolve({ data: [] }),
      // Get device counts per user for risk assessment
      userIds.length > 0 ? supabase.from('customer_devices').select('user_id').in('user_id', userIds) : Promise.resolve({ data: [] }),
    ]);

    const profiles = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
    const plans = new Map((plansRes.data || []).map((p: any) => [p.id, p]));
    const cats = new Map((catsRes.data || []).map((c: any) => [c.id, c]));
    const deviceCounts = new Map<string, number>();
    (deviceCountsRes.data || []).forEach((d: any) => { deviceCounts.set(d.user_id, (deviceCounts.get(d.user_id) || 0) + 1); });

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
        customer_device_count: deviceCounts.get(d.user_id) || 1,
        plan_name: plan?.name || '—',
        plan_price: plan?.annual_price || 0,
        plan_code: plan?.code || '',
        category_name: cat?.name || d.product_name,
      } as EnrichedDevice;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      setDevices(enriched.filter(d =>
        d.customer_name.toLowerCase().includes(q) ||
        d.customer_email.toLowerCase().includes(q) ||
        d.product_name.toLowerCase().includes(q) ||
        d.serial_number.toLowerCase().includes(q) ||
        (d.imei_number || '').toLowerCase().includes(q)
      ));
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
      setDevicePhotos(data.map(f => {
        const { data: urlData } = supabase.storage.from('device-proofs').getPublicUrl(`${deviceId}/${f.name}`);
        return urlData.publicUrl;
      }));
    } else {
      setDevicePhotos([]);
    }
  };

  const fetchDuplicates = async (device: EnrichedDevice) => {
    setDuplicatesLoading(true);
    const matches: DuplicateMatch[] = [];

    // Check serial number duplicates
    const { data: serialMatches } = await supabase
      .from('customer_devices')
      .select('id, product_name, serial_number, imei_number, status, user_id, created_at')
      .eq('serial_number', device.serial_number)
      .neq('id', device.id);

    if (serialMatches) {
      const userIds = [...new Set(serialMatches.map(m => m.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
        : { data: [] };
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

      serialMatches.forEach(m => matches.push({
        ...m,
        customer_name: profileMap.get(m.user_id) || 'Unknown',
        match_type: 'Serial Number',
      } as DuplicateMatch));
    }

    // Check IMEI duplicates
    if (device.imei_number) {
      const { data: imeiMatches } = await supabase
        .from('customer_devices')
        .select('id, product_name, serial_number, imei_number, status, user_id, created_at')
        .eq('imei_number', device.imei_number)
        .neq('id', device.id);

      if (imeiMatches) {
        const existingIds = new Set(matches.map(m => m.id));
        const newMatches = imeiMatches.filter(m => !existingIds.has(m.id));
        if (newMatches.length > 0) {
          const userIds = [...new Set(newMatches.map(m => m.user_id))];
          const { data: profiles } = userIds.length > 0
            ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
            : { data: [] };
          const profileMap = new Map((profiles || []).map((p: any) => [p.id, p.full_name]));

          newMatches.forEach(m => matches.push({
            ...m,
            customer_name: profileMap.get(m.user_id) || 'Unknown',
            match_type: 'IMEI Number',
          } as DuplicateMatch));
        }
      }
    }

    setDuplicates(matches);
    setDuplicatesLoading(false);
  };

  useEffect(() => { fetchDevices(); fetchStats(); }, [fetchDevices, fetchStats]);
  useEffect(() => { fetchChecklist(); }, []);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('device-approvals-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customer_devices' }, () => {
        fetchDevices(); fetchStats();
        toast.info('New device submitted for review');
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customer_devices' }, () => {
        fetchDevices(); fetchStats();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchDevices, fetchStats]);

  // --- Drawer ---
  const openDetailDrawer = async (device: EnrichedDevice) => {
    setSelectedDevice(device);
    setCheckedItems(new Set());
    setPhotoQualityChecks(new Set());
    setDuplicates([]);
    setDrawerOpen(true);
    await Promise.all([fetchDevicePhotos(device.id), fetchDuplicates(device)]);
  };

  const toggleCheck = (id: string) => {
    setCheckedItems(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };
  const togglePhotoCheck = (label: string) => {
    setPhotoQualityChecks(prev => { const n = new Set(prev); n.has(label) ? n.delete(label) : n.add(label); return n; });
  };

  const allChecked = checklistItems.length > 0 && checkedItems.size === checklistItems.length;

  // --- Risk scoring ---
  const getRiskScore = (device: EnrichedDevice) => {
    let score = 0;
    const customerAge = differenceInDays(new Date(), new Date(device.customer_joined));

    if (!device.imei_number) score += 15;
    if (customerAge < 7) score += 20;
    if (customerAge < 1) score += 10;
    if (!device.upi_transaction_id && device.payment_method === 'cash') score += 10;
    if (device.customer_device_count > 3) score += 10;
    if (device.plan_price > 5000) score += 5;

    // IMEI validation
    if (device.imei_number) {
      const imeiCheck = validateIMEI(device.imei_number);
      if (!imeiCheck.valid) score += 25;
    }

    return Math.min(score, 100);
  };

  const getRiskBadge = (score: number) => {
    if (score <= 30) return <Badge className="bg-success/10 text-success border-success/20 text-[10px]">Low Risk</Badge>;
    if (score <= 60) return <Badge className="bg-warning/10 text-warning border-warning/20 text-[10px]">Medium</Badge>;
    return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">High Risk</Badge>;
  };

  const getRiskDetails = (device: EnrichedDevice) => {
    const factors: { label: string; risk: 'low' | 'medium' | 'high' }[] = [];
    const customerAge = differenceInDays(new Date(), new Date(device.customer_joined));

    factors.push({ label: `Account age: ${customerAge}d`, risk: customerAge < 7 ? 'high' : customerAge < 30 ? 'medium' : 'low' });
    factors.push({ label: `Devices registered: ${device.customer_device_count}`, risk: device.customer_device_count > 3 ? 'high' : 'low' });
    factors.push({ label: `IMEI: ${device.imei_number ? validateIMEI(device.imei_number).message : 'Not provided'}`, risk: !device.imei_number ? 'medium' : validateIMEI(device.imei_number).valid ? 'low' : 'high' });
    factors.push({ label: `Payment: ${device.payment_method || 'none'}`, risk: device.payment_method === 'cash' ? 'medium' : 'low' });

    return factors;
  };

  // --- Actions ---
  const createAuditLog = async (deviceId: string, action: string, reason?: string, notes?: string) => {
    await supabase.from('device_approval_logs').insert({ device_id: deviceId, action, admin_id: user?.id, reason: reason || null, notes: notes || null } as any);
  };

  const createNotification = async (userId: string, type: string, title: string, message: string, relatedId?: string) => {
    await supabase.from('notifications').insert({ user_id: userId, type, title, message, related_id: relatedId || null } as any);
  };

  const handleApprove = async () => {
    if (!selectedDevice || !user) return;
    setProcessing(true);

    const checksToInsert = checklistItems.map(item => ({
      device_id: selectedDevice.id, checklist_item_id: item.id,
      is_checked: checkedItems.has(item.id), checked_by: user.id, checked_at: new Date().toISOString(),
    }));
    if (checksToInsert.length > 0) await supabase.from('device_approval_checks').insert(checksToInsert as any);

    const now = new Date();
    const endDate = new Date(now);
    endDate.setFullYear(endDate.getFullYear() + 1);

    const { error, data } = await supabase.from('customer_devices').update({
      status: 'active',
      payment_status: 'confirmed',
      approved_by: user.id,
      approved_at: now.toISOString(),
      subscription_start: now.toISOString().split('T')[0],
      subscription_end: endDate.toISOString().split('T')[0],
    }).eq('id', selectedDevice.id).select();

    if (!error && data && data.length > 0) {
      await Promise.all([
        createAuditLog(selectedDevice.id, 'approved', undefined, 'Approved by admin'),
        createNotification(selectedDevice.user_id, 'device_approved', 'Device Approved! 🎉',
          `Your device ${selectedDevice.product_name} has been approved. You can now file claims.`, selectedDevice.id),
      ]);
      toast.success(`Device approved for ${selectedDevice.customer_name}`);
    } else {
      console.error('Approve failed:', error, 'Rows:', data?.length);
      toast.error(error?.message || 'Failed to approve device');
    }

    setProcessing(false); setDrawerOpen(false); fetchDevices(); fetchStats();
  };

  const handleReject = async () => {
    if (!selectedDevice || !user || !rejectReason) return;
    setProcessing(true);
    const fullReason = rejectReason === 'Other' ? rejectMessage : rejectReason;
    const message = rejectMessage || `Your device was rejected: ${fullReason}. Please fix the issue and resubmit.`;

    const { error, data, count } = await supabase.from('customer_devices').update({
      status: 'rejected',
      payment_status: 'rejected',
      rejection_reason: fullReason,
      rejected_at: new Date().toISOString(),
      rejected_by: user.id,
    }).eq('id', selectedDevice.id).select();

    console.log('Reject result:', { error, data, count, deviceId: selectedDevice.id });

    if (!error && data && data.length > 0) {
      await Promise.all([
        createAuditLog(selectedDevice.id, 'rejected', fullReason, message),
        createNotification(selectedDevice.user_id, 'device_rejected', 'Device Rejected', message, selectedDevice.id),
      ]);
      toast.success('Device rejected');
    } else {
      console.error('Reject failed:', error, 'Rows affected:', data?.length);
      toast.error(error?.message || 'Failed to reject device — no rows updated');
    }

    setProcessing(false); setRejectDialogOpen(false); setDrawerOpen(false);
    setRejectReason(''); setRejectMessage(''); fetchDevices(); fetchStats();
  };

  const handleFlag = async () => {
    if (!selectedDevice || !user) return;
    setProcessing(true);

    await Promise.all([
      createAuditLog(selectedDevice.id, 'flagged', flagReason, `Flagged for review (${flagPriority} priority)`),
      createNotification(selectedDevice.user_id, 'device_flagged', 'Device Under Review',
        `Your device ${selectedDevice.product_name} is under additional review. We'll update you soon.`, selectedDevice.id),
    ]);

    toast.success('Device flagged for review');
    setProcessing(false); setFlagDialogOpen(false); setDrawerOpen(false);
    setFlagReason(''); setFlagPriority('normal');
  };

  const handleRequestInfo = async () => {
    if (!selectedDevice || !user || infoNeeded.size === 0) return;
    setProcessing(true);
    const deadline = new Date(); deadline.setHours(deadline.getHours() + 48);

    await supabase.from('device_info_requests').insert({
      device_id: selectedDevice.id, info_needed: Array.from(infoNeeded),
      message: infoMessage || 'Please provide the requested information within 48 hours.',
      requested_by: user.id, deadline: deadline.toISOString(), status: 'pending',
    } as any);

    await Promise.all([
      createAuditLog(selectedDevice.id, 'info_requested', undefined, `Info: ${Array.from(infoNeeded).join(', ')}`),
      createNotification(selectedDevice.user_id, 'info_requested', 'Additional Information Needed',
        infoMessage || `We need more info for ${selectedDevice.product_name}: ${Array.from(infoNeeded).join(', ')}`, selectedDevice.id),
    ]);

    toast.success('Information request sent');
    setProcessing(false); setInfoDialogOpen(false); setInfoNeeded(new Set()); setInfoMessage('');
  };

  // Bulk
  const toggleSelectAll = () => setSelectedIds(prev => prev.size === devices.length ? new Set() : new Set(devices.map(d => d.id)));
  const toggleSelectDevice = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleBulkApprove = async () => {
    if (!user) return;
    setBulkProcessing(true);
    const now = new Date(); const endDate = new Date(now); endDate.setFullYear(endDate.getFullYear() + 1);
    const ids = Array.from(selectedIds);
    const sel = devices.filter(d => selectedIds.has(d.id));

    const { error } = await supabase.from('customer_devices').update({
      status: 'active', payment_status: 'confirmed', approved_by: user.id,
      approved_at: now.toISOString(), subscription_start: now.toISOString().split('T')[0],
      subscription_end: endDate.toISOString().split('T')[0],
    } as any).in('id', ids);

    if (!error) {
      await Promise.all(sel.flatMap(d => [
        createAuditLog(d.id, 'approved', undefined, 'Bulk approved'),
        createNotification(d.user_id, 'device_approved', 'Device Approved! 🎉', `Your device ${d.product_name} has been approved.`, d.id),
      ]));
      toast.success(`${ids.length} devices approved`);
    } else toast.error('Bulk approve failed');

    setBulkProcessing(false); setBulkApproveOpen(false); setSelectedIds(new Set()); fetchDevices(); fetchStats();
  };

  const handleBulkReject = async () => {
    if (!user || !bulkRejectReason) return;
    setBulkProcessing(true);
    const ids = Array.from(selectedIds);
    const sel = devices.filter(d => selectedIds.has(d.id));

    const { error } = await supabase.from('customer_devices').update({
      status: 'rejected', payment_status: 'rejected', rejection_reason: bulkRejectReason,
      rejected_at: new Date().toISOString(), rejected_by: user.id,
    } as any).in('id', ids);

    if (!error) {
      await Promise.all(sel.flatMap(d => [
        createAuditLog(d.id, 'rejected', bulkRejectReason, 'Bulk rejected'),
        createNotification(d.user_id, 'device_rejected', 'Device Rejected', `Your device ${d.product_name} was rejected: ${bulkRejectReason}`, d.id),
      ]));
      toast.success(`${ids.length} devices rejected`);
    } else toast.error('Bulk reject failed');

    setBulkProcessing(false); setBulkRejectOpen(false); setBulkRejectReason(''); setSelectedIds(new Set()); fetchDevices(); fetchStats();
  };

  const handleExportCSV = () => {
    const headers = ['Customer', 'Email', 'Device', 'Serial', 'IMEI', 'Plan', 'Price', 'Status', 'Risk', 'Submitted'];
    const rows = devices.map(d => [
      d.customer_name, d.customer_email, d.product_name, d.serial_number,
      d.imei_number || '', d.plan_name, d.plan_price, d.status, getRiskScore(d),
      format(new Date(d.created_at), 'dd/MM/yyyy HH:mm'),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `device-queue-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // =========================== RENDER ===========================
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <ShieldCheck size={24} className="text-primary" /> Device Approval Queue
            </h1>
            <p className="text-muted-foreground text-sm">
              {pendingCount > 0 ? `${pendingCount} pending device${pendingCount > 1 ? 's' : ''}` : 'No pending devices'} • Review, approve, or reject registrations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5"><Download size={14} /> Export</Button>
            <Button variant="outline" size="sm" onClick={() => { fetchDevices(); fetchStats(); }} className="gap-1.5"><RefreshCw size={14} /> Refresh</Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Pending', count: pendingCount, icon: <Clock size={28} className="text-warning" />, filterVal: 'pending', ring: 'ring-warning', pulse: pendingCount > 0 },
            { label: 'Approved Today', count: approvedTodayCount, icon: <CheckCircle2 size={28} className="text-success" />, filterVal: 'active', ring: 'ring-success' },
            { label: 'Rejected Today', count: rejectedTodayCount, icon: <XCircle size={28} className="text-destructive" />, filterVal: 'rejected', ring: 'ring-destructive' },
            { label: 'Total Processed', count: totalProcessed, icon: <TrendingUp size={28} className="text-info" />, filterVal: 'all', ring: '' },
          ].map(s => (
            <Card key={s.label} className={cn("cursor-pointer transition-shadow hover:shadow-md", filter === s.filterVal && s.ring && `ring-2 ${s.ring}`)} onClick={() => { setFilter(s.filterVal); setPage(0); }}>
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                    <p className="text-2xl font-bold">{s.count}</p>
                  </div>
                  {s.pulse ? (
                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>{s.icon}</motion.div>
                  ) : s.icon}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search name, email, serial, IMEI..." value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(0); }} className="pl-9 h-9" />
          </div>
          <Select value={filter} onValueChange={v => { setFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[160px] h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        <AnimatePresence>
          {selectedIds.size > 0 && filter === 'pending' && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted border border-border">
              <span className="text-sm font-medium">{selectedIds.size} selected</span>
              <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground gap-1" onClick={() => setBulkApproveOpen(true)}>
                <CheckCircle2 size={14} /> Approve
              </Button>
              <Button size="sm" variant="destructive" className="gap-1" onClick={() => setBulkRejectOpen(true)}>
                <XCircle size={14} /> Reject
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>Clear</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : devices.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <ShieldCheck size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">No {filter === 'all' ? '' : filter} devices found.</p>
          </CardContent></Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {filter === 'pending' && <TableHead className="w-10"><Checkbox checked={selectedIds.size === devices.length && devices.length > 0} onCheckedChange={toggleSelectAll} /></TableHead>}
                    <TableHead>Device</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden lg:table-cell">Details</TableHead>
                    <TableHead className="hidden md:table-cell">Fraud Check</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map(device => {
                    const risk = getRiskScore(device);
                    const daysAgo = differenceInDays(new Date(), new Date(device.created_at));
                    const imeiStatus = validateIMEI(device.imei_number);

                    return (
                      <TableRow key={device.id}>
                        {filter === 'pending' && <TableCell><Checkbox checked={selectedIds.has(device.id)} onCheckedChange={() => toggleSelectDevice(device.id)} /></TableCell>}
                        <TableCell>
                          <div className="min-w-[140px]">
                            <p className="font-medium text-sm">{device.product_name}</p>
                            <p className="text-xs text-muted-foreground">{device.category_name}</p>
                            <p className="text-xs text-muted-foreground">SN: {maskValue(device.serial_number)}</p>
                            {device.imei_number && <p className="text-xs text-muted-foreground">IMEI: {maskValue(device.imei_number)}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="min-w-[120px]">
                            <p className="font-medium text-sm">{device.customer_name}</p>
                            <a href={`mailto:${device.customer_email}`} className="text-xs text-primary hover:underline">{device.customer_email}</a>
                            <p className="text-xs text-muted-foreground">{daysAgo === 0 ? 'Today' : `${daysAgo}d pending`}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <div className="space-y-0.5">
                            <p className="text-xs"><span className="text-muted-foreground">Plan:</span> {device.plan_name}</p>
                            <p className="text-xs font-semibold text-primary">₹{Number(device.plan_price).toLocaleString('en-IN')}</p>
                            <div className="flex items-center gap-1">
                              {device.payment_method === 'upi' ? <Badge variant="outline" className="h-5 text-[10px] gap-0.5"><QrCode size={8} /> UPI</Badge>
                                : device.payment_method === 'cash' ? <Badge variant="outline" className="h-5 text-[10px] gap-0.5"><Banknote size={8} /> Cash</Badge>
                                : <Badge variant="secondary" className="h-5 text-[10px]">—</Badge>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="space-y-1">
                            {getRiskBadge(risk)}
                            {device.imei_number && (
                              <p className={cn("text-[10px]", imeiStatus.valid ? "text-success" : "text-destructive")}>
                                {imeiStatus.valid ? '✓ IMEI valid' : '✗ IMEI invalid'}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {device.status === 'pending' && <Badge className="bg-warning/10 text-warning border-warning/20">Pending</Badge>}
                          {device.status === 'active' && <Badge className="bg-success/10 text-success border-success/20">Approved</Badge>}
                          {device.status === 'rejected' && <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => openDetailDrawer(device)}>
                            <Eye size={12} /> Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-xs text-muted-foreground">Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount}</p>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft size={14} /></Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight size={14} /></Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>

      {/* ============ DETAIL DRAWER ============ */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><ShieldCheck size={18} className="text-primary" /> Device Review</SheetTitle>
            <SheetDescription>Complete verification before approving</SheetDescription>
          </SheetHeader>

          {selectedDevice && (
            <div className="mt-4 space-y-5">
              {/* Status + Risk */}
              <div className="flex items-center gap-2 flex-wrap">
                {selectedDevice.status === 'pending' && <Badge className="bg-warning/10 text-warning">Pending</Badge>}
                {selectedDevice.status === 'active' && <Badge className="bg-success/10 text-success">Approved</Badge>}
                {selectedDevice.status === 'rejected' && <Badge className="bg-destructive/10 text-destructive">Rejected</Badge>}
                {getRiskBadge(getRiskScore(selectedDevice))}
                {duplicates.length > 0 && <Badge className="bg-destructive/10 text-destructive border-destructive/20 gap-1"><Flag size={10} /> {duplicates.length} Duplicate{duplicates.length > 1 ? 's' : ''}</Badge>}
              </div>

              {/* Section 1: Device Information */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Info size={14} /> Device Information</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Device:</span> <strong>{selectedDevice.product_name}</strong></p>
                  <p><span className="text-muted-foreground">Category:</span> {selectedDevice.category_name}</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Serial:</span>
                    <span className="font-mono text-xs">{selectedDevice.serial_number}</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyToClipboard(selectedDevice.serial_number)}><Copy size={10} /></Button>
                  </div>
                  {selectedDevice.imei_number && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">IMEI:</span>
                      <span className="font-mono text-xs">{selectedDevice.imei_number}</span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => copyToClipboard(selectedDevice.imei_number!)}><Copy size={10} /></Button>
                      <span className={cn("text-[10px] ml-1", validateIMEI(selectedDevice.imei_number).valid ? "text-success" : "text-destructive")}>
                        {validateIMEI(selectedDevice.imei_number).message}
                      </span>
                    </div>
                  )}
                  <p><span className="text-muted-foreground">Submitted:</span> {format(new Date(selectedDevice.created_at), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
              </div>

              {/* Section 2: Customer Info */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><User size={14} /> Customer KYC</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Name:</span> <strong>{selectedDevice.customer_name}</strong></p>
                  <p><span className="text-muted-foreground">Email:</span> {selectedDevice.customer_email}</p>
                  {selectedDevice.customer_phone && <p><span className="text-muted-foreground">Phone:</span> {selectedDevice.customer_phone}</p>}
                  <p><span className="text-muted-foreground">WhatsApp:</span> {selectedDevice.whatsapp_number}</p>
                  <p><span className="text-muted-foreground">Address:</span> {selectedDevice.address}</p>
                  <p><span className="text-muted-foreground">Account Age:</span> {differenceInDays(new Date(), new Date(selectedDevice.customer_joined))} days</p>
                  <p><span className="text-muted-foreground">Devices Registered:</span> {selectedDevice.customer_device_count}</p>
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

              {/* Section 3: Plan & Payment */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Shield size={14} /> Plan & Payment</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
                  <p><span className="text-muted-foreground">Plan:</span> <strong>{selectedDevice.plan_name}</strong> ({selectedDevice.plan_code})</p>
                  <p><span className="text-muted-foreground">Price:</span> <strong className="text-primary">₹{Number(selectedDevice.plan_price).toLocaleString('en-IN')}/yr</strong></p>
                  <p className="flex items-center gap-2">
                    <span className="text-muted-foreground">Payment:</span>
                    {selectedDevice.payment_method === 'upi' ? <Badge variant="outline" className="gap-1"><QrCode size={10} /> UPI</Badge>
                      : selectedDevice.payment_method === 'cash' ? <Badge variant="outline" className="gap-1"><Banknote size={10} /> Cash</Badge> : '—'}
                  </p>
                  {selectedDevice.upi_transaction_id && (
                    <p><span className="text-muted-foreground">TXN ID:</span> <span className="font-mono text-xs bg-background border border-border px-2 py-0.5 rounded">{selectedDevice.upi_transaction_id}</span></p>
                  )}
                </div>
              </div>

              {/* Section 4: Device Photos */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Image size={14} /> Device Photos & Documents</h4>
                {devicePhotos.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {devicePhotos.map((url, i) => (
                        <div key={i} className="relative cursor-pointer rounded-lg overflow-hidden border border-border aspect-square group" onClick={() => { setPhotoViewerUrl(url); setPhotoViewerOpen(true); }}>
                          <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors flex items-center justify-center">
                            <ZoomIn size={20} className="text-background opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Photo quality checks */}
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-muted-foreground">Photo Quality Verification</p>
                      {PHOTO_QUALITY_CHECKS.map(label => (
                        <div key={label} className={cn("flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer transition-colors",
                          photoQualityChecks.has(label) ? "bg-success/5" : "hover:bg-muted/50")} onClick={() => togglePhotoCheck(label)}>
                          <Checkbox checked={photoQualityChecks.has(label)} className="h-3.5 w-3.5" />
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <Image size={24} className="mx-auto text-muted-foreground/40 mb-1" />
                    <p className="text-xs text-muted-foreground">No photos uploaded</p>
                    <Badge variant="outline" className="mt-2 text-destructive border-destructive/20">❌ Missing</Badge>
                  </div>
                )}
              </div>

              {/* Section 5: Duplicate Detection */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><Flag size={14} /> Duplicate Check</h4>
                {duplicatesLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-3"><Loader2 size={12} className="animate-spin" /> Checking for duplicates...</div>
                ) : duplicates.length > 0 ? (
                  <div className="space-y-2">
                    <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-2.5">
                      <p className="text-xs font-semibold text-destructive flex items-center gap-1"><AlertCircle size={12} /> DUPLICATE DEVICE DETECTED ({duplicates.length} match{duplicates.length > 1 ? 'es' : ''})</p>
                    </div>
                    {duplicates.map(dup => (
                      <div key={dup.id} className="bg-muted/50 rounded-lg p-2.5 text-xs space-y-0.5 border border-border">
                        <p className="font-medium">Match: {dup.match_type}</p>
                        <p><span className="text-muted-foreground">Device:</span> {dup.product_name}</p>
                        <p><span className="text-muted-foreground">Customer:</span> {dup.customer_name}</p>
                        <p><span className="text-muted-foreground">Serial:</span> {dup.serial_number}</p>
                        <p><span className="text-muted-foreground">Status:</span> <Badge variant="outline" className="h-4 text-[9px]">{dup.status}</Badge></p>
                        <p><span className="text-muted-foreground">Registered:</span> {format(new Date(dup.created_at), 'dd MMM yyyy')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-success/5 border border-success/20 rounded-lg p-2.5">
                    <p className="text-xs text-success flex items-center gap-1"><CheckCircle2 size={12} /> No duplicates found — Clean</p>
                  </div>
                )}
              </div>

              {/* Section 6: Risk Assessment */}
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><AlertTriangle size={14} /> Risk Assessment</h4>
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Risk Score: {getRiskScore(selectedDevice)}/100</span>
                    {getRiskBadge(getRiskScore(selectedDevice))}
                  </div>
                  <div className="space-y-1">
                    {getRiskDetails(selectedDevice).map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{f.label}</span>
                        <span className={cn(
                          f.risk === 'low' && 'text-success',
                          f.risk === 'medium' && 'text-warning',
                          f.risk === 'high' && 'text-destructive',
                        )}>{f.risk.charAt(0).toUpperCase() + f.risk.slice(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 7: Verification Checklist */}
              {selectedDevice.status === 'pending' && checklistItems.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-1.5"><ListChecks size={14} /> Verification Checklist</h4>
                  <div className="space-y-2">
                    {checklistItems.map(item => (
                      <div key={item.id} className={cn("flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors text-sm",
                        checkedItems.has(item.id) ? "border-primary/40 bg-primary/5" : "border-border")} onClick={() => toggleCheck(item.id)}>
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

              {/* Approved/Rejected info */}
              {selectedDevice.status === 'active' && selectedDevice.approved_at && (
                <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-success flex items-center gap-1.5"><CheckCircle2 size={14} /> Approved</p>
                  <p className="text-xs text-muted-foreground mt-1">on {format(new Date(selectedDevice.approved_at), 'dd MMM yyyy, hh:mm a')}</p>
                </div>
              )}
              {selectedDevice.status === 'rejected' && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm font-medium text-destructive flex items-center gap-1.5"><XCircle size={14} /> Rejected</p>
                  {selectedDevice.rejection_reason && <p className="text-xs mt-1"><span className="text-muted-foreground">Reason:</span> {selectedDevice.rejection_reason}</p>}
                  {selectedDevice.rejected_at && <p className="text-xs text-muted-foreground mt-1">on {format(new Date(selectedDevice.rejected_at), 'dd MMM yyyy, hh:mm a')}</p>}
                </div>
              )}

              <Separator />

              {/* Section 8: Action Buttons */}
              {selectedDevice.status === 'pending' && (
                <div className="space-y-3">
                  <Button className="w-full bg-success hover:bg-success/90 text-success-foreground gap-2"
                    onClick={handleApprove} disabled={processing || (checklistItems.length > 0 && !allChecked)}>
                    {processing ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />} Approve Device
                  </Button>
                  <Button variant="destructive" className="w-full gap-2" onClick={() => setRejectDialogOpen(true)} disabled={processing}>
                    <XCircle size={14} /> Reject Device
                  </Button>
                  <Button variant="outline" className="w-full gap-2 border-warning text-warning hover:bg-warning/10"
                    onClick={() => setFlagDialogOpen(true)} disabled={processing}>
                    <Flag size={14} /> Flag for Manual Review
                  </Button>
                  <Button variant="outline" className="w-full gap-2" onClick={() => setInfoDialogOpen(true)} disabled={processing}>
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
        <DialogContent className="max-w-3xl p-2">
          <img src={photoViewerUrl} alt="Device photo" className="w-full h-auto rounded-lg" />
          <div className="flex justify-end gap-2 p-2">
            <a href={photoViewerUrl} download target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-1"><Download size={12} /> Download</Button>
            </a>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive"><XCircle size={18} /> Reject Device</DialogTitle>
            <DialogDescription>Provide a reason. The customer will be notified with instructions.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={rejectReason} onValueChange={setRejectReason}>
              <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
              <SelectContent>{REJECTION_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea placeholder="Message to customer (explain what to fix)..." value={rejectMessage} onChange={e => setRejectMessage(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectReason || processing}>
              {processing && <Loader2 size={14} className="animate-spin mr-1" />} Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-warning"><Flag size={18} /> Flag for Review</DialogTitle>
            <DialogDescription>Escalate this device for manual review by a senior admin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea placeholder="Reason for flagging..." value={flagReason} onChange={e => setFlagReason(e.target.value)} rows={2} />
            <Select value={flagPriority} onValueChange={setFlagPriority}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="normal">Normal Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)}>Cancel</Button>
            <Button className="bg-warning hover:bg-warning/90 text-warning-foreground" onClick={handleFlag} disabled={processing}>
              {processing && <Loader2 size={14} className="animate-spin mr-1" />} Flag for Review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Request Dialog */}
      <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><AlertTriangle size={18} /> Request Information</DialogTitle>
            <DialogDescription>Customer has 48 hours to respond.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {INFO_REQUEST_OPTIONS.map(opt => (
              <div key={opt} className="flex items-center gap-2.5">
                <Checkbox checked={infoNeeded.has(opt)} onCheckedChange={() => setInfoNeeded(prev => { const n = new Set(prev); n.has(opt) ? n.delete(opt) : n.add(opt); return n; })} />
                <span className="text-sm">{opt}</span>
              </div>
            ))}
            <Textarea placeholder="Custom message..." value={infoMessage} onChange={e => setInfoMessage(e.target.value)} rows={2} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleRequestInfo} disabled={infoNeeded.size === 0 || processing}>
              {processing && <Loader2 size={14} className="animate-spin mr-1" />} Send Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Approve */}
      <Dialog open={bulkApproveOpen} onOpenChange={setBulkApproveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve {selectedIds.size} Devices</DialogTitle>
            <DialogDescription>All selected devices will be approved and customers notified.</DialogDescription>
          </DialogHeader>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {devices.filter(d => selectedIds.has(d.id)).map(d => <p key={d.id} className="text-sm">• {d.customer_name} — {d.product_name}</p>)}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkApproveOpen(false)}>Cancel</Button>
            <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={handleBulkApprove} disabled={bulkProcessing}>
              {bulkProcessing && <Loader2 size={14} className="animate-spin mr-1" />} Approve All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Reject */}
      <Dialog open={bulkRejectOpen} onOpenChange={setBulkRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Reject {selectedIds.size} Devices</DialogTitle>
            <DialogDescription>All selected devices will be rejected with the same reason.</DialogDescription>
          </DialogHeader>
          <Select value={bulkRejectReason} onValueChange={setBulkRejectReason}>
            <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
            <SelectContent>{REJECTION_REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleBulkReject} disabled={!bulkRejectReason || bulkProcessing}>
              {bulkProcessing && <Loader2 size={14} className="animate-spin mr-1" />} Reject All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDeviceApprovals;
