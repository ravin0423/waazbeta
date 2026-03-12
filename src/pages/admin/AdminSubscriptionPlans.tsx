import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import StatusBadge from '@/components/StatusBadge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface SubscriptionPlan {
  id: string;
  name: string;
  code: string;
  gadget_category_id: string | null;
  annual_price: number;
  covers_hardware_failure: boolean;
  covers_battery: boolean;
  covers_motherboard: boolean;
  covers_accidental_damage: boolean;
  covers_liquid_damage: boolean;
  is_active: boolean;
  created_at: string;
}

interface GadgetCategory {
  id: string;
  name: string;
}

const emptyPlan = {
  name: '',
  code: '',
  gadget_category_id: '' as string,
  annual_price: 0,
  covers_hardware_failure: true,
  covers_battery: true,
  covers_motherboard: true,
  covers_accidental_damage: false,
  covers_liquid_damage: false,
};

const AdminSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [categories, setCategories] = useState<GadgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [form, setForm] = useState(emptyPlan);

  const fetchData = async () => {
    setLoading(true);
    const [plansRes, catsRes] = await Promise.all([
      supabase.from('subscription_plans').select('*').order('created_at', { ascending: false }),
      supabase.from('gadget_categories').select('id, name').eq('is_active', true),
    ]);
    if (plansRes.data) setPlans(plansRes.data);
    if (catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditingPlan(null);
    setForm(emptyPlan);
    setDialogOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      code: plan.code,
      gadget_category_id: plan.gadget_category_id || '',
      annual_price: plan.annual_price,
      covers_hardware_failure: plan.covers_hardware_failure,
      covers_battery: plan.covers_battery,
      covers_motherboard: plan.covers_motherboard,
      covers_accidental_damage: plan.covers_accidental_damage,
      covers_liquid_damage: plan.covers_liquid_damage,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code || form.annual_price <= 0) {
      toast.error('Please fill name, code, and a valid price');
      return;
    }
    const payload = {
      name: form.name,
      code: form.code,
      gadget_category_id: form.gadget_category_id || null,
      annual_price: form.annual_price,
      covers_hardware_failure: form.covers_hardware_failure,
      covers_battery: form.covers_battery,
      covers_motherboard: form.covers_motherboard,
      covers_accidental_damage: form.covers_accidental_damage,
      covers_liquid_damage: form.covers_liquid_damage,
    };

    if (editingPlan) {
      const { error } = await supabase.from('subscription_plans').update(payload).eq('id', editingPlan.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Plan updated');
    } else {
      const { error } = await supabase.from('subscription_plans').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Plan created');
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Plan deleted');
    fetchData();
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return 'All';
    return categories.find(c => c.id === id)?.name || '—';
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold mb-1">Subscription Plans</h1>
            <p className="text-muted-foreground">Add, edit, or delete warranty plans per gadget category</p>
          </div>
          <Button onClick={openAdd} className="gap-2"><Plus size={16} /> Add Plan</Button>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Annual Price (₹)</TableHead>
                  <TableHead>Coverage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading…</TableCell></TableRow>
                ) : plans.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No subscription plans yet. Click "Add Plan" to create one.</TableCell></TableRow>
                ) : plans.map(plan => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell className="font-mono text-sm">{plan.code}</TableCell>
                    <TableCell>{getCategoryName(plan.gadget_category_id)}</TableCell>
                    <TableCell>₹{Number(plan.annual_price).toLocaleString('en-IN')}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {plan.covers_hardware_failure && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">HW</span>}
                        {plan.covers_battery && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">Battery</span>}
                        {plan.covers_motherboard && <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">MB</span>}
                        {plan.covers_accidental_damage && <span className="text-xs bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded">Accidental</span>}
                        {plan.covers_liquid_damage && <span className="text-xs bg-accent/20 text-accent-foreground px-1.5 py-0.5 rounded">Liquid</span>}
                      </div>
                    </TableCell>
                    <TableCell><StatusBadge status={plan.is_active ? 'active' : 'expired'} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}><Pencil size={16} /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(plan.id)}><Trash2 size={16} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Plan Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Camera Standard Care" />
                </div>
                <div>
                  <Label>Code</Label>
                  <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. camera-standard" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Gadget Category</Label>
                  <Select value={form.gadget_category_id} onValueChange={v => setForm(f => ({ ...f, gadget_category_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="All categories" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All categories</SelectItem>
                      {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Annual Price (₹)</Label>
                  <Input type="number" value={form.annual_price} onChange={e => setForm(f => ({ ...f, annual_price: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Coverage Options</Label>
                {[
                  { key: 'covers_hardware_failure', label: 'Hardware Failure' },
                  { key: 'covers_battery', label: 'Battery' },
                  { key: 'covers_motherboard', label: 'Motherboard' },
                  { key: 'covers_accidental_damage', label: 'Accidental Damage' },
                  { key: 'covers_liquid_damage', label: 'Liquid Damage' },
                ].map(opt => (
                  <div key={opt.key} className="flex items-center justify-between">
                    <span className="text-sm">{opt.label}</span>
                    <Switch
                      checked={(form as any)[opt.key]}
                      onCheckedChange={v => setForm(f => ({ ...f, [opt.key]: v }))}
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>{editingPlan ? 'Update' : 'Create'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminSubscriptionPlans;
