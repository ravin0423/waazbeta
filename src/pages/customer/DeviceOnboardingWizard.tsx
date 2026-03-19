import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ArrowRight, ArrowLeft, CheckCircle2, Loader2,
  Smartphone, Tablet, Laptop, Watch, Upload, X, Image as ImageIcon,
  FileText, RefreshCw, CalendarIcon, Info, ChevronDown, Check,
  MapPin, CreditCard, Eye, Sparkles, Monitor, Camera, Gamepad2,
  Printer, Projector, Tv, Headphones, Speaker, HardDrive
} from 'lucide-react';

// ─── Schemas ───────────────────────────────────────────────────
const threeYearsAgo = new Date();
threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

const step1Schema = z.object({
  deviceType: z.string().min(1, 'Device type is required'),
  brand: z.string().min(2, 'Brand must be at least 2 characters'),
  model: z.string().min(2, 'Model must be at least 2 characters'),
  color: z.string().optional(),
  purchaseDate: z.date({ required_error: 'Purchase date is required' })
    .refine(d => d <= new Date(), 'Purchase date cannot be in the future')
    .refine(d => d >= threeYearsAgo, 'Device must be purchased within the last 3 years'),
  serialNumber: z.string().min(1, 'Serial number is required'),
  imeiNumber: z.string().optional().refine(v => !v || /^\d{15}$/.test(v), 'IMEI must be 15 digits'),
});

const step3Schema = z.object({
  planId: z.string().min(1, 'Please select a plan'),
});

