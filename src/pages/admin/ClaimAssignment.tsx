import { useState, useEffect, useMemo, useCallback } from 'react';
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
  ChevronUp, Loader2, UserCheck, Calendar, Shield, Sparkles
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
  device_state?: string;
  device_city?: string;
  gadget_category_id?: string | null;
}

interface PartnerScore {
  partner: any;
  totalScore: number;
  breakdown: {
    location: number;
    availability: number;
    sla: number;
    rating: number;
    expertise: number;
  };
  details: string[];
  activeClaimsCount: number;
  isEligible: boolean;
}

const MAX_CAPACITY = 10;

const ClaimAssignment = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<ClaimWithDevice[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [devices, setDevices] = useState<Record<string, any>>({});
  const [assignments, setAssignments] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
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
  const [autoAssigning, setAutoAssigning] = useState(false);
  const [autoAssignResult, setAutoAssignResult] = useState<{ claim: ClaimWithDevice; scores: PartnerScore[] } | null>(null);
  const [autoAssignResultOpen, setAutoAssignResultOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [claimsRes, partnersRes, profilesRes, devicesRes, assignRes, historyRes, regionsRes] = await Promise.all([
      supabase.from('service_claims').select('*').order('created_at', { ascending: false }),
      supabase.from('partners').select('*').eq('is_active', true),
      supabase.from('profiles').select('id, full_name, email, phone'),
      supabase.from('customer_devices').select('id, product_name, serial_number, user_id, gadget_category_id, address'),
      supabase.from('claim_assignments').select('*'),
      supabase.from('claim_assignments').select('*, service_claims(*), partners(*)').order('created_at', { ascending: false }).limit(50),
      supabase.from('regions').select('*'),
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
    setRegions(regionsRes.data || []);

    const enrichedClaims = (claimsRes.data || []).map(c => {
      const device = c.device_id ? dMap[c.device_id] : null;
      return {
        ...c,
        customer_name: pMap[c.user_id]?.full_name || 'Unknown',
        customer_email: pMap[c.user_id]?.email || '',
        device_name: device?.product_name || 'Unknown Device',
        device_state: device?.address || '',
        gadget_category_id: device?.gadget_category_id || null,
      };
    });
    setClaims(enrichedClaims);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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

  // ===== ENHANCED PARTNER SCORING ENGINE =====
  const calculatePartnerScores = useCallback((claimIds: string[]): PartnerScore[] => {
    if (claimIds.length === 0) return [];

    // Get device info from the first selected claim for location/expertise matching
    const firstClaim = claims.find(c => c.id === claimIds[0]);
    const customerAddress = firstClaim?.device_state?.toLowerCase() || '';

    return partners.map(partner => {
      const details: string[] = [];
      const partnerAssignments = assignments.filter(a => a.partner_id === partner.id);
      const activeCount = partnerAssignments.filter(a => !['completed', 'rejected'].includes(a.status)).length;
      const completedCount = partnerAssignments.filter(a => a.status === 'completed').length;
      const totalAssigned = partnerAssignments.length;

      // ===== LOCATION SCORE (0-30 pts) =====
      let locationScore = 0;
      const partnerCity = partner.city?.toLowerCase() || '';
      const partnerState = partner.state?.toLowerCase() || '';

      if (customerAddress.includes(partnerCity) && partnerCity.length > 0) {
        locationScore = 30;
        details.push(`✓ Same city: ${partner.city} (30 pts)`);
      } else if (customerAddress.includes(partnerState) && partnerState.length > 0) {
        locationScore = 15;
        details.push(`~ Same state: ${partner.state} (15 pts)`);
      } else {
        locationScore = 5;
        details.push(`✗ Different region (5 pts)`);
      }

      // ===== CAPACITY / AVAILABILITY SCORE (0-25 pts) =====
      let availabilityScore = 0;
      if (activeCount >= MAX_CAPACITY) {
        availabilityScore = 0;
        details.push(`✗ At capacity ${activeCount}/${MAX_CAPACITY} (0 pts — SKIP)`);
        return {
          partner,
          totalScore: 0,
          breakdown: { location: locationScore, availability: 0, sla: 0, rating: 0, expertise: 0 },
          details: [...details, '❌ Partner at capacity — ineligible'],
          activeClaimsCount: activeCount,
          isEligible: false,
        };
      } else if (activeCount <= 2) {
        availabilityScore = 25;
        details.push(`✓ Low workload ${activeCount}/${MAX_CAPACITY} (25 pts)`);
      } else if (activeCount <= 5) {
        availabilityScore = 18;
        details.push(`✓ Moderate workload ${activeCount}/${MAX_CAPACITY} (18 pts)`);
      } else {
        availabilityScore = 8;
        details.push(`~ High workload ${activeCount}/${MAX_CAPACITY} (8 pts)`);
      }

      // ===== SLA COMPLIANCE SCORE (0-20 pts) =====
      let slaScore = 0;
      const slaCompliance = totalAssigned > 0
        ? Math.round((completedCount / totalAssigned) * 100)
        : 50; // Default for new partners

      if (slaCompliance >= 90) {
        slaScore = 20;
        details.push(`✓ Excellent completion ${slaCompliance}% (20 pts)`);
      } else if (slaCompliance >= 75) {
        slaScore = 15;
        details.push(`✓ Good completion ${slaCompliance}% (15 pts)`);
      } else if (slaCompliance >= 50) {
        slaScore = 8;
        details.push(`~ Fair completion ${slaCompliance}% (8 pts)`);
      } else {
        slaScore = 3;
        details.push(`✗ Low completion ${slaCompliance}% (3 pts)`);
      }

      // Bonus for fast turnaround
      if (partner.sla_turnaround_days <= 3) {
        slaScore = Math.min(20, slaScore + 5);
        details.push(`✓ Fast turnaround: ${partner.sla_turnaround_days}d (+5 pts)`);
      }

      // ===== EXPERTISE / SPECIALIZATION SCORE (0-15 pts) =====
      let expertiseScore = 0;
      const isTechnical = partner.partner_type === 'technical';

      if (isTechnical) {
        expertiseScore = 15;
        details.push(`✓ Technical partner (15 pts)`);
      } else {
        expertiseScore = 5;
        details.push(`~ Non-technical partner (5 pts)`);
      }

      // ===== QUALITY RATING SCORE (0-10 pts) =====
      let ratingScore = 0;
      const rating = partner.quality_rating || 0;

      if (rating >= 4.5) {
        ratingScore = 10;
        details.push(`✓ Excellent rating ${rating}★ (10 pts)`);
      } else if (rating >= 4.0) {
        ratingScore = 8;
        details.push(`✓ Good rating ${rating}★ (8 pts)`);
      } else if (rating >= 3.0) {
        ratingScore = 5;
        details.push(`~ Fair rating ${rating}★ (5 pts)`);
      } else {
        ratingScore = 2;
        details.push(`✗ Low rating ${rating}★ (2 pts)`);
      }

      // Experience bonus
      if (partner.total_repairs >= 50) {
        ratingScore = Math.min(10, ratingScore + 2);
        details.push(`✓ Experienced: ${partner.total_repairs} repairs (+2 pts)`);
      }

      const totalScore = locationScore + availabilityScore + slaScore + expertiseScore + ratingScore;

      return {
        partner,
        totalScore,
        breakdown: {
          location: locationScore,
          availability: availabilityScore,
          sla: slaScore,
          expertise: expertiseScore,
          rating: ratingScore,
        },
        details,
        activeClaimsCount: activeCount,
        isEligible: true,
      };
    })
    .sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      return b.totalScore - a.totalScore;
    });
  }, [partners, assignments, claims]);

  // Partner scores for selected claims
  const getPartnerScores = useMemo(
    () => calculatePartnerScores(selectedClaims),
    [selectedClaims, calculatePartnerScores]
  );

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

  // ===== AUTO-ASSIGN BEST PARTNER =====
  const handleAutoAssign = async (claimId: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;

    setAutoAssigning(true);
    const scores = calculatePartnerScores([claimId]);
    const eligible = scores.filter(s => s.isEligible);

    if (eligible.length === 0) {
      toast.error('No eligible partners found');
      setAutoAssigning(false);
      return;
    }

    setAutoAssignResult({ claim, scores: eligible });
    setAutoAssignResultOpen(true);
    setAutoAssigning(false);
  };

  const confirmAutoAssign = async (partnerId: string) => {
    if (!autoAssignResult) return;
    setAssigning(true);
    try {
      const selectedScore = autoAssignResult.scores.find(s => s.partner.id === partnerId);
      const deadline = addDays(new Date(), selectedScore?.partner.sla_turnaround_days || 5);

      const { error: assignError } = await supabase.from('claim_assignments').insert({
        claim_id: autoAssignResult.claim.id,
        partner_id: partnerId,
        assigned_by: user?.id,
        sla_deadline: deadline.toISOString(),
        status: 'pending',
        notes: `Auto-assigned. Match score: ${selectedScore?.totalScore}/100`,
      });
      if (assignError) throw assignError;

      const { error: statusError } = await supabase
        .from('service_claims')
        .update({ status: 'assigned', assigned_partner_id: partnerId })
        .eq('id', autoAssignResult.claim.id);
      if (statusError) throw statusError;

      // Notifications
      const partner = partners.find(p => p.id === partnerId);
      if (partner?.user_id) {
        await supabase.from('notifications').insert({
          user_id: partner.user_id,
          type: 'claim_assigned',
          title: 'New Claim Assigned',
          message: `Claim for ${autoAssignResult.claim.device_name} (${autoAssignResult.claim.issue_type}) assigned. SLA: ${format(deadline, 'MMM dd, yyyy')}`,
          related_id: autoAssignResult.claim.id,
        });
      }
      if (autoAssignResult.claim.user_id) {
        await supabase.from('notifications').insert({
          user_id: autoAssignResult.claim.user_id,
          type: 'claim_partner_assigned',
          title: 'Repair Partner Assigned',
          message: `${partner?.name || 'A partner'} has been assigned to your ${autoAssignResult.claim.device_name}. Expected by ${format(deadline, 'MMM dd, yyyy')}.`,
          related_id: autoAssignResult.claim.id,
        });
      }

      // Audit log
      await supabase.from('device_approval_logs').insert({
        device_id: autoAssignResult.claim.id,
        action: 'claim_auto_assigned',
        admin_id: user?.id,
        notes: `Auto-assigned to ${partner?.name}. Score: ${selectedScore?.totalScore}/100. Breakdown: Location=${selectedScore?.breakdown.location}, Capacity=${selectedScore?.breakdown.availability}, SLA=${selectedScore?.breakdown.sla}, Expertise=${selectedScore?.breakdown.expertise}, Rating=${selectedScore?.breakdown.rating}`,
      });

      toast.success(`Claim assigned to ${partner?.name}`);
      setAutoAssignResultOpen(false);
      setAutoAssignResult(null);
      fetchData();
    } catch (error: any) {
      toast.error('Assignment failed: ' + error.message);
    } finally {
      setAssigning(false);
    }
  };

  // ===== BULK AUTO-ASSIGN =====
  const handleBulkAutoAssign = async () => {
    if (selectedClaims.length === 0) return;
    setAutoAssigning(true);
    let successCount = 0;

    for (const claimId of selectedClaims) {
      const scores = calculatePartnerScores([claimId]);
      const best = scores.find(s => s.isEligible);
      if (!best) continue;

      try {
        const deadline = addDays(new Date(), best.partner.sla_turnaround_days || 5);
        await supabase.from('claim_assignments').insert({
          claim_id: claimId,
          partner_id: best.partner.id,
          assigned_by: user?.id,
          sla_deadline: deadline.toISOString(),
          status: 'pending',
          notes: `Bulk auto-assigned. Score: ${best.totalScore}/100`,
        });
        await supabase
          .from('service_claims')
          .update({ status: 'assigned', assigned_partner_id: best.partner.id })
          .eq('id', claimId);

        const claim = claims.find(c => c.id === claimId);
        if (claim?.user_id) {
          await supabase.from('notifications').insert({
            user_id: claim.user_id,
            type: 'claim_partner_assigned',
            title: 'Repair Partner Assigned',
            message: `${best.partner.name} has been assigned to your repair. Expected by ${format(deadline, 'MMM dd, yyyy')}.`,
            related_id: claimId,
          });
        }

        successCount++;
      } catch (err) {
        console.error('Failed to assign claim:', claimId, err);
      }
    }

    toast.success(`${successCount} of ${selectedClaims.length} claims auto-assigned`);
    setSelectedClaims([]);
    setAutoAssigning(false);
    fetchData();
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

        // Audit log
        const partnerScore = getPartnerScores.find(ps => ps.partner.id === selectedPartner);
        await supabase.from('device_approval_logs').insert({
          device_id: claimId,
          action: 'claim_manually_assigned',
          admin_id: user?.id,
          notes: `Manually assigned to ${partner?.name}. Score: ${partnerScore?.totalScore || 'N/A'}/100`,
        });
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

  const getCapacityColor = (active: number, max: number = MAX_CAPACITY) => {
    const pct = (active / max) * 100;
    if (pct < 50) return 'text-green-600';
    if (pct < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Claim Assignment</h1>
            <p className="text-muted-foreground">Smart matching with location, SLA, capacity & expertise scoring</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowHistory(!showHistory)}>
              <Clock className="h-4 w-4 mr-2" />
              {showHistory ? 'Hide History' : 'History'}
            </Button>
            {selectedClaims.length > 0 && (
              <>
                <Button variant="outline" onClick={handleBulkAutoAssign} disabled={autoAssigning}>
                  {autoAssigning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                  Auto-Assign {selectedClaims.length}
                </Button>
                <Button onClick={() => setAssignModalOpen(true)}>
                  <Target className="h-4 w-4 mr-2" />
                  Manual Assign {selectedClaims.length}
                </Button>
              </>
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
                              {h.notes && ` • ${h.notes}`}
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
                        <div className="flex items-center gap-2">
                          <Badge variant={claim.status === 'approved' ? 'default' : 'secondary'}>
                            {claim.status}
                          </Badge>
                          {filterStatus === 'approved' && !assignedClaimIds.has(claim.id) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAutoAssign(claim.id)}
                              disabled={autoAssigning}
                            >
                              <Zap className="h-3 w-3 mr-1" /> Auto
                            </Button>
                          )}
                        </div>
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
                    Smart Partner Recommendations ({getPartnerScores.filter(s => s.isEligible).length} eligible)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getPartnerScores.slice(0, 5).map((ps, idx) => (
                    <div
                      key={ps.partner.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${!ps.isEligible ? 'opacity-50' : ''} ${selectedPartner === ps.partner.id ? 'ring-2 ring-primary border-primary' : 'hover:border-primary/50'}`}
                      onClick={() => ps.isEligible && setSelectedPartner(ps.partner.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${idx === 0 && ps.isEligible ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-muted text-muted-foreground'}`}>
                            #{idx + 1}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-foreground">{ps.partner.name}</p>
                              {idx === 0 && ps.isEligible && <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-300 dark:text-yellow-400">Best Match</Badge>}
                              {!ps.isEligible && <Badge variant="destructive">At Capacity</Badge>}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {ps.partner.city}, {ps.partner.state}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getScoreColor(ps.totalScore)}`}>{ps.totalScore}</p>
                            <p className="text-xs text-muted-foreground">/100</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={e => { e.stopPropagation(); setExpandedPartner(expandedPartner === ps.partner.id ? null : ps.partner.id); }}
                          >
                            {expandedPartner === ps.partner.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>

                      {/* Quick stats */}
                      <div className="flex items-center gap-4 mt-3 text-sm flex-wrap">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3" /> {ps.breakdown.location}/30
                        </span>
                        <span className={`flex items-center gap-1 ${getCapacityColor(ps.activeClaimsCount)}`}>
                          <Users className="h-3 w-3" /> {ps.activeClaimsCount}/{MAX_CAPACITY}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Star className="h-3 w-3 text-yellow-500" /> {ps.partner.quality_rating}/5
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
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                              {[
                                { label: 'Location', value: ps.breakdown.location, max: 30, icon: MapPin },
                                { label: 'Capacity', value: ps.breakdown.availability, max: 25, icon: Users },
                                { label: 'SLA', value: ps.breakdown.sla, max: 20, icon: Clock },
                                { label: 'Expertise', value: ps.breakdown.expertise, max: 15, icon: Award },
                                { label: 'Rating', value: ps.breakdown.rating, max: 10, icon: Star },
                              ].map(item => (
                                <div key={item.label} className="space-y-1">
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <item.icon className="h-3 w-3" /> {item.label}
                                  </div>
                                  <Progress value={(item.value / item.max) * 100} className="h-2" />
                                  <p className="text-xs font-medium text-foreground">{item.value}/{item.max}</p>
                                </div>
                              ))}
                            </div>
                            <div className="mt-3 space-y-1">
                              {ps.details.map((d, i) => (
                                <p key={i} className="text-xs text-muted-foreground">{d}</p>
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
                      <ArrowRight className="h-4 w-4 mr-2" /> Proceed with Manual Assignment
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auto-Assign Result Modal */}
        <Dialog open={autoAssignResultOpen} onOpenChange={setAutoAssignResultOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Auto-Assignment Result
              </DialogTitle>
            </DialogHeader>
            {autoAssignResult && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Claim: <span className="font-medium text-foreground">{autoAssignResult.claim.device_name} — {autoAssignResult.claim.issue_type}</span></p>
                  <p>Customer: <span className="font-medium text-foreground">{autoAssignResult.claim.customer_name}</span></p>
                </div>

                <Separator />

                <div className="space-y-3">
                  {autoAssignResult.scores.slice(0, 5).map((ps, idx) => (
                    <div
                      key={ps.partner.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-primary/50 ${idx === 0 ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}>
                            {idx + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-sm">{ps.partner.name}</p>
                            <p className="text-xs text-muted-foreground">{ps.partner.city}, {ps.partner.state}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-bold ${getScoreColor(ps.totalScore)}`}>{ps.totalScore}</span>
                          <Button
                            size="sm"
                            onClick={() => confirmAutoAssign(ps.partner.id)}
                            disabled={assigning}
                            className={idx === 0 ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
                            variant={idx === 0 ? 'default' : 'outline'}
                          >
                            {assigning ? <Loader2 className="h-3 w-3 animate-spin" /> : idx === 0 ? 'Assign' : 'Pick'}
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs text-muted-foreground">
                        <span>📍 {ps.breakdown.location}/30</span>
                        <span>📊 {ps.breakdown.availability}/25</span>
                        <span>⏱ {ps.breakdown.sla}/20</span>
                        <span>🔧 {ps.breakdown.expertise}/15</span>
                        <span>⭐ {ps.breakdown.rating}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Assignment Confirmation Modal */}
        <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Confirm Manual Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
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

              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Assigned Partner</h4>
                {selectedPartnerData ? (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{selectedPartnerData.partner.name}</p>
                      <p className="text-sm text-muted-foreground">{selectedPartnerData.partner.city}, {selectedPartnerData.partner.state} • Score: {selectedPartnerData.totalScore}/100</p>
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

              <div>
                <h4 className="text-sm font-medium text-foreground mb-2">Notes (optional)</h4>
                <Textarea value={assignNotes} onChange={e => setAssignNotes(e.target.value)} placeholder="Special instructions..." rows={2} />
              </div>

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
