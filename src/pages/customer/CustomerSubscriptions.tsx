import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Shield, Check, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const CustomerSubscriptions = () => {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*, gadget_categories(name)')
        .eq('is_active', true)
        .order('annual_price');
      setPlans(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={24} /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">My Subscriptions</h1>
        <p className="text-muted-foreground mb-6">Available device protection plans</p>

        {plans.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Shield size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No subscription plans available yet. Please check back later.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => (
              <Card key={plan.id} className="shadow-card">
                <CardHeader>
                  <CardTitle className="font-heading text-lg">{plan.name}</CardTitle>
                  {plan.gadget_categories?.name && (
                    <p className="text-xs text-muted-foreground">{plan.gadget_categories.name}</p>
                  )}
                  <p className="text-3xl font-heading font-bold mt-2">₹{Number(plan.annual_price).toLocaleString('en-IN')}<span className="text-sm font-normal text-muted-foreground">/year</span></p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {[
                      { label: 'Hardware Failure', covered: plan.covers_hardware_failure },
                      { label: 'Battery Issues', covered: plan.covers_battery },
                      { label: 'Motherboard', covered: plan.covers_motherboard },
                      { label: 'Accidental Damage', covered: plan.covers_accidental_damage },
                      { label: 'Liquid Damage', covered: plan.covers_liquid_damage },
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
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default CustomerSubscriptions;
