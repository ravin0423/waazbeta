import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, Users, UserCheck, Trash2, Crown, Wrench, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  full_name: string;
  email: string;
  role: string;
  user_id: string;
}

interface FeaturePermission {
  id: string;
  role: string;
  feature_key: string;
  feature_label: string;
  is_enabled: boolean;
}

const AdminUserRoles = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [permissions, setPermissions] = useState<FeaturePermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');
    
    if (profiles && roles) {
      const merged = profiles.map(p => {
        const userRole = roles.find(r => r.user_id === p.id);
        return {
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          role: userRole?.role || 'customer',
          user_id: p.id,
        };
      });
      setUsers(merged);
    }
  };

  const fetchPermissions = async () => {
    const { data } = await supabase.from('feature_permissions').select('*').order('role, feature_key');
    setPermissions(data || []);
  };

  useEffect(() => {
    Promise.all([fetchUsers(), fetchPermissions()]).then(() => setLoading(false));
  }, []);

  const changeRole = async (userId: string, currentRole: string, newRole: string) => {
    await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', currentRole as any);
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole as any });
    if (error) toast.error('Failed to change role');
    else { toast.success(`Role changed to ${newRole}`); fetchUsers(); }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    setDeletingUserId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error('Not authenticated'); return; }

      const response = await supabase.functions.invoke('delete-account-admin', {
        body: { userId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.error) throw response.error;
      toast.success(`Account "${userName}" deleted successfully`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setDeletingUserId(null);
    }
  };

  const togglePermission = async (perm: FeaturePermission) => {
    const { error } = await supabase.from('feature_permissions').update({ is_enabled: !perm.is_enabled }).eq('id', perm.id);
    if (error) toast.error('Failed to update');
    else fetchPermissions();
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-destructive/10 text-destructive',
    partner: 'bg-blue-500/10 text-blue-400',
    customer: 'bg-emerald-500/10 text-emerald-400',
  };

  const roleIcons: Record<string, React.ReactNode> = {
    admin: <Crown size={16} className="text-destructive" />,
    partner: <Wrench size={16} className="text-blue-400" />,
    customer: <User size={16} className="text-emerald-400" />,
  };

  const groupedPermissions = permissions.reduce((acc, p) => {
    if (!acc[p.role]) acc[p.role] = [];
    acc[p.role].push(p);
    return acc;
  }, {} as Record<string, FeaturePermission[]>);

  const filteredUsers = activeTab === 'all' || activeTab === 'permissions'
    ? users
    : users.filter(u => u.role === activeTab);

  const adminCount = users.filter(u => u.role === 'admin').length;
  const partnerCount = users.filter(u => u.role === 'partner').length;
  const customerCount = users.filter(u => u.role === 'customer').length;

  const renderUserTable = (userList: UserWithRole[], showDelete: boolean) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Current Role</TableHead>
          <TableHead>Change Role</TableHead>
          {showDelete && <TableHead className="text-right">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {userList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={showDelete ? 5 : 4} className="text-center py-8 text-muted-foreground">
              No users found in this category.
            </TableCell>
          </TableRow>
        ) : (
          userList.map(u => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
              <TableCell className="text-muted-foreground">{u.email}</TableCell>
              <TableCell>
                <span className={`text-xs px-2 py-1 rounded-full font-medium inline-flex items-center gap-1 ${roleColors[u.role] || ''}`}>
                  {roleIcons[u.role]}
                  {u.role}
                </span>
              </TableCell>
              <TableCell>
                <Select value={u.role} onValueChange={v => changeRole(u.id, u.role, v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              {showDelete && (
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={deletingUserId === u.id}>
                        {deletingUserId === u.id ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
                        <span className="ml-1">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account Permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete <strong>{u.full_name || u.email}</strong>'s account ({u.role}). This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => handleDeleteUser(u.id, u.full_name || u.email)}
                        >
                          Delete Account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-primary" size={24} /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">User & Access Management</h1>
        <p className="text-muted-foreground mb-6">Manage user roles and control feature access per role</p>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="all" className="gap-2"><Users size={16} /> All Users ({users.length})</TabsTrigger>
            <TabsTrigger value="admin" className="gap-2"><Crown size={16} /> Admins ({adminCount})</TabsTrigger>
            <TabsTrigger value="partner" className="gap-2"><Wrench size={16} /> Partners ({partnerCount})</TabsTrigger>
            <TabsTrigger value="customer" className="gap-2"><User size={16} /> Customers ({customerCount})</TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2"><Shield size={16} /> Feature Access</TabsTrigger>
          </TabsList>

          {['all', 'admin', 'partner', 'customer'].map(tab => (
            <TabsContent key={tab} value={tab}>
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="font-heading text-lg flex items-center gap-2">
                    {tab === 'all' && <><Users size={18} className="text-primary" /> All Users</>}
                    {tab === 'admin' && <><Crown size={18} className="text-destructive" /> Admin Users</>}
                    {tab === 'partner' && <><Wrench size={18} className="text-blue-400" /> Partner Users</>}
                    {tab === 'customer' && <><User size={18} className="text-emerald-400" /> Customer Users</>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {renderUserTable(
                    tab === 'all' ? users : users.filter(u => u.role === tab),
                    true
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          <TabsContent value="permissions">
            <div className="grid gap-6">
              {(['admin', 'partner', 'customer'] as const).map(role => (
                <Card key={role} className="shadow-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                      <UserCheck size={18} className="text-primary" />
                      {role.charAt(0).toUpperCase() + role.slice(1)} Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {(groupedPermissions[role] || []).map(perm => (
                        <div key={perm.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">{perm.feature_label}</p>
                            <p className="text-xs text-muted-foreground font-mono">{perm.feature_key}</p>
                          </div>
                          <Switch checked={perm.is_enabled} onCheckedChange={() => togglePermission(perm)} />
                        </div>
                      ))}
                      {(!groupedPermissions[role] || groupedPermissions[role].length === 0) && (
                        <p className="text-sm text-muted-foreground py-4 text-center">No features configured for this role</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminUserRoles;
