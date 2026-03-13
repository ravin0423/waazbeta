import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Shield, Smartphone, Laptop, Monitor, Camera, Gamepad2, Tv, Printer, Projector,
  CheckCircle2, ArrowRight, Clock, Users, Award, ChevronRight, Sun, Moon, Zap,
  HeartHandshake, Wrench, BadgeCheck, Star, ChevronDown, Globe, ShieldCheck,
  Headphones, Check, X, Menu, ArrowUpRight, ArrowDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import heroDevices from '@/assets/hero-devices.png';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.7, ease: 'easeOut' as const } }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i: number) => ({ opacity: 1, scale: 1, transition: { delay: i * 0.1, duration: 0.5 } }),
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroParallax = useTransform(scrollYProgress, [0, 1], [0, 150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

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

  // ─── HERO ────────────────────────────────────────────────────────
  const renderHero = (s: LandingSection) => {
    const badges = s.content?.floating_badges || [];
    return (
      <section key={s.id} ref={heroRef} className="relative min-h-[100vh] flex items-center overflow-hidden gradient-hero">
        <motion.div style={{ y: heroParallax, opacity: heroOpacity }} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              {/* Subtitle badge */}
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-accent/15 text-accent border border-accent/30 mb-10"
              >
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                {s.subtitle}
              </motion.span>

              <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-extrabold text-foreground leading-[1.05] mb-8 tracking-tight">
                Every device
                <br />
                deserves{' '}
                <span className="text-accent">
                  protection.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mb-8 leading-relaxed font-light">
                {s.description}
              </p>

              {s.content?.subtext && (
                <div className="flex flex-wrap gap-4 mb-12">
                  {s.content.subtext.split('✓').filter(Boolean).map((t: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Check size={14} className="text-accent" /> {t.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <Link to="/login">
                  <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90 text-base px-8 h-14 rounded-full">
                    Start Protecting <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-muted h-14 px-8 rounded-full">
                    How It Works
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Hero image */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
              className="relative"
            >
              <div className="relative">
                <img src={heroDevices} alt="Electronic devices protected by WaaZ" className="w-full max-w-lg mx-auto drop-shadow-2xl relative z-10" />
              </div>

              {/* Floating badges */}
              {badges.map((badge: any, i: number) => {
                const positions = [
                  'top-4 -left-4 sm:top-8 sm:-left-8',
                  'top-1/3 -right-2 sm:-right-6',
                  'bottom-8 left-4 sm:left-0',
                ];
                const Icon = iconMap[badge.icon] || Shield;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.15, type: 'spring', stiffness: 200 }}
                    className={`absolute ${positions[i] || ''} z-20`}
                  >
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card/95 backdrop-blur-md border border-border shadow-elevated text-sm">
                      <Icon size={16} className="text-accent" />
                      <span className="font-medium text-foreground text-xs whitespace-nowrap">{badge.text}</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator — amber circle like group.one */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center shadow-lg cursor-pointer">
            <ArrowDown size={20} className="text-accent-foreground" />
          </div>
        </motion.div>
      </section>
    );
  };

  // ─── STATS ──────────────────────────────────────────────────────
  const renderStats = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} className="py-24 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {items.map((stat: any, i: number) => {
              const Icon = iconMap[stat.icon] || Shield;
              return (
                <motion.div
                  key={stat.label}
                  className="text-center group"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={scaleIn}
                  custom={i}
                >
                  <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-accent/20 transition-colors">
                    <Icon size={24} className="text-accent" />
                  </div>
                  <p className="font-heading text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
                  <p className="text-sm font-medium text-foreground mt-3">{stat.label}</p>
                  {stat.suffix && <p className="text-xs text-muted-foreground mt-1">{stat.suffix}</p>}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  // ─── TRUSTED BRANDS (marquee) ───────────────────────────────────
  const renderTrustedBrands = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} className="py-20 border-b border-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            className="text-center text-sm font-medium text-muted-foreground uppercase tracking-[0.2em] mb-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            {s.title}
          </motion.p>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
            <motion.div
              className="flex gap-20 items-center"
              animate={{ x: [0, -200] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              {[...items, ...items, ...items].map((brand: any, i: number) => (
                <span key={i} className="font-heading text-3xl font-bold text-muted-foreground/20 whitespace-nowrap select-none">
                  {brand.name}
                </span>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    );
  };

  // ─── COVERAGE (bento grid) ─────────────────────────────────────
  const renderCoverage = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="coverage" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-semibold text-accent uppercase tracking-[0.15em] mb-4 block">
              {s.subtitle}
            </span>
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1]">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl text-lg mt-6">{s.description}</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5">
            {items.map((cat: any, i: number) => {
              const Icon = iconMap[cat.icon] || Shield;
              return (
                <motion.div
                  key={cat.label}
                  className="group relative p-7 rounded-3xl border border-border bg-card overflow-hidden cursor-default transition-all duration-500 hover:shadow-elevated hover:border-accent/30"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.5}
                >
                  <div className="relative">
                    <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-5 group-hover:bg-accent/20 group-hover:scale-110 transition-all duration-300">
                      <Icon size={24} className="text-accent" />
                    </div>
                    <h3 className="font-heading font-bold text-foreground mb-2">{cat.label}</h3>
                    <p className="text-muted-foreground leading-relaxed text-xs">{cat.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  // ─── WHY WAAZ (numbered cards like group.one) ──────────────────
  const renderWhyWaaz = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="why-waaz" className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-semibold text-accent uppercase tracking-[0.15em] mb-4 block">{s.subtitle}</span>
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1]">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl text-lg mt-6">{s.description}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any, i: number) => {
              const Icon = iconMap[item.icon] || Shield;
              return (
                <motion.div
                  key={item.title}
                  className="group relative p-10 rounded-3xl bg-card border border-border hover:border-accent/30 hover:shadow-elevated transition-all duration-500"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                >
                  {/* Numbered index like group.one */}
                  <span className="absolute top-8 right-8 font-heading text-6xl font-extrabold text-muted/60 select-none">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent group-hover:scale-105 transition-all duration-300">
                    <Icon size={24} className="text-accent group-hover:text-accent-foreground transition-colors" />
                  </div>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  // ─── COMPARISON TABLE ───────────────────────────────────────────
  const renderComparison = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} className="py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-semibold text-accent uppercase tracking-[0.15em] mb-4 block">{s.subtitle}</span>
            <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">{s.title}</h2>
          </motion.div>
          <motion.div
            className="rounded-3xl border border-border overflow-hidden bg-card"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          >
            <div className="grid grid-cols-3 border-b border-border">
              <div className="p-5 text-sm font-semibold text-muted-foreground">Feature</div>
              <div className="p-5 text-sm font-bold text-center bg-foreground text-background">WaaZ</div>
              <div className="p-5 text-sm font-semibold text-muted-foreground text-center">Traditional</div>
            </div>
            {items.map((row: any, i: number) => (
              <div key={i} className={`grid grid-cols-3 border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/30'}`}>
                <div className="p-5 text-sm font-medium text-foreground">{row.feature}</div>
                <div className="p-5 text-sm text-center font-semibold text-foreground">{row.waaz}</div>
                <div className="p-5 text-sm text-center text-muted-foreground">{row.traditional}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    );
  };

  // ─── HOW IT WORKS ───────────────────────────────────────────────
  const renderHowItWorks = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="how-it-works" className="py-32 bg-muted/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-semibold text-accent uppercase tracking-[0.15em] mb-4 block">{s.subtitle}</span>
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1]">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl text-lg mt-6">{s.description}</p>
          </motion.div>
          <div className="relative">
            <div className="hidden md:block absolute top-28 left-0 right-0 h-px bg-border" />
            <div className="grid md:grid-cols-3 gap-12">
              {items.map((item: any, i: number) => (
                <motion.div
                  key={item.step}
                  className="relative text-center"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                >
                  <div className="relative inline-flex mb-10">
                    <div className="h-24 w-24 rounded-full bg-foreground flex items-center justify-center shadow-elevated">
                      <span className="font-heading text-3xl font-extrabold text-background">{item.step}</span>
                    </div>
                  </div>
                  <h3 className="font-heading text-xl font-bold text-foreground mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed max-w-xs mx-auto">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  };

  // ─── NUMBERS BANNER ─────────────────────────────────────────────
  const renderNumbersBanner = (s: LandingSection) => {
    const items = s.content?.items || [];
    return (
      <section key={s.id} className="py-20 bg-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {items.map((item: any, i: number) => (
              <motion.div
                key={item.label}
                className="text-center"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={scaleIn}
                custom={i}
              >
                <p className="font-heading text-4xl sm:text-5xl font-extrabold text-background tracking-tight">{item.number}</p>
                <p className="text-sm text-background/50 mt-2 font-medium">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // ─── TESTIMONIALS ──────────────────────────────────────────────
  const renderTestimonials = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="testimonials" className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-semibold text-accent uppercase tracking-[0.15em] mb-4 block">{s.subtitle}</span>
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1]">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl text-lg mt-6">{s.description}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-8">
            {items.map((t: any, i: number) => (
              <motion.div
                key={t.name}
                className="group relative p-10 rounded-3xl bg-card border border-border hover:border-accent/20 transition-all duration-500"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <span className="absolute top-6 right-8 font-heading text-8xl text-muted/40 leading-none select-none">"</span>
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: t.rating || 5 }).map((_, j) => (
                    <Star key={j} size={18} className="fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed mb-8 relative z-10 text-lg">"{t.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-foreground flex items-center justify-center text-sm font-bold text-background">
                    {t.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-foreground">{t.name}</p>
                    <p className="text-sm text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // ─── PLANS ──────────────────────────────────────────────────────
  const renderPlans = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="plans" className="py-32 relative overflow-hidden bg-muted/20">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-semibold text-accent uppercase tracking-[0.15em] mb-4 block">{s.subtitle}</span>
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight leading-[1.1]">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl text-lg mt-6">{s.description}</p>
          </motion.div>
          <div className={`grid gap-8 max-w-5xl ${items.length > 1 ? 'md:grid-cols-2' : 'max-w-lg'}`}>
            {items.map((plan: any, i: number) => (
              <motion.div
                key={plan.name}
                className={`relative p-12 rounded-3xl border-2 transition-all duration-500 ${plan.popular ? 'border-foreground bg-card shadow-elevated' : 'border-border bg-card hover:border-foreground/20'}`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                {plan.popular && (
                  <span className="absolute -top-4 left-8 px-5 py-1.5 rounded-full text-xs font-bold bg-accent text-accent-foreground shadow-lg">
                    ⭐ Most Popular
                  </span>
                )}
                <h3 className="font-heading text-2xl font-extrabold text-foreground">{plan.name}</h3>
                <div className="mt-6 mb-10">
                  <span className="font-heading text-6xl font-extrabold text-foreground tracking-tight">{plan.price}</span>
                  <span className="text-muted-foreground text-lg ml-2">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-12">
                  {(plan.features || []).map((f: string) => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="h-6 w-6 rounded-full bg-accent/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={14} className="text-accent" />
                      </div>
                      <span className="text-sm text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <Button className={`w-full h-14 text-base rounded-full ${plan.popular ? 'bg-foreground text-background hover:bg-foreground/90' : ''}`} variant={plan.popular ? 'default' : 'outline'} size="lg">
                    Get {plan.name} <ArrowUpRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Terms & Conditions */}
          {(() => {
            const tcSection = sections.find(s => s.section_key === 'terms_conditions' && s.is_enabled);
            const tcItems = tcSection && Array.isArray(tcSection.content) ? tcSection.content : [];
            if (tcItems.length === 0) return null;
            return (
              <motion.div
                className="mt-14 max-w-3xl"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
              >
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <p className="text-xs text-muted-foreground leading-relaxed space-y-1">
                    {tcItems.map((line: string, i: number) => (
                      <span key={i} className={`block ${i > 0 ? 'mt-1' : ''}`}>* {line}</span>
                    ))}
                  </p>
                </div>
              </motion.div>
            );
          })()}
        </div>
      </section>
    );
  };

  // ─── FAQ ────────────────────────────────────────────────────────
  const renderFaq = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="faq" className="py-32">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-semibold text-accent uppercase tracking-[0.15em] mb-4 block">{s.subtitle}</span>
            <h2 className="font-heading text-4xl sm:text-5xl font-extrabold text-foreground tracking-tight">{s.title}</h2>
          </motion.div>
          <div className="space-y-3">
            {items.map((faq: any, i: number) => (
              <motion.div key={i} className="rounded-2xl border border-border bg-card overflow-hidden" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.3}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left group"
                >
                  <span className="font-heading font-bold text-foreground pr-4">{faq.q}</span>
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${openFaq === i ? 'bg-accent rotate-180' : 'bg-muted group-hover:bg-accent/20'}`}>
                    <ChevronDown size={18} className={`transition-colors ${openFaq === i ? 'text-accent-foreground' : 'text-muted-foreground'}`} />
                  </div>
                </button>
                {openFaq === i && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="px-6 pb-6 -mt-1">
                    <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // ─── CTA ────────────────────────────────────────────────────────
  const renderCta = (s: LandingSection) => (
    <section key={s.id} className="py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative rounded-[2rem] overflow-hidden bg-foreground p-16 sm:p-24 text-center"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="h-20 w-20 rounded-full bg-accent flex items-center justify-center mx-auto mb-10 shadow-lg"
            >
              <Shield size={32} className="text-accent-foreground" />
            </motion.div>
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold text-background mb-8 tracking-tight leading-[1.1]">{s.title}</h2>
            <p className="text-background/50 max-w-xl mx-auto mb-12 text-lg">{s.description}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg h-14 px-10 text-base rounded-full">
                  Get Started Today <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <a href="#plans">
                <Button size="lg" variant="outline" className="border-background/20 text-background hover:bg-background/10 h-14 px-10 text-base rounded-full">
                  View Plans
                </Button>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );

  // ─── SECTION ROUTER ─────────────────────────────────────────────
  const renderSection = (s: LandingSection) => {
    switch (s.section_key) {
      case 'hero': return renderHero(s);
      case 'stats': return renderStats(s);
      case 'trusted_brands': return renderTrustedBrands(s);
      case 'coverage': return renderCoverage(s);
      case 'why_waaz': return renderWhyWaaz(s);
      case 'comparison': return renderComparison(s);
      case 'how_it_works': return renderHowItWorks(s);
      case 'numbers_banner': return renderNumbersBanner(s);
      case 'testimonials': return renderTestimonials(s);
      case 'plans': return renderPlans(s);
      case 'faq': return renderFaq(s);
      case 'cta': return renderCta(s);
      default: return null;
    }
  };

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
        <motion.div
          className="h-14 w-14 rounded-full bg-accent flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Shield size={24} className="text-accent-foreground" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar — clean, minimal like group.one */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-[72px]">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
              <Shield size={20} className="text-accent-foreground" />
            </div>
            <span className="font-heading text-xl font-extrabold text-foreground tracking-tight">WaaZ</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.filter(l => enabledKeys.has(l.key)).map(l => (
              <a key={l.key} href={l.href} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{l.label}</a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="h-10 w-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={16} className="text-foreground" /> : <Sun size={16} className="text-foreground" />}
            </button>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex font-medium">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-5">
                Get Started
              </Button>
            </Link>
            <button className="md:hidden h-10 w-10 rounded-full border border-border flex items-center justify-center" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t border-border bg-background px-4 py-4 space-y-1">
            {navLinks.filter(l => enabledKeys.has(l.key)).map(l => (
              <a key={l.key} href={l.href} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-foreground rounded-xl hover:bg-muted">{l.label}</a>
            ))}
          </motion.div>
        )}
      </nav>

      {/* Dynamic sections */}
      {sections.map(s => renderSection(s))}

      {/* Footer */}
      <footer className="border-t border-border py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center">
                  <Shield size={22} className="text-accent-foreground" />
                </div>
                <span className="font-heading text-2xl font-extrabold text-foreground tracking-tight">WaaZ</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Warranty as a Service — India's most trusted gadget protection platform for consumers, businesses, and resellers.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-bold text-foreground mb-5 text-sm uppercase tracking-[0.15em]">Coverage</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="hover:text-foreground transition-colors cursor-default">Smartphones</li>
                <li className="hover:text-foreground transition-colors cursor-default">Laptops</li>
                <li className="hover:text-foreground transition-colors cursor-default">Televisions</li>
                <li className="hover:text-foreground transition-colors cursor-default">Gaming Consoles</li>
                <li className="hover:text-foreground transition-colors cursor-default">DSLR Cameras</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold text-foreground mb-5 text-sm uppercase tracking-[0.15em]">Company</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="hover:text-foreground transition-colors cursor-default">About Us</li>
                <li className="hover:text-foreground transition-colors cursor-default">Partners Program</li>
                <li className="hover:text-foreground transition-colors cursor-default">Careers</li>
                <li className="hover:text-foreground transition-colors cursor-default">Press & Media</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold text-foreground mb-5 text-sm uppercase tracking-[0.15em]">Support</h4>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="hover:text-foreground transition-colors cursor-default">Help Center</li>
                <li className="hover:text-foreground transition-colors cursor-default">Claim Status</li>
                <li className="hover:text-foreground transition-colors cursor-default">Terms of Service</li>
                <li className="hover:text-foreground transition-colors cursor-default">Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} WaaZ. All rights reserved.</p>
            <p className="text-xs text-muted-foreground/60">Warranty as a Service · Made in India 🇮🇳</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
