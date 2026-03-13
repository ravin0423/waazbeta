import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { IndianRupee, TrendingUp, TrendingDown, Receipt, Users, FileText, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';

const AdminFinanceOverview = () => {
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalGSTCollected: 0,
    pendingPayouts: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const now = new Date();
    const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

    const [incomeRes, expenseRes, invoiceRes, payoutRes, recentRes] = await Promise.all([
      supabase.from('finance_transactions').select('amount').eq('type', 'income').gte('transaction_date', monthStart).lte('transaction_date', monthEnd),
      supabase.from('finance_transactions').select('amount').eq('type', 'expense').gte('transaction_date', monthStart).lte('transaction_date', monthEnd),
      supabase.from('invoices').select('status, cgst_amount, sgst_amount'),
      supabase.from('finance_partner_payouts').select('net_amount').eq('status', 'pending'),
      supabase.from('finance_transactions').select('*').order('transaction_date', { ascending: false }).limit(10),
    ]);

    const totalIncome = (incomeRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
    const totalExpenses = (expenseRes.data || []).reduce((s, r) => s + Number(r.amount), 0);
    const invoices = invoiceRes.data || [];
    const totalGST = invoices.reduce((s, i) => s + Number(i.cgst_amount || 0) + Number(i.sgst_amount || 0), 0);
    const paidCount = invoices.filter(i => i.status === 'paid').length;
    const unpaidCount = invoices.filter(i => i.status !== 'paid').length;
    const pendingPayouts = (payoutRes.data || []).reduce((s, r) => s + Number(r.net_amount), 0);

    setStats({ totalIncome, totalExpenses, totalGSTCollected: totalGST, pendingPayouts, paidInvoices: paidCount, unpaidInvoices: unpaidCount });
    setRecentTransactions(recentRes.data || []);
    setLoading(false);
  };

  const formatCurrency = (v: number) => `₹${v.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

  const statCards = [
    { title: 'Total Income (This Month)', value: formatCurrency(stats.totalIncome), icon: TrendingUp, color: 'text-emerald-500' },
    { title: 'Total Expenses (This Month)', value: formatCurrency(stats.totalExpenses), icon: TrendingDown, color: 'text-red-500' },
    { title: 'GST Collected (All Time)', value: formatCurrency(stats.totalGSTCollected), icon: IndianRupee, color: 'text-amber-500' },
    { title: 'Pending Partner Payouts', value: formatCurrency(stats.pendingPayouts), icon: Users, color: 'text-blue-500' },
    { title: 'Paid Invoices', value: stats.paidInvoices.toString(), icon: Receipt, color: 'text-emerald-500' },
    { title: 'Unpaid Invoices', value: stats.unpaidInvoices.toString(), icon: FileText, color: 'text-orange-500' },
  ];

  const quickLinks = [
    { label: 'GST & Tax Filing', path: '/admin/finance-gst', desc: 'GSTR-1/3B summaries, HSN codes, tax credits' },
    { label: 'Income & Expenses', path: '/admin/finance-transactions', desc: 'Track revenue and expenditures' },
    { label: 'Partner Payments', path: '/admin/finance-partner-payments', desc: 'Commission payouts & TDS' },
    { label: 'Compliance & MSME', path: '/admin/finance-compliance', desc: 'Registration, Udyam, banking details' },
    { label: 'Invoices', path: '/admin/invoices', desc: 'Create and manage customer invoices' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Finance Dashboard</h1>
          <p className="text-muted-foreground">Complete financial overview — GST, income, expenses, partner payments & compliance</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <Card key={i} className="animate-pulse h-28" />)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {statCards.map(s => (
                <Card key={s.title}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{s.title}</p>
                        <p className="text-2xl font-bold font-heading mt-1">{s.value}</p>
                      </div>
                      <s.icon size={32} className={s.color} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Quick Links */}
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

              {/* Recent Transactions */}
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
                            <p className="text-xs text-muted-foreground">{format(new Date(t.transaction_date), 'dd MMM yyyy')}</p>
                          </div>
                          <span className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-500'}`}>
                            {t.type === 'income' ? '+' : '-'}{formatCurrency(Number(t.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminFinanceOverview;
