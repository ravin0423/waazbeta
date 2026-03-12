import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface Region {
  id: string;
  name: string;
  state: string;
  city: string | null;
  is_active: boolean;
  created_at: string;
}

const AdminRegions = () => {
  const [regions, setRegions] = useState<Region[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Region | null>(null);
  const [form, setForm] = useState({ name: '', state: '', city: '' });
  const [saving, setSaving] = useState(false);

  const fetchRegions = async () => {
    const { data, error } = await supabase.from('regions').select('*').order('state, name');
    if (error) { toast.error('Failed to load regions'); return; }
    setRegions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchRegions(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', state: '', city: '' }); setDialogOpen(true); };
  const openEdit = (r: Region) => { setEditing(r); setForm({ name: r.name, state: r.state, city: r.city || '' }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim() || !form.state.trim()) { toast.error('Name and state are required'); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('regions').update({ name: form.name, state: form.state, city: form.city || null, updated_at: new Date().toISOString() }).eq('id', editing.id);
      if (error) toast.error('Failed to update'); else toast.success('Region updated');
    } else {
      const { error } = await supabase.from('regions').insert({ name: form.name, state: form.state, city: form.city || null });
      if (error) toast.error('Failed to create'); else toast.success('Region created');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchRegions();
  };

  const toggleActive = async (r: Region) => {
    await supabase.from('regions').update({ is_active: !r.is_active, updated_at: new Date().toISOString() }).eq('id', r.id);
    fetchRegions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this region?')) return;
    const { error } = await supabase.from('regions').delete().eq('id', id);
    if (error) toast.error('Failed to delete — region may have linked partners'); else { toast.success('Region deleted'); fetchRegions(); }
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Regions</h1>
            <p className="text-muted-foreground">Manage service regions across India</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gradient-primary text-primary-foreground">
                <Plus size={16} className="mr-2" /> Add Region
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">{editing ? 'Edit Region' : 'New Region'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Region name (e.g. Chennai Metro)" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="State" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                <Input placeholder="City (optional)" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
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
                    <TableHead>Region Name</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regions.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="text-muted-foreground">{r.state}</TableCell>
                      <TableCell className="text-muted-foreground">{r.city || '—'}</TableCell>
                      <TableCell>
                        <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(r)}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-destructive"><Trash2 size={14} /></Button>
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

export default AdminRegions;
