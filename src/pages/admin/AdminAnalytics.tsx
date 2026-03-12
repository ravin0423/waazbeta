import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { monthlyTrends } from '@/data/mockData';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(172, 55%, 30%)', 'hsl(38, 92%, 50%)', 'hsl(210, 70%, 50%)', 'hsl(0, 72%, 51%)'];

const channelData = [
  { name: 'Retail', value: 45 },
  { name: 'OEM', value: 25 },
  { name: 'Online', value: 20 },
  { name: 'Referral', value: 10 },
];

const regionData = [
  { region: 'Coonoor', users: 450 },
  { region: 'Chennai', users: 320 },
  { region: 'Coimbatore', users: 180 },
  { region: 'Bangalore', users: 90 },
  { region: 'Hyderabad', users: 45 },
];

const AdminAnalytics = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Analytics & Reporting</h1>
        <p className="text-muted-foreground mb-6">Detailed business intelligence and performance metrics</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Subscriber Growth</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 10%, 90%)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="subscriptions" stroke="hsl(172, 55%, 30%)" strokeWidth={2} dot={{ fill: 'hsl(172, 55%, 30%)' }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Acquisition Channels</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={channelData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Claims Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 10%, 90%)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="claims" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Regional Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={regionData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 10%, 90%)" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="region" fontSize={12} width={80} />
                  <Tooltip />
                  <Bar dataKey="users" fill="hsl(172, 55%, 30%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
