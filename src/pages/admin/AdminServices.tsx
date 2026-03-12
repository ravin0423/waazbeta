import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';

const AdminServices = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Service Bookings</h1>
        <p className="text-muted-foreground mb-6">Track all service and repair bookings</p>

        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Wrench size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No service bookings yet. Bookings will appear here once customers submit claims.</p>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminServices;
