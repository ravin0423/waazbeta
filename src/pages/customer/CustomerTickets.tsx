import { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Ticket, Plus, Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const CustomerTickets = () => {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<string>('medium');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 2) { toast.error('Maximum 2 images allowed'); return; }
    const newImages = [...images, ...files].slice(0, 2);
    setImages(newImages);
    setPreviews(newImages.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (idx: number) => {
    setImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubject(''); setDescription(''); setPriority('medium'); setImages([]); setPreviews([]);
    setOpen(false);
    toast.success('Service ticket created successfully!');
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold mb-1">Service Tickets</h1>
            <p className="text-muted-foreground">Submit and track support requests</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground hover:opacity-90">
                <Plus size={16} className="mr-2" /> New Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">Create Service Ticket</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief summary of your issue" required />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your issue in detail..." rows={4} required />
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Attach Images (max 2)</Label>
                  <div className="flex gap-3">
                    {previews.map((src, i) => (
                      <div key={i} className="relative h-20 w-20 rounded-lg overflow-hidden border border-border">
                        <img src={src} alt="" className="h-full w-full object-cover" />
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {images.length < 2 && (
                      <label className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <Upload size={18} className="text-muted-foreground" />
                        <span className="text-xs text-muted-foreground mt-1">Upload</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>
                </div>
                <Button type="submit" className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                  Submit Ticket
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Ticket size={40} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No tickets yet. Click "New Ticket" to create one.</p>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
};

export default CustomerTickets;
