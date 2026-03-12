import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Smartphone, Laptop, Monitor, Camera, Gamepad2, Tv, Printer, CheckCircle2, ArrowRight, Clock, Users, Award, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import heroDevices from '@/assets/hero-devices.png';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

const deviceCategories = [
  { icon: Smartphone, label: 'Smartphones', desc: 'All brands & models' },
  { icon: Laptop, label: 'Laptops', desc: 'Business & personal' },
  { icon: Monitor, label: 'Desktops', desc: 'Workstations & PCs' },
  { icon: Tv, label: 'Televisions', desc: 'Smart & LED TVs' },
  { icon: Camera, label: 'DSLR Cameras', desc: 'Professional gear' },
  { icon: Gamepad2, label: 'Gaming Consoles', desc: 'PS, Xbox & more' },
  { icon: Shield, label: 'CCTV Systems', desc: 'Security devices' },
  { icon: Printer, label: 'Printers & More', desc: 'Expanding coverage' },
];

const plans = [
  {
    name: 'Standard',
    price: '₹899',
    period: '/year',
    features: ['Hardware failure coverage', 'Battery replacement', 'Motherboard repair', '7-day turnaround', 'Pan-India service network'],
    popular: false,
  },
  {
    name: 'Complete',
    price: '₹1,499',
    period: '/year',
    features: ['Everything in Standard', 'Accidental damage', 'Liquid damage', 'Priority 3-day turnaround', 'Doorstep pickup & delivery', 'Loaner device available'],
    popular: true,
  },
];

const stats = [
  { value: '50,000+', label: 'Devices Protected', icon: Shield },
  { value: '< 5 Days', label: 'Average Repair Time', icon: Clock },
  { value: '500+', label: 'Certified Partners', icon: Users },
  { value: '98%', label: 'Customer Satisfaction', icon: Award },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <Shield size={20} className="text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-bold text-foreground">WaaZ</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#coverage" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Coverage</a>
            <a href="#plans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Plans</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90">
                Get Started <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-primary/20 text-primary-foreground/90 border border-primary/30 mb-6">
                Warranty as a Service
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
                Every device<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-accent)' }}>
                  deserves protection.
                </span>
              </h1>
              <p className="text-lg text-primary-foreground/70 max-w-lg mb-8 leading-relaxed">
                From smartphones to gaming consoles — WaaZ offers comprehensive extended warranty coverage for all your gadgets. One platform, total peace of mind.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/login">
                  <Button size="lg" className="gradient-primary text-primary-foreground hover:opacity-90 shadow-lg">
                    Protect Your Device <ArrowRight size={16} className="ml-2" />
                  </Button>
                </Link>
                <a href="#plans">
                  <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                    View Plans
                  </Button>
                </a>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }}>
              <img src={heroDevices} alt="Electronic devices protected by WaaZ warranty shield" className="w-full max-w-lg mx-auto drop-shadow-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <stat.icon size={28} className="mx-auto mb-3 text-primary" />
                <p className="font-heading text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Device Coverage */}
      <section id="coverage" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">What We Cover</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
              Protection for every gadget you own
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              WaaZ covers a wide range of electronic devices — and we're always adding more categories to keep up with your tech needs.
            </p>
          </motion.div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {deviceCategories.map((cat, i) => (
              <motion.div
                key={cat.label}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-elevated transition-all duration-300 cursor-default"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <cat.icon size={24} className="text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-1">{cat.label}</h3>
                <p className="text-sm text-muted-foreground">{cat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Simple Process</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
              How WaaZ works
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Register Your Device', desc: 'Add your gadget with its IMEI or serial number. We verify and record complete device specifications.' },
              { step: '02', title: 'Choose Your Plan', desc: 'Pick Standard or Complete coverage based on the level of protection you need for your device.' },
              { step: '03', title: 'File a Claim Anytime', desc: 'Something goes wrong? Submit a claim online and we handle the rest — pickup, repair, and delivery.' },
            ].map((item, i) => (
              <motion.div key={item.step} className="relative p-8 rounded-2xl bg-card border border-border" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <span className="font-heading text-5xl font-bold text-primary/15">{item.step}</span>
                <h3 className="font-heading text-xl font-semibold text-foreground mt-2 mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Pricing</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
              Choose the right protection
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple, transparent pricing. No hidden fees. Cancel anytime.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                className={`relative p-8 rounded-2xl border-2 ${plan.popular ? 'border-primary bg-card shadow-elevated' : 'border-border bg-card'}`}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold gradient-primary text-primary-foreground">
                    Most Popular
                  </span>
                )}
                <h3 className="font-heading text-2xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="font-heading text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3">
                      <CheckCircle2 size={18} className="text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <Button className={`w-full ${plan.popular ? 'gradient-primary text-primary-foreground hover:opacity-90' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                    Get {plan.name} <ChevronRight size={16} className="ml-1" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="relative rounded-3xl overflow-hidden gradient-hero p-12 sm:p-16 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />
            <div className="relative">
              <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                Ready to protect your devices?
              </h2>
              <p className="text-primary-foreground/70 max-w-xl mx-auto mb-8">
                Join thousands of users who trust WaaZ for their gadget warranty needs. Get started in under 2 minutes.
              </p>
              <Link to="/login">
                <Button size="lg" className="gradient-accent text-accent-foreground hover:opacity-90 shadow-lg">
                  Get Started Today <ArrowRight size={16} className="ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Shield size={16} className="text-primary-foreground" />
                </div>
                <span className="font-heading text-lg font-bold text-foreground">WaaZ</span>
              </div>
              <p className="text-sm text-muted-foreground">Warranty as a Service — comprehensive gadget protection for everyone.</p>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3">Coverage</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Smartphones</li><li>Laptops</li><li>Televisions</li><li>Gaming Consoles</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About Us</li><li>Partners</li><li>Careers</li><li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help Center</li><li>Terms of Service</li><li>Privacy Policy</li><li>Warranty Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} WaaZ. All rights reserved. Warranty as a Service.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
