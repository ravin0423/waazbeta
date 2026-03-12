import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface GadgetCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  is_active: boolean;
  created_at: string;
}

const AdminGadgetCategories = () => {
  const [categories, setCategories] = useState<GadgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<GadgetCategory | null>(null);
  const [form, setForm] = useState({ name: '', description: '', icon: 'smartphone' });
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    const { data, error } = await supabase.from('gadget_categories').select('*').order('created_at');
    if (error) { toast.error('Failed to load categories'); return; }
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: '', description: '', icon: 'smartphone' }); setDialogOpen(true); };
  const openEdit = (cat: GadgetCategory) => { setEditing(cat); setForm({ name: cat.name, description: cat.description || '', icon: cat.icon }); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from('gadget_categories').update({ name: form.name, description: form.description || null, icon: form.icon, updated_at: new Date().toISOString() }).eq('id', editing.id);
      if (error) toast.error('Failed to update'); else toast.success('Category updated');
    } else {
      const { error } = await supabase.from('gadget_categories').insert({ name: form.name, description: form.description || null, icon: form.icon });
      if (error) toast.error('Failed to create'); else toast.success('Category created');
    }
    setSaving(false);
    setDialogOpen(false);
    fetchCategories();
  };

  const toggleActive = async (cat: GadgetCategory) => {
    await supabase.from('gadget_categories').update({ is_active: !cat.is_active, updated_at: new Date().toISOString() }).eq('id', cat.id);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    const { error } = await supabase.from('gadget_categories').delete().eq('id', id);
    if (error) toast.error('Failed to delete'); else { toast.success('Category deleted'); fetchCategories(); }
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Gadget Categories</h1>
            <p className="text-muted-foreground">Manage device types covered by WaaZ</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate} className="gradient-primary text-primary-foreground">
                <Plus size={16} className="mr-2" /> Add Category
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">{editing ? 'Edit Category' : 'New Category'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input placeholder="Category name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                <Input placeholder="Icon name (e.g. smartphone, laptop)" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} />
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
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Icon</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">{cat.description || '—'}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{cat.icon}</TableCell>
                      <TableCell>
                        <Switch checked={cat.is_active} onCheckedChange={() => toggleActive(cat)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(cat)}><Pencil size={14} /></Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)} className="text-destructive"><Trash2 size={14} /></Button>
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

export default AdminGadgetCategories;
