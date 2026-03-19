import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Wrench, Clock, CheckCircle2, Star, AlertTriangle, ClipboardList, Camera, Upload, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

type ClaimFilter = 'all' | 'pending' | 'active' | 'completed';

const REPAIR_STATUSES = [
  { value: 'in_progress', label: 'Diagnostics In Progress' },
  { value: 'parts_ordered', label: 'Parts Ordered' },
  { value: 'parts_arrived', label: 'Parts Arrived' },
  { value: 'repair_in_progress', label: 'Repair In Progress' },
  { value: 'quality_check', label: 'Quality Check' },
  { value: 'ready_for_delivery', label: 'Ready for Delivery' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'resolved', label: 'Completed / Resolved' },
];

const PartnerDashboard = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ClaimFilter>('all');
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Status update state
  const [updateMode, setUpdateMode] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Photo upload state
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [claimPhotos, setClaimPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status history
  const [statusHistory, setStatusHistory] = useState<any[]>([]);

  const fetchAssignments = useCallback(async (partnerId: string) => {
    const { data } = await supabase
      .from('claim_assignments')
      .select('*, service_claims(*, customer_devices(product_name, serial_number, imei_number, whatsapp_number, address))')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false });
    setAssignments(data || []);
  }, []);

  const fetchClaimDetails = useCallback(async (claimId: string) => {
    // Fetch status history
    const { data: history } = await supabase
      .from('claim_status_updates')
      .select('*')
      .eq('claim_id', claimId)
      .order('created_at', { ascending: false });
    setStatusHistory(history || []);

    // Fetch existing photos from claim's image_urls
    const { data: claimData } = await supabase
      .from('service_claims')
      .select('image_urls')
      .eq('id', claimId)
      .single();
    setClaimPhotos(claimData?.image_urls || []);
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

  const openDetail = async (assignment: any) => {
    setSelectedAssignment(assignment);
    setShowDetail(true);
    setUpdateMode(false);
    setNewStatus('');
    setUpdateNotes('');
    if (assignment.service_claims?.id) {
      await fetchClaimDetails(assignment.service_claims.id);
    }
  };

  // === STATUS UPDATE ===
  const updateClaimStatus = async () => {
    if (!newStatus) {
      toast.error('Please select a new status');
      return;
    }
    if (!updateNotes.trim()) {
      toast.error('Please add notes about this update');
      return;
    }
    const claimId = selectedAssignment?.service_claims?.id;
    if (!claimId || !user) return;

    setUpdatingStatus(true);
    try {
      // Update service_claims status
      await supabase
        .from('service_claims')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', claimId);

      // Update assignment status if completing
      if (newStatus === 'resolved') {
        await supabase
          .from('claim_assignments')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', selectedAssignment.id);
      } else {
        await supabase
          .from('claim_assignments')
          .update({ status: 'in_progress', updated_at: new Date().toISOString() })
          .eq('id', selectedAssignment.id);
      }

      // Log the status update
      await supabase
        .from('claim_status_updates')
        .insert({
          claim_id: claimId,
          status: newStatus,
          notes: updateNotes.trim(),
          updated_by: user.id,
        });

      // Notify customer
      const claimData = selectedAssignment.service_claims;
      if (claimData?.user_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: claimData.user_id,
            type: 'claim_updated',
            title: 'Repair Status Updated',
            message: `Your repair for ${claimData.customer_devices?.product_name || 'your device'} is now: ${newStatus.replace(/_/g, ' ')}`,
            related_id: claimId,
          });
      }

      toast.success('Status updated successfully');
      setUpdateMode(false);
      setNewStatus('');
      setUpdateNotes('');

      // Refresh
      if (partner) await fetchAssignments(partner.id);
      await fetchClaimDetails(claimId);

      // Update selected assignment locally
      setSelectedAssignment((prev: any) => ({
        ...prev,
        status: newStatus === 'resolved' ? 'completed' : 'in_progress',
        service_claims: { ...prev.service_claims, status: newStatus },
      }));
    } catch {
      toast.error('Failed to update status');
    }
    setUpdatingStatus(false);
  };

  // === PHOTO UPLOAD ===
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const claimId = selectedAssignment?.service_claims?.id;
    if (!claimId) return;

    setUploadingPhotos(true);
    const newUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const fileName = `partner-${claimId}-${Date.now()}-${i}.${ext}`;

        const { error } = await supabase.storage
          .from('claim-images')
          .upload(fileName, file);

        if (error) {
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('claim-images')
          .getPublicUrl(fileName);

        newUrls.push(urlData.publicUrl);
      }

      if (newUrls.length > 0) {
        const allPhotos = [...claimPhotos, ...newUrls];

        await supabase
          .from('service_claims')
          .update({ image_urls: allPhotos, updated_at: new Date().toISOString() })
          .eq('id', claimId);

        setClaimPhotos(allPhotos);
        toast.success(`${newUrls.length} photo(s) uploaded`);
      }
    } catch {
      toast.error('Photo upload failed');
    }
    setUploadingPhotos(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
  const isActive = selectedAssignment && ['accepted', 'in_progress'].includes(selectedAssignment.status);

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
                        Issue: {sc?.issue_type} · IMEI: {sc?.imei_number} · Claim: {sc?.status?.replace(/_/g, ' ')}
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
                          <Button size="sm" className="bg-success hover:bg-success/90 text-success-foreground" disabled={actionLoading === assignment.id} onClick={() => acceptClaim(assignment.id, sc?.id)}>Accept</Button>
                          <Button size="sm" variant="destructive" disabled={actionLoading === assignment.id} onClick={() => declineClaim(assignment.id)}>Decline</Button>
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
                {/* Claim Info */}
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
                      <span className="text-muted-foreground">Claim Status</span>
                      <Badge>{claim?.status?.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Assignment</span>
                      <Badge variant="outline">{selectedAssignment.status}</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Contact */}
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

                {/* Description */}
                <Card>
                  <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm">{claim?.description}</p>
                  </CardContent>
                </Card>

                {/* SLA */}
                {selectedAssignment.sla_deadline && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">SLA</CardTitle></CardHeader>
                    <CardContent className="text-sm">
                      <p>Deadline: <span className="font-medium">{new Date(selectedAssignment.sla_deadline).toLocaleString()}</span></p>
                      {new Date(selectedAssignment.sla_deadline) < new Date() && (
                        <Badge variant="destructive" className="mt-1">Overdue</Badge>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* === STATUS UPDATE SECTION === */}
                {isActive && (
                  <Card className="border-primary/30">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <RefreshCw size={16} /> Update Progress
                        </CardTitle>
                        {!updateMode && (
                          <Button size="sm" onClick={() => setUpdateMode(true)}>
                            Update Status
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    {updateMode && (
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">New Status</label>
                          <Select value={newStatus} onValueChange={setNewStatus}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select new status" />
                            </SelectTrigger>
                            <SelectContent>
                              {REPAIR_STATUSES.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1.5 block">Notes</label>
                          <Textarea
                            placeholder="Describe what was done, findings, next steps..."
                            value={updateNotes}
                            onChange={(e) => setUpdateNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            className="bg-success hover:bg-success/90 text-success-foreground"
                            onClick={updateClaimStatus}
                            disabled={updatingStatus}
                          >
                            {updatingStatus && <Loader2 className="animate-spin mr-2" size={14} />}
                            Submit Update
                          </Button>
                          <Button variant="outline" onClick={() => { setUpdateMode(false); setNewStatus(''); setUpdateNotes(''); }}>
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )}

                {/* === PHOTO UPLOAD SECTION === */}
                {isActive && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Camera size={16} /> Repair Photos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhotos}
                          className="gap-2"
                        >
                          {uploadingPhotos ? <Loader2 className="animate-spin" size={14} /> : <Upload size={14} />}
                          {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
                        </Button>
                      </div>
                      {claimPhotos.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {claimPhotos.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                              <img
                                src={url}
                                alt={`Repair photo ${i + 1}`}
                                className="w-full h-24 object-cover rounded-md border border-border hover:opacity-80 transition"
                              />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <ImageIcon size={14} /> No photos uploaded yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* === STATUS HISTORY === */}
                {statusHistory.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-base">Status History</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {statusHistory.map((update) => (
                          <div key={update.id} className="flex gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="text-xs">{update.status?.replace(/_/g, ' ')}</Badge>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(update.created_at).toLocaleString()}
                                </span>
                              </div>
                              {update.notes && (
                                <p className="text-muted-foreground mt-1">{update.notes}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Accept/Decline for pending */}
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
