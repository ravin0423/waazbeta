import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import ClaimSubmissionForm from '@/components/ClaimSubmissionForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { claims, customerDevices } from '@/data/mockData';
import { FileText, Clock, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerClaims = () => {
  const [showForm, setShowForm] = useState(false);
  const userClaims = claims.filter(c => c.customerId === 'c1');
  const totalClaims = userClaims.length;
  const resolvedClaims = userClaims.filter(c => c.status === 'completed').length;

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
              <ClaimSubmissionForm onClose={() => setShowForm(false)} onSubmit={() => setShowForm(false)} />
            </div>
          )}
        </AnimatePresence>

        <div className="flex gap-4 mb-6">
          <div className="px-4 py-2 rounded-lg bg-primary/10 text-sm font-medium">
            Total: <span className="text-primary font-bold">{totalClaims}</span>
          </div>
          <div className="px-4 py-2 rounded-lg bg-success/10 text-sm font-medium">
            Resolved: <span className="text-success font-bold">{resolvedClaims}</span>
          </div>
        </div>

        <div className="space-y-4">
          {userClaims.map(claim => {
            const device = customerDevices.find(d => d.id === claim.deviceId);
            return (
              <Card key={claim.id} className="shadow-card">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText size={18} className="text-primary" />
                        <h3 className="font-heading font-semibold">{claim.issueType}</h3>
                        <StatusBadge status={claim.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{claim.description}</p>
                      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                        <span>Device: {device?.brand} {device?.model}</span>
                        <span>Filed: {claim.claimDate}</span>
                        {claim.turnaroundDays && (
                          <span className="flex items-center gap-1"><Clock size={10} /> TAT: {claim.turnaroundDays} days</span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <p className="text-xs text-muted-foreground">Claim ID</p>
                      <p className="font-mono text-sm font-medium text-foreground">{claim.id.toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Status timeline */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {['submitted', 'in_review', 'approved', 'in_repair', 'completed'].map((step, i) => {
                        const steps = ['submitted', 'in_review', 'approved', 'in_repair', 'completed'];
                        const currentIdx = steps.indexOf(claim.status);
                        const isCompleted = i <= currentIdx;
                        const isCurrent = i === currentIdx;
                        return (
                          <div key={step} className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full shrink-0 ${isCompleted ? 'bg-primary' : 'bg-border'} ${isCurrent ? 'ring-2 ring-primary/30' : ''}`} />
                            <span className={`text-xs whitespace-nowrap ${isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                              {step.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                            {i < 4 && <div className={`h-px w-6 ${isCompleted ? 'bg-primary' : 'bg-border'}`} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default CustomerClaims;
