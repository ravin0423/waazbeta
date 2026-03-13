import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { FileText, Loader2, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';

const CustomerInvoices = () => {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
      setInvoices(data || []);
      setLoading(false);
    };
    fetch();

    // Fetch signature
    supabase.storage.from('company-assets').list('', { search: 'signature' }).then(({ data }) => {
      if (data && data.length > 0) {
        const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(data[0].name);
        setSignatureUrl(urlData.publicUrl);
      }
    });
  }, [user]);

  const handleDownload = (inv: any) => {
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
      </style></head><body>
      <div class="header">
        <div><div class="logo">WaaZ<span>Device Protection Services</span></div></div>
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
        <tbody><tr><td>Service / Subscription</td><td style="text-align:right">₹${Number(inv.subtotal || inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr></tbody>
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
        ${signatureUrl ? `<img src="${signatureUrl}" alt="Signature" />` : ''}
        <p style="font-size:13px;font-weight:bold;margin-top:4px">WaaZ</p>
      </div>
      <div class="footer">This is a computer-generated invoice. &copy; WaaZ Device Protection Services</div>
      <script>window.print();</script>
      </body></html>
    `);
    win.document.close();
  };

  const statusColor = (s: string) => s === 'paid' ? 'default' : s === 'overdue' ? 'destructive' : 'secondary';

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">My Invoices</h1>
        <p className="text-muted-foreground mb-6">View your billing and payment history</p>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No invoices yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Subtotal</TableHead>
                    <TableHead>CGST</TableHead>
                    <TableHead>SGST</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                      <TableCell className="text-sm">{format(new Date(inv.created_at), 'dd MMM yyyy')}</TableCell>
                      <TableCell className="text-sm">₹{Number(inv.subtotal || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">₹{Number(inv.cgst_amount || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">₹{Number(inv.sgst_amount || 0).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="font-medium">₹{Number(inv.amount).toLocaleString('en-IN')}</TableCell>
                      <TableCell><Badge variant={statusColor(inv.status) as any}>{inv.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelected(inv)}><Eye size={14} /></Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDownload(inv)}><Download size={14} /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Invoice detail dialog */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-heading">Invoice {selected?.invoice_number}</DialogTitle></DialogHeader>
            {selected && (
              <div className="space-y-3 text-sm mt-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{format(new Date(selected.created_at), 'dd MMM yyyy')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={statusColor(selected.status) as any}>{selected.status}</Badge></div>
                {selected.due_date && <div className="flex justify-between"><span className="text-muted-foreground">Due Date</span><span>{format(new Date(selected.due_date), 'dd MMM yyyy')}</span></div>}
                <hr />
                <div className="flex justify-between"><span>Subtotal</span><span>₹{Number(selected.subtotal || selected.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                {Number(selected.cgst_amount) > 0 && <div className="flex justify-between text-muted-foreground"><span>CGST ({selected.cgst_percent}%)</span><span>₹{Number(selected.cgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                {Number(selected.sgst_amount) > 0 && <div className="flex justify-between text-muted-foreground"><span>SGST ({selected.sgst_percent}%)</span><span>₹{Number(selected.sgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>₹{Number(selected.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                {selected.notes && <p className="text-muted-foreground pt-2"><strong>Notes:</strong> {selected.notes}</p>}
                <Button className="w-full mt-2" onClick={() => handleDownload(selected)}><Download size={14} className="mr-1" /> Download Invoice</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default CustomerInvoices;
