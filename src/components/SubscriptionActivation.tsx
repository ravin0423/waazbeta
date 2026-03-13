import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, ArrowRight, ArrowLeft, CheckCircle2, Loader2, Smartphone, MapPin, CreditCard, Banknote, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface Plan {
  id: string;
  name: string;
  annual_price: number;
  code: string;
  covers_hardware_failure: boolean;
  covers_battery: boolean;
  covers_motherboard: boolean;
  covers_accidental_damage: boolean;
  covers_liquid_damage: boolean;
}

const MOBILE_CATEGORY_NAMES = ['mobile', 'smartphone', 'phone', 'mobile phone'];

const SubscriptionActivation = ({ onActivated }: { onActivated: () => void }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [imeiNumber, setImeiNumber] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [address, setAddress] = useState('');
  const [googlePin, setGooglePin] = useState('');

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | ''>('');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);
  const isMobile = selectedCategory ? MOBILE_CATEGORY_NAMES.includes(selectedCategory.name.toLowerCase()) : false;
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  useEffect(() => {
    const fetchData = async () => {
      const [catRes, settingsRes] = await Promise.all([
        supabase.from('gadget_categories').select('id, name, icon').eq('is_active', true).order('name'),
        supabase.from('payment_settings' as any).select('setting_key, setting_value').eq('setting_key', 'upi_qr_url'),
      ]);
      setCategories(catRes.data || []);
      const settings = (settingsRes.data as any[]) || [];
      const qr = settings.find((s: any) => s.setting_key === 'upi_qr_url');
      if (qr) setUpiQrUrl(qr.setting_value);
      setLoading(false);
    };
    fetchData();
    if (user?.phone) setPhoneNumber(user.phone);
  }, []);

  useEffect(() => {
    if (!selectedCategoryId) { setPlans([]); return; }
    const fetchPlans = async () => {
      const { data: categoryPlans } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .eq('gadget_category_id', selectedCategoryId)
        .order('annual_price');
      
      if (categoryPlans && categoryPlans.length > 0) {
        setPlans(categoryPlans);
      } else {
        const { data: universalPlans } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .is('gadget_category_id', null)
          .order('annual_price');
        setPlans(universalPlans || []);
      }
    };
    fetchPlans();
  }, [selectedCategoryId]);

  const canGoStep2 = selectedCategoryId && selectedPlanId;
  const canGoStep3 = serialNumber.trim().length > 0 && (!isMobile || imeiNumber.trim().length > 0);
  const canGoStep4 = phoneNumber.trim().length > 0 && whatsappNumber.trim().length > 0 && address.trim().length > 0;
  const canSubmit = paymentMethod === 'cash' || (paymentMethod === 'upi' && upiTransactionId.trim().length > 0);

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);

    if (phoneNumber.trim()) {
      await supabase.from('profiles').update({ phone: phoneNumber.trim() }).eq('id', user.id);
    }

    const { error } = await supabase.from('customer_devices').insert({
      user_id: user.id,
      gadget_category_id: selectedCategoryId,
      subscription_plan_id: selectedPlanId,
      product_name: selectedCategory?.name || '',
      serial_number: serialNumber.trim(),
      imei_number: isMobile ? imeiNumber.trim() : null,
      whatsapp_number: whatsappNumber.trim(),
      address: address.trim(),
      google_location_pin: googlePin.trim() || null,
      status: 'pending',
      payment_method: paymentMethod,
      upi_transaction_id: paymentMethod === 'upi' ? upiTransactionId.trim() : null,
      payment_status: paymentMethod === 'upi' ? 'submitted' : 'pending',
    } as any);
    setSubmitting(false);
    if (error) {
      toast.error('Failed to submit. Please try again.');
      return;
    }
    toast.success('Subscription activation request submitted! Awaiting admin approval.');
    onActivated();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    );
  }

  const totalSteps = 4;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
          <Shield size={32} className="text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-bold mb-1">Activate Your Subscription</h1>
        <p className="text-muted-foreground">Follow the steps below to register your device and activate protection</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className="flex items-center gap-2">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
              step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}>
              {step > s ? <CheckCircle2 size={16} /> : s}
            </div>
            {s < totalSteps && <div className={`w-8 h-0.5 ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-lg">Step 1: Select Product & Plan</CardTitle>
                <CardDescription>Choose your device category and protection plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Product Category</Label>
                  <Select value={selectedCategoryId} onValueChange={(v) => { setSelectedCategoryId(v); setSelectedPlanId(''); }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select product type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCategoryId && plans.length > 0 && (
                  <div>
                    <Label>Protection Plan</Label>
                    <div className="grid gap-3 mt-2">
                      {plans.map(plan => (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedPlanId === plan.id
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                              : 'border-border hover:border-primary/40'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-heading font-semibold">{plan.name}</h3>
                            <span className="text-lg font-bold text-primary">₹{Number(plan.annual_price).toLocaleString('en-IN')}<span className="text-xs font-normal text-muted-foreground">/yr</span></span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {plan.covers_hardware_failure && <span className="bg-success/10 text-success px-2 py-0.5 rounded">Hardware</span>}
                            {plan.covers_battery && <span className="bg-success/10 text-success px-2 py-0.5 rounded">Battery</span>}
                            {plan.covers_motherboard && <span className="bg-success/10 text-success px-2 py-0.5 rounded">Motherboard</span>}
                            {plan.covers_accidental_damage && <span className="bg-success/10 text-success px-2 py-0.5 rounded">Accidental</span>}
                            {plan.covers_liquid_damage && <span className="bg-success/10 text-success px-2 py-0.5 rounded">Liquid</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCategoryId && plans.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No plans available for this category yet.</p>
                )}

                <div className="flex justify-end pt-2">
                  <Button onClick={() => setStep(2)} disabled={!canGoStep2}>
                    Next <ArrowRight size={16} className="ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <Smartphone size={20} className="text-primary" />
                  Step 2: Device Details
                </CardTitle>
                <CardDescription>Enter your {selectedCategory?.name || 'device'} identification numbers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="serial">Serial Number *</Label>
                  <Input
                    id="serial"
                    value={serialNumber}
                    onChange={e => setSerialNumber(e.target.value)}
                    placeholder="Enter device serial number"
                    className="mt-1"
                  />
                </div>

                {isMobile && (
                  <div>
                    <Label htmlFor="imei">IMEI Number *</Label>
                    <Input
                      id="imei"
                      value={imeiNumber}
                      onChange={e => setImeiNumber(e.target.value)}
                      placeholder="Enter 15-digit IMEI number"
                      maxLength={15}
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Dial *#06# on your phone to find IMEI</p>
                  </div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft size={16} className="mr-1" /> Back
                  </Button>
                  <Button onClick={() => setStep(3)} disabled={!canGoStep3}>
                    Next <ArrowRight size={16} className="ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <MapPin size={20} className="text-primary" />
                  Step 3: Contact & Location
                </CardTitle>
                <CardDescription>Your email ({user?.email}) is already linked to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email (from login)</Label>
                  <Input id="email" value={user?.email || ''} disabled className="mt-1 bg-muted" />
                </div>

                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp">WhatsApp Number *</Label>
                  <Input
                    id="whatsapp"
                    value={whatsappNumber}
                    onChange={e => setWhatsappNumber(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="address">Address *</Label>
                  <Textarea
                    id="address"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Enter your full address"
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="gpin">Google Maps Location Pin (optional)</Label>
                  <Input
                    id="gpin"
                    value={googlePin}
                    onChange={e => setGooglePin(e.target.value)}
                    placeholder="Paste Google Maps link or plus code"
                    className="mt-1"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    <ArrowLeft size={16} className="mr-1" /> Back
                  </Button>
                  <Button onClick={() => setStep(4)} disabled={!canGoStep4}>
                    Next <ArrowRight size={16} className="ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-lg flex items-center gap-2">
                  <CreditCard size={20} className="text-primary" />
                  Step 4: Payment
                </CardTitle>
                <CardDescription>Choose your payment method and complete the payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-1 text-sm">
                  <p className="font-heading font-semibold mb-2">Order Summary</p>
                  <p><span className="text-muted-foreground">Product:</span> {selectedCategory?.name}</p>
                  <p><span className="text-muted-foreground">Plan:</span> {selectedPlan?.name}</p>
                  <p><span className="text-muted-foreground">Serial:</span> {serialNumber}</p>
                  {isMobile && <p><span className="text-muted-foreground">IMEI:</span> {imeiNumber}</p>}
                  <div className="border-t border-border mt-2 pt-2">
                    <p className="text-base font-bold">Amount: <span className="text-primary">₹{Number(selectedPlan?.annual_price || 0).toLocaleString('en-IN')}</span>/yr</p>
                  </div>
                </div>

                {/* Payment method selection */}
                <div>
                  <Label className="mb-2 block">Select Payment Method *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setPaymentMethod('upi')}
                      className={`border rounded-lg p-4 cursor-pointer transition-all text-center ${
                        paymentMethod === 'upi'
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <QrCode size={28} className="mx-auto mb-2 text-primary" />
                      <p className="font-semibold text-sm">UPI Payment</p>
                      <p className="text-xs text-muted-foreground">Pay via UPI QR code</p>
                    </div>
                    <div
                      onClick={() => setPaymentMethod('cash')}
                      className={`border rounded-lg p-4 cursor-pointer transition-all text-center ${
                        paymentMethod === 'cash'
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <Banknote size={28} className="mx-auto mb-2 text-primary" />
                      <p className="font-semibold text-sm">Cash Payment</p>
                      <p className="text-xs text-muted-foreground">Pay in cash to admin</p>
                    </div>
                  </div>
                </div>

                {/* UPI flow */}
                {paymentMethod === 'upi' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {upiQrUrl ? (
                      <div className="text-center">
                        <p className="text-sm font-medium mb-3">Scan QR code to pay ₹{Number(selectedPlan?.annual_price || 0).toLocaleString('en-IN')}</p>
                        <div className="inline-block border-2 border-border rounded-xl p-3 bg-white">
                          <img src={upiQrUrl} alt="UPI QR Code" className="w-48 h-48 object-contain" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">UPI QR code not configured yet. Please contact admin or choose cash payment.</p>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="upi_txn">UPI Transaction ID / Reference Number *</Label>
                      <Input
                        id="upi_txn"
                        value={upiTransactionId}
                        onChange={e => setUpiTransactionId(e.target.value)}
                        placeholder="e.g. 425614789632"
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Enter the transaction ID from your UPI payment confirmation</p>
                    </div>
                  </motion.div>
                )}

                {/* Cash flow */}
                {paymentMethod === 'cash' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-accent/50 border border-accent rounded-lg p-4 text-sm">
                      <p className="font-semibold mb-1">💵 Cash Payment Selected</p>
                      <p className="text-muted-foreground">
                        Your subscription will be activated once the admin confirms receipt of ₹{Number(selectedPlan?.annual_price || 0).toLocaleString('en-IN')} cash payment. You will receive a notification once approved.
                      </p>
                    </div>
                  </motion.div>
                )}

                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(3)}>
                    <ArrowLeft size={16} className="mr-1" /> Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                    {submitting ? <Loader2 size={16} className="animate-spin mr-1" /> : <CheckCircle2 size={16} className="mr-1" />}
                    Submit Activation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubscriptionActivation;
