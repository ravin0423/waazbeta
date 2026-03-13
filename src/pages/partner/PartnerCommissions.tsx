import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Coins, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const PartnerCommissions = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: p } = await supabase.from('partners').select('*').eq('user_id', user.id).maybeSingle();
      setPartner(p);
      if (p) {
        const { data } = await supabase
          .from('customer_devices')
          .select('*, subscription_plans(name, annual_price)')
          .eq('referred_by_partner_id', p.id)
          .eq('status', 'active')
          .order('created_at', { ascending: false });
        setSales(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const commissionRate = Number(partner?.commission_rate || 0);
  const totalEarnings = sales.reduce((sum, s) => sum + Number(s.subscription_plans?.annual_price || 0) * commissionRate / 100, 0);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Commissions</h1>
        <p className="text-muted-foreground mb-6">Track your earnings and payouts</p>

        {loading ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={24} /></CardContent></Card>
        ) : !partner ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center text-muted-foreground">Account not linked to a partner record.</CardContent></Card>
        ) : sales.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Coins size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No commission data yet. Earnings will appear here once active sales are completed.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Commission Rate</p>
                  <p className="text-2xl font-heading font-bold">{commissionRate}%</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Active Sales</p>
                  <p className="text-2xl font-heading font-bold">{sales.length}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-heading font-bold text-primary">₹{totalEarnings.toLocaleString('en-IN')}</p>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-card">
              <CardContent className="p-0">
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
                          <TableCell>₹{amount.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-primary font-medium">₹{commission.toLocaleString('en-IN')}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{format(new Date(s.created_at), 'dd MMM yyyy')}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerCommissions;
