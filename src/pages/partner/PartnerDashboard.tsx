import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { BarChart3 } from 'lucide-react';

const PartnerDashboard = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Partner Dashboard</h1>
        <p className="text-muted-foreground mb-6">Your sales performance and earnings</p>

        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <BarChart3 size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No sales data yet. Your performance metrics will appear here once sales are recorded.</p>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerDashboard;
