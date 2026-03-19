import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Bell, BellOff, CheckCheck, Mail, MessageSquare, Smartphone,
  Shield, FileText, Wrench, CreditCard, AlertTriangle, Info,
  Loader2, Settings
} from 'lucide-react';

const typeConfig: Record<string, { icon: any; color: string }> = {
  claim_assigned: { icon: Wrench, color: 'text-info' },
  claim_updated: { icon: FileText, color: 'text-primary' },
  device_decision: { icon: Shield, color: 'text-success' },
  delivery_scheduled: { icon: Smartphone, color: 'text-accent-foreground' },
  ticket_update: { icon: MessageSquare, color: 'text-warning' },
  schedule_request: { icon: Wrench, color: 'text-info' },
  customer_message: { icon: MessageSquare, color: 'text-primary' },
  payment: { icon: CreditCard, color: 'text-success' },
  alert: { icon: AlertTriangle, color: 'text-destructive' },
};

const CustomerNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');

  // Preferences
  const [prefs, setPrefs] = useState({
    email_notifications: true,
    sms_notifications: false,
    app_notifications: true,
    email_digest: 'daily',
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setNotifications(data || []);
    setLoading(false);
  }, [user]);

  const fetchPreferences = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notification_preferences' as any)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) {
      setPrefs({
        email_notifications: (data as any).email_notifications,
        sms_notifications: (data as any).sms_notifications,
        app_notifications: (data as any).app_notifications,
        email_digest: (data as any).email_digest,
      });
    }
    setPrefsLoaded(true);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  // Real-time
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('customer-notifications-rt')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        setNotifications(prev => [payload.new as any, ...prev]);
        toast.info((payload.new as any).title);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const savePreferences = async () => {
    if (!user) return;
    setSavingPrefs(true);
    const { error } = await supabase.from('notification_preferences' as any).upsert({
      user_id: user.id,
      ...prefs,
      updated_at: new Date().toISOString(),
    } as any, { onConflict: 'user_id' });
    setSavingPrefs(false);
    if (error) {
      toast.error('Failed to save preferences');
    } else {
      toast.success('Preferences saved');
    }
  };

  const filtered = tab === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground text-sm">Stay updated on your devices, claims, and support</p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck size={14} className="mr-2" /> Mark all read ({unreadCount})
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Notifications List */}
          <div className="lg:col-span-2">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread" className="flex items-center gap-1">
                  Unread
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="text-[10px] h-5 px-1.5 ml-1">{unreadCount}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={tab} className="mt-4">
                {loading ? (
                  <Card><CardContent className="p-12 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={24} /></CardContent></Card>
                ) : filtered.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <BellOff size={40} className="text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {tab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2">
                    {filtered.map(notif => {
                      const config = typeConfig[notif.type] || { icon: Info, color: 'text-muted-foreground' };
                      const Icon = config.icon;
                      return (
                        <Card
                          key={notif.id}
                          className={`cursor-pointer transition-colors ${
                            !notif.is_read ? 'border-primary/30 bg-primary/5' : 'hover:bg-muted/30'
                          }`}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 ${config.color}`}>
                                <Icon size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-sm font-medium ${!notif.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {notif.title}
                                  </span>
                                  {!notif.is_read && (
                                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-0.5">{notif.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Preferences Panel */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings size={16} /> Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!prefsLoaded ? (
                  <div className="flex justify-center py-4"><Loader2 className="animate-spin text-primary" size={20} /></div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">Email</p>
                          <p className="text-xs text-muted-foreground">Receive email alerts</p>
                        </div>
                      </div>
                      <Switch
                        checked={prefs.email_notifications}
                        onCheckedChange={(v) => setPrefs(p => ({ ...p, email_notifications: v }))}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone size={16} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">SMS</p>
                          <p className="text-xs text-muted-foreground">Receive text messages</p>
                        </div>
                      </div>
                      <Switch
                        checked={prefs.sms_notifications}
                        onCheckedChange={(v) => setPrefs(p => ({ ...p, sms_notifications: v }))}
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell size={16} className="text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">In-App</p>
                          <p className="text-xs text-muted-foreground">Show in notification bell</p>
                        </div>
                      </div>
                      <Switch
                        checked={prefs.app_notifications}
                        onCheckedChange={(v) => setPrefs(p => ({ ...p, app_notifications: v }))}
                      />
                    </div>

                    <Separator />

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Mail size={16} className="text-muted-foreground" />
                        <p className="text-sm font-medium text-foreground">Email Digest</p>
                      </div>
                      <Select value={prefs.email_digest} onValueChange={(v) => setPrefs(p => ({ ...p, email_digest: v }))}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instant">Instant</SelectItem>
                          <SelectItem value="daily">Daily Summary</SelectItem>
                          <SelectItem value="weekly">Weekly Summary</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      className="w-full"
                      onClick={savePreferences}
                      disabled={savingPrefs}
                      size="sm"
                    >
                      {savingPrefs ? 'Saving...' : 'Save Preferences'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-medium text-foreground">{notifications.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Unread</span>
                  <span className="font-medium text-destructive">{unreadCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Read</span>
                  <span className="font-medium text-foreground">{notifications.length - unreadCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default CustomerNotifications;
