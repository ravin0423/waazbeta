import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { differenceInDays, addDays, format } from 'date-fns';
import {
  Shield, Check, X, Loader2, CheckCircle2, ArrowRight,
  CreditCard, QrCode, Banknote, Sparkles, Clock, AlertTriangle
} from 'lucide-react';

interface DeviceData {
  id: string;
  product_name: string;
  serial_number: string;
  subscription_plan_id: string | null;
  subscription_end: string | null;
  subscription_start: string | null;
  auto_renew: boolean;
  status: string;
  gadget_category_id: string | null;
  subscription_plans?: {
    id: string;
    name: string;
    code: string;
    annual_price: number;
    covers_hardware_failure: boolean;
    covers_battery: boolean;
    covers_motherboard: boolean;
    covers_accidental_damage: boolean;
    covers_liquid_damage: boolean;
  } | null;
}

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

interface RenewalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  device: DeviceData;
  onRenewed: () => void;
}

const RenewalModal = ({ open, onOpenChange, device, onRenewed }: RenewalModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'plan' | 'payment' | 'success'>('plan');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState(device.subscription_plan_id || '');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | ''>('');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [upiQrUrl, setUpiQrUrl] = useState('');
  const [autoRenew, setAutoRenew] = useState(device.auto_renew);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const currentPlan = device.subscription_plans;
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const isUpgrade = selectedPlanId !== device.subscription_plan_id;

  // Calculate remaining days and expiry status
  const subscriptionEnd = device.subscription_end ? new Date(device.subscription_end) : null;
  const today = new Date();
  const daysRemaining = subscriptionEnd ? differenceInDays(subscriptionEnd, today) : 0;
  const isExpired = subscriptionEnd ? subscriptionEnd < today : false;
  const isExpiringSoon = !isExpired && daysRemaining <= 30;

  // Pro-rata calculation for mid-year upgrade
  const getUpgradePrice = () => {
    if (!selectedPlan || !currentPlan || !isUpgrade || isExpired) return Number(selectedPlan?.annual_price || 0);
    if (daysRemaining <= 0) return Number(selectedPlan.annual_price);
    const priceDiff = Number(selectedPlan.annual_price) - Number(currentPlan.annual_price);
    if (priceDiff <= 0) return Number(selectedPlan.annual_price); // downgrade = full price next year
    const proRata = Math.round((priceDiff / 365) * daysRemaining);
    return proRata;
  };

  const renewalPrice = isUpgrade && !isExpired ? getUpgradePrice() : Number(selectedPlan?.annual_price || 0);

  useEffect(() => {
    if (!open) return;
    setStep('plan');
    setSelectedPlanId(device.subscription_plan_id || '');
    setPaymentMethod('');
    setUpiTransactionId('');
    setAgreeToTerms(false);
    setAutoRenew(device.auto_renew);

    const fetchData = async () => {
      setLoading(true);
      const categoryId = device.gadget_category_id;

      // Fetch plans
      let planData: Plan[] = [];
      if (categoryId) {
        const { data } = await supabase.from('subscription_plans').select('*').eq('is_active', true).eq('gadget_category_id', categoryId).order('annual_price');
        planData = (data || []) as Plan[];
      }
      if (!planData.length) {
        const { data } = await supabase.from('subscription_plans').select('*').eq('is_active', true).is('gadget_category_id', null).order('annual_price');
        planData = (data || []) as Plan[];
      }
      setPlans(planData);

      // Fetch UPI QR
      const { data: settings } = await supabase.from('payment_settings').select('setting_key, setting_value').eq('setting_key', 'upi_qr_url');
      const qr = (settings as any[])?.find((s: any) => s.setting_key === 'upi_qr_url');
      if (qr) setUpiQrUrl(qr.setting_value);

      setLoading(false);
    };
    fetchData();
  }, [open, device]);

  const handleSubmit = async () => {
    if (!agreeToTerms) { toast.error('Please accept the terms'); return; }
    if (!paymentMethod) { toast.error('Please select a payment method'); return; }
    if (paymentMethod === 'upi' && !upiTransactionId.trim()) { toast.error('Please enter UPI transaction ID'); return; }
    if (!user || !selectedPlan) return;

    setSubmitting(true);
    try {
      // Calculate new end date
      const baseDate = isExpired ? today : (subscriptionEnd || today);
      const newEndDate = addDays(baseDate, 365);

      // Update device
      const { error: updateError } = await supabase.from('customer_devices').update({
        subscription_plan_id: selectedPlanId,
        subscription_end: format(newEndDate, 'yyyy-MM-dd'),
        subscription_start: isExpired ? format(today, 'yyyy-MM-dd') : (device.subscription_start || format(today, 'yyyy-MM-dd')),
        auto_renew: autoRenew,
        payment_method: paymentMethod,
        upi_transaction_id: paymentMethod === 'upi' ? upiTransactionId.trim() : null,
        payment_status: paymentMethod === 'upi' ? 'submitted' : 'pending',
        status: 'active',
      } as any).eq('id', device.id);

      if (updateError) throw updateError;

      // Record history
      await supabase.from('subscription_history').insert({
        device_id: device.id,
        user_id: user.id,
        old_plan_id: device.subscription_plan_id,
        new_plan_id: selectedPlanId,
        old_end_date: device.subscription_end,
        new_end_date: format(newEndDate, 'yyyy-MM-dd'),
        amount_paid: renewalPrice,
        payment_method: paymentMethod,
        upi_transaction_id: paymentMethod === 'upi' ? upiTransactionId.trim() : null,
        renewal_type: isUpgrade ? 'upgrade' : 'renewal',
      } as any);

      setStep('success');
      toast.success(isUpgrade ? 'Plan upgraded successfully!' : 'Subscription renewed successfully!');

      setTimeout(() => {
        onOpenChange(false);
        onRenewed();
      }, 2500);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process renewal');
    } finally {
      setSubmitting(false);
    }
  };

  const coverageItems = (plan: Plan) => [
    { label: 'Hardware Failure', covered: plan.covers_hardware_failure },
    { label: 'Battery', covered: plan.covers_battery },
    { label: 'Motherboard', covered: plan.covers_motherboard },
    { label: 'Accidental Damage', covered: plan.covers_accidental_damage },
    { label: 'Liquid Damage', covered: plan.covers_liquid_damage },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="animate-spin text-primary" size={28} /></div>
        ) : step === 'success' ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-success/10 mb-4">
              <CheckCircle2 size={36} className="text-success" />
            </div>
            <h2 className="font-heading text-xl font-bold mb-2">{isUpgrade ? 'Plan Upgraded!' : 'Subscription Renewed!'}</h2>
            <p className="text-sm text-muted-foreground">Your protection continues seamlessly.</p>
          </div>
        ) : step === 'plan' ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <Shield size={20} className="text-primary" />
                {isExpired ? 'Renew Your Subscription' : 'Renew or Upgrade'}
              </DialogTitle>
              <DialogDescription>
                {device.product_name} • {device.serial_number}
              </DialogDescription>
            </DialogHeader>

            {/* Expiry status banner */}
            <div className={cn(
              "rounded-lg p-3 text-sm flex items-center gap-2",
              isExpired ? "bg-destructive/10 text-destructive" : isExpiringSoon ? "bg-warning/10 text-warning" : "bg-success/10 text-success"
            )}>
              {isExpired ? <AlertTriangle size={16} /> : <Clock size={16} />}
              {isExpired
                ? `Expired ${subscriptionEnd ? format(subscriptionEnd, 'PPP') : ''}`
                : `${daysRemaining} days remaining — expires ${subscriptionEnd ? format(subscriptionEnd, 'PPP') : ''}`
              }
            </div>

            {/* Current plan */}
            {currentPlan && (
              <div className="bg-muted/40 rounded-lg p-3 space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Current Plan</p>
                <p className="font-heading font-semibold">{currentPlan.name} <span className="text-primary">₹{Number(currentPlan.annual_price).toLocaleString('en-IN')}/yr</span></p>
                <div className="flex flex-wrap gap-1">
                  {coverageItems(currentPlan as Plan).map(c => (
                    <span key={c.label} className={cn("text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5",
                      c.covered ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                    )}>
                      {c.covered ? <Check size={8} /> : <X size={8} />} {c.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Plan selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">{isExpired ? 'Select Plan' : 'Renew or Upgrade'}</Label>
              {plans.map(plan => {
                const isCurrentPlan = plan.id === device.subscription_plan_id;
                const isSelected = plan.id === selectedPlanId;
                const isUpgradePlan = currentPlan && Number(plan.annual_price) > Number(currentPlan.annual_price);

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={cn(
                      "relative border rounded-lg p-3 cursor-pointer transition-all",
                      isSelected ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                    )}
                  >
                    {isUpgradePlan && !isExpired && (
                      <span className="absolute -top-2 right-3 inline-flex items-center gap-0.5 text-[10px] font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-full">
                        <Sparkles size={10} /> Upgrade
                      </span>
                    )}
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-heading font-semibold text-sm">{plan.name}</p>
                        {isCurrentPlan && <span className="text-[10px] text-muted-foreground">Current plan</span>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">₹{Number(plan.annual_price).toLocaleString('en-IN')}<span className="text-xs font-normal text-muted-foreground">/yr</span></p>
                        <p className="text-[10px] text-muted-foreground">₹{Math.round(Number(plan.annual_price) / 12).toLocaleString('en-IN')}/mo</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {coverageItems(plan).map(c => (
                        <span key={c.label} className={cn("text-[10px] px-1.5 py-0.5 rounded-full inline-flex items-center gap-0.5",
                          c.covered ? "bg-success/10 text-success" : "bg-muted text-muted-foreground line-through opacity-50"
                        )}>
                          {c.covered ? <Check size={8} /> : <X size={8} />} {c.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price summary */}
            {selectedPlan && (
              <div className="bg-muted/40 rounded-lg p-3 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isUpgrade && !isExpired ? 'Pro-rata upgrade cost' : 'Renewal price'}</span>
                  <span className="font-bold text-primary">₹{renewalPrice.toLocaleString('en-IN')}</span>
                </div>
                {isUpgrade && !isExpired && daysRemaining > 0 && (
                  <p className="text-[10px] text-muted-foreground">Calculated for {daysRemaining} remaining days of your current term</p>
                )}
              </div>
            )}

            {/* Auto-renew toggle */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">Auto-renew</p>
                <p className="text-xs text-muted-foreground">Automatically renew 7 days before expiry</p>
              </div>
              <Switch checked={autoRenew} onCheckedChange={setAutoRenew} />
            </div>

            <Button onClick={() => setStep('payment')} disabled={!selectedPlanId} className="w-full">
              Continue to Payment <ArrowRight size={16} className="ml-1" />
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <CreditCard size={20} className="text-primary" /> Payment
              </DialogTitle>
              <DialogDescription>
                {selectedPlan?.name} — ₹{renewalPrice.toLocaleString('en-IN')}
              </DialogDescription>
            </DialogHeader>

            {/* Payment method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  onClick={() => setPaymentMethod('upi')}
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-all text-center",
                    paymentMethod === 'upi' ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                  )}
                >
                  <QrCode size={24} className="mx-auto mb-1 text-primary" />
                  <p className="text-sm font-medium">UPI</p>
                </div>
                <div
                  onClick={() => setPaymentMethod('cash')}
                  className={cn(
                    "border rounded-lg p-4 cursor-pointer transition-all text-center",
                    paymentMethod === 'cash' ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                  )}
                >
                  <Banknote size={24} className="mx-auto mb-1 text-primary" />
                  <p className="text-sm font-medium">Cash</p>
                </div>
              </div>
            </div>

            {paymentMethod === 'upi' && (
              <div className="space-y-3">
                {upiQrUrl && (
                  <div className="text-center">
                    <img src={upiQrUrl} alt="UPI QR" className="mx-auto h-40 w-40 rounded-lg border" />
                    <p className="text-xs text-muted-foreground mt-1">Scan to pay ₹{renewalPrice.toLocaleString('en-IN')}</p>
                  </div>
                )}
                <div>
                  <Label htmlFor="upi-txn">UPI Transaction ID *</Label>
                  <Input
                    id="upi-txn"
                    value={upiTransactionId}
                    onChange={e => setUpiTransactionId(e.target.value)}
                    placeholder="Enter 12-digit UPI transaction ID"
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'cash' && (
              <p className="text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg">
                Cash payment will be collected by our partner. Your renewal will be activated after payment confirmation by admin.
              </p>
            )}

            {/* Terms */}
            <div className="flex items-start gap-3 p-3 border rounded-lg">
              <Checkbox id="renewal-terms" checked={agreeToTerms} onCheckedChange={v => setAgreeToTerms(v === true)} />
              <label htmlFor="renewal-terms" className="text-xs cursor-pointer">
                I agree to the Terms & Conditions. I confirm the payment details are correct and understand the renewal terms.
              </label>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('plan')} className="flex-1">Back</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !paymentMethod || !agreeToTerms || (paymentMethod === 'upi' && !upiTransactionId.trim())}
                className="flex-1"
              >
                {submitting ? <><Loader2 size={16} className="animate-spin mr-1" /> Processing...</> : <>Confirm Renewal</>}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RenewalModal;
