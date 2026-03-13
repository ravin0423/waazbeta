import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, MapPin, ExternalLink, FileText, Download, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface CustomerRow {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  devices: {
    id: string;
    product_name: string;
    status: string;
    created_at: string;
    google_location_pin: string | null;
    whatsapp_number: string;
    subscription_plans: { name: string } | null;
    referred_by_partner_id: string | null;
  }[];
  claimsCount: number;
  invoices: any[];
  partnerName: string | null;
}

const AdminCustomerDatabase = () => {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [profilesRes, devicesRes, claimsRes, invoicesRes, partnersRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, phone').order('full_name'),
        supabase.from('customer_devices').select('id, user_id, product_name, status, created_at, google_location_pin, whatsapp_number, referred_by_partner_id, subscription_plans(name)'),
        supabase.from('service_claims').select('id, user_id'),
        supabase.from('invoices').select('*').order('created_at', { ascending: false }),
        supabase.from('partners').select('id, name'),
      ]);

      const profiles = profilesRes.data || [];
      const devices = devicesRes.data || [];
      const claims = claimsRes.data || [];
      const invoices = invoicesRes.data || [];
      const partners = partnersRes.data || [];

      const partnerMap = partners.reduce((acc: Record<string, string>, p) => { acc[p.id] = p.name; return acc; }, {});

      const devicesByUser = devices.reduce((acc: Record<string, any[]>, d) => {
        if (!acc[d.user_id]) acc[d.user_id] = [];
        acc[d.user_id].push(d);
        return acc;
      }, {});

      const claimsByUser = claims.reduce((acc: Record<string, number>, c) => {
        acc[c.user_id] = (acc[c.user_id] || 0) + 1;
        return acc;
      }, {});

      const invoicesByUser = invoices.reduce((acc: Record<string, any[]>, inv) => {
        if (inv.user_id) {
          if (!acc[inv.user_id]) acc[inv.user_id] = [];
          acc[inv.user_id].push(inv);
        }
        return acc;
      }, {});

      const rows: CustomerRow[] = profiles
        .filter(p => devicesByUser[p.id]?.length > 0)
        .map(p => {
          const userDevices = devicesByUser[p.id] || [];
          const referrerId = userDevices.find(d => d.referred_by_partner_id)?.referred_by_partner_id;
          return {
            ...p,
            devices: userDevices,
            claimsCount: claimsByUser[p.id] || 0,
            invoices: invoicesByUser[p.id] || [],
            partnerName: referrerId ? partnerMap[referrerId] || null : null,
          };
        });

      setCustomers(rows);
      setLoading(false);
    };
    fetchData();

    supabase.storage.from('company-assets').list('', { search: 'signature' }).then(({ data }) => {
      if (data && data.length > 0) {
        const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(data[0].name);
        setSignatureUrl(urlData.publicUrl);
      }
    });
  }, []);

  const filtered = customers.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    c.partnerName?.toLowerCase().includes(search.toLowerCase())
  );

  const daysSince = (dateStr: string) => Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));

  const statusColor = (s: string) => s === 'paid' ? 'default' : s === 'overdue' ? 'destructive' : 'secondary';

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
        <div><div class="logo">WaaZ<span>Gadget Protection Services</span></div></div>
        <div class="meta">
          <strong>Invoice #</strong> ${inv.invoice_number}<br/>
          <strong>Date:</strong> ${format(new Date(inv.created_at), 'dd MMM yyyy')}<br/>
          <strong>Status:</strong> ${inv.status.toUpperCase()}
        </div>
      </div>
      <p><strong>Bill To:</strong><br/>${inv.customer_name}<br/>${inv.customer_email || ''}</p>
      <table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
      <tbody><tr><td>Service / Subscription</td><td style="text-align:right">₹${Number(inv.subtotal || inv.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td></tr></tbody></table>
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
      <script>window.print();</script></body></html>
    `);
    win.document.close();
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Customer Database</h1>
            <p className="text-muted-foreground">Complete customer information — click a row to expand</p>
          </div>
          <div className="relative w-72">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search customers or partners..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No customers found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone / WhatsApp</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Active Subscriptions</TableHead>
                    <TableHead>Onboarded By</TableHead>
                    <TableHead>Active Since</TableHead>
                    <TableHead>Days Active</TableHead>
                    <TableHead>Claims</TableHead>
                    <TableHead>Invoices</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(c => {
                    const activeDevices = c.devices.filter(d => d.status === 'active');
                    const allDevices = c.devices;
                    const earliest = activeDevices.length > 0
                      ? activeDevices.reduce((min, d) => d.created_at < min ? d.created_at : min, activeDevices[0].created_at)
                      : null;
                    const googleLink = allDevices.find(d => d.google_location_pin)?.google_location_pin;
                    const whatsapp = allDevices[0]?.whatsapp_number || c.phone || '—';

                    return (
                      <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedCustomer(c)}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{c.full_name}</p>
                            <p className="text-xs text-muted-foreground">{c.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{whatsapp}</TableCell>
                        <TableCell>
                          {googleLink ? (
                            <a href={googleLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary text-sm hover:underline" onClick={e => e.stopPropagation()}>
                              <MapPin size={14} /> Map <ExternalLink size={12} />
                            </a>
                          ) : <span className="text-muted-foreground text-sm">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-0.5">
                            {activeDevices.length > 0 ? activeDevices.map(d => (
                              <span key={d.id} className="block text-xs bg-success/10 text-success px-2 py-0.5 rounded-full w-fit">
                                {d.subscription_plans?.name || d.product_name}
                              </span>
                            )) : (
                              <span className="text-xs text-muted-foreground">None active</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.partnerName ? (
                            <Badge variant="outline" className="text-xs">{c.partnerName}</Badge>
                          ) : <span className="text-muted-foreground text-xs">Direct</span>}
                        </TableCell>
                        <TableCell className="text-sm">
                          {earliest ? new Date(earliest).toLocaleDateString('en-IN') : '—'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {earliest ? `${daysSince(earliest)} days` : '—'}
                        </TableCell>
                        <TableCell className="text-sm font-medium">{c.claimsCount}</TableCell>
                        <TableCell className="text-sm font-medium">{c.invoices.length}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Customer detail dialog */}
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">{selectedCustomer?.full_name}</DialogTitle>
            </DialogHeader>
            {selectedCustomer && (
              <div className="space-y-6 mt-2">
                {/* Contact info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Email:</span> {selectedCustomer.email}</div>
                  <div><span className="text-muted-foreground">Phone:</span> {selectedCustomer.phone || '—'}</div>
                  <div><span className="text-muted-foreground">Onboarded By:</span> {selectedCustomer.partnerName || 'Direct'}</div>
                  <div><span className="text-muted-foreground">Claims:</span> {selectedCustomer.claimsCount}</div>
                </div>

                {/* Devices */}
                <div>
                  <h3 className="font-heading font-semibold mb-2">Devices & Subscriptions</h3>
                  <div className="space-y-2">
                    {selectedCustomer.devices.map(d => (
                      <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                        <div>
                          <p className="font-medium text-sm">{d.product_name}</p>
                          <p className="text-xs text-muted-foreground">{d.subscription_plans?.name || 'No plan'}</p>
                        </div>
                        <Badge variant={d.status === 'active' ? 'default' : 'secondary'}>{d.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invoices */}
                <div>
                  <h3 className="font-heading font-semibold mb-2">Invoices ({selectedCustomer.invoices.length})</h3>
                  {selectedCustomer.invoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No invoices linked to this customer</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedCustomer.invoices.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                          <div>
                            <p className="font-mono text-sm font-medium">{inv.invoice_number}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(inv.created_at), 'dd MMM yyyy')}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm">₹{Number(inv.amount).toLocaleString('en-IN')}</span>
                            <Badge variant={statusColor(inv.status) as any}>{inv.status}</Badge>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedInvoice(inv)}><Eye size={14} /></Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDownloadInvoice(inv)}><Download size={14} /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Invoice detail dialog */}
        <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="font-heading">Invoice {selectedInvoice?.invoice_number}</DialogTitle></DialogHeader>
            {selectedInvoice && (
              <div className="space-y-3 text-sm mt-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{format(new Date(selectedInvoice.created_at), 'dd MMM yyyy')}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant={statusColor(selectedInvoice.status) as any}>{selectedInvoice.status}</Badge></div>
                <hr />
                <div className="flex justify-between"><span>Subtotal</span><span>₹{Number(selectedInvoice.subtotal || selectedInvoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                {Number(selectedInvoice.cgst_amount) > 0 && <div className="flex justify-between text-muted-foreground"><span>CGST ({selectedInvoice.cgst_percent}%)</span><span>₹{Number(selectedInvoice.cgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                {Number(selectedInvoice.sgst_amount) > 0 && <div className="flex justify-between text-muted-foreground"><span>SGST ({selectedInvoice.sgst_percent}%)</span><span>₹{Number(selectedInvoice.sgst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>}
                <div className="flex justify-between font-bold border-t pt-2"><span>Total</span><span>₹{Number(selectedInvoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></div>
                {selectedInvoice.notes && <p className="text-muted-foreground pt-2"><strong>Notes:</strong> {selectedInvoice.notes}</p>}
                <Button className="w-full mt-2" onClick={() => handleDownloadInvoice(selectedInvoice)}><Download size={14} className="mr-1" /> Download</Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminCustomerDatabase;
