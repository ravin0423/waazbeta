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
import { FileText, Plus, Loader2, Edit, Download, Upload, Image } from 'lucide-react';
import { format } from 'date-fns';

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [sigOpen, setSigOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: '', customer_email: '', subtotal: '', cgst_percent: '9', sgst_percent: '9',
    status: 'pending', notes: '', due_date: '', user_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchInvoices = async () => {
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from('profiles').select('id, full_name, email, created_at').order('created_at', { ascending: false });
    setCustomers(data || []);
  };

  const fetchSignature = async () => {
    const { data } = await supabase.storage.from('company-assets').list('', { search: 'signature' });
    if (data && data.length > 0) {
      const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(data[0].name);
      setSignatureUrl(urlData.publicUrl);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchSignature();
  }, []);

  const resetForm = () => {
    setForm({ customer_name: '', customer_email: '', subtotal: '', cgst_percent: '9', sgst_percent: '9', status: 'pending', notes: '', due_date: '', user_id: '' });
    setEditId(null);
  };

  const openEdit = (inv: any) => {
    setForm({
      customer_name: inv.customer_name,
      customer_email: inv.customer_email || '',
      subtotal: String(inv.subtotal || inv.amount),
      cgst_percent: String(inv.cgst_percent || 0),
      sgst_percent: String(inv.sgst_percent || 0),
      status: inv.status,
      notes: inv.notes || '',
      due_date: inv.due_date || '',
      user_id: inv.user_id || '',
    });
    setEditId(inv.id);
    setOpen(true);
  };

  const calcTotals = () => {
    const sub = Number(form.subtotal) || 0;
    const cgst = sub * (Number(form.cgst_percent) || 0) / 100;
    const sgst = sub * (Number(form.sgst_percent) || 0) / 100;
    return { subtotal: sub, cgst_amount: cgst, sgst_amount: sgst, amount: sub + cgst + sgst };
  };

  const handleCustomerSelect = (userId: string) => {
    const c = customers.find(c => c.id === userId);
    if (c) {
      setForm(f => ({ ...f, user_id: userId, customer_name: c.full_name, customer_email: c.email }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const totals = calcTotals();

    if (editId) {
      const payload = {
        customer_name: form.customer_name,
        customer_email: form.customer_email || null,
        subtotal: totals.subtotal,
        cgst_percent: Number(form.cgst_percent),
        sgst_percent: Number(form.sgst_percent),
        cgst_amount: totals.cgst_amount,
        sgst_amount: totals.sgst_amount,
        amount: totals.amount,
        status: form.status,
        notes: form.notes || null,
        due_date: form.due_date || null,
        user_id: form.user_id || null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('invoices').update(payload).eq('id', editId);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
      toast.success('Invoice updated');
    } else {
      // Generate invoice number via DB function
      const { data: numData, error: numErr } = await supabase.rpc('generate_invoice_number');
      if (numErr || !numData) { toast.error('Failed to generate invoice number'); setSaving(false); return; }

      const payload = {
        invoice_number: numData,
        customer_name: form.customer_name,
        customer_email: form.customer_email || null,
        subtotal: totals.subtotal,
        cgst_percent: Number(form.cgst_percent),
        sgst_percent: Number(form.sgst_percent),
        cgst_amount: totals.cgst_amount,
        sgst_amount: totals.sgst_amount,
        amount: totals.amount,
        status: form.status,
        notes: form.notes || null,
        due_date: form.due_date || null,
        user_id: form.user_id || null,
      };
      const { error } = await supabase.from('invoices').insert(payload);
      if (error) { toast.error('Failed to create: ' + error.message); setSaving(false); return; }
      toast.success(`Invoice ${numData} created`);
    }
    setSaving(false);
    setOpen(false);
    resetForm();
    fetchInvoices();
  };

  const handleSigUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // Remove old signature files
    const { data: existing } = await supabase.storage.from('company-assets').list('', { search: 'signature' });
    if (existing && existing.length > 0) {
      await supabase.storage.from('company-assets').remove(existing.map(f => f.name));
    }
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
    win.document.write(`
      <html><head><title>Invoice ${inv.invoice_number}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; max-width: 800px; margin: auto; color: #1a1a2e; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #6366f1; }
        .logo span { font-size: 12px; display: block; color: #666; font-weight: normal; }
        .meta { text-align: right; font-size: 13px; color: #555; }
        .meta strong { color: #1a1a2e; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f8f9fa; text-align: left; padding: 10px; font-size: 13px; border-bottom: 2px solid #e0e0e0; }
        td { padding: 10px; font-size: 13px; border-bottom: 1px solid #eee; }
        .totals { margin-top: 20px; text-align: right; }
        .totals p { margin: 4px 0; font-size: 14px; }
        .totals .grand { font-size: 18px; font-weight: bold; color: #6366f1; border-top: 2px solid #6366f1; padding-top: 8px; margin-top: 8px; }
        .sig { margin-top: 50px; text-align: right; }
        .sig img { max-height: 60px; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }
        @media print { body { padding: 20px; } }
      </style>
      </head><body>
      <div class="header">
        <div>
          <div class="logo">WaaZ<span>Device Protection Services</span></div>
        </div>
        <div class="meta">
          <strong>Invoice #</strong> ${inv.invoice_number}<br/>
          <strong>Date:</strong> ${format(new Date(inv.created_at), 'dd MMM yyyy')}<br/>
          ${inv.due_date ? `<strong>Due:</strong> ${format(new Date(inv.due_date), 'dd MMM yyyy')}<br/>` : ''}
          <strong>Status:</strong> ${inv.status.toUpperCase()}
        </div>
      </div>
      <p><strong>Bill To:</strong><br/>${inv.customer_name}<br/>${inv.customer_email || ''}</p>
      <table>
        <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
        <tbody>
          <tr><td>Service / Subscription</td><td style="text-align:right">₹${Number(inv.subtotal || inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr>
        </tbody>
      </table>
      <div class="totals">
        <p>Subtotal: ₹${Number(inv.subtotal || inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
        ${Number(inv.cgst_amount) > 0 ? `<p>CGST (${inv.cgst_percent}%): ₹${Number(inv.cgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>` : ''}
        ${Number(inv.sgst_amount) > 0 ? `<p>SGST (${inv.sgst_percent}%): ₹${Number(inv.sgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>` : ''}
        <p class="grand">Total: ₹${Number(inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
      </div>
      ${inv.notes ? `<p style="margin-top:20px;font-size:13px;color:#666"><strong>Notes:</strong> ${inv.notes}</p>` : ''}
      <div class="sig">
        <p style="font-size:12px;color:#666">Authorized Signatory</p>
        ${signatureUrl ? `<img src="${signatureUrl}" alt="Signature" />` : '<p style="font-size:11px;color:#999">(Digital signature not uploaded)</p>'}
        <p style="font-size:13px;font-weight:bold;margin-top:4px">WaaZ</p>
      </div>
      <div class="footer">This is a computer-generated invoice. &copy; WaaZ Device Protection Services</div>
      <script>window.print();</script>
      </body></html>
    `);
    win.document.close();
  };

  const statusColor = (s: string) => {
    if (s === 'paid') return 'default';
    if (s === 'overdue') return 'destructive';
    return 'secondary';
  };

  const totals = calcTotals();

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
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle className="font-heading">{editId ? 'Edit Invoice' : 'New Invoice'}</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  {!editId && (
                    <div className="space-y-2">
                      <Label>Link to Customer (optional)</Label>
                      <Select value={form.user_id} onValueChange={handleCustomerSelect}>
                        <SelectTrigger><SelectValue placeholder="Select a customer..." /></SelectTrigger>
                        <SelectContent>
                          {customers.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.full_name} ({c.email})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                  <div className="space-y-2">
                    <Label>Subtotal (₹)</Label>
                    <Input type="number" step="0.01" value={form.subtotal} onChange={e => setForm(f => ({ ...f, subtotal: e.target.value }))} required />
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
                  <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
                    <div className="flex justify-between"><span>Subtotal</span><span>₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>CGST ({form.cgst_percent}%)</span><span>₹{totals.cgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>SGST ({form.sgst_percent}%)</span><span>₹{totals.sgst_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>Total</span><span>₹{totals.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
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
                    <TableHead>Subtotal</TableHead>
                    <TableHead>GST</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{inv.customer_name}</p>
                          {inv.customer_email && <p className="text-xs text-muted-foreground">{inv.customer_email}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">₹{Number(inv.subtotal || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {Number(inv.cgst_amount || 0) > 0 && <span className="block">C: ₹{Number(inv.cgst_amount).toLocaleString('en-IN')}</span>}
                        {Number(inv.sgst_amount || 0) > 0 && <span className="block">S: ₹{Number(inv.sgst_amount).toLocaleString('en-IN')}</span>}
                        {Number(inv.cgst_amount || 0) === 0 && Number(inv.sgst_amount || 0) === 0 && '—'}
                      </TableCell>
                      <TableCell className="font-medium">₹{Number(inv.amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell><Badge variant={statusColor(inv.status) as any}>{inv.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{inv.due_date ? format(new Date(inv.due_date), 'dd MMM yyyy') : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(inv.created_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(inv)}><Edit size={14} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(inv)}><Download size={14} /></Button>
                        </div>
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

export default AdminInvoices;
