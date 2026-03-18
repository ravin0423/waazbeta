import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Coins, Loader2, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';

const PartnerCommissions = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: p } = await supabase.from('partners').select('*').eq('user_id', user.id).maybeSingle();
      setPartner(p);
      if (p) {
        const [{ data: salesData }, { data: commData }] = await Promise.all([
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
        ]);
        setSales(salesData || []);
        setCommissions(commData || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const commissionRate = Number(partner?.commission_rate || 0);
  const salesEarnings = sales.reduce((sum, s) => sum + Number(s.subscription_plans?.annual_price || 0) * commissionRate / 100, 0);
  const claimCommissions = commissions.reduce((sum, c) => sum + Number(c.total_commission), 0);
  const totalBonuses = commissions.reduce((sum, c) => sum + Number(c.sla_bonus) + Number(c.rating_bonus) + Number(c.volume_bonus), 0);
  const totalPenalties = Math.abs(commissions.reduce((sum, c) => sum + Number(c.penalty_deduction), 0));
  const totalEarnings = salesEarnings + claimCommissions;

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Base Rate</p>
                  <p className="text-2xl font-heading font-bold">{commissionRate}%</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-heading font-bold text-primary">{formatCurrency(totalEarnings)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-1">
                    <Award size={14} className="text-emerald-500" />
                    <p className="text-sm text-muted-foreground">Bonuses Earned</p>
                  </div>
                  <p className="text-2xl font-heading font-bold text-emerald-600">{formatCurrency(totalBonuses)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <div className="flex items-center gap-1">
                    <AlertTriangle size={14} className="text-destructive" />
                    <p className="text-sm text-muted-foreground">Penalties</p>
                  </div>
                  <p className="text-2xl font-heading font-bold text-destructive">{formatCurrency(totalPenalties)}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Claims Processed</p>
                  <p className="text-2xl font-heading font-bold">{commissions.length}</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue={commissions.length > 0 ? 'claims' : 'sales'}>
              <TabsList>
                <TabsTrigger value="claims">Claim Commissions ({commissions.length})</TabsTrigger>
                <TabsTrigger value="sales">Sales Commissions ({sales.length})</TabsTrigger>
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
                            <TableHead className="text-right">SLA Bonus</TableHead>
                            <TableHead className="text-right">Rating Bonus</TableHead>
                            <TableHead className="text-right">Penalty</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {commissions.map(c => (
                            <TableRow key={c.id}>
                              <TableCell>{c.commission_month}</TableCell>
                              <TableCell className="text-right">{formatCurrency(c.claim_amount)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(c.base_commission_amount)} <span className="text-xs text-muted-foreground">({c.base_commission_rate}%)</span></TableCell>
                              <TableCell className="text-right text-emerald-600">{Number(c.sla_bonus) > 0 ? `+${formatCurrency(c.sla_bonus)}` : '-'}</TableCell>
                              <TableCell className="text-right text-emerald-600">{Number(c.rating_bonus) > 0 ? `+${formatCurrency(c.rating_bonus)}` : '-'}</TableCell>
                              <TableCell className="text-right text-destructive">{Number(c.penalty_deduction) < 0 ? formatCurrency(c.penalty_deduction) : '-'}</TableCell>
                              <TableCell className="text-right font-semibold">{formatCurrency(c.total_commission)}</TableCell>
                              <TableCell><Badge variant={c.status === 'aggregated' ? 'default' : 'outline'}>{c.status}</Badge></TableCell>
                            </TableRow>
                          ))}
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
                            <TableHead>Sale Amount</TableHead>
                            <TableHead>Commission</TableHead>
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
                                <TableCell>{formatCurrency(amount)}</TableCell>
                                <TableCell className="text-primary font-medium">{formatCurrency(commission)}</TableCell>
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
            </Tabs>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerCommissions;
