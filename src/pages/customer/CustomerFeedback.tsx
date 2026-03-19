import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import {
  Star, MessageSquare, TrendingUp, Award, ThumbsUp,
  Loader2, CheckCircle, Send
} from 'lucide-react';

const CustomerFeedback = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Service rating
  const [rating, setRating] = useState(0);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // NPS
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [npsComment, setNpsComment] = useState('');
  const [submittingNps, setSubmittingNps] = useState(false);
  const [lastNps, setLastNps] = useState<any>(null);

  // History
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);

  // Engagement stats
  const [stats, setStats] = useState({
    totalFeedback: 0,
    avgRating: 0,
    latestNps: null as number | null,
    engagementThisMonth: 0,
  });

  const fetchData = useCallback(async () => {
    if (!user) return;

    const [feedbackRes, npsRes, engagementRes] = await Promise.all([
      supabase.from('customer_feedback' as any).select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
      supabase.from('nps_surveys' as any).select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('customer_engagement' as any).select('*', { count: 'exact', head: true }).eq('user_id', user.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
    ]);

    const feedback = (feedbackRes.data as any[]) || [];
    setFeedbackHistory(feedback);
    setLastNps(npsRes.data);

    const avgRating = feedback.length > 0
      ? feedback.reduce((sum: number, f: any) => sum + f.rating, 0) / feedback.length
      : 0;

    setStats({
      totalFeedback: feedback.length,
      avgRating,
      latestNps: (npsRes.data as any)?.score ?? null,
      engagementThisMonth: engagementRes.count || 0,
    });

    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const submitRating = async () => {
    if (!rating || !user) { toast.error('Please select a rating'); return; }
    setSubmittingRating(true);

    const { error } = await supabase.from('customer_feedback' as any).insert({
      user_id: user.id,
      rating,
      feedback_text: feedbackText || null,
      feedback_type: 'service',
    } as any);

    if (error) { toast.error('Failed to submit feedback'); }
    else {
      // Track engagement
      await supabase.from('customer_engagement' as any).insert({
        user_id: user.id, action: 'submitted_feedback',
      } as any);
      toast.success('Thank you for your feedback!');
      setRating(0);
      setFeedbackText('');
      fetchData();
    }
    setSubmittingRating(false);
  };

  const submitNps = async () => {
    if (npsScore === null || !user) return;
    setSubmittingNps(true);

    const { error } = await supabase.from('nps_surveys' as any).insert({
      user_id: user.id,
      score: npsScore,
      comment: npsComment || null,
    } as any);

    if (error) { toast.error('Failed to submit NPS'); }
    else {
      await supabase.from('customer_engagement' as any).insert({
        user_id: user.id, action: 'completed_nps',
      } as any);
      toast.success('Thank you for your feedback!');
      setNpsScore(null);
      setNpsComment('');
      fetchData();
    }
    setSubmittingNps(false);
  };

  const getNpsLabel = (score: number) => {
    if (score >= 9) return { label: 'Promoter', color: 'text-success' };
    if (score >= 7) return { label: 'Passive', color: 'text-warning' };
    return { label: 'Detractor', color: 'text-destructive' };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={24} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Feedback & Ratings</h1>
          <p className="text-muted-foreground text-sm">Help us improve by sharing your experience</p>
        </div>

        {/* Engagement Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare size={20} className="mx-auto text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Feedback Given</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalFeedback}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Star size={20} className="mx-auto text-warning mb-2" />
              <p className="text-xs text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold text-warning">
                {stats.avgRating > 0 ? `★ ${stats.avgRating.toFixed(1)}` : '—'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <ThumbsUp size={20} className="mx-auto text-info mb-2" />
              <p className="text-xs text-muted-foreground">NPS Score</p>
              <p className="text-2xl font-bold text-foreground">
                {stats.latestNps !== null ? stats.latestNps : '—'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp size={20} className="mx-auto text-success mb-2" />
              <p className="text-xs text-muted-foreground">This Month</p>
              <p className="text-2xl font-bold text-foreground">{stats.engagementThisMonth}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rate Service */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award size={16} /> Rate Your Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-3">How would you rate our service?</p>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} onClick={() => setRating(s)} className="focus:outline-none">
                      <Star
                        size={32}
                        className={`transition-colors ${
                          s <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/30 hover:text-warning/50'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {rating <= 2 ? 'We\'re sorry to hear that' : rating <= 3 ? 'Thanks for the feedback' : rating <= 4 ? 'Glad you liked it!' : 'Excellent! 🎉'}
                  </p>
                )}
              </div>
              <Textarea
                placeholder="Tell us more about your experience (optional)..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={3}
              />
              <Button
                className="w-full"
                onClick={submitRating}
                disabled={!rating || submittingRating}
              >
                {submittingRating ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Send size={14} className="mr-2" />}
                Submit Feedback
              </Button>
            </CardContent>
          </Card>

          {/* NPS Survey */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ThumbsUp size={16} /> How likely would you recommend WaaZ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lastNps ? (
                <div className="space-y-3">
                  <div className="p-4 bg-muted/50 rounded-lg text-center">
                    <p className="text-xs text-muted-foreground mb-1">Your latest NPS score</p>
                    <p className="text-3xl font-bold text-foreground">{(lastNps as any).score}</p>
                    <Badge variant="outline" className={`mt-2 ${getNpsLabel((lastNps as any).score).color}`}>
                      {getNpsLabel((lastNps as any).score).label}
                    </Badge>
                    {(lastNps as any).comment && (
                      <p className="text-sm text-muted-foreground mt-2 italic">"{(lastNps as any).comment}"</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Submitted {format(new Date((lastNps as any).created_at), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => setLastNps(null)}>
                    Submit New Response
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Not likely</span>
                    <span>Very likely</span>
                  </div>
                  <div className="grid grid-cols-11 gap-1">
                    {Array.from({ length: 11 }, (_, i) => i).map(num => (
                      <button
                        key={num}
                        onClick={() => setNpsScore(num)}
                        className={`p-2 rounded text-sm font-medium transition-colors ${
                          npsScore === num
                            ? num <= 6 ? 'bg-destructive text-destructive-foreground'
                              : num <= 8 ? 'bg-warning text-warning-foreground'
                              : 'bg-success text-success-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  {npsScore !== null && (
                    <>
                      <p className={`text-sm font-medium ${getNpsLabel(npsScore).color}`}>
                        {npsScore <= 6 ? 'What can we improve?' : npsScore <= 8 ? 'What would make it a 10?' : 'We\'re glad you love WaaZ!'}
                      </p>
                      <Textarea
                        placeholder="Any additional comments..."
                        value={npsComment}
                        onChange={(e) => setNpsComment(e.target.value)}
                        rows={2}
                      />
                      <Button
                        className="w-full"
                        onClick={submitNps}
                        disabled={submittingNps}
                      >
                        {submittingNps ? <Loader2 size={14} className="mr-2 animate-spin" /> : <CheckCircle size={14} className="mr-2" />}
                        Submit NPS
                      </Button>
                    </>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feedback History */}
        {feedbackHistory.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Your Feedback History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feedbackHistory.map((fb: any) => (
                  <div key={fb.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="flex gap-0.5 mt-0.5">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={12} className={s <= fb.rating ? 'fill-warning text-warning' : 'text-muted'} />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      {fb.feedback_text && (
                        <p className="text-sm text-foreground">{fb.feedback_text}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(fb.created_at), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{fb.feedback_type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </DashboardLayout>
  );
};

export default CustomerFeedback;
