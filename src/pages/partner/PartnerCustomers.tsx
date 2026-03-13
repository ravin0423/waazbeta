import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Users, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const PartnerCustomers = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const { data: partner } = await supabase.from('partners').select('id').eq('user_id', user.id).maybeSingle();
      if (partner) {
        const { data } = await supabase
          .from('customer_devices')
          .select('*, profiles:user_id(full_name, email, phone), subscription_plans(name)')
          .eq('referred_by_partner_id', partner.id)
          .order('created_at', { ascending: false });

        // Group by user
        const grouped: Record<string, any> = {};
        (data || []).forEach(d => {
          if (!grouped[d.user_id]) {
            grouped[d.user_id] = {
              user_id: d.user_id,
              name: (d.profiles as any)?.full_name || '—',
              email: (d.profiles as any)?.email || '—',
              phone: (d.profiles as any)?.phone || d.whatsapp_number,
              devices: [],
            };
          }
          grouped[d.user_id].devices.push(d);
        });
        setCustomers(Object.values(grouped));
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">My Customers</h1>
        <p className="text-muted-foreground mb-6">Customers acquired through your referrals</p>

        {loading ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={24} /></CardContent></Card>
        ) : customers.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Users size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No customers yet. Referral data will appear here once customers sign up through you.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-card">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Subscriptions</TableHead>
                    <TableHead>Active Devices</TableHead>
                    <TableHead>First Referral</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map(c => {
                    const activeCount = c.devices.filter((d: any) => d.status === 'active').length;
                    const earliest = c.devices.reduce((min: string, d: any) => d.created_at < min ? d.created_at : min, c.devices[0].created_at);
                    return (
                      <TableRow key={c.user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{c.name}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{c.phone || '—'}</TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {c.devices.map((d: any) => (
                              <Badge key={d.id} variant={d.status === 'active' ? 'default' : 'secondary'} className="text-xs mr-1">
                                {d.subscription_plans?.name || d.product_name}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{activeCount}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(earliest), 'dd MMM yyyy')}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerCustomers;
