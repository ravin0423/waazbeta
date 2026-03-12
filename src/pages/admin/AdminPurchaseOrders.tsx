import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { purchaseOrders } from '@/data/mockData';
import { motion } from 'framer-motion';

const AdminPurchaseOrders = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Purchase Orders</h1>
        <p className="text-muted-foreground mb-6">Manage parts procurement and vendor orders</p>

        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO #</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map(po => (
                  <TableRow key={po.id}>
                    <TableCell className="font-mono text-sm">{po.poNumber}</TableCell>
                    <TableCell>{po.vendor}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{po.items.join(', ')}</TableCell>
                    <TableCell className="font-medium">₹{po.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{po.date}</TableCell>
                    <TableCell><StatusBadge status={po.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminPurchaseOrders;
