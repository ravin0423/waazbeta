import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Coins, Loader2, Award, AlertTriangle, IndianRupee, Clock, CheckCircle2, TrendingUp, Eye } from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const PartnerCommissions = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommission, setSelectedCommission] = useState<any>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const fetchData = useCallback(async () => {
    if (!user) return;
    const { data: p } = await supabase.from('partners').select('*').eq('user_id', user.id).maybeSingle();
    setPartner(p);
    if (p) {
      const [{ data: salesData }, { data: commData }, { data: payoutData }] = await Promise.all([
        supabase
          .from('customer_devices')
          .select('*, subscription_plans(name, annual_price)')
          .eq('referred_by_partner_id', p.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),
        supabase
          .from('partner_commissions')
          .select('*')
          .eq('partner_id', p.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('finance_partner_payouts')
          .select('*')
          .eq('partner_id', p.id)
          .order('payout_month', { ascending: false }),
      ]);
      setSales(salesData || []);
      setCommissions(commData || []);
      setPayouts(payoutData || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time updates
  useEffect(() => {
    if (!partner) return;
    const channel = supabase
      .channel('partner-commissions-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_commissions', filter: `partner_id=eq.${partner.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_partner_payouts', filter: `partner_id=eq.${partner.id}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [partner, fetchData]);

  const commissionRate = Number(partner?.commission_rate || 0);
  const salesEarnings = sales.reduce((sum, s) => sum + Number(s.subscription_plans?.annual_price || 0) * commissionRate / 100, 0);
  const claimCommissions = commissions.reduce((sum, c) => sum + Number(c.total_commission), 0);
  const totalBonuses = commissions.reduce((sum, c) => sum + Number(c.sla_bonus) + Number(c.rating_bonus) + Number(c.volume_bonus), 0);
  const totalPenalties = Math.abs(commissions.reduce((sum, c) => sum + Number(c.penalty_deduction), 0));
  const totalEarnings = salesEarnings + claimCommissions;

  const pendingPayout = payouts.filter(p => p.status === 'pending').reduce((sum, p) => sum + Number(p.net_amount), 0);
  const paidAmount = payouts.filter(p => p.status === 'paid').reduce((sum, p) => sum + Number(p.net_amount), 0);

  const monthStart = startOfMonth(new Date()).toISOString();
  const thisMonthCommission = commissions
    .filter(c => c.created_at >= monthStart)
    .reduce((sum, c) => sum + Number(c.total_commission), 0);

  // Monthly trend data
  const monthlyTrend = (() => {
    const grouped: Record<string, number> = {};
    commissions.forEach(c => {
      const m = c.commission_month;
      grouped[m] = (grouped[m] || 0) + Number(c.total_commission);
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, total]) => ({ month, commission: total }));
  })();

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Commissions</h1>
        <p className="text-muted-foreground mb-6">Track your earnings, bonuses and payouts</p>

        {loading ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={24} /></CardContent></Card>
        ) : !partner ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center text-muted-foreground">Account not linked to a partner record.</CardContent></Card>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="shadow-card border-l-4 border-l-primary">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <IndianRupee size={16} className="text-primary" />
                    <p className="text-sm text-muted-foreground">Total Earned</p>
                  </div>
                  <p className="text-2xl font-heading font-bold text-primary">{formatCurrency(totalEarnings)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Sales + Claims</p>
                </CardContent>
              </Card>
              <Card className="shadow-card border-l-4 border-l-amber-500">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={16} className="text-amber-500" />
                    <p className="text-sm text-muted-foreground">Pending Payout</p>
                  </div>
                  <p className="text-2xl font-heading font-bold text-amber-600">{formatCurrency(pendingPayout)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{payouts.filter(p => p.status === 'pending').length} payout(s) pending</p>
                </CardContent>
              </Card>
              <Card className="shadow-card border-l-4 border-l-emerald-500">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <p className="text-sm text-muted-foreground">Already Paid</p>
                  </div>
                  <p className="text-2xl font-heading font-bold text-emerald-600">{formatCurrency(paidAmount)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{payouts.filter(p => p.status === 'paid').length} payout(s) completed</p>
                </CardContent>
              </Card>
              <Card className="shadow-card border-l-4 border-l-violet-500">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-violet-500" />
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                  <p className="text-2xl font-heading font-bold text-violet-600">{formatCurrency(thisMonthCommission)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{format(new Date(), 'MMMM yyyy')}</p>
                </CardContent>
              </Card>
            </div>

            {/* Performance Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
              <Card className="shadow-card">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Base Rate</p>
                  <p className="text-xl font-heading font-bold">{commissionRate}%</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground">Claims Processed</p>
                  <p className="text-xl font-heading font-bold">{commissions.length}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Award size={14} className="text-emerald-500" />
                    <p className="text-sm text-muted-foreground">Bonuses</p>
                  </div>
                  <p className="text-xl font-heading font-bold text-emerald-600">{formatCurrency(totalBonuses)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <AlertTriangle size={14} className="text-destructive" />
                    <p className="text-sm text-muted-foreground">Penalties</p>
                  </div>
                  <p className="text-xl font-heading font-bold text-destructive">{formatCurrency(totalPenalties)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly Trend Chart */}
            {monthlyTrend.length > 0 && (
              <Card className="shadow-card mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp size={18} />
                    Monthly Commission Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={(v) => `₹${v}`} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), 'Commission']} />
                      <Bar dataKey="commission" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            <Tabs defaultValue="claims">
              <TabsList>
                <TabsTrigger value="claims">Claim Commissions ({commissions.length})</TabsTrigger>
                <TabsTrigger value="sales">Sales Commissions ({sales.length})</TabsTrigger>
                <TabsTrigger value="payouts">Payout History ({payouts.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="claims" className="mt-4">
                <Card className="shadow-card">
                  <CardContent className="p-0">
                    {commissions.length === 0 ? (
                      <div className="p-12 text-center">
                        <Coins size={40} className="text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No claim commissions yet. Earnings will appear here once claims are completed.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead className="text-right">Claim Amt</TableHead>
                            <TableHead className="text-right">Base</TableHead>
                            <TableHead className="text-right">Bonuses</TableHead>
                            <TableHead className="text-right">Penalty</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commissions.map(c => {
                            const bonuses = Number(c.sla_bonus) + Number(c.rating_bonus) + Number(c.volume_bonus);
                            return (
                              <TableRow key={c.id}>
                                <TableCell>{c.commission_month}</TableCell>
                                <TableCell className="text-right">{formatCurrency(c.claim_amount)}</TableCell>
                                <TableCell className="text-right">{formatCurrency(c.base_commission_amount)} <span className="text-xs text-muted-foreground">({c.base_commission_rate}%)</span></TableCell>
                                <TableCell className="text-right text-emerald-600">{bonuses > 0 ? `+${formatCurrency(bonuses)}` : '-'}</TableCell>
                                <TableCell className="text-right text-destructive">{Number(c.penalty_deduction) < 0 ? formatCurrency(c.penalty_deduction) : '-'}</TableCell>
                                <TableCell className="text-right font-semibold">{formatCurrency(c.total_commission)}</TableCell>
                                <TableCell><Badge variant={c.status === 'aggregated' ? 'default' : 'outline'}>{c.status}</Badge></TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => { setSelectedCommission(c); setShowBreakdown(true); }}>
                                    <Eye size={14} />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sales" className="mt-4">
                <Card className="shadow-card">
                  <CardContent className="p-0">
                    {sales.length === 0 ? (
                      <div className="p-12 text-center">
                        <Coins size={40} className="text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No sales commissions yet.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead className="text-right">Sale Amount</TableHead>
                            <TableHead className="text-right">Commission</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sales.map(s => {
                            const amount = Number(s.subscription_plans?.annual_price || 0);
                            const commission = amount * commissionRate / 100;
                            return (
                              <TableRow key={s.id}>
                                <TableCell className="font-medium">{s.product_name}</TableCell>
                                <TableCell>{s.subscription_plans?.name || '—'}</TableCell>
                                <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                                <TableCell className="text-right text-primary font-medium">{formatCurrency(commission)}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{format(new Date(s.created_at), 'dd MMM yyyy')}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="payouts" className="mt-4">
                <Card className="shadow-card">
                  <CardContent className="p-0">
                    {payouts.length === 0 ? (
                      <div className="p-12 text-center">
                        <IndianRupee size={40} className="text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No payouts yet. Payouts are processed monthly after commission aggregation.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead className="text-right">Gross Amount</TableHead>
                            <TableHead className="text-right">TDS ({payouts[0]?.tds_rate || 10}%)</TableHead>
                            <TableHead className="text-right">Net Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Paid Date</TableHead>
                            <TableHead>Reference</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {payouts.map(p => (
                            <TableRow key={p.id}>
                              <TableCell className="font-medium">
                                {format(new Date(p.payout_month), 'MMMM yyyy')}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(Number(p.gross_amount))}</TableCell>
                              <TableCell className="text-right text-destructive">-{formatCurrency(Number(p.tds_amount))}</TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(Number(p.net_amount))}</TableCell>
                              <TableCell>
                                <Badge variant={p.status === 'paid' ? 'default' : 'outline'}
                                  className={p.status === 'paid' ? 'bg-emerald-600' : p.status === 'pending' ? 'border-amber-500 text-amber-600' : ''}>
                                  {p.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {p.paid_at ? format(new Date(p.paid_at), 'dd MMM yyyy') : '-'}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{p.payment_reference || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </motion.div>

      {/* Commission Breakdown Dialog */}
      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Commission Breakdown</DialogTitle>
          </DialogHeader>
          {selectedCommission && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Claim Amount</p>
                  <p className="font-semibold">{formatCurrency(Number(selectedCommission.claim_amount))}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">Base Rate</p>
                  <p className="font-semibold">{selectedCommission.base_commission_rate}%</p>
                </div>
              </div>

              <div className="border rounded-lg divide-y">
                <div className="flex justify-between p-3">
                  <span className="text-sm">Base Commission</span>
                  <span className="font-medium">{formatCurrency(Number(selectedCommission.base_commission_amount))}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-sm text-emerald-600">+ SLA Bonus</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(Number(selectedCommission.sla_bonus))}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-sm text-emerald-600">+ Rating Bonus</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(Number(selectedCommission.rating_bonus))}</span>
                </div>
                <div className="flex justify-between p-3">
                  <span className="text-sm text-emerald-600">+ Volume Bonus</span>
                  <span className="font-medium text-emerald-600">{formatCurrency(Number(selectedCommission.volume_bonus))}</span>
                </div>
                {Number(selectedCommission.penalty_deduction) < 0 && (
                  <div className="flex justify-between p-3">
                    <span className="text-sm text-destructive">Penalty</span>
                    <span className="font-medium text-destructive">{formatCurrency(Number(selectedCommission.penalty_deduction))}</span>
                  </div>
                )}
                <div className="flex justify-between p-3 bg-muted/30 font-bold">
                  <span>Total Commission</span>
                  <span className="text-primary">{formatCurrency(Number(selectedCommission.total_commission))}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{selectedCommission.status}</Badge>
                <span>•</span>
                <span>{selectedCommission.commission_month}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PartnerCommissions;
