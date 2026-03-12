import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { customerDevices, claims, subscriptionPlans } from '@/data/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, FileText, Smartphone, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import type { KPIMetric } from '@/types';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const devices = customerDevices.filter(d => d.customerId === 'c1');
  const userClaims = claims.filter(c => c.customerId === 'c1');

  const metrics: KPIMetric[] = [
    { label: 'Active Devices', value: devices.filter(d => d.status === 'active').length, trend: 'stable', change: 0 },
    { label: 'Active Subscriptions', value: devices.length, trend: 'up', change: 100 },
    { label: 'Total Claims', value: userClaims.length, trend: 'stable', change: 0 },
    { label: 'Claims Resolved', value: userClaims.filter(c => c.status === 'completed').length, trend: 'up', change: 50 },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Welcome back, {user?.fullName || 'User'}</h1>
        <p className="text-muted-foreground mb-6">Here's your device protection overview</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => <StatsCard key={i} metric={m} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Devices */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Smartphone size={18} className="text-primary" />
              <CardTitle className="text-base font-heading">Your Devices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {devices.map(d => {
                const plan = subscriptionPlans.find(p => p.id === d.subscriptionPlanId);
                return (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium text-sm">{d.brand} {d.model}</p>
                      <p className="text-xs text-muted-foreground">IMEI: {d.imei}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{plan?.name}</p>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={d.status} />
                      <p className="text-xs text-muted-foreground mt-1">Expires: {d.subscriptionEnd}</p>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Claims */}
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <FileText size={18} className="text-primary" />
              <CardTitle className="text-base font-heading">Recent Claims</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {userClaims.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium text-sm">{c.issueType}</p>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Filed: {c.claimDate}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={c.status} />
                    {c.turnaroundDays && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 justify-end">
                        <Clock size={10} /> {c.turnaroundDays} days
                      </div>
                    )}
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

export default CustomerDashboard;
