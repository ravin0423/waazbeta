import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Plus, TrendingUp, TrendingDown, Download } from 'lucide-react';

const AdminFinanceTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [monthFilter, setMonthFilter] = useState(format(new Date(), 'yyyy-MM'));

  const emptyForm = { transaction_date: format(new Date(), 'yyyy-MM-dd'), type: 'expense', category_id: '', description: '', amount: '', tax_amount: '0', gst_rate: '18', hsn_sac_code: '', payment_method: '', payment_reference: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchData(); }, [monthFilter, filter]);

  const fetchData = async () => {
    setLoading(true);
    const monthStart = monthFilter + '-01';
    const monthEnd = format(endOfMonth(new Date(monthStart)), 'yyyy-MM-dd');

    let query = supabase.from('finance_transactions').select('*, finance_categories(name)').gte('transaction_date', monthStart).lte('transaction_date', monthEnd).order('transaction_date', { ascending: false });
    if (filter !== 'all') query = query.eq('type', filter);

    const [txRes, catRes] = await Promise.all([query, supabase.from('finance_categories').select('*').eq('is_active', true).order('name')]);
    setTransactions(txRes.data || []);
    setCategories(catRes.data || []);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount) { toast.error('Description and amount are required'); return; }
    const payload = {
      transaction_date: form.transaction_date,
      type: form.type,
      category_id: form.category_id || null,
      description: form.description,
      amount: Number(form.amount),
      tax_amount: Number(form.tax_amount || 0),
      gst_rate: Number(form.gst_rate || 0),
      hsn_sac_code: form.hsn_sac_code || null,
      payment_method: form.payment_method || null,
      payment_reference: form.payment_reference || null,
      notes: form.notes || null,
      source_type: 'manual',
      is_auto_generated: false,
      created_by: user?.id,
    };

    if (editItem) {
      await supabase.from('finance_transactions').update(payload).eq('id', editItem.id);
      toast.success('Transaction updated');
    } else {
      await supabase.from('finance_transactions').insert(payload);
      toast.success('Transaction added');
    }

    setDialogOpen(false);
    setEditItem(null);
    setForm(emptyForm);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    await supabase.from('finance_transactions').delete().eq('id', id);
    toast.success('Transaction deleted');
    fetchData();
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      transaction_date: item.transaction_date,
      type: item.type,
      category_id: item.category_id || '',
      description: item.description,
      amount: String(item.amount),
      tax_amount: String(item.tax_amount || 0),
      gst_rate: String(item.gst_rate || 0),
      hsn_sac_code: item.hsn_sac_code || '',
      payment_method: item.payment_method || '',
      payment_reference: item.payment_reference || '',
      notes: item.notes || '',
    });
    setDialogOpen(true);
  };

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Category', 'Description', 'Amount', 'Tax', 'GST%', 'HSN/SAC', 'Payment Method', 'Reference', 'Notes'];
    const rows = transactions.map((t: any) => [t.transaction_date, t.type, t.finance_categories?.name || '', t.description, t.amount, t.tax_amount, t.gst_rate, t.hsn_sac_code || '', t.payment_method || '', t.payment_reference || '', t.notes || '']);
    const csv = [headers, ...rows].map(r => r.map((c: any) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `transactions-${monthFilter}.csv`; a.click();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Income & Expenses</h1>
            <p className="text-muted-foreground">Track all revenue and expenditures. Paid invoices are auto-recorded.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCSV}><Download size={16} className="mr-2" /> Export CSV</Button>
            <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditItem(null); setForm(emptyForm); } }}>
              <DialogTrigger asChild>
                <Button><Plus size={16} className="mr-2" /> Add Transaction</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>{editItem ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle></DialogHeader>
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Date</Label>
                      <Input type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select value={form.type} onValueChange={v => setForm({ ...form, type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Income</SelectItem>
                          <SelectItem value="expense">Expense</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                      <SelectContent>
                        {categories.filter(c => c.type === form.type).map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Description *</Label>
                    <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Amount (₹) *</Label>
                      <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
                    </div>
                    <div>
                      <Label>Tax Amount (₹)</Label>
                      <Input type="number" value={form.tax_amount} onChange={e => setForm({ ...form, tax_amount: e.target.value })} />
                    </div>
                    <div>
                      <Label>GST Rate (%)</Label>
                      <Input type="number" value={form.gst_rate} onChange={e => setForm({ ...form, gst_rate: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>HSN/SAC Code</Label>
                      <Input value={form.hsn_sac_code} onChange={e => setForm({ ...form, hsn_sac_code: e.target.value })} />
                    </div>
                    <div>
                      <Label>Payment Method</Label>
                      <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="cheque">Cheque</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Payment Reference</Label>
                    <Input value={form.payment_reference} onChange={e => setForm({ ...form, payment_reference: e.target.value })} />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                  <Button className="w-full" onClick={handleSave}>{editItem ? 'Update' : 'Add'} Transaction</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center flex-wrap">
          <Input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)} className="w-auto" />
          <Tabs value={filter} onValueChange={v => setFilter(v as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expense">Expenses</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Income</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalIncome)}</p>
              </div>
              <TrendingUp className="text-emerald-500" size={28} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Expenses</p>
                <p className="text-xl font-bold text-red-500">{formatCurrency(totalExpense)}</p>
              </div>
              <TrendingDown className="text-red-500" size={28} />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Net</p>
              <p className={`text-xl font-bold ${totalIncome - totalExpense >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {formatCurrency(totalIncome - totalExpense)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions table */}
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading...</p>
            ) : transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions for this period</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Tax</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell>{format(new Date(t.transaction_date), 'dd MMM')}</TableCell>
                      <TableCell>
                        <Badge variant={t.type === 'income' ? 'default' : 'destructive'}>{t.type}</Badge>
                      </TableCell>
                      <TableCell>{t.finance_categories?.name || '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{t.description}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(t.amount))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(t.tax_amount || 0))}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{t.is_auto_generated ? 'Auto' : 'Manual'}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>Edit</Button>
                          {!t.is_auto_generated && (
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(t.id)}>Delete</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminFinanceTransactions;
