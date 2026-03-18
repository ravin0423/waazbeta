import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

const ClaimSubmissionForm = ({ onClose, onSubmit }: { onClose: () => void; onSubmit: () => void }) => {
  const [imei, setImei] = useState('');
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 2) {
      toast.error('Maximum 2 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files].slice(0, 2));
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));
  const canSubmit = imei.length === 15 && issueType && description.trim().length >= 10;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload images
      const imageUrls: string[] = [];
      for (const file of images) {
        const ext = file.name.split('.').pop();
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage.from('claim-images').upload(path, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('claim-images').getPublicUrl(path);
        imageUrls.push(urlData.publicUrl);
      }

      // Find matching device
      const { data: devices } = await supabase
        .from('customer_devices')
        .select('id')
        .eq('user_id', user.id)
        .eq('imei_number', imei)
        .limit(1);

      const { error } = await supabase.from('service_claims').insert({
        user_id: user.id,
        imei_number: imei,
        issue_type: issueType,
        description,
        image_urls: imageUrls,
        device_id: devices?.[0]?.id || null,
      });

      if (error) throw error;

      // Log activity
      const { logCustomerActivity } = await import('@/services/activityLogService');
      await logCustomerActivity(user.id, 'claim_submitted', `Submitted claim: ${issueType}`, { relatedDeviceId: devices?.[0]?.id });

      toast.success('Claim submitted successfully! Our admin team will review it shortly.');
      onSubmit();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit claim');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
      <Card className="shadow-card border-primary/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-lg">Submit New Claim</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}><X size={18} /></Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Device IMEI</label>
            <Input
              placeholder="Enter 15-digit IMEI number"
              value={imei}
              onChange={e => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
              maxLength={15}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">Dial *#06# on your phone to find the IMEI.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Issue Type</label>
            <Select value={issueType} onValueChange={setIssueType}>
              <SelectTrigger><SelectValue placeholder="Select issue type" /></SelectTrigger>
              <SelectContent>
                {ISSUE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description</label>
            <Textarea
              placeholder="Describe the issue in detail (min 10 characters)..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
            />
          </div>

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

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSubmit} disabled={!canSubmit || submitting} className="flex-1">
              {submitting ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Submit Claim
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ClaimSubmissionForm;
