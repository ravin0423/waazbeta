import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, MapPin, ExternalLink, Download, Eye, Smartphone, FileText, Shield, Receipt, Clock, Activity, Users, TrendingUp, AlertTriangle, Star, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, formatDistanceToNow, differenceInDays, differenceInMonths } from 'date-fns';

interface CustomerRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  created_at: string;
  devices: {
    id: string;
    product_name: string;
    status: string;
    created_at: string;
    google_location_pin: string | null;
    whatsapp_number: string;
    subscription_plans: { name: string; annual_price: number } | null;
    referred_by_partner_id: string | null;
    serial_number: string;
    imei_number: string | null;
    subscription_start: string | null;
    subscription_end: string | null;
    address: string;
    gadget_categories: { name: string } | null;
  }[];
  claimsCount: number;
  invoices: any[];
  partnerName: string | null;
}

interface CustomerDetail {
  claims: any[];
  subscriptionHistory: any[];
  tickets: any[];
  activities: any[];
}

interface LTVMetrics {
  totalSpent: number;
  monthsAsCustomer: number;
  averageRevenuePerMonth: number;
  lifetimeValue: number;
  segment: 'vip' | 'loyal' | 'regular' | 'new' | 'at-risk' | 'churned';
}

interface ChurnRisk {
  inactivityScore: number;
  ticketScore: number;
  rejectionScore: number;
  expiryScore: number;
  paymentScore: number;
  totalRisk: number;
  level: 'healthy' | 'watch' | 'at-risk' | 'critical';
}

const calculateLTV = (customer: CustomerRow): LTVMetrics => {
  const joinDate = new Date(customer.created_at);
  const monthsAsCustomer = Math.max(1, differenceInMonths(new Date(), joinDate));

  // Total from paid invoices
  const totalSpent = customer.invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + Number(i.amount || 0), 0);

  // Add annual subscription value for active devices
  const activeSubValue = customer.devices
    .filter(d => d.status === 'active' && d.subscription_plans)
    .reduce((sum, d) => sum + Number(d.subscription_plans?.annual_price || 0), 0);

  const effectiveTotal = totalSpent > 0 ? totalSpent : activeSubValue;
  const averageRevenuePerMonth = effectiveTotal / monthsAsCustomer;
  const lifetimeValue = effectiveTotal;

  let segment: LTVMetrics['segment'] = 'regular';
  const activeDeviceCount = customer.devices.filter(d => d.status === 'active').length;
  const hasExpiredAll = customer.devices.length > 0 && activeDeviceCount === 0 && monthsAsCustomer > 1;

  if (hasExpiredAll && monthsAsCustomer > 3) segment = 'churned';
  else if (lifetimeValue >= 5000) segment = 'vip';
  else if (lifetimeValue >= 2000 && monthsAsCustomer >= 6) segment = 'loyal';
  else if (monthsAsCustomer < 1) segment = 'new';
  else if (lifetimeValue < 500 && monthsAsCustomer > 3) segment = 'at-risk';

  return { totalSpent: effectiveTotal, monthsAsCustomer, averageRevenuePerMonth, lifetimeValue, segment };
};

