import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Ticket, Search, MessageSquare, Loader2, Image, Send, Shield, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface TicketRow {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  admin_response: string | null;
  image_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  message: string;
  created_at: string;
}

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  closed: 'bg-muted text-muted-foreground border-border',
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-yellow-500/20 text-yellow-400',
  high: 'bg-orange-500/20 text-orange-400',
  urgent: 'bg-red-500/20 text-red-400',
};

const AdminTickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Conversation state
  const [selected, setSelected] = useState<TicketRow | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load tickets'); setLoading(false); return; }
    setTickets(data || []);

    const userIds = [...new Set((data || []).map(t => t.user_id))];
    if (userIds.length > 0) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      const map: Record<string, ProfileRow> = {};
      (profileData || []).forEach(p => { map[p.id] = p; });
      setProfiles(map);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTickets(); }, []);

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

  const handleManage = (ticket: TicketRow) => {
    setSelected(ticket);
    setNewStatus(ticket.status);
    setNewMessage('');
    fetchMessages(ticket.id);
  };

  const handleSendMessage = async () => {
    if (!user || !selected || !newMessage.trim()) return;
    setSendingMessage(true);
    const { error } = await supabase.from('ticket_messages').insert({
      ticket_id: selected.id,
      sender_id: user.id,
      sender_role: 'admin',
      message: newMessage.trim(),
    });
    setSendingMessage(false);
    if (error) { toast.error('Failed to send message'); return; }
    setNewMessage('');
    fetchMessages(selected.id);
  };

  const handleStatusUpdate = async () => {
    if (!selected) return;
    setSavingStatus(true);
    const { error } = await supabase
      .from('service_tickets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', selected.id);
    setSavingStatus(false);
    if (error) { toast.error('Failed to update status'); return; }
    toast.success('Status updated');
    setSelected({ ...selected, status: newStatus });
    fetchTickets();
  };

  const filtered = tickets.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const profile = profiles[t.user_id];
      return t.subject.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        profile?.full_name?.toLowerCase().includes(q) ||
        profile?.email?.toLowerCase().includes(q);
    }
    return true;
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-heading text-2xl font-bold">Support Tickets</h1>
            <p className="text-muted-foreground">Manage customer support requests</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({counts.all})</SelectItem>
                <SelectItem value="open">Open ({counts.open})</SelectItem>
                <SelectItem value="in_progress">In Progress ({counts.in_progress})</SelectItem>
                <SelectItem value="resolved">Resolved ({counts.resolved})</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Ticket size={40} className="mb-3 opacity-40" />
                <p>No support tickets found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="text-left p-4 font-medium">Customer</th>
                      <th className="text-left p-4 font-medium">Subject</th>
                      <th className="text-left p-4 font-medium">Priority</th>
                      <th className="text-left p-4 font-medium">Status</th>
                      <th className="text-left p-4 font-medium">Created</th>
                      <th className="text-left p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(ticket => {
                      const profile = profiles[ticket.user_id];
                      return (
                        <tr key={ticket.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <p className="font-medium">{profile?.full_name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">{profile?.email || ''}</p>
                          </td>
                          <td className="p-4 max-w-[250px]">
                            <p className="truncate font-medium">{ticket.subject}</p>
                            <p className="text-xs text-muted-foreground truncate">{ticket.description}</p>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className={priorityColors[ticket.priority] || ''}>{ticket.priority}</Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className={statusColors[ticket.status] || ''}>{ticket.status.replace('_', ' ')}</Badge>
                          </td>
                          <td className="p-4 text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString('en-IN')}</td>
                          <td className="p-4">
                            <Button size="sm" variant="outline" onClick={() => handleManage(ticket)}>
                              <MessageSquare size={14} className="mr-1" /> Respond
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Conversation Dialog */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-heading text-base truncate pr-6">{selected?.subject}</DialogTitle>
            {selected && (
              <p className="text-xs text-muted-foreground">
                {profiles[selected.user_id]?.full_name} • {profiles[selected.user_id]?.email}
              </p>
            )}
          </DialogHeader>

          {selected && (
            <div className="flex flex-col flex-1 min-h-0">
              {/* Status control */}
              <div className="flex items-center gap-2 mb-3">
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                {newStatus !== selected.status && (
                  <Button size="sm" variant="outline" onClick={handleStatusUpdate} disabled={savingStatus} className="h-8 text-xs">
                    {savingStatus ? <Loader2 size={12} className="mr-1 animate-spin" /> : null}
                    Update Status
                  </Button>
                )}
              </div>

              {/* Original ticket */}
              <div className="p-3 rounded-lg bg-muted/30 border border-border mb-3">
                <p className="text-sm">{selected.description}</p>
                <p className="text-xs text-muted-foreground mt-1">{format(new Date(selected.created_at), 'dd MMM yyyy HH:mm')}</p>
                {selected.image_urls && selected.image_urls.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {selected.image_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Attachment ${i + 1}`} className="h-14 w-14 rounded-md object-cover border border-border" />
                      </a>
                    ))}
                  </div>
                )}
              </div>

              {/* Messages thread */}
              <ScrollArea className="flex-1 min-h-0 max-h-[250px] pr-2">
                {loadingMessages ? (
                  <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" size={20} /></div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-6 text-sm text-muted-foreground">
                    <MessageSquare size={24} className="mx-auto mb-2 opacity-40" />
                    No conversation yet. Send a reply below.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map(msg => {
                      const isAdmin = msg.sender_role === 'admin';
                      return (
                        <div key={msg.id} className={`flex gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                          <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${isAdmin ? 'bg-primary/20' : 'gradient-primary'}`}>
                            {isAdmin ? <Shield size={14} className="text-primary" /> : <User size={14} className="text-primary-foreground" />}
                          </div>
                          <div className={`flex-1 max-w-[80%] rounded-lg p-3 border ${isAdmin ? 'bg-primary/10 border-primary/20 ml-auto' : 'bg-accent/50 border-accent'}`}>
                            <p className={`text-xs font-medium mb-1 ${isAdmin ? 'text-primary' : 'text-accent-foreground'}`}>
                              {isAdmin ? 'You (Admin)' : profiles[msg.sender_id]?.full_name || 'Customer'}
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
              <div className="flex items-end gap-2 mt-3 pt-3 border-t border-border">
                <Textarea
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type your reply to the customer..."
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminTickets;
