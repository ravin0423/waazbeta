import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ClaimSubmissionForm from '@/components/ClaimSubmissionForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CustomerClaims = () => {
  const [showForm, setShowForm] = useState(false);

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

        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <FileText size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No claims yet. Click "New Claim" to submit one.</p>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default CustomerClaims;
