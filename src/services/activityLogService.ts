import { supabase } from '@/integrations/supabase/client';

export const logCustomerActivity = async (
  customerId: string,
  activityType: string,
  description: string,
  options?: {
    relatedDeviceId?: string;
    relatedClaimId?: string;
    relatedTicketId?: string;
    metadata?: Record<string, any>;
  }
) => {
  try {
    await supabase
      .from('customer_activity_log')
      .insert({
        customer_id: customerId,
        activity_type: activityType,
        description,
        related_device_id: options?.relatedDeviceId || null,
        related_claim_id: options?.relatedClaimId || null,
        related_ticket_id: options?.relatedTicketId || null,
        metadata: options?.metadata || {},
        activity_timestamp: new Date().toISOString(),
      });
  } catch (error) {
    console.error('Failed to log customer activity:', error);
  }
};
