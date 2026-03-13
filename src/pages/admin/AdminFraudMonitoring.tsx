import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { ShieldAlert, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const AdminFraudMonitoring = () => {
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('service_claims')
        .select('*, profiles:user_id(full_name, email)')
        .order('created_at', { ascending: false });
      setClaims(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  // Simple fraud flags
  const getFraudFlags = (claim: any) => {
    const flags: string[] = [];
    if (claim.imei_number && !/^\d{15}$/.test(claim.imei_number)) flags.push('Invalid IMEI format');
    if (claim.imei_number === '000000000000000') flags.push('Blacklisted IMEI');
    // Check for duplicate IMEIs
    const dupes = claims.filter(c => c.imei_number === claim.imei_number && c.id !== claim.id);
    if (dupes.length > 0) flags.push(`Duplicate IMEI (${dupes.length + 1} claims)`);
    return flags;
  };

  const flaggedClaims = claims.map(c => ({ ...c, flags: getFraudFlags(c) }));
  const alertCount = flaggedClaims.filter(c => c.flags.length > 0).length;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <ShieldAlert size={28} className="text-primary" />
          <h1 className="font-heading text-2xl font-bold">Fraud Monitoring</h1>
        </div>
        <p className="text-muted-foreground mb-6">IMEI verification history and fraud detection alerts</p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card className="shadow-card">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Claims</p>
              <p className="text-2xl font-heading font-bold">{claims.length}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Flagged Claims</p>
              <p className="text-2xl font-heading font-bold text-destructive">{alertCount}</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Clean Claims</p>
              <p className="text-2xl font-heading font-bold text-success">{claims.length - alertCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : claims.length === 0 ? (
              <div className="text-center py-12">
                <ShieldAlert size={40} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No claims data yet. Fraud alerts will appear as claims are processed.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>IMEI</TableHead>
                    <TableHead>Issue Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fraud Check</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flaggedClaims.map(claim => (
                    <TableRow key={claim.id} className={claim.flags.length > 0 ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{(claim.profiles as any)?.full_name || '—'}</p>
                          <p className="text-xs text-muted-foreground">{(claim.profiles as any)?.email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{claim.imei_number}</TableCell>
                      <TableCell>{claim.issue_type}</TableCell>
                      <TableCell><Badge variant={claim.status === 'resolved' ? 'default' : 'secondary'}>{claim.status}</Badge></TableCell>
                      <TableCell>
                        {claim.flags.length > 0 ? (
                          <div className="space-y-0.5">
                            {claim.flags.map((f: string, i: number) => (
                              <div key={i} className="flex items-center gap-1 text-xs text-destructive">
                                <AlertTriangle size={12} /> {f}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-success"><CheckCircle2 size={12} /> Clear</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{format(new Date(claim.created_at), 'dd MMM yyyy')}</TableCell>
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

export default AdminFraudMonitoring;
