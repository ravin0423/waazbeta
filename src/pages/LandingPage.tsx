import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Smartphone, Laptop, Monitor, Camera, Gamepad2, Tv, Printer, Projector, CheckCircle2, ArrowRight, Clock, Users, Award, ChevronRight, Sun, Moon, Zap, HeartHandshake, Wrench, BadgeCheck, Star, HelpCircle, ChevronDown, Globe, ShieldCheck, Headphones } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import heroDevices from '@/assets/hero-devices.png';
import { useState } from 'react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6 } }),
};

const deviceCategories = [
  { icon: Smartphone, label: 'Smartphones', desc: 'iPhone, Samsung, OnePlus, Xiaomi — every brand, every model. Screen damage, battery issues, motherboard failures covered.' },
  { icon: Laptop, label: 'Laptops', desc: 'MacBooks, ThinkPads, gaming laptops. Keyboard, display, SSD, and logic board repairs included.' },
  { icon: Monitor, label: 'Desktops', desc: 'Workstations, all-in-ones, custom builds. PSU, GPU, RAM failures — we handle the heavy lifting.' },
  { icon: Tv, label: 'Televisions', desc: 'Smart TVs, OLED, QLED from Sony, LG, Samsung. Panel defects, power issues, and software glitches.' },
  { icon: Camera, label: 'DSLR Cameras', desc: 'Canon, Nikon, Sony mirrorless & DSLRs. Sensor cleaning, shutter mechanism, lens motor repairs.' },
  { icon: Gamepad2, label: 'Gaming Consoles', desc: 'PlayStation, Xbox, Nintendo Switch. Overheating, HDMI port, disc drive and drift repairs.' },
  { icon: Shield, label: 'CCTV Systems', desc: 'IP cameras, DVR/NVR units, PTZ cameras. Night vision, motion sensor, and storage failures.' },
  { icon: Projector, label: 'Projectors', desc: 'Home theater, office & portable projectors. Lamp, color wheel, HDMI port, and overheating repairs.' },
  { icon: Printer, label: 'Printers & More', desc: 'Inkjet, laser, 3D printers. Print head, roller, connectivity, and firmware issues resolved.' },
];

const plans = [
  {
    name: 'Standard',
    price: '₹899',
    period: '/year',
    features: ['Hardware failure coverage', 'Battery replacement', 'Motherboard repair', '7-day turnaround', 'Pan-India service network', 'Online claim tracking'],
    popular: false,
  },
  {
    name: 'Complete',
    price: '₹1,499',
    period: '/year',
    features: ['Everything in Standard', 'Accidental damage protection', 'Liquid & water damage', 'Priority 3-day turnaround', 'Doorstep pickup & delivery', 'Loaner device while repairing', '24/7 priority support'],
    popular: true,
  },
];

const stats = [
  { value: '50,000+', label: 'Devices Protected', icon: Shield },
  { value: '< 5 Days', label: 'Average Repair Time', icon: Clock },
  { value: '500+', label: 'Certified Partners', icon: Users },
  { value: '98%', label: 'Customer Satisfaction', icon: Award },
];

const whyWaaz = [
  { icon: Zap, title: 'Lightning Fast Claims', desc: 'File a claim in under 2 minutes. No paperwork, no waiting on hold. Our AI-powered system processes claims instantly.' },
  { icon: HeartHandshake, title: 'Trusted by Brands', desc: 'We partner with authorized service centers across India to ensure genuine parts and certified technicians for every repair.' },
  { icon: Globe, title: 'Pan-India Coverage', desc: 'From metros to tier-3 cities, our 500+ service partner network ensures your device gets repaired no matter where you are.' },
  { icon: ShieldCheck, title: 'No Fine Print', desc: 'Transparent policies with zero hidden exclusions. What we promise is what we deliver — read our warranty terms in plain English.' },
  { icon: Headphones, title: '24/7 Human Support', desc: 'Real people, real help. Our support team is available round the clock via chat, email, and phone — no bots, no runaround.' },
  { icon: BadgeCheck, title: 'Certified & Verified', desc: 'WaaZ is backed by a rigorous quality assurance process and authorized service partnerships, ensuring your devices are in trusted hands.' },
];

const testimonials = [
  { name: 'Arjun Mehta', role: 'Software Engineer, Bengaluru', text: 'My MacBook Pro had a logic board failure 14 months after purchase. Apple quoted ₹45,000 — WaaZ covered it completely. Repaired and returned in 4 days. Absolutely worth every rupee.', rating: 5 },
  { name: 'Priya Sharma', role: 'Photography Studio Owner, Delhi', text: 'I protect all my Canon DSLRs with WaaZ Complete. When my 5D Mark IV shutter mechanism failed during a wedding shoot, they arranged a loaner camera within 24 hours. Lifesaver!', rating: 5 },
  { name: 'Rahul Krishnan', role: 'IT Manager, Chennai', text: 'We enrolled 200+ company laptops under WaaZ. The bulk dashboard, claim tracking, and priority turnaround have saved us lakhs in repair costs. The partner portal is excellent.', rating: 5 },
  { name: 'Sneha Patel', role: 'Content Creator, Mumbai', text: 'Dropped my iPhone in water at a pool party. Thought it was gone forever. Filed a claim on WaaZ app, got doorstep pickup next morning. Phone came back good as new in 3 days!', rating: 5 },
];

