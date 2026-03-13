import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard from '@/components/StatsCard';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Wrench, Users, ShoppingBag, Coins } from 'lucide-react';
import type { KPIMetric } from '@/types';

const PartnerDashboard = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [claims, setClaims] = useState<any[]>([]);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Find partner record linked to this user
      const { data: partnerData } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setPartner(partnerData);

      if (partnerData) {
        // Get assigned claims
        const { data: claimsData } = await supabase
          .from('service_claims')
          .select('*')
          .eq('assigned_partner_id', partnerData.id)
          .order('created_at', { ascending: false });
        setClaims(claimsData || []);

        // Get referred devices
        const { data: refData } = await supabase
          .from('customer_devices')
          .select('*, subscription_plans(name, annual_price)')
          .eq('referred_by_partner_id', partnerData.id)
          .order('created_at', { ascending: false });
        setReferrals(refData || []);
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={24} /></div>
      </DashboardLayout>
    );
  }

  const activeClaimsCount = claims.filter(c => c.status === 'in_progress' || c.status === 'pending').length;
  const resolvedClaimsCount = claims.filter(c => c.status === 'resolved').length;
  const totalSalesAmount = referrals
    .filter(r => r.status === 'active')
    .reduce((sum, r) => sum + Number(r.subscription_plans?.annual_price || 0), 0);
  const estimatedCommission = partner ? totalSalesAmount * Number(partner.commission_rate || 0) / 100 : 0;

  const metrics: KPIMetric[] = [
    { label: 'Active Claims', value: activeClaimsCount, trend: 'stable' as const, change: 0 },
    { label: 'Resolved Claims', value: resolvedClaimsCount, trend: 'up' as const, change: resolvedClaimsCount },
    { label: 'Referral Sales', value: referrals.length, trend: 'up' as const, change: referrals.length },
    { label: 'Est. Commission', value: `₹${estimatedCommission.toLocaleString('en-IN')}`, trend: 'up' as const, change: 0 },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Partner Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          {partner ? `Welcome, ${partner.name} — ${partner.partner_type} partner` : 'Your account is not yet linked to a partner record. Contact admin.'}
        </p>

        {partner ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {metrics.map((m, i) => <StatsCard key={i} metric={m} />)}
            </div>

            {claims.length > 0 && (
              <Card className="shadow-card mb-6">
                <CardHeader><CardTitle className="font-heading text-base">Recent Assigned Claims</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {claims.slice(0, 5).map(claim => (
                    <div key={claim.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">{claim.issue_type}</p>
                        <p className="text-xs text-muted-foreground">IMEI: {claim.imei_number}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        claim.status === 'resolved' ? 'bg-success/10 text-success' :
                        claim.status === 'in_progress' ? 'bg-primary/10 text-primary' :
                        'bg-warning/10 text-warning'
                      }`}>{claim.status}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Wrench size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Your user account is not linked to a partner record yet. Please contact the admin to link your account.</p>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerDashboard;
