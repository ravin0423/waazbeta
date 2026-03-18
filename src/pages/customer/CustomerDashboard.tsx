import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Smartphone, Loader2, Check, X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import SubscriptionActivation from '@/components/SubscriptionActivation';
import { toast } from 'sonner';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('customer_devices')
      .select('*, gadget_categories(name), subscription_plans(name, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setDevices(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDevices(); }, [user]);

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Are you sure you want to delete this pending subscription request?')) return;
    const { error } = await supabase.from('customer_devices').delete().eq('id', deviceId).eq('status', 'pending');
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Subscription request deleted');
    fetchDevices();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={24} /></div>
      </DashboardLayout>
    );
  }

  const hasActiveSubscription = devices.length > 0;

  if (!hasActiveSubscription) {
    return (
      <DashboardLayout>
        <SubscriptionActivation onActivated={fetchDevices} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Welcome back, {user?.fullName || 'User'}</h1>
        <p className="text-muted-foreground mb-6">Here's your gadget protection overview</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map(device => (
            <Card key={device.id} className="shadow-card">
              <CardHeader className="flex flex-row items-center gap-2 pb-3">
                <Smartphone size={18} className="text-primary" />
                <CardTitle className="text-base font-heading">{device.gadget_categories?.name || device.product_name}</CardTitle>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
                  device.status === 'active' ? 'bg-success/10 text-success' :
                  device.status === 'pending' ? 'bg-warning/10 text-warning' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {device.status}
                </span>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><span className="text-muted-foreground">Plan:</span> {device.subscription_plans?.name || '—'}</p>
                <p><span className="text-muted-foreground">Serial:</span> {device.serial_number}</p>
                {device.imei_number && <p><span className="text-muted-foreground">IMEI:</span> {device.imei_number}</p>}
                <p><span className="text-muted-foreground">Price:</span> ₹{Number(device.subscription_plans?.annual_price || 0).toLocaleString('en-IN')}/yr</p>
                {device.subscription_plans && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[
                      { label: 'Hardware', v: device.subscription_plans.covers_hardware_failure },
                      { label: 'Battery', v: device.subscription_plans.covers_battery },
                      { label: 'Motherboard', v: device.subscription_plans.covers_motherboard },
                      { label: 'Accidental', v: device.subscription_plans.covers_accidental_damage },
                      { label: 'Liquid', v: device.subscription_plans.covers_liquid_damage },
                    ].map(f => (
                      <span key={f.label} className={`inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded ${f.v ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {f.v ? <Check size={10} /> : <X size={10} />} {f.label}
                      </span>
                    ))}
                  </div>
                )}
                {device.status === 'pending' && (
                  <Button variant="destructive" size="sm" className="mt-3 w-full" onClick={() => handleDelete(device.id)}>
                    <Trash2 size={14} className="mr-1" /> Delete Request
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
