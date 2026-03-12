import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

const PartnerSales = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Sales</h1>
        <p className="text-muted-foreground mb-6">Track all subscription sales</p>

        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <ShoppingBag size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No sales recorded yet.</p>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerSales;
