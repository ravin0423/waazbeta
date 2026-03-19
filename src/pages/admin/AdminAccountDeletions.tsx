import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Trash2, X, CheckCircle, Clock, UserX } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const AdminAccountDeletions = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectNotes, setRejectNotes] = useState('');

  const fetchRequests = async () => {
    let query = supabase
      .from('account_deletion_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  const handleApproveAndDelete = async (request: any) => {
    if (!user) return;
    setProcessing(request.id);
    try {
      // Call the edge function to actually delete the user
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired');
        return;
      }

      // First update the request status
      await supabase
        .from('account_deletion_requests')
        .update({
          status: 'completed',
          admin_notes: adminNotes || 'Account deleted by admin',
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      // Call edge function to delete the user
      const res = await supabase.functions.invoke('delete-account-admin', {
        body: { userId: request.user_id },
      });

      if (res.error || res.data?.error) {
        toast.error(res.data?.error || 'Failed to delete user account');
        // Revert status
        await supabase
          .from('account_deletion_requests')
          .update({ status: 'pending', admin_notes: null, reviewed_by: null, reviewed_at: null })
          .eq('id', request.id);
        return;
      }

      toast.success(`Account for ${request.user_email} has been deleted`);
      setAdminNotes('');
      fetchRequests();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: any) => {
    if (!user) return;
    setProcessing(request.id);
    const { error } = await supabase
      .from('account_deletion_requests')
      .update({
        status: 'rejected',
        admin_notes: rejectNotes || 'Request rejected by admin',
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', request.id);

    setProcessing(null);
    if (error) {
      toast.error('Failed to reject request');
      return;
    }
    toast.success('Deletion request rejected');
    setRejectNotes('');
    fetchRequests();
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30"><Clock size={12} className="mr-1" /> Pending</Badge>;
      case 'completed': return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30"><UserX size={12} className="mr-1" /> Deleted</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-muted text-muted-foreground"><X size={12} className="mr-1" /> Rejected</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const roleBadge = (role: string) => {
    switch (role) {
      case 'customer': return <Badge variant="secondary">Customer</Badge>;
      case 'partner': return <Badge className="bg-accent text-accent-foreground">Partner</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Account Deletion Requests</h1>
            <p className="text-muted-foreground">Review and process user account deletion requests</p>
          </div>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-sm px-3 py-1">
              {pendingCount} Pending
            </Badge>
          )}
        </div>

        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList className="mb-6">
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value={filter}>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={24} />
              </div>
            ) : requests.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <CheckCircle size={40} className="mx-auto mb-3 opacity-40" />
                  <p>No {filter !== 'all' ? filter : ''} deletion requests</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {requests.map(req => (
                  <Card key={req.id} className={req.status === 'pending' ? 'border-warning/50' : ''}>
                    <CardContent className="pt-5 pb-5">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="font-semibold text-lg">{req.user_name || 'Unknown'}</span>
                            {roleBadge(req.user_role)}
                            {statusBadge(req.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">{req.user_email}</p>
                          <div className="bg-muted/50 rounded-lg p-3 mt-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Reason for deletion</p>
                            <p className="text-sm">{req.reason}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Requested: {new Date(req.created_at).toLocaleString()}
                          </p>
                          {req.admin_notes && (
                            <div className="bg-muted/50 rounded-lg p-3 mt-1">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Admin notes</p>
                              <p className="text-sm">{req.admin_notes}</p>
                            </div>
                          )}
                        </div>

                        {req.status === 'pending' && (
                          <div className="flex gap-2 shrink-0">
                            {/* Reject */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1">
                                  <X size={14} /> Reject
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Deletion Request</AlertDialogTitle>
                                  <AlertDialogDescription asChild>
                                    <div className="space-y-3">
                                      <span className="block">Reject the deletion request from <strong>{req.user_name}</strong> ({req.user_email}).</span>
                                      <div className="space-y-2">
                                        <Label className="text-foreground">Reason (optional)</Label>
                                        <Textarea
                                          value={rejectNotes}
                                          onChange={(e) => setRejectNotes(e.target.value)}
                                          placeholder="Reason for rejection..."
                                          rows={3}
                                        />
                                      </div>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setRejectNotes('')}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleReject(req)} disabled={processing === req.id}>
                                    Reject Request
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            {/* Approve & Delete */}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm" className="gap-1">
                                  <Trash2 size={14} /> Delete Account
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Permanently Delete Account?</AlertDialogTitle>
                                  <AlertDialogDescription asChild>
                                    <div className="space-y-3">
                                      <span className="block">This will permanently delete the account of <strong>{req.user_name}</strong> ({req.user_email}). This action <strong>cannot be undone</strong>.</span>
                                      <div className="space-y-2">
                                        <Label className="text-foreground">Admin notes (optional)</Label>
                                        <Textarea
                                          value={adminNotes}
                                          onChange={(e) => setAdminNotes(e.target.value)}
                                          placeholder="Any notes about this deletion..."
                                          rows={3}
                                        />
                                      </div>
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel onClick={() => setAdminNotes('')}>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleApproveAndDelete(req)}
                                    disabled={processing === req.id}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {processing === req.id ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Trash2 size={14} className="mr-2" />}
                                    Confirm Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminAccountDeletions;
