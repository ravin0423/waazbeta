import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Camera, Save, Loader2, Trash2, AlertTriangle, Clock } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CustomerProfile = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email] = useState(user?.email || '');
  const [company, setCompany] = useState(user?.company || '');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [existingRequest, setExistingRequest] = useState<any>(null);

  useEffect(() => {
    const fetchDeletionRequest = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('account_deletion_requests')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['pending', 'approved'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setExistingRequest(data);
    };
    fetchDeletionRequest();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAvatar(URL.createObjectURL(file));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: name, phone, company, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    setSaving(false);
    if (error) { toast.error('Failed to save profile'); return; }
    toast.success('Profile updated successfully!');
  };

  const handleRequestDeletion = async () => {
    if (!deletionReason.trim()) {
      toast.error('Please provide a reason for account deletion');
      return;
    }
    if (!user) return;
    setSubmittingRequest(true);
    const { error } = await supabase
      .from('account_deletion_requests')
      .insert({
        user_id: user.id,
        user_email: user.email,
        user_name: user.fullName,
        user_role: 'customer',
        reason: deletionReason.trim(),
      });
    setSubmittingRequest(false);
    if (error) {
      toast.error('Failed to submit deletion request');
      return;
    }
    toast.success('Deletion request submitted. An admin will review it.');
    setDeletionReason('');
    // Refresh
    const { data } = await supabase
      .from('account_deletion_requests')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'approved'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setExistingRequest(data);
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">My Profile</h1>
        <p className="text-muted-foreground mb-6">Manage your account details</p>

        <div className="max-w-2xl space-y-6">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full gradient-primary flex items-center justify-center overflow-hidden">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-primary-foreground">{name.charAt(0)}</span>
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-elevated">
                      <Camera size={14} />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-lg">{name}</p>
                    <p className="text-sm text-muted-foreground">Customer Account</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={email} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input id="company" value={company} onChange={e => setCompany(e.target.value)} />
                  </div>
                </div>

                <Button type="submit" disabled={saving} className="gradient-primary text-primary-foreground hover:opacity-90">
                  {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle size={20} />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              {existingRequest ? (
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted">
                  <Clock size={20} className="text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Deletion request {existingRequest.status === 'approved' ? 'approved' : 'pending'}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      You submitted a deletion request on {new Date(existingRequest.created_at).toLocaleDateString()}.
                      {existingRequest.status === 'pending' && ' An admin will review it shortly.'}
                      {existingRequest.status === 'approved' && ' Your account will be deleted by an admin soon.'}
                    </p>
                    <Badge variant="outline" className="mt-2">
                      {existingRequest.status === 'pending' ? 'Pending Review' : 'Approved'}
                    </Badge>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    Request permanent deletion of your account. An admin will review and process your request.
                  </p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="gap-2">
                        <Trash2 size={16} />
                        Request Account Deletion
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Request Account Deletion</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="space-y-3">
                            <span className="block">Please provide a reason for deleting your account. An admin will review and process your request.</span>
                            <div className="space-y-2">
                              <Label className="text-foreground font-medium">Reason for deletion *</Label>
                              <Textarea
                                value={deletionReason}
                                onChange={(e) => setDeletionReason(e.target.value)}
                                placeholder="Please explain why you want to delete your account..."
                                rows={4}
                              />
                            </div>
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletionReason('')}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleRequestDeletion}
                          disabled={!deletionReason.trim() || submittingRequest}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {submittingRequest ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Trash2 size={16} className="mr-2" />}
                          Submit Request
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default CustomerProfile;
