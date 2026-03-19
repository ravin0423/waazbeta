
-- Delete data for all users EXCEPT ravin.rangaraj@gmail.com (id: 5af9d8bb-8c11-49da-82b3-c4531515e9ae)
-- Order matters due to foreign key constraints

-- Delete claim-related data first (claim_messages, claim_status_updates, claim_eligibility_checks, claim_feedback, claim_assignments, service_schedules)
DELETE FROM public.claim_messages WHERE claim_id IN (SELECT id FROM public.service_claims WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae');
DELETE FROM public.claim_status_updates WHERE claim_id IN (SELECT id FROM public.service_claims WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae');
DELETE FROM public.claim_eligibility_checks WHERE claim_id IN (SELECT id FROM public.service_claims WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae');
DELETE FROM public.claim_feedback WHERE claim_id IN (SELECT id FROM public.service_claims WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae');
DELETE FROM public.claim_assignments WHERE claim_id IN (SELECT id FROM public.service_claims WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae');
DELETE FROM public.service_schedules WHERE claim_id IN (SELECT id FROM public.service_claims WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae');
DELETE FROM public.service_claims WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae';

-- Delete device-related data
DELETE FROM public.device_approval_checks WHERE device_id IN (SELECT id FROM public.customer_devices WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae');
DELETE FROM public.device_approval_logs WHERE device_id IN (SELECT id FROM public.customer_devices WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae');
DELETE FROM public.device_info_requests WHERE device_id IN (SELECT id FROM public.customer_devices WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae');
DELETE FROM public.subscription_renewal_reminders WHERE device_id IN (SELECT id FROM public.customer_devices WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae');
DELETE FROM public.subscription_history WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae';
DELETE FROM public.invoice_line_items WHERE invoice_id IN (SELECT id FROM public.invoices WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae' AND user_id IS NOT NULL);
DELETE FROM public.invoices WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae' AND user_id IS NOT NULL;
DELETE FROM public.customer_devices WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae';

-- Delete ticket-related data
DELETE FROM public.ticket_messages WHERE ticket_id IN (SELECT id FROM public.service_tickets WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae');
DELETE FROM public.service_tickets WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae';

-- Delete other user-specific data
DELETE FROM public.account_deletion_requests WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae';
DELETE FROM public.notifications WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae';
DELETE FROM public.notification_preferences WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae';
DELETE FROM public.customer_activity_log WHERE customer_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae';
DELETE FROM public.customer_engagement WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae';
DELETE FROM public.customer_feedback WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae';
DELETE FROM public.nps_surveys WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae';

-- Delete user roles and profiles for non-admin test users
DELETE FROM public.user_roles WHERE user_id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae';
DELETE FROM public.profiles WHERE id != '5af9d8bb-8c11-49da-82b3-c4531515e9ae';
