import { supabase } from '@/integrations/supabase/client';

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
}

export const createNotification = async (payload: NotificationPayload): Promise<boolean> => {
  try {
    const { error } = await supabase.from('notifications').insert([{
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      message: payload.message,
      related_id: payload.relatedId || null,
    }]);
    if (error) {
      console.error('Failed to create notification:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Notification service error:', err);
    return false;
  }
};

export const notifyClaimStatusChange = async (
  claim: { id: string; user_id: string; assigned_partner_id?: string | null; status: string },
  newStatus: string,
  updaterRole: 'admin' | 'partner' | 'customer'
) => {
  const statusLabels: Record<string, string> = {
    pending: 'Pending',
    in_review: 'In Review',
    approved: 'Approved',
    assigned: 'Assigned to Partner',
    in_repair: 'In Repair',
    quality_check: 'Quality Check',
    ready_delivery: 'Ready for Delivery',
    completed: 'Completed',
    rejected: 'Rejected',
  };

  const label = statusLabels[newStatus] || newStatus;

  // Notify customer
  await createNotification({
    userId: claim.user_id,
    type: 'claim_updated',
    title: `Claim update: ${label}`,
    message: `Your service claim status has been updated to "${label}".`,
    relatedId: claim.id,
  });

  // Notify partner if admin made the change and partner is assigned
  if (updaterRole === 'admin' && claim.assigned_partner_id) {
    const { data: partner } = await supabase
      .from('partners')
      .select('user_id')
      .eq('id', claim.assigned_partner_id)
      .maybeSingle();

    if (partner?.user_id) {
      await createNotification({
        userId: partner.user_id,
        type: 'claim_updated',
        title: `Admin updated claim`,
        message: `A claim assigned to you has been updated to "${label}".`,
        relatedId: claim.id,
      });
    }
  }

  // Notify admins if partner made the change
  if (updaterRole === 'partner') {
    const { data: admins } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (admins) {
      for (const admin of admins) {
        await createNotification({
          userId: admin.user_id,
          type: 'claim_updated',
          title: `Partner updated claim`,
          message: `A partner has updated claim status to "${label}".`,
          relatedId: claim.id,
        });
      }
    }
  }
};

export const notifyClaimAssignment = async (
  claimId: string,
  partnerId: string,
  customerUserId: string
) => {
  // Notify partner
  const { data: partner } = await supabase
    .from('partners')
    .select('user_id, name')
    .eq('id', partnerId)
    .maybeSingle();

  if (partner?.user_id) {
    await createNotification({
      userId: partner.user_id,
      type: 'claim_assigned',
      title: 'New claim assigned to you',
      message: 'A new service claim has been assigned to you. Please check your dashboard.',
      relatedId: claimId,
    });
  }

  // Notify customer
  await createNotification({
    userId: customerUserId,
    type: 'claim_assigned',
    title: 'Claim assigned to partner',
    message: `Your claim has been assigned to ${partner?.name || 'a service partner'} for repair.`,
    relatedId: claimId,
  });
};

export const notifyDeviceDecision = async (
  userId: string,
  deviceId: string,
  decision: 'approved' | 'rejected',
  reason?: string
) => {
  await createNotification({
    userId,
    type: 'device_decision',
    title: decision === 'approved' ? 'Device approved!' : 'Device rejected',
    message: decision === 'approved'
      ? 'Your device has been approved and your subscription is now active.'
      : `Your device registration was rejected. ${reason || ''}`,
    relatedId: deviceId,
  });
};
