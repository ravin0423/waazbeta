import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const PartnerSales = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: partner } = await supabase.from('partners').select('id').eq('user_id', user.id).maybeSingle();
      if (partner) {
        const { data } = await supabase
          .from('customer_devices')
          .select('*, subscription_plans(name, annual_price), profiles:user_id(full_name, email)')
          .eq('referred_by_partner_id', partner.id)
          .order('created_at', { ascending: false });
        setSales(data || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Sales</h1>
        <p className="text-muted-foreground mb-6">Track all subscription sales from your referrals</p>

        {loading ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={24} /></CardContent></Card>
        ) : sales.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <ShoppingBag size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No sales recorded yet.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{(s.profiles as any)?.full_name || '—'}</TableCell>
                      <TableCell>{s.product_name}</TableCell>
                      <TableCell>{s.subscription_plans?.name || '—'}</TableCell>
                      <TableCell>₹{Number(s.subscription_plans?.annual_price || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
                        <Badge variant={s.status === 'active' ? 'default' : 'secondary'}>{s.status}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(s.created_at), 'dd MMM yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerSales;
