import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { FileText, Plus, Loader2, Edit, Download, Upload, Image, Trash2, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { generateInvoiceHtml } from '@/utils/invoiceTemplate';

interface LineItem {
  type: string; // plan id or 'other'
  description: string;
  amount: string;
}

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sigOpen, setSigOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', cgst_percent: '9', sgst_percent: '9',
    status: 'pending', notes: '', due_date: '', user_id: '',
  });
  const [lineItems, setLineItems] = useState<LineItem[]>([{ type: '', description: '', amount: '' }]);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [customItemText, setCustomItemText] = useState('');
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchInvoices = async () => {
    const { data } = await supabase.from('invoices').select('*, invoice_line_items(id, description, amount, subscription_plan_id)').order('created_at', { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false });
    setCustomers(data || []);
  };

  const fetchPlans = async () => {
    const { data } = await supabase.from('subscription_plans').select('id, name, annual_price, code, gadget_categories(name)').eq('is_active', true).order('name');
    setPlans(data || []);
  };

  const fetchSignature = async () => {
    const { data } = await supabase.storage.from('company-assets').list('', { search: 'signature' });
    if (data && data.length > 0) {
      const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(data[0].name);
      setSignatureUrl(urlData.publicUrl);
    }
  };

  useEffect(() => { fetchInvoices(); fetchCustomers(); fetchPlans(); fetchSignature(); }, []);

  const resetForm = () => {
    setForm({ customer_name: '', customer_email: '', cgst_percent: '9', sgst_percent: '9', status: 'pending', notes: '', due_date: '', user_id: '' });
    setLineItems([]);
    setEditId(null);
    setCustomerSearch('');
    setCustomItemText('');
  };

  const openEdit = (inv: any) => {
    setForm({
      customer_name: inv.customer_name,
      customer_email: inv.customer_email || '',
      cgst_percent: String(inv.cgst_percent || 0),
      sgst_percent: String(inv.sgst_percent || 0),
      status: inv.status,
      notes: inv.notes || '',
      due_date: inv.due_date || '',
      user_id: inv.user_id || '',
    });
    const items: LineItem[] = (inv.invoice_line_items || []).map((li: any) => ({
      type: li.subscription_plan_id || 'other',
      description: li.description,
      amount: String(li.amount),
    }));
    setLineItems(items.length > 0 ? items : [{ type: 'other', description: inv.line_item_description || '', amount: String(inv.subtotal || inv.amount) }]);
    setEditId(inv.id);
    setOpen(true);
  };

  const subtotal = lineItems.reduce((sum, li) => sum + (Number(li.amount) || 0), 0);
  const cgstAmt = subtotal * (Number(form.cgst_percent) || 0) / 100;
  const sgstAmt = subtotal * (Number(form.sgst_percent) || 0) / 100;
  const totalAmt = subtotal + cgstAmt + sgstAmt;

  const handleCustomerSelect = (userId: string) => {
    const c = customers.find(c => c.id === userId);
    if (c) setForm(f => ({ ...f, user_id: userId, customer_name: c.full_name, customer_email: c.email }));
  };

  const removeLineItem = (index: number) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: 'description' | 'amount', value: string) => {
    setLineItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lineItems.every(li => !li.type)) { toast.error('Please add at least one line item'); return; }
    setSaving(true);

    const primaryDesc = lineItems.map(li => li.description).filter(Boolean).join(', ');

    if (editId) {
      const payload = {
        customer_name: form.customer_name,
        customer_email: form.customer_email || null,
        subtotal,
        cgst_percent: Number(form.cgst_percent),
        sgst_percent: Number(form.sgst_percent),
        cgst_amount: cgstAmt,
        sgst_amount: sgstAmt,
        amount: totalAmt,
        status: form.status,
        notes: form.notes || null,
        due_date: form.due_date || null,
        user_id: form.user_id || null,
        line_item_description: primaryDesc,
        subscription_plan_id: lineItems[0]?.type !== 'other' ? lineItems[0]?.type || null : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('invoices').update(payload).eq('id', editId);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }

      // Replace line items
      await supabase.from('invoice_line_items').delete().eq('invoice_id', editId);
      const itemsToInsert = lineItems.filter(li => li.type).map(li => ({
        invoice_id: editId,
        description: li.description,
        amount: Number(li.amount) || 0,
        subscription_plan_id: li.type !== 'other' ? li.type : null,
      }));
      if (itemsToInsert.length > 0) {
        await supabase.from('invoice_line_items').insert(itemsToInsert);
      }
      toast.success('Invoice updated');
    } else {
      const { data: numData, error: numErr } = await supabase.rpc('generate_invoice_number');
      if (numErr || !numData) { toast.error('Failed to generate invoice number'); setSaving(false); return; }

      const payload = {
        invoice_number: numData,
        customer_name: form.customer_name,
        customer_email: form.customer_email || null,
        subtotal,
        cgst_percent: Number(form.cgst_percent),
        sgst_percent: Number(form.sgst_percent),
        cgst_amount: cgstAmt,
        sgst_amount: sgstAmt,
        amount: totalAmt,
        status: form.status,
        notes: form.notes || null,
        due_date: form.due_date || null,
        user_id: form.user_id || null,
        line_item_description: primaryDesc,
        subscription_plan_id: lineItems[0]?.type !== 'other' ? lineItems[0]?.type || null : null,
      };
      const { data: invData, error } = await supabase.from('invoices').insert(payload).select('*, invoice_line_items(id, description, amount, subscription_plan_id)').single();
      if (error || !invData) { toast.error('Failed to create: ' + (error?.message || '')); setSaving(false); return; }

      const itemsToInsert = lineItems.filter(li => li.type).map(li => ({
        invoice_id: invData.id,
        description: li.description,
        amount: Number(li.amount) || 0,
        subscription_plan_id: li.type !== 'other' ? li.type : null,
      }));
      if (itemsToInsert.length > 0) {
        await supabase.from('invoice_line_items').insert(itemsToInsert);
      }
      toast.success(`Invoice ${numData} created`);

      // Auto-open the created invoice
      const createdInv = { ...invData, invoice_line_items: itemsToInsert.map((it, i) => ({ ...it, id: `temp-${i}` })) };
      setSaving(false);
      setOpen(false);
      resetForm();
      fetchInvoices();
      handleDownloadInvoice(createdInv);
      return;
    }
    fetchInvoices();
  };

  const handleSigUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { data: existing } = await supabase.storage.from('company-assets').list('', { search: 'signature' });
    if (existing && existing.length > 0) await supabase.storage.from('company-assets').remove(existing.map(f => f.name));
    const ext = file.name.split('.').pop();
    const { error } = await supabase.storage.from('company-assets').upload(`signature.${ext}`, file, { upsert: true });
    if (error) { toast.error('Upload failed'); setUploading(false); return; }
    toast.success('Digital signature uploaded');
    setUploading(false);
    fetchSignature();
  };

  const handleDownloadInvoice = (inv: any) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(generateInvoiceHtml(inv, signatureUrl));
    win.document.close();
  };

  const statusColor = (s: string) => s === 'paid' ? 'default' : s === 'overdue' ? 'destructive' : 'secondary';

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Manage billing and payment records</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={sigOpen} onOpenChange={setSigOpen}>
              <DialogTrigger asChild>
                <Button variant="outline"><Image size={16} className="mr-1" /> Signature</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle className="font-heading">Digital Signature</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-2">
                  {signatureUrl ? (
                    <div className="border rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-2">Current Signature</p>
                      <img src={signatureUrl} alt="Digital Signature" className="max-h-20 mx-auto" />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No signature uploaded yet</p>
                  )}
                  <Label htmlFor="sig-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 hover:border-primary transition-colors">
                      <Upload size={16} className="text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{uploading ? 'Uploading...' : 'Upload new signature image'}</span>
                    </div>
                  </Label>
                  <input id="sig-upload" type="file" accept="image/*" className="hidden" onChange={handleSigUpload} disabled={uploading} />
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus size={16} className="mr-1" /> New Invoice</Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle className="font-heading">{editId ? 'Edit Invoice' : 'New Invoice'}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  {/* Customer search */}
                  {!editId && (
                    <div className="space-y-2">
                      <Label>Link to Customer (optional)</Label>
                      <Input
                        placeholder="Search customers by name or email..."
                        value={customerSearch}
                        onChange={e => { setCustomerSearch(e.target.value); setForm(f => ({ ...f, user_id: '' })); }}
                      />
                      {customerSearch && !form.user_id && (
                        <div className="max-h-40 overflow-y-auto border rounded-md bg-background">
                          {customers
                            .filter(c => c.full_name.toLowerCase().includes(customerSearch.toLowerCase()) || c.email.toLowerCase().includes(customerSearch.toLowerCase()))
                            .map(c => (
                              <button key={c.id} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                                onClick={() => { handleCustomerSelect(c.id); setCustomerSearch(c.full_name); }}>
                                <span className="font-medium">{c.full_name}</span>
                                <span className="text-muted-foreground ml-2 text-xs">{c.email}</span>
                              </button>
                            ))}
                        </div>
                      )}
                      {form.user_id && <p className="text-xs text-success">✓ Linked to {form.customer_name}</p>}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Customer Name</Label>
                      <Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Customer Email</Label>
                      <Input type="email" value={form.customer_email} onChange={e => setForm(f => ({ ...f, customer_email: e.target.value }))} />
                    </div>
                  </div>

                  {/* Line Items — single dropdown with add buttons */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Line Items</Label>

                    {/* Added items */}
                    {lineItems.length > 0 && (
                      <div className="space-y-1.5">
                        {lineItems.map((li, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-muted/40 rounded-md px-3 py-2">
                            <span className="flex-1 text-sm truncate">{li.description}</span>
                            <span className="text-sm font-medium whitespace-nowrap">₹{Number(li.amount || 0).toLocaleString('en-IN')}</span>
                            {li.type === 'other' && (
                              <Input type="number" step="0.01" className="w-24 h-7 text-xs" value={li.amount}
                                onChange={e => updateLineItem(idx, 'amount', e.target.value)} placeholder="Amt" />
                            )}
                            <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive shrink-0" onClick={() => removeLineItem(idx)}>
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Plan picker list */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-48 overflow-y-auto divide-y">
                        {plans.map(p => {
                          const alreadyAdded = lineItems.some(li => li.type === p.id);
                          return (
                            <div key={p.id} className={`flex items-center justify-between px-3 py-2 text-sm ${alreadyAdded ? 'opacity-40' : 'hover:bg-muted/50'}`}>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium">{p.name}</span>
                                {p.gadget_categories?.name && <span className="text-muted-foreground text-xs ml-1">({p.gadget_categories.name})</span>}
                                <span className="text-muted-foreground ml-2">₹{Number(p.annual_price).toLocaleString('en-IN')}</span>
                              </div>
                              <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0"
                                disabled={alreadyAdded}
                                onClick={() => {
                                  const desc = `${p.name}${p.gadget_categories?.name ? ` (${p.gadget_categories.name})` : ''} — Annual Protection Plan`;
                                  setLineItems(prev => [...prev, { type: p.id, description: desc, amount: String(p.annual_price) }]);
                                }}>
                                <Plus size={14} />
                              </Button>
                            </div>
                          );
                        })}
                        {/* Other option */}
                        <div className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50">
                          <Input placeholder="Custom item description..." className="h-7 text-xs flex-1"
                            value={customItemText} onChange={e => setCustomItemText(e.target.value)} />
                          <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0"
                            disabled={!customItemText.trim()}
                            onClick={() => {
                              setLineItems(prev => [...prev, { type: 'other', description: customItemText.trim(), amount: '' }]);
                              setCustomItemText('');
                            }}>
                            <Plus size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>CGST %</Label>
                      <Input type="number" step="0.01" value={form.cgst_percent} onChange={e => setForm(f => ({ ...f, cgst_percent: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label>SGST %</Label>
                      <Input type="number" step="0.01" value={form.sgst_percent} onChange={e => setForm(f => ({ ...f, sgst_percent: e.target.value }))} />
                    </div>
                  </div>

                  {/* Totals preview */}
                  <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                    {lineItems.filter(li => li.type).map((li, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span className="truncate max-w-[250px]">{li.description || 'Item ' + (idx + 1)}</span>
                        <span>₹{(Number(li.amount) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t pt-1 mt-1"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>CGST ({form.cgst_percent}%)</span><span>₹{cgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>SGST ({form.sgst_percent}%)</span><span>₹{sgstAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Total</span><span>₹{totalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="paid">Paid</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Due Date</Label>
                      <Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
                  </div>
                  <Button type="submit" disabled={saving} className="w-full">
                    {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                    {editId ? 'Update Invoice' : 'Create Invoice'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No invoices yet. Click "New Invoice" to create one.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Line Items</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => {
                    const items = inv.invoice_line_items || [];
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{inv.customer_name}</p>
                            {inv.customer_email && <p className="text-xs text-muted-foreground">{inv.customer_email}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px]">
                          {items.length > 0 ? (
                            <div className="space-y-0.5">
                              {items.map((li: any) => (
                                <span key={li.id} className="block text-xs truncate" title={li.description}>
                                  {li.description} — ₹{Number(li.amount).toLocaleString('en-IN')}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="truncate block" title={inv.line_item_description}>{inv.line_item_description || '—'}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">₹{Number(inv.subtotal || 0).toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {Number(inv.cgst_amount || 0) > 0 && <span className="block">C: ₹{Number(inv.cgst_amount).toLocaleString('en-IN')}</span>}
                          {Number(inv.sgst_amount || 0) > 0 && <span className="block">S: ₹{Number(inv.sgst_amount).toLocaleString('en-IN')}</span>}
                          {Number(inv.cgst_amount || 0) === 0 && Number(inv.sgst_amount || 0) === 0 && '—'}
                        </TableCell>
                        <TableCell className="font-medium">₹{Number(inv.amount).toLocaleString('en-IN')}</TableCell>
                        <TableCell><Badge variant={statusColor(inv.status) as any}>{inv.status}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{format(new Date(inv.created_at), 'dd MMM yyyy')}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openEdit(inv)} title="Edit"><Edit size={14} /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(inv)} title="Print Invoice"><Printer size={14} /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminInvoices;
