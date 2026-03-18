import { useEffect, useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { IndianRupee, TrendingUp, TrendingDown, Receipt, Users, FileText, ArrowRight, Download, BarChart3, PieChart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface MonthlyData {
  month: string;
  label: string;
  income: number;
  expenses: number;
  net: number;
  gstCollected: number;
  commissionsPaid: number;
}

const AdminFinanceOverview = () => {
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [invoiceStats, setInvoiceStats] = useState({ paid: 0, unpaid: 0, totalGST: 0 });
  const [pendingPayouts, setPendingPayouts] = useState(0);
  const [topPartners, setTopPartners] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [gstReturns, setGstReturns] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    const now = new Date();
    const twelveMonthsAgo = format(subMonths(startOfMonth(now), 11), 'yyyy-MM-dd');

    const [txRes, invoiceRes, payoutRes, recentRes, commissionRes, gstRes] = await Promise.all([
      supabase.from('finance_transactions').select('amount, type, transaction_date, tax_amount').gte('transaction_date', twelveMonthsAgo),
      supabase.from('invoices').select('status, cgst_amount, sgst_amount, amount, created_at'),
      supabase.from('finance_partner_payouts').select('net_amount, gross_amount, tds_amount, status, partner_id, payout_month, partners(name)'),
      supabase.from('finance_transactions').select('*, finance_categories(name)').order('transaction_date', { ascending: false }).limit(10),
      supabase.from('partner_commissions').select('partner_id, total_commission, commission_month, partners(name)'),
      supabase.from('finance_gst_returns').select('*').order('return_period', { ascending: false }).limit(6),
    ]);

    // Build 12-month trend
    const monthMap: Record<string, MonthlyData> = {};
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(now, i);
      const key = format(d, 'yyyy-MM');
      monthMap[key] = { month: key, label: format(d, 'MMM yy'), income: 0, expenses: 0, net: 0, gstCollected: 0, commissionsPaid: 0 };
    }

    (txRes.data || []).forEach(t => {
      const key = t.transaction_date?.slice(0, 7);
      if (monthMap[key]) {
        if (t.type === 'income') monthMap[key].income += Number(t.amount);
        else monthMap[key].expenses += Number(t.amount);
        monthMap[key].gstCollected += Number(t.tax_amount || 0);
      }
    });

    // Add commission payouts to monthly data
    (payoutRes.data || []).forEach((p: any) => {
      const key = typeof p.payout_month === 'string' ? p.payout_month.slice(0, 7) : '';
      if (monthMap[key]) {
        monthMap[key].commissionsPaid += Number(p.gross_amount);
      }
    });

    Object.values(monthMap).forEach(m => { m.net = m.income - m.expenses; });
    setMonthlyData(Object.values(monthMap));

    // Invoice stats
    const invoices = invoiceRes.data || [];
    const totalGST = invoices.reduce((s, i) => s + Number(i.cgst_amount || 0) + Number(i.sgst_amount || 0), 0);
    setInvoiceStats({
      paid: invoices.filter(i => i.status === 'paid').length,
      unpaid: invoices.filter(i => i.status !== 'paid').length,
      totalGST,
    });

    // Pending payouts
    const pending = (payoutRes.data || []).filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + Number(p.net_amount), 0);
    setPendingPayouts(pending);

    // Top partners by commission
    const partnerTotals: Record<string, { name: string; total: number; tds: number }> = {};
    (commissionRes.data || []).forEach((c: any) => {
      if (!partnerTotals[c.partner_id]) {
        partnerTotals[c.partner_id] = { name: c.partners?.name || 'Unknown', total: 0, tds: 0 };
      }
      partnerTotals[c.partner_id].total += Number(c.total_commission);
    });
    (payoutRes.data || []).forEach((p: any) => {
      if (partnerTotals[p.partner_id]) {
        partnerTotals[p.partner_id].tds += Number(p.tds_amount);
      }
    });
    const sorted = Object.entries(partnerTotals)
      .map(([id, d]) => ({ id, ...d }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    setTopPartners(sorted);

    setRecentTransactions(recentRes.data || []);
    setGstReturns(gstRes.data || []);
    setLoading(false);
  };

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // YTD totals
  const ytd = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const ytdMonths = monthlyData.filter(m => m.month.startsWith(String(currentYear)));
    return {
      income: ytdMonths.reduce((s, m) => s + m.income, 0),
      expenses: ytdMonths.reduce((s, m) => s + m.expenses, 0),
      gst: ytdMonths.reduce((s, m) => s + m.gstCollected, 0),
      commissions: ytdMonths.reduce((s, m) => s + m.commissionsPaid, 0),
    };
  }, [monthlyData]);

  const profitMargin = ytd.income > 0 ? ((ytd.income - ytd.expenses) / ytd.income * 100) : 0;

  const exportFinancialReport = () => {
    const headers = ['Month', 'Income', 'Expenses', 'Net Profit', 'GST Collected', 'Commissions Paid'];
    const rows = monthlyData.map(m => [m.label, m.income.toFixed(2), m.expenses.toFixed(2), m.net.toFixed(2), m.gstCollected.toFixed(2), m.commissionsPaid.toFixed(2)]);
    rows.push(['--- YTD TOTALS ---', ytd.income.toFixed(2), ytd.expenses.toFixed(2), (ytd.income - ytd.expenses).toFixed(2), ytd.gst.toFixed(2), ytd.commissions.toFixed(2)]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `financial-report-${format(new Date(), 'yyyy-MM')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportCommissionReport = () => {
    const headers = ['Partner', 'Total Commission', 'TDS Deducted'];
    const rows = topPartners.map(p => [p.name, p.total.toFixed(2), p.tds.toFixed(2)]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `commission-report-${format(new Date(), 'yyyy-MM')}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const quickLinks = [
    { label: 'GST & Tax Filing', path: '/admin/finance-gst', desc: 'GSTR-1/3B summaries, HSN codes, tax credits' },
    { label: 'Income & Expenses', path: '/admin/finance-transactions', desc: 'Track revenue and expenditures' },
    { label: 'Partner Payments', path: '/admin/finance-partner-payments', desc: 'Commission payouts & TDS' },
    { label: 'Compliance & MSME', path: '/admin/finance-compliance', desc: 'Registration, Udyam, banking details' },
    { label: 'Invoices', path: '/admin/invoices', desc: 'Create and manage customer invoices' },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <h1 className="font-heading text-2xl font-bold">Finance Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse h-28" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">Finance Dashboard</h1>
            <p className="text-muted-foreground">Complete financial overview — revenue, expenses, commissions, GST & compliance</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportFinancialReport}>
              <Download size={14} className="mr-1" /> Financial Report
            </Button>
            <Button variant="outline" size="sm" onClick={exportCommissionReport}>
              <Download size={14} className="mr-1" /> Commission Report
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue YTD</p>
                  <p className="text-2xl font-bold font-heading mt-1">{formatCurrency(ytd.income)}</p>
                </div>
                <TrendingUp size={28} className="text-emerald-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Expenses YTD</p>
                  <p className="text-2xl font-bold font-heading mt-1">{formatCurrency(ytd.expenses)}</p>
                </div>
                <TrendingDown size={28} className="text-destructive" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profit Margin</p>
                  <p className="text-2xl font-bold font-heading mt-1">{profitMargin.toFixed(1)}%</p>
                </div>
                <PieChart size={28} className="text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Profit YTD</p>
                  <p className={`text-2xl font-bold font-heading mt-1 ${ytd.income - ytd.expenses >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
                    {formatCurrency(ytd.income - ytd.expenses)}
                  </p>
                </div>
                <IndianRupee size={28} className="text-amber-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary KPI row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">GST Collected YTD</p>
              <p className="text-xl font-bold font-heading mt-1">{formatCurrency(ytd.gst)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Commissions Paid YTD</p>
              <p className="text-xl font-bold font-heading mt-1">{formatCurrency(ytd.commissions)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Pending Payouts</p>
              <p className="text-xl font-bold font-heading mt-1 text-amber-600">{formatCurrency(pendingPayouts)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">Invoices</p>
              <div className="flex gap-2 mt-1">
                <Badge variant="default">{invoiceStats.paid} paid</Badge>
                <Badge variant="secondary">{invoiceStats.unpaid} unpaid</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for charts and details */}
        <Tabs defaultValue="trends">
          <TabsList>
            <TabsTrigger value="trends">12-Month Trends</TabsTrigger>
            <TabsTrigger value="commissions">Commission Breakdown</TabsTrigger>
            <TabsTrigger value="tax">Tax & GST</TabsTrigger>
            <TabsTrigger value="modules">Finance Modules</TabsTrigger>
          </TabsList>

          {/* 12-Month Revenue Trend */}
          <TabsContent value="trends">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><BarChart3 size={18} /> Revenue vs Expenses (12 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" className="text-xs" />
                    <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend />
                    <Line type="monotone" dataKey="income" stroke="hsl(var(--primary))" name="Income" strokeWidth={2} />
                    <Line type="monotone" dataKey="expenses" stroke="hsl(var(--destructive))" name="Expenses" strokeWidth={2} />
                    <Line type="monotone" dataKey="net" stroke="hsl(142 76% 36%)" name="Net Profit" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Commission Breakdown */}
          <TabsContent value="commissions">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top 10 Partners by Commission</CardTitle>
                </CardHeader>
                <CardContent>
                  {topPartners.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No commission data yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={topPartners} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" width={100} className="text-xs" />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="total" fill="hsl(var(--primary))" name="Commission" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Partner Commission Details</CardTitle>
                </CardHeader>
                <CardContent>
                  {topPartners.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No data</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Partner</TableHead>
                          <TableHead className="text-right">Commission</TableHead>
                          <TableHead className="text-right">TDS</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topPartners.map((p, i) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-bold">{i + 1}</TableCell>
                            <TableCell>{p.name}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(p.total)}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{formatCurrency(p.tds)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tax & GST */}
          <TabsContent value="tax">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tax Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground">GST Collected YTD</p>
                      <p className="text-2xl font-bold mt-1">{formatCurrency(ytd.gst)}</p>
                    </div>
                    <div className="p-4 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground">TDS Deducted YTD</p>
                      <p className="text-2xl font-bold mt-1">{formatCurrency(topPartners.reduce((s, p) => s + p.tds, 0))}</p>
                    </div>
                    <div className="p-4 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground">Invoice GST (All Time)</p>
                      <p className="text-2xl font-bold mt-1">{formatCurrency(invoiceStats.totalGST)}</p>
                    </div>
                    <div className="p-4 rounded-lg border border-border">
                      <p className="text-sm text-muted-foreground">Filing Status</p>
                      <Badge className="mt-2" variant="default">On Track</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent GST Returns</CardTitle>
                </CardHeader>
                <CardContent>
                  {gstReturns.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">No GST returns filed yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Liability</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {gstReturns.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell>{format(new Date(r.return_period), 'MMM yyyy')}</TableCell>
                            <TableCell>{r.return_type}</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(Number(r.net_tax_liability))}</TableCell>
                            <TableCell>
                              <Badge variant={r.status === 'filed' ? 'default' : 'secondary'}>{r.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Monthly GST trend */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">GST Collection Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="label" className="text-xs" />
                    <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} className="text-xs" />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="gstCollected" fill="hsl(var(--primary))" name="GST Collected" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finance Modules */}
          <TabsContent value="modules">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Finance Modules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {quickLinks.map(link => (
                    <Link
                      key={link.path}
                      to={link.path}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-sm">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.desc}</p>
                      </div>
                      <ArrowRight size={16} className="text-muted-foreground" />
                    </Link>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                  {recentTransactions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No transactions recorded yet</p>
                  ) : (
                    <div className="space-y-2">
                      {recentTransactions.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <p className="text-sm font-medium">{t.description}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(t.transaction_date), 'dd MMM yyyy')}
                              {t.finance_categories?.name && ` · ${t.finance_categories.name}`}
                            </p>
                          </div>
                          <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-destructive'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminFinanceOverview;
