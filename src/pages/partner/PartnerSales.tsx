import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { partnerSales } from '@/data/mockData';
import { motion } from 'framer-motion';

const PartnerSales = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Sales</h1>
        <p className="text-muted-foreground mb-6">Track all subscription sales</p>

        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Plan Sold</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partnerSales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.customerName}</TableCell>
                    <TableCell>{sale.planSold}</TableCell>
                    <TableCell>₹{sale.amount.toLocaleString()}</TableCell>
                    <TableCell className="text-success">₹{sale.commission.toFixed(0)}</TableCell>
                    <TableCell className="text-muted-foreground">{sale.date}</TableCell>
                    <TableCell><StatusBadge status={sale.status} /></TableCell>
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

export default PartnerSales;
