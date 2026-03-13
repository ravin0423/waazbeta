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
import { ShoppingCart, Plus, Loader2, Edit } from 'lucide-react';
import { format } from 'date-fns';

const AdminPurchaseOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ po_number: '', vendor: '', description: '', total_amount: '', status: 'draft', order_date: '', expected_delivery: '' });
  const [saving, setSaving] = useState(false);

  const fetchOrders = async () => {
    const { data } = await supabase.from('purchase_orders').select('*').order('created_at', { ascending: false });
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const resetForm = () => {
    setForm({ po_number: '', vendor: '', description: '', total_amount: '', status: 'draft', order_date: '', expected_delivery: '' });
    setEditId(null);
  };

  const openEdit = (po: any) => {
    setForm({
      po_number: po.po_number,
      vendor: po.vendor,
      description: po.description || '',
      total_amount: String(po.total_amount),
      status: po.status,
      order_date: po.order_date || '',
      expected_delivery: po.expected_delivery || '',
    });
    setEditId(po.id);
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      po_number: form.po_number,
      vendor: form.vendor,
      description: form.description || null,
      total_amount: Number(form.total_amount),
      status: form.status,
      order_date: form.order_date || new Date().toISOString().split('T')[0],
      expected_delivery: form.expected_delivery || null,
      updated_at: new Date().toISOString(),
    };

    if (editId) {
      const { error } = await supabase.from('purchase_orders').update(payload).eq('id', editId);
      if (error) { toast.error('Failed to update'); setSaving(false); return; }
      toast.success('Purchase order updated');
    } else {
      const { error } = await supabase.from('purchase_orders').insert(payload);
      if (error) { toast.error('Failed to create'); setSaving(false); return; }
      toast.success('Purchase order created');
    }
    setSaving(false);
    setOpen(false);
    resetForm();
    fetchOrders();
  };

  const statusColor = (s: string) => {
    if (s === 'received') return 'default';
    if (s === 'cancelled') return 'destructive';
    if (s === 'confirmed') return 'outline';
    return 'secondary';
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Purchase Orders</h1>
            <p className="text-muted-foreground">Manage parts procurement and vendor orders</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-1" /> New PO</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-heading">{editId ? 'Edit Purchase Order' : 'New Purchase Order'}</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>PO Number</Label>
                    <Input value={form.po_number} onChange={e => setForm(f => ({ ...f, po_number: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Vendor</Label>
                    <Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Total Amount (₹)</Label>
                    <Input type="number" value={form.total_amount} onChange={e => setForm(f => ({ ...f, total_amount: e.target.value }))} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="received">Received</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Order Date</Label>
                    <Input type="date" value={form.order_date} onChange={e => setForm(f => ({ ...f, order_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Expected Delivery</Label>
                    <Input type="date" value={form.expected_delivery} onChange={e => setForm(f => ({ ...f, expected_delivery: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
                </div>
                <Button type="submit" disabled={saving} className="w-full">
                  {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                  {editId ? 'Update PO' : 'Create PO'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No purchase orders yet. Click "New PO" to create one.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(po => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono text-sm">{po.po_number}</TableCell>
                      <TableCell className="font-medium">{po.vendor}</TableCell>
                      <TableCell>₹{Number(po.total_amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell><Badge variant={statusColor(po.status) as any}>{po.status}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(po.order_date), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{po.expected_delivery ? format(new Date(po.expected_delivery), 'dd MMM yyyy') : '—'}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(po)}><Edit size={14} /></Button>
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

export default AdminPurchaseOrders;
