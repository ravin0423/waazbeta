import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Building2, Receipt, Landmark, BadgeCheck } from 'lucide-react';

const groupLabels: Record<string, { label: string; icon: any; desc: string }> = {
  company: { label: 'Company Details', icon: Building2, desc: 'Legal entity registration and identification' },
  gst: { label: 'GST Configuration', icon: Receipt, desc: 'GST rates, state codes, filing preferences' },
  msme: { label: 'MSME & Compliance', icon: BadgeCheck, desc: 'Udyam registration, MSME category, NIC codes' },
  banking: { label: 'Banking & TDS', icon: Landmark, desc: 'Bank account details and TDS defaults' },
};

const AdminFinanceCompliance = () => {
  const [items, setItems] = useState<any[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('company');

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    const { data } = await supabase.from('finance_compliance_info').select('*').order('display_order');
    setItems(data || []);
    const vals: Record<string, string> = {};
    (data || []).forEach((d: any) => { vals[d.id] = d.info_value; });
    setEditedValues(vals);
    setLoading(false);
  };

  const handleSave = async (group: string) => {
    setSaving(true);
    const groupItems = items.filter(i => i.info_group === group);
    const updates = groupItems
      .filter(i => editedValues[i.id] !== i.info_value)
      .map(i => supabase.from('finance_compliance_info').update({ info_value: editedValues[i.id], updated_at: new Date().toISOString() }).eq('id', i.id));

    if (updates.length === 0) {
      toast.info('No changes to save');
      setSaving(false);
      return;
    }

    await Promise.all(updates);
    toast.success(`${groupLabels[group]?.label || group} updated`);
    fetchItems();
    setSaving(false);
  };

  const addNewField = async (group: string) => {
    const label = prompt('Enter field label:');
    if (!label) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const maxOrder = items.filter(i => i.info_group === group).reduce((max, i) => Math.max(max, i.display_order), 0);

    await supabase.from('finance_compliance_info').insert({
      info_key: key,
      info_label: label,
      info_value: '',
      info_group: group,
      display_order: maxOrder + 1,
      is_editable: true,
    });
    toast.success('Field added');
    fetchItems();
  };

  const deleteField = async (id: string, isEditable: boolean) => {
    if (!isEditable) { toast.error('System fields cannot be deleted'); return; }
    if (!confirm('Delete this field?')) return;
    await supabase.from('finance_compliance_info').delete().eq('id', id);
    toast.success('Field deleted');
    fetchItems();
  };

  if (loading) return <DashboardLayout><div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Compliance & MSME</h1>
          <p className="text-muted-foreground">Manage company registration, GST config, MSME details, banking & TDS settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            {Object.entries(groupLabels).map(([key, g]) => (
              <TabsTrigger key={key} value={key} className="flex gap-2 items-center">
                <g.icon size={14} />
                <span className="hidden sm:inline">{g.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupLabels).map(([groupKey, g]) => (
            <TabsContent key={groupKey} value={groupKey}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2"><g.icon size={20} /> {g.label}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{g.desc}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => addNewField(groupKey)}>+ Add Field</Button>
                      <Button size="sm" disabled={saving} onClick={() => handleSave(groupKey)}>
                        <Save size={14} className="mr-1" /> Save
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.filter(i => i.info_group === groupKey).map(item => (
                      <div key={item.id} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">{item.info_label}</Label>
                          {item.is_editable && !item.is_system && (
                            <button onClick={() => deleteField(item.id, item.is_editable)} className="text-xs text-destructive hover:underline">Remove</button>
                          )}
                        </div>
                        <Input
                          value={editedValues[item.id] || ''}
                          onChange={e => setEditedValues({ ...editedValues, [item.id]: e.target.value })}
                          placeholder={`Enter ${item.info_label.toLowerCase()}`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminFinanceCompliance;
