import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Wrench, Clock, CheckCircle2, Star, AlertTriangle, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

type ClaimFilter = 'all' | 'pending' | 'active' | 'completed';

const PartnerDashboard = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ClaimFilter>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAssignments = useCallback(async (partnerId: string) => {
    const { data } = await supabase
      .from('claim_assignments')
      .select('*, service_claims(*, customer_devices(product_name, serial_number, imei_number, whatsapp_number, address))')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });
    setAssignments(data || []);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const { data: partnerData } = await supabase
        .from('partners')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setPartner(partnerData);
      if (partnerData) {
        await fetchAssignments(partnerData.id);
      }
      setLoading(false);
    };
    fetchData();
  }, [user, fetchAssignments]);

  // Real-time
  useEffect(() => {
    if (!partner) return;
    const channel = supabase
      .channel('partner-dash-rt')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'claim_assignments',
        filter: `partner_id=eq.${partner.id}`,
      }, () => fetchAssignments(partner.id))
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'service_claims',
      }, () => fetchAssignments(partner.id))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [partner, fetchAssignments]);

  // Metrics
  const pendingCount = assignments.filter(a => a.status === 'pending').length;
  const activeCount = assignments.filter(a => ['accepted', 'in_progress'].includes(a.status)).length;
  const completedCount = assignments.filter(a => a.status === 'completed').length;
  const completedThisMonth = assignments.filter(a => {
    if (a.status !== 'completed') return false;
    const month = new Date().toISOString().slice(0, 7);
    return a.updated_at?.startsWith(month);
  }).length;

  // Filter
  const filteredAssignments = assignments.filter(a => {
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'active') return ['accepted', 'in_progress'].includes(a.status);
    if (filter === 'completed') return a.status === 'completed';
    return true;
  });

  const acceptClaim = async (assignmentId: string, claimId: string) => {
    setActionLoading(assignmentId);
    try {
      await supabase
        .from('claim_assignments')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', assignmentId);

      await supabase
        .from('service_claims')
        .update({ status: 'in_progress', updated_at: new Date().toISOString() })
        .eq('id', claimId);

      toast.success('Claim accepted!');
      if (partner) await fetchAssignments(partner.id);
      setShowDetail(false);
    } catch {
      toast.error('Failed to accept claim');
    }
    setActionLoading(null);
  };

  const declineClaim = async (assignmentId: string) => {
    const reason = prompt('Why are you declining this claim?');
    if (!reason) return;
    setActionLoading(assignmentId);
    try {
      await supabase
        .from('claim_assignments')
        .update({ status: 'declined', notes: reason, updated_at: new Date().toISOString() })
        .eq('id', assignmentId);

      toast.success('Claim declined');
      if (partner) await fetchAssignments(partner.id);
      setShowDetail(false);
    } catch {
      toast.error('Failed to decline claim');
    }
    setActionLoading(null);
  };

  const openDetail = (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowDetail(true);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      </DashboardLayout>
    );
  }

  if (!partner) {
    return (
      <DashboardLayout>
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Wrench size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Your account is not linked to a partner record yet. Please contact the admin.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  const claim = selectedAssignment?.service_claims;
  const device = claim?.customer_devices;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Partner Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Welcome, {partner.name} — {partner.partner_type} partner
        </p>

        {/* METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <AlertTriangle size={14} /> Pending Acceptance
              </div>
              <p className="text-3xl font-heading font-bold text-warning">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <ClipboardList size={14} /> Active Claims
              </div>
              <p className="text-3xl font-heading font-bold text-primary">{activeCount}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <CheckCircle2 size={14} /> Completed This Month
              </div>
              <p className="text-3xl font-heading font-bold text-success">{completedThisMonth}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Star size={14} /> Your Rating
              </div>
              <p className="text-3xl font-heading font-bold text-accent-foreground">
                ★ {Number(partner.quality_rating || 0).toFixed(1)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FILTER BUTTONS */}
        <div className="flex flex-wrap gap-2 mb-4">
          {([
            ['all', `All (${assignments.length})`],
            ['pending', `Pending (${pendingCount})`],
            ['active', `Active (${activeCount})`],
            ['completed', `Completed (${completedCount})`],
          ] as [ClaimFilter, string][]).map(([key, label]) => (
            <Button
              key={key}
              variant={filter === key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {/* CLAIMS QUEUE */}
        <div className="space-y-3">
          {filteredAssignments.length === 0 && (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No claims found.</CardContent></Card>
          )}
          {filteredAssignments.map(assignment => {
            const sc = assignment.service_claims;
            const dev = sc?.customer_devices;
            const isPending = assignment.status === 'pending';
            return (
              <Card key={assignment.id} className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer" onClick={() => openDetail(assignment)}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-semibold truncate">{dev?.product_name || 'Unknown Device'}</span>
                        <Badge variant={
                          assignment.status === 'completed' ? 'default' :
                          assignment.status === 'pending' ? 'secondary' :
                          assignment.status === 'declined' ? 'destructive' : 'outline'
                        }>
                          {assignment.status}
                        </Badge>
                        {isPending && <Badge className="bg-warning text-warning-foreground">Action Required</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Issue: {sc?.issue_type} · IMEI: {sc?.imei_number}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Clock size={12} />
                        Assigned {new Date(assignment.created_at).toLocaleDateString()}
                        {assignment.sla_deadline && (
                          <span className="ml-2">· SLA: {new Date(assignment.sla_deadline).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            className="bg-success hover:bg-success/90 text-success-foreground"
                            disabled={actionLoading === assignment.id}
                            onClick={() => acceptClaim(assignment.id, sc?.id)}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={actionLoading === assignment.id}
                            onClick={() => declineClaim(assignment.id)}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* DETAIL SHEET */}
        <Sheet open={showDetail} onOpenChange={setShowDetail}>
          <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Claim Details</SheetTitle>
              <SheetDescription>{device?.product_name}</SheetDescription>
            </SheetHeader>

            {selectedAssignment && (
              <div className="space-y-6 mt-6">
                <Card>
                  <CardHeader><CardTitle className="text-base">Claim Information</CardTitle></CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Device</span>
                      <p className="font-medium">{device?.product_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Issue Type</span>
                      <p className="font-medium">{claim?.issue_type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">IMEI</span>
                      <p className="font-medium">{claim?.imei_number || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Serial</span>
                      <p className="font-medium">{device?.serial_number || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <Badge>{claim?.status}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Assignment Status</span>
                      <Badge variant="outline">{selectedAssignment.status}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Customer Contact</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">WhatsApp</span>
                      <p className="font-medium">{device?.whatsapp_number || '-'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Address</span>
                      <p className="font-medium">{device?.address || '-'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm">{claim?.description}</p>
                  </CardContent>
                </Card>

                {selectedAssignment.sla_deadline && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">SLA</CardTitle></CardHeader>
                    <CardContent className="text-sm">
                      <p>Deadline: <span className="font-medium">{new Date(selectedAssignment.sla_deadline).toLocaleString()}</span></p>
                    </CardContent>
                  </Card>
                )}

                {selectedAssignment.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
                      disabled={actionLoading === selectedAssignment.id}
                      onClick={() => acceptClaim(selectedAssignment.id, claim?.id)}
                    >
                      Accept This Claim
                    </Button>
                    <Button
                      className="flex-1"
                      variant="destructive"
                      disabled={actionLoading === selectedAssignment.id}
                      onClick={() => declineClaim(selectedAssignment.id)}
                    >
                      Decline Claim
                    </Button>
                  </div>
                )}
              </div>
            )}
          </SheetContent>
        </Sheet>
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerDashboard;
