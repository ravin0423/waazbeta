import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { GripVertical, Pencil, Trash2, Plus, Eye, EyeOff, LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react';

interface LandingSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  content: any;
  display_order: number;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const AdminLandingPage = () => {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editSection, setEditSection] = useState<LandingSection | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [contentStr, setContentStr] = useState('');
  const [expandedContent, setExpandedContent] = useState<string | null>(null);

  const fetchSections = async () => {
    const { data, error } = await supabase
      .from('landing_sections')
      .select('*')
      .order('display_order');
    if (error) { toast.error('Failed to load sections'); return; }
    setSections(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchSections(); }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    const { error } = await supabase
      .from('landing_sections')
      .update({ is_enabled: enabled, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) { toast.error('Failed to update'); return; }
    setSections(prev => prev.map(s => s.id === id ? { ...s, is_enabled: enabled } : s));
    toast.success(enabled ? 'Section enabled' : 'Section disabled');
  };

  const handleEdit = (section: LandingSection) => {
    setEditSection({ ...section });
    setContentStr(JSON.stringify(section.content, null, 2));
    setIsNew(false);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditSection({
      id: '',
      section_key: '',
      title: '',
      subtitle: '',
      description: '',
      content: [],
      display_order: sections.length + 1,
      is_enabled: true,
      created_at: '',
      updated_at: '',
    });
    setContentStr('[]');
    setIsNew(true);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editSection) return;
    let parsedContent;
    try {
      parsedContent = JSON.parse(contentStr);
    } catch {
      toast.error('Invalid JSON in content field');
      return;
    }

    if (!editSection.section_key || !editSection.title) {
      toast.error('Section key and title are required');
      return;
    }

    const payload = {
      section_key: editSection.section_key,
      title: editSection.title,
      subtitle: editSection.subtitle || null,
      description: editSection.description || null,
      content: parsedContent,
      display_order: editSection.display_order,
      is_enabled: editSection.is_enabled,
      updated_at: new Date().toISOString(),
    };

    if (isNew) {
      const { error } = await supabase.from('landing_sections').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Section added');
    } else {
      const { error } = await supabase.from('landing_sections').update(payload).eq('id', editSection.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Section updated');
    }

    setIsDialogOpen(false);
    fetchSections();
  };

  const handleDelete = async (id: string, key: string) => {
    if (!confirm(`Delete section "${key}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('landing_sections').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Section deleted');
    fetchSections();
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const idx = sections.findIndex(s => s.id === id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;

    const currentOrder = sections[idx].display_order;
    const swapOrder = sections[swapIdx].display_order;

    await Promise.all([
      supabase.from('landing_sections').update({ display_order: swapOrder }).eq('id', sections[idx].id),
      supabase.from('landing_sections').update({ display_order: currentOrder }).eq('id', sections[swapIdx].id),
    ]);
    fetchSections();
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Landing Page Manager</h1>
            <p className="text-muted-foreground">Manage all sections of the public landing page</p>
          </div>
          <Button onClick={handleAdd} className="gradient-primary text-primary-foreground">
            <Plus size={16} className="mr-2" /> Add Section
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : sections.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <LayoutDashboard size={48} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="font-heading font-semibold text-lg mb-2">No sections yet</h3>
              <p className="text-muted-foreground mb-4">Add your first landing page section</p>
              <Button onClick={handleAdd}>Add Section</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sections.map((section, idx) => (
              <Card key={section.id} className={`shadow-card transition-opacity ${!section.is_enabled ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Reorder buttons */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleReorder(section.id, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={() => handleReorder(section.id, 'down')}
                        disabled={idx === sections.length - 1}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </div>

                    {/* Section info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {section.section_key}
                        </span>
                        <span className="text-xs text-muted-foreground">Order: {section.display_order}</span>
                      </div>
                      <h3 className="font-heading font-semibold text-foreground truncate">{section.title}</h3>
                      {section.subtitle && (
                        <p className="text-sm text-muted-foreground truncate">{section.subtitle}</p>
                      )}
                    </div>

                    {/* Content preview toggle */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedContent(expandedContent === section.id ? null : section.id)}
                    >
                      {expandedContent === section.id ? 'Hide' : 'Preview'}
                    </Button>

                    {/* Toggle */}
                    <div className="flex items-center gap-2">
                      {section.is_enabled ? (
                        <Eye size={16} className="text-primary" />
                      ) : (
                        <EyeOff size={16} className="text-muted-foreground" />
                      )}
                      <Switch
                        checked={section.is_enabled}
                        onCheckedChange={(checked) => handleToggle(section.id, checked)}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleEdit(section)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(section.id, section.section_key)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded content preview */}
                  {expandedContent === section.id && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-48 text-muted-foreground">
                        {JSON.stringify(section.content, null, 2)}
                      </pre>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit/Add Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isNew ? 'Add New Section' : 'Edit Section'}</DialogTitle>
            </DialogHeader>
            {editSection && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Section Key</Label>
                    <Input
                      value={editSection.section_key}
                      onChange={e => setEditSection({ ...editSection, section_key: e.target.value })}
                      placeholder="e.g. hero, stats, coverage"
                      disabled={!isNew}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Unique identifier (cannot change after creation)</p>
                  </div>
                  <div>
                    <Label>Display Order</Label>
                    <Input
                      type="number"
                      value={editSection.display_order}
                      onChange={e => setEditSection({ ...editSection, display_order: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Title</Label>
                  <Input
                    value={editSection.title}
                    onChange={e => setEditSection({ ...editSection, title: e.target.value })}
                    placeholder="Section title"
                  />
                </div>
                <div>
                  <Label>Subtitle</Label>
                  <Input
                    value={editSection.subtitle || ''}
                    onChange={e => setEditSection({ ...editSection, subtitle: e.target.value })}
                    placeholder="Optional subtitle"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={editSection.description || ''}
                    onChange={e => setEditSection({ ...editSection, description: e.target.value })}
                    placeholder="Optional description"
                    rows={2}
                  />
                </div>
                {renderContentEditor()}
                <details className="mt-2">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Advanced: Raw JSON</summary>
                  <Textarea
                    value={contentStr}
                    onChange={e => setContentStr(e.target.value)}
                    placeholder='[{"key": "value"}]'
                    rows={6}
                    className="font-mono text-sm mt-2"
                  />
                </details>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editSection.is_enabled}
                    onCheckedChange={checked => setEditSection({ ...editSection, is_enabled: checked })}
                  />
                  <Label>Enabled on landing page</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
                {isNew ? 'Add Section' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminLandingPage;
