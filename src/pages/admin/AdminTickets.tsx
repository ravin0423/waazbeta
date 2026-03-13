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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Ticket, Search, MessageSquare, Loader2, Image } from 'lucide-react';
import { motion } from 'framer-motion';

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
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileRow>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState<TicketRow | null>(null);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_tickets')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { toast.error('Failed to load tickets'); setLoading(false); return; }
    setTickets(data || []);

    // Fetch profiles for all unique user_ids
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

  const handleManage = (ticket: TicketRow) => {
    setSelected(ticket);
    setResponse(ticket.admin_response || '');
    setNewStatus(ticket.status);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const { error } = await supabase
      .from('service_tickets')
      .update({
        status: newStatus,
        admin_response: response || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selected.id);
    setSaving(false);
    if (error) { toast.error('Failed to update ticket'); return; }
    toast.success('Ticket updated');
    setSelected(null);
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
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
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
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
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
                            <Badge variant="outline" className={priorityColors[ticket.priority] || ''}>
                              {ticket.priority}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className={statusColors[ticket.status] || ''}>
                              {ticket.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(ticket.created_at).toLocaleDateString('en-IN')}
                          </td>
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

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading">Manage Ticket</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium">{selected.subject}</p>
                <p className="text-sm text-muted-foreground mt-1">{selected.description}</p>
              </div>

              {selected.image_urls && selected.image_urls.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                    <Image size={12} /> Attachments
                  </Label>
                  <div className="flex gap-2">
                    {selected.image_urls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                        <img src={url} alt={`Attachment ${i + 1}`} className="h-16 w-16 rounded-md object-cover border border-border" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Admin Response</Label>
                <Textarea
                  value={response}
                  onChange={e => setResponse(e.target.value)}
                  placeholder="Type your response to the customer..."
                  rows={4}
                />
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground hover:opacity-90">
                {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : <MessageSquare size={16} className="mr-2" />}
                Save Response
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminTickets;
