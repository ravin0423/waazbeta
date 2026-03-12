import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { customerDevices, subscriptionPlans } from '@/data/mockData';
import { Shield, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomerSubscriptions = () => {
  const devices = customerDevices.filter(d => d.customerId === 'c1');

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">My Subscriptions</h1>
        <p className="text-muted-foreground mb-6">Manage your device protection plans</p>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {subscriptionPlans.map(plan => (
            <Card key={plan.id} className={`shadow-card border-2 ${plan.code === 'complete' ? 'border-primary' : 'border-border'}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-heading text-lg">{plan.name}</CardTitle>
                  {plan.code === 'complete' && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full gradient-primary text-primary-foreground">Popular</span>
                  )}
                </div>
                <p className="text-3xl font-heading font-bold mt-2">₹{plan.annualPrice}<span className="text-sm font-normal text-muted-foreground">/year</span></p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {[
                    { label: 'Hardware Failure', covered: plan.coversHardwareFailure },
                    { label: 'Battery Issues', covered: plan.coversBattery },
                    { label: 'Motherboard', covered: plan.coversMotherboard },
                    { label: 'Accidental Damage', covered: plan.coversAccidentalDamage },
                    { label: 'Liquid Damage', covered: plan.coversLiquidDamage },
                  ].map(f => (
                    <li key={f.label} className="flex items-center gap-2 text-sm">
                      {f.covered ? <Check size={16} className="text-success" /> : <X size={16} className="text-muted-foreground" />}
                      <span className={f.covered ? 'text-foreground' : 'text-muted-foreground'}>{f.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Active subscriptions */}
        <h2 className="font-heading text-xl font-bold mb-4">Active Device Subscriptions</h2>
        <div className="space-y-3">
          {devices.map(d => {
            const plan = subscriptionPlans.find(p => p.id === d.subscriptionPlanId);
            const daysLeft = Math.ceil((new Date(d.subscriptionEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <Card key={d.id} className="shadow-card">
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield size={22} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{d.brand} {d.model}</p>
                      <p className="text-sm text-muted-foreground">{plan?.name} • IMEI: {d.imei}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}</p>
                      <p className="text-xs text-muted-foreground">{d.subscriptionStart} → {d.subscriptionEnd}</p>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default CustomerSubscriptions;
