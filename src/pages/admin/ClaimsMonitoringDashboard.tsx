import { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import {
  AlertCircle, CheckCircle2, Clock, TrendingUp, TrendingDown, BarChart3,
  Filter, Download, Search, Star, Users, Phone, MessageSquare, RefreshCw,
  ArrowUpRight, ArrowDownRight, Eye, AlertTriangle, Loader2, Calendar, Shield,
  ShieldCheck, ShieldAlert, ShieldX, Zap, FileCheck
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays, differenceInHours, startOfMonth, subMonths, isAfter, isBefore, addDays } from 'date-fns';
import { toast } from 'sonner';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';

// Status pipeline config
const STATUS_ORDER = ['submitted', 'in_review', 'approved', 'assigned', 'in_repair', 'quality_check', 'ready_for_delivery', 'completed', 'rejected'] as const;
const STATUS_CONFIG: Record<string, { label: string; color: string; chartColor: string }> = {
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', chartColor: 'hsl(217, 91%, 60%)' },
  pending: { label: 'Pending', color: 'bg-blue-100 text-blue-700', chartColor: 'hsl(217, 91%, 60%)' },
  in_review: { label: 'In Review', color: 'bg-yellow-100 text-yellow-700', chartColor: 'hsl(45, 93%, 47%)' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', chartColor: 'hsl(142, 71%, 45%)' },
  assigned: { label: 'Assigned', color: 'bg-purple-100 text-purple-700', chartColor: 'hsl(271, 91%, 65%)' },
  in_repair: { label: 'In Repair', color: 'bg-orange-100 text-orange-700', chartColor: 'hsl(24, 95%, 53%)' },
  in_progress: { label: 'In Progress', color: 'bg-orange-100 text-orange-700', chartColor: 'hsl(24, 95%, 53%)' },
  quality_check: { label: 'Quality Check', color: 'bg-yellow-100 text-yellow-700', chartColor: 'hsl(45, 93%, 47%)' },
  ready_for_delivery: { label: 'Ready', color: 'bg-emerald-100 text-emerald-700', chartColor: 'hsl(160, 84%, 39%)' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800', chartColor: 'hsl(142, 76%, 36%)' },
  resolved: { label: 'Resolved', color: 'bg-green-100 text-green-800', chartColor: 'hsl(142, 76%, 36%)' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', chartColor: 'hsl(0, 84%, 60%)' },
};

// Coverage mapping for issue types
const COVERAGE_MAP: Record<string, string> = {
  'hardware_failure': 'covers_hardware_failure',
  'battery': 'covers_battery',
  'motherboard': 'covers_motherboard',
  'accidental_damage': 'covers_accidental_damage',
  'liquid_damage': 'covers_liquid_damage',
  'screen': 'covers_accidental_damage',
  'water': 'covers_liquid_damage',
};

interface EligibilityResult {
  eligible: boolean;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  checks: Record<string, boolean>;
  recommendation: 'auto_approve' | 'manual_review' | 'fraud_check';
  details: string[];
}

const ClaimsMonitoringDashboard = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<any[]>([]);
  const [partners, setPartners] = useState<Record<string, any>>({});
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionTab, setActionTab] = useState('all');
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Eligibility state
  const [eligibilityChecks, setEligibilityChecks] = useState<Record<string, EligibilityResult>>({});
  const [eligibilityDrawerOpen, setEligibilityDrawerOpen] = useState(false);
  const [reviewingClaim, setReviewingClaim] = useState<any>(null);
  const [reviewingEligibility, setReviewingEligibility] = useState<EligibilityResult | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [checkingEligibility, setCheckingEligibility] = useState(false);

  const fetchData = useCallback(async () => {
    const thisMonth = startOfMonth(new Date()).toISOString();
    const [claimsRes, assignRes, updatesRes, partnersRes, profilesRes, feedbackRes] = await Promise.all([
      supabase.from('service_claims').select('*').order('created_at', { ascending: false }),
      supabase.from('claim_assignments').select('*'),
      supabase.from('claim_status_updates').select('*').order('created_at', { ascending: true }),
      supabase.from('partners').select('*'),
      supabase.from('profiles').select('id, full_name, email, phone'),
      supabase.from('claim_feedback').select('*'),
    ]);

    setClaims(claimsRes.data || []);
    setAssignments(assignRes.data || []);
    setStatusUpdates(updatesRes.data || []);
    setFeedback(feedbackRes.data || []);

    const pMap: Record<string, any> = {};
    (partnersRes.data || []).forEach(p => { pMap[p.id] = p; });
    setPartners(pMap);

    const prMap: Record<string, any> = {};
    (profilesRes.data || []).forEach(p => { prMap[p.id] = p; });
    setProfiles(prMap);

    setLoading(false);
    setLastRefresh(new Date());
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => { fetchData(); }, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('claims-monitoring')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_claims' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'claim_assignments' }, () => fetchData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'claim_status_updates' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // ===== ELIGIBILITY CHECKER =====
  const checkClaimEligibility = useCallback(async (claim: any): Promise<EligibilityResult> => {
    const checks: Record<string, boolean> = {};
    const details: string[] = [];
    let riskScore = 0;

    // CHECK 1: Device approved & active? (0-20 pts)
    const { data: device } = await supabase
      .from('customer_devices')
      .select('*, subscription_plan_id, subscription_plans:subscription_plan_id(*)')
      .eq('id', claim.device_id)
      .maybeSingle();

    checks.device_approved = !!device && device.status === 'active';
    if (!device || device.status !== 'active') {
      riskScore += 20;
      details.push('❌ Device not approved or inactive');
    } else {
      details.push('✓ Device approved and active');
    }

    // CHECK 2: Subscription active? (0-15 pts)
    const subActive = !!device && device.subscription_end && new Date(device.subscription_end) > new Date();
    checks.subscription_active = subActive;
    if (!subActive) {
      riskScore += 15;
      details.push('❌ Subscription expired or not active');
    } else {
      details.push('✓ Subscription active');
    }

    // CHECK 3: Coverage includes this issue type? (0-15 pts)
    const plan = device?.subscription_plans;
    const coverageField = COVERAGE_MAP[claim.issue_type?.toLowerCase()] || null;
    const covered = plan && coverageField ? !!plan[coverageField] : false;
    checks.coverage_includes_issue = covered;
    if (!covered) {
      riskScore += 15;
      details.push(`❌ Issue type "${claim.issue_type}" not covered by plan`);
    } else {
      details.push(`✓ "${claim.issue_type}" covered by plan`);
    }

    // CHECK 4: Not a duplicate / excessive claims? (0-20 pts)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: recentClaims } = await supabase
      .from('service_claims')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', claim.device_id)
      .neq('id', claim.id)
      .gte('created_at', thirtyDaysAgo);

    checks.not_duplicate = !recentClaims || recentClaims < 2;
    if (recentClaims && recentClaims >= 2) {
      riskScore += 20;
      details.push(`⚠️ ${recentClaims} other claims on this device in last 30 days`);
    } else {
      details.push('✓ No excessive recent claims');
    }

    // CHECK 5: Claim details complete? (0-10 pts)
    const descComplete = claim.description && claim.description.length > 20;
    const hasImages = claim.image_urls && claim.image_urls.length > 0;
    checks.claim_details_complete = descComplete && hasImages;
    if (!descComplete || !hasImages) {
      riskScore += 10;
      const missing = [];
      if (!descComplete) missing.push('detailed description');
      if (!hasImages) missing.push('photos');
      details.push(`⚠️ Incomplete: missing ${missing.join(', ')}`);
    } else {
      details.push('✓ Claim details complete with photos');
    }

    // CHECK 6: Payment status (0-15 pts)
    const paymentOk = device?.payment_status === 'paid';
    if (!paymentOk) {
      riskScore += 15;
      details.push('⚠️ Device payment not confirmed');
    } else {
      details.push('✓ Payment confirmed');
    }

    // Determine recommendation
    let recommendation: 'auto_approve' | 'manual_review' | 'fraud_check';
    let riskLevel: 'low' | 'medium' | 'high';

    if (riskScore < 30) {
      recommendation = 'auto_approve';
      riskLevel = 'low';
    } else if (riskScore < 60) {
      recommendation = 'manual_review';
      riskLevel = 'medium';
    } else {
      recommendation = 'fraud_check';
      riskLevel = 'high';
    }

    return {
      eligible: riskScore < 60,
      riskScore: Math.min(100, riskScore),
      riskLevel,
      checks,
      recommendation,
      details,
    };
  }, []);

  // Run eligibility checks on pending/submitted claims
  const runEligibilityChecks = useCallback(async () => {
    const pendingClaims = claims.filter(c =>
      ['pending', 'submitted'].includes(c.status) && !eligibilityChecks[c.id]
    );
    if (pendingClaims.length === 0) return;

    setCheckingEligibility(true);
    const newChecks: Record<string, EligibilityResult> = { ...eligibilityChecks };

    for (const claim of pendingClaims) {
      try {
        const result = await checkClaimEligibility(claim);
        newChecks[claim.id] = result;

        // Store in DB
        await supabase.from('claim_eligibility_checks').insert({
          claim_id: claim.id,
          subscription_active: result.checks.subscription_active,
          device_approved: result.checks.device_approved,
          coverage_includes_issue: result.checks.coverage_includes_issue,
          not_duplicate: result.checks.not_duplicate,
          claim_details_complete: result.checks.claim_details_complete,
          risk_score: result.riskScore,
          risk_level: result.riskLevel,
          recommendation: result.recommendation,
          details: result.details,
          checked_by: user?.id,
        });

        // Auto-approve low-risk claims
        if (result.recommendation === 'auto_approve') {
          await supabase
            .from('service_claims')
            .update({ status: 'approved', admin_notes: 'Auto-approved: Low risk score (' + result.riskScore + '/100)' })
            .eq('id', claim.id);

          // Audit log
          await logAuditEntry(claim.id, 'auto_approved', `Auto-approved with risk score ${result.riskScore}/100`);

          // Notify customer
          await supabase.from('notifications').insert({
            user_id: claim.user_id,
            type: 'claim_approved',
            title: 'Claim Approved',
            message: `Your claim for ${claim.issue_type} has been approved.`,
            related_id: claim.id,
          });
        }
      } catch (err) {
        console.error('Eligibility check failed for claim:', claim.id, err);
      }
    }

    setEligibilityChecks(newChecks);
    setCheckingEligibility(false);

    // Refresh data if any auto-approvals happened
    const autoApproved = pendingClaims.filter(c => newChecks[c.id]?.recommendation === 'auto_approve').length;
    if (autoApproved > 0) {
      toast.success(`${autoApproved} low-risk claim(s) auto-approved`);
      fetchData();
    }
  }, [claims, eligibilityChecks, checkClaimEligibility, user?.id, fetchData]);

  useEffect(() => {
    if (claims.length > 0 && user?.id) {
      runEligibilityChecks();
    }
  }, [claims, user?.id]); // Only re-run when claims change, not on eligibilityChecks change

  const logAuditEntry = async (claimId: string, action: string, notes?: string) => {
    await supabase.from('device_approval_logs').insert({
      device_id: claimId, // Using device_approval_logs as audit trail
      action: `claim_${action}`,
      admin_id: user?.id,
      notes,
    });
  };

  const handleManualApprove = async () => {
    if (!reviewingClaim) return;
    setProcessing(true);
    try {
      await supabase
        .from('service_claims')
        .update({ status: 'approved', admin_notes: 'Manually approved after review' })
        .eq('id', reviewingClaim.id);

      await logAuditEntry(reviewingClaim.id, 'manually_approved',
        `Risk score: ${reviewingEligibility?.riskScore}/100, Level: ${reviewingEligibility?.riskLevel}`);

      await supabase.from('notifications').insert({
        user_id: reviewingClaim.user_id,
        type: 'claim_approved',
        title: 'Claim Approved',
        message: `Your claim for ${reviewingClaim.issue_type} has been approved.`,
        related_id: reviewingClaim.id,
      });

      toast.success('Claim approved');
      setEligibilityDrawerOpen(false);
      fetchData();
    } catch {
      toast.error('Failed to approve claim');
    } finally {
      setProcessing(false);
    }
  };

  const handleManualReject = async () => {
    if (!reviewingClaim) return;
    setProcessing(true);
    try {
      await supabase
        .from('service_claims')
        .update({ status: 'rejected', admin_notes: rejectReason || 'Rejected after review' })
        .eq('id', reviewingClaim.id);

      await logAuditEntry(reviewingClaim.id, 'rejected',
        `Risk score: ${reviewingEligibility?.riskScore}/100. Reason: ${rejectReason || 'Not specified'}`);

      await supabase.from('notifications').insert({
        user_id: reviewingClaim.user_id,
        type: 'claim_rejected',
        title: 'Claim Rejected',
        message: `Your claim for ${reviewingClaim.issue_type} has been rejected. ${rejectReason ? `Reason: ${rejectReason}` : ''}`,
        related_id: reviewingClaim.id,
      });

      toast.success('Claim rejected');
      setEligibilityDrawerOpen(false);
      setRejectReason('');
      fetchData();
    } catch {
      toast.error('Failed to reject claim');
    } finally {
      setProcessing(false);
    }
  };

  const openEligibilityReview = async (claim: any) => {
    setReviewingClaim(claim);
    setRejectReason('');

    // Run or get eligibility check
    let result = eligibilityChecks[claim.id];
    if (!result) {
      result = await checkClaimEligibility(claim);
      setEligibilityChecks(prev => ({ ...prev, [claim.id]: result }));
    }
    setReviewingEligibility(result);
    setEligibilityDrawerOpen(true);
  };

  // ===== COMPUTED METRICS =====
  const thisMonth = startOfMonth(new Date());
  const lastMonth = startOfMonth(subMonths(new Date(), 1));

  const claimsThisMonth = useMemo(() => claims.filter(c => isAfter(new Date(c.created_at), thisMonth)), [claims, thisMonth]);
  const claimsLastMonth = useMemo(() => claims.filter(c => isAfter(new Date(c.created_at), lastMonth) && isBefore(new Date(c.created_at), thisMonth)), [claims, lastMonth, thisMonth]);

  const monthlyChange = claimsLastMonth.length > 0
    ? Math.round(((claimsThisMonth.length - claimsLastMonth.length) / claimsLastMonth.length) * 100)
    : 0;

  // Status counts
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    claims.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [claims]);

  // Average resolution time
  const avgResolutionDays = useMemo(() => {
    const completed = claims.filter(c => ['completed', 'resolved'].includes(c.status));
    if (completed.length === 0) return 0;
    const totalDays = completed.reduce((sum, c) => sum + differenceInDays(new Date(c.updated_at), new Date(c.created_at)), 0);
    return Math.round((totalDays / completed.length) * 10) / 10;
  }, [claims]);

  // SLA tracking
  const slaData = useMemo(() => {
    const assignmentMap = new Map(assignments.map(a => [a.claim_id, a]));
    const activeClaims = claims.filter(c => !['completed', 'resolved', 'rejected'].includes(c.status));
    const onTrack: any[] = [];
    const atRisk: any[] = [];
    const overdue: any[] = [];

    activeClaims.forEach(c => {
      const assignment = assignmentMap.get(c.id);
      if (!assignment?.sla_deadline) {
        atRisk.push({ ...c, daysRemaining: null, assignment });
        return;
      }
      const daysLeft = differenceInDays(new Date(assignment.sla_deadline), new Date());
      const enriched = { ...c, daysRemaining: daysLeft, assignment };
      if (daysLeft < 0) overdue.push(enriched);
      else if (daysLeft <= 2) atRisk.push(enriched);
      else onTrack.push(enriched);
    });

    const total = onTrack.length + atRisk.length + overdue.length;
    return {
      onTrack, atRisk, overdue, total,
      compliancePct: total > 0 ? Math.round(((total - overdue.length) / total) * 100) : 100,
    };
  }, [claims, assignments]);

  // Customer satisfaction
  const avgRating = useMemo(() => {
    if (feedback.length === 0) return 0;
    return Math.round((feedback.reduce((s, f) => s + f.rating, 0) / feedback.length) * 10) / 10;
  }, [feedback]);

  // Eligibility summary
  const eligibilitySummary = useMemo(() => {
    const checked = Object.values(eligibilityChecks);
    return {
      total: checked.length,
      autoApproved: checked.filter(e => e.recommendation === 'auto_approve').length,
      needsReview: checked.filter(e => e.recommendation === 'manual_review').length,
      fraudCheck: checked.filter(e => e.recommendation === 'fraud_check').length,
    };
  }, [eligibilityChecks]);

  // Pending actions
  const pendingActions = useMemo(() => {
    const awaitingApproval = claims.filter(c => c.status === 'pending' || c.status === 'submitted').length;
    const assignmentIds = new Set(assignments.map(a => a.claim_id));
    const awaitingAssignment = claims.filter(c => c.status === 'approved' && !assignmentIds.has(c.id)).length;
    return { awaitingApproval, awaitingAssignment, slaAtRisk: slaData.atRisk.length, total: awaitingApproval + awaitingAssignment + slaData.atRisk.length };
  }, [claims, assignments, slaData]);

  // Pipeline chart data
  const pipelineData = useMemo(() => {
    return STATUS_ORDER.filter(s => s !== 'rejected').map(status => ({
      status: STATUS_CONFIG[status]?.label || status,
      count: statusCounts[status] || 0,
      color: STATUS_CONFIG[status]?.chartColor || 'hsl(var(--muted))',
    }));
  }, [statusCounts]);

  // Daily claims chart (last 30 days)
  const dailyClaimsData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = format(addDays(new Date(), -i), 'MMM dd');
      days[d] = 0;
    }
    claims.forEach(c => {
      const d = format(new Date(c.created_at), 'MMM dd');
      if (days[d] !== undefined) days[d]++;
    });
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }, [claims]);

  // Claims needing action
  const actionClaims = useMemo(() => {
    const assignmentMap = new Map(assignments.map(a => [a.claim_id, a]));
    const assignmentIds = new Set(assignments.map(a => a.claim_id));

    return claims.filter(c => {
      if (actionTab === 'approval') return ['pending', 'submitted'].includes(c.status);
      if (actionTab === 'assignment') return c.status === 'approved' && !assignmentIds.has(c.id);
      if (actionTab === 'sla_risk') return slaData.atRisk.some(r => r.id === c.id) || slaData.overdue.some(r => r.id === c.id);
      return ['pending', 'submitted'].includes(c.status) ||
        (c.status === 'approved' && !assignmentIds.has(c.id)) ||
        slaData.atRisk.some(r => r.id === c.id) ||
        slaData.overdue.some(r => r.id === c.id);
    }).filter(c => {
      if (!search) return true;
      const s = search.toLowerCase();
      return c.id.toLowerCase().includes(s) ||
        c.issue_type.toLowerCase().includes(s) ||
        (profiles[c.user_id]?.full_name || '').toLowerCase().includes(s);
    }).map(c => {
      const assignment = assignmentMap.get(c.id);
      const daysRemaining = assignment?.sla_deadline ? differenceInDays(new Date(assignment.sla_deadline), new Date()) : null;
      let priority: 'critical' | 'high' | 'medium' | 'low' = 'low';
      if (daysRemaining !== null && daysRemaining < 0) priority = 'critical';
      else if (daysRemaining !== null && daysRemaining <= 2) priority = 'high';
      else if (c.status === 'approved' && !assignmentIds.has(c.id)) priority = 'medium';
      else if (['pending', 'submitted'].includes(c.status)) priority = 'low';
      return { ...c, assignment, daysRemaining, priority, partnerName: assignment ? partners[assignment.partner_id]?.name : null };
    }).sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return order[a.priority] - order[b.priority];
    });
  }, [claims, assignments, actionTab, search, slaData, partners, profiles]);

  // Claim detail timeline
  const claimTimeline = useMemo(() => {
    if (!selectedClaim) return [];
    return statusUpdates
      .filter(u => u.claim_id === selectedClaim.id)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [selectedClaim, statusUpdates]);

  const openClaimDetail = (claim: any) => {
    setSelectedClaim(claim);
    setDetailOpen(true);
  };

  const exportCSV = () => {
    const headers = ['Claim ID', 'Status', 'Issue Type', 'Customer', 'Partner', 'Risk Score', 'Risk Level', 'Days Pending', 'Created At'];
    const rows = actionClaims.map(c => [
      c.id, c.status, c.issue_type,
      profiles[c.user_id]?.full_name || '',
      c.partnerName || '',
      eligibilityChecks[c.id]?.riskScore ?? 'N/A',
      eligibilityChecks[c.id]?.riskLevel ?? 'N/A',
      differenceInDays(new Date(), new Date(c.created_at)),
      format(new Date(c.created_at), 'yyyy-MM-dd'),
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `claims-monitoring-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success('Report exported');
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { label: string; variant: 'destructive' | 'default' | 'secondary' | 'outline' }> = {
      critical: { label: '🔴 Critical', variant: 'destructive' },
      high: { label: '🟠 High', variant: 'default' },
      medium: { label: '🟡 Medium', variant: 'secondary' },
      low: { label: '🔵 Low', variant: 'outline' },
    };
    const c = config[priority] || config.low;
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  const getRiskBadge = (claimId: string) => {
    const elig = eligibilityChecks[claimId];
    if (!elig) return <Badge variant="outline" className="text-muted-foreground">—</Badge>;
    if (elig.riskLevel === 'low') return <Badge className="bg-green-600 hover:bg-green-700 text-white">{elig.riskScore}/100</Badge>;
    if (elig.riskLevel === 'medium') return <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">{elig.riskScore}/100</Badge>;
    return <Badge className="bg-red-600 hover:bg-red-700 text-white">{elig.riskScore}/100</Badge>;
  };

  const getEligibilityBadge = (claimId: string) => {
    const elig = eligibilityChecks[claimId];
    if (!elig) return null;
    if (elig.recommendation === 'auto_approve') return <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400">✓ Auto-Approved</Badge>;
    if (elig.recommendation === 'manual_review') return <Badge variant="outline" className="border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400">⚠️ Review Needed</Badge>;
    return <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400">🚨 Fraud Check</Badge>;
  };

  const getComplianceColor = (pct: number) => {
    if (pct >= 90) return 'text-green-600';
    if (pct >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Claims Monitoring</h1>
            <p className="text-sm text-muted-foreground">
              Real-time overview • Last refreshed {format(lastRefresh, 'HH:mm:ss')}
              {checkingEligibility && <span className="ml-2 text-primary">• Running eligibility checks...</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {/* Total Claims This Month */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground">Claims This Month</p>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{claimsThisMonth.length}</p>
              <div className="flex items-center gap-1 text-xs mt-1">
                {monthlyChange >= 0
                  ? <><ArrowUpRight className="h-3 w-3 text-green-600" /><span className="text-green-600">{monthlyChange}%</span></>
                  : <><ArrowDownRight className="h-3 w-3 text-red-600" /><span className="text-red-600">{Math.abs(monthlyChange)}%</span></>
                }
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Avg Resolution */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground">Avg Resolution</p>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{avgResolutionDays}d</p>
              <p className="text-xs text-muted-foreground mt-1">Target: 5 days</p>
            </CardContent>
          </Card>

          {/* SLA Compliance */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground">SLA Compliance</p>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className={`text-2xl font-bold ${getComplianceColor(slaData.compliancePct)}`}>
                {slaData.compliancePct}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {slaData.overdue.length} overdue
              </p>
            </CardContent>
          </Card>

          {/* Customer Satisfaction */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground">Satisfaction</p>
                <Star className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold text-foreground">{avgRating || '—'}/5</p>
              <p className="text-xs text-muted-foreground mt-1">{feedback.length} ratings</p>
            </CardContent>
          </Card>

          {/* Pending Actions */}
          <Card className={pendingActions.total > 0 ? 'border-destructive/50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground">Pending Actions</p>
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-2xl font-bold text-foreground">{pendingActions.total}</p>
              <p className="text-xs text-muted-foreground mt-1">Need attention</p>
            </CardContent>
          </Card>

          {/* Eligibility Summary */}
          <Card className="border-primary/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-muted-foreground">Auto-Screened</p>
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{eligibilitySummary.total}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {eligibilitySummary.autoApproved} auto • {eligibilitySummary.needsReview} review • {eligibilitySummary.fraudCheck} flag
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Status Pipeline */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Claims Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={pipelineData} layout="vertical" margin={{ left: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="status" tick={{ fontSize: 12 }} width={70} />
                  <RechartsTooltip />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {pipelineData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Daily Claims Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily Claims (30 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={dailyClaimsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                  <YAxis />
                  <RechartsTooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* SLA Status Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5" /> SLA Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* On Track */}
              <div className="border rounded-lg p-4 border-green-200 bg-green-50/50 dark:bg-green-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-foreground">On Track</span>
                </div>
                <p className="text-3xl font-bold text-green-600">{slaData.onTrack.length}</p>
                <p className="text-sm text-muted-foreground">
                  {slaData.total > 0 ? Math.round((slaData.onTrack.length / slaData.total) * 100) : 0}% of active claims
                </p>
              </div>

              {/* At Risk */}
              <div className="border rounded-lg p-4 border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-semibold text-foreground">At Risk</span>
                </div>
                <p className="text-3xl font-bold text-yellow-600">{slaData.atRisk.length}</p>
                <p className="text-sm text-muted-foreground">≤2 days remaining or unassigned</p>
                {slaData.atRisk.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                    {slaData.atRisk.slice(0, 3).map(c => (
                      <div key={c.id} className="text-xs flex items-center justify-between p-1.5 rounded bg-background">
                        <span className="truncate">{c.issue_type}</span>
                        <span className="font-medium">{c.daysRemaining !== null ? `${c.daysRemaining}d left` : 'No SLA'}</span>
                      </div>
                    ))}
                    {slaData.atRisk.length > 3 && <p className="text-xs text-muted-foreground">+{slaData.atRisk.length - 3} more</p>}
                  </div>
                )}
              </div>

              {/* Overdue */}
              <div className="border rounded-lg p-4 border-red-200 bg-red-50/50 dark:bg-red-950/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-foreground">Overdue</span>
                </div>
                <p className="text-3xl font-bold text-red-600">{slaData.overdue.length}</p>
                <p className="text-sm text-muted-foreground">Past SLA deadline</p>
                {slaData.overdue.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-28 overflow-y-auto">
                    {slaData.overdue.slice(0, 3).map(c => (
                      <div key={c.id} className="text-xs flex items-center justify-between p-1.5 rounded bg-background">
                        <span className="truncate">{c.issue_type}</span>
                        <Badge variant="destructive" className="text-[10px] px-1.5">{Math.abs(c.daysRemaining)}d overdue</Badge>
                      </div>
                    ))}
                    {slaData.overdue.length > 3 && <p className="text-xs text-muted-foreground">+{slaData.overdue.length - 3} more</p>}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Claims Needing Action */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base">Claims Requiring Attention</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search claims..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-8 text-sm" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={actionTab} onValueChange={setActionTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All ({pendingActions.total})</TabsTrigger>
                <TabsTrigger value="approval">Approval ({pendingActions.awaitingApproval})</TabsTrigger>
                <TabsTrigger value="assignment">Assignment ({pendingActions.awaitingAssignment})</TabsTrigger>
                <TabsTrigger value="sla_risk">SLA Risk ({slaData.atRisk.length + slaData.overdue.length})</TabsTrigger>
              </TabsList>

              <TabsContent value={actionTab}>
                {actionClaims.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
                    <p className="text-muted-foreground">No claims need attention</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {actionClaims.slice(0, 20).map(claim => (
                      <motion.div
                        key={claim.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => openClaimDetail(claim)}
                      >
                        <div className="hidden sm:block">
                          {getPriorityBadge(claim.priority)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm text-foreground truncate">{claim.issue_type}</p>
                            <Badge variant="outline" className={STATUS_CONFIG[claim.status]?.color || ''}>
                              {STATUS_CONFIG[claim.status]?.label || claim.status}
                            </Badge>
                            {getRiskBadge(claim.id)}
                            {getEligibilityBadge(claim.id)}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {profiles[claim.user_id]?.full_name || 'Unknown'}
                            {claim.partnerName && ` → ${claim.partnerName}`}
                            {' • '}
                            <span className="font-mono">{claim.id.slice(0, 8)}</span>
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-medium ${claim.daysRemaining !== null && claim.daysRemaining < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                            {claim.daysRemaining !== null
                              ? claim.daysRemaining < 0
                                ? `${Math.abs(claim.daysRemaining)}d overdue`
                                : `${claim.daysRemaining}d left`
                              : `${differenceInDays(new Date(), new Date(claim.created_at))}d pending`
                            }
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(claim.updated_at), 'MMM dd HH:mm')}
                          </p>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {['pending', 'submitted'].includes(claim.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEligibilityReview(claim);
                              }}
                            >
                              <FileCheck className="h-3 w-3 mr-1" /> Review
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    {actionClaims.length > 20 && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Showing 20 of {actionClaims.length} claims
                      </p>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Eligibility Review Drawer */}
        <Sheet open={eligibilityDrawerOpen} onOpenChange={setEligibilityDrawerOpen}>
          <SheetContent className="sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" /> Claim Eligibility Review
              </SheetTitle>
              <SheetDescription>
                Claim ID: {reviewingClaim?.id?.slice(0, 12)}... • {reviewingClaim?.issue_type}
              </SheetDescription>
            </SheetHeader>

            {reviewingClaim && reviewingEligibility && (
              <div className="space-y-5 mt-6">
                {/* Risk Assessment Card */}
                <Card className={
                  reviewingEligibility.riskLevel === 'low' ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' :
                  reviewingEligibility.riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20' :
                  'border-red-200 bg-red-50/50 dark:bg-red-950/20'
                }>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      {reviewingEligibility.riskLevel === 'low' && <ShieldCheck className="h-4 w-4 text-green-600" />}
                      {reviewingEligibility.riskLevel === 'medium' && <ShieldAlert className="h-4 w-4 text-yellow-600" />}
                      {reviewingEligibility.riskLevel === 'high' && <ShieldX className="h-4 w-4 text-red-600" />}
                      Risk Assessment
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-foreground">Overall Risk Score</span>
                      <Badge className={
                        reviewingEligibility.riskScore < 30 ? 'bg-green-600 hover:bg-green-700 text-white' :
                        reviewingEligibility.riskScore < 60 ? 'bg-yellow-600 hover:bg-yellow-700 text-white' :
                        'bg-red-600 hover:bg-red-700 text-white'
                      }>
                        {reviewingEligibility.riskScore}/100
                      </Badge>
                    </div>
                    <Progress
                      value={reviewingEligibility.riskScore}
                      className="h-2"
                    />
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-sm font-medium text-foreground">Recommendation</span>
                      {reviewingEligibility.recommendation === 'auto_approve' && (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white">✓ Auto-Approve</Badge>
                      )}
                      {reviewingEligibility.recommendation === 'manual_review' && (
                        <Badge className="bg-yellow-600 hover:bg-yellow-700 text-white">⚠️ Manual Review</Badge>
                      )}
                      {reviewingEligibility.recommendation === 'fraud_check' && (
                        <Badge className="bg-red-600 hover:bg-red-700 text-white">🚨 Fraud Check Required</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Eligibility Checks Detail */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Eligibility Checks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {reviewingEligibility.details.map((detail, i) => (
                        <div key={i} className="text-sm flex items-start gap-2 py-1.5 border-b border-border last:border-0">
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Claim Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Claim Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-medium text-foreground">{profiles[reviewingClaim.user_id]?.full_name || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Issue Type</p>
                        <p className="font-medium text-foreground">{reviewingClaim.issue_type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p className="font-medium text-foreground">{format(new Date(reviewingClaim.created_at), 'MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">IMEI</p>
                        <p className="font-mono font-medium text-foreground">{reviewingClaim.imei_number}</p>
                      </div>
                    </div>
                    {reviewingClaim.description && (
                      <div className="mt-3">
                        <p className="text-muted-foreground text-sm">Description</p>
                        <p className="text-sm text-foreground mt-1">{reviewingClaim.description}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="space-y-3">
                  {reviewingEligibility.recommendation === 'fraud_check' && (
                    <div className="p-3 rounded-lg border border-red-200 bg-red-50/50 dark:bg-red-950/20">
                      <p className="text-sm font-medium text-red-700 dark:text-red-400">
                        ⚠️ This claim has a high risk score. Proceed with caution.
                      </p>
                    </div>
                  )}

                  <Textarea
                    placeholder="Rejection reason (required for rejection)..."
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    className="text-sm"
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleManualApprove}
                      disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                      Approve
                    </Button>
                    <Button
                      onClick={handleManualReject}
                      disabled={processing || !rejectReason.trim()}
                      variant="destructive"
                      className="flex-1"
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ShieldX className="h-4 w-4 mr-1" />}
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Claim Detail Modal */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            {selectedClaim && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    Claim Details
                    <Badge variant="outline" className={STATUS_CONFIG[selectedClaim.status]?.color || ''}>
                      {STATUS_CONFIG[selectedClaim.status]?.label || selectedClaim.status}
                    </Badge>
                    {getRiskBadge(selectedClaim.id)}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                  {/* Eligibility Summary in Detail Modal */}
                  {eligibilityChecks[selectedClaim.id] && (
                    <>
                      <Card className={
                        eligibilityChecks[selectedClaim.id].riskLevel === 'low' ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20' :
                        eligibilityChecks[selectedClaim.id].riskLevel === 'medium' ? 'border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/20' :
                        'border-red-200 bg-red-50/50 dark:bg-red-950/20'
                      }>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-foreground">Risk Assessment</span>
                            {getEligibilityBadge(selectedClaim.id)}
                          </div>
                          <div className="space-y-1">
                            {eligibilityChecks[selectedClaim.id].details.map((d, i) => (
                              <p key={i} className="text-xs text-foreground">{d}</p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                      <Separator />
                    </>
                  )}

                  {/* Claim Info */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Claim ID</p>
                      <p className="font-mono text-foreground">{selectedClaim.id.slice(0, 12)}...</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Issue Type</p>
                      <p className="text-foreground">{selectedClaim.issue_type}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Created</p>
                      <p className="text-foreground">{format(new Date(selectedClaim.created_at), 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Updated</p>
                      <p className="text-foreground">{format(new Date(selectedClaim.updated_at), 'MMM dd, yyyy HH:mm')}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* SLA */}
                  {selectedClaim.assignment?.sla_deadline && (
                    <>
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">SLA Status</h4>
                        <div className="flex items-center gap-3">
                          {selectedClaim.daysRemaining !== null && selectedClaim.daysRemaining < 0 ? (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          ) : selectedClaim.daysRemaining !== null && selectedClaim.daysRemaining <= 2 ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          ) : (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                          <div>
                            <p className="text-sm text-foreground">
                              Deadline: {format(new Date(selectedClaim.assignment.sla_deadline), 'EEEE, MMM dd, yyyy')}
                            </p>
                            <p className={`text-sm font-medium ${selectedClaim.daysRemaining < 0 ? 'text-red-600' : selectedClaim.daysRemaining <= 2 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {selectedClaim.daysRemaining < 0
                                ? `${Math.abs(selectedClaim.daysRemaining)} days overdue`
                                : `${selectedClaim.daysRemaining} days remaining`
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                      <Separator />
                    </>
                  )}

                  {/* Timeline */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Status Timeline</h4>
                    {claimTimeline.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No status updates recorded.</p>
                    ) : (
                      <div className="space-y-0">
                        {claimTimeline.map((update, idx) => {
                          const isLast = idx === claimTimeline.length - 1;
                          const duration = idx > 0
                            ? differenceInHours(new Date(update.created_at), new Date(claimTimeline[idx - 1].created_at))
                            : 0;
                          return (
                            <div key={update.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${isLast ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                {idx < claimTimeline.length - 1 && <div className="w-0.5 flex-1 bg-border" />}
                              </div>
                              <div className="pb-4">
                                <p className="text-sm font-medium text-foreground">
                                  {STATUS_CONFIG[update.status]?.label || update.status}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(update.created_at), 'MMM dd, yyyy HH:mm')}
                                  {duration > 0 && ` • ${duration < 24 ? `${duration}h` : `${Math.round(duration / 24)}d`} in previous stage`}
                                </p>
                                {update.notes && <p className="text-xs text-muted-foreground mt-0.5">{update.notes}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Customer & Partner */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Customer</h4>
                      <div className="space-y-1 text-sm">
                        <p className="text-foreground">{profiles[selectedClaim.user_id]?.full_name || 'Unknown'}</p>
                        <p className="text-muted-foreground">{profiles[selectedClaim.user_id]?.email || ''}</p>
                        {profiles[selectedClaim.user_id]?.phone && (
                          <a href={`tel:${profiles[selectedClaim.user_id].phone}`} className="text-primary flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {profiles[selectedClaim.user_id].phone}
                          </a>
                        )}
                      </div>
                    </div>
                    {selectedClaim.partnerName && (
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">Partner</h4>
                        <div className="space-y-1 text-sm">
                          <p className="text-foreground">{selectedClaim.partnerName}</p>
                          {selectedClaim.assignment && partners[selectedClaim.assignment.partner_id] && (
                            <>
                              <p className="text-muted-foreground flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-500" />
                                {partners[selectedClaim.assignment.partner_id].quality_rating}/5
                                {' • '}{partners[selectedClaim.assignment.partner_id].total_repairs} repairs
                              </p>
                              {partners[selectedClaim.assignment.partner_id].phone && (
                                <a href={`tel:${partners[selectedClaim.assignment.partner_id].phone}`} className="text-primary flex items-center gap-1">
                                  <Phone className="h-3 w-3" /> {partners[selectedClaim.assignment.partner_id].phone}
                                </a>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {selectedClaim.description && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-1">Description</h4>
                        <p className="text-sm text-muted-foreground">{selectedClaim.description}</p>
                      </div>
                    </>
                  )}

                  {/* Review action from detail modal */}
                  {['pending', 'submitted'].includes(selectedClaim.status) && (
                    <>
                      <Separator />
                      <Button
                        className="w-full"
                        onClick={() => {
                          setDetailOpen(false);
                          openEligibilityReview(selectedClaim);
                        }}
                      >
                        <FileCheck className="h-4 w-4 mr-2" /> Open Eligibility Review
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default ClaimsMonitoringDashboard;
