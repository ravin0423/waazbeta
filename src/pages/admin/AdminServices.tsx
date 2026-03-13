import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Wrench, Clock, CheckCircle, XCircle, Eye, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'default', icon: Wrench },
  resolved: { label: 'Resolved', variant: 'outline', icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
};

const AdminServices = () => {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [partners, setPartners] = useState<any[]>([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchData = async () => {
    const [claimsRes, partnersRes, profilesRes] = await Promise.all([
      supabase.from('service_claims').select('*').order('created_at', { ascending: false }),
      supabase.from('partners').select('id, name, partner_type').eq('is_active', true),
      supabase.from('profiles').select('id, full_name, email, phone'),
    ]);
    setClaims(claimsRes.data || []);
    setPartners(partnersRes.data || []);
    const pMap: Record<string, any> = {};
    (profilesRes.data || []).forEach(p => { pMap[p.id] = p; });
    setProfiles(pMap);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openDetail = (claim: any) => {
    setSelectedClaim(claim);
    setAdminNotes(claim.admin_notes || '');
    setNewStatus(claim.status);
    setSelectedPartner(claim.assigned_partner_id || '');
  };

  const handleUpdate = async () => {
    if (!selectedClaim) return;
    const { error } = await supabase.from('service_claims').update({
      status: newStatus,
      admin_notes: adminNotes,
      assigned_partner_id: selectedPartner || null,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedClaim.id);
    if (error) { toast.error(error.message); return; }
    toast.success('Claim updated');
    setSelectedClaim(null);
    fetchData();
  };

  const filtered = filterStatus === 'all' ? claims : claims.filter(c => c.status === filterStatus);

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-heading text-2xl font-bold">Service Bookings</h1>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-muted-foreground mb-6">Track all service and repair bookings</p>

        {loading ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center text-muted-foreground">Loading...</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Wrench size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No service bookings found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map(claim => {
              const sc = statusConfig[claim.status] || statusConfig.pending;
              const Icon = sc.icon;
              const profile = profiles[claim.user_id];
              return (
                <Card key={claim.id} className="shadow-card hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-medium text-foreground">{claim.issue_type}</span>
                          <Badge variant={sc.variant} className="text-xs">
                            <Icon size={12} className="mr-1" /> {sc.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{claim.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span>Customer: <span className="text-foreground">{profile?.full_name || 'Unknown'}</span></span>
                          <span>IMEI: <span className="font-mono">{claim.imei_number}</span></span>
                          <span>{format(new Date(claim.created_at), 'dd MMM yyyy, HH:mm')}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 items-center">
                        {claim.image_urls?.length > 0 && (
                          <div className="flex gap-1">
                            {claim.image_urls.map((url: string, i: number) => (
                              <img key={i} src={url} alt="" className="w-10 h-10 rounded border border-border object-cover" />
                            ))}
                          </div>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => openDetail(claim)}>
                          <Eye size={16} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      <Dialog open={!!selectedClaim} onOpenChange={open => !open && setSelectedClaim(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Manage Claim</DialogTitle>
          </DialogHeader>
          {selectedClaim && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Issue:</span> <span className="font-medium">{selectedClaim.issue_type}</span></div>
                <div><span className="text-muted-foreground">IMEI:</span> <span className="font-mono">{selectedClaim.imei_number}</span></div>
                <div className="col-span-2"><span className="text-muted-foreground">Customer:</span> {profiles[selectedClaim.user_id]?.full_name || 'Unknown'} ({profiles[selectedClaim.user_id]?.phone || 'N/A'})</div>
                <div className="col-span-2"><span className="text-muted-foreground">Description:</span> {selectedClaim.description}</div>
              </div>

              {selectedClaim.image_urls?.length > 0 && (
                <div className="flex gap-2">
                  {selectedClaim.image_urls.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img src={url} alt="" className="w-24 h-24 rounded border border-border object-cover hover:opacity-80 transition-opacity" />
                    </a>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assign Partner</label>
                <Select value={selectedPartner} onValueChange={setSelectedPartner}>
                  <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                  <SelectContent>
                    {partners.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} ({p.partner_type})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1"><MessageSquare size={14} /> Admin Notes</label>
                <Textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} rows={3} placeholder="Add notes for the customer..." />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setSelectedClaim(null)} className="flex-1">Cancel</Button>
                <Button onClick={handleUpdate} className="flex-1">Update Claim</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminServices;
