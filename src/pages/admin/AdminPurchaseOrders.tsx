import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';

const AdminPurchaseOrders = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Purchase Orders</h1>
        <p className="text-muted-foreground mb-6">Manage parts procurement and vendor orders</p>

        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <ShoppingCart size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No purchase orders yet. Orders will appear here once created.</p>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminPurchaseOrders;
