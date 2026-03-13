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
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { RefreshCw, Plus, FileText, Download } from 'lucide-react';

const AdminFinanceGST = () => {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState({ return_period: '', return_type: 'GSTR-3B', input_tax_credit: '0', notes: '' });
  const [complianceInfo, setComplianceInfo] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchReturns();
    fetchComplianceInfo();
  }, []);

  const fetchReturns = async () => {
    const { data } = await supabase.from('finance_gst_returns').select('*').order('return_period', { ascending: false });
    setReturns(data || []);
    setLoading(false);
  };

  const fetchComplianceInfo = async () => {
    const { data } = await supabase.from('finance_compliance_info').select('*').eq('info_group', 'gst');
    const map: Record<string, string> = {};
    (data || []).forEach((d: any) => { map[d.info_key] = d.info_value; });
    setComplianceInfo(map);
  };

  const generateReturn = async (month: Date) => {
    setGenerating(true);
    const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

    const { data: invoices } = await supabase
      .from('invoices')
      .select('subtotal, cgst_amount, sgst_amount, status')
      .gte('created_at', monthStart + 'T00:00:00')
      .lte('created_at', monthEnd + 'T23:59:59')
      .eq('status', 'paid');

    const totalTaxable = (invoices || []).reduce((s, i) => s + Number(i.subtotal || 0), 0);
    const totalCGST = (invoices || []).reduce((s, i) => s + Number(i.cgst_amount || 0), 0);
    const totalSGST = (invoices || []).reduce((s, i) => s + Number(i.sgst_amount || 0), 0);
    const itc = Number(form.input_tax_credit || 0);

    const returnData = {
      return_period: monthStart,
      return_type: form.return_type || 'GSTR-3B',
      total_taxable_value: totalTaxable,
      total_cgst: totalCGST,
      total_sgst: totalSGST,
      total_igst: 0,
      total_cess: 0,
      input_tax_credit: itc,
      net_tax_liability: totalCGST + totalSGST - itc,
      notes: form.notes || null,
      status: 'draft',
    };

    if (editItem) {
      await supabase.from('finance_gst_returns').update(returnData).eq('id', editItem.id);
      toast.success('GST return updated');
    } else {
      await supabase.from('finance_gst_returns').insert(returnData);
      toast.success('GST return generated');
    }

    setDialogOpen(false);
    setEditItem(null);
    setForm({ return_period: '', return_type: 'GSTR-3B', input_tax_credit: '0', notes: '' });
    fetchReturns();
    setGenerating(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('finance_gst_returns').update({ status, filed_at: status === 'filed' ? new Date().toISOString() : null }).eq('id', id);
    toast.success(`Return marked as ${status}`);
    fetchReturns();
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      return_period: item.return_period,
      return_type: item.return_type,
      input_tax_credit: String(item.input_tax_credit),
      notes: item.notes || '',
    });
    setDialogOpen(true);
  };

  const formatCurrency = (v: number) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  const statusColor = (s: string) => s === 'filed' ? 'default' : s === 'verified' ? 'secondary' : 'outline';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">GST & Tax Filing</h1>
            <p className="text-muted-foreground">Auto-calculated GSTR-1/3B summaries from paid invoices</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditItem(null); setForm({ return_period: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'), return_type: 'GSTR-3B', input_tax_credit: '0', notes: '' }); }}>
                <Plus size={16} className="mr-2" /> Generate Return
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editItem ? 'Edit GST Return' : 'Generate GST Return'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Return Period (Month)</Label>
                  <Input type="month" value={form.return_period?.substring(0, 7)} onChange={e => setForm({ ...form, return_period: e.target.value + '-01' })} />
                </div>
                <div>
                  <Label>Return Type</Label>
                  <Select value={form.return_type} onValueChange={v => setForm({ ...form, return_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GSTR-1">GSTR-1 (Outward Supplies)</SelectItem>
                      <SelectItem value="GSTR-3B">GSTR-3B (Summary Return)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Input Tax Credit (ITC) ₹</Label>
                  <Input type="number" value={form.input_tax_credit} onChange={e => setForm({ ...form, input_tax_credit: e.target.value })} />
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                </div>
                <Button className="w-full" disabled={generating || !form.return_period} onClick={() => generateReturn(new Date(form.return_period))}>
                  {generating && <RefreshCw size={16} className="mr-2 animate-spin" />}
                  {editItem ? 'Update Return' : 'Auto-Calculate & Generate'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* GST Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(complianceInfo).map(([key, val]) => (
            <Card key={key} className="p-3">
              <p className="text-xs text-muted-foreground">{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).replace('Gst ', 'GST ')}</p>
              <p className="text-sm font-medium mt-0.5">{val || '—'}</p>
            </Card>
          ))}
        </div>

        {/* Returns table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">GST Returns</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : returns.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No GST returns generated yet. Click "Generate Return" to auto-calculate from invoices.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Taxable Value</TableHead>
                    <TableHead className="text-right">CGST</TableHead>
                    <TableHead className="text-right">SGST</TableHead>
                    <TableHead className="text-right">ITC</TableHead>
                    <TableHead className="text-right">Net Liability</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {returns.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{format(new Date(r.return_period), 'MMM yyyy')}</TableCell>
                      <TableCell>{r.return_type}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.total_taxable_value)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.total_cgst)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.total_sgst)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.input_tax_credit)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(r.net_tax_liability)}</TableCell>
                      <TableCell><Badge variant={statusColor(r.status)}>{r.status.toUpperCase()}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                          {r.status === 'draft' && <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, 'filed')}>Mark Filed</Button>}
                          {r.status === 'filed' && <Button variant="ghost" size="sm" onClick={() => updateStatus(r.id, 'verified')}>Verify</Button>}
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

export default AdminFinanceGST;
