import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, startOfMonth, format } from 'date-fns';

export interface CommissionBreakdown {
  baseCommissionRate: number;
  baseCommission: number;
  slaBonus: number;
  ratingBonus: number;
  volumeBonus: number;
  penalty: number;
  totalCommission: number;
}

/**
 * Calculate commission for a completed claim assigned to a partner.
 * Uses the partner's commission_rate as base, then applies bonuses/penalties.
 */
export const calculateCommission = async (
  claimId: string,
  partnerId: string,
  claimAmount: number
): Promise<CommissionBreakdown> => {
  // Get partner info
  const { data: partner } = await supabase
    .from('partners')
    .select('commission_rate, sla_turnaround_days, quality_rating')
    .eq('id', partnerId)
    .single();

  const baseRate = (partner?.commission_rate || 10) / 100;
  const baseCommission = claimAmount * baseRate;

  // Get assignment for SLA check
  const { data: assignment } = await supabase
    .from('claim_assignments')
    .select('created_at, updated_at, sla_deadline, status')
    .eq('claim_id', claimId)
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Get claim feedback for rating
  const { data: feedback } = await supabase
    .from('claim_feedback')
    .select('rating')
    .eq('claim_id', claimId)
    .maybeSingle();

  // Volume this month
  const monthStart = startOfMonth(new Date()).toISOString();
  const { count: monthlyCount } = await supabase
    .from('claim_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('partner_id', partnerId)
    .eq('status', 'completed')
    .gte('created_at', monthStart);

  // SLA BONUS: +2% if completed within SLA deadline
  let slaBonus = 0;
  if (assignment) {
    const withinSla = assignment.sla_deadline
      ? new Date(assignment.updated_at) <= new Date(assignment.sla_deadline)
      : differenceInDays(new Date(assignment.updated_at), new Date(assignment.created_at)) <= (partner?.sla_turnaround_days || 7);
    if (withinSla) {
      slaBonus = claimAmount * 0.02;
    }
  }

  // RATING BONUS: +2% if claim feedback >= 4.5
  let ratingBonus = 0;
  if (feedback && feedback.rating >= 4.5) {
    ratingBonus = claimAmount * 0.02;
  } else if ((partner?.quality_rating || 0) >= 4.5) {
    ratingBonus = claimAmount * 0.01; // Smaller bonus for overall high rating
  }

  // VOLUME BONUS: +1% if > 20 completed claims this month
  const volumeBonus = (monthlyCount || 0) > 20 ? claimAmount * 0.01 : 0;

  // PENALTY: -2% if late delivery
  let penalty = 0;
  if (assignment) {
    const isLate = assignment.sla_deadline
      ? new Date(assignment.updated_at) > new Date(assignment.sla_deadline)
      : differenceInDays(new Date(assignment.updated_at), new Date(assignment.created_at)) > (partner?.sla_turnaround_days || 7);
    if (isLate) {
      penalty = -(claimAmount * 0.02);
    }
  }

  const totalCommission = Math.max(0, baseCommission + slaBonus + ratingBonus + volumeBonus + penalty);

  return {
    baseCommissionRate: (partner?.commission_rate || 10),
    baseCommission,
    slaBonus,
    ratingBonus,
    volumeBonus,
    penalty,
    totalCommission,
  };
};

/**
 * Calculate and save commission when a claim is completed.
 */
export const recordClaimCommission = async (
  claimId: string,
  partnerId: string,
  claimAmount: number
): Promise<CommissionBreakdown | null> => {
  try {
    // Check if already recorded
    const { data: existing } = await supabase
      .from('partner_commissions')
      .select('id')
      .eq('claim_id', claimId)
      .eq('partner_id', partnerId)
      .maybeSingle();

    if (existing) return null; // Already calculated

    const commission = await calculateCommission(claimId, partnerId, claimAmount);
    const commissionMonth = format(new Date(), 'yyyy-MM');

    await supabase.from('partner_commissions').insert({
      partner_id: partnerId,
      claim_id: claimId,
      claim_amount: claimAmount,
      base_commission_rate: commission.baseCommissionRate,
      base_commission_amount: commission.baseCommission,
      sla_bonus: commission.slaBonus,
      rating_bonus: commission.ratingBonus,
      volume_bonus: commission.volumeBonus,
      penalty_deduction: commission.penalty,
      total_commission: commission.totalCommission,
      commission_month: commissionMonth,
      status: 'calculated',
    });

    return commission;
  } catch (error) {
    console.error('Failed to record commission:', error);
    return null;
  }
};

/**
 * Aggregate commissions for a given month and create payout records in finance_partner_payouts.
 */
export const aggregateMonthlyPayouts = async (month: string, tdsRate: number = 10, createdBy?: string) => {
  // Get all commissions for the month that haven't been aggregated yet
  const { data: commissions } = await supabase
    .from('partner_commissions')
    .select('*')
    .eq('commission_month', month)
    .eq('status', 'calculated');

  if (!commissions || commissions.length === 0) return { created: 0 };

  // Group by partner
  const byPartner: Record<string, { total: number; count: number }> = {};
  commissions.forEach(c => {
    if (!byPartner[c.partner_id]) byPartner[c.partner_id] = { total: 0, count: 0 };
    byPartner[c.partner_id].total += Number(c.total_commission);
    byPartner[c.partner_id].count += 1;
  });

  let created = 0;
  for (const [partnerId, data] of Object.entries(byPartner)) {
    // Check if payout already exists for this partner+month
    const { data: existing } = await supabase
      .from('finance_partner_payouts')
      .select('id')
      .eq('partner_id', partnerId)
      .eq('payout_month', month + '-01')
      .maybeSingle();

    if (existing) continue;

    const grossAmount = data.total;
    const tdsAmount = Math.round(grossAmount * tdsRate / 100 * 100) / 100;
    const netAmount = grossAmount - tdsAmount;

    await supabase.from('finance_partner_payouts').insert({
      partner_id: partnerId,
      payout_month: month + '-01',
      gross_amount: grossAmount,
      tds_rate: tdsRate,
      tds_amount: tdsAmount,
      net_amount: netAmount,
      status: 'pending',
      notes: `Auto-generated from ${data.count} commission(s)`,
    });

    // Mark commissions as aggregated
    await supabase
      .from('partner_commissions')
      .update({ status: 'aggregated', updated_at: new Date().toISOString() })
      .eq('partner_id', partnerId)
      .eq('commission_month', month)
      .eq('status', 'calculated');

    // Record as finance transaction
    const { data: partner } = await supabase.from('partners').select('name').eq('id', partnerId).single();
    const { data: commCat } = await supabase.from('finance_categories').select('id').eq('name', 'Partner Commission').limit(1).maybeSingle();
    
    await supabase.from('finance_transactions').insert({
      transaction_date: month + '-01',
      type: 'expense',
      category_id: commCat?.id || null,
      description: `Commission payout to ${partner?.name || 'Partner'} (${month})`,
      amount: netAmount,
      tax_amount: tdsAmount,
      source_type: 'partner_payout',
      is_auto_generated: true,
      created_by: createdBy || null,
    });

    created++;
  }

  return { created };
};
