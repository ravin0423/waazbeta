import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Ticket, Plus, Upload, X, Clock, CheckCircle, AlertCircle, Loader2, MessageSquare, Send, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: any }> = {
  open: { label: 'Open', variant: 'secondary', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'default', icon: AlertCircle },
  resolved: { label: 'Resolved', variant: 'outline', icon: CheckCircle },
  closed: { label: 'Closed', variant: 'destructive', icon: CheckCircle },
};

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

const CustomerTickets = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');

  // Conversation state
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchTickets = async () => {
    let query = supabase
      .from('service_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, [filter]);

  // Real-time subscription for ticket updates and messages
  useEffect(() => {
    const channel = supabase
      .channel('customer-tickets-rt')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'service_tickets',
      }, () => {
        fetchTickets();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_messages',
      }, (payload) => {
        const newMsg = payload.new as TicketMessage;
        if (selectedTicket && newMsg.ticket_id === selectedTicket.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_role !== 'customer') {
            toast.info('New reply from support!');
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedTicket]);

  const fetchMessages = async (ticketId: string) => {
    setLoadingMessages(true);
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setMessages((data as TicketMessage[]) || []);
    setLoadingMessages(false);
  };

  const openConversation = (ticket: any) => {
    setSelectedTicket(ticket);
    setNewMessage('');
    fetchMessages(ticket.id);
  };

  const handleSendMessage = async () => {
    if (!user || !selectedTicket || !newMessage.trim()) return;
    setSendingMessage(true);
    const { error } = await supabase.from('ticket_messages').insert({
      ticket_id: selectedTicket.id,
      sender_id: user.id,
      sender_role: 'customer',
      message: newMessage.trim(),
    });
    setSendingMessage(false);
    if (error) { toast.error('Failed to send message'); return; }
    setNewMessage('');
    fetchMessages(selectedTicket.id);
    // Reopen ticket if it was resolved/closed
    if (selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') {
      await supabase.from('service_tickets').update({ status: 'open', updated_at: new Date().toISOString() }).eq('id', selectedTicket.id);
      fetchTickets();
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);

    const imageUrls: string[] = [];
    for (const file of images) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data } = await supabase.storage.from('ticket-images').upload(path, file);
      if (data) {
        const { data: urlData } = supabase.storage.from('ticket-images').getPublicUrl(data.path);
        imageUrls.push(urlData.publicUrl);
      }
    }

    const { error } = await supabase.from('service_tickets').insert({
      user_id: user.id,
      subject,
      description,
      priority,
      image_urls: imageUrls,
    });

    setSubmitting(false);
    if (error) { toast.error('Failed to submit ticket'); return; }

    setSubject(''); setDescription(''); setPriority('medium'); setImages([]); setPreviews([]);
    setOpen(false);

    // Log activity
    const { logCustomerActivity } = await import('@/services/activityLogService');
    await logCustomerActivity(user.id, 'support_ticket', `Created support ticket: ${subject}`);

    toast.success('Service ticket created successfully!');
    fetchTickets();
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
                <Button type="submit" disabled={submitting} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                  {submitting ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
                  Submit Ticket
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={24} /></CardContent></Card>
        ) : tickets.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Ticket size={40} className="text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No tickets yet. Click "New Ticket" to create one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map(ticket => {
              const sc = statusConfig[ticket.status] || statusConfig.open;
              const Icon = sc.icon;
              return (
                <Card key={ticket.id} className="shadow-card hover:border-primary/30 transition-colors cursor-pointer" onClick={() => openConversation(ticket)}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-foreground">{ticket.subject}</span>
                          <Badge variant={sc.variant} className="text-xs">
                            <Icon size={12} className="mr-1" /> {sc.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{ticket.priority}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{ticket.description}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground">{format(new Date(ticket.created_at), 'dd MMM yyyy HH:mm')}</p>
                          <button className="text-xs text-primary flex items-center gap-1 hover:underline" onClick={e => { e.stopPropagation(); openConversation(ticket); }}>
                            <MessageSquare size={12} /> View Conversation
                          </button>
                        </div>
                      </div>
                      {ticket.image_urls?.length > 0 && (
                        <div className="flex gap-1">
                          {ticket.image_urls.map((url: string, i: number) => (
                            <img key={i} src={url} alt="" className="w-12 h-12 rounded border border-border object-cover" />
                          ))}
                        </div>
                      )}
                    </div>
                    {ticket.admin_response && (
                      <div className="mt-3 p-2 rounded bg-muted/50 text-sm text-muted-foreground">
                        <span className="font-medium">Admin Response:</span> {ticket.admin_response}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Conversation Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-heading text-base truncate pr-6">
              {selectedTicket?.subject}
            </DialogTitle>
            {selectedTicket && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={statusConfig[selectedTicket.status]?.variant || 'secondary'} className="text-xs">
                  {selectedTicket.status.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="text-xs">{selectedTicket.priority}</Badge>
              </div>
            )}
          </DialogHeader>

          {selectedTicket && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Original ticket description */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border mb-3">
                <p className="text-sm">{selectedTicket.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(selectedTicket.created_at), 'dd MMM yyyy HH:mm')}</p>
                {selectedTicket.image_urls?.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {selectedTicket.image_urls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt="" className="h-14 w-14 rounded-md object-cover border border-border" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages thread */}
              <ScrollArea className="flex-1 min-h-0 max-h-[300px] pr-2">
                {loadingMessages ? (
                  <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" size={20} /></div>
                ) : messages.length === 0 && !selectedTicket.admin_response ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
                    No messages yet. Start the conversation below.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Legacy admin_response as first message if exists and no messages yet */}
                    {selectedTicket.admin_response && messages.length === 0 && (
                      <div className="flex gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Shield size={14} className="text-primary" />
                        </div>
                        <div className="flex-1 bg-primary/10 rounded-lg p-3 border border-primary/20">
                          <p className="text-xs font-medium text-primary mb-1">Admin</p>
                          <p className="text-sm">{selectedTicket.admin_response}</p>
                        </div>
                      </div>
                    )}
                    {messages.map(msg => {
                      const isCustomer = msg.sender_role === 'customer';
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isCustomer ? 'flex-row-reverse' : ''}`}>
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isCustomer ? 'gradient-primary' : 'bg-primary/20'}`}>
                            {isCustomer ? (
                              <span className="text-xs font-bold text-primary-foreground">{user?.fullName?.charAt(0) || 'Y'}</span>
                            ) : (
                              <Shield size={14} className="text-primary" />
                            )}
                          </div>
                          <div className={`flex-1 max-w-[80%] rounded-lg p-3 border ${isCustomer ? 'bg-accent/50 border-accent ml-auto' : 'bg-primary/10 border-primary/20'}`}>
                            <p className={`text-xs font-medium mb-1 ${isCustomer ? 'text-accent-foreground' : 'text-primary'}`}>
                              {isCustomer ? 'You' : 'Admin'}
                            </p>
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">{format(new Date(msg.created_at), 'dd MMM, HH:mm')}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>

              {/* Reply input */}
              {selectedTicket.status !== 'closed' && (
                <div className="flex items-end gap-2 mt-3 pt-3 border-t border-border">
                  <Textarea
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    placeholder="Type your reply..."
                    rows={2}
                    className="flex-1 resize-none"
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={sendingMessage || !newMessage.trim()}
                    className="gradient-primary text-primary-foreground hover:opacity-90 h-10 w-10 shrink-0"
                  >
                    {sendingMessage ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </Button>
                </div>
              )}
              {selectedTicket.status === 'closed' && (
                <p className="text-xs text-muted-foreground text-center mt-3 pt-3 border-t border-border">This ticket is closed.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default CustomerTickets;
