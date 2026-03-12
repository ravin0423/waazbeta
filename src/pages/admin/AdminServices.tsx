import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { claims, customerDevices, repairPartners } from '@/data/mockData';
import { motion } from 'framer-motion';

const AdminServices = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Service Bookings</h1>
        <p className="text-muted-foreground mb-6">Track all service and repair bookings</p>

        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Repair Partner</TableHead>
                  <TableHead>TAT (days)</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {claims.map(c => {
                  const device = customerDevices.find(d => d.id === c.deviceId);
                  const partner = repairPartners.find(p => p.id === c.repairPartnerId);
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-mono text-sm">{c.id.toUpperCase()}</TableCell>
                      <TableCell>{device?.brand} {device?.model}</TableCell>
                      <TableCell>{c.issueType}</TableCell>
                      <TableCell>{partner?.name || '—'}</TableCell>
                      <TableCell>{c.turnaroundDays || '—'}</TableCell>
                      <TableCell><StatusBadge status={c.status} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminServices;
