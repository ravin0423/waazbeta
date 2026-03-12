import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { repairPartners } from '@/data/mockData';
import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminPartners = () => {
  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Repair Partners</h1>
        <p className="text-muted-foreground mb-6">Manage authorized service partner network</p>

        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>SLA (days)</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Total Repairs</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {repairPartners.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.city}, {p.state}</TableCell>
                    <TableCell>{p.slaTurnaroundTime}</TableCell>
                    <TableCell>{p.commissionRate}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="text-accent fill-accent" />
                        <span>{p.qualityRating}</span>
                      </div>
                    </TableCell>
                    <TableCell>{p.totalRepairs}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${p.isActive ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
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

export default AdminPartners;
