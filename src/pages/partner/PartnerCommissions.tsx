import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { partnerSales } from '@/data/mockData';
import { motion } from 'framer-motion';
import type { KPIMetric } from '@/types';

const PartnerCommissions = () => {
  const completed = partnerSales.filter(s => s.status === 'completed');
  const pending = partnerSales.filter(s => s.status === 'pending');
  const totalEarned = completed.reduce((s, p) => s + p.commission, 0);
  const totalPending = pending.reduce((s, p) => s + p.commission, 0);

  const metrics: KPIMetric[] = [
    { label: 'Total Earned', value: `₹${totalEarned.toFixed(0)}`, trend: 'up', change: 22 },
    { label: 'Pending Payout', value: `₹${totalPending.toFixed(0)}`, trend: 'stable', change: 0 },
    { label: 'Commission Rate', value: '10%', trend: 'stable', change: 0 },
    { label: 'Avg per Sale', value: `₹${(totalEarned / (completed.length || 1)).toFixed(0)}`, trend: 'up', change: 5 },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Commissions</h1>
        <p className="text-muted-foreground mb-6">Track your earnings and payouts</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => <StatsCard key={i} metric={m} />)}
        </div>

        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-heading text-base">Commission History</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {partnerSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium text-sm">{sale.customerName}</p>
                  <p className="text-xs text-muted-foreground">{sale.planSold} • {sale.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-success">₹{sale.commission.toFixed(0)}</p>
                  <p className="text-xs text-muted-foreground">{sale.status === 'completed' ? 'Paid' : 'Pending'}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerCommissions;
