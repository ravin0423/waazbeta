import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Smartphone, Laptop, Monitor, Camera, Gamepad2, Tv, Printer, Projector, CheckCircle2, ArrowRight, Clock, Users, Award, ChevronRight, Sun, Moon, Zap, HeartHandshake, Wrench, BadgeCheck, Star, HelpCircle, ChevronDown, Globe, ShieldCheck, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import heroDevices from '@/assets/hero-devices.png';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

const iconMap: Record<string, any> = {
  Shield, Smartphone, Laptop, Monitor, Camera, Gamepad2, Tv, Printer, Projector,
  Clock, Users, Award, Zap, HeartHandshake, Globe, ShieldCheck, Headphones, BadgeCheck, Wrench,
};

interface LandingSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  content: any;
  display_order: number;
  is_enabled: boolean;
}

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      const { data } = await supabase
        .from('landing_sections')
        .select('*')
        .eq('is_enabled', true)
        .order('display_order');
      setSections(data || []);
      setLoading(false);
    };
    fetchSections();
  }, []);

  const getSection = (key: string) => sections.find(s => s.section_key === key);

  const renderHero = (s: LandingSection) => (
    <section key={s.id} className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-95" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-accent/5 blur-3xl" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-medium bg-primary/20 text-primary-foreground/90 border border-primary/30 mb-6">
              {s.subtitle}
            </span>
            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
              {s.title.split('.')[0]}
              <br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-accent)' }}>
                {s.title.includes('.') ? s.title.split('.').slice(1).join('.').trim() || 'deserves protection.' : ''}
              </span>
            </h1>
            <p className="text-lg text-primary-foreground/70 max-w-lg mb-4 leading-relaxed">{s.description}</p>
            {s.content?.subtext && (
              <p className="text-sm text-primary-foreground/50 max-w-lg mb-8">{s.content.subtext}</p>
            )}
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
  );

  const renderStats = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} className="py-16 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {items.map((stat: any, i: number) => {
              const Icon = iconMap[stat.icon] || Shield;
              return (
                <motion.div key={stat.label} className="text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                  <Icon size={28} className="mx-auto mb-3 text-primary" />
                  <p className="font-heading text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const renderCoverage = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="coverage" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">{s.subtitle}</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{s.description}</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {items.map((cat: any, i: number) => {
              const Icon = iconMap[cat.icon] || Shield;
              return (
                <motion.div key={cat.label} className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-elevated transition-all duration-300" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon size={24} className="text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-2">{cat.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{cat.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const renderWhyWaaz = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="why-waaz" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">{s.subtitle}</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{s.description}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any, i: number) => {
              const Icon = iconMap[item.icon] || Shield;
              return (
                <motion.div key={item.title} className="p-6 rounded-2xl bg-card border border-border hover:shadow-elevated transition-all" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon size={22} className="text-primary" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  const renderHowItWorks = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">{s.subtitle}</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{s.description}</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {items.map((item: any, i: number) => (
              <motion.div key={item.step} className="relative p-8 rounded-2xl bg-card border border-border" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <span className="font-heading text-6xl font-bold text-primary/10">{item.step}</span>
                <h3 className="font-heading text-xl font-semibold text-foreground mt-2 mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderTestimonials = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="testimonials" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">{s.subtitle}</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{s.description}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {items.map((t: any, i: number) => (
              <motion.div key={t.name} className="p-6 rounded-2xl bg-card border border-border" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating || 5 }).map((_, j) => (
                    <Star key={j} size={16} className="fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-heading font-semibold text-foreground text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderPlans = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="plans" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">{s.subtitle}</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{s.description}</p>
          </motion.div>
          <div className={`grid gap-8 max-w-4xl mx-auto ${items.length > 1 ? 'md:grid-cols-2' : 'md:grid-cols-1 max-w-lg'}`}>
            {items.map((plan: any, i: number) => (
              <motion.div key={plan.name} className={`relative p-8 rounded-2xl border-2 ${plan.popular ? 'border-primary bg-card shadow-elevated' : 'border-border bg-card'}`} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold gradient-primary text-primary-foreground">Most Popular</span>
                )}
                <h3 className="font-heading text-2xl font-bold text-foreground">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="font-heading text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {(plan.features || []).map((f: string) => (
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
    );
  };

  const renderFaq = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="faq" className="py-24 bg-muted/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">{s.subtitle}</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">{s.title}</h2>
          </motion.div>
          <div className="space-y-3">
            {items.map((faq: any, i: number) => (
              <motion.div key={i} className="rounded-xl border border-border bg-card overflow-hidden" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-heading font-semibold text-foreground text-sm pr-4">{faq.q}</span>
                  <ChevronDown size={18} className={`text-muted-foreground shrink-0 transition-transform duration-200 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="px-5 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const renderCta = (s: LandingSection) => (
    <section key={s.id} className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div className="relative rounded-3xl overflow-hidden gradient-hero p-12 sm:p-16 text-center" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="relative">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">{s.title}</h2>
            <p className="text-primary-foreground/70 max-w-xl mx-auto mb-8">{s.description}</p>
            <Link to="/login">
              <Button size="lg" className="gradient-accent text-accent-foreground hover:opacity-90 shadow-lg">
                Get Started Today <ArrowRight size={16} className="ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );

  const renderSection = (s: LandingSection) => {
    switch (s.section_key) {
      case 'hero': return renderHero(s);
      case 'stats': return renderStats(s);
      case 'coverage': return renderCoverage(s);
      case 'why_waaz': return renderWhyWaaz(s);
      case 'how_it_works': return renderHowItWorks(s);
      case 'testimonials': return renderTestimonials(s);
      case 'plans': return renderPlans(s);
      case 'faq': return renderFaq(s);
      case 'cta': return renderCta(s);
      default: return null;
    }
  };

  // Navbar anchors: only show if section is enabled
  const navLinks = [
    { key: 'coverage', href: '#coverage', label: 'Coverage' },
    { key: 'why_waaz', href: '#why-waaz', label: 'Why WaaZ' },
    { key: 'plans', href: '#plans', label: 'Plans' },
    { key: 'testimonials', href: '#testimonials', label: 'Reviews' },
    { key: 'faq', href: '#faq', label: 'FAQ' },
  ];
  const enabledKeys = new Set(sections.map(s => s.section_key));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

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
            {navLinks.filter(l => enabledKeys.has(l.key)).map(l => (
              <a key={l.key} href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="h-9 w-9 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors" aria-label="Toggle theme">
              {theme === 'light' ? <Moon size={16} className="text-foreground" /> : <Sun size={16} className="text-foreground" />}
            </button>
            <Link to="/login"><Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button></Link>
            <Link to="/login">
              <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90">
                Get Started <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Dynamic sections */}
      {sections.map(s => renderSection(s))}

      {/* Footer - always shown */}
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
              <p className="text-sm text-muted-foreground">Warranty as a Service — India's most trusted gadget protection platform.</p>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3">Coverage</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Smartphones</li><li>Laptops</li><li>Televisions</li><li>Gaming Consoles</li><li>DSLR Cameras</li><li>CCTV Systems</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About Us</li><li>Partners Program</li><li>Careers</li><li>Press & Media</li><li>Contact</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Help Center</li><li>Claim Status</li><li>Terms of Service</li><li>Privacy Policy</li><li>Warranty Policy</li>
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
