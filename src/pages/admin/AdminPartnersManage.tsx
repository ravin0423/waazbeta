import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Loader2, Star, Trophy, Search, Filter, TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format, differenceInDays, subMonths, startOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Partner {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string;
  state: string;
  region_id: string | null;
  sla_turnaround_days: number;
  commission_rate: number;
  quality_rating: number;
  total_repairs: number;
  is_active: boolean;
  partner_type: string;
}

interface PartnerMetrics {
  totalAssigned: number;
  completed: number;
  completionRate: number;
  slaCompliance: number;
  avgResolutionDays: number;
  avgRating: number;
  revenueYTD: number;
}

interface Region {
  id: string;
  name: string;
}

const AdminPartnersManage = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', state: '', region_id: '', sla_turnaround_days: '7', commission_rate: '10', quality_rating: '5.0', partner_type: 'technical' });
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterRating, setFilterRating] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [metricsMap, setMetricsMap] = useState<Record<string, PartnerMetrics>>({});
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [detailAssignments, setDetailAssignments] = useState<any[]>([]);
  const [detailFeedback, setDetailFeedback] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(true);

  const fetchData = async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('partners').select('*').order('name'),
      supabase.from('regions').select('id, name').eq('is_active', true).order('name'),
    ]);
    setPartners(p || []);
    setRegions(r || []);
    
    if (p && p.length > 0) {
      await computeMetrics(p);
    }
    setLoading(false);
  };

  const computeMetrics = async (partnerList: Partner[]) => {
    const partnerIds = partnerList.map(p => p.id);
    
    const [{ data: assignments }, { data: feedback }, { data: claims }] = await Promise.all([
      supabase.from('claim_assignments').select('*').in('partner_id', partnerIds),
      supabase.from('claim_feedback').select('*'),
      supabase.from('service_claims').select('id, status, created_at, updated_at, assigned_partner_id').in('assigned_partner_id', partnerIds),
    ]);

    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

    const map: Record<string, PartnerMetrics> = {};
    
    for (const partner of partnerList) {
      const partnerAssignments = (assignments || []).filter(a => a.partner_id === partner.id);
      const partnerClaims = (claims || []).filter(c => c.assigned_partner_id === partner.id);
      const totalAssigned = partnerAssignments.length;
      
      const completedAssignments = partnerAssignments.filter(a => a.status === 'completed');
      const completed = completedAssignments.length;
      const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;

      // SLA compliance: completed within SLA deadline
      let slaCompliant = 0;
      completedAssignments.forEach(a => {
        if (a.sla_deadline) {
          const deadline = new Date(a.sla_deadline);
          const completedAt = new Date(a.updated_at);
          if (completedAt <= deadline) slaCompliant++;
        } else {
          slaCompliant++; // No deadline = compliant
        }
      });
      const slaCompliance = completed > 0 ? (slaCompliant / completed) * 100 : (totalAssigned === 0 ? 100 : 0);

      // Avg resolution days from claims
      let totalDays = 0;
      let resolvedCount = 0;
      partnerClaims.filter(c => c.status === 'completed' || c.status === 'resolved').forEach(c => {
        const days = differenceInDays(new Date(c.updated_at), new Date(c.created_at));
        totalDays += days;
        resolvedCount++;
      });
      const avgResolutionDays = resolvedCount > 0 ? totalDays / resolvedCount : 0;

      // Feedback rating
      const claimIds = partnerClaims.map(c => c.id);
      const partnerFeedback = (feedback || []).filter(f => claimIds.includes(f.claim_id));
      const avgRating = partnerFeedback.length > 0
        ? partnerFeedback.reduce((sum, f) => sum + f.rating, 0) / partnerFeedback.length
        : partner.quality_rating;

      // Revenue YTD (commission from completed assignments)
      const ytdCompleted = partnerAssignments.filter(a => a.status === 'completed' && a.created_at >= yearStart).length;
      const revenueYTD = ytdCompleted * (partner.commission_rate * 100); // Approximate

      map[partner.id] = {
        totalAssigned,
        completed,
        completionRate,
        slaCompliance,
        avgResolutionDays,
        avgRating,
        revenueYTD,
      };
    }
    
    setMetricsMap(map);
  };

  useEffect(() => { fetchData(); }, []);

  // Real-time updates
  useEffect(() => {
    const channel = supabase
      .channel('partner-metrics')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claim_assignments' }, () => {
        if (partners.length > 0) computeMetrics(partners);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [partners]);

  const locations = useMemo(() => {
    const locs = new Set(partners.map(p => `${p.city}, ${p.state}`));
    return Array.from(locs).sort();
  }, [partners]);

  const filteredPartners = useMemo(() => {
    return partners.filter(p => {
      if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterLocation !== 'all' && `${p.city}, ${p.state}` !== filterLocation) return false;
      if (filterType !== 'all' && p.partner_type !== filterType) return false;
      if (filterRating !== 'all') {
        const rating = metricsMap[p.id]?.avgRating || 0;
        if (filterRating === '4plus' && rating < 4) return false;
        if (filterRating === '3plus' && rating < 3) return false;
      }
      return true;
    });
  }, [partners, searchQuery, filterLocation, filterRating, filterType, metricsMap]);

  const leaderboard = useMemo(() => {
    return [...partners]
      .filter(p => p.is_active && (metricsMap[p.id]?.totalAssigned || 0) > 0)
      .sort((a, b) => (metricsMap[b.id]?.slaCompliance || 0) - (metricsMap[a.id]?.slaCompliance || 0))
      .slice(0, 10);
  }, [partners, metricsMap]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', city: '', state: '', region_id: '', sla_turnaround_days: '7', commission_rate: '10', quality_rating: '5.0', partner_type: 'technical' });
    setDialogOpen(true);
  };

  const openEdit = (p: Partner, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(p);
    setForm({
      name: p.name, email: p.email || '', phone: p.phone || '',
      city: p.city, state: p.state, region_id: p.region_id || '',
      sla_turnaround_days: String(p.sla_turnaround_days),
      commission_rate: String(p.commission_rate),
      quality_rating: String(p.quality_rating),
      partner_type: p.partner_type || 'technical',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim() || !form.state.trim()) { toast.error('Name, city, and state are required'); return; }
    setSaving(true);
    const payload = {
      name: form.name, email: form.email || null, phone: form.phone || null,
      city: form.city, state: form.state, region_id: form.region_id || null,
      sla_turnaround_days: parseInt(form.sla_turnaround_days) || 7,
      commission_rate: parseFloat(form.commission_rate) || 10,
      quality_rating: parseFloat(form.quality_rating) || 5.0,
      partner_type: form.partner_type,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      const { error } = await supabase.from('partners').update(payload).eq('id', editing.id);
      if (error) toast.error('Failed to update'); else toast.success('Partner updated');
    } else {
      const { error } = await supabase.from('partners').insert(payload);
      if (error) toast.error('Failed to create'); else toast.success('Partner created');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const toggleActive = async (p: Partner, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('partners').update({ is_active: !p.is_active, updated_at: new Date().toISOString() }).eq('id', p.id);
    fetchData();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this partner?')) return;
    const { error } = await supabase.from('partners').delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Partner deleted'); fetchData(); }
  };

  const openPartnerDetail = async (partner: Partner) => {
    setSelectedPartner(partner);
    setShowDetail(true);
    
    const [{ data: assignments }, { data: fb }] = await Promise.all([
      supabase.from('claim_assignments').select('*, service_claims(id, issue_type, status, created_at, description)')
        .eq('partner_id', partner.id).order('created_at', { ascending: false }).limit(20),
      supabase.from('claim_feedback').select('*').order('created_at', { ascending: false }),
    ]);
    
    setDetailAssignments(assignments || []);
    
    // Filter feedback to this partner's claims
    const claimIds = (assignments || []).map(a => a.claim_id);
    setDetailFeedback((fb || []).filter(f => claimIds.includes(f.claim_id)));
  };

  // Build monthly trend data for detail view
  const monthlyTrend = useMemo(() => {
    if (!selectedPartner) return [];
    const months: { month: string; assigned: number; completed: number; sla: number }[] = [];
    for (let i = 2; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStr = format(monthDate, 'MMM yyyy');
      const monthStart = startOfMonth(monthDate);
      const nextMonth = startOfMonth(subMonths(new Date(), i - 1));
      
      const monthAssignments = detailAssignments.filter(a => {
        const d = new Date(a.created_at);
        return d >= monthStart && d < nextMonth;
      });
      const completedInMonth = monthAssignments.filter(a => a.status === 'completed');
      let slaOk = 0;
      completedInMonth.forEach(a => {
        if (!a.sla_deadline || new Date(a.updated_at) <= new Date(a.sla_deadline)) slaOk++;
      });
      
      months.push({
        month: monthStr,
        assigned: monthAssignments.length,
        completed: completedInMonth.length,
        sla: completedInMonth.length > 0 ? Math.round((slaOk / completedInMonth.length) * 100) : 100,
      });
    }
    return months;
  }, [selectedPartner, detailAssignments]);

  const getSlaColor = (pct: number) => {
    if (pct >= 95) return 'bg-green-600';
    if (pct >= 85) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  const hasActiveFilters = filterLocation !== 'all' || filterRating !== 'all' || filterType !== 'all' || searchQuery !== '';

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Partners Management</h1>
            <p className="text-muted-foreground">Performance metrics, leaderboard & partner network</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowLeaderboard(!showLeaderboard)}>
              <Trophy size={14} className="mr-1" /> {showLeaderboard ? 'Hide' : 'Show'} Leaderboard
            </Button>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openCreate} className="gradient-primary text-primary-foreground">
                  <Plus size={16} className="mr-2" /> Add Partner
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading">{editing ? 'Edit Partner' : 'New Partner'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <Input placeholder="Partner name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                    <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                    <Input placeholder="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                  </div>
                  <Select value={form.partner_type} onValueChange={v => setForm({ ...form, partner_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Partner type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical (Service)</SelectItem>
                      <SelectItem value="non_technical">Non-Technical (Sales)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.region_id} onValueChange={v => setForm({ ...form, region_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                    <SelectContent>
                      {regions.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">SLA (days)</label>
                      <Input type="number" value={form.sla_turnaround_days} onChange={e => setForm({ ...form, sla_turnaround_days: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Commission %</label>
                      <Input type="number" step="0.5" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Rating</label>
                      <Input type="number" step="0.1" min="0" max="5" value={form.quality_rating} onChange={e => setForm({ ...form, quality_rating: e.target.value })} />
                    </div>
                  </div>
                  <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground">
                    {saving && <Loader2 size={16} className="mr-2 animate-spin" />} {editing ? 'Update' : 'Create'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* LEADERBOARD */}
        {showLeaderboard && leaderboard.length > 0 && (
          <Card className="mb-6 shadow-card border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <Trophy size={20} className="text-yellow-500" /> Top Partners by SLA Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {leaderboard.map((partner, index) => {
                  const m = metricsMap[partner.id];
                  return (
                    <div
                      key={partner.id}
                      className="flex justify-between items-center p-3 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => openPartnerDetail(partner)}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`font-bold text-lg w-8 text-center ${index < 3 ? 'text-yellow-500' : 'text-muted-foreground'}`}>
                          #{index + 1}
                        </span>
                        <div>
                          <div className="font-semibold">{partner.name}</div>
                          <div className="text-xs text-muted-foreground">{partner.city}, {partner.state}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge className={getSlaColor(m?.slaCompliance || 0)}>
                          {(m?.slaCompliance || 0).toFixed(0)}% SLA
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Star size={12} className="text-yellow-500 fill-yellow-500" />
                          {(m?.avgRating || 0).toFixed(1)}
                        </span>
                        <span className="font-semibold text-muted-foreground">
                          {m?.completed || 0} done
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* FILTERS */}
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search partners..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterLocation} onValueChange={setFilterLocation}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Ratings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="4plus">4+ Stars</SelectItem>
              <SelectItem value="3plus">3+ Stars</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="non_technical">Non-Technical</SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setSearchQuery(''); setFilterLocation('all'); setFilterRating('all'); setFilterType('all'); }}>
              Clear filters
            </Button>
          )}
        </div>

        {/* PARTNER TABLE */}
        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>SLA %</TableHead>
                    <TableHead>Completion</TableHead>
                    <TableHead>Avg Time</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Repairs</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.length === 0 ? (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">No partners found</TableCell></TableRow>
                  ) : (
                    filteredPartners.map(p => {
                      const m = metricsMap[p.id];
                      return (
                        <TableRow key={p.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openPartnerDetail(p)}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.partner_type === 'technical' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent-foreground'}`}>
                              {p.partner_type === 'technical' ? 'Technical' : 'Non-Tech'}
                            </span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{p.city}, {p.state}</TableCell>
                          <TableCell>
                            <Badge className={getSlaColor(m?.slaCompliance || 0)}>
                              {(m?.slaCompliance || 0).toFixed(0)}%
                            </Badge>
                          </TableCell>
                          <TableCell>{(m?.completionRate || 0).toFixed(0)}%</TableCell>
                          <TableCell>{m?.avgResolutionDays ? `${m.avgResolutionDays.toFixed(1)}d` : '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Star size={14} className="text-yellow-500 fill-yellow-500" />
                              <span>{(m?.avgRating || p.quality_rating).toFixed(1)}</span>
                            </div>
                          </TableCell>
                          <TableCell>{m?.totalAssigned || p.total_repairs}</TableCell>
                          <TableCell>
                            <Switch checked={p.is_active} onCheckedChange={() => {}} onClick={(e) => toggleActive(p, e as any)} />
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={(e) => openEdit(p, e)}><Pencil size={14} /></Button>
                            <Button variant="ghost" size="sm" onClick={(e) => handleDelete(p.id, e)} className="text-destructive"><Trash2 size={14} /></Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* PARTNER DETAIL SHEET */}
        <Sheet open={showDetail} onOpenChange={setShowDetail}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            {selectedPartner && (
              <>
                <SheetHeader>
                  <SheetTitle className="font-heading">{selectedPartner.name}</SheetTitle>
                  <SheetDescription>{selectedPartner.city}, {selectedPartner.state} • {selectedPartner.partner_type === 'technical' ? 'Technical' : 'Non-Technical'}</SheetDescription>
                </SheetHeader>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {(() => {
                    const m = metricsMap[selectedPartner.id];
                    return (
                      <>
                        <Card>
                          <CardContent className="pt-4 pb-4 text-center">
                            <CheckCircle size={20} className="mx-auto mb-1 text-green-500" />
                            <div className="text-xs text-muted-foreground">SLA Compliance</div>
                            <div className="text-2xl font-bold">{(m?.slaCompliance || 0).toFixed(1)}%</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 pb-4 text-center">
                            <TrendingUp size={20} className="mx-auto mb-1 text-blue-500" />
                            <div className="text-xs text-muted-foreground">Completion Rate</div>
                            <div className="text-2xl font-bold">{(m?.completionRate || 0).toFixed(1)}%</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 pb-4 text-center">
                            <Clock size={20} className="mx-auto mb-1 text-orange-500" />
                            <div className="text-xs text-muted-foreground">Avg Resolution</div>
                            <div className="text-2xl font-bold">{(m?.avgResolutionDays || 0).toFixed(1)} days</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-4 pb-4 text-center">
                            <Star size={20} className="mx-auto mb-1 text-yellow-500" />
                            <div className="text-xs text-muted-foreground">Avg Rating</div>
                            <div className="text-2xl font-bold">{(m?.avgRating || selectedPartner.quality_rating).toFixed(1)}</div>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </div>

                <Tabs defaultValue="trend" className="mt-6">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="trend">Trend</TabsTrigger>
                    <TabsTrigger value="claims">Claims ({detailAssignments.length})</TabsTrigger>
                    <TabsTrigger value="feedback">Feedback ({detailFeedback.length})</TabsTrigger>
                  </TabsList>

                  <TabsContent value="trend" className="mt-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">3-Month Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {monthlyTrend.length > 0 ? (
                          <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={monthlyTrend}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                              <YAxis tick={{ fontSize: 12 }} />
                              <Tooltip />
                              <Bar dataKey="assigned" fill="hsl(var(--primary))" name="Assigned" />
                              <Bar dataKey="completed" fill="hsl(var(--accent))" name="Completed" />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-muted-foreground text-sm text-center py-8">No data available</p>
                        )}
                        <div className="mt-4 space-y-2">
                          {monthlyTrend.map(m => (
                            <div key={m.month} className="flex justify-between items-center text-sm">
                              <span>{m.month}</span>
                              <div className="flex items-center gap-3">
                                <span>{m.assigned} assigned</span>
                                <span>{m.completed} done</span>
                                <Badge className={getSlaColor(m.sla)}>{m.sla}% SLA</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="claims" className="mt-4 space-y-2">
                    {detailAssignments.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No claims assigned</p>
                    ) : (
                      detailAssignments.map(a => (
                        <Card key={a.id}>
                          <CardContent className="py-3 px-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium text-sm">{a.service_claims?.issue_type || 'Unknown'}</div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                  {format(new Date(a.created_at), 'MMM dd, yyyy')}
                                </div>
                              </div>
                              <Badge variant={a.status === 'completed' ? 'default' : 'outline'}>
                                {a.status}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>

                  <TabsContent value="feedback" className="mt-4 space-y-2">
                    {detailFeedback.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">No feedback yet</p>
                    ) : (
                      detailFeedback.map(f => (
                        <Card key={f.id}>
                          <CardContent className="py-3 px-4">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} size={14} className={i < f.rating ? 'text-yellow-500 fill-yellow-500' : 'text-muted'} />
                                ))}
                              </div>
                              <span className="text-xs text-muted-foreground">{format(new Date(f.created_at), 'MMM dd, yyyy')}</span>
                            </div>
                            {f.feedback_text && <p className="text-sm mt-2 text-muted-foreground">{f.feedback_text}</p>}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </TabsContent>
                </Tabs>

                {/* Partner Info */}
                <Card className="mt-6">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Partner Details</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selectedPartner.email || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{selectedPartner.phone || '-'}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">SLA Target</span><span>{selectedPartner.sla_turnaround_days} days</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Commission Rate</span><span>{selectedPartner.commission_rate}%</span></div>
                  </CardContent>
                </Card>
              </>
            )}
          </SheetContent>
        </Sheet>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminPartnersManage;
