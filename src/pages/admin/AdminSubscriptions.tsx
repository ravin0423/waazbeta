import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { customerDevices, subscriptionPlans } from '@/data/mockData';
import { motion } from 'framer-motion';
import type { KPIMetric } from '@/types';

const AdminSubscriptions = () => {
  const active = customerDevices.filter(d => d.status === 'active').length;
  const metrics: KPIMetric[] = [
    { label: 'Active Subscriptions', value: active, trend: 'up', change: 18 },
    { label: 'Standard Plans', value: customerDevices.filter(d => d.subscriptionPlanId === 'sp1').length, trend: 'stable', change: 0 },
    { label: 'Complete Plans', value: customerDevices.filter(d => d.subscriptionPlanId === 'sp2').length, trend: 'up', change: 25 },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Subscription Management</h1>
        <p className="text-muted-foreground mb-6">Monitor and manage all subscriptions</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {metrics.map((m, i) => <StatsCard key={i} metric={m} />)}
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Device</TableHead>
                  <TableHead>IMEI</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerDevices.map(d => {
                  const plan = subscriptionPlans.find(p => p.id === d.subscriptionPlanId);
                  return (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.brand} {d.model}</TableCell>
                      <TableCell className="font-mono text-sm">{d.imei}</TableCell>
                      <TableCell>{plan?.name}</TableCell>
                      <TableCell className="text-muted-foreground">{d.subscriptionStart}</TableCell>
                      <TableCell className="text-muted-foreground">{d.subscriptionEnd}</TableCell>
                      <TableCell><StatusBadge status={d.status} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminSubscriptions;
