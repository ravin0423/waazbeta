import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, Smartphone, Loader2, Check, X, Trash2, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import SubscriptionActivation from '@/components/SubscriptionActivation';
import RenewalModal from '@/components/RenewalModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { differenceInDays, format } from 'date-fns';

const getSubscriptionStatus = (device: any) => {
  if (!device.subscription_end) return { label: device.status, color: 'default' as const };
  const end = new Date(device.subscription_end);
  const today = new Date();
  const daysLeft = differenceInDays(end, today);

  if (daysLeft < 0) return { label: 'Expired', color: 'expired' as const, daysLeft };
  if (daysLeft <= 30) return { label: `Expires in ${daysLeft}d`, color: 'expiring' as const, daysLeft };
  return { label: `Active • ${daysLeft}d left`, color: 'active' as const, daysLeft };
};

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewalDevice, setRenewalDevice] = useState<any>(null);

  const fetchDevices = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('customer_devices')
      .select('*, gadget_categories(name), subscription_plans(id, name, code, annual_price, covers_hardware_failure, covers_battery, covers_motherboard, covers_accidental_damage, covers_liquid_damage)')
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold mb-1">Welcome back, {user?.fullName || 'User'}</h1>
            <p className="text-muted-foreground">Here's your gadget protection overview</p>
          </div>
          <Button onClick={() => navigate('/customer/register-device')} className="gap-2">
            <Smartphone size={16} /> Register New Device
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map(device => {
            const subStatus = getSubscriptionStatus(device);
            const showRenewButton = device.status === 'active' && device.subscription_end;
            const isExpired = subStatus.color === 'expired';
            const isExpiring = subStatus.color === 'expiring';

            return (
              <Card key={device.id} className="shadow-card">
                <CardHeader className="flex flex-row items-center gap-2 pb-3">
                  <Smartphone size={18} className="text-primary" />
                  <CardTitle className="text-base font-heading">{device.gadget_categories?.name || device.product_name}</CardTitle>
                  <span className={cn(
                    "ml-auto text-xs px-2 py-0.5 rounded-full font-medium",
                    device.status === 'active' && !isExpired && !isExpiring && 'bg-success/10 text-success',
                    device.status === 'pending' && 'bg-warning/10 text-warning',
                    isExpired && 'bg-destructive/10 text-destructive',
                    isExpiring && 'bg-warning/10 text-warning',
                    device.status !== 'active' && device.status !== 'pending' && 'bg-muted text-muted-foreground',
                  )}>
                    {device.subscription_end ? subStatus.label : device.status}
                  </span>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><span className="text-muted-foreground">Plan:</span> {device.subscription_plans?.name || '—'}</p>
                  <p><span className="text-muted-foreground">Serial:</span> {device.serial_number}</p>
                  {device.imei_number && <p><span className="text-muted-foreground">IMEI:</span> {device.imei_number}</p>}
                  <p><span className="text-muted-foreground">Price:</span> ₹{Number(device.subscription_plans?.annual_price || 0).toLocaleString('en-IN')}/yr</p>
                  {device.subscription_end && (
                    <p className="flex items-center gap-1">
                      <Clock size={12} className="text-muted-foreground" />
                      <span className="text-muted-foreground">Expires:</span> {format(new Date(device.subscription_end), 'dd MMM yyyy')}
                    </p>
                  )}
                  {device.auto_renew && (
                    <p className="flex items-center gap-1 text-xs text-success">
                      <RefreshCw size={10} /> Auto-renew enabled
                    </p>
                  )}
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

                  {/* Renewal button - color-coded */}
                  {showRenewButton && (
                    <Button
                      size="sm"
                      className={cn("mt-3 w-full gap-1.5",
                        isExpired && "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
                        isExpiring && "bg-warning hover:bg-warning/90 text-warning-foreground",
                        !isExpired && !isExpiring && "bg-info hover:bg-info/90 text-info-foreground",
                      )}
                      onClick={() => setRenewalDevice(device)}
                    >
                      {isExpired ? <><AlertTriangle size={14} /> Renew Now</> :
                       isExpiring ? <><Clock size={14} /> Renew Soon</> :
                       <><RefreshCw size={14} /> Renew / Upgrade</>}
                    </Button>
                  )}

                  {device.status === 'pending' && (
                    <Button variant="destructive" size="sm" className="mt-3 w-full" onClick={() => handleDelete(device.id)}>
                      <Trash2 size={14} className="mr-1" /> Delete Request
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Renewal Modal */}
      {renewalDevice && (
        <RenewalModal
          open={!!renewalDevice}
          onOpenChange={(open) => { if (!open) setRenewalDevice(null); }}
          device={renewalDevice}
          onRenewed={fetchDevices}
        />
      )}
    </DashboardLayout>
  );
};

export default CustomerDashboard;