const faqs = [
  { q: 'What happens if my device can\'t be repaired?', a: 'If our certified technicians determine that your device is beyond economical repair, we offer a replacement of equivalent value or a cash settlement based on the current market value of your device, as outlined in your plan terms.' },
  { q: 'Can I transfer my warranty to a new owner?', a: 'Yes! WaaZ warranties are transferable. If you sell your device, you can transfer the remaining warranty period to the new owner through your dashboard at no extra cost. This also increases your device\'s resale value.' },
  { q: 'Is there a waiting period after purchase?', a: 'Standard plans have a 15-day activation period to allow for device verification. Complete plans activate within 48 hours. During this period, we verify your device\'s IMEI/serial number and condition.' },
  { q: 'How do I file a claim?', a: 'Simply log into your WaaZ dashboard, click "File a Claim," describe the issue, and upload photos if needed. Our AI system pre-approves most claims instantly. For Complete plan holders, we arrange doorstep pickup automatically.' },
  { q: 'Are pre-existing conditions covered?', a: 'No, pre-existing damage or defects present at the time of enrollment are not covered. We conduct a quick device health check during activation to document your device\'s condition.' },
  { q: 'Do you cover accessories like chargers and earphones?', a: 'Our standard plans cover the primary device only. However, our Complete plan includes coverage for original manufacturer accessories (chargers, cables, earphones) that came bundled with the device.' },
];

const LandingPage = () => {
  const { theme, toggleTheme } = useTheme();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

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
            <a href="#why-waaz" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Why WaaZ</a>
            <a href="#plans" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Plans</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
            <a href="#faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="h-9 w-9 rounded-lg border border-border bg-card flex items-center justify-center hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? <Moon size={16} className="text-foreground" /> : <Sun size={16} className="text-foreground" />}
            </button>
            <Link to="/login">
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Sign In</Button>
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
                🛡️ Warranty as a Service — India's #1 Gadget Protection Platform
              </span>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6">
                Every device<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'var(--gradient-accent)' }}>
                  deserves protection.
                </span>
              </h1>
              <p className="text-lg text-primary-foreground/70 max-w-lg mb-4 leading-relaxed">
                From smartphones to DSLR cameras, gaming consoles to CCTV systems — WaaZ gives you comprehensive extended warranty coverage for <strong className="text-primary-foreground/90">all your gadgets</strong> under one roof.
              </p>
              <p className="text-sm text-primary-foreground/50 max-w-lg mb-8">
                ✓ Instant AI-powered claims &nbsp; ✓ 500+ service centers &nbsp; ✓ Doorstep pickup available
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

      {/* Device Coverage — Expanded */}
      <section id="coverage" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Comprehensive Coverage</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
              Protection for every gadget you own
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              WaaZ covers 8 major device categories with specialized repair expertise for each. Our certified technicians use genuine parts and follow manufacturer-grade protocols.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {deviceCategories.map((cat, i) => (
              <motion.div
                key={cat.label}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/40 hover:shadow-elevated transition-all duration-300"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <cat.icon size={24} className="text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-foreground mb-2">{cat.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{cat.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why WaaZ */}
      <section id="why-waaz" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">The WaaZ Difference</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
              Why 50,000+ Indians trust WaaZ
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We're not just another warranty company. WaaZ is built from the ground up to be transparent, fast, and genuinely helpful when you need it most.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyWaaz.map((item, i) => (
              <motion.div key={item.title} className="p-6 rounded-2xl bg-card border border-border hover:shadow-elevated transition-all" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon size={22} className="text-primary" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Simple Process</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
              Get covered in 3 easy steps
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              No lengthy forms, no confusing jargon. Protecting your device takes less than 2 minutes.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Register Your Device', desc: 'Add your gadget with its IMEI or serial number. Our system auto-detects the brand, model, and specifications. We verify the device condition through a quick digital check.' },
              { step: '02', title: 'Choose Your Plan', desc: 'Pick Standard for essential hardware coverage or Complete for full protection including accidental & liquid damage. Pay annually — no EMIs, no hidden charges.' },
              { step: '03', title: 'Claim Anytime, Anywhere', desc: 'Something goes wrong? Open the WaaZ app, file a claim with photos, and get instant AI-powered approval. We arrange pickup, repair with genuine parts, and deliver it back to your door.' },
            ].map((item, i) => (
              <motion.div key={item.step} className="relative p-8 rounded-2xl bg-card border border-border" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <span className="font-heading text-6xl font-bold text-primary/10">{item.step}</span>
                <h3 className="font-heading text-xl font-semibold text-foreground mt-2 mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Real Stories</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
              Don't take our word for it
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Hear from real customers who've experienced the WaaZ difference when it mattered most.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={t.name} className="p-6 rounded-2xl bg-card border border-border" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
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

      {/* Plans */}
      <section id="plans" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Transparent Pricing</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
              Choose the right protection
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Simple, honest pricing. No hidden fees, no surprise exclusions. Cancel anytime with a pro-rated refund.
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

      {/* FAQ */}
      <section id="faq" className="py-24 bg-muted/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div className="text-center mb-16" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <span className="text-sm font-medium text-primary uppercase tracking-wider">Got Questions?</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mt-3 mb-4">
              Frequently asked questions
            </h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} className="rounded-xl border border-border bg-card overflow-hidden" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i * 0.5}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
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
                Join 50,000+ users who trust WaaZ for their gadget warranty needs. Get started in under 2 minutes — no credit card required.
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
              <p className="text-sm text-muted-foreground">Warranty as a Service — India's most trusted gadget protection platform for consumers, businesses, and resellers.</p>
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
