import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { partnerSales, monthlyTrends } from '@/data/mockData';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { KPIMetric } from '@/types';

const PartnerDashboard = () => {
  const totalSales = partnerSales.length;
  const totalRevenue = partnerSales.reduce((s, ps) => s + ps.amount, 0);
  const totalCommission = partnerSales.reduce((s, ps) => s + ps.commission, 0);
  const pendingSales = partnerSales.filter(ps => ps.status === 'pending').length;

  const metrics: KPIMetric[] = [
    { label: 'Total Sales', value: totalSales, trend: 'up', change: 33 },
    { label: 'Revenue Generated', value: `₹${totalRevenue.toLocaleString()}`, trend: 'up', change: 28 },
    { label: 'Total Commission', value: `₹${totalCommission.toFixed(0)}`, trend: 'up', change: 28 },
    { label: 'Pending', value: pendingSales, trend: 'stable', change: 0 },
  ];

  const salesByMonth = monthlyTrends.map(m => ({ month: m.month, sales: Math.round(m.subscriptions * 0.15) }));

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Partner Dashboard</h1>
        <p className="text-muted-foreground mb-6">Your sales performance and earnings</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => <StatsCard key={i} metric={m} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Monthly Sales</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={salesByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 10%, 90%)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="sales" fill="hsl(172, 55%, 30%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Recent Sales</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {partnerSales.slice(0, 4).map(sale => (
                <div key={sale.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium text-sm">{sale.customerName}</p>
                    <p className="text-xs text-muted-foreground">{sale.planSold} • {sale.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">₹{sale.amount}</p>
                    <p className="text-xs text-success">+₹{sale.commission} commission</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerDashboard;
