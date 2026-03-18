import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, subMonths } from 'date-fns';
import { Plus, IndianRupee, Users, Download, Loader2, Calculator, CheckCircle, Clock, TrendingUp, Zap } from 'lucide-react';
import { aggregateMonthlyPayouts, recordClaimCommission } from '@/services/commissionService';

const AdminFinancePartnerPayments = () => {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [complianceInfo, setComplianceInfo] = useState<Record<string, string>>({});
  const [aggregating, setAggregating] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [selectedPartnerDetail, setSelectedPartnerDetail] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [filterStatus, setFilterStatus] = useState('all');

  const emptyForm = { partner_id: '', payout_month: format(new Date(), 'yyyy-MM') + '-01', gross_amount: '', tds_rate: '10', payment_method: '', payment_reference: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [payoutRes, partnerRes, compRes, commRes] = await Promise.all([
      supabase.from('finance_partner_payouts').select('*, partners(name, email, phone, commission_rate)').order('payout_month', { ascending: false }),
      supabase.from('partners').select('id, name, commission_rate, city, state').eq('is_active', true),
      supabase.from('finance_compliance_info').select('*').in('info_key', ['default_tds_rate']),
      supabase.from('partner_commissions').select('*, partners(name)').order('created_at', { ascending: false }).limit(200),
    ]);
    setPayouts(payoutRes.data || []);
    setPartners(partnerRes.data || []);
    setCommissions(commRes.data || []);
    const map: Record<string, string> = {};
    (compRes.data || []).forEach((d: any) => { map[d.info_key] = d.info_value; });
    setComplianceInfo(map);
    setLoading(false);
  };

  // Auto-calculate commissions for completed claims without commission records
  const autoCalculateCommissions = async () => {
    setCalculating(true);
    try {
      // Get completed claims with assigned partners that don't have commission records yet
      const { data: completedClaims } = await supabase
        .from('service_claims')
        .select('id, assigned_partner_id, device_id')
        .in('status', ['completed', 'resolved'])
        .not('assigned_partner_id', 'is', null);

      if (!completedClaims || completedClaims.length === 0) {
        toast.info('No completed claims found to process');
        setCalculating(false);
        return;
      }

      // Get existing commission claim_ids
      const { data: existingComms } = await supabase
        .from('partner_commissions')
        .select('claim_id');
      const existingClaimIds = new Set((existingComms || []).map(c => c.claim_id));

      // Filter to claims without commissions
      const unprocessed = completedClaims.filter(c => !existingClaimIds.has(c.id));

      if (unprocessed.length === 0) {
        toast.info('All completed claims already have commissions calculated');
        setCalculating(false);
        return;
      }

      // Get device subscription plan prices for claim amounts
      const deviceIds = [...new Set(unprocessed.filter(c => c.device_id).map(c => c.device_id))];
      const { data: devices } = await supabase
        .from('customer_devices')
        .select('id, subscription_plans(annual_price)')
        .in('id', deviceIds);
      const devicePriceMap: Record<string, number> = {};
      (devices || []).forEach(d => {
        devicePriceMap[d.id] = Number(d.subscription_plans?.annual_price || 1000);
      });

      let processed = 0;
      for (const claim of unprocessed) {
        const claimAmount = claim.device_id ? (devicePriceMap[claim.device_id] || 1000) : 1000;
        await recordClaimCommission(claim.id, claim.assigned_partner_id!, claimAmount);
        processed++;
      }

      toast.success(`Calculated commissions for ${processed} claims`);
      fetchData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to calculate commissions');
    } finally {
      setCalculating(false);
    }
  };

  // Auto-aggregate monthly payouts
  const handleAggregatePayouts = async () => {
    setAggregating(true);
    try {
      const tdsRate = Number(complianceInfo.default_tds_rate || 10);
      const result = await aggregateMonthlyPayouts(filterMonth, tdsRate, user?.id);
      if (result.created > 0) {
        toast.success(`Created ${result.created} payout record(s) for ${filterMonth}`);
      } else {
        toast.info('No new payouts to create (already aggregated or no commissions)');
      }
      fetchData();
    } catch (error) {
      toast.error('Failed to aggregate payouts');
    } finally {
      setAggregating(false);
    }
  };

  const handleSave = async () => {
    if (!form.partner_id || !form.gross_amount) { toast.error('Partner and amount required'); return; }
    const gross = Number(form.gross_amount);
    const tdsRate = Number(form.tds_rate || complianceInfo.default_tds_rate || 10);
    const tdsAmount = Math.round(gross * tdsRate / 100 * 100) / 100;
    const netAmount = gross - tdsAmount;

    const payload = {
      partner_id: form.partner_id,
      payout_month: form.payout_month,
      gross_amount: gross,
      tds_rate: tdsRate,
      tds_amount: tdsAmount,
      net_amount: netAmount,
      payment_method: form.payment_method || null,
      payment_reference: form.payment_reference || null,
      notes: form.notes || null,
    };

    if (editItem) {
      await supabase.from('finance_partner_payouts').update(payload).eq('id', editItem.id);
      toast.success('Payout updated');
    } else {
      await supabase.from('finance_partner_payouts').insert({ ...payload, status: 'pending' });
      toast.success('Payout created');

      const partner = partners.find(p => p.id === form.partner_id);
      const { data: commCat } = await supabase.from('finance_categories').select('id').eq('name', 'Partner Commission').limit(1).maybeSingle();
      await supabase.from('finance_transactions').insert({
        transaction_date: form.payout_month,
        type: 'expense',
        category_id: commCat?.id || null,
        description: `Commission payout to ${partner?.name || 'Partner'}`,
        amount: netAmount,
        tax_amount: tdsAmount,
        source_type: 'partner_payout',
        is_auto_generated: true,
        created_by: user?.id,
      });
    }

    setDialogOpen(false);
    setEditItem(null);
    setForm(emptyForm);
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === 'paid') update.paid_at = new Date().toISOString();
    await supabase.from('finance_partner_payouts').update(update).eq('id', id);
    toast.success(`Payout marked as ${status}`);
    fetchData();
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      partner_id: item.partner_id,
      payout_month: item.payout_month,
      gross_amount: String(item.gross_amount),
      tds_rate: String(item.tds_rate),
      payment_method: item.payment_method || '',
      payment_reference: item.payment_reference || '',
      notes: item.notes || '',
    });
    setDialogOpen(true);
  };

  const openPartnerBreakdown = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    const partnerComms = commissions.filter(c => c.partner_id === partnerId);
    setSelectedPartnerDetail({ partner, commissions: partnerComms });
    setShowDetail(true);
  };

  const formatCurrency = (v: number) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const filteredPayouts = useMemo(() => {
    return payouts.filter(p => {
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      return true;
    });
  }, [payouts, filterStatus]);

  const totalPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.net_amount), 0);
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.net_amount), 0);
  const totalTDS = payouts.reduce((s, p) => s + Number(p.tds_amount), 0);
  const totalCommissions = commissions.reduce((s, c) => s + Number(c.total_commission), 0);
  const pendingCommissions = commissions.filter(c => c.status === 'calculated').length;

  const statusColor = (s: string) => s === 'paid' ? 'default' : s === 'processed' ? 'secondary' : 'outline';

  // Commission summary by partner
  const commissionByPartner = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number; bonuses: number; penalties: number }> = {};
    commissions.forEach(c => {
      if (!map[c.partner_id]) {
        map[c.partner_id] = { name: c.partners?.name || 'Unknown', total: 0, count: 0, bonuses: 0, penalties: 0 };
      }
      map[c.partner_id].total += Number(c.total_commission);
      map[c.partner_id].count += 1;
      map[c.partner_id].bonuses += Number(c.sla_bonus) + Number(c.rating_bonus) + Number(c.volume_bonus);
      map[c.partner_id].penalties += Math.abs(Number(c.penalty_deduction));
    });
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total);
  }, [commissions]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Partner Payments & Commissions</h1>
            <p className="text-muted-foreground">Automated commission calculation, TDS deductions & payout management</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={autoCalculateCommissions} disabled={calculating}>
              {calculating ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Calculator size={14} className="mr-1" />}
              Auto-Calculate
            </Button>
            <Button variant="outline" size="sm" onClick={handleAggregatePayouts} disabled={aggregating}>
              {aggregating ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Zap size={14} className="mr-1" />}
              Generate Payouts ({filterMonth})
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditItem(null); setForm(emptyForm); } }}>
              <DialogTrigger asChild>
                <Button><Plus size={16} className="mr-2" /> Manual Payout</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editItem ? 'Edit Payout' : 'Create Manual Payout'}</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Partner</Label>
                    <Select value={form.partner_id} onValueChange={v => setForm({ ...form, partner_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                      <SelectContent>
                        {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.commission_rate}%)</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Payout Month</Label>
                    <Input type="month" value={form.payout_month?.substring(0, 7)} onChange={e => setForm({ ...form, payout_month: e.target.value + '-01' })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Gross Amount (₹)</Label>
                      <Input type="number" value={form.gross_amount} onChange={e => setForm({ ...form, gross_amount: e.target.value })} />
                    </div>
                    <div>
                      <Label>TDS Rate (%)</Label>
                      <Input type="number" value={form.tds_rate} onChange={e => setForm({ ...form, tds_rate: e.target.value })} />
                    </div>
                  </div>
                  {form.gross_amount && (
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4 text-sm space-y-1">
                        <div className="flex justify-between"><span>Gross:</span><span>{formatCurrency(Number(form.gross_amount))}</span></div>
                        <div className="flex justify-between"><span>TDS ({form.tds_rate}%):</span><span className="text-destructive">-{formatCurrency(Number(form.gross_amount) * Number(form.tds_rate) / 100)}</span></div>
                        <div className="flex justify-between font-bold border-t pt-1"><span>Net Payable:</span><span>{formatCurrency(Number(form.gross_amount) - Number(form.gross_amount) * Number(form.tds_rate) / 100)}</span></div>
                      </CardContent>
                    </Card>
                  )}
                  <div>
                    <Label>Payment Method</Label>
                    <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Payment Reference</Label>
                    <Input value={form.payment_reference} onChange={e => setForm({ ...form, payment_reference: e.target.value })} />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <Button className="w-full" onClick={handleSave}>{editItem ? 'Update' : 'Create'} Payout</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Commissions</p>
                  <p className="text-xl font-bold">{formatCurrency(totalCommissions)}</p>
                </div>
                <Calculator size={24} className="text-primary" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{commissions.length} records</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Aggregation</p>
                  <p className="text-xl font-bold text-orange-500">{pendingCommissions}</p>
                </div>
                <Clock size={24} className="text-orange-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">Not yet in payouts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pending Payouts</p>
              <p className="text-xl font-bold text-orange-500">{formatCurrency(totalPending)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Total TDS Deducted</p>
              <p className="text-xl font-bold text-blue-500">{formatCurrency(totalTDS)}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="payouts">
          <TabsList>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="commissions">Commissions ({commissions.length})</TabsTrigger>
            <TabsTrigger value="summary">Partner Summary</TabsTrigger>
          </TabsList>

          {/* PAYOUTS TAB */}
          <TabsContent value="payouts" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg">Payout History</CardTitle>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin text-primary" /></div>
                ) : filteredPayouts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No payouts found</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">TDS</TableHead>
                        <TableHead className="text-right">Net</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayouts.map((p: any) => (
                        <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openPartnerBreakdown(p.partner_id)}>
                          <TableCell className="font-medium">{p.partners?.name || '—'}</TableCell>
                          <TableCell>{format(new Date(p.payout_month), 'MMM yyyy')}</TableCell>
                          <TableCell className="text-right">{formatCurrency(p.gross_amount)}</TableCell>
                          <TableCell className="text-right text-destructive">{formatCurrency(p.tds_amount)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(p.net_amount)}</TableCell>
                          <TableCell><Badge variant={statusColor(p.status)}>{p.status.toUpperCase()}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                              {p.status === 'pending' && <Button variant="ghost" size="sm" onClick={() => updateStatus(p.id, 'processed')}>Process</Button>}
                              {p.status === 'processed' && <Button variant="ghost" size="sm" onClick={() => updateStatus(p.id, 'paid')}>Mark Paid</Button>}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* COMMISSIONS TAB */}
          <TabsContent value="commissions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commission Records</CardTitle>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <div className="text-center py-8">
                    <Calculator size={40} className="mx-auto mb-3 text-muted-foreground" />
                    <p className="text-muted-foreground">No commissions calculated yet</p>
                    <p className="text-sm text-muted-foreground mt-1">Click "Auto-Calculate" to process completed claims</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Partner</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Claim Amt</TableHead>
                        <TableHead className="text-right">Base ({'>'}Rate)</TableHead>
                        <TableHead className="text-right">SLA Bonus</TableHead>
                        <TableHead className="text-right">Rating Bonus</TableHead>
                        <TableHead className="text-right">Volume Bonus</TableHead>
                        <TableHead className="text-right">Penalty</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((c: any) => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.partners?.name || '—'}</TableCell>
                          <TableCell>{c.commission_month}</TableCell>
                          <TableCell className="text-right">{formatCurrency(c.claim_amount)}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(c.base_commission_amount)}
                            <span className="text-xs text-muted-foreground ml-1">({c.base_commission_rate}%)</span>
                          </TableCell>
                          <TableCell className="text-right text-emerald-600">{Number(c.sla_bonus) > 0 ? `+${formatCurrency(c.sla_bonus)}` : '-'}</TableCell>
                          <TableCell className="text-right text-emerald-600">{Number(c.rating_bonus) > 0 ? `+${formatCurrency(c.rating_bonus)}` : '-'}</TableCell>
                          <TableCell className="text-right text-emerald-600">{Number(c.volume_bonus) > 0 ? `+${formatCurrency(c.volume_bonus)}` : '-'}</TableCell>
                          <TableCell className="text-right text-destructive">{Number(c.penalty_deduction) < 0 ? formatCurrency(c.penalty_deduction) : '-'}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(c.total_commission)}</TableCell>
                          <TableCell>
                            <Badge variant={c.status === 'aggregated' ? 'default' : 'outline'}>
                              {c.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PARTNER SUMMARY TAB */}
          <TabsContent value="summary" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Commission by Partner</CardTitle>
              </CardHeader>
              <CardContent>
                {commissionByPartner.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No commission data yet</p>
                ) : (
                  <div className="space-y-3">
                    {commissionByPartner.map(([partnerId, data]) => {
                      const maxTotal = commissionByPartner[0]?.[1]?.total || 1;
                      return (
                        <div
                          key={partnerId}
                          className="p-4 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => openPartnerBreakdown(partnerId)}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <div className="font-semibold">{data.name}</div>
                              <div className="text-xs text-muted-foreground">{data.count} claims</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">{formatCurrency(data.total)}</div>
                              <div className="text-xs">
                                {data.bonuses > 0 && <span className="text-emerald-600 mr-2">+{formatCurrency(data.bonuses)} bonuses</span>}
                                {data.penalties > 0 && <span className="text-destructive">-{formatCurrency(data.penalties)} penalties</span>}
                              </div>
                            </div>
                          </div>
                          <Progress value={(data.total / maxTotal) * 100} className="h-2" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* PARTNER COMMISSION DETAIL SHEET */}
        <Sheet open={showDetail} onOpenChange={setShowDetail}>
          <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
            {selectedPartnerDetail && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-heading">{selectedPartnerDetail.partner?.name}</SheetTitle>
                  <SheetDescription>
                    {selectedPartnerDetail.partner?.city}, {selectedPartnerDetail.partner?.state}
                    {' • Base rate: '}{selectedPartnerDetail.partner?.commission_rate}%
                  </SheetDescription>
                </SheetHeader>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  <Card>
                    <CardContent className="pt-4 pb-4 text-center">
                      <div className="text-xs text-muted-foreground">Total Earned</div>
                      <div className="text-xl font-bold">
                        {formatCurrency(selectedPartnerDetail.commissions.reduce((s: number, c: any) => s + Number(c.total_commission), 0))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4 text-center">
                      <div className="text-xs text-muted-foreground">Claims Processed</div>
                      <div className="text-xl font-bold">{selectedPartnerDetail.commissions.length}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4 text-center">
                      <div className="text-xs text-muted-foreground">Total Bonuses</div>
                      <div className="text-xl font-bold text-emerald-600">
                        {formatCurrency(selectedPartnerDetail.commissions.reduce((s: number, c: any) => 
                          s + Number(c.sla_bonus) + Number(c.rating_bonus) + Number(c.volume_bonus), 0))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4 text-center">
                      <div className="text-xs text-muted-foreground">Total Penalties</div>
                      <div className="text-xl font-bold text-destructive">
                        {formatCurrency(Math.abs(selectedPartnerDetail.commissions.reduce((s: number, c: any) => 
                          s + Number(c.penalty_deduction), 0)))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Commission Records */}
                <div className="mt-6">
                  <h3 className="font-semibold mb-3">Commission Breakdown</h3>
                  <div className="space-y-2">
                    {selectedPartnerDetail.commissions.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">No commissions yet</p>
                    ) : (
                      selectedPartnerDetail.commissions.map((c: any) => (
                        <Card key={c.id}>
                          <CardContent className="py-3 px-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-medium text-sm">Claim {c.claim_id.slice(0, 8)}...</div>
                                <div className="text-xs text-muted-foreground">{c.commission_month}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold">{formatCurrency(c.total_commission)}</div>
                                <Badge variant={c.status === 'aggregated' ? 'default' : 'outline'} className="text-xs">
                                  {c.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-5 gap-1 text-xs text-muted-foreground">
                              <div>Base: {formatCurrency(c.base_commission_amount)}</div>
                              <div className="text-emerald-600">SLA: {Number(c.sla_bonus) > 0 ? `+${formatCurrency(c.sla_bonus)}` : '-'}</div>
                              <div className="text-emerald-600">Rating: {Number(c.rating_bonus) > 0 ? `+${formatCurrency(c.rating_bonus)}` : '-'}</div>
                              <div className="text-emerald-600">Vol: {Number(c.volume_bonus) > 0 ? `+${formatCurrency(c.volume_bonus)}` : '-'}</div>
                              <div className="text-destructive">Pen: {Number(c.penalty_deduction) < 0 ? formatCurrency(c.penalty_deduction) : '-'}</div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </DashboardLayout>
  );
};

export default AdminFinancePartnerPayments;
