import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatsCard from '@/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, Legend } from 'recharts';
import type { KPIMetric } from '@/types';
import type { DateRange } from 'react-day-picker';
import {
  Users, Shield, MapPin, Wrench, CalendarIcon, Download, Smartphone,
  CheckCircle2, Clock, AlertTriangle, TrendingUp, Layers, Globe, Star,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(38, 92%, 50%)',
  'hsl(210, 70%, 50%)',
  'hsl(0, 72%, 51%)',
  'hsl(280, 60%, 50%)',
  'hsl(150, 60%, 40%)',
  'hsl(30, 80%, 55%)',
  'hsl(190, 70%, 45%)',
];

const presetRanges = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 3 months', value: '3m' },
  { label: 'Last 6 months', value: '6m' },
  { label: 'Last 12 months', value: '12m' },
  { label: 'All time', value: 'all' },
  { label: 'Custom', value: 'custom' },
];

const AdminDashboard = () => {
  const [preset, setPreset] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showCalendar, setShowCalendar] = useState(false);

  // DB data
  const [profiles, setProfiles] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<any[]>([]);
  const [landingSections, setLandingSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [profilesRes, plansRes, regionsRes, partnersRes, catsRes, devicesRes, eventsRes, sectionsRes] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('subscription_plans').select('*'),
        supabase.from('regions').select('*'),
        supabase.from('partners').select('*'),
        supabase.from('gadget_categories').select('*'),
        supabase.from('customer_devices').select('*'),
        supabase.from('analytics_events').select('*'),
        supabase.from('landing_sections').select('*'),
      ]);
      if (profilesRes.data) setProfiles(profilesRes.data);
      if (plansRes.data) setPlans(plansRes.data);
      if (regionsRes.data) setRegions(regionsRes.data);
      if (partnersRes.data) setPartners(partnersRes.data);
      if (catsRes.data) setCategories(catsRes.data);
      if (devicesRes.data) setDevices(devicesRes.data);
      if (eventsRes.data) setAnalyticsEvents(eventsRes.data);
      if (sectionsRes.data) setLandingSections(sectionsRes.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  // Date range logic
  useEffect(() => {
    if (preset === 'custom') return;
    if (preset === 'all') { setDateRange(undefined); return; }
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

  const inRange = (dateStr: string) => {
    if (!dateRange?.from || !dateRange?.to) return true;
    const d = new Date(dateStr);
    return isWithinInterval(d, { start: dateRange.from, end: dateRange.to });
  };

  // Filtered data
  const filteredProfiles = useMemo(() => profiles.filter(p => inRange(p.created_at)), [profiles, dateRange]);
  const filteredDevices = useMemo(() => devices.filter(d => inRange(d.created_at)), [devices, dateRange]);
  const filteredPartners = useMemo(() => partners.filter(p => inRange(p.created_at)), [partners, dateRange]);
  const filteredEvents = useMemo(() => analyticsEvents.filter(e => inRange(e.event_date)), [analyticsEvents, dateRange]);

  // KPI metrics
  const activePlans = plans.filter(p => p.is_active);
  const activeRegions = regions.filter(r => r.is_active);
  const activePartners = partners.filter(p => p.is_active);
  const activeCategories = categories.filter(c => c.is_active);
  const pendingDevices = filteredDevices.filter(d => d.status === 'pending');
  const activeDevices = filteredDevices.filter(d => d.status === 'active' || d.status === 'approved');
  const enabledSections = landingSections.filter(s => s.is_enabled);

  const metrics: KPIMetric[] = [
    { label: 'Registered Users', value: filteredProfiles.length, trend: 'up' as const, change: filteredProfiles.length },
    { label: 'Subscription Plans', value: activePlans.length, trend: 'stable' as const, change: 0 },
    { label: 'Active Regions', value: activeRegions.length, trend: 'stable' as const, change: 0 },
    { label: 'Repair Partners', value: activePartners.length, trend: 'stable' as const, change: 0 },
  ];

  const metrics2: KPIMetric[] = [
    { label: 'Registered Devices', value: filteredDevices.length, trend: 'up' as const, change: filteredDevices.length },
    { label: 'Pending Devices', value: pendingDevices.length, trend: pendingDevices.length > 0 ? 'up' as const : 'stable' as const, change: pendingDevices.length },
    { label: 'Gadget Categories', value: activeCategories.length, trend: 'stable' as const, change: 0 },
    { label: 'Landing Sections', value: enabledSections.length, trend: 'stable' as const, change: 0 },
  ];

  // User registration trend
  const userTrend = useMemo(() => {
    const from = dateRange?.from || (profiles.length > 0 ? new Date(profiles.reduce((min, p) => p.created_at < min ? p.created_at : min, profiles[0]?.created_at)) : subMonths(new Date(), 6));
    const to = dateRange?.to || new Date();
    const months = eachMonthOfInterval({ start: from, end: to });
    return months.map(m => {
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      const users = profiles.filter(p => isWithinInterval(new Date(p.created_at), { start, end })).length;
      const devs = devices.filter(d => isWithinInterval(new Date(d.created_at), { start, end })).length;
      return { month: format(m, 'MMM yy'), users, devices: devs };
    });
  }, [profiles, devices, dateRange]);

  // Devices by status
  const devicesByStatus = useMemo(() => {
    const map: Record<string, number> = {};
    filteredDevices.forEach(d => { map[d.status] = (map[d.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredDevices]);

  // Plans by category
  const plansByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    plans.forEach(p => {
      const cat = categories.find(c => c.id === p.gadget_category_id);
      map[cat?.name || 'General'] = (map[cat?.name || 'General'] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [plans, categories]);

  // Partners by state
  const partnersByState = useMemo(() => {
    const map: Record<string, number> = {};
    partners.forEach(p => { map[p.state] = (map[p.state] || 0) + 1; });
    return Object.entries(map).map(([state, count]) => ({ state, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [partners]);

  // Coverage breakdown (plans with specific coverages)
  const coverageBreakdown = useMemo(() => {
    const active = activePlans;
    return [
      { name: 'Hardware Failure', count: active.filter(p => p.covers_hardware_failure).length },
      { name: 'Battery', count: active.filter(p => p.covers_battery).length },
      { name: 'Motherboard', count: active.filter(p => p.covers_motherboard).length },
      { name: 'Accidental Damage', count: active.filter(p => p.covers_accidental_damage).length },
      { name: 'Liquid Damage', count: active.filter(p => p.covers_liquid_damage).length },
    ];
  }, [activePlans]);

  // Partner quality distribution
  const partnerQuality = useMemo(() => {
    const buckets = [
      { name: '4.5-5.0 ★', min: 4.5, max: 5.01 },
      { name: '4.0-4.4 ★', min: 4.0, max: 4.5 },
      { name: '3.0-3.9 ★', min: 3.0, max: 4.0 },
      { name: 'Below 3 ★', min: 0, max: 3.0 },
    ];
    return buckets.map(b => ({
      name: b.name,
      count: partners.filter(p => Number(p.quality_rating) >= b.min && Number(p.quality_rating) < b.max).length,
    })).filter(b => b.count > 0);
  }, [partners]);

  // Avg partner SLA
  const avgSLA = useMemo(() => {
    if (partners.length === 0) return 0;
    return Math.round(partners.reduce((s, p) => s + p.sla_turnaround_days, 0) / partners.length);
  }, [partners]);

  // Avg partner commission
  const avgCommission = useMemo(() => {
    if (partners.length === 0) return 0;
    return (partners.reduce((s, p) => s + Number(p.commission_rate), 0) / partners.length).toFixed(1);
  }, [partners]);

  // Avg plan price
  const avgPlanPrice = useMemo(() => {
    if (activePlans.length === 0) return 0;
    return Math.round(activePlans.reduce((s, p) => s + Number(p.annual_price), 0) / activePlans.length);
  }, [activePlans]);

  // CSV export
  const exportCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => {
        const val = row[h];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val ?? '';
      }).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportFullDashboard = () => {
    const rows = [
      ...filteredProfiles.map(p => ({ type: 'user', id: p.id, name: p.full_name, email: p.email, created_at: p.created_at })),
      ...filteredDevices.map(d => ({ type: 'device', id: d.id, product: d.product_name, serial: d.serial_number, status: d.status, created_at: d.created_at })),
      ...partners.map(p => ({ type: 'partner', id: p.id, name: p.name, state: p.state, city: p.city, rating: p.quality_rating, sla_days: p.sla_turnaround_days, commission: p.commission_rate })),
      ...activePlans.map(p => ({ type: 'plan', id: p.id, name: p.name, code: p.code, price: p.annual_price, hw: p.covers_hardware_failure, battery: p.covers_battery, accidental: p.covers_accidental_damage, liquid: p.covers_liquid_damage })),
    ];
    exportCSV(rows.length > 0 ? rows : [{ message: 'No data available' }], 'waaz_dashboard_export');
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header with date picker & export */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold mb-1">Admin Dashboard</h1>
            <p className="text-muted-foreground">Overview of WaaZ operations</p>
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

            <Button variant="outline" onClick={exportFullDashboard} className="gap-2">
              <Download size={14} /> Export CSV
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <>
            {/* KPI Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {metrics.map((m, i) => <StatsCard key={i} metric={m} />)}
            </div>

            {/* KPI Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {metrics2.map((m, i) => <StatsCard key={i} metric={m} />)}
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card className="shadow-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <TrendingUp size={22} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Plan Price</p>
                    <p className="text-xl font-heading font-bold">₹{avgPlanPrice.toLocaleString('en-IN')}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Clock size={22} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg SLA Turnaround</p>
                    <p className="text-xl font-heading font-bold">{avgSLA} days</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Star size={22} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Commission Rate</p>
                    <p className="text-xl font-heading font-bold">{avgCommission}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <FileText size={22} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Landing Sections</p>
                    <p className="text-xl font-heading font-bold">{enabledSections.length} / {landingSections.length}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1: User & Device Growth + Devices by Status */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="font-heading text-base">User & Device Registrations</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => exportCSV(userTrend, 'user_device_trend')} className="gap-1 text-xs"><Download size={12} />CSV</Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={userTrend}>
                      <defs>
                        <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="deviceGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="month" fontSize={12} className="fill-muted-foreground" />
                      <YAxis fontSize={12} className="fill-muted-foreground" />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#userGrad)" />
                      <Area type="monotone" dataKey="devices" stroke="hsl(38, 92%, 50%)" strokeWidth={2} fill="url(#deviceGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="font-heading text-base">Devices by Status</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => exportCSV(devicesByStatus, 'devices_by_status')} className="gap-1 text-xs"><Download size={12} />CSV</Button>
                </CardHeader>
                <CardContent>
                  {devicesByStatus.length === 0 ? (
                    <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No devices registered yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={devicesByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {devicesByStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2: Coverage Breakdown + Plans by Category */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="font-heading text-base">Plan Coverage Breakdown</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => exportCSV(coverageBreakdown, 'coverage_breakdown')} className="gap-1 text-xs"><Download size={12} />CSV</Button>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={coverageBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" fontSize={11} angle={-15} textAnchor="end" height={60} className="fill-muted-foreground" />
                      <YAxis fontSize={12} className="fill-muted-foreground" />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
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
                    <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No plans yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={plansByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                          {plansByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 3: Partners by State + Partner Quality */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="font-heading text-base">Partners by State</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => exportCSV(partnersByState, 'partners_by_state')} className="gap-1 text-xs"><Download size={12} />CSV</Button>
                </CardHeader>
                <CardContent>
                  {partnersByState.length === 0 ? (
                    <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No partners yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={partnersByState} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" fontSize={12} className="fill-muted-foreground" />
                        <YAxis type="category" dataKey="state" fontSize={12} width={100} className="fill-muted-foreground" />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(38, 92%, 50%)" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="font-heading text-base">Partner Quality Distribution</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => exportCSV(partnerQuality, 'partner_quality')} className="gap-1 text-xs"><Download size={12} />CSV</Button>
                </CardHeader>
                <CardContent>
                  {partnerQuality.length === 0 ? (
                    <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">No partners yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={partnerQuality}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" fontSize={12} className="fill-muted-foreground" />
                        <YAxis fontSize={12} className="fill-muted-foreground" />
                        <Tooltip />
                        <Bar dataKey="count" fill="hsl(210, 70%, 50%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <Shield size={40} className="text-primary mx-auto mb-3" />
                  <h3 className="font-heading font-semibold mb-1">Subscription Plans</h3>
                  <p className="text-sm text-muted-foreground">{activePlans.length} active plans across {activeCategories.length} gadget categories</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {activePlans.slice(0, 5).map(p => (
                      <Badge key={p.id} variant="secondary" className="text-xs">{p.name}</Badge>
                    ))}
                    {activePlans.length > 5 && <Badge variant="outline" className="text-xs">+{activePlans.length - 5} more</Badge>}
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-card">
                <CardContent className="p-8 text-center">
                  <Wrench size={40} className="text-primary mx-auto mb-3" />
                  <h3 className="font-heading font-semibold mb-1">Partner Network</h3>
                  <p className="text-sm text-muted-foreground">{activePartners.length} active partners across {activeRegions.length} regions</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-3">
                    {activePartners.slice(0, 5).map(p => (
                      <Badge key={p.id} variant="secondary" className="text-xs">{p.name} ({p.city})</Badge>
                    ))}
                    {activePartners.length > 5 && <Badge variant="outline" className="text-xs">+{activePartners.length - 5} more</Badge>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
