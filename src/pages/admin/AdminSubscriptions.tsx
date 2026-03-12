import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Loader2, Shield } from 'lucide-react';
import type { KPIMetric } from '@/types';

const AdminSubscriptions = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*, gadget_categories(name)')
        .order('created_at', { ascending: false });
      setPlans(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const metrics: KPIMetric[] = [
    { label: 'Total Plans', value: plans.length, trend: 'stable', change: 0 },
    { label: 'Active Plans', value: plans.filter(p => p.is_active).length, trend: 'stable', change: 0 },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Subscription Management</h1>
        <p className="text-muted-foreground mb-6">Monitor all subscription plans</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {metrics.map((m, i) => <StatsCard key={i} metric={m} />)}
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12">
                <Shield size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No subscription plans yet. Go to Subscription Plans to create one.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Annual Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-mono text-sm">{p.code}</TableCell>
                      <TableCell>{p.gadget_categories?.name || 'All'}</TableCell>
                      <TableCell>₹{Number(p.annual_price).toLocaleString('en-IN')}</TableCell>
                      <TableCell><StatusBadge status={p.is_active ? 'active' : 'expired'} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminSubscriptions;
