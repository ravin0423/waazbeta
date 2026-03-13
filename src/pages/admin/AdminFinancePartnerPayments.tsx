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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Plus, IndianRupee, Users, Download } from 'lucide-react';

const AdminFinancePartnerPayments = () => {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [complianceInfo, setComplianceInfo] = useState<Record<string, string>>({});

  const emptyForm = { partner_id: '', payout_month: format(new Date(), 'yyyy-MM') + '-01', gross_amount: '', tds_rate: '10', payment_method: '', payment_reference: '', notes: '' };
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [payoutRes, partnerRes, compRes] = await Promise.all([
      supabase.from('finance_partner_payouts').select('*, partners(name, email, phone)').order('payout_month', { ascending: false }),
      supabase.from('partners').select('id, name, commission_rate').eq('is_active', true),
      supabase.from('finance_compliance_info').select('*').in('info_key', ['default_tds_rate']),
    ]);
    setPayouts(payoutRes.data || []);
    setPartners(partnerRes.data || []);
    const map: Record<string, string> = {};
    (compRes.data || []).forEach((d: any) => { map[d.info_key] = d.info_value; });
    setComplianceInfo(map);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!form.partner_id || !form.gross_amount) { toast.error('Partner and amount required'); return; }
    const gross = Number(form.gross_amount);
    const tdsRate = Number(form.tds_rate || complianceInfo.default_tds_rate || 10);
    const tdsAmount = Math.round(gross * tdsRate / 100 * 100) / 100;
    const netAmount = gross - tdsAmount;

    const payload = {
      partner_id: form.partner_id,
      payout_month: form.payout_month,
      gross_amount: gross,
      tds_rate: tdsRate,
      tds_amount: tdsAmount,
      net_amount: netAmount,
      payment_method: form.payment_method || null,
      payment_reference: form.payment_reference || null,
      notes: form.notes || null,
    };

    if (editItem) {
      await supabase.from('finance_partner_payouts').update(payload).eq('id', editItem.id);
      toast.success('Payout updated');
    } else {
      await supabase.from('finance_partner_payouts').insert({ ...payload, status: 'pending' });
      toast.success('Payout created');
    }

    // Also record as expense transaction
    if (!editItem) {
      const partner = partners.find(p => p.id === form.partner_id);
      const { data: commCat } = await supabase.from('finance_categories').select('id').eq('name', 'Partner Commission').limit(1).single();
      await supabase.from('finance_transactions').insert({
        transaction_date: form.payout_month,
        type: 'expense',
        category_id: commCat?.id || null,
        description: `Commission payout to ${partner?.name || 'Partner'}`,
        amount: netAmount,
        tax_amount: tdsAmount,
        source_type: 'partner_payout',
        is_auto_generated: true,
        created_by: user?.id,
      });
    }

    setDialogOpen(false);
    setEditItem(null);
    setForm(emptyForm);
    fetchData();
  };

  const updateStatus = async (id: string, status: string) => {
    const update: any = { status };
    if (status === 'paid') update.paid_at = new Date().toISOString();
    await supabase.from('finance_partner_payouts').update(update).eq('id', id);
    toast.success(`Payout marked as ${status}`);
    fetchData();
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      partner_id: item.partner_id,
      payout_month: item.payout_month,
      gross_amount: String(item.gross_amount),
      tds_rate: String(item.tds_rate),
      payment_method: item.payment_method || '',
      payment_reference: item.payment_reference || '',
      notes: item.notes || '',
    });
    setDialogOpen(true);
  };

  const formatCurrency = (v: number) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const totalPending = payouts.filter(p => p.status === 'pending').reduce((s, p) => s + Number(p.net_amount), 0);
  const totalPaid = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + Number(p.net_amount), 0);
  const totalTDS = payouts.reduce((s, p) => s + Number(p.tds_amount), 0);

  const statusColor = (s: string) => s === 'paid' ? 'default' : s === 'processed' ? 'secondary' : 'outline';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Partner Payments</h1>
            <p className="text-muted-foreground">Commission payouts, TDS deductions & payment history</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditItem(null); setForm(emptyForm); } }}>
            <DialogTrigger asChild>
              <Button><Plus size={16} className="mr-2" /> Create Payout</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editItem ? 'Edit Payout' : 'Create Partner Payout'}</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Partner</Label>
                  <Select value={form.partner_id} onValueChange={v => setForm({ ...form, partner_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select partner" /></SelectTrigger>
                    <SelectContent>
                      {partners.map(p => <SelectItem key={p.id} value={p.id}>{p.name} ({p.commission_rate}%)</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payout Month</Label>
                  <Input type="month" value={form.payout_month?.substring(0, 7)} onChange={e => setForm({ ...form, payout_month: e.target.value + '-01' })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Gross Amount (₹)</Label>
                    <Input type="number" value={form.gross_amount} onChange={e => setForm({ ...form, gross_amount: e.target.value })} />
                  </div>
                  <div>
                    <Label>TDS Rate (%)</Label>
                    <Input type="number" value={form.tds_rate} onChange={e => setForm({ ...form, tds_rate: e.target.value })} />
                  </div>
                </div>
                {form.gross_amount && (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 text-sm space-y-1">
                      <div className="flex justify-between"><span>Gross:</span><span>{formatCurrency(Number(form.gross_amount))}</span></div>
                      <div className="flex justify-between"><span>TDS ({form.tds_rate}%):</span><span className="text-red-500">-{formatCurrency(Number(form.gross_amount) * Number(form.tds_rate) / 100)}</span></div>
                      <div className="flex justify-between font-bold border-t pt-1"><span>Net Payable:</span><span>{formatCurrency(Number(form.gross_amount) - Number(form.gross_amount) * Number(form.tds_rate) / 100)}</span></div>
                    </CardContent>
                  </Card>
                )}
                <div>
                  <Label>Payment Method</Label>
                  <Select value={form.payment_method} onValueChange={v => setForm({ ...form, payment_method: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Payment Reference</Label>
                  <Input value={form.payment_reference} onChange={e => setForm({ ...form, payment_reference: e.target.value })} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button className="w-full" onClick={handleSave}>{editItem ? 'Update' : 'Create'} Payout</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total Paid</p><p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Pending Payouts</p><p className="text-xl font-bold text-orange-500">{formatCurrency(totalPending)}</p></CardContent></Card>
          <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total TDS Deducted</p><p className="text-xl font-bold text-blue-500">{formatCurrency(totalTDS)}</p></CardContent></Card>
        </div>

        {/* Payouts table */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Payout History</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : payouts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No partner payouts recorded yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Partner</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">TDS</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.partners?.name || '—'}</TableCell>
                      <TableCell>{format(new Date(p.payout_month), 'MMM yyyy')}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.gross_amount)}</TableCell>
                      <TableCell className="text-right text-red-500">{formatCurrency(p.tds_amount)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(p.net_amount)}</TableCell>
                      <TableCell><Badge variant={statusColor(p.status)}>{p.status.toUpperCase()}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>Edit</Button>
                          {p.status === 'pending' && <Button variant="ghost" size="sm" onClick={() => updateStatus(p.id, 'processed')}>Process</Button>}
                          {p.status === 'processed' && <Button variant="ghost" size="sm" onClick={() => updateStatus(p.id, 'paid')}>Mark Paid</Button>}
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

export default AdminFinancePartnerPayments;
