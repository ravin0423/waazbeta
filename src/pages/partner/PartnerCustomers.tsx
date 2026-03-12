import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

const PartnerCustomers = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">My Customers</h1>
        <p className="text-muted-foreground mb-6">Customers acquired through your referrals</p>

        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Users size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No customers yet. Referral data will appear here once customers sign up through you.</p>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerCustomers;
