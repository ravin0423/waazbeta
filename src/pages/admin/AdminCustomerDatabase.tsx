import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, MapPin, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface CustomerRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  devices: {
    id: string;
    product_name: string;
    status: string;
    created_at: string;
    google_location_pin: string | null;
    whatsapp_number: string;
    subscription_plans: { name: string } | null;
  }[];
}

const AdminCustomerDatabase = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetch = async () => {
      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone')
        .order('full_name');

      if (!profiles) { setLoading(false); return; }

      // Get all devices with plans
      const { data: devices } = await supabase
        .from('customer_devices')
        .select('id, user_id, product_name, status, created_at, google_location_pin, whatsapp_number, subscription_plans(name)');

      const devicesByUser = (devices || []).reduce((acc: Record<string, any[]>, d) => {
        if (!acc[d.user_id]) acc[d.user_id] = [];
        acc[d.user_id].push(d);
        return acc;
      }, {});

      const rows: CustomerRow[] = profiles
        .filter(p => devicesByUser[p.id]?.length > 0)
        .map(p => ({
          ...p,
          devices: devicesByUser[p.id] || [],
        }));

      setCustomers(rows);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  const daysSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Customer Database</h1>
            <p className="text-muted-foreground">Complete customer information and subscription details</p>
          </div>
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No customers found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone / WhatsApp</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Active Subscriptions</TableHead>
                    <TableHead>Active Since</TableHead>
                    <TableHead>Days Active</TableHead>
                    <TableHead>Claims</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => {
                    const activeDevices = c.devices.filter(d => d.status === 'active');
                    const allDevices = c.devices;
                    const earliest = activeDevices.length > 0
                      ? activeDevices.reduce((min, d) => d.created_at < min ? d.created_at : min, activeDevices[0].created_at)
                      : null;
                    const googleLink = allDevices.find(d => d.google_location_pin)?.google_location_pin;
                    const whatsapp = allDevices[0]?.whatsapp_number || c.phone || '—';

                    return (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{c.full_name}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{whatsapp}</TableCell>
                        <TableCell>
                          {googleLink ? (
                            <a href={googleLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary text-sm hover:underline">
                              <MapPin size={14} /> Map <ExternalLink size={12} />
                            </a>
                          ) : <span className="text-muted-foreground text-sm">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {activeDevices.length > 0 ? activeDevices.map(d => (
                              <span key={d.id} className="block text-xs bg-success/10 text-success px-2 py-0.5 rounded-full w-fit">
                                {d.subscription_plans?.name || d.product_name}
                              </span>
                            )) : (
                              <span className="text-xs text-muted-foreground">None active</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {earliest ? new Date(earliest).toLocaleDateString('en-IN') : '—'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {earliest ? `${daysSince(earliest)} days` : '—'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {/* Claims count - placeholder until claims table exists */}
                          0
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminCustomerDatabase;
