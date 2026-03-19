import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Copy, Phone, MessageCircle, AlertTriangle, Star,
  CheckCircle2, Clock, Search, UserCheck, Wrench, ShieldCheck,
  Package, CircleCheckBig, MapPin, ChevronDown, ChevronUp,
  Send, CalendarIcon, CalendarClock, Award, Timer, TrendingUp
} from 'lucide-react';

const STAGES = [
  { key: 'pending', label: 'Submitted', icon: Clock, color: 'text-info' },
  { key: 'in_progress', label: 'In Review', icon: Search, color: 'text-warning' },
  { key: 'approved', label: 'Approved', icon: UserCheck, color: 'text-success' },
  { key: 'assigned', label: 'Assigned to Partner', icon: UserCheck, color: 'text-purple-500' },
  { key: 'in_repair', label: 'In Repair', icon: Wrench, color: 'text-accent' },
  { key: 'quality_check', label: 'Quality Check', icon: ShieldCheck, color: 'text-warning' },
  { key: 'ready_for_delivery', label: 'Ready for Delivery', icon: Package, color: 'text-success' },
  { key: 'resolved', label: 'Completed', icon: CircleCheckBig, color: 'text-success' },
];

const getStageIndex = (status: string) => {
  const idx = STAGES.findIndex(s => s.key === status);
  return idx === -1 ? 0 : idx;
};

const getProgressPercent = (status: string) => {
  const idx = getStageIndex(status);
  return Math.round(((idx + 1) / STAGES.length) * 100);
};

const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

