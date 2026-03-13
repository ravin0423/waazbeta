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

  // Helper to update contentStr from structured data
  const updateContent = (data: any) => {
    setContentStr(JSON.stringify(data, null, 2));
  };

  const getContentParsed = () => {
    try { return JSON.parse(contentStr); } catch { return null; }
  };

  // ─── FRIENDLY CONTENT EDITORS ─────────────────────────────────
  const renderContentEditor = () => {
    if (!editSection) return null;
    const parsed = getContentParsed();
    const key = editSection.section_key;

    // TRUSTED BRANDS — simple list of names
    if (key === 'trusted_brands' && Array.isArray(parsed)) {
      return (
        <div>
          <Label className="mb-3 block">Brand Partners</Label>
          <div className="space-y-2">
            {parsed.map((brand: any, i: number) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={brand.name || ''}
                  onChange={e => {
                    const updated = [...parsed];
                    updated[i] = { ...updated[i], name: e.target.value };
                    updateContent(updated);
                  }}
                  placeholder="Brand name"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => {
                    const updated = parsed.filter((_: any, j: number) => j !== i);
                    updateContent(updated);
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => updateContent([...parsed, { name: '' }])}
          >
            <Plus size={14} className="mr-1" /> Add Brand
          </Button>
        </div>
      );
    }

    // STATS — value, label, icon, suffix
    if (key === 'stats' && Array.isArray(parsed)) {
      return (
        <div>
          <Label className="mb-3 block">Statistics</Label>
          <div className="space-y-3">
            {parsed.map((stat: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex gap-2">
                  <Input value={stat.value || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], value: e.target.value }; updateContent(u); }} placeholder="Value (e.g. 50,000+)" />
                  <Input value={stat.label || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], label: e.target.value }; updateContent(u); }} placeholder="Label" />
                </div>
                <div className="flex gap-2 items-center">
                  <Input value={stat.icon || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], icon: e.target.value }; updateContent(u); }} placeholder="Icon name" className="w-32" />
                  <Input value={stat.suffix || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], suffix: e.target.value }; updateContent(u); }} placeholder="Suffix (optional)" />
                  <Button variant="outline" size="sm" className="text-destructive shrink-0" onClick={() => updateContent(parsed.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => updateContent([...parsed, { value: '', label: '', icon: 'Shield', suffix: '' }])}>
            <Plus size={14} className="mr-1" /> Add Stat
          </Button>
        </div>
      );
    }

    // FAQ — question and answer pairs
    if (key === 'faq' && Array.isArray(parsed)) {
      return (
        <div>
          <Label className="mb-3 block">FAQ Items</Label>
          <div className="space-y-3">
            {parsed.map((faq: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex gap-2 items-start">
                  <div className="flex-1 space-y-2">
                    <Input value={faq.q || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], q: e.target.value }; updateContent(u); }} placeholder="Question" />
                    <Textarea value={faq.a || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], a: e.target.value }; updateContent(u); }} placeholder="Answer" rows={2} />
                  </div>
                  <Button variant="outline" size="sm" className="text-destructive shrink-0 mt-1" onClick={() => updateContent(parsed.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => updateContent([...parsed, { q: '', a: '' }])}>
            <Plus size={14} className="mr-1" /> Add FAQ
          </Button>
        </div>
      );
    }

    // TESTIMONIALS — name, role, text, rating
    if (key === 'testimonials' && Array.isArray(parsed)) {
      return (
        <div>
          <Label className="mb-3 block">Testimonials</Label>
          <div className="space-y-3">
            {parsed.map((t: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex gap-2">
                  <Input value={t.name || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], name: e.target.value }; updateContent(u); }} placeholder="Name" />
                  <Input value={t.role || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], role: e.target.value }; updateContent(u); }} placeholder="Role / Location" />
                </div>
                <Textarea value={t.text || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], text: e.target.value }; updateContent(u); }} placeholder="Testimonial text" rows={2} />
                <div className="flex gap-2 items-center">
                  <Label className="text-xs">Rating:</Label>
                  <Input type="number" min={1} max={5} value={t.rating || 5} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], rating: parseInt(e.target.value) || 5 }; updateContent(u); }} className="w-20" />
                  <Button variant="outline" size="sm" className="text-destructive ml-auto shrink-0" onClick={() => updateContent(parsed.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => updateContent([...parsed, { name: '', role: '', text: '', rating: 5 }])}>
            <Plus size={14} className="mr-1" /> Add Testimonial
          </Button>
        </div>
      );
    }

    // COVERAGE / WHY_WAAZ — icon, label/title, desc
    if ((key === 'coverage' || key === 'why_waaz') && Array.isArray(parsed)) {
      const labelField = key === 'coverage' ? 'label' : 'title';
      return (
        <div>
          <Label className="mb-3 block">{key === 'coverage' ? 'Device Categories' : 'Features'}</Label>
          <div className="space-y-3">
            {parsed.map((item: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex gap-2">
                  <Input value={item.icon || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], icon: e.target.value }; updateContent(u); }} placeholder="Icon name" className="w-32" />
                  <Input value={item[labelField] || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], [labelField]: e.target.value }; updateContent(u); }} placeholder="Title" className="flex-1" />
                  <Button variant="outline" size="sm" className="text-destructive shrink-0" onClick={() => updateContent(parsed.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></Button>
                </div>
                <Textarea value={item.desc || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], desc: e.target.value }; updateContent(u); }} placeholder="Description" rows={2} />
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => updateContent([...parsed, { icon: 'Shield', [labelField]: '', desc: '' }])}>
            <Plus size={14} className="mr-1" /> Add Item
          </Button>
        </div>
      );
    }

    // COMPARISON — feature, waaz, traditional
    if (key === 'comparison' && Array.isArray(parsed)) {
      return (
        <div>
          <Label className="mb-3 block">Comparison Rows</Label>
          <div className="space-y-2">
            {parsed.map((row: any, i: number) => (
              <div key={i} className="flex gap-2 items-center">
                <Input value={row.feature || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], feature: e.target.value }; updateContent(u); }} placeholder="Feature" className="flex-1" />
                <Input value={row.waaz || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], waaz: e.target.value }; updateContent(u); }} placeholder="WaaZ" className="w-32" />
                <Input value={row.traditional || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], traditional: e.target.value }; updateContent(u); }} placeholder="Traditional" className="w-32" />
                <Button variant="outline" size="sm" className="text-destructive shrink-0" onClick={() => updateContent(parsed.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => updateContent([...parsed, { feature: '', waaz: '', traditional: '' }])}>
            <Plus size={14} className="mr-1" /> Add Row
          </Button>
        </div>
      );
    }

    // HOW IT WORKS — step, title, desc
    if (key === 'how_it_works' && Array.isArray(parsed)) {
      return (
        <div>
          <Label className="mb-3 block">Steps</Label>
          <div className="space-y-3">
            {parsed.map((item: any, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-border space-y-2">
                <div className="flex gap-2">
                  <Input value={item.step || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], step: e.target.value }; updateContent(u); }} placeholder="Step #" className="w-20" />
                  <Input value={item.title || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], title: e.target.value }; updateContent(u); }} placeholder="Title" className="flex-1" />
                  <Button variant="outline" size="sm" className="text-destructive shrink-0" onClick={() => updateContent(parsed.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></Button>
                </div>
                <Textarea value={item.desc || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], desc: e.target.value }; updateContent(u); }} placeholder="Description" rows={2} />
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => updateContent([...parsed, { step: String(parsed.length + 1).padStart(2, '0'), title: '', desc: '' }])}>
            <Plus size={14} className="mr-1" /> Add Step
          </Button>
        </div>
      );
    }

    // PLANS — name, price, period, features[], popular
    if (key === 'plans' && Array.isArray(parsed)) {
      return (
        <div>
          <Label className="mb-3 block">Pricing Plans</Label>
          <div className="space-y-4">
            {parsed.map((plan: any, i: number) => (
              <div key={i} className="p-4 rounded-lg border border-border space-y-3">
                <div className="flex gap-2 items-center">
                  <Input value={plan.name || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], name: e.target.value }; updateContent(u); }} placeholder="Plan name" />
                  <Input value={plan.price || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], price: e.target.value }; updateContent(u); }} placeholder="Price" className="w-28" />
                  <Input value={plan.period || ''} onChange={e => { const u = [...parsed]; u[i] = { ...u[i], period: e.target.value }; updateContent(u); }} placeholder="/year" className="w-20" />
                  <div className="flex items-center gap-1">
                    <Switch checked={plan.popular || false} onCheckedChange={c => { const u = [...parsed]; u[i] = { ...u[i], popular: c }; updateContent(u); }} />
                    <Label className="text-xs">Popular</Label>
                  </div>
                  <Button variant="outline" size="sm" className="text-destructive shrink-0" onClick={() => updateContent(parsed.filter((_: any, j: number) => j !== i))}><Trash2 size={14} /></Button>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Features (one per line)</Label>
                  <Textarea
                    value={(plan.features || []).join('\n')}
                    onChange={e => { const u = [...parsed]; u[i] = { ...u[i], features: e.target.value.split('\n') }; updateContent(u); }}
                    rows={4}
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                  />
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => updateContent([...parsed, { name: '', price: '', period: '/year', features: [], popular: false }])}>
            <Plus size={14} className="mr-1" /> Add Plan
          </Button>
        </div>
      );
    }

    // Default: show raw JSON
    return (
      <div>
        <Label>Content (JSON)</Label>
        <Textarea
          value={contentStr}
          onChange={e => setContentStr(e.target.value)}
          placeholder='[{"key": "value"}]'
          rows={10}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground mt-1">JSON array or object for section-specific data</p>
      </div>
    );
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
