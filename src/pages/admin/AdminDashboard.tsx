import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { monthlyTrends, invoices, claims, customerDevices } from '@/data/mockData';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';
import type { KPIMetric } from '@/types';

const AdminDashboard = () => {
  const totalSubs = customerDevices.length;
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalClaims = claims.length;
  const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').length;

  const metrics: KPIMetric[] = [
    { label: 'Total Subscriptions', value: totalSubs, trend: 'up', change: 18 },
    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, trend: 'up', change: 24 },
    { label: 'Active Claims', value: claims.filter(c => c.status !== 'completed' && c.status !== 'rejected').length, trend: 'down', change: -5 },
    { label: 'Pending Invoices', value: pendingInvoices, trend: 'stable', change: 0 },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-6">Overview of WaaZ operations</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => <StatsCard key={i} metric={m} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Revenue Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(172, 55%, 30%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(172, 55%, 30%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 10%, 90%)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(172, 55%, 30%)" fill="url(#colorRevenue)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Subscriptions vs Claims</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 10%, 90%)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="subscriptions" fill="hsl(172, 55%, 30%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="claims" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'LTV:CAC Ratio', value: '18:1', desc: 'Target: 18:1' },
            { label: 'Gross Margin', value: '62%', desc: 'Target: 55-65%' },
            { label: 'Renewal Rate', value: '84%', desc: 'Target: >80%' },
          ].map(kpi => (
            <Card key={kpi.label} className="shadow-card">
              <CardContent className="p-5 text-center">
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-3xl font-heading font-bold text-primary mt-1">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
