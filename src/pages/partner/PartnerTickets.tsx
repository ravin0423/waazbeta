import { useState, useEffect, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Loader2, Ticket, Plus, Send, MessageSquare, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type TicketFilter = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed';

const PRIORITY_MAP: Record<string, { label: string; class: string }> = {
  high: { label: 'High', class: 'bg-destructive text-destructive-foreground' },
  medium: { label: 'Medium', class: 'border-amber-500 text-amber-600' },
  low: { label: 'Low', class: 'border-blue-500 text-blue-600' },
};

const STATUS_MAP: Record<string, { label: string; class: string; icon: any }> = {
  open: { label: 'Open', class: 'bg-destructive text-destructive-foreground', icon: AlertCircle },
  in_progress: { label: 'In Progress', class: 'bg-primary text-primary-foreground', icon: Clock },
  resolved: { label: 'Resolved', class: 'bg-emerald-600 text-white', icon: CheckCircle2 },
  closed: { label: 'Closed', class: 'bg-muted text-muted-foreground', icon: CheckCircle2 },
};

const PartnerTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TicketFilter>('all');

  // Detail sheet
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create dialog
  const [showCreate, setShowCreate] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [creating, setCreating] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    let query = supabase
      .from('service_tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data } = await query;
    setTickets(data || []);
    setLoading(false);
  }, [user, filter]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Real-time
  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel('partner-tickets-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_tickets' }, (payload) => {
        const row = (payload.new as any);
        if (row?.user_id === user.id) fetchTickets();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages' }, (payload) => {
        const row = (payload.new as any);
        if (selectedTicket && row?.ticket_id === selectedTicket.id) {
          fetchMessages(selectedTicket.id);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, selectedTicket, fetchTickets]);

  const fetchMessages = async (ticketId: string) => {
    const { data } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const openTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
    await fetchMessages(ticket.id);
  };

  const createTicket = async () => {
    if (!newSubject.trim() || !newDescription.trim()) {
      toast.error('Subject and description are required');
      return;
    }
    if (!user) return;
    setCreating(true);
    try {
      const { error } = await supabase.from('service_tickets').insert({
        user_id: user.id,
        subject: newSubject.trim(),
        description: newDescription.trim(),
        priority: newPriority,
        status: 'open',
      });
      if (error) throw error;
      toast.success('Ticket created successfully');
      setShowCreate(false);
      setNewSubject('');
      setNewDescription('');
      setNewPriority('medium');
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create ticket');
    } finally {
      setCreating(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || !user) return;
    setSending(true);
    try {
      const { error } = await supabase.from('ticket_messages').insert({
        ticket_id: selectedTicket.id,
        sender_id: user.id,
        sender_role: 'partner',
        message: newMessage.trim(),
      });
      if (error) throw error;

      // If ticket was resolved/closed, reopen it
      if (selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') {
        await supabase.from('service_tickets').update({ status: 'open', updated_at: new Date().toISOString() }).eq('id', selectedTicket.id);
        setSelectedTicket({ ...selectedTicket, status: 'open' });
        fetchTickets();
      }

      setNewMessage('');
      await fetchMessages(selectedTicket.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const updateTicketStatus = async (newStatus: string) => {
    if (!selectedTicket) return;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('service_tickets')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', selectedTicket.id);
      if (error) throw error;
      setSelectedTicket({ ...selectedTicket, status: newStatus });
      toast.success(`Ticket status updated to ${STATUS_MAP[newStatus]?.label || newStatus}`);
      fetchTickets();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filterCounts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  // For "all" filter, we need unfiltered count
  const allTicketsForCount = filter === 'all' ? tickets : [];

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold mb-1">Support Tickets</h1>
            <p className="text-muted-foreground">Create and track support requests</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2">
            <Plus size={16} /> New Ticket
          </Button>
        </div>

        {loading ? (
          <Card className="shadow-card"><CardContent className="p-12 text-center"><Loader2 className="animate-spin text-primary mx-auto" size={24} /></CardContent></Card>
        ) : (
          <>
            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              {(['all', 'open', 'in_progress', 'resolved', 'closed'] as TicketFilter[]).map(f => (
                <Button
                  key={f}
                  variant={filter === f ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : STATUS_MAP[f]?.label || f}
                </Button>
              ))}
            </div>

            {/* Ticket List */}
            {tickets.length === 0 ? (
              <Card className="shadow-card">
                <CardContent className="p-12 text-center">
                  <Ticket size={40} className="text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No tickets found. Create one to get started.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {tickets.map(ticket => {
                  const status = STATUS_MAP[ticket.status] || STATUS_MAP.open;
                  const priority = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.medium;
                  return (
                    <Card
                      key={ticket.id}
                      className="shadow-card cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openTicket(ticket)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{ticket.subject}</p>
                            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{ticket.description}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Created {format(new Date(ticket.created_at), 'dd MMM yyyy, HH:mm')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className={priority.class}>{priority.label}</Badge>
                            <Badge className={status.class}>{status.label}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Ticket Detail Sheet */}
      <Sheet open={!!selectedTicket} onOpenChange={(open) => { if (!open) setSelectedTicket(null); }}>
        <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
          <div className="p-6 pb-3 border-b">
            <SheetHeader>
              <SheetTitle className="text-left">{selectedTicket?.subject}</SheetTitle>
              <SheetDescription className="text-left">
                {selectedTicket?.description}
              </SheetDescription>
            </SheetHeader>
            <div className="flex items-center gap-2 mt-3">
              <Badge className={STATUS_MAP[selectedTicket?.status]?.class || ''}>
                {STATUS_MAP[selectedTicket?.status]?.label || selectedTicket?.status}
              </Badge>
              <Badge variant="outline" className={PRIORITY_MAP[selectedTicket?.priority]?.class || ''}>
                {PRIORITY_MAP[selectedTicket?.priority]?.label || selectedTicket?.priority}
              </Badge>
              <span className="text-xs text-muted-foreground ml-auto">
                {selectedTicket && format(new Date(selectedTicket.created_at), 'dd MMM yyyy')}
              </span>
            </div>

            {/* Status Update */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm font-medium">Status:</span>
              <Select value={selectedTicket?.status || 'open'} onValueChange={updateTicketStatus} disabled={updatingStatus}>
                <SelectTrigger className="w-[160px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8">
                <MessageSquare size={32} className="mx-auto mb-2 opacity-50" />
                No messages yet. Start the conversation below.
              </div>
            )}
            {messages.map(msg => {
              const isPartner = msg.sender_role === 'partner';
              return (
                <div key={msg.id} className={`flex ${isPartner ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${isPartner ? 'bg-primary text-primary-foreground' : 'bg-card border'}`}>
                    <p className="text-xs font-medium mb-1 opacity-80">
                      {isPartner ? 'You' : msg.sender_role === 'admin' ? 'Admin' : 'Customer'}
                    </p>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-xs mt-1 ${isPartner ? 'opacity-60' : 'text-muted-foreground'}`}>
                      {format(new Date(msg.created_at), 'HH:mm, dd MMM')}
                    </p>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-4 border-t bg-background">
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={2}
                className="resize-none"
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              />
              <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} className="shrink-0 self-end">
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Create Ticket Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Brief description of the issue"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={newPriority} onValueChange={setNewPriority}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Describe the issue in detail..."
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={createTicket} disabled={creating}>
              {creating ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default PartnerTickets;
