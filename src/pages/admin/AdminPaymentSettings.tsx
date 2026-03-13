import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, QrCode, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminPaymentSettings = () => {
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('payment_settings' as any)
        .select('setting_value')
        .eq('setting_key', 'upi_qr_url')
        .maybeSingle();
      if (data) setQrUrl((data as any).setting_value || '');
      setLoading(false);
    };
    fetch();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File too large (max 5MB)'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `upi-qr-${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from('payment-assets').upload(path, file, { upsert: true });
    if (error) {
      toast.error('Upload failed');
      setUploading(false);
      return;
    }

    const { data: publicUrl } = supabase.storage.from('payment-assets').getPublicUrl(path);
    setQrUrl(publicUrl.publicUrl);
    setUploading(false);
    toast.success('QR code uploaded');
  };

  const handleSave = async () => {
    setSaving(true);
    // Upsert the setting
    const { data: existing } = await supabase
      .from('payment_settings' as any)
      .select('id')
      .eq('setting_key', 'upi_qr_url')
      .maybeSingle();

    if (existing) {
      await supabase
        .from('payment_settings' as any)
        .update({ setting_value: qrUrl, updated_at: new Date().toISOString() } as any)
        .eq('setting_key', 'upi_qr_url');
    } else {
      await supabase
        .from('payment_settings' as any)
        .insert({ setting_key: 'upi_qr_url', setting_value: qrUrl } as any);
    }

    setSaving(false);
    toast.success('Payment settings saved');
  };

  const handleRemove = () => {
    setQrUrl('');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={24} /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
            <QrCode size={24} className="text-primary" />
            Payment Settings
          </h1>
          <p className="text-muted-foreground text-sm">Configure UPI QR code for customer payments</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">UPI QR Code</CardTitle>
            <CardDescription>Upload a UPI QR code image that customers will scan to make payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {qrUrl ? (
              <div className="text-center space-y-3">
                <div className="inline-block border-2 border-border rounded-xl p-3 bg-white">
                  <img src={qrUrl} alt="UPI QR Code" className="w-48 h-48 object-contain" />
                </div>
                <div className="flex justify-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleRemove}>
                    <Trash2 size={14} className="mr-1" /> Remove
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                    <Upload size={14} className="mr-1" /> Replace
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
              >
                {uploading ? (
                  <Loader2 size={32} className="animate-spin mx-auto text-primary" />
                ) : (
                  <>
                    <Upload size={32} className="mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground">Click to upload UPI QR code image</p>
                    <p className="text-xs text-muted-foreground/60">PNG, JPG up to 5MB</p>
                  </>
                )}
              </div>
            )}

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />

            <div>
              <Label>QR Code URL</Label>
              <Input value={qrUrl} onChange={e => setQrUrl(e.target.value)} placeholder="Or paste a direct URL to QR code image" className="mt-1" />
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving && <Loader2 size={14} className="animate-spin mr-1" />}
              <Save size={14} className="mr-1" /> Save Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminPaymentSettings;
