import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Target, CheckCircle2, Star, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { differenceInDays, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { Progress } from '@/components/ui/progress';

interface PerformanceMetrics {
  slaCompliance: number;
  completionRate: number;
  rating: number;
  avgResolutionDays: number;
  totalAssigned: number;
  totalCompleted: number;
  totalWithinSla: number;
}

interface MonthlyTrend {
  month: string;
  sla: number;
  completion: number;
  rating: number;
}

const PartnerPerformance = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const { data: p } = await supabase.from('partners').select('*').eq('user_id', user.id).maybeSingle();
    setPartner(p);
    if (!p) { setLoading(false); return; }

    // Fetch all assignments for this partner
    const { data: assignments } = await supabase
      .from('claim_assignments')
      .select('id, status, created_at, updated_at, sla_deadline, claim_id')
      .eq('partner_id', p.id);

    // Fetch feedback for partner's claims
    const claimIds = (assignments || []).map(a => a.claim_id);
    let feedbacks: any[] = [];
    if (claimIds.length > 0) {
      const { data: fb } = await supabase
        .from('claim_feedback')
        .select('claim_id, rating')
        .in('claim_id', claimIds);
      feedbacks = fb || [];
    }

    const all = assignments || [];
    const completed = all.filter(a => a.status === 'completed');
    const withinSla = completed.filter(a => {
      if (a.sla_deadline) return new Date(a.updated_at) <= new Date(a.sla_deadline);
      return differenceInDays(new Date(a.updated_at), new Date(a.created_at)) <= (p.sla_turnaround_days || 7);
    });

    const avgRating = feedbacks.length > 0
      ? feedbacks.reduce((s, f) => s + Number(f.rating), 0) / feedbacks.length
      : p.quality_rating || 0;

    const avgRes = completed.length > 0
      ? completed.reduce((s, a) => s + differenceInDays(new Date(a.updated_at), new Date(a.created_at)), 0) / completed.length
      : 0;

    setMetrics({
      slaCompliance: completed.length > 0 ? (withinSla.length / completed.length) * 100 : 100,
      completionRate: all.length > 0 ? (completed.length / all.length) * 100 : 0,
      rating: avgRating,
      avgResolutionDays: avgRes,
      totalAssigned: all.length,
      totalCompleted: completed.length,
      totalWithinSla: withinSla.length,
    });

    // Build 6-month trend
    const monthlyTrends: MonthlyTrend[] = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const mStart = startOfMonth(monthDate);
      const mEnd = endOfMonth(monthDate);
      const label = format(monthDate, 'MMM yy');

      const monthAssignments = all.filter(a => {
        const d = new Date(a.created_at);
        return d >= mStart && d <= mEnd;
      });
      const monthCompleted = monthAssignments.filter(a => a.status === 'completed');
      const monthSla = monthCompleted.filter(a => {
        if (a.sla_deadline) return new Date(a.updated_at) <= new Date(a.sla_deadline);
        return differenceInDays(new Date(a.updated_at), new Date(a.created_at)) <= (p.sla_turnaround_days || 7);
      });

      const monthClaimIds = monthAssignments.map(a => a.claim_id);
      const monthFeedbacks = feedbacks.filter(f => monthClaimIds.includes(f.claim_id));
      const monthRating = monthFeedbacks.length > 0
        ? monthFeedbacks.reduce((s, f) => s + Number(f.rating), 0) / monthFeedbacks.length
        : 0;

      monthlyTrends.push({
        month: label,
        sla: monthCompleted.length > 0 ? Math.round((monthSla.length / monthCompleted.length) * 100) : 0,
        completion: monthAssignments.length > 0 ? Math.round((monthCompleted.length / monthAssignments.length) * 100) : 0,
        rating: Math.round(monthRating * 10) / 10,
      });
    }
    setTrends(monthlyTrends);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Real-time
  useEffect(() => {
    if (!partner) return;
    const ch = supabase
      .channel('partner-perf-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claim_assignments', filter: `partner_id=eq.${partner.id}` }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [partner, fetchAll]);

  const slaStatus = (val: number) => {
    if (val >= 95) return { label: 'On Target', variant: 'default' as const, color: 'text-emerald-600' };
    if (val >= 85) return { label: 'Needs Improvement', variant: 'outline' as const, color: 'text-amber-600' };
    return { label: 'Below Target', variant: 'destructive' as const, color: 'text-destructive' };
  };

  const trendIcon = (current: number, target: number) => {
    if (current >= target) return <TrendingUp size={14} className="text-emerald-500" />;
    if (current >= target * 0.9) return <Minus size={14} className="text-amber-500" />;
    return <TrendingDown size={14} className="text-destructive" />;
  };

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Performance</h1>
        <p className="text-muted-foreground mb-6">Track your service quality, SLA compliance and customer ratings</p>

        {loading ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={24} /></CardContent></Card>
        ) : !partner ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center text-muted-foreground">Account not linked to a partner record.</CardContent></Card>
        ) : !metrics ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center text-muted-foreground">No performance data available yet.</CardContent></Card>
        ) : (
          <>
            {/* Scoreboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="shadow-card border-t-4 border-t-primary">
                <CardContent className="p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target size={16} className="text-primary" />
                    <p className="text-sm text-muted-foreground">SLA Compliance</p>
                  </div>
                  <p className={`text-3xl font-heading font-bold ${slaStatus(metrics.slaCompliance).color}`}>
                    {metrics.slaCompliance.toFixed(1)}%
                  </p>
                  <Progress value={metrics.slaCompliance} className="mt-3 h-2" />
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Badge variant={slaStatus(metrics.slaCompliance).variant}>
                      {slaStatus(metrics.slaCompliance).label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Target: 95%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card border-t-4 border-t-blue-500">
                <CardContent className="p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle2 size={16} className="text-blue-500" />
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                  </div>
                  <p className="text-3xl font-heading font-bold text-blue-600">
                    {metrics.completionRate.toFixed(1)}%
                  </p>
                  <Progress value={metrics.completionRate} className="mt-3 h-2" />
                  <p className="text-xs text-muted-foreground mt-3">
                    {metrics.totalCompleted} of {metrics.totalAssigned} claims
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-t-4 border-t-amber-500">
                <CardContent className="p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Star size={16} className="text-amber-500" />
                    <p className="text-sm text-muted-foreground">Customer Rating</p>
                  </div>
                  <p className="text-3xl font-heading font-bold text-amber-600">
                    ★ {metrics.rating.toFixed(1)}
                  </p>
                  <Progress value={(metrics.rating / 5) * 100} className="mt-3 h-2" />
                  <p className="text-xs text-muted-foreground mt-3">Out of 5.0</p>
                </CardContent>
              </Card>

              <Card className="shadow-card border-t-4 border-t-violet-500">
                <CardContent className="p-5 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock size={16} className="text-violet-500" />
                    <p className="text-sm text-muted-foreground">Avg Resolution</p>
                  </div>
                  <p className="text-3xl font-heading font-bold text-violet-600">
                    {metrics.avgResolutionDays.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-3">
                    Days • SLA: {partner.sla_turnaround_days} days
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Performance vs Target */}
            <Card className="shadow-card mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Your Performance vs Targets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'SLA Compliance', value: metrics.slaCompliance, target: 95, unit: '%' },
                  { label: 'Completion Rate', value: metrics.completionRate, target: 90, unit: '%' },
                  { label: 'Customer Rating', value: metrics.rating, target: 4.5, unit: '/5' },
                  { label: 'Avg Resolution', value: metrics.avgResolutionDays, target: partner.sla_turnaround_days, unit: ' days', inverse: true },
                ].map((item) => {
                  const isGood = item.inverse ? item.value <= item.target : item.value >= item.target;
                  return (
                    <div key={item.label} className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="font-medium text-sm">{item.label}</span>
                      <div className="flex items-center gap-6">
                        <div className="text-center min-w-[60px]">
                          <p className="text-xs text-muted-foreground">You</p>
                          <p className={`font-bold ${isGood ? 'text-emerald-600' : 'text-destructive'}`}>
                            {item.value.toFixed(1)}{item.unit}
                          </p>
                        </div>
                        <div className="text-center min-w-[60px]">
                          <p className="text-xs text-muted-foreground">Target</p>
                          <p className="font-bold text-muted-foreground">
                            {item.inverse ? '≤' : '≥'}{item.target}{item.unit}
                          </p>
                        </div>
                        <div className="min-w-[28px] flex justify-center">
                          {item.inverse
                            ? trendIcon(item.target, item.value)
                            : trendIcon(item.value, item.target)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* 6-Month Trend */}
            {trends.some(t => t.sla > 0 || t.completion > 0) && (
              <Card className="shadow-card mb-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp size={18} />
                    6-Month Performance Trend
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={trends}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <YAxis yAxisId="pct" domain={[0, 100]} tick={{ fontSize: 12 }} className="fill-muted-foreground" tickFormatter={v => `${v}%`} />
                      <YAxis yAxisId="rating" orientation="right" domain={[0, 5]} tick={{ fontSize: 12 }} className="fill-muted-foreground" />
                      <Tooltip />
                      <Legend />
                      <Line yAxisId="pct" type="monotone" dataKey="sla" name="SLA %" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                      <Line yAxisId="pct" type="monotone" dataKey="completion" name="Completion %" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                      <Line yAxisId="rating" type="monotone" dataKey="rating" name="Rating" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-card">
                <CardContent className="p-5 text-center">
                  <p className="text-sm text-muted-foreground">Total Claims Assigned</p>
                  <p className="text-2xl font-heading font-bold mt-1">{metrics.totalAssigned}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5 text-center">
                  <p className="text-sm text-muted-foreground">Completed Within SLA</p>
                  <p className="text-2xl font-heading font-bold mt-1 text-emerald-600">{metrics.totalWithinSla}</p>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5 text-center">
                  <p className="text-sm text-muted-foreground">SLA Target Days</p>
                  <p className="text-2xl font-heading font-bold mt-1">{partner.sla_turnaround_days}</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerPerformance;