const calculateChurnRisk = (customer: CustomerRow, detail: CustomerDetail | null): ChurnRisk => {
  // Factor 1: Subscription expiry proximity (0-30)
  let expiryScore = 0;
  const activeDevices = customer.devices.filter(d => d.status === 'active');
  if (activeDevices.length === 0) {
    expiryScore = 30;
  } else {
    const soonestExpiry = activeDevices
      .filter(d => d.subscription_end)
      .map(d => differenceInDays(new Date(d.subscription_end!), new Date()))
      .sort((a, b) => a - b)[0];
    if (soonestExpiry !== undefined) {
      if (soonestExpiry < 0) expiryScore = 30;
      else if (soonestExpiry <= 7) expiryScore = 25;
      else if (soonestExpiry <= 30) expiryScore = 15;
      else if (soonestExpiry <= 60) expiryScore = 5;
    }
  }

  // Factor 2: Support tickets (0-25)
  let ticketScore = 0;
  const ticketCount = detail?.tickets.length || 0;
  if (ticketCount > 5) ticketScore = 25;
  else if (ticketCount > 3) ticketScore = 15;
  else if (ticketCount > 1) ticketScore = 5;

  // Factor 3: Claim rejection rate (0-20)
  let rejectionScore = 0;
  const claims = detail?.claims || [];
  if (claims.length > 0) {
    const rejectedCount = claims.filter(c => c.status === 'rejected').length;
    const rejectionRate = (rejectedCount / claims.length) * 100;
    if (rejectionRate > 50) rejectionScore = 20;
    else if (rejectionRate > 25) rejectionScore = 15;
    else if (rejectionRate > 0) rejectionScore = 5;
  }

  // Factor 4: Inactivity - days since last device registration or claim (0-15)
  let inactivityScore = 0;
  const latestDeviceDate = customer.devices.length > 0
    ? Math.max(...customer.devices.map(d => new Date(d.created_at).getTime()))
    : 0;
  const latestClaimDate = claims.length > 0
    ? Math.max(...claims.map((c: any) => new Date(c.created_at).getTime()))
    : 0;
  const lastActivityTime = Math.max(latestDeviceDate, latestClaimDate);
  if (lastActivityTime > 0) {
    const daysSince = differenceInDays(new Date(), new Date(lastActivityTime));
    if (daysSince > 180) inactivityScore = 15;
    else if (daysSince > 90) inactivityScore = 10;
    else if (daysSince > 60) inactivityScore = 5;
  }

  // Factor 5: Payment issues (0-10)
  let paymentScore = 0;
  const overdueInvoices = customer.invoices.filter(i => i.status === 'overdue').length;
  if (overdueInvoices > 2) paymentScore = 10;
  else if (overdueInvoices > 0) paymentScore = 5;

  const totalRisk = Math.min(100, expiryScore + ticketScore + rejectionScore + inactivityScore + paymentScore);

  let level: ChurnRisk['level'] = 'healthy';
  if (totalRisk >= 60) level = 'critical';
  else if (totalRisk >= 35) level = 'at-risk';
  else if (totalRisk >= 15) level = 'watch';

  return { inactivityScore, ticketScore, rejectionScore, expiryScore, paymentScore, totalRisk, level };
};

const segmentConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  vip: { label: '⭐ VIP', variant: 'default' },
  loyal: { label: 'Loyal', variant: 'default' },
  regular: { label: 'Regular', variant: 'outline' },
  new: { label: 'New', variant: 'secondary' },
  'at-risk': { label: 'At Risk', variant: 'destructive' },
  churned: { label: '✗ Churned', variant: 'destructive' },
};

const churnLevelConfig: Record<string, { color: string; bg: string }> = {
  healthy: { color: 'text-success', bg: 'bg-success' },
  watch: { color: 'text-warning', bg: 'bg-warning' },
  'at-risk': { color: 'text-orange-500', bg: 'bg-orange-500' },
  critical: { color: 'text-destructive', bg: 'bg-destructive' },
};

