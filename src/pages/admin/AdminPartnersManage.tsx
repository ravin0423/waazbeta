import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Loader2, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Partner {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  city: string;
  state: string;
  region_id: string | null;
  sla_turnaround_days: number;
  commission_rate: number;
  quality_rating: number;
  total_repairs: number;
  is_active: boolean;
}

interface Region {
  id: string;
  name: string;
}

const AdminPartnersManage = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', state: '', region_id: '', sla_turnaround_days: '7', commission_rate: '10', quality_rating: '5.0' });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('partners').select('*').order('name'),
      supabase.from('regions').select('id, name').eq('is_active', true).order('name'),
    ]);
    setPartners(p || []);
    setRegions(r || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', email: '', phone: '', city: '', state: '', region_id: '', sla_turnaround_days: '7', commission_rate: '10', quality_rating: '5.0' });
    setDialogOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditing(p);
    setForm({
      name: p.name, email: p.email || '', phone: p.phone || '',
      city: p.city, state: p.state, region_id: p.region_id || '',
      sla_turnaround_days: String(p.sla_turnaround_days),
      commission_rate: String(p.commission_rate),
      quality_rating: String(p.quality_rating),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim() || !form.state.trim()) { toast.error('Name, city, and state are required'); return; }
    setSaving(true);
    const payload = {
      name: form.name, email: form.email || null, phone: form.phone || null,
      city: form.city, state: form.state, region_id: form.region_id || null,
      sla_turnaround_days: parseInt(form.sla_turnaround_days) || 7,
      commission_rate: parseFloat(form.commission_rate) || 10,
      quality_rating: parseFloat(form.quality_rating) || 5.0,
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      const { error } = await supabase.from('partners').update(payload).eq('id', editing.id);
      if (error) toast.error('Failed to update'); else toast.success('Partner updated');
    } else {
      const { error } = await supabase.from('partners').insert(payload);
      if (error) toast.error('Failed to create'); else toast.success('Partner created');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const toggleActive = async (p: Partner) => {
    await supabase.from('partners').update({ is_active: !p.is_active, updated_at: new Date().toISOString() }).eq('id', p.id);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this partner?')) return;
    const { error } = await supabase.from('partners').delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Partner deleted'); fetchData(); }
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Partners Management</h1>
            <p className="text-muted-foreground">Add, edit and manage repair partner network</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gradient-primary text-primary-foreground">
                <Plus size={16} className="mr-2" /> Add Partner
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">{editing ? 'Edit Partner' : 'New Partner'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Partner name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  <Input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="City" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                  <Input placeholder="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                </div>
                <Select value={form.region_id} onValueChange={v => setForm({ ...form, region_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select region" /></SelectTrigger>
                  <SelectContent>
                    {regions.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">SLA (days)</label>
                    <Input type="number" value={form.sla_turnaround_days} onChange={e => setForm({ ...form, sla_turnaround_days: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Commission %</label>
                    <Input type="number" step="0.5" value={form.commission_rate} onChange={e => setForm({ ...form, commission_rate: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Rating</label>
                    <Input type="number" step="0.1" min="0" max="5" value={form.quality_rating} onChange={e => setForm({ ...form, quality_rating: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground">
                  {saving && <Loader2 size={16} className="mr-2 animate-spin" />} {editing ? 'Update' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>SLA (days)</TableHead>
                    <TableHead>Commission</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Repairs</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partners.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.city}, {p.state}</TableCell>
                      <TableCell>{p.sla_turnaround_days}</TableCell>
                      <TableCell>{p.commission_rate}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star size={14} className="text-accent fill-accent" />
                          <span>{p.quality_rating}</span>
                        </div>
                      </TableCell>
                      <TableCell>{p.total_repairs}</TableCell>
                      <TableCell>
                        <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive"><Trash2 size={14} /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminPartnersManage;
