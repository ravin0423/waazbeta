import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target, MapPin, Star, Users, Clock, Award, TrendingUp, CheckCircle,
  AlertTriangle, ArrowRight, Search, Filter, Zap, Phone, Mail, ChevronDown,
  ChevronUp, Loader2, UserCheck, Calendar, Shield
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, differenceInDays, addDays } from 'date-fns';
import { toast } from 'sonner';

interface ClaimWithDevice {
  id: string;
  user_id: string;
  device_id: string | null;
  imei_number: string;
  issue_type: string;
  description: string;
  status: string;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  device_name?: string;
}

interface PartnerScore {
  partner: any;
  totalScore: number;
  breakdown: {
    availability: number;
    sla: number;
    rating: number;
    specialization: number;
  };
  activeClaimsCount: number;
}

const ClaimAssignment = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<ClaimWithDevice[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [devices, setDevices] = useState<Record<string, any>>({});
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null);
  const [slaDays, setSlaDays] = useState('5');
  const [assignNotes, setAssignNotes] = useState('');
  const [notifyPartner, setNotifyPartner] = useState(true);
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('approved');
  const [assignmentHistory, setAssignmentHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [claimsRes, partnersRes, profilesRes, devicesRes, assignRes, historyRes] = await Promise.all([
      supabase.from('service_claims').select('*').order('created_at', { ascending: false }),
      supabase.from('partners').select('*').eq('is_active', true),
      supabase.from('profiles').select('id, full_name, email, phone'),
      supabase.from('customer_devices').select('id, product_name, serial_number, user_id'),
      supabase.from('claim_assignments').select('*'),
      supabase.from('claim_assignments').select('*, service_claims(*), partners(*)').order('created_at', { ascending: false }).limit(50),
    ]);

    const pMap: Record<string, any> = {};
    (profilesRes.data || []).forEach(p => { pMap[p.id] = p; });
    setProfiles(pMap);

    const dMap: Record<string, any> = {};
    (devicesRes.data || []).forEach(d => { dMap[d.id] = d; });
    setDevices(dMap);

    setPartners(partnersRes.data || []);
    setAssignments(assignRes.data || []);
    setAssignmentHistory(historyRes.data || []);

    const enrichedClaims = (claimsRes.data || []).map(c => ({
      ...c,
      customer_name: pMap[c.user_id]?.full_name || 'Unknown',
      customer_email: pMap[c.user_id]?.email || '',
      device_name: c.device_id ? dMap[c.device_id]?.product_name || 'Unknown Device' : 'N/A',
    }));
    setClaims(enrichedClaims);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const assignedClaimIds = useMemo(() => new Set(assignments.map(a => a.claim_id)), [assignments]);

  const filteredClaims = useMemo(() => {
    return claims.filter(c => {
      if (filterStatus === 'approved') return c.status === 'approved' && !assignedClaimIds.has(c.id);
      if (filterStatus === 'assigned') return assignedClaimIds.has(c.id);
      if (filterStatus === 'all') return true;
      return c.status === filterStatus;
    }).filter(c => {
      if (!search) return true;
      const s = search.toLowerCase();
      return c.customer_name?.toLowerCase().includes(s) ||
        c.device_name?.toLowerCase().includes(s) ||
        c.issue_type.toLowerCase().includes(s) ||
        c.id.toLowerCase().includes(s);
    });
  }, [claims, filterStatus, search, assignedClaimIds]);

  // Partner recommendation engine
  const getPartnerScores = useMemo((): PartnerScore[] => {
    if (selectedClaims.length === 0) return [];

    return partners.map(partner => {
      const partnerAssignments = assignments.filter(a => a.partner_id === partner.id);
      const activeCount = partnerAssignments.filter(a => ['pending', 'accepted', 'in_progress'].includes(a.status)).length;
      const completedCount = partnerAssignments.filter(a => a.status === 'completed').length;
      const maxCapacity = 10;

      // Availability score (less busy = higher)
      const availability = Math.max(0, Math.round(((maxCapacity - activeCount) / maxCapacity) * 100));

      // SLA score (based on turnaround days and on-time history)
      const sla = Math.min(100, Math.round((1 / Math.max(1, partner.sla_turnaround_days)) * 100 + (completedCount > 0 ? 40 : 0)));

      // Rating score
      const rating = Math.round((partner.quality_rating / 5) * 100);

      // Specialization score (technical partners score higher for repairs)
      const specialization = partner.partner_type === 'technical' ? 100 : 50;

      const totalScore = Math.round(
        availability * 0.25 + sla * 0.25 + rating * 0.25 + specialization * 0.25
      );

      return {
        partner,
        totalScore,
        breakdown: { availability, sla, rating, specialization },
        activeClaimsCount: activeCount,
      };
    }).sort((a, b) => b.totalScore - a.totalScore);
  }, [partners, selectedClaims, assignments]);

  const toggleClaimSelection = (claimId: string) => {
    setSelectedClaims(prev =>
      prev.includes(claimId) ? prev.filter(id => id !== claimId) : [...prev, claimId]
    );
  };

  const selectAllVisible = () => {
    const visibleIds = filteredClaims.map(c => c.id);
    setSelectedClaims(prev => {
      const allSelected = visibleIds.every(id => prev.includes(id));
      return allSelected ? prev.filter(id => !visibleIds.includes(id)) : [...new Set([...prev, ...visibleIds])];
    });
  };

  const handleAssign = async () => {
    if (!selectedPartner || selectedClaims.length === 0) return;
    setAssigning(true);

    try {
      const deadline = addDays(new Date(), parseInt(slaDays));

      for (const claimId of selectedClaims) {
        const { error: assignError } = await supabase.from('claim_assignments').insert({
          claim_id: claimId,
          partner_id: selectedPartner,
          assigned_by: user?.id,
          sla_deadline: deadline.toISOString(),
          status: 'pending',
          notes: assignNotes || null,
        });
        if (assignError) throw assignError;

        const { error: statusError } = await supabase
          .from('service_claims')
          .update({ status: 'assigned', assigned_partner_id: selectedPartner })
          .eq('id', claimId);
        if (statusError) throw statusError;

        // Create notifications
        const claim = claims.find(c => c.id === claimId);
        const partner = partners.find(p => p.id === selectedPartner);

        if (notifyPartner && partner?.user_id) {
          await supabase.from('notifications').insert({
            user_id: partner.user_id,
            type: 'claim_assigned',
            title: 'New Claim Assigned',
            message: `Claim for ${claim?.device_name || 'device'} (${claim?.issue_type}) assigned to you. SLA: ${format(deadline, 'MMM dd, yyyy')}`,
            related_id: claimId,
          });
        }

        if (notifyCustomer && claim?.user_id) {
          await supabase.from('notifications').insert({
            user_id: claim.user_id,
            type: 'claim_partner_assigned',
            title: 'Repair Partner Assigned',
            message: `${partner?.name || 'A partner'} has been assigned to repair your ${claim?.device_name || 'device'}. Expected by ${format(deadline, 'MMM dd, yyyy')}.`,
            related_id: claimId,
          });
        }
      }

      toast.success(`${selectedClaims.length} claim(s) assigned successfully`);
      setAssignModalOpen(false);
      setSelectedClaims([]);
      setSelectedPartner(null);
      setAssignNotes('');
      fetchData();
    } catch (error: any) {
      toast.error('Assignment failed: ' + error.message);
    } finally {
      setAssigning(false);
    }
  };

  const pendingCount = claims.filter(c => c.status === 'approved' && !assignedClaimIds.has(c.id)).length;
  const assignedCount = assignments.length;
  const selectedPartnerData = getPartnerScores.find(ps => ps.partner.id === selectedPartner);

  const getCapacityColor = (active: number, max: number = 10) => {
    const pct = (active / max) * 100;
    if (pct < 50) return 'text-green-600';
    if (pct < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Claim Assignment</h1>
            <p className="text-muted-foreground">Assign approved claims to service partners</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
              <Clock className="h-4 w-4 mr-2" />
              {showHistory ? 'Hide History' : 'History'}
            </Button>
            {selectedClaims.length > 0 && (
              <Button onClick={() => setAssignModalOpen(true)}>
                <Target className="h-4 w-4 mr-2" />
                Assign {selectedClaims.length} Claim(s)
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('approved')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Assignment</p>
                  <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus('assigned')}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Assigned</p>
                  <p className="text-2xl font-bold text-foreground">{assignedCount}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Partners</p>
                  <p className="text-2xl font-bold text-foreground">{partners.length}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Claims</p>
                  <p className="text-2xl font-bold text-foreground">{claims.length}</p>
                </div>
                <Shield className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search claims..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="approved">Pending Assignment</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="all">All Claims</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Assignment History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assignment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {assignmentHistory.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No assignments yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {assignmentHistory.slice(0, 10).map(h => (
                        <div key={h.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                          <div className="flex-1">
                            <p className="text-sm font-medium">{h.service_claims?.issue_type || 'Claim'} → {h.partners?.name || 'Partner'}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(h.created_at), 'MMM dd, yyyy HH:mm')}
                              {h.sla_deadline && ` • SLA: ${format(new Date(h.sla_deadline), 'MMM dd')}`}
                            </p>
                          </div>
                          <Badge variant={h.status === 'completed' ? 'default' : 'secondary'}>{h.status}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Claims List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredClaims.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground">No Claims Pending</h3>
              <p className="text-muted-foreground">All approved claims have been assigned.</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="p-4 border-b flex items-center gap-3">
                <Checkbox
                  checked={filteredClaims.length > 0 && filteredClaims.every(c => selectedClaims.includes(c.id))}
                  onCheckedChange={() => selectAllVisible()}
                />
                <span className="text-sm text-muted-foreground">
                  {selectedClaims.length > 0 ? `${selectedClaims.length} selected` : `${filteredClaims.length} claims`}
                </span>
              </div>
              <div className="divide-y">
                {filteredClaims.map(claim => (
                  <motion.div
                    key={claim.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors ${selectedClaims.includes(claim.id) ? 'bg-primary/5' : ''}`}
                  >
                    {filterStatus === 'approved' && (
                      <Checkbox
                        checked={selectedClaims.includes(claim.id)}
                        onCheckedChange={() => toggleClaimSelection(claim.id)}
                        className="mt-1"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-medium text-foreground">{claim.device_name}</p>
                          <p className="text-sm text-muted-foreground">{claim.issue_type} • {claim.customer_name}</p>
                        </div>
                        <Badge variant={claim.status === 'approved' ? 'default' : 'secondary'}>
                          {claim.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(claim.created_at), 'MMM dd, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {differenceInDays(new Date(), new Date(claim.created_at))}d ago
                        </span>
                        <span className="font-mono text-[10px]">{claim.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Partner Recommendations (when claims selected) */}
        <AnimatePresence>
          {selectedClaims.length > 0 && !assignModalOpen && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5 text-primary" />
                    Recommended Partners ({getPartnerScores.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getPartnerScores.slice(0, 5).map((ps, idx) => (
                    <div
                      key={ps.partner.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${selectedPartner === ps.partner.id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
                      onClick={() => setSelectedPartner(ps.partner.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-muted text-muted-foreground'}`}>
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{ps.partner.name}</p>
                              {idx === 0 && <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-300">Recommended</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {ps.partner.city}, {ps.partner.state}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg font-bold text-foreground">{ps.totalScore}</p>
                            <p className="text-xs text-muted-foreground">score</p>
                          </div>
                          <Button
                            variant={expandedPartner === ps.partner.id ? 'ghost' : 'ghost'}
                            size="icon"
                            onClick={e => { e.stopPropagation(); setExpandedPartner(expandedPartner === ps.partner.id ? null : ps.partner.id); }}
                          >
                            {expandedPartner === ps.partner.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Quick stats */}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" /> {ps.partner.quality_rating}/5
                        </span>
                        <span className={`flex items-center gap-1 ${getCapacityColor(ps.activeClaimsCount)}`}>
                          <Users className="h-3 w-3" /> {ps.activeClaimsCount}/10 active
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" /> {ps.partner.sla_turnaround_days}d SLA
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Award className="h-3 w-3" /> {ps.partner.total_repairs} repairs
                        </span>
                      </div>

                      {/* Expanded breakdown */}
                      <AnimatePresence>
                        {expandedPartner === ps.partner.id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <Separator className="my-3" />
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {[
                                { label: 'Availability', value: ps.breakdown.availability, icon: Users },
                                { label: 'SLA Compliance', value: ps.breakdown.sla, icon: Clock },
                                { label: 'Rating', value: ps.breakdown.rating, icon: Star },
                                { label: 'Specialization', value: ps.breakdown.specialization, icon: Award },
                              ].map(item => (
                                <div key={item.label} className="space-y-1">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <item.icon className="h-3 w-3" /> {item.label}
                                  </div>
                                  <Progress value={item.value} className="h-2" />
                                  <p className="text-xs font-medium text-foreground">{item.value}/100</p>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 flex gap-2">
                              {ps.partner.phone && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={`tel:${ps.partner.phone}`}><Phone className="h-3 w-3 mr-1" /> Call</a>
                                </Button>
                              )}
                              {ps.partner.email && (
                                <Button variant="outline" size="sm" asChild>
                                  <a href={`mailto:${ps.partner.email}`}><Mail className="h-3 w-3 mr-1" /> Email</a>
                                </Button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}

                  {selectedPartner && (
                    <Button className="w-full mt-4" onClick={() => setAssignModalOpen(true)}>
                      <ArrowRight className="h-4 w-4 mr-2" /> Proceed with Assignment
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assignment Confirmation Modal */}
        <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Confirm Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Claims summary */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Claims ({selectedClaims.length})</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {selectedClaims.map(cid => {
                    const c = claims.find(cl => cl.id === cid);
                    return c ? (
                      <p key={cid} className="text-sm text-muted-foreground">
                        {c.device_name} • {c.issue_type} • {c.customer_name}
                      </p>
                    ) : null;
                  })}
                </div>
              </div>

              <Separator />

              {/* Partner */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Assigned Partner</h4>
                {selectedPartnerData ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{selectedPartnerData.partner.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPartnerData.partner.city}, {selectedPartnerData.partner.state} • Score: {selectedPartnerData.totalScore}</p>
                    </div>
                  </div>
                ) : (
                  <Select value={selectedPartner || ''} onValueChange={setSelectedPartner}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a partner" />
                    </SelectTrigger>
                    <SelectContent>
                      {partners.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name} - {p.city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <Separator />

              {/* SLA */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">SLA Deadline</h4>
                <Select value={slaDays} onValueChange={setSlaDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="2">2 days</SelectItem>
                    <SelectItem value="3">3 days</SelectItem>
                    <SelectItem value="5">5 days (Default)</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="10">10 days</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Deadline: {format(addDays(new Date(), parseInt(slaDays)), 'EEEE, MMM dd, yyyy')}
                </p>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Notes (optional)</h4>
                <Textarea value={assignNotes} onChange={e => setAssignNotes(e.target.value)} placeholder="Special instructions..." rows={2} />
              </div>

              {/* Notifications */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={notifyPartner} onCheckedChange={v => setNotifyPartner(!!v)} id="notify-partner" />
                  <label htmlFor="notify-partner" className="text-sm text-foreground">Notify partner</label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox checked={notifyCustomer} onCheckedChange={v => setNotifyCustomer(!!v)} id="notify-customer" />
                  <label htmlFor="notify-customer" className="text-sm text-foreground">Notify customer</label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setAssignModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAssign} disabled={!selectedPartner || assigning}>
                {assigning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Confirm Assignment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ClaimAssignment;