const step4Schema = z.object({
  address: z.string().min(10, 'Address must be at least 10 characters'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  whatsappNumber: z.string().regex(/^\d{10}$/, 'WhatsApp number must be 10 digits'),
  warrantyExpiry: z.date().optional(),
  googleLocationPin: z.string().optional(),
});

const step5Schema = z.object({
  agreeToTerms: z.literal(true, { errorMap: () => ({ message: 'You must accept the terms' }) }),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

// ─── Icon mapping for gadget categories ────────────────────────
const CATEGORY_ICON_MAP: Record<string, any> = {
  smartphone: Smartphone, 'mobile phone': Smartphone, mobile: Smartphone, phone: Smartphone,
  tablet: Tablet, laptop: Laptop, smartwatch: Watch, 'smart watch': Watch, watch: Watch,
  desktop: Monitor, computer: Monitor, pc: Monitor,
  cctv: Camera, camera: Camera, dslr: Camera,
  'gaming console': Gamepad2, gaming: Gamepad2,
  printer: Printer, projector: Projector,
  television: Tv, tv: Tv,
  headphones: Headphones, earbuds: Headphones,
  speaker: Speaker, soundbar: Speaker,
};

const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CATEGORY_ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return HardDrive; // default icon
};

const POPULAR_BRANDS = [
  'Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Vivo', 'Oppo', 'Realme',
  'Google', 'Nothing', 'Motorola', 'Nokia', 'Lenovo', 'HP', 'Dell',
  'Asus', 'Acer', 'LG', 'Sony', 'Huawei', 'Poco',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
  'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Jammu & Kashmir', 'Ladakh',
];

const STEPS = [
  { label: 'Device Info', icon: Smartphone },
  { label: 'Proof & Docs', icon: Upload },
  { label: 'Select Plan', icon: Shield },
  { label: 'Address', icon: MapPin },
  { label: 'Review', icon: Eye },
];

const DRAFT_KEY = 'waaz_device_onboarding_draft';

// ─── File Upload Component ─────────────────────────────────────
interface FileUploadProps {
  label: string;
  required?: boolean;
  maxSizeMB: number;
  accept: string;
  file: File | null;
  previewUrl: string | null;
  uploading: boolean;
  error?: string;
  onSelect: (file: File) => void;
  onRemove: () => void;
  onRetry?: () => void;
}

const FileUploadArea = ({ label, required, maxSizeMB, accept, file, previewUrl, uploading, error, onSelect, onRemove, onRetry }: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const f = files[0];
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (f.size > maxBytes) { toast.error(`File must be under ${maxSizeMB}MB`); return; }
    const allowed = accept.split(',').map(a => a.trim());
    if (!allowed.some(a => f.type === a || f.name.toLowerCase().endsWith(a.replace('image/', '.').replace('application/', '.')))) {
      toast.error('Invalid file type'); return;
    }
    onSelect(f);
  };

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label} {required && <span className="text-destructive">*</span>}
        <Tooltip>
          <TooltipTrigger asChild><Info size={14} className="text-muted-foreground cursor-help" /></TooltipTrigger>
          <TooltipContent>Max {maxSizeMB}MB. Accepted: {accept.replace(/image\//g, '').replace(/application\//g, '').toUpperCase()}</TooltipContent>
        </Tooltip>
      </Label>

      {file && previewUrl ? (
        <div className="relative border border-border rounded-lg p-3 bg-muted/30">
          <div className="flex items-center gap-3">
            {file.type.startsWith('image/') ? (
              <img src={previewUrl} alt="Preview" className="h-20 w-20 object-cover rounded-md" />
            ) : (
              <div className="h-20 w-20 bg-muted rounded-md flex items-center justify-center"><FileText size={24} className="text-muted-foreground" /></div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onRemove} disabled={uploading}><X size={16} /></Button>
          </div>
          {uploading && <Progress value={65} className="mt-2 h-1.5" />}
        </div>
      ) : (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
            dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30",
            error && "border-destructive"
          )}
        >
          <Upload size={28} className="mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm font-medium">Drag & drop or click to upload</p>
          <p className="text-xs text-muted-foreground mt-1">Max {maxSizeMB}MB • {accept.replace(/image\//g, '').replace(/application\//g, '').toUpperCase()}</p>
          <input ref={inputRef} type="file" accept={accept} className="hidden" onChange={e => handleFiles(e.target.files)} />
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <span>{error}</span>
          {onRetry && <Button variant="ghost" size="sm" onClick={onRetry} className="h-6 px-2"><RefreshCw size={12} className="mr-1" /> Retry</Button>}
        </div>
      )}
    </div>
  );
};

// ─── Plan Card Component ───────────────────────────────────────
interface Plan {
  id: string;
  name: string;
  code: string;
  annual_price: number;
  covers_hardware_failure: boolean;
  covers_battery: boolean;
  covers_motherboard: boolean;
  covers_accidental_damage: boolean;
  covers_liquid_damage: boolean;
}

const PlanCard = ({ plan, selected, recommended, onSelect }: { plan: Plan; selected: boolean; recommended: boolean; onSelect: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const coverageItems = [
    { label: 'Hardware Failure', covered: plan.covers_hardware_failure, desc: 'Covers manufacturing defects and hardware malfunctions' },
    { label: 'Battery', covered: plan.covers_battery, desc: 'Covers battery degradation and failure' },
    { label: 'Motherboard', covered: plan.covers_motherboard, desc: 'Covers motherboard and circuit issues' },
    { label: 'Accidental Damage', covered: plan.covers_accidental_damage, desc: 'Covers drops, falls, and accidental breakage' },
    { label: 'Liquid Damage', covered: plan.covers_liquid_damage, desc: 'Covers water and liquid spill damage' },
  ];

  return (
    <div
      onClick={onSelect}
      className={cn(
        "relative border rounded-xl p-5 cursor-pointer transition-all",
        selected ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md" : "border-border hover:border-primary/40",
      )}
    >
      {recommended && (
        <span className="absolute -top-3 left-4 inline-flex items-center gap-1 text-xs font-semibold bg-accent text-accent-foreground px-2.5 py-0.5 rounded-full">
          <Sparkles size={12} /> Recommended
        </span>
      )}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-heading font-bold text-lg">{plan.name}</h3>
          <p className="text-xs text-muted-foreground capitalize">{plan.code} Plan</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">₹{Number(plan.annual_price).toLocaleString('en-IN')}</p>
          <p className="text-xs text-muted-foreground">₹{Math.round(Number(plan.annual_price) / 12).toLocaleString('en-IN')}/mo</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {coverageItems.map(c => (
          <span key={c.label} className={cn(
            "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full",
            c.covered ? "bg-success/10 text-success" : "bg-muted text-muted-foreground line-through opacity-60"
          )}>
            {c.covered ? <Check size={10} /> : <X size={10} />} {c.label}
          </span>
        ))}
      </div>
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={e => e.stopPropagation()}>
            What's covered? <ChevronDown size={12} className={cn("ml-1 transition-transform", expanded && "rotate-180")} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-1.5">
          {coverageItems.map(c => (
            <div key={c.label} className={cn("flex items-start gap-2 text-xs p-2 rounded", c.covered ? "bg-success/5" : "bg-muted/50 opacity-60")}>
              {c.covered ? <Check size={12} className="text-success mt-0.5 shrink-0" /> : <X size={12} className="text-muted-foreground mt-0.5 shrink-0" />}
              <div>
                <p className="font-medium">{c.label}</p>
                <p className="text-muted-foreground">{c.desc}</p>
              </div>
            </div>
          ))}
        </CollapsibleContent>
      </Collapsible>
      {selected && (
        <div className="absolute top-3 right-3">
          <CheckCircle2 size={22} className="text-primary" />
        </div>
      )}
    </div>
  );
};

// ─── Main Wizard ───────────────────────────────────────────────
const DeviceOnboardingWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brandSearch, setBrandSearch] = useState('');

  // File state
  const [devicePhoto, setDevicePhoto] = useState<File | null>(null);
  const [devicePhotoPreview, setDevicePhotoPreview] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [receiptError, setReceiptError] = useState('');

  // Forms
  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), mode: 'onTouched' });
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema), mode: 'onTouched' });
  const form4 = useForm<Step4Data>({ resolver: zodResolver(step4Schema), mode: 'onTouched' });

  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [termsError, setTermsError] = useState('');

  // Load categories on mount
  useEffect(() => {
    supabase.from('gadget_categories').select('id, name').eq('is_active', true).order('name')
      .then(({ data }) => setCategories(data || []));
  }, []);

  // Pre-fill from profile
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('phone, company').eq('id', user.id).single().then(({ data }) => {
      if (data?.phone) form4.setValue('whatsappNumber', data.phone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10));
    });
  }, [user]);

  // Load plans when device type changes
  const deviceType = form1.watch('deviceType');
  useEffect(() => {
    if (!deviceType) return;
    // Match device type to a gadget category
    const mapping: Record<string, string[]> = {
      mobile_phone: ['mobile', 'smartphone', 'phone', 'mobile phone'],
      tablet: ['tablet'],
      laptop: ['laptop'],
      smartwatch: ['smartwatch', 'smart watch', 'watch'],
    };
    const matchNames = mapping[deviceType] || [];
    const matched = categories.find(c => matchNames.includes(c.name.toLowerCase()));
    if (matched) {
      supabase.from('subscription_plans').select('*').eq('is_active', true).eq('gadget_category_id', matched.id).order('annual_price')
        .then(({ data }) => {
          if (data?.length) { setPlans(data as Plan[]); }
          else {
            supabase.from('subscription_plans').select('*').eq('is_active', true).is('gadget_category_id', null).order('annual_price')
              .then(({ data: fallback }) => setPlans((fallback || []) as Plan[]));
          }
        });
    } else {
      supabase.from('subscription_plans').select('*').eq('is_active', true).is('gadget_category_id', null).order('annual_price')
        .then(({ data }) => setPlans((data || []) as Plan[]));
    }
  }, [deviceType, categories]);

  // Auto-save draft
  useEffect(() => {
    const interval = setInterval(() => {
      const draft = {
        step1: form1.getValues(),
        step3: form3.getValues(),
        step4: form4.getValues(),
        currentStep: step,
      };
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 5000);
    return () => clearInterval(interval);
  }, [step]);

  // Restore draft
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.step1) {
        Object.entries(draft.step1).forEach(([k, v]) => {
          if (k === 'purchaseDate' && v) form1.setValue(k as any, new Date(v as string));
          else if (v) form1.setValue(k as any, v as any);
        });
      }
      if (draft.step3?.planId) form3.setValue('planId', draft.step3.planId);
      if (draft.step4) Object.entries(draft.step4).forEach(([k, v]) => { if (v) form4.setValue(k as any, v as any); });
    } catch {}
  }, []);

  // File selection handlers
  const handlePhotoSelect = (f: File) => {
    setDevicePhoto(f);
    setDevicePhotoPreview(URL.createObjectURL(f));
    setPhotoError('');
  };
  const handleReceiptSelect = (f: File) => {
    setReceiptFile(f);
    setReceiptPreview(URL.createObjectURL(f));
    setReceiptError('');
  };

  // Upload file to supabase
  const uploadFile = async (file: File, deviceId: string, fileType: string) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${user!.id}/${deviceId}/${fileType}_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('device-proofs').upload(path, file, { contentType: file.type, upsert: true });
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('device-proofs').getPublicUrl(path);
    return urlData.publicUrl;
  };

  // Duplicate serial check
  const checkDuplicateSerial = async (serial: string) => {
    const { data } = await supabase.from('customer_devices').select('id').eq('serial_number', serial).limit(1);
    return (data?.length || 0) > 0;
  };

  // Navigation
  const goNext = async () => {
    if (step === 1) {
      const valid = await form1.trigger();
      if (!valid) return;
      const serial = form1.getValues('serialNumber');
      const dup = await checkDuplicateSerial(serial);
      if (dup) { form1.setError('serialNumber', { message: 'This serial number is already registered' }); return; }
    }
    if (step === 2 && !devicePhoto) { setPhotoError('Device photo is required'); return; }
    if (step === 3) { const valid = await form3.trigger(); if (!valid) return; }
    if (step === 4) { const valid = await form4.trigger(); if (!valid) return; }
    setStep(s => Math.min(s + 1, 5));
  };
  const goBack = () => setStep(s => Math.max(s - 1, 1));

  // Submit
  const handleSubmit = async () => {
    if (!agreeToTerms) { setTermsError('You must accept the terms'); return; }
    if (!user) return;
    setSubmitting(true);

    try {
      const s1 = form1.getValues();
      const s3 = form3.getValues();
      const s4 = form4.getValues();

      // Find matching category
      const mapping: Record<string, string[]> = {
        mobile_phone: ['mobile', 'smartphone', 'phone', 'mobile phone'],
        tablet: ['tablet'], laptop: ['laptop'], smartwatch: ['smartwatch', 'smart watch', 'watch'],
      };
      const matchNames = mapping[s1.deviceType] || [];
      const matched = categories.find(c => matchNames.includes(c.name.toLowerCase()));

      const { data: device, error: insertError } = await supabase.from('customer_devices').insert({
        user_id: user.id,
        gadget_category_id: matched?.id || null,
        subscription_plan_id: s3.planId,
        product_name: `${s1.brand} ${s1.model}`,
        serial_number: s1.serialNumber,
        imei_number: s1.imeiNumber || null,
        whatsapp_number: s4.whatsappNumber,
        address: `${s4.address}, ${s4.city}, ${s4.state} - ${s4.pincode}`,
        google_location_pin: s4.googleLocationPin || null,
        status: 'pending',
        payment_status: 'pending',
      } as any).select('id').single();

      if (insertError) throw insertError;
      const deviceId = device!.id;

      // Upload files
      try {
        setUploadingPhoto(true);
        await uploadFile(devicePhoto!, deviceId, 'device_photo');
        setUploadingPhoto(false);
      } catch {
        setUploadingPhoto(false);
        setPhotoError('Upload failed. You can retry from your dashboard.');
      }

      if (receiptFile) {
        try {
          setUploadingReceipt(true);
          await uploadFile(receiptFile, deviceId, 'purchase_receipt');
          setUploadingReceipt(false);
        } catch {
          setUploadingReceipt(false);
        }
      }

      // Clear draft
      sessionStorage.removeItem(DRAFT_KEY);
      setSubmitted(true);

      // Log activity
      const { logCustomerActivity } = await import('@/services/activityLogService');
      await logCustomerActivity(user.id, 'device_submitted', `Registered device: ${s1.brand} ${s1.model}`, { relatedDeviceId: deviceId });

      toast.success('Device registered successfully! Awaiting admin approval.');

      setTimeout(() => navigate('/customer'), 3000);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedPlan = plans.find(p => p.id === form3.watch('planId'));
  const progressPercent = (step / 5) * 100;

  // ─── Success Screen ───
  if (submitted) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto py-20 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
            <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-success/10 mb-6">
              <CheckCircle2 size={48} className="text-success" />
            </div>
          </motion.div>
          <h1 className="font-heading text-2xl font-bold mb-2">Device Registered!</h1>
          <p className="text-muted-foreground mb-4">Your device has been submitted for approval. You'll receive a notification once it's approved.</p>
          <Loader2 className="animate-spin mx-auto text-muted-foreground" size={20} />
          <p className="text-xs text-muted-foreground mt-2">Redirecting to dashboard...</p>
        </div>
      </DashboardLayout>
    );
  }

  // ─── Wizard UI ───
  const filteredBrands = POPULAR_BRANDS.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary/10 mb-3">
            <Shield size={28} className="text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Register Your Device</h1>
          <p className="text-sm text-muted-foreground">Complete the steps below to activate protection</p>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <Progress value={progressPercent} className="h-2 mb-3" />
          <div className="flex justify-between">
            {STEPS.map((s, i) => {
              const StepIcon = s.icon;
              const isActive = step === i + 1;
              const isDone = step > i + 1;
              return (
                <div key={i} className={cn("flex flex-col items-center gap-1", isActive && "text-primary", isDone && "text-success", !isActive && !isDone && "text-muted-foreground")}>
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                    isActive && "bg-primary text-primary-foreground",
                    isDone && "bg-success text-success-foreground",
                    !isActive && !isDone && "bg-muted text-muted-foreground",
                  )}>
                    {isDone ? <Check size={14} /> : <StepIcon size={14} />}
                  </div>
                  <span className="text-[10px] font-medium hidden sm:block">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* ─── Step 1: Device Information ─── */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2"><Smartphone size={20} className="text-primary" /> Device Information</CardTitle>
                  <CardDescription>Tell us about the device you want to protect</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Device Type */}
                  <div>
                    <Label>Device Type <span className="text-destructive">*</span></Label>
                    <Controller control={form1.control} name="deviceType" render={({ field }) => (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                        {categories.map(cat => {
                          const Icon = getCategoryIcon(cat.name);
                          return (
                            <div
                              key={cat.id}
                              onClick={() => field.onChange(cat.id)}
                              className={cn(
                                "border rounded-lg p-3 text-center cursor-pointer transition-all",
                                field.value === cat.id ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                              )}
                            >
                              <Icon size={24} className="mx-auto mb-1" />
                              <p className="text-xs font-medium">{cat.name}</p>
                            </div>
                          );
                        })}
                      </div>
                    )} />
                    {form1.formState.errors.deviceType && <p className="text-xs text-destructive mt-1">{form1.formState.errors.deviceType.message}</p>}
                  </div>

                  {/* Brand */}
                  <div>
                    <Label>Brand <span className="text-destructive">*</span></Label>
                    <Controller control={form1.control} name="brand" render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select brand..." /></SelectTrigger>
                        <SelectContent>
                          <div className="p-2">
                            <Input placeholder="Search brands..." value={brandSearch} onChange={e => setBrandSearch(e.target.value)} className="h-8 text-sm" />
                          </div>
                          {filteredBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    )} />
                    {form1.formState.errors.brand && <p className="text-xs text-destructive mt-1">{form1.formState.errors.brand.message}</p>}
                  </div>

                  {/* Model */}
                  <div>
                    <Label htmlFor="model">Model <span className="text-destructive">*</span></Label>
                    <Input id="model" {...form1.register('model')} placeholder="e.g. iPhone 15 Pro" className="mt-1" />
                    {form1.formState.errors.model && <p className="text-xs text-destructive mt-1">{form1.formState.errors.model.message}</p>}
                  </div>

                  {/* Color */}
                  <div>
                    <Label htmlFor="color">Color <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input id="color" {...form1.register('color')} placeholder="e.g. Space Black" className="mt-1" />
                  </div>

                  {/* Purchase Date */}
                  <div>
                    <Label>Purchase Date <span className="text-destructive">*</span></Label>
                    <Controller control={form1.control} name="purchaseDate" render={({ field }) => (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className={cn("w-full mt-1 justify-start text-left font-normal", !field.value && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? format(field.value, 'PPP') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={d => d > new Date() || d < threeYearsAgo}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    )} />
                    {form1.formState.errors.purchaseDate && <p className="text-xs text-destructive mt-1">{form1.formState.errors.purchaseDate.message}</p>}
                  </div>

                  {/* Serial Number */}
                  <div>
                    <Label htmlFor="serial">Serial Number <span className="text-destructive">*</span></Label>
                    <Input id="serial" {...form1.register('serialNumber')} placeholder="Enter device serial number" className="mt-1" />
                    {form1.formState.errors.serialNumber && <p className="text-xs text-destructive mt-1">{form1.formState.errors.serialNumber.message}</p>}
                  </div>

                  {/* IMEI (mobile only) */}
                  {(deviceType === 'mobile_phone' || deviceType === 'tablet') && (
                    <div>
                      <Label htmlFor="imei">IMEI Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input id="imei" {...form1.register('imeiNumber')} placeholder="15-digit IMEI" maxLength={15} className="mt-1" />
                      <p className="text-xs text-muted-foreground mt-1">Dial *#06# on your phone to find IMEI</p>
                      {form1.formState.errors.imeiNumber && <p className="text-xs text-destructive mt-1">{form1.formState.errors.imeiNumber.message}</p>}
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button onClick={goNext}>Next <ArrowRight size={16} className="ml-1" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Step 2: Proof & Documentation ─── */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2"><Upload size={20} className="text-primary" /> Proof & Documentation</CardTitle>
                  <CardDescription>Upload photos for verification</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FileUploadArea
                    label="Device Photo"
                    required
                    maxSizeMB={5}
                    accept="image/jpeg,image/png,image/webp"
                    file={devicePhoto}
                    previewUrl={devicePhotoPreview}
                    uploading={uploadingPhoto}
                    error={photoError}
                    onSelect={handlePhotoSelect}
                    onRemove={() => { setDevicePhoto(null); setDevicePhotoPreview(null); }}
                    onRetry={() => setPhotoError('')}
                  />
                  <FileUploadArea
                    label="Purchase Receipt"
                    maxSizeMB={10}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    file={receiptFile}
                    previewUrl={receiptPreview}
                    uploading={uploadingReceipt}
                    error={receiptError}
                    onSelect={handleReceiptSelect}
                    onRemove={() => { setReceiptFile(null); setReceiptPreview(null); }}
                  />
                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={goBack}><ArrowLeft size={16} className="mr-1" /> Back</Button>
                    <Button onClick={goNext}>Next <ArrowRight size={16} className="ml-1" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Step 3: Plan Selection ─── */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2"><Shield size={20} className="text-primary" /> Select Your Plan</CardTitle>
                  <CardDescription>Choose the protection plan that fits your needs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {plans.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No plans available for this device type.</p>
                  ) : (
                    <Controller control={form3.control} name="planId" render={({ field }) => (
                      <div className="space-y-4">
                        {plans.map((plan, i) => (
                          <PlanCard
                            key={plan.id}
                            plan={plan}
                            selected={field.value === plan.id}
                            recommended={plans.length > 1 && i === plans.length - 1}
                            onSelect={() => field.onChange(plan.id)}
                          />
                        ))}
                      </div>
                    )} />
                  )}
                  {form3.formState.errors.planId && <p className="text-xs text-destructive">{form3.formState.errors.planId.message}</p>}
                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={goBack}><ArrowLeft size={16} className="mr-1" /> Back</Button>
                    <Button onClick={goNext} disabled={!form3.watch('planId')}>Next <ArrowRight size={16} className="ml-1" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Step 4: Address & Details ─── */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2"><MapPin size={20} className="text-primary" /> Delivery Address</CardTitle>
                  <CardDescription>Where should we send your protection plan documents?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Full Address <span className="text-destructive">*</span></Label>
                    <Textarea id="address" {...form4.register('address')} placeholder="House/Flat number, Street, Landmark..." className="mt-1" rows={3} />
                    {form4.formState.errors.address && <p className="text-xs text-destructive mt-1">{form4.formState.errors.address.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="city">City <span className="text-destructive">*</span></Label>
                      <Input id="city" {...form4.register('city')} placeholder="City" className="mt-1" />
                      {form4.formState.errors.city && <p className="text-xs text-destructive mt-1">{form4.formState.errors.city.message}</p>}
                    </div>
                    <div>
                      <Label htmlFor="pincode">Pincode <span className="text-destructive">*</span></Label>
                      <Input id="pincode" {...form4.register('pincode')} placeholder="6 digits" maxLength={6} className="mt-1" />
                      {form4.formState.errors.pincode && <p className="text-xs text-destructive mt-1">{form4.formState.errors.pincode.message}</p>}
                    </div>
                  </div>

                  <div>
                    <Label>State <span className="text-destructive">*</span></Label>
                    <Controller control={form4.control} name="state" render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select state..." /></SelectTrigger>
                        <SelectContent>
                          {INDIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    )} />
                    {form4.formState.errors.state && <p className="text-xs text-destructive mt-1">{form4.formState.errors.state.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp Number <span className="text-destructive">*</span></Label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">+91</span>
                      <Input id="whatsapp" {...form4.register('whatsappNumber')} placeholder="10 digit number" maxLength={10} className="flex-1" />
                    </div>
                    {form4.formState.errors.whatsappNumber && <p className="text-xs text-destructive mt-1">{form4.formState.errors.whatsappNumber.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor="gpin">Google Maps Link <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input id="gpin" {...form4.register('googleLocationPin')} placeholder="Paste Google Maps link" className="mt-1" />
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={goBack}><ArrowLeft size={16} className="mr-1" /> Back</Button>
                    <Button onClick={goNext}>Review <ArrowRight size={16} className="ml-1" /></Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ─── Step 5: Review & Confirm ─── */}
          {step === 5 && (
            <motion.div key="s5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="font-heading text-lg flex items-center gap-2"><Eye size={20} className="text-primary" /> Review & Confirm</CardTitle>
                  <CardDescription>Please review all details before submitting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Device Info */}
                  <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                    <h3 className="text-sm font-heading font-semibold flex items-center gap-2"><Smartphone size={14} /> Device Information</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{DEVICE_TYPES.find(d => d.value === form1.getValues('deviceType'))?.label}</span>
                      <span className="text-muted-foreground">Brand:</span><span>{form1.getValues('brand')}</span>
                      <span className="text-muted-foreground">Model:</span><span>{form1.getValues('model')}</span>
                      {form1.getValues('color') && <><span className="text-muted-foreground">Color:</span><span>{form1.getValues('color')}</span></>}
                      <span className="text-muted-foreground">Purchased:</span><span>{form1.getValues('purchaseDate') ? format(form1.getValues('purchaseDate'), 'PPP') : '—'}</span>
                      <span className="text-muted-foreground">Serial:</span><span className="font-mono text-xs">{form1.getValues('serialNumber')}</span>
                      {form1.getValues('imeiNumber') && <><span className="text-muted-foreground">IMEI:</span><span className="font-mono text-xs">{form1.getValues('imeiNumber')}</span></>}
                    </div>
                  </div>

                  {/* Device Photo Preview */}
                  {devicePhotoPreview && (
                    <div className="bg-muted/40 rounded-lg p-4">
                      <h3 className="text-sm font-heading font-semibold flex items-center gap-2 mb-2"><ImageIcon size={14} /> Device Photo</h3>
                      <img src={devicePhotoPreview} alt="Device" className="h-32 rounded-lg object-cover" />
                    </div>
                  )}

                  {/* Plan */}
                  {selectedPlan && (
                    <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                      <h3 className="text-sm font-heading font-semibold flex items-center gap-2"><Shield size={14} /> Selected Plan</h3>
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{selectedPlan.name}</span>
                        <span className="text-lg font-bold text-primary">₹{Number(selectedPlan.annual_price).toLocaleString('en-IN')}/yr</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { l: 'Hardware', v: selectedPlan.covers_hardware_failure },
                          { l: 'Battery', v: selectedPlan.covers_battery },
                          { l: 'Motherboard', v: selectedPlan.covers_motherboard },
                          { l: 'Accidental', v: selectedPlan.covers_accidental_damage },
                          { l: 'Liquid', v: selectedPlan.covers_liquid_damage },
                        ].map(c => (
                          <span key={c.l} className={cn("text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1", c.v ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                            {c.v ? <Check size={10} /> : <X size={10} />} {c.l}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  <div className="bg-muted/40 rounded-lg p-4 space-y-2">
                    <h3 className="text-sm font-heading font-semibold flex items-center gap-2"><MapPin size={14} /> Address & Contact</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                      <span className="text-muted-foreground">Address:</span><span className="col-span-1">{form4.getValues('address')}</span>
                      <span className="text-muted-foreground">City:</span><span>{form4.getValues('city')}</span>
                      <span className="text-muted-foreground">State:</span><span>{form4.getValues('state')}</span>
                      <span className="text-muted-foreground">Pincode:</span><span>{form4.getValues('pincode')}</span>
                      <span className="text-muted-foreground">WhatsApp:</span><span>+91 {form4.getValues('whatsappNumber')}</span>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="flex items-start gap-3 p-4 border rounded-lg">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(v) => { setAgreeToTerms(v === true); setTermsError(''); }}
                    />
                    <div>
                      <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                        I agree to the Terms & Conditions and Privacy Policy
                      </label>
                      <p className="text-xs text-muted-foreground mt-0.5">By submitting, you confirm all provided information is accurate.</p>
                      {termsError && <p className="text-xs text-destructive mt-1">{termsError}</p>}
                    </div>
                  </div>

                  <div className="flex justify-between pt-2">
                    <Button variant="outline" onClick={goBack}><ArrowLeft size={16} className="mr-1" /> Back</Button>
                    <Button onClick={handleSubmit} disabled={submitting} className="min-w-[140px]">
                      {submitting ? <><Loader2 size={16} className="animate-spin mr-1" /> Submitting...</> : <><CheckCircle2 size={16} className="mr-1" /> Submit Registration</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default DeviceOnboardingWizard;
