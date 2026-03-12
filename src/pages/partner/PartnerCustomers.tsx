import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';

const customers = [
  { name: 'Suresh Menon', email: 'suresh@email.com', plan: 'WaaZ+ Complete', device: 'Samsung S23', date: '2026-02-15', status: 'active' },
  { name: 'Deepa Nair', email: 'deepa@email.com', plan: 'WaaZ Standard', device: 'iPhone 14', date: '2026-02-28', status: 'active' },
  { name: 'Karthik Raj', email: 'karthik@email.com', plan: 'WaaZ+ Complete', device: 'OnePlus 12', date: '2026-03-05', status: 'pending' },
  { name: 'Lakshmi Iyer', email: 'lakshmi@email.com', plan: 'WaaZ Standard', device: 'Pixel 8', date: '2026-03-10', status: 'active' },
];

const PartnerCustomers = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">My Customers</h1>
        <p className="text-muted-foreground mb-6">Customers acquired through your referrals</p>

        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.email}</TableCell>
                    <TableCell>{c.plan}</TableCell>
                    <TableCell>{c.device}</TableCell>
                    <TableCell className="text-muted-foreground">{c.date}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${c.status === 'active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                        {c.status}
                      </span>
                    </TableCell>
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

export default PartnerCustomers;
