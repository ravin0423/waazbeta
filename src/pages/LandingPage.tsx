import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  Shield, Smartphone, Laptop, Monitor, Camera, Gamepad2, Tv, Printer, Projector,
  CheckCircle2, ArrowRight, Clock, Users, Award, ChevronRight, Sun, Moon, Zap,
  HeartHandshake, Wrench, BadgeCheck, Star, ChevronDown, Globe, ShieldCheck,
  Headphones, Check, X, Menu, ArrowUpRight
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
      <section key={s.id} ref={heroRef} className="relative min-h-[100vh] flex items-center overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 overflow-hidden">
          <motion.div className="absolute -top-20 -left-20 w-[500px] h-[500px] rounded-full bg-primary/15 blur-[100px]" animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute top-1/2 -right-20 w-[400px] h-[400px] rounded-full bg-accent/10 blur-[80px]" animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full bg-primary/8 blur-[60px]" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>

        <motion.div style={{ y: heroParallax, opacity: heroOpacity }} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
              {/* Badge */}
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 mb-8 backdrop-blur-sm"
              >
                <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                {s.subtitle}
              </motion.span>

              {/* Tagline */}
              <motion.p
                initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.35, duration: 0.8, ease: 'easeOut' }}
                className="text-sm sm:text-base font-bold tracking-[0.25em] uppercase mb-4 bg-clip-text text-transparent"
                style={{ backgroundImage: 'var(--gradient-accent)' }}
              >
                Innovating Your Warranty Experience
              </motion.p>

              <h1 className="font-heading text-4xl sm:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-extrabold text-primary-foreground leading-[1.1] mb-6 tracking-tight">
                Every device
                <br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-accent)' }}>
                  deserves protection.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-primary-foreground/65 max-w-lg mb-6 leading-relaxed font-light">
                {s.description}
              </p>

              {s.content?.subtext && (
                <div className="flex flex-wrap gap-3 mb-10">
                  {s.content.subtext.split('✓').filter(Boolean).map((t: string, i: number) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-sm text-primary-foreground/50">
                      <Check size={14} className="text-accent" /> {t.trim()}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                <Link to="/login">
                  <Button size="lg" className="gradient-accent text-accent-foreground hover:opacity-90 shadow-lg shadow-accent/25 text-base px-8 h-12">
                    Start Protecting <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-12 px-8">
                    How It Works
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Hero image with floating badges */}
            <motion.div
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
              className="relative"
            >
              <div className="relative">
                <img src={heroDevices} alt="Electronic devices protected by WaaZ" className="w-full max-w-lg mx-auto drop-shadow-2xl relative z-10" />
                {/* Glow ring behind image */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-80 h-80 rounded-full bg-primary/20 blur-[60px]" />
                </div>
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
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-card/90 backdrop-blur-md border border-border/50 shadow-elevated text-sm">
                      <Icon size={16} className="text-primary" />
                      <span className="font-medium text-foreground text-xs whitespace-nowrap">{badge.text}</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-primary-foreground/30 flex justify-center pt-2">
            <div className="w-1.5 h-3 rounded-full bg-primary-foreground/50" />
          </div>
        </motion.div>
      </section>
    );
  };

  // ─── STATS (counter style) ──────────────────────────────────────
  const renderStats = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card to-background" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {items.map((stat: any, i: number) => {
              const Icon = iconMap[stat.icon] || Shield;
              return (
                <motion.div
                  key={stat.label}
                  className="relative group p-6 sm:p-8 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-500 text-center"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={scaleIn}
                  custom={i}
                >
                  <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <p className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">{stat.value}</p>
                    <p className="text-sm font-medium text-foreground mt-2">{stat.label}</p>
                    {stat.suffix && <p className="text-xs text-muted-foreground mt-1">{stat.suffix}</p>}
                  </div>
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
      <section key={s.id} className="py-16 border-y border-border overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.p
            className="text-center text-sm font-medium text-muted-foreground uppercase tracking-widest mb-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
          >
            {s.title}
          </motion.p>
          <div className="relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
            <motion.div
              className="flex gap-16 items-center"
              animate={{ x: [0, -200] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              {[...items, ...items, ...items].map((brand: any, i: number) => (
                <span key={i} className="font-heading text-2xl font-bold text-muted-foreground/30 whitespace-nowrap select-none">
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
      <section key={s.id} id="coverage" className="py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
              {s.subtitle}
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-5 tracking-tight">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{s.description}</p>
          </motion.div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {items.map((cat: any, i: number) => {
              const Icon = iconMap[cat.icon] || Shield;
              return (
                <motion.div
                  key={cat.label}
                  className="group relative p-6 rounded-2xl border border-border bg-card overflow-hidden cursor-default transition-all duration-500 hover:shadow-elevated hover:border-primary/30"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i * 0.5}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                      <Icon size={22} className="text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-foreground mb-2 text-sm">{cat.label}</h3>
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

  // ─── WHY WAAZ (with highlight numbers) ─────────────────────────
  const renderWhyWaaz = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="why-waaz" className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/50" />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-primary/5 blur-[100px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">{s.subtitle}</span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-5 tracking-tight">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{s.description}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item: any, i: number) => {
              const Icon = iconMap[item.icon] || Shield;
              return (
                <motion.div
                  key={item.title}
                  className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-elevated transition-all duration-500"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                >
                  <div className="absolute top-6 right-6">
                    {item.highlight && (
                      <span className="font-heading text-3xl font-extrabold text-primary/10 group-hover:text-primary/20 transition-colors">
                        {item.highlight}
                      </span>
                    )}
                  </div>
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                    <Icon size={22} className="text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <h3 className="font-heading text-lg font-bold text-foreground mb-3">{item.title}</h3>
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
      <section key={s.id} className="py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">{s.subtitle}</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground mt-3 mb-5 tracking-tight">{s.title}</h2>
          </motion.div>
          <motion.div
            className="rounded-2xl border border-border overflow-hidden bg-card"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          >
            <div className="grid grid-cols-3 bg-muted/50 border-b border-border">
              <div className="p-4 text-sm font-semibold text-muted-foreground">Feature</div>
              <div className="p-4 text-sm font-bold text-primary text-center gradient-primary text-primary-foreground rounded-t-none">WaaZ</div>
              <div className="p-4 text-sm font-semibold text-muted-foreground text-center">Traditional</div>
            </div>
            {items.map((row: any, i: number) => (
              <div key={i} className={`grid grid-cols-3 border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}>
                <div className="p-4 text-sm font-medium text-foreground">{row.feature}</div>
                <div className="p-4 text-sm text-center font-semibold text-primary">{row.waaz}</div>
                <div className="p-4 text-sm text-center text-muted-foreground">{row.traditional}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>
    );
  };

  // ─── HOW IT WORKS (connected steps) ─────────────────────────────
  const renderHowItWorks = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="how-it-works" className="py-28 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">{s.subtitle}</span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-5 tracking-tight">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{s.description}</p>
          </motion.div>
          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            <div className="grid md:grid-cols-3 gap-10">
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
                  {/* Step number circle */}
                  <div className="relative inline-flex mb-8">
                    <div className="h-20 w-20 rounded-full gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
                      <span className="font-heading text-2xl font-extrabold text-primary-foreground">{item.step}</span>
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
      <section key={s.id} className="py-16 relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                <p className="font-heading text-4xl sm:text-5xl font-extrabold text-primary-foreground tracking-tight">{item.number}</p>
                <p className="text-sm text-primary-foreground/60 mt-2 font-medium">{item.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // ─── TESTIMONIALS (card carousel feel) ──────────────────────────
  const renderTestimonials = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="testimonials" className="py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">{s.subtitle}</span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-5 tracking-tight">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{s.description}</p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {items.map((t: any, i: number) => (
              <motion.div
                key={t.name}
                className="group relative p-8 rounded-2xl bg-card border border-border hover:border-primary/20 transition-all duration-500"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                {/* Large quote mark */}
                <span className="absolute top-4 right-6 font-heading text-7xl text-primary/5 leading-none select-none">"</span>
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating || 5 }).map((_, j) => (
                    <Star key={j} size={16} className="fill-accent text-accent" />
                  ))}
                </div>
                <p className="text-foreground leading-relaxed mb-6 relative z-10">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {t.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-foreground text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // ─── PLANS (glassmorphism) ──────────────────────────────────────
  const renderPlans = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="plans" className="py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-muted/30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-20" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">{s.subtitle}</span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-foreground mt-3 mb-5 tracking-tight">{s.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{s.description}</p>
          </motion.div>
          <div className={`grid gap-8 max-w-5xl mx-auto ${items.length > 1 ? 'md:grid-cols-2' : 'max-w-lg'}`}>
            {items.map((plan: any, i: number) => (
              <motion.div
                key={plan.name}
                className={`relative p-10 rounded-3xl border-2 transition-all duration-500 ${plan.popular ? 'border-primary bg-card shadow-elevated scale-[1.02]' : 'border-border bg-card hover:border-primary/30'}`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                {plan.popular && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full text-xs font-bold gradient-accent text-accent-foreground shadow-lg">
                    ⭐ Most Popular
                  </span>
                )}
                <h3 className="font-heading text-2xl font-extrabold text-foreground">{plan.name}</h3>
                <div className="mt-5 mb-8">
                  <span className="font-heading text-5xl font-extrabold text-foreground tracking-tight">{plan.price}</span>
                  <span className="text-muted-foreground text-lg ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {(plan.features || []).map((f: string) => (
                    <li key={f} className="flex items-start gap-3">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={12} className="text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login">
                  <Button className={`w-full h-12 text-base ${plan.popular ? 'gradient-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25' : ''}`} variant={plan.popular ? 'default' : 'outline'} size="lg">
                    Get {plan.name} <ArrowUpRight size={16} className="ml-2" />
                  </Button>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Terms & Conditions note — loaded from DB */}
          {(() => {
            const tcSection = sections.find(s => s.section_key === 'terms_conditions' && s.is_enabled);
            const tcItems = tcSection && Array.isArray(tcSection.content) ? tcSection.content : [];
            if (tcItems.length === 0) return null;
            return (
              <motion.div
                className="mt-12 max-w-3xl mx-auto text-center"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
              >
                <div className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
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

  // ─── FAQ (accordion) ────────────────────────────────────────────
  const renderFaq = (s: LandingSection) => {
    const items = Array.isArray(s.content) ? s.content : [];
    return (
      <section key={s.id} id="faq" className="py-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">{s.subtitle}</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-extrabold text-foreground mt-3 tracking-tight">{s.title}</h2>
          </motion.div>
          <div className="space-y-3">
            {items.map((faq: any, i: number) => (
              <motion.div key={i} className="rounded-2xl border border-border bg-card overflow-hidden" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.3}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-left group"
                >
                  <span className="font-heading font-bold text-foreground pr-4">{faq.q}</span>
                  <div className={`h-8 w-8 rounded-full border border-border flex items-center justify-center shrink-0 transition-all duration-300 ${openFaq === i ? 'bg-primary border-primary rotate-180' : 'group-hover:border-primary/50'}`}>
                    <ChevronDown size={16} className={`transition-colors ${openFaq === i ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
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

  // ─── CTA (immersive) ────────────────────────────────────────────
  const renderCta = (s: LandingSection) => (
    <section key={s.id} className="py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          className="relative rounded-[2rem] overflow-hidden gradient-hero p-16 sm:p-20 text-center"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
        >
          {/* Animated orbs */}
          <motion.div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-primary/15 blur-[80px]" animate={{ scale: [1, 1.3, 1], x: [0, 20, 0] }} transition={{ duration: 8, repeat: Infinity }} />
          <motion.div className="absolute bottom-0 left-0 w-60 h-60 rounded-full bg-accent/15 blur-[60px]" animate={{ scale: [1, 1.2, 1], y: [0, -20, 0] }} transition={{ duration: 6, repeat: Infinity }} />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="relative">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="h-16 w-16 rounded-2xl gradient-accent flex items-center justify-center mx-auto mb-8 shadow-lg shadow-accent/25"
            >
              <Shield size={28} className="text-accent-foreground" />
            </motion.div>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary-foreground mb-6 tracking-tight">{s.title}</h2>
            <p className="text-primary-foreground/60 max-w-xl mx-auto mb-10 text-lg">{s.description}</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/login">
                <Button size="lg" className="gradient-accent text-accent-foreground hover:opacity-90 shadow-lg shadow-accent/25 h-14 px-10 text-base">
                  Get Started Today <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
              <a href="#plans">
                <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 h-14 px-10 text-base">
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
          className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Shield size={24} className="text-primary-foreground" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/70 backdrop-blur-2xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
              <Shield size={18} className="text-primary-foreground" />
            </div>
            <span className="font-heading text-xl font-extrabold text-foreground tracking-tight">WaaZ</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.filter(l => enabledKeys.has(l.key)).map(l => (
              <a key={l.key} href={l.href} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-all">{l.label}</a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={15} className="text-foreground" /> : <Sun size={15} className="text-foreground" />}
            </button>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex font-medium">Sign In</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90 shadow-sm">
                Get Started <ArrowRight size={14} className="ml-1" />
              </Button>
            </Link>
            <button className="md:hidden h-9 w-9 rounded-xl border border-border flex items-center justify-center" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <Menu size={18} />
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl px-4 py-4 space-y-1">
            {navLinks.filter(l => enabledKeys.has(l.key)).map(l => (
              <a key={l.key} href={l.href} onClick={() => setMobileMenuOpen(false)} className="block px-4 py-3 text-sm font-medium text-foreground rounded-xl hover:bg-muted">{l.label}</a>
            ))}
          </motion.div>
        )}
      </nav>

      {/* Dynamic sections */}
      {sections.map(s => renderSection(s))}

      {/* Footer */}
      <footer className="border-t border-border py-16 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-5 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-sm">
                  <Shield size={18} className="text-primary-foreground" />
                </div>
                <span className="font-heading text-xl font-extrabold text-foreground tracking-tight">WaaZ</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                Warranty as a Service — India's most trusted gadget protection platform for consumers, businesses, and resellers.
              </p>
            </div>
            <div>
              <h4 className="font-heading font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Coverage</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="hover:text-foreground transition-colors cursor-default">Smartphones</li>
                <li className="hover:text-foreground transition-colors cursor-default">Laptops</li>
                <li className="hover:text-foreground transition-colors cursor-default">Televisions</li>
                <li className="hover:text-foreground transition-colors cursor-default">Gaming Consoles</li>
                <li className="hover:text-foreground transition-colors cursor-default">DSLR Cameras</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="hover:text-foreground transition-colors cursor-default">About Us</li>
                <li className="hover:text-foreground transition-colors cursor-default">Partners Program</li>
                <li className="hover:text-foreground transition-colors cursor-default">Careers</li>
                <li className="hover:text-foreground transition-colors cursor-default">Press & Media</li>
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold text-foreground mb-4 text-sm uppercase tracking-wider">Support</h4>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li className="hover:text-foreground transition-colors cursor-default">Help Center</li>
                <li className="hover:text-foreground transition-colors cursor-default">Claim Status</li>
                <li className="hover:text-foreground transition-colors cursor-default">Terms of Service</li>
                <li className="hover:text-foreground transition-colors cursor-default">Privacy Policy</li>
              </ul>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} WaaZ. All rights reserved.</p>
            <p className="text-xs text-muted-foreground/60">Warranty as a Service · Made in India 🇮🇳</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
