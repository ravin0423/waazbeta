import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { IndianRupee, TrendingUp, FileText, Wallet } from 'lucide-react';

const PartnerFinance = () => {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    // Get partner record for this user
    const { data: partnerData } = await supabase
      .from('partners')
      .select('id, name, commission_rate')
      .eq('user_id', user!.id)
      .limit(1)
      .single();

    if (!partnerData) { setLoading(false); return; }
    setPartnerId(partnerData.id);

    const { data: payoutData } = await supabase
      .from('finance_partner_payouts')
      .select('*')
      .eq('partner_id', partnerData.id)
      .order('payout_month', { ascending: false });

    setPayouts(payoutData || []);
    setLoading(false);
  };

  const formatCurrency = (v: number) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const totalEarnings = payouts.reduce((s, p) => s + Number(p.gross_amount), 0);
  const totalTDS = payouts.reduce((s, p) => s + Number(p.tds_amount), 0);
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.net_amount), 0);
  const totalPending = payouts.filter(p => p.status !== 'paid').reduce((s, p) => s + Number(p.net_amount), 0);

  const statusColor = (s: string) => s === 'paid' ? 'default' : s === 'processed' ? 'secondary' : 'outline';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">My Financials</h1>
          <p className="text-muted-foreground">Earnings, payouts, TDS deductions & monthly statements</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse h-24" />)}
          </div>
        ) : !partnerId ? (
          <Card><CardContent className="pt-6 text-center text-muted-foreground">Your partner account is not yet linked. Please contact admin.</CardContent></Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Earnings</p>
                    <p className="text-xl font-bold">{formatCurrency(totalEarnings)}</p>
                  </div>
                  <TrendingUp size={28} className="text-emerald-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">TDS Deducted</p>
                    <p className="text-xl font-bold text-red-500">{formatCurrency(totalTDS)}</p>
                  </div>
                  <FileText size={28} className="text-red-400" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Received</p>
                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
                  </div>
                  <Wallet size={28} className="text-emerald-500" />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Payouts</p>
                    <p className="text-xl font-bold text-orange-500">{formatCurrency(totalPending)}</p>
                  </div>
                  <IndianRupee size={28} className="text-orange-400" />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-lg">Payout History</CardTitle></CardHeader>
              <CardContent>
                {payouts.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No payouts recorded yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Month</TableHead>
                        <TableHead className="text-right">Gross</TableHead>
                        <TableHead className="text-right">TDS ({payouts[0]?.tds_rate || 10}%)</TableHead>
                        <TableHead className="text-right">Net Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Paid On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((p: any) => (
                        <TableRow key={p.id}>
                          <TableCell>{format(new Date(p.payout_month), 'MMM yyyy')}</TableCell>
                          <TableCell className="text-right">{formatCurrency(p.gross_amount)}</TableCell>
                          <TableCell className="text-right text-red-500">-{formatCurrency(p.tds_amount)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(p.net_amount)}</TableCell>
                          <TableCell>{p.payment_method?.replace('_', ' ') || '—'}</TableCell>
                          <TableCell>{p.payment_reference || '—'}</TableCell>
                          <TableCell><Badge variant={statusColor(p.status)}>{p.status.toUpperCase()}</Badge></TableCell>
                          <TableCell>{p.paid_at ? format(new Date(p.paid_at), 'dd MMM yyyy') : '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default PartnerFinance;
