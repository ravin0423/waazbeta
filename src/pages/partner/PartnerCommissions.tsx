import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

const PartnerCommissions = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Commissions</h1>
        <p className="text-muted-foreground mb-6">Track your earnings and payouts</p>

        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Coins size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No commission data yet. Earnings will appear here once sales are completed.</p>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerCommissions;
