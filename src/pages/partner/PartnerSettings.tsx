import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const PartnerSettings = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [company, setCompany] = useState(user?.company || '');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Settings updated successfully!');
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground mb-6">Manage your partner account</p>

        <div className="max-w-2xl">
          <Card className="shadow-card">
            <CardHeader><CardTitle className="font-heading text-base">Account Details</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input value={company} onChange={e => setCompany(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="gradient-primary text-primary-foreground hover:opacity-90">
                  <Save size={16} className="mr-2" /> Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default PartnerSettings;