const ClaimDetailPage = () => {
  const { claimId } = useParams<{ claimId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [claim, setClaim] = useState<any>(null);
  const [updates, setUpdates] = useState<any[]>([]);
  const [partner, setPartner] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [expandedTimeline, setExpandedTimeline] = useState(true);

  // Messaging state
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scheduling state
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>();
  const [scheduleTime, setScheduleTime] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [schedule, setSchedule] = useState<any>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!claimId) return;

    const [claimRes, updatesRes, messagesRes, scheduleRes] = await Promise.all([
      supabase.from('service_claims').select('*').eq('id', claimId).single(),
      supabase.from('claim_status_updates').select('*').eq('claim_id', claimId).order('created_at', { ascending: true }),
      supabase.from('claim_messages' as any).select('*').eq('claim_id', claimId).order('created_at', { ascending: true }),
      supabase.from('service_schedules' as any).select('*').eq('claim_id', claimId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (claimRes.data) {
      setClaim(claimRes.data);
      if (claimRes.data.assigned_partner_id) {
        const { data: p } = await supabase.from('partners').select('*').eq('id', claimRes.data.assigned_partner_id).single();
        setPartner(p);
      }
    }
    setUpdates(updatesRes.data || []);
    setMessages((messagesRes.data as any[]) || []);
    setSchedule(scheduleRes.data);

    const { data: fb } = await supabase.from('claim_feedback').select('*').eq('claim_id', claimId).maybeSingle();
    setFeedback(fb);
    if (fb) { setRating(fb.rating); setFeedbackText(fb.feedback_text || ''); }

    setLoading(false);
  }, [claimId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time for claim updates and messages
  useEffect(() => {
    if (!claimId) return;
    const channel = supabase
      .channel(`claim-detail-${claimId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'claim_status_updates',
        filter: `claim_id=eq.${claimId}`,
      }, (payload) => {
        setUpdates(prev => [...prev, payload.new as any]);
        toast.info('Claim status updated!');
        fetchData();
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'claim_messages',
        filter: `claim_id=eq.${claimId}`,
      }, (payload) => {
        const newMsg = payload.new as any;
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.sender_id !== user?.id) {
          toast.info('New message received!');
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [claimId, fetchData, user?.id]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const copyClaimId = () => {
    if (claimId) {
      navigator.clipboard.writeText(claimId);
      toast.success('Claim ID copied');
    }
  };

  const submitFeedback = async () => {
    if (!rating || !user) return;
    setSubmittingFeedback(true);
    const { error } = await supabase.from('claim_feedback').insert({
      claim_id: claimId!,
      user_id: user.id,
      rating,
      feedback_text: feedbackText || null,
    });
    if (error) {
      toast.error('Failed to submit feedback');
    } else {
      toast.success('Thank you for your feedback!');
      setFeedback({ rating, feedback_text: feedbackText });
    }
    setSubmittingFeedback(false);
  };

  const sendClaimMessage = async () => {
    if (!newMessage.trim() || !user || !claimId) return;
    setSendingMessage(true);
    const { error } = await supabase.from('claim_messages' as any).insert({
      claim_id: claimId,
      sender_id: user.id,
      sender_role: 'customer',
      message: newMessage.trim(),
    } as any);

    if (error) {
      toast.error('Failed to send message');
    } else {
      setNewMessage('');
      // Notify partner
      if (partner?.user_id) {
        await supabase.from('notifications').insert({
          user_id: partner.user_id,
          type: 'customer_message',
          title: 'New Message from Customer',
          message: `Customer sent a message regarding claim`,
          related_id: claimId,
        });
      }
    }
    setSendingMessage(false);
  };

  const submitSchedule = async () => {
    if (!scheduleDate || !scheduleTime || !user || !claimId) {
      toast.error('Please select a date and time');
      return;
    }
    setScheduling(true);
    const { error } = await supabase.from('service_schedules' as any).insert({
      claim_id: claimId,
      customer_id: user.id,
      partner_id: partner?.id || null,
      preferred_date: format(scheduleDate, 'yyyy-MM-dd'),
      preferred_time: scheduleTime,
      special_requests: specialRequests || null,
    } as any);

    if (error) {
      toast.error('Failed to schedule service');
    } else {
      toast.success('Service scheduled successfully!');
      setScheduleDialogOpen(false);
      setScheduleDate(undefined);
      setScheduleTime('');
      setSpecialRequests('');
      fetchData();
      // Notify partner
      if (partner?.user_id) {
        await supabase.from('notifications').insert({
          user_id: partner.user_id,
          type: 'schedule_request',
          title: 'Service Schedule Request',
          message: `Customer requested service on ${format(scheduleDate, 'dd MMM yyyy')} at ${scheduleTime}`,
          related_id: claimId,
        });
      }
    }
    setScheduling(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!claim) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Claim not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/customer/claims')}>
            <ArrowLeft size={16} className="mr-1" /> Back to Claims
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const currentStageIdx = getStageIndex(claim.status);
  const progress = getProgressPercent(claim.status);
  const isCompleted = claim.status === 'resolved';
  const hasPartner = !!partner;

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => navigate('/customer/claims')}>
          <ArrowLeft size={16} className="mr-1" /> Back to Claims
        </Button>

        {/* Header */}
        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-heading text-xl font-bold text-foreground">{claim.issue_type}</h1>
                  <Badge
                    className={`text-xs ${
                      isCompleted ? 'bg-success/10 text-success border-success/20' :
                      claim.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                      'bg-info/10 text-info border-info/20'
                    }`}
                    variant="outline"
                  >
                    {claim.status.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{claimId?.slice(0, 8)}...</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={copyClaimId}>
                    <Copy size={12} />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>IMEI: <span className="font-mono">{claim.imei_number}</span></span>
                  <span>Submitted: {format(new Date(claim.created_at), 'dd MMM yyyy, hh:mm a')}</span>
                  <span>Updated: {formatDistanceToNow(new Date(claim.updated_at), { addSuffix: true })}</span>
                </div>
              </div>
              {claim.image_urls?.length > 0 && (
                <div className="flex gap-2">
                  {claim.image_urls.map((url: string, i: number) => (
                    <img key={i} src={url} alt="Claim" className="w-16 h-16 rounded-lg border border-border object-cover" />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Progress</span>
              <span className="text-sm font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
            <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
              <span>Submitted</span>
              <span>Completed</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline + Messages - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpandedTimeline(!expandedTimeline)}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Status Timeline</CardTitle>
                  {expandedTimeline ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </CardHeader>
              {expandedTimeline && (
                <CardContent className="pt-0">
                  <div className="relative ml-4">
                    {STAGES.map((stage, idx) => {
                      const isPast = idx <= currentStageIdx;
                      const isCurrent = idx === currentStageIdx;
                      const Icon = stage.icon;
                      const update = updates.find(u => u.status === stage.key);

                      return (
                        <div key={stage.key} className="relative pb-6 last:pb-0">
                          {idx < STAGES.length - 1 && (
                            <div className={`absolute left-[11px] top-7 w-0.5 h-full ${isPast ? 'bg-primary' : 'bg-border'}`} />
                          )}
                          <div className="flex items-start gap-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                              isPast ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                            } ${isCurrent ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                              {isPast ? <CheckCircle2 size={14} /> : <Icon size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-medium ${isPast ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {stage.label}
                                </span>
                                {isCurrent && (
                                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                    Current
                                  </Badge>
                                )}
                              </div>
                              {update && (
                                <div className="mt-1 space-y-0.5">
                                  <p className="text-xs text-muted-foreground">
                                    {format(new Date(update.created_at), 'dd MMM yyyy, hh:mm a')}
                                  </p>
                                  {update.notes && (
                                    <p className="text-xs text-muted-foreground italic">{update.notes}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Direct Messaging with Partner */}
            {hasPartner && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageCircle size={16} />
                    Messages with {partner.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/30 rounded-lg p-4 h-64 overflow-y-auto space-y-3 mb-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      messages.map((msg: any) => {
                        const isCustomer = msg.sender_role === 'customer';
                        return (
                          <div key={msg.id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                            <div className={cn(
                              'max-w-[75%] p-3 rounded-lg',
                              isCustomer
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-card border border-border text-foreground'
                            )}>
                              <p className="text-sm">{msg.message}</p>
                              <p className={cn(
                                'text-[10px] mt-1',
                                isCustomer ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              )}>
                                {format(new Date(msg.created_at), 'hh:mm a')}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={2}
                      className="flex-1 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendClaimMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={sendClaimMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      size="icon"
                      className="h-auto"
                    >
                      <Send size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Notes */}
            {claim.admin_notes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Admin Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{claim.admin_notes}</p>
                </CardContent>
              </Card>
            )}

            {/* Feedback Section */}
            {isCompleted && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Rate Your Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  {feedback ? (
                    <div className="space-y-2">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={20} className={s <= feedback.rating ? 'fill-warning text-warning' : 'text-muted'} />
                        ))}
                      </div>
                      {feedback.feedback_text && <p className="text-sm text-muted-foreground">{feedback.feedback_text}</p>}
                      <p className="text-xs text-muted-foreground">Thank you for your feedback!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => setRating(s)} className="focus:outline-none">
                            <Star size={24} className={`transition-colors ${s <= rating ? 'fill-warning text-warning' : 'text-muted-foreground hover:text-warning/60'}`} />
                          </button>
                        ))}
                      </div>
                      <Textarea
                        placeholder="Share your experience (optional)"
                        value={feedbackText}
                        onChange={e => setFeedbackText(e.target.value)}
                        rows={3}
                      />
                      <Button onClick={submitFeedback} disabled={!rating || submittingFeedback} size="sm">
                        {submittingFeedback ? 'Submitting...' : 'Submit Feedback'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Enhanced Partner Profile */}
            {hasPartner && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Service Provider</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-semibold text-lg text-foreground">{partner.name}</p>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin size={14} />
                      <span>{partner.city}, {partner.state}</span>
                    </div>
                  </div>

                  {/* Performance Stats */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <Award size={14} className="mx-auto text-warning mb-1" />
                      <div className="text-xs text-muted-foreground">Rating</div>
                      <div className="font-bold text-sm text-warning">★ {partner.quality_rating}</div>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <Timer size={14} className="mx-auto text-info mb-1" />
                      <div className="text-xs text-muted-foreground">SLA</div>
                      <div className="font-bold text-sm text-foreground">{partner.sla_turnaround_days}d</div>
                    </div>
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <TrendingUp size={14} className="mx-auto text-success mb-1" />
                      <div className="text-xs text-muted-foreground">Repairs</div>
                      <div className="font-bold text-sm text-foreground">{partner.total_repairs}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} size={14} className={s <= Math.round(partner.quality_rating) ? 'fill-warning text-warning' : 'text-muted'} />
                    ))}
                    <span className="text-xs text-muted-foreground ml-1">({partner.quality_rating})</span>
                  </div>

                  <Separator />

                  {/* Contact Actions */}
                  <div className="space-y-2">
                    {partner.phone && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={`tel:${partner.phone}`}><Phone size={14} className="mr-2" /> Call {partner.phone}</a>
                      </Button>
                    )}
                    {partner.phone && (
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={`https://wa.me/91${partner.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                          <MessageCircle size={14} className="mr-2" /> WhatsApp
                        </a>
                      </Button>
                    )}
                    {partner.email && (
                      <p className="text-xs text-muted-foreground text-center">{partner.email}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Schedule Service */}
            {hasPartner && !isCompleted && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarClock size={16} /> Schedule Service
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {schedule ? (
                    <div className="space-y-2">
                      <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Date</span>
                          <span className="font-medium text-foreground">
                            {format(new Date(schedule.preferred_date), 'dd MMM yyyy')}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Time</span>
                          <span className="font-medium text-foreground">{schedule.preferred_time}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status</span>
                          <Badge variant="outline" className={cn(
                            'text-xs',
                            schedule.status === 'confirmed' ? 'bg-success/10 text-success border-success/20' :
                            schedule.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                            'bg-warning/10 text-warning border-warning/20'
                          )}>
                            {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      {schedule.partner_response && (
                        <p className="text-xs text-muted-foreground italic">Partner: {schedule.partner_response}</p>
                      )}
                      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">Reschedule</Button>
                        </DialogTrigger>
                        <DialogContent>
                          <ScheduleForm
                            scheduleDate={scheduleDate}
                            setScheduleDate={setScheduleDate}
                            scheduleTime={scheduleTime}
                            setScheduleTime={setScheduleTime}
                            specialRequests={specialRequests}
                            setSpecialRequests={setSpecialRequests}
                            scheduling={scheduling}
                            onSubmit={submitSchedule}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  ) : (
                    <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full" size="sm">
                          <CalendarClock size={14} className="mr-2" /> Schedule Service Visit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <ScheduleForm
                          scheduleDate={scheduleDate}
                          setScheduleDate={setScheduleDate}
                          scheduleTime={scheduleTime}
                          setScheduleTime={setScheduleTime}
                          specialRequests={specialRequests}
                          setSpecialRequests={setSpecialRequests}
                          scheduling={scheduling}
                          onSubmit={submitSchedule}
                        />
                      </DialogContent>
                    </Dialog>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate('/customer/tickets')}>
                  <AlertTriangle size={14} className="mr-2" /> Raise a Support Ticket
                </Button>
              </CardContent>
            </Card>

            {/* Claim Details */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Claim Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issue Type</span>
                  <span className="font-medium text-foreground">{claim.issue_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IMEI</span>
                  <span className="font-mono text-foreground">{claim.imei_number}</span>
                </div>
                <Separator />
                <div>
                  <span className="text-muted-foreground">Description</span>
                  <p className="mt-1 text-foreground">{claim.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

// Schedule Form Component
const ScheduleForm = ({
  scheduleDate, setScheduleDate,
  scheduleTime, setScheduleTime,
  specialRequests, setSpecialRequests,
  scheduling, onSubmit,
}: {
  scheduleDate: Date | undefined;
  setScheduleDate: (d: Date | undefined) => void;
  scheduleTime: string;
  setScheduleTime: (t: string) => void;
  specialRequests: string;
  setSpecialRequests: (s: string) => void;
  scheduling: boolean;
  onSubmit: () => void;
}) => (
  <>
    <DialogHeader>
      <DialogTitle>Schedule Service Visit</DialogTitle>
    </DialogHeader>
    <div className="space-y-4 pt-2">
      <div>
        <label className="text-sm font-medium text-foreground">Preferred Date</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-normal mt-1',
                !scheduleDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {scheduleDate ? format(scheduleDate, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={scheduleDate}
              onSelect={setScheduleDate}
              disabled={(date) => date < new Date()}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Preferred Time</label>
        <Select value={scheduleTime} onValueChange={setScheduleTime}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select time slot" />
          </SelectTrigger>
          <SelectContent>
            {TIME_SLOTS.map(t => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">Special Requests</label>
        <Textarea
          placeholder="Any special requests for the service partner..."
          value={specialRequests}
          onChange={(e) => setSpecialRequests(e.target.value)}
          rows={3}
          className="mt-1"
        />
      </div>

      <Button className="w-full" onClick={onSubmit} disabled={scheduling || !scheduleDate || !scheduleTime}>
        {scheduling ? 'Scheduling...' : 'Schedule Service'}
      </Button>
    </div>
  </>
);

export default ClaimDetailPage;
