import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Shield, Users, UserCheck, Plus } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('users');

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
    // Delete old role, insert new
    await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', currentRole as any);
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole as any });
    if (error) toast.error('Failed to change role');
    else { toast.success(`Role changed to ${newRole}`); fetchUsers(); }
  };

  const togglePermission = async (perm: FeaturePermission) => {
    const { error } = await supabase.from('feature_permissions').update({ is_enabled: !perm.is_enabled }).eq('id', perm.id);
    if (error) toast.error('Failed to update');
    else fetchPermissions();
  };

  const roleColors: Record<string, string> = {
    admin: 'bg-destructive/10 text-destructive',
    partner: 'bg-info/10 text-info',
    customer: 'bg-success/10 text-success',
  };

  const groupedPermissions = permissions.reduce((acc, p) => {
    if (!acc[p.role]) acc[p.role] = [];
    acc[p.role].push(p);
    return acc;
  }, {} as Record<string, FeaturePermission[]>);

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
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="gap-2"><Users size={16} /> Users & Roles</TabsTrigger>
            <TabsTrigger value="permissions" className="gap-2"><Shield size={16} /> Feature Access</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card className="shadow-card">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Current Role</TableHead>
                      <TableHead>Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No users yet. Sign up some users to manage them here.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map(u => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
                          <TableCell className="text-muted-foreground">{u.email}</TableCell>
                          <TableCell>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleColors[u.role] || ''}`}>
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
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

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
