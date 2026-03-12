import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(email, password);
    if (success) {
      const user = email.includes('waaz') ? '/admin' : email.includes('techfix') ? '/partner' : '/customer';
      navigate(user);
    } else {
      setError('Invalid credentials. Try one of the demo accounts below.');
    }
  };

  const demoAccounts = [
    { label: 'Customer', email: 'rajesh@example.com', desc: 'View subscriptions & claims' },
    { label: 'Admin', email: 'priya@waaz.in', desc: 'Full admin dashboard' },
    { label: 'Partner', email: 'vikram@techfix.in', desc: 'Reseller & partner portal' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden items-center justify-center p-12">
        <div className="relative z-10 max-w-md">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center">
                <Shield size={28} className="text-primary-foreground" />
              </div>
              <h1 className="font-heading text-3xl font-bold text-primary-foreground">WaaZ</h1>
            </div>
            <h2 className="font-heading text-4xl font-bold text-primary-foreground leading-tight mb-4">
              Warranty as a Service
            </h2>
            <p className="text-primary-foreground/70 text-lg leading-relaxed">
              Complete device protection platform. Manage subscriptions, track claims, and grow your repair partner network — all in one place.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6">
              {[
                { val: '10K+', lab: 'Active Users' },
                { val: '₹899', lab: 'Starting Plan' },
                { val: '< 7 days', lab: 'Avg. TAT' },
              ].map(s => (
                <div key={s.lab}>
                  <p className="font-heading text-2xl font-bold text-accent">{s.val}</p>
                  <p className="text-primary-foreground/50 text-sm">{s.lab}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-primary/10" />
        <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-accent/5" />
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-background">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Shield size={22} className="text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl font-bold">WaaZ</h1>
          </div>

          <h2 className="font-heading text-2xl font-bold mb-1">Welcome back</h2>
          <p className="text-muted-foreground mb-8">Sign in to your WaaZ account</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" required />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full gradient-primary text-primary-foreground hover:opacity-90">
              Sign In <ArrowRight size={16} className="ml-2" />
            </Button>
          </form>

          <div className="mt-8">
            <p className="text-sm text-muted-foreground mb-3">Quick access with demo accounts:</p>
            <div className="grid gap-2">
              {demoAccounts.map(acc => (
                <button
                  key={acc.email}
                  onClick={() => { setEmail(acc.email); setPassword('demo'); }}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-secondary transition-colors text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{acc.label}</p>
                    <p className="text-xs text-muted-foreground">{acc.desc}</p>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
