import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Smartphone } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomerDashboard = () => {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Welcome back, {user?.fullName || 'User'}</h1>
        <p className="text-muted-foreground mb-6">Here's your device protection overview</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Smartphone size={18} className="text-primary" />
              <CardTitle className="text-base font-heading">Your Devices</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Smartphone size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No devices registered yet. Contact support to add your devices.</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center gap-2 pb-3">
              <Shield size={18} className="text-primary" />
              <CardTitle className="text-base font-heading">Recent Claims</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <Shield size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No claims submitted yet.</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
