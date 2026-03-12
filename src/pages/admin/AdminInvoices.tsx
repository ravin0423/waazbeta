import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

const AdminInvoices = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Invoices</h1>
        <p className="text-muted-foreground mb-6">Manage billing and payment records</p>

        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <FileText size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No invoices yet. Invoices will appear here once transactions are recorded.</p>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminInvoices;
