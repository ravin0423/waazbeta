import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import StatsCard from '@/components/StatsCard';
import { motion } from 'framer-motion';
import {
  ShieldAlert, ShieldCheck, ShieldX, Search, AlertTriangle, CheckCircle2,
  XCircle, Eye, Clock, Smartphone, Ban, Activity
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import type { KPIMetric } from '@/types';

type RiskLevel = 'clear' | 'warning' | 'critical';
type VerificationAction = 'approved' | 'flagged' | 'blocked' | 'pending_review';

interface FraudAlert {
  id: string;
  claimId: string;
  customerId: string;
  customerName: string;
  imei: string;
  device: string;
  riskLevel: RiskLevel;
  flags: string[];
  timestamp: string;
  action: VerificationAction;
  reviewedBy?: string;
}

interface IMEIVerificationLog {
  id: string;
  imei: string;
  customerName: string;
  device: string;
  result: 'pass' | 'warning' | 'fail';
  checks: { name: string; passed: boolean }[];
  timestamp: string;
}

// Mock fraud alerts data
const fraudAlerts: FraudAlert[] = [
  {
    id: 'fa1', claimId: 'cl3', customerId: 'c4', customerName: 'Arun Patel',
    imei: '351234567890123', device: 'Samsung Galaxy S24',
    riskLevel: 'critical', flags: ['IMEI reported stolen in CEIR database', 'Multiple claims from different accounts with same IMEI'],
    timestamp: '2026-03-12 09:15', action: 'blocked', reviewedBy: 'Priya Sharma'
  },
  {
    id: 'fa2', claimId: 'cl4', customerId: 'c5', customerName: 'Meena Reddy',
    imei: '354678091234567', device: 'Samsung Galaxy S23',
    riskLevel: 'warning', flags: ['Duplicate claim filed within 30 days', 'Claim amount exceeds device market value by 40%'],
    timestamp: '2026-03-11 14:30', action: 'pending_review'
  },
  {
    id: 'fa3', claimId: 'cl5', customerId: 'c6', customerName: 'Ravi Shankar',
    imei: '123456789012345', device: 'iPhone 15 Pro',
    riskLevel: 'critical', flags: ['IMEI contains suspicious sequential pattern', 'Luhn checksum validation failed', 'Device not registered in system'],
    timestamp: '2026-03-11 11:45', action: 'blocked', reviewedBy: 'Priya Sharma'
  },
  {
    id: 'fa4', claimId: 'cl6', customerId: 'c7', customerName: 'Sunita Gupta',
    imei: '358765432109876', device: 'OnePlus 12',
    riskLevel: 'warning', flags: ['Subscription expired 5 days ago'],
    timestamp: '2026-03-10 16:20', action: 'flagged', reviewedBy: 'Priya Sharma'
  },
  {
    id: 'fa5', claimId: 'cl7', customerId: 'c8', customerName: 'Deepak Joshi',
    imei: '357913579135791', device: 'Xiaomi 14',
    riskLevel: 'clear', flags: [],
    timestamp: '2026-03-10 10:05', action: 'approved', reviewedBy: 'Priya Sharma'
  },
  {
    id: 'fa6', claimId: 'cl8', customerId: 'c9', customerName: 'Kavitha Nair',
    imei: '000000000000000', device: 'Unknown',
    riskLevel: 'critical', flags: ['IMEI is blacklisted', 'Known fraudulent IMEI pattern'],
    timestamp: '2026-03-09 08:55', action: 'blocked', reviewedBy: 'Priya Sharma'
  },
];

const verificationLogs: IMEIVerificationLog[] = [
  {
    id: 'vl1', imei: '354678091234567', customerName: 'Rajesh Kumar', device: 'Samsung Galaxy S23', result: 'pass',
    checks: [
      { name: 'Format validation (15 digits)', passed: true },
      { name: 'Luhn checksum', passed: true },
      { name: 'Blacklist check', passed: true },
      { name: 'Device registration', passed: true },
      { name: 'Subscription status', passed: true },
      { name: 'Duplicate claim check', passed: true },
    ],
    timestamp: '2026-03-12 10:30'
  },
  {
    id: 'vl2', imei: '354678091234999', customerName: 'Rajesh Kumar', device: 'Apple iPhone 15', result: 'warning',
    checks: [
      { name: 'Format validation (15 digits)', passed: true },
      { name: 'Luhn checksum', passed: true },
      { name: 'Blacklist check', passed: true },
      { name: 'Device registration', passed: true },
      { name: 'Subscription status', passed: true },
      { name: 'Duplicate claim check', passed: false },
    ],
    timestamp: '2026-03-11 15:20'
  },
  {
    id: 'vl3', imei: '123456789012345', customerName: 'Ravi Shankar', device: 'N/A', result: 'fail',
    checks: [
      { name: 'Format validation (15 digits)', passed: true },
      { name: 'Luhn checksum', passed: false },
      { name: 'Blacklist check', passed: true },
      { name: 'Device registration', passed: false },
      { name: 'Subscription status', passed: false },
      { name: 'Duplicate claim check', passed: false },
    ],
    timestamp: '2026-03-11 11:45'
  },
  {
    id: 'vl4', imei: '000000000000000', customerName: 'Kavitha Nair', device: 'N/A', result: 'fail',
    checks: [
      { name: 'Format validation (15 digits)', passed: true },
      { name: 'Luhn checksum', passed: false },
      { name: 'Blacklist check', passed: false },
      { name: 'Device registration', passed: false },
      { name: 'Subscription status', passed: false },
      { name: 'Duplicate claim check', passed: false },
    ],
    timestamp: '2026-03-09 08:55'
  },
  {
    id: 'vl5', imei: '351234567890123', customerName: 'Arun Patel', device: 'Samsung Galaxy S24', result: 'fail',
    checks: [
      { name: 'Format validation (15 digits)', passed: true },
      { name: 'Luhn checksum', passed: true },
      { name: 'Blacklist check', passed: false },
      { name: 'Device registration', passed: false },
      { name: 'Subscription status', passed: false },
      { name: 'Duplicate claim check', passed: false },
    ],
    timestamp: '2026-03-12 09:15'
  },
];

// Chart data
const riskDistribution = [
  { name: 'Clear', value: 12, color: 'hsl(142, 71%, 45%)' },
  { name: 'Warning', value: 5, color: 'hsl(38, 92%, 50%)' },
  { name: 'Critical', value: 3, color: 'hsl(0, 84%, 60%)' },
];

const weeklyFraudTrend = [
  { day: 'Mon', checks: 8, flagged: 1 },
  { day: 'Tue', checks: 12, flagged: 2 },
  { day: 'Wed', checks: 6, flagged: 0 },
  { day: 'Thu', checks: 15, flagged: 3 },
  { day: 'Fri', checks: 10, flagged: 1 },
  { day: 'Sat', checks: 4, flagged: 0 },
  { day: 'Sun', checks: 2, flagged: 0 },
];

const riskConfig: Record<RiskLevel, { icon: typeof ShieldCheck; color: string; bg: string }> = {
  clear: { icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10' },
  warning: { icon: ShieldAlert, color: 'text-warning', bg: 'bg-warning/10' },
  critical: { icon: ShieldX, color: 'text-destructive', bg: 'bg-destructive/10' },
};

const actionConfig: Record<VerificationAction, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  approved: { label: 'Approved', variant: 'default' },
  flagged: { label: 'Flagged', variant: 'secondary' },
  blocked: { label: 'Blocked', variant: 'destructive' },
  pending_review: { label: 'Pending Review', variant: 'outline' },
};

const AdminFraudMonitoring = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);

  const filteredAlerts = fraudAlerts.filter(a => {
    const matchSearch = !searchQuery || a.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || a.imei.includes(searchQuery) || a.claimId.includes(searchQuery);
    const matchRisk = riskFilter === 'all' || a.riskLevel === riskFilter;
    return matchSearch && matchRisk;
  });

  const metrics: KPIMetric[] = [
    { label: 'Total Verifications', value: 20, trend: 'up', change: 12 },
    { label: 'Fraud Blocked', value: 3, trend: 'down', change: -25 },
    { label: 'Pending Review', value: 1, trend: 'stable', change: 0 },
    { label: 'Detection Rate', value: '15%', trend: 'up', change: 3 },
  ];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <ShieldAlert size={28} className="text-primary" />
          <h1 className="font-heading text-2xl font-bold">Fraud Monitoring</h1>
        </div>
        <p className="text-muted-foreground mb-6">IMEI verification history and fraud detection alerts</p>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {metrics.map((m, i) => <StatsCard key={i} metric={m} />)}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Risk Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={riskDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={4}>
                    {riskDistribution.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-2">
                {riskDistribution.map(r => (
                  <div key={r.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-muted-foreground">{r.name}: {r.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Weekly Verification Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={weeklyFraudTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="checks" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Total Checks" />
                  <Bar dataKey="flagged" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} name="Flagged" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="alerts" className="space-y-4">
          <TabsList>
            <TabsTrigger value="alerts">Fraud Alerts</TabsTrigger>
            <TabsTrigger value="verification-log">IMEI Verification Log</TabsTrigger>
          </TabsList>

          {/* Fraud Alerts Tab */}
          <TabsContent value="alerts">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, IMEI, or claim ID..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter risk" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="clear">Clear</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Risk</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead className="hidden md:table-cell">IMEI</TableHead>
                        <TableHead className="hidden md:table-cell">Device</TableHead>
                        <TableHead>Flags</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead className="hidden lg:table-cell">Time</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts.map(alert => {
                        const risk = riskConfig[alert.riskLevel];
                        const RiskIcon = risk.icon;
                        const action = actionConfig[alert.action];
                        return (
                          <TableRow key={alert.id} className={alert.action === 'pending_review' ? 'bg-warning/5' : ''}>
                            <TableCell>
                              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md ${risk.bg}`}>
                                <RiskIcon size={14} className={risk.color} />
                                <span className={`text-xs font-medium capitalize ${risk.color}`}>{alert.riskLevel}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium text-sm">{alert.customerName}</TableCell>
                            <TableCell className="hidden md:table-cell font-mono text-xs text-muted-foreground">{alert.imei}</TableCell>
                            <TableCell className="hidden md:table-cell text-sm">{alert.device}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {alert.flags.length > 0 ? (
                                  <Badge variant="secondary" className="text-xs">
                                    <AlertTriangle size={10} className="mr-1" />
                                    {alert.flags.length} flag{alert.flags.length > 1 ? 's' : ''}
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-success flex items-center gap-1">
                                    <CheckCircle2 size={12} /> None
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={action.variant} className="text-xs">{action.label}</Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{alert.timestamp}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(alert)}>
                                <Eye size={14} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Detail drawer */}
            {selectedAlert && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <Card className="shadow-card border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-heading text-base">Alert Details — {selectedAlert.claimId.toUpperCase()}</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedAlert(null)}>
                        <XCircle size={16} />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Customer</p>
                        <p className="font-medium">{selectedAlert.customerName}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">IMEI</p>
                        <p className="font-mono text-xs">{selectedAlert.imei}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Device</p>
                        <p>{selectedAlert.device}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Reviewed By</p>
                        <p>{selectedAlert.reviewedBy || '—'}</p>
                      </div>
                    </div>

                    {selectedAlert.flags.length > 0 && (
                      <Alert className="bg-destructive/5 border-destructive/20">
                        <AlertTriangle size={16} className="text-destructive" />
                        <AlertTitle className="text-destructive font-semibold text-sm">Fraud Flags ({selectedAlert.flags.length})</AlertTitle>
                        <AlertDescription>
                          <ul className="mt-2 space-y-1.5">
                            {selectedAlert.flags.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs">
                                <XCircle size={12} className="text-destructive shrink-0 mt-0.5" />
                                <span>{f}</span>
                              </li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {selectedAlert.action === 'pending_review' && (
                      <div className="flex gap-3 pt-2">
                        <Button variant="default" size="sm" className="flex-1" onClick={() => setSelectedAlert(null)}>
                          <CheckCircle2 size={14} className="mr-1" /> Approve Claim
                        </Button>
                        <Button variant="destructive" size="sm" className="flex-1" onClick={() => setSelectedAlert(null)}>
                          <Ban size={14} className="mr-1" /> Block Claim
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* IMEI Verification Log Tab */}
          <TabsContent value="verification-log">
            <Card className="shadow-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>IMEI</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Device</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Checks</TableHead>
                        <TableHead className="hidden md:table-cell">Timestamp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {verificationLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono text-xs">{log.imei}</TableCell>
                          <TableCell className="font-medium text-sm">{log.customerName}</TableCell>
                          <TableCell className="text-sm">{log.device}</TableCell>
                          <TableCell>
                            {log.result === 'pass' && (
                              <Badge variant="default" className="text-xs bg-success/10 text-success border-success/30 hover:bg-success/20">
                                <CheckCircle2 size={10} className="mr-1" /> Pass
                              </Badge>
                            )}
                            {log.result === 'warning' && (
                              <Badge variant="secondary" className="text-xs bg-warning/10 text-warning border-warning/30 hover:bg-warning/20">
                                <AlertTriangle size={10} className="mr-1" /> Warning
                              </Badge>
                            )}
                            {log.result === 'fail' && (
                              <Badge variant="destructive" className="text-xs">
                                <XCircle size={10} className="mr-1" /> Fail
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-0.5">
                              {log.checks.map((c, i) => (
                                <div
                                  key={i}
                                  title={`${c.name}: ${c.passed ? 'Passed' : 'Failed'}`}
                                  className={`h-3 w-3 rounded-sm ${c.passed ? 'bg-success/60' : 'bg-destructive/60'}`}
                                />
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{log.timestamp}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground px-1">
              <span className="font-medium">Verification checks:</span>
              {['Format', 'Luhn', 'Blacklist', 'Registration', 'Subscription', 'Duplicate'].map((c, i) => (
                <span key={i} className="flex items-center gap-1">
                  <div className="h-2.5 w-2.5 rounded-sm bg-muted-foreground/30" />
                  {c}
                </span>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
};

export default AdminFraudMonitoring;
