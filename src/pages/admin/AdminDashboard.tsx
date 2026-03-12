import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import type { KPIMetric } from '@/types';
import { Users, Shield, MapPin, Wrench } from 'lucide-react';

const AdminDashboard = () => {
  const [counts, setCounts] = useState({ profiles: 0, plans: 0, regions: 0, partners: 0, categories: 0 });

  useEffect(() => {
    const fetchCounts = async () => {
      const [profiles, plans, regions, partners, categories] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('subscription_plans').select('id', { count: 'exact', head: true }),
        supabase.from('regions').select('id', { count: 'exact', head: true }),
        supabase.from('partners').select('id', { count: 'exact', head: true }),
        supabase.from('gadget_categories').select('id', { count: 'exact', head: true }),
      ]);
      setCounts({
        profiles: profiles.count || 0,
        plans: plans.count || 0,
        regions: regions.count || 0,
        partners: partners.count || 0,
        categories: categories.count || 0,
      });
    };
    fetchCounts();
  }, []);

  const metrics: KPIMetric[] = [
    { label: 'Registered Users', value: counts.profiles, trend: 'stable', change: 0 },
    { label: 'Subscription Plans', value: counts.plans, trend: 'stable', change: 0 },
    { label: 'Active Regions', value: counts.regions, trend: 'stable', change: 0 },
    { label: 'Repair Partners', value: counts.partners, trend: 'stable', change: 0 },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Admin Dashboard</h1>
        <p className="text-muted-foreground mb-6">Overview of WaaZ operations</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {metrics.map((m, i) => <StatsCard key={i} metric={m} />)}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <Shield size={40} className="text-primary mx-auto mb-3" />
              <h3 className="font-heading font-semibold mb-1">Subscription Plans</h3>
              <p className="text-sm text-muted-foreground">{counts.plans} plans configured across {counts.categories} gadget categories</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-8 text-center">
              <Wrench size={40} className="text-primary mx-auto mb-3" />
              <h3 className="font-heading font-semibold mb-1">Partner Network</h3>
              <p className="text-sm text-muted-foreground">{counts.partners} repair partners across {counts.regions} regions</p>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
