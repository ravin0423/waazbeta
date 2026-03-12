import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';

const AdminFraudMonitoring = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <ShieldAlert size={28} className="text-primary" />
          <h1 className="font-heading text-2xl font-bold">Fraud Monitoring</h1>
        </div>
        <p className="text-muted-foreground mb-6">IMEI verification history and fraud detection alerts</p>

        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <ShieldAlert size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No fraud alerts yet. Alerts will appear here as claims are processed and verified.</p>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminFraudMonitoring;
