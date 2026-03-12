import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Shield, Mail, Lock, ArrowRight, User, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (isSignUp) {
      const result = await signup(email, password, fullName);
      if (result.success) {
        // Auto-confirmed, so login automatically happens via onAuthStateChange
        // Small delay to let the auth state propagate
        setTimeout(() => navigate('/customer'), 500);
      } else {
        setError(result.error || 'Signup failed');
      }
    } else {
      const result = await login(email, password);
      if (result.success) {
        // Role-based redirect will happen from App.tsx
        // For now, navigate to a temporary route that will redirect
        setTimeout(() => {
          // Re-check route after auth state updates
          window.location.href = '/';
        }, 500);
      } else {
        setError(result.error || 'Invalid credentials');
      }
    }
    setSubmitting(false);
  };

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
                { val: '50K+', lab: 'Devices Protected' },
                { val: '₹899', lab: 'Starting Plan' },
                { val: '< 5 days', lab: 'Avg. Repair' },
              ].map(s => (
                <div key={s.lab}>
                  <p className="font-heading text-2xl font-bold text-accent">{s.val}</p>
                  <p className="text-primary-foreground/50 text-sm">{s.lab}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
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

          <h2 className="font-heading text-2xl font-bold mb-1">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isSignUp ? 'Sign up to start protecting your devices' : 'Sign in to your WaaZ account'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="fullName" placeholder="Your full name" value={fullName} onChange={e => setFullName(e.target.value)} className="pl-10" required />
                </div>
              </div>
            )}
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
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10" required minLength={6} />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={submitting} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
              {submitting && <Loader2 size={16} className="mr-2 animate-spin" />}
              {isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={16} className="ml-2" />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }} className="text-primary hover:underline font-medium">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
