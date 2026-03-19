import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Loader2, User, Building2, Bell, CreditCard, Edit2, X, AlertTriangle, Trash2, Clock } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const PartnerSettings = () => {
  const { user } = useAuth();
  const [partner, setPartner] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [deletionReason, setDeletionReason] = useState('');
  const [existingRequest, setExistingRequest] = useState<any>(null);

  // Editable fields
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    state: '',
  });

  // Profile fields
  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
    company: '',
  });

  // Notification prefs (stored in profile metadata or local for now)
  const [notifPrefs, setNotifPrefs] = useState({
    email_notifications: true,
    sms_notifications: false,
    app_notifications: true,
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const [partnerRes, profileRes, deletionRes] = await Promise.all([
        supabase.from('partners').select('*').eq('user_id', user.id).maybeSingle(),
        supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('account_deletion_requests').select('*').eq('user_id', user.id).in('status', ['pending', 'approved']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);

      if (partnerRes.data) {
        setPartner(partnerRes.data);
        setFormData({
          name: partnerRes.data.name || '',
          email: partnerRes.data.email || '',
          phone: partnerRes.data.phone || '',
          city: partnerRes.data.city || '',
          state: partnerRes.data.state || '',
        });
      }

      if (profileRes.data) {
        setProfile(profileRes.data);
        setProfileData({
          full_name: profileRes.data.full_name || '',
          phone: profileRes.data.phone || '',
          company: profileRes.data.company || '',
        });
      }

      setExistingRequest(deletionRes.data);

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const savePartnerProfile = async () => {
    if (!partner) return;
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('partners')
      .update({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', partner.id);

    if (error) {
      toast.error('Failed to update partner profile');
    } else {
      setPartner({ ...partner, ...formData });
      toast.success('Partner profile updated');
      setEditMode(false);
    }
    setSaving(false);
  };

  const saveAccountProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profileData.full_name.trim(),
        phone: profileData.phone.trim(),
        company: profileData.company.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (error) {
      toast.error('Failed to save account settings');
    } else {
      toast.success('Account settings saved');
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    setSaving(true);
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setSaving(false);
    if (error) {
      toast.error('Failed to send password reset email');
    } else {
      toast.success('Password reset email sent! Check your inbox.');
    }
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
        user_role: 'partner',
        reason: deletionReason.trim(),
      });
    setSubmittingRequest(false);
    if (error) {
      toast.error('Failed to submit deletion request');
      return;
    }
    toast.success('Deletion request submitted. An admin will review it.');
    setDeletionReason('');
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
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground mb-6">Manage your partner account and preferences</p>

        <div className="max-w-3xl">
          <Tabs defaultValue="profile">
            <TabsList className="mb-6">
              <TabsTrigger value="profile" className="gap-2"><User size={14} /> Profile</TabsTrigger>
              <TabsTrigger value="account" className="gap-2"><Building2 size={14} /> Account</TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2"><Bell size={14} /> Notifications</TabsTrigger>
              <TabsTrigger value="danger" className="gap-2 text-destructive"><AlertTriangle size={14} /> Danger Zone</TabsTrigger>
            </TabsList>

            {/* === PARTNER PROFILE TAB === */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="font-heading text-base">Partner Profile</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (editMode) {
                          // Reset form
                          setFormData({
                            name: partner?.name || '',
                            email: partner?.email || '',
                            phone: partner?.phone || '',
                            city: partner?.city || '',
                            state: partner?.state || '',
                          });
                        }
                        setEditMode(!editMode);
                      }}
                      className="gap-2"
                    >
                      {editMode ? <><X size={14} /> Cancel</> : <><Edit2 size={14} /> Edit</>}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {editMode ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Partner Name</Label>
                          <Input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input type="email" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>City</Label>
                          <Input value={formData.city} onChange={e => setFormData(p => ({ ...p, city: e.target.value }))} />
                        </div>
                        <div className="space-y-2">
                          <Label>State</Label>
                          <Input value={formData.state} onChange={e => setFormData(p => ({ ...p, state: e.target.value }))} />
                        </div>
                      </div>
                      <Button onClick={savePartnerProfile} disabled={saving} className="gradient-primary text-primary-foreground hover:opacity-90 gap-2">
                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Changes
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                      <div>
                        <span className="text-sm text-muted-foreground">Name</span>
                        <p className="font-medium">{partner?.name || '-'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Email</span>
                        <p className="font-medium">{partner?.email || '-'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Phone</span>
                        <p className="font-medium">{partner?.phone || '-'}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Location</span>
                        <p className="font-medium">{partner?.city}{partner?.city && partner?.state ? ', ' : ''}{partner?.state}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Partner Type</span>
                        <p><Badge variant="outline">{partner?.partner_type || '-'}</Badge></p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Commission Rate</span>
                        <p className="font-medium">{partner?.commission_rate}%</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Quality Rating</span>
                        <p className="font-medium">★ {Number(partner?.quality_rating || 0).toFixed(1)}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Total Repairs</span>
                        <p className="font-medium">{partner?.total_repairs || 0}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">SLA Turnaround</span>
                        <p className="font-medium">{partner?.sla_turnaround_days} days</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Status</span>
                        <p><Badge className={partner?.is_active ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground'}>{partner?.is_active ? 'Active' : 'Inactive'}</Badge></p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* === ACCOUNT TAB === */}
            <TabsContent value="account" className="space-y-6">
              <Card className="shadow-card">
                <CardHeader><CardTitle className="font-heading text-base">Account Details</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={profileData.full_name} onChange={e => setProfileData(p => ({ ...p, full_name: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input value={user?.email || ''} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={profileData.phone} onChange={e => setProfileData(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input value={profileData.company} onChange={e => setProfileData(p => ({ ...p, company: e.target.value }))} />
                      </div>
                    </div>
                    <Button onClick={saveAccountProfile} disabled={saving} className="gradient-primary text-primary-foreground hover:opacity-90 gap-2">
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Save Account
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader><CardTitle className="font-heading text-base">Security</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">Send a password reset link to your registered email address.</p>
                  <Button variant="outline" onClick={handleChangePassword} disabled={saving} className="gap-2">
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
                    Send Password Reset Email
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* === NOTIFICATIONS TAB === */}
            <TabsContent value="notifications" className="space-y-6">
              <Card className="shadow-card">
                <CardHeader><CardTitle className="font-heading text-base">Notification Preferences</CardTitle></CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive claim updates and payout alerts via email</p>
                    </div>
                    <Switch checked={notifPrefs.email_notifications} onCheckedChange={v => setNotifPrefs(p => ({ ...p, email_notifications: v }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">SMS Notifications</p>
                      <p className="text-xs text-muted-foreground">Get important alerts via SMS</p>
                    </div>
                    <Switch checked={notifPrefs.sms_notifications} onCheckedChange={v => setNotifPrefs(p => ({ ...p, sms_notifications: v }))} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">In-App Notifications</p>
                      <p className="text-xs text-muted-foreground">Show notification bell alerts in the dashboard</p>
                    </div>
                    <Switch checked={notifPrefs.app_notifications} onCheckedChange={v => setNotifPrefs(p => ({ ...p, app_notifications: v }))} />
                  </div>
                  <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                    Notification preferences are applied locally. Contact admin for email/SMS delivery configuration.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerSettings;
