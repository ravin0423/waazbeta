import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { User, Camera, Save } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const CustomerProfile = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email] = useState(user?.email || '');
  const [avatar, setAvatar] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile updated successfully!');
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-2xl font-bold mb-1">My Profile</h1>
        <p className="text-muted-foreground mb-6">Manage your account details</p>

        <div className="max-w-2xl">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <form onSubmit={handleSave} className="space-y-6">
                {/* Avatar */}
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full gradient-primary flex items-center justify-center overflow-hidden">
                      {avatar ? (
                        <img src={avatar} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-2xl font-bold text-primary-foreground">{name.charAt(0)}</span>
                      )}
                    </div>
                    <label className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-elevated">
                      <Camera size={14} />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </label>
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-lg">{name}</p>
                    <p className="text-sm text-muted-foreground">Customer Account</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={email} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
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

export default CustomerProfile;
