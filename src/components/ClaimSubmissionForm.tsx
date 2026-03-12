import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { customerDevices } from '@/data/mockData';
import { ShieldCheck, ShieldAlert, ShieldX, Upload, X, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

type FraudRisk = 'clear' | 'warning' | 'blocked';

interface IMEIVerification {
  verified: boolean;
  status: FraudRisk;
  matchedDevice: typeof customerDevices[0] | null;
  flags: string[];
}

const ISSUE_TYPES = [
  'Hardware Failure',
  'Battery Issue',
  'Motherboard Failure',
  'Accidental Damage',
  'Liquid Damage',
  'Screen Damage',
  'Charging Issue',
  'Other',
];

// Simulated blacklisted/suspicious IMEIs for demo
const BLACKLISTED_IMEIS = ['000000000000000', '111111111111111'];
const SUSPICIOUS_PATTERNS = ['123456'];

const verifyIMEI = (imei: string): IMEIVerification => {
  const flags: string[] = [];
  
  // Check format (15 digits)
  if (!/^\d{15}$/.test(imei)) {
    return { verified: false, status: 'blocked', matchedDevice: null, flags: ['Invalid IMEI format — must be exactly 15 digits'] };
  }

  // Luhn check for IMEI
  const luhnCheck = (num: string): boolean => {
    let sum = 0;
    for (let i = 0; i < num.length; i++) {
      let digit = parseInt(num[i], 10);
      if (i % 2 === 1) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
    }
    return sum % 10 === 0;
  };

  if (!luhnCheck(imei)) {
    flags.push('IMEI fails Luhn checksum validation');
  }

  // Blacklist check
  if (BLACKLISTED_IMEIS.includes(imei)) {
    return { verified: false, status: 'blocked', matchedDevice: null, flags: ['IMEI is blacklisted — reported stolen or lost'] };
  }

  // Suspicious pattern
  if (SUSPICIOUS_PATTERNS.some(p => imei.includes(p))) {
    flags.push('IMEI contains suspicious repeating pattern');
  }

  // Match against registered devices
  const matchedDevice = customerDevices.find(d => d.imei === imei && d.customerId === 'c1');

  if (!matchedDevice) {
    flags.push('IMEI not found in your registered devices');
    return { verified: false, status: 'blocked', matchedDevice: null, flags };
  }

  // Check subscription status
  if (matchedDevice.status === 'expired') {
    flags.push('Device subscription has expired');
    return { verified: true, status: 'blocked', matchedDevice, flags };
  }

  // Duplicate claim check (simulated)
  const recentClaimOnDevice = Math.random() > 0.7; // 30% chance for demo
  if (recentClaimOnDevice) {
    flags.push('A claim was filed for this device in the last 30 days — potential duplicate');
  }

  const status: FraudRisk = flags.length > 0 ? 'warning' : 'clear';
  return { verified: true, status, matchedDevice, flags };
};

const ClaimSubmissionForm = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) => {
  const [imei, setImei] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<IMEIVerification | null>(null);
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleVerifyIMEI = useCallback(() => {
    setVerifying(true);
    setVerification(null);
    // Simulate API call
    setTimeout(() => {
      const result = verifyIMEI(imei);
      setVerification(result);
      setVerifying(false);
    }, 1200);
  }, [imei]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 2) {
      toast.error('Maximum 2 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files].slice(0, 2));
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
  };

  const canSubmit = verification?.status !== 'blocked' && verification?.verified && issueType && description.trim().length >= 10;

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      toast.success('Claim submitted successfully! You will receive updates via email.');
      onSubmit();
    }, 1500);
  };

  const riskConfig = {
    clear: { icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10', border: 'border-success/30', label: 'IMEI Verified — No Issues Found' },
    warning: { icon: ShieldAlert, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30', label: 'IMEI Verified — Warnings Detected' },
    blocked: { icon: ShieldX, color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30', label: 'Verification Failed — Cannot Proceed' },
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
      <Card className="shadow-card border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-lg">Submit New Claim</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={18} />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Step 1: IMEI Verification */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Step 1: Verify Device IMEI</label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter 15-digit IMEI number"
                value={imei}
                onChange={e => {
                  setImei(e.target.value.replace(/\D/g, '').slice(0, 15));
                  setVerification(null);
                }}
                maxLength={15}
                className="font-mono"
              />
              <Button
                onClick={handleVerifyIMEI}
                disabled={imei.length !== 15 || verifying}
                className="shrink-0"
              >
                {verifying ? <Loader2 size={16} className="animate-spin mr-1" /> : <ShieldCheck size={16} className="mr-1" />}
                Verify
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Dial *#06# on your phone to find the IMEI</p>
          </div>

          {/* Verification Result */}
          <AnimatePresence>
            {verification && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                {(() => {
                  const config = riskConfig[verification.status];
                  const Icon = config.icon;
                  return (
                    <Alert className={`${config.bg} ${config.border} border`}>
                      <Icon size={18} className={config.color} />
                      <AlertTitle className={`${config.color} font-semibold`}>{config.label}</AlertTitle>
                      <AlertDescription>
                        {verification.matchedDevice && (
                          <div className="mt-2 p-2 rounded bg-background/60 text-xs space-y-1">
                            <p><span className="text-muted-foreground">Device:</span> {verification.matchedDevice.brand} {verification.matchedDevice.model}</p>
                            <p><span className="text-muted-foreground">Plan:</span> {verification.matchedDevice.subscriptionPlanId === 'sp2' ? 'WaaZ+ Complete Care' : 'WaaZ Standard Care'}</p>
                            <p><span className="text-muted-foreground">Status:</span> <span className={verification.matchedDevice.status === 'active' ? 'text-success font-medium' : 'text-destructive font-medium'}>{verification.matchedDevice.status.toUpperCase()}</span></p>
                          </div>
                        )}
                        {verification.flags.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {verification.flags.map((flag, i) => (
                              <div key={i} className="flex items-start gap-2 text-xs">
                                <AlertTriangle size={12} className="text-warning shrink-0 mt-0.5" />
                                <span>{flag}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {verification.status === 'clear' && (
                          <div className="flex items-center gap-1 mt-2 text-xs text-success">
                            <CheckCircle2 size={12} /> All fraud checks passed
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 2: Claim Details (only if IMEI verified) */}
          {verification && verification.status !== 'blocked' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-2 border-t border-border">
              <label className="text-sm font-medium text-foreground">Step 2: Claim Details</label>
              
              <Select value={issueType} onValueChange={setIssueType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  {ISSUE_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                placeholder="Describe the issue in detail (min 10 characters)..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
              />

              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Upload Images (max 2)</label>
                <div className="flex gap-3 items-center">
                  {images.map((img, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-lg border border-border overflow-hidden bg-muted">
                      <img src={URL.createObjectURL(img)} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {images.length < 2 && (
                    <label className="w-20 h-20 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors bg-muted/30">
                      <Upload size={18} className="text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground mt-1">Add</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
                <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="flex-1">
                  {submitting ? <><Loader2 size={16} className="animate-spin mr-1" /> Submitting...</> : 'Submit Claim'}
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ClaimSubmissionForm;
