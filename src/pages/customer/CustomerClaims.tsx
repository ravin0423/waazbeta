import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import ClaimSubmissionForm from '@/components/ClaimSubmissionForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Clock, CheckCircle, XCircle, Wrench, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  pending: { label: 'Pending', variant: 'secondary', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'default', icon: Wrench },
  resolved: { label: 'Resolved', variant: 'outline', icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
};

const CustomerClaims = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClaims = async () => {
    const { data } = await supabase
      .from('service_claims')
      .select('*')
      .order('created_at', { ascending: false });
    setClaims(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchClaims(); }, []);

  const handleSubmitted = () => {
    setShowForm(false);
    fetchClaims();
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-heading text-2xl font-bold">My Claims</h1>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">
              <Plus size={16} className="mr-1" /> New Claim
            </Button>
          )}
        </div>
        <p className="text-muted-foreground mb-6">Track your service claims and repair status</p>

        <AnimatePresence>
          {showForm && (
            <div className="mb-6">
              <ClaimSubmissionForm onClose={() => setShowForm(false)} onSubmit={handleSubmitted} />
            </div>
          )}
        </AnimatePresence>

        {loading ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center text-muted-foreground">Loading...</CardContent></Card>
        ) : claims.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <FileText size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No claims yet. Click "New Claim" to submit one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {claims.map(claim => {
              const sc = statusConfig[claim.status] || statusConfig.pending;
              const Icon = sc.icon;
              return (
                <Card key={claim.id} className="shadow-card cursor-pointer hover:border-primary/30 transition-colors" onClick={() => navigate(`/customer/claims/${claim.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{claim.issue_type}</span>
                          <Badge variant={sc.variant} className="text-xs">
                            <Icon size={12} className="mr-1" /> {sc.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{claim.description}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>IMEI: <span className="font-mono">{claim.imei_number}</span></span>
                          <span>{format(new Date(claim.created_at), 'dd MMM yyyy')}</span>
                        </div>
                      </div>
                      <ChevronRight size={18} className="text-muted-foreground flex-shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default CustomerClaims;