const AdminCustomerDatabase = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [customerDetail, setCustomerDetail] = useState<CustomerDetail>({ claims: [], subscriptionHistory: [], tickets: [], activities: [] });
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [segmentFilter, setSegmentFilter] = useState<string>('all');
  const [churnRiskFilter, setChurnRiskFilter] = useState<string>('all');

  // Pre-computed LTV for all customers (for list view)
  const customerLTVMap = useMemo(() => {
    const map: Record<string, LTVMetrics> = {};
    customers.forEach(c => { map[c.id] = calculateLTV(c); });
    return map;
  }, [customers]);

  // Churn for selected customer (computed when detail loaded)
  const selectedChurnRisk = useMemo(() => {
    if (!selectedCustomer) return null;
    return calculateChurnRisk(selectedCustomer, customerDetail);
  }, [selectedCustomer, customerDetail]);

  const selectedLTV = useMemo(() => {
    if (!selectedCustomer) return null;
    return calculateLTV(selectedCustomer);
  }, [selectedCustomer]);

  useEffect(() => {
    const fetchData = async () => {
      const [profilesRes, devicesRes, claimsRes, invoicesRes, partnersRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, phone, created_at').order('created_at', { ascending: false }),
        supabase.from('customer_devices').select('id, user_id, product_name, status, created_at, google_location_pin, whatsapp_number, referred_by_partner_id, serial_number, imei_number, subscription_start, subscription_end, address, subscription_plans(name, annual_price), gadget_categories(name)'),
        supabase.from('service_claims').select('id, user_id'),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('partners').select('id, name'),
      ]);

      const profiles = profilesRes.data || [];
      const devices = devicesRes.data || [];
      const claims = claimsRes.data || [];
      const invoices = invoicesRes.data || [];
      const partners = partnersRes.data || [];

      const partnerMap = partners.reduce((acc: Record<string, string>, p) => { acc[p.id] = p.name; return acc; }, {});
      const devicesByUser = devices.reduce((acc: Record<string, any[]>, d) => { if (!acc[d.user_id]) acc[d.user_id] = []; acc[d.user_id].push(d); return acc; }, {});
      const claimsByUser = claims.reduce((acc: Record<string, number>, c) => { acc[c.user_id] = (acc[c.user_id] || 0) + 1; return acc; }, {});
      const invoicesByUser = invoices.reduce((acc: Record<string, any[]>, inv) => { if (inv.user_id) { if (!acc[inv.user_id]) acc[inv.user_id] = []; acc[inv.user_id].push(inv); } return acc; }, {});

      const rows: CustomerRow[] = profiles
        .filter(p => devicesByUser[p.id]?.length > 0)
        .map(p => {
          const userDevices = devicesByUser[p.id] || [];
          const referrerId = userDevices.find((d: any) => d.referred_by_partner_id)?.referred_by_partner_id;
          return {
            ...p,
            devices: userDevices,
            claimsCount: claimsByUser[p.id] || 0,
            invoices: invoicesByUser[p.id] || [],
            partnerName: referrerId ? partnerMap[referrerId] || null : null,
          };
        });

      setCustomers(rows);
      setLoading(false);
    };
    fetchData();

    supabase.storage.from('company-assets').list('', { search: 'signature' }).then(({ data }) => {
      if (data && data.length > 0) {
        const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(data[0].name);
        setSignatureUrl(urlData.publicUrl);
      }
    });
  }, []);

  const openCustomerDetail = async (customer: CustomerRow) => {
    setSelectedCustomer(customer);
    setDetailOpen(true);
    setDetailLoading(true);

    const [claimsRes, subHistoryRes, ticketsRes, activitiesRes] = await Promise.all([
      supabase.from('service_claims').select('*, customer_devices(product_name)').eq('user_id', customer.id).order('created_at', { ascending: false }),
      supabase.from('subscription_history').select('*, subscription_plans:new_plan_id(name, annual_price)').eq('user_id', customer.id).order('created_at', { ascending: false }),
      supabase.from('service_tickets').select('*').eq('user_id', customer.id).order('created_at', { ascending: false }),
      supabase.from('customer_activity_log').select('*').eq('customer_id', customer.id).order('activity_timestamp', { ascending: false }).limit(50),
    ]);

    setCustomerDetail({
      claims: claimsRes.data || [],
      subscriptionHistory: subHistoryRes.data || [],
      tickets: ticketsRes.data || [],
      activities: activitiesRes.data || [],
    });
    setDetailLoading(false);
  };

  const filtered = customers.filter(c => {
    const matchesSearch = c.full_name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.partnerName?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (segmentFilter !== 'all' && customerLTVMap[c.id]?.segment !== segmentFilter) return false;
    if (churnRiskFilter !== 'all') {
      const churn = calculateChurnRisk(c, null);
      if (churnRiskFilter === 'healthy' && churn.totalRisk >= 15) return false;
      if (churnRiskFilter === 'watch' && (churn.totalRisk < 15 || churn.totalRisk >= 35)) return false;
      if (churnRiskFilter === 'at-risk' && (churn.totalRisk < 35 || churn.totalRisk >= 60)) return false;
      if (churnRiskFilter === 'critical' && churn.totalRisk < 60) return false;
    }
    return true;
  });

  const daysSince = (dateStr: string) => Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  const statusColor = (s: string) => s === 'paid' ? 'default' : s === 'overdue' ? 'destructive' : 'secondary';

  // Segment summary
  const segmentCounts = useMemo(() => {
    const counts: Record<string, number> = { vip: 0, loyal: 0, regular: 0, new: 0, 'at-risk': 0, churned: 0 };
    customers.forEach(c => { const seg = customerLTVMap[c.id]?.segment || 'regular'; counts[seg] = (counts[seg] || 0) + 1; });
    return counts;
  }, [customers, customerLTVMap]);

  const handleDownloadInvoice = (inv: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Invoice ${inv.invoice_number}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: auto; color: #1a1a2e; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #6366f1; }
        .logo span { font-size: 12px; display: block; color: #666; font-weight: normal; }
        .meta { text-align: right; font-size: 13px; color: #555; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f8f9fa; text-align: left; padding: 10px; font-size: 13px; border-bottom: 2px solid #e0e0e0; }
        td { padding: 10px; font-size: 13px; border-bottom: 1px solid #eee; }
        .totals { margin-top: 20px; text-align: right; }
        .totals p { margin: 4px 0; font-size: 14px; }
        .totals .grand { font-size: 18px; font-weight: bold; color: #6366f1; border-top: 2px solid #6366f1; padding-top: 8px; margin-top: 8px; }
        .sig { margin-top: 50px; text-align: right; }
        .sig img { max-height: 60px; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      <div class="header">
        <div><div class="logo">WaaZ<span>Gadget Protection Services</span></div></div>
        <div class="meta">
          <strong>Invoice #</strong> ${inv.invoice_number}<br/>
          <strong>Date:</strong> ${format(new Date(inv.created_at), 'dd MMM yyyy')}<br/>
          <strong>Status:</strong> ${inv.status.toUpperCase()}
        </div>
      </div>
      <p><strong>Bill To:</strong><br/>${inv.customer_name}<br/>${inv.customer_email || ''}</p>
      <table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody><tr><td>Service / Subscription</td><td style="text-align:right">₹${Number(inv.subtotal || inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr></tbody></table>
      <div class="totals">
        <p>Subtotal: ₹${Number(inv.subtotal || inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        ${Number(inv.cgst_amount) > 0 ? `<p>CGST (${inv.cgst_percent}%): ₹${Number(inv.cgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>` : ''}
        ${Number(inv.sgst_amount) > 0 ? `<p>SGST (${inv.sgst_percent}%): ₹${Number(inv.sgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>` : ''}
        <p class="grand">Total: ₹${Number(inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
      </div>
      ${inv.notes ? `<p style="margin-top:20px;font-size:13px;color:#666"><strong>Notes:</strong> ${inv.notes}</p>` : ''}
      <div class="sig">
        <p style="font-size:12px;color:#666">Authorized Signatory</p>
        ${signatureUrl ? `<img src="${signatureUrl}" alt="Signature" />` : ''}
        <p style="font-size:13px;font-weight:bold;margin-top:4px">WaaZ</p>
      </div>
      <div class="footer">This is a computer-generated invoice. &copy; WaaZ Gadget Protection Services</div>
      <script>window.print();</script></body></html>
    `);
    win.document.close();
  };

  const getCustomerMetrics = () => {
    if (!selectedCustomer) return { totalRevenue: 0, activeDevices: 0, totalClaims: 0, activeSince: null, daysActive: 0 };
    const totalRevenue = selectedCustomer.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0);
    const activeDevices = selectedCustomer.devices.filter(d => d.status === 'active').length;
    const earliest = selectedCustomer.devices.reduce((min, d) => d.created_at < min ? d.created_at : min, selectedCustomer.devices[0]?.created_at || new Date().toISOString());
    return { totalRevenue, activeDevices, totalClaims: selectedCustomer.claimsCount, activeSince: earliest, daysActive: daysSince(earliest) };
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Customer Database</h1>
            <p className="text-muted-foreground text-sm">360° customer profiles with LTV & churn insights</p>
          </div>
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search customers or partners..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* Segment Summary Cards */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
          {[
            { key: 'all', label: 'All', icon: Users, count: customers.length },
            { key: 'vip', label: '⭐ VIP', icon: Star, count: segmentCounts.vip },
            { key: 'loyal', label: 'Loyal', icon: TrendingUp, count: segmentCounts.loyal },
            { key: 'regular', label: 'Regular', icon: Users, count: segmentCounts.regular },
            { key: 'at-risk', label: 'At Risk', icon: AlertTriangle, count: segmentCounts['at-risk'] + (segmentCounts.new || 0) },
            { key: 'churned', label: 'Churned', icon: AlertTriangle, count: segmentCounts.churned },
          ].map(s => (
            <Card
              key={s.key}
              className={`cursor-pointer transition-all ${segmentFilter === s.key ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
              onClick={() => setSegmentFilter(s.key)}
            >
              <CardContent className="p-3 flex items-center gap-3">
                <s.icon size={18} className="text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold">{s.count}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Churn Risk Filter */}
        <div className="flex items-center gap-3 mb-4">
          <Select value={churnRiskFilter} onValueChange={setChurnRiskFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by churn risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk Levels</SelectItem>
              <SelectItem value="healthy">✅ Healthy (&lt; 15%)</SelectItem>
              <SelectItem value="watch">👀 Watch (15-35%)</SelectItem>
              <SelectItem value="at-risk">⚠️ At-Risk (35-60%)</SelectItem>
              <SelectItem value="critical">🚨 Critical (&gt; 60%)</SelectItem>
            </SelectContent>
          </Select>
          {(segmentFilter !== 'all' || churnRiskFilter !== 'all') && (
            <Button variant="ghost" size="sm" onClick={() => { setSegmentFilter('all'); setChurnRiskFilter('all'); }}>
              Clear filters
            </Button>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} customers</span>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No customers found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Active Subscriptions</TableHead>
                    <TableHead>LTV</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Onboarded By</TableHead>
                    <TableHead>Days Active</TableHead>
                    <TableHead>Claims</TableHead>
                    <TableHead>Invoices</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => {
                    const activeDevices = c.devices.filter(d => d.status === 'active');
                    const earliest = activeDevices.length > 0
                      ? activeDevices.reduce((min, d) => d.created_at < min ? d.created_at : min, activeDevices[0].created_at)
                      : null;
                    const ltv = customerLTVMap[c.id];
                    const seg = segmentConfig[ltv?.segment || 'regular'];

                    return (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openCustomerDetail(c)}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{c.full_name}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {activeDevices.length > 0 ? activeDevices.map(d => (
                              <span key={d.id} className="block text-xs bg-success/10 text-success px-2 py-0.5 rounded-full w-fit">
                                {d.subscription_plans?.name || d.product_name}
                              </span>
                            )) : (
                              <span className="text-xs text-muted-foreground">None active</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-sm">₹{(ltv?.lifetimeValue || 0).toLocaleString('en-IN')}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={seg?.variant || 'outline'} className="text-[10px]">{seg?.label || 'Regular'}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.partnerName ? (
                            <Badge variant="outline" className="text-xs">{c.partnerName}</Badge>
                          ) : <span className="text-muted-foreground text-xs">Direct</span>}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {earliest ? `${daysSince(earliest)}d` : '—'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{c.claimsCount}</TableCell>
                        <TableCell className="text-sm font-medium">{c.invoices.length}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 360° Customer Detail Sheet */}
        <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
          <SheetContent className="w-full sm:max-w-3xl p-0 flex flex-col">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
              <SheetTitle className="font-heading text-lg">{selectedCustomer?.full_name}</SheetTitle>
              <SheetDescription>{selectedCustomer?.email}</SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Profile header */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{selectedCustomer?.phone || selectedCustomer?.devices[0]?.whatsapp_number || '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Onboarded By</p>
                    <p className="text-sm font-medium">{selectedCustomer?.partnerName || 'Direct'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Address</p>
                    <p className="text-sm font-medium truncate">{selectedCustomer?.devices[0]?.address || '—'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground">Days Active</p>
                    <p className="text-sm font-medium">{getCustomerMetrics().daysActive} days</p>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <TrendingUp size={18} className="mx-auto text-primary mb-1" />
                      <p className="text-xs text-muted-foreground">Lifetime Value</p>
                      <p className="text-lg font-bold">₹{(selectedLTV?.lifetimeValue || 0).toLocaleString('en-IN')}</p>
                      <Badge variant={segmentConfig[selectedLTV?.segment || 'regular']?.variant || 'outline'} className="text-[10px] mt-1">
                        {segmentConfig[selectedLTV?.segment || 'regular']?.label}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <AlertTriangle size={18} className={`mx-auto mb-1 ${churnLevelConfig[selectedChurnRisk?.level || 'healthy']?.color || 'text-success'}`} />
                      <p className="text-xs text-muted-foreground">Churn Risk</p>
                      <p className="text-lg font-bold">{selectedChurnRisk?.totalRisk || 0}%</p>
                      <Badge variant={selectedChurnRisk?.level === 'critical' || selectedChurnRisk?.level === 'at-risk' ? 'destructive' : 'secondary'} className="text-[10px] mt-1 capitalize">
                        {selectedChurnRisk?.level || 'healthy'}
                      </Badge>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Smartphone size={18} className="mx-auto text-primary mb-1" />
                      <p className="text-xs text-muted-foreground">Active Devices</p>
                      <p className="text-lg font-bold">{getCustomerMetrics().activeDevices}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <Receipt size={18} className="mx-auto text-primary mb-1" />
                      <p className="text-xs text-muted-foreground">Revenue</p>
                      <p className="text-lg font-bold">₹{getCustomerMetrics().totalRevenue.toLocaleString('en-IN')}</p>
                    </CardContent>
                  </Card>
                </div>

                {detailLoading ? (
                  <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
                ) : (
                  <Tabs defaultValue="devices">
                    <TabsList className="grid w-full grid-cols-7">
                      <TabsTrigger value="devices" className="text-xs gap-1"><Smartphone size={14} /> Devices</TabsTrigger>
                      <TabsTrigger value="claims" className="text-xs gap-1"><FileText size={14} /> Claims</TabsTrigger>
                      <TabsTrigger value="invoices" className="text-xs gap-1"><Receipt size={14} /> Invoices</TabsTrigger>
                      <TabsTrigger value="history" className="text-xs gap-1"><Clock size={14} /> History</TabsTrigger>
                      <TabsTrigger value="tickets" className="text-xs gap-1"><Activity size={14} /> Tickets</TabsTrigger>
                      <TabsTrigger value="activity" className="text-xs gap-1"><Clock size={14} /> Timeline</TabsTrigger>
                      <TabsTrigger value="metrics" className="text-xs gap-1"><BarChart3 size={14} /> Metrics</TabsTrigger>
                    </TabsList>

                    {/* Devices Tab */}
                    <TabsContent value="devices" className="space-y-3 mt-4">
                      {selectedCustomer?.devices.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No devices registered</p>
                      ) : (
                        selectedCustomer?.devices.map(d => {
                          const subEnd = d.subscription_end ? new Date(d.subscription_end) : null;
                          const daysLeft = subEnd ? differenceInDays(subEnd, new Date()) : null;
                          return (
                            <Card key={d.id}>
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="space-y-1">
                                    <p className="font-medium">{d.product_name}</p>
                                    <p className="text-xs text-muted-foreground">{d.gadget_categories?.name || 'Gadget'} • Serial: {d.serial_number}</p>
                                    {d.imei_number && <p className="text-xs text-muted-foreground">IMEI: {d.imei_number}</p>}
                                    <p className="text-xs text-muted-foreground">Plan: {d.subscription_plans?.name || '—'} • ₹{Number(d.subscription_plans?.annual_price || 0).toLocaleString('en-IN')}/yr</p>
                                    {d.subscription_end && (
                                      <p className={`text-xs font-medium ${daysLeft !== null && daysLeft < 0 ? 'text-destructive' : daysLeft !== null && daysLeft <= 30 ? 'text-warning' : 'text-success'}`}>
                                        {daysLeft !== null && daysLeft < 0 ? `Expired ${Math.abs(daysLeft)} days ago` : `${daysLeft} days remaining`}
                                      </p>
                                    )}
                                  </div>
                                  <Badge variant={d.status === 'active' ? 'default' : d.status === 'pending' ? 'secondary' : 'destructive'}>{d.status}</Badge>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })
                      )}
                    </TabsContent>

                    {/* Claims Tab */}
                    <TabsContent value="claims" className="space-y-3 mt-4">
                      {customerDetail.claims.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No claims filed</p>
                      ) : (
                        customerDetail.claims.map(claim => (
                          <Card key={claim.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <p className="font-medium">{claim.issue_type}</p>
                                  <p className="text-xs text-muted-foreground">Device: {claim.customer_devices?.product_name || claim.imei_number}</p>
                                  <p className="text-xs text-muted-foreground">{format(new Date(claim.created_at), 'dd MMM yyyy')}</p>
                                  {claim.description && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{claim.description}</p>}
                                </div>
                                <Badge variant={
                                  claim.status === 'completed' || claim.status === 'resolved' ? 'default' :
                                  claim.status === 'rejected' ? 'destructive' : 'secondary'
                                }>{claim.status}</Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>

                    {/* Invoices Tab */}
                    <TabsContent value="invoices" className="space-y-3 mt-4">
                      {selectedCustomer?.invoices.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No invoices</p>
                      ) : (
                        <>
                          <div className="flex items-center justify-between px-1">
                            <p className="text-sm font-medium">
                              Total Paid: ₹{selectedCustomer?.invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount || 0), 0).toLocaleString('en-IN')}
                            </p>
                            <p className="text-xs text-muted-foreground">{selectedCustomer?.invoices.length} invoices</p>
                          </div>
                          {selectedCustomer?.invoices.map(inv => (
                            <Card key={inv.id}>
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-mono text-sm font-medium">{inv.invoice_number}</p>
                                    <p className="text-xs text-muted-foreground">{format(new Date(inv.created_at), 'dd MMM yyyy')}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className="font-medium text-sm">₹{Number(inv.amount).toLocaleString('en-IN')}</span>
                                    <Badge variant={statusColor(inv.status) as any}>{inv.status}</Badge>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedInvoice(inv)}><Eye size={14} /></Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownloadInvoice(inv)}><Download size={14} /></Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </>
                      )}
                    </TabsContent>

                    {/* Subscription History Tab */}
                    <TabsContent value="history" className="space-y-3 mt-4">
                      {customerDetail.subscriptionHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No subscription history</p>
                      ) : (
                        customerDetail.subscriptionHistory.map(h => (
                          <Card key={h.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <p className="font-medium">{h.subscription_plans?.name || 'Plan'}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{h.renewal_type} • ₹{Number(h.amount_paid).toLocaleString('en-IN')}</p>
                                  <p className="text-xs text-muted-foreground">Valid until {format(new Date(h.new_end_date), 'dd MMM yyyy')}</p>
                                </div>
                                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(h.created_at), { addSuffix: true })}</span>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>

                    {/* Tickets Tab */}
                    <TabsContent value="tickets" className="space-y-3 mt-4">
                      {customerDetail.tickets.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No support tickets</p>
                      ) : (
                        customerDetail.tickets.map(t => (
                          <Card key={t.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                  <p className="font-medium">{t.subject}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                                  <p className="text-xs text-muted-foreground">{format(new Date(t.created_at), 'dd MMM yyyy')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={t.priority === 'high' || t.priority === 'urgent' ? 'destructive' : 'secondary'} className="text-[10px]">{t.priority}</Badge>
                                  <Badge variant={t.status === 'resolved' || t.status === 'closed' ? 'default' : 'secondary'}>{t.status}</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </TabsContent>

                    {/* Activity Timeline Tab */}
                    <TabsContent value="activity" className="space-y-3 mt-4">
                      {customerDetail.activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No activity recorded yet</p>
                      ) : (
                        <div className="relative">
                          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
                          {customerDetail.activities.map((activity: any) => {
                            const iconMap: Record<string, string> = {
                              device_submitted: '📱',
                              claim_submitted: '📋',
                              subscription_changed: '🔄',
                              payment_made: '💳',
                              support_ticket: '🆘',
                              login: '🔐',
                            };
                            return (
                              <div key={activity.id} className="relative pl-10 pb-4">
                                <div className="absolute left-2.5 top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
                                <Card>
                                  <CardContent className="p-3">
                                    <div className="flex items-start justify-between">
                                      <div className="flex items-start gap-2">
                                        <span className="text-lg">{iconMap[activity.activity_type] || '📌'}</span>
                                        <div>
                                          <p className="text-sm font-medium">{activity.description}</p>
                                          <p className="text-xs text-muted-foreground capitalize">{activity.activity_type.replace(/_/g, ' ')}</p>
                                        </div>
                                      </div>
                                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {formatDistanceToNow(new Date(activity.activity_timestamp), { addSuffix: true })}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </TabsContent>

                    {/* Metrics Tab - LTV & Churn */}
                    <TabsContent value="metrics" className="space-y-4 mt-4">
                      {/* LTV Breakdown */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2"><TrendingUp size={16} /> Lifetime Value Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Total Revenue</p>
                              <p className="text-base font-bold">₹{(selectedLTV?.totalSpent || 0).toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Avg Revenue / Month</p>
                              <p className="text-base font-bold">₹{(selectedLTV?.averageRevenuePerMonth || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Months as Customer</p>
                              <p className="text-base font-bold">{selectedLTV?.monthsAsCustomer || 0}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground">Segment</p>
                              <Badge variant={segmentConfig[selectedLTV?.segment || 'regular']?.variant || 'outline'} className="mt-1">
                                {segmentConfig[selectedLTV?.segment || 'regular']?.label}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Churn Risk Breakdown */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <AlertTriangle size={16} className={churnLevelConfig[selectedChurnRisk?.level || 'healthy']?.color} />
                            Churn Risk Score: {selectedChurnRisk?.totalRisk || 0}/100
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Progress value={selectedChurnRisk?.totalRisk || 0} className="h-2" />

                          <div className="space-y-3">
                            {[
                              { label: 'Subscription Expiry', score: selectedChurnRisk?.expiryScore || 0, max: 30, desc: 'How close subscriptions are to expiring' },
                              { label: 'Support Tickets', score: selectedChurnRisk?.ticketScore || 0, max: 25, desc: 'Volume of support requests' },
                              { label: 'Claim Rejections', score: selectedChurnRisk?.rejectionScore || 0, max: 20, desc: 'Rate of rejected claims' },
                              { label: 'Inactivity', score: selectedChurnRisk?.inactivityScore || 0, max: 15, desc: 'Days since last activity' },
                              { label: 'Payment Issues', score: selectedChurnRisk?.paymentScore || 0, max: 10, desc: 'Overdue invoices' },
                            ].map(factor => (
                              <div key={factor.label} className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                  <span>{factor.label}</span>
                                  <span className="font-mono text-xs font-medium">{factor.score}/{factor.max}</span>
                                </div>
                                <Progress value={(factor.score / factor.max) * 100} className="h-1.5" />
                                <p className="text-[10px] text-muted-foreground">{factor.desc}</p>
                              </div>
                            ))}
                          </div>

                          <div className="p-3 rounded-lg bg-muted/50 text-center">
                            <p className="text-xs text-muted-foreground mb-1">Overall Assessment</p>
                            <Badge variant={selectedChurnRisk?.level === 'critical' || selectedChurnRisk?.level === 'at-risk' ? 'destructive' : selectedChurnRisk?.level === 'watch' ? 'secondary' : 'default'} className="capitalize text-sm">
                              {selectedChurnRisk?.level === 'healthy' && '✅ '}
                              {selectedChurnRisk?.level === 'watch' && '👀 '}
                              {selectedChurnRisk?.level === 'at-risk' && '⚠️ '}
                              {selectedChurnRisk?.level === 'critical' && '🚨 '}
                              {selectedChurnRisk?.level || 'healthy'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                )}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Invoice detail dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-heading">Invoice {selectedInvoice?.invoice_number}</DialogTitle></DialogHeader>
            {selectedInvoice && (
              <div className="space-y-3 text-sm mt-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{format(new Date(selectedInvoice.created_at), 'dd MMM yyyy')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={statusColor(selectedInvoice.status) as any}>{selectedInvoice.status}</Badge></div>
                <hr />
                <div className="flex justify-between"><span>Subtotal</span><span>₹{Number(selectedInvoice.subtotal || selectedInvoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                {Number(selectedInvoice.cgst_amount) > 0 && <div className="flex justify-between text-muted-foreground"><span>CGST ({selectedInvoice.cgst_percent}%)</span><span>₹{Number(selectedInvoice.cgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                {Number(selectedInvoice.sgst_amount) > 0 && <div className="flex justify-between text-muted-foreground"><span>SGST ({selectedInvoice.sgst_percent}%)</span><span>₹{Number(selectedInvoice.sgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>₹{Number(selectedInvoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                {selectedInvoice.notes && <p className="text-muted-foreground pt-2"><strong>Notes:</strong> {selectedInvoice.notes}</p>}
                <Button className="w-full mt-2" onClick={() => handleDownloadInvoice(selectedInvoice)}><Download size={14} className="mr-1" /> Download</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminCustomerDatabase;
