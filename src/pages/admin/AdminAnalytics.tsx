import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import StatsCard from '@/components/StatsCard';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { CalendarIcon, Download, TrendingUp, Users, Shield, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { KPIMetric } from '@/types';
import type { DateRange } from 'react-day-picker';

const COLORS = ['hsl(172, 55%, 30%)', 'hsl(38, 92%, 50%)', 'hsl(210, 70%, 50%)', 'hsl(0, 72%, 51%)', 'hsl(280, 60%, 50%)'];

const presetRanges = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'Last 12 months', value: '12m' },
  { label: 'Custom', value: 'custom' },
];

const AdminAnalytics = () => {
  const [preset, setPreset] = useState('6m');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 6),
    to: new Date(),
  });
  const [showCalendar, setShowCalendar] = useState(false);

  // DB data
  const [plans, setPlans] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [plansRes, catsRes, partnersRes, profilesRes, eventsRes] = await Promise.all([
        supabase.from('subscription_plans').select('*'),
        supabase.from('gadget_categories').select('*'),
        supabase.from('partners').select('*'),
        supabase.from('profiles').select('id, created_at'),
        supabase.from('analytics_events').select('*'),
      ]);
      if (plansRes.data) setPlans(plansRes.data);
      if (catsRes.data) setCategories(catsRes.data);
      if (partnersRes.data) setPartners(partnersRes.data);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (eventsRes.data) setAnalyticsEvents(eventsRes.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (preset === 'custom') return;
    const now = new Date();
    const map: Record<string, Date> = {
      '7d': subDays(now, 7),
      '30d': subDays(now, 30),
      '3m': subMonths(now, 3),
      '6m': subMonths(now, 6),
      '12m': subMonths(now, 12),
    };
    setDateRange({ from: map[preset], to: now });
  }, [preset]);

  // Computed analytics
  const filteredProfiles = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return profiles;
    return profiles.filter(p => {
      const d = new Date(p.created_at);
      return isWithinInterval(d, { start: dateRange.from!, end: dateRange.to! });
    });
  }, [profiles, dateRange]);

  const filteredEvents = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return analyticsEvents;
    return analyticsEvents.filter(e => {
      const d = new Date(e.event_date);
      return isWithinInterval(d, { start: dateRange.from!, end: dateRange.to! });
    });
  }, [analyticsEvents, dateRange]);

  const metrics: KPIMetric[] = useMemo(() => [
    { label: 'Total Users', value: filteredProfiles.length, trend: 'up' as const, change: filteredProfiles.length, icon: 'users' },
    { label: 'Subscription Plans', value: plans.filter(p => p.is_active).length, trend: 'stable' as const, change: 0 },
    { label: 'Active Partners', value: partners.filter(p => p.is_active).length, trend: 'up' as const, change: partners.length },
    { label: 'Gadget Categories', value: categories.filter(c => c.is_active).length, trend: 'stable' as const, change: 0 },
  ], [filteredProfiles, plans, partners, categories]);

  // Monthly user signups trend
  const userTrend = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
    return months.map(m => {
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const count = profiles.filter(p => {
        const d = new Date(p.created_at);
        return isWithinInterval(d, { start, end });
      }).length;
      return { month: format(m, 'MMM yy'), users: count };
    });
  }, [profiles, dateRange]);

  // Plans by category
  const plansByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    plans.forEach(p => {
      const cat = categories.find(c => c.id === p.gadget_category_id);
      const name = cat?.name || 'General';
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [plans, categories]);

  // Partners by region
  const partnersByRegion = useMemo(() => {
    const map: Record<string, number> = {};
    partners.forEach(p => {
      const key = p.city || p.state || 'Unknown';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([region, count]) => ({ region, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [partners]);

  // Plan pricing comparison
  const pricingData = useMemo(() => {
    return plans.filter(p => p.is_active).map(p => {
      const cat = categories.find(c => c.id === p.gadget_category_id);
      return { name: p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name, price: Number(p.annual_price), category: cat?.name || 'General' };
    });
  }, [plans, categories]);

  // Events trend
  const eventsTrend = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return [];
    const months = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
    return months.map(m => {
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const monthEvents = filteredEvents.filter(e => {
        const d = new Date(e.event_date);
        return isWithinInterval(d, { start, end });
      });
      return {
        month: format(m, 'MMM yy'),
        subscriptions: monthEvents.filter(e => e.event_type === 'subscription').length,
        claims: monthEvents.filter(e => e.event_type === 'claim').length,
        revenue: monthEvents.filter(e => e.event_type === 'revenue').reduce((s: number, e: any) => s + Number(e.amount || 0), 0),
      };
    });
  }, [filteredEvents, dateRange]);

  // CSV Export
  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) { return; }
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportAllAnalytics = () => {
    const rows = [
      ...userTrend.map(r => ({ ...r, type: 'user_trend' })),
      ...plansByCategory.map(r => ({ ...r, type: 'plans_by_category' })),
      ...partnersByRegion.map(r => ({ ...r, type: 'partners_by_region' })),
      ...pricingData.map(r => ({ ...r, type: 'pricing' })),
    ];
    if (rows.length === 0) {
      // Export summary
      exportCSV(metrics.map(m => ({ metric: m.label, value: m.value })), 'waaz_analytics_summary');
    } else {
      exportCSV(rows, 'waaz_analytics');
    }
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold mb-1">Analytics & Insights</h1>
            <p className="text-muted-foreground">Advanced business intelligence from live data</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={preset} onValueChange={setPreset}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presetRanges.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>

            {preset === 'custom' && (
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <CalendarIcon size={14} />
                    {dateRange?.from ? format(dateRange.from, 'MMM d') : 'Start'} – {dateRange?.to ? format(dateRange.to, 'MMM d') : 'End'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(range) => { setDateRange(range); if (range?.from && range?.to) setShowCalendar(false); }}
                    numberOfMonths={2}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}

            <Button variant="outline" onClick={exportAllAnalytics} className="gap-2">
              <Download size={14} /> Export CSV
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map((m, i) => <StatsCard key={i} metric={m} />)}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-heading text-base">User Growth</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => exportCSV(userTrend, 'user_growth')} className="gap-1 text-xs"><Download size={12} />CSV</Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={userTrend}>
                  <defs>
                    <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(172, 55%, 30%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(172, 55%, 30%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 10%, 90%)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stroke="hsl(172, 55%, 30%)" strokeWidth={2} fill="url(#userGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-heading text-base">Plans by Category</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => exportCSV(plansByCategory, 'plans_by_category')} className="gap-1 text-xs"><Download size={12} />CSV</Button>
            </CardHeader>
            <CardContent>
              {plansByCategory.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No subscription plans yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={plansByCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {plansByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-heading text-base">Plan Pricing Comparison</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => exportCSV(pricingData, 'pricing')} className="gap-1 text-xs"><Download size={12} />CSV</Button>
            </CardHeader>
            <CardContent>
              {pricingData.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No active plans</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={pricingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 10%, 90%)" />
                    <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" height={50} />
                    <YAxis fontSize={12} />
                    <Tooltip formatter={(val: number) => `₹${val.toLocaleString('en-IN')}`} />
                    <Bar dataKey="price" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-heading text-base">Partners by Region</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => exportCSV(partnersByRegion, 'partners_by_region')} className="gap-1 text-xs"><Download size={12} />CSV</Button>
            </CardHeader>
            <CardContent>
              {partnersByRegion.length === 0 ? (
                <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No partners yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={partnersByRegion} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 10%, 90%)" />
                    <XAxis type="number" fontSize={12} />
                    <YAxis type="category" dataKey="region" fontSize={12} width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(172, 55%, 30%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Events trend if data exists */}
        {eventsTrend.some(e => e.subscriptions > 0 || e.claims > 0 || e.revenue > 0) && (
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="font-heading text-base">Events Trend</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => exportCSV(eventsTrend, 'events_trend')} className="gap-1 text-xs"><Download size={12} />CSV</Button>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={eventsTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(180, 10%, 90%)" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="subscriptions" stroke="hsl(172, 55%, 30%)" strokeWidth={2} />
                  <Line type="monotone" dataKey="claims" stroke="hsl(38, 92%, 50%)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
