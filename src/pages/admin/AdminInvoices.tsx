import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { FileText, Plus, Loader2, Edit } from 'lucide-react';
import { format } from 'date-fns';

const AdminInvoices = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ invoice_number: '', customer_name: '', customer_email: '', amount: '', status: 'pending', notes: '', due_date: '' });
  const [saving, setSaving] = useState(false);

  const fetchInvoices = async () => {
    const { data } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
    setInvoices(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchInvoices(); }, []);

  const resetForm = () => {
    setForm({ invoice_number: '', customer_name: '', customer_email: '', amount: '', status: 'pending', notes: '', due_date: '' });
    setEditId(null);
  };

  const openEdit = (inv: any) => {
    setForm({
      invoice_number: inv.invoice_number,
      customer_name: inv.customer_name,
      customer_email: inv.customer_email || '',
      amount: String(inv.amount),
      status: inv.status,
      notes: inv.notes || '',
      due_date: inv.due_date || '',
    });
    setEditId(inv.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      invoice_number: form.invoice_number,
      customer_name: form.customer_name,
      customer_email: form.customer_email || null,
      amount: Number(form.amount),
      status: form.status,
      notes: form.notes || null,
      due_date: form.due_date || null,
      updated_at: new Date().toISOString(),
    };

    if (editId) {
      const { error } = await supabase.from('invoices').update(payload).eq('id', editId);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
      toast.success('Invoice updated');
    } else {
      const { error } = await supabase.from('invoices').insert(payload);
      if (error) { toast.error('Failed to create'); setSaving(false); return; }
      toast.success('Invoice created');
    }
    setSaving(false);
    setOpen(false);
    resetForm();
    fetchInvoices();
  };

  const statusColor = (s: string) => {
    if (s === 'paid') return 'default';
    if (s === 'overdue') return 'destructive';
    return 'secondary';
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Invoices</h1>
            <p className="text-muted-foreground">Manage billing and payment records</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-1" /> New Invoice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">{editId ? 'Edit Invoice' : 'New Invoice'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice Number</Label>
                    <Input value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Amount (₹)</Label>
                    <Input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
                  </div>
                </div>
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
                    <TableHead>Amount</TableHead>
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
                      <TableCell className="font-medium">₹{Number(inv.amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell><Badge variant={statusColor(inv.status) as any}>{inv.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{inv.due_date ? format(new Date(inv.due_date), 'dd MMM yyyy') : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(inv.created_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(inv)}><Edit size={14} /></Button>
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
