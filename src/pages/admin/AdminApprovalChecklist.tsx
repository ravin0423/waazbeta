import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, GripVertical, Loader2, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

interface ChecklistItem {
  id: string;
  label: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

const AdminApprovalChecklist = () => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [formLabel, setFormLabel] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchItems = async () => {
    const { data } = await supabase
      .from('approval_checklist_items' as any)
      .select('*')
      .order('display_order');
    setItems((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openCreate = () => {
    setEditingItem(null);
    setFormLabel('');
    setFormDescription('');
    setDialogOpen(true);
  };

  const openEdit = (item: ChecklistItem) => {
    setEditingItem(item);
    setFormLabel(item.label);
    setFormDescription(item.description || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formLabel.trim()) { toast.error('Label is required'); return; }
    setSaving(true);

    if (editingItem) {
      const { error } = await supabase
        .from('approval_checklist_items' as any)
        .update({ label: formLabel.trim(), description: formDescription.trim() || null, updated_at: new Date().toISOString() } as any)
        .eq('id', editingItem.id);
      if (error) toast.error('Failed to update');
      else toast.success('Checklist item updated');
    } else {
      const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.display_order)) + 1 : 0;
      const { error } = await supabase
        .from('approval_checklist_items' as any)
        .insert({ label: formLabel.trim(), description: formDescription.trim() || null, display_order: maxOrder } as any);
      if (error) toast.error('Failed to create');
      else toast.success('Checklist item added');
    }

    setSaving(false);
    setDialogOpen(false);
    fetchItems();
  };

  const toggleActive = async (item: ChecklistItem) => {
    await supabase
      .from('approval_checklist_items' as any)
      .update({ is_active: !item.is_active } as any)
      .eq('id', item.id);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this checklist item?')) return;
    await supabase.from('approval_checklist_items' as any).delete().eq('id', id);
    toast.success('Deleted');
    fetchItems();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
              <ListChecks size={24} className="text-primary" />
              Approval Checklist
            </h1>
            <p className="text-muted-foreground text-sm">Manage checklist items that must be completed before approving a subscription</p>
          </div>
          <Button onClick={openCreate}>
            <Plus size={16} className="mr-1" /> Add Item
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
        ) : items.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ListChecks size={48} className="mx-auto text-muted-foreground/40 mb-4" />
              <p className="text-muted-foreground">No checklist items yet. Add your first one to get started.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <Card key={item.id} className={!item.is_active ? 'opacity-60' : ''}>
                <CardContent className="flex items-center gap-4 py-4">
                  <GripVertical size={18} className="text-muted-foreground/40 shrink-0" />
                  <span className="text-sm font-bold text-muted-foreground w-6">{index + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.label}</p>
                    {item.description && <p className="text-sm text-muted-foreground truncate">{item.description}</p>}
                  </div>
                  <Switch checked={item.is_active} onCheckedChange={() => toggleActive(item)} />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} className="text-destructive hover:text-destructive">
                    <Trash2 size={16} />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Checklist Item' : 'Add Checklist Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Label *</Label>
              <Input value={formLabel} onChange={e => setFormLabel(e.target.value)} placeholder="e.g. Payment verified" className="mt-1" />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} placeholder="Additional details about this check" className="mt-1" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 size={16} className="animate-spin mr-1" />}
              {editingItem ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminApprovalChecklist;
