
-- Create ticket_messages table for conversation threads
CREATE TABLE public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.service_tickets(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'customer',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Customers can insert messages on their own tickets
CREATE POLICY "Users can insert messages on own tickets"
  ON public.ticket_messages FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (SELECT 1 FROM public.service_tickets WHERE id = ticket_id AND user_id = auth.uid())
  );

-- Customers can read messages on their own tickets
CREATE POLICY "Users can read messages on own tickets"
  ON public.ticket_messages FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.service_tickets WHERE id = ticket_id AND user_id = auth.uid())
  );

-- Admins can manage all messages
CREATE POLICY "Admins can manage all messages"
  ON public.ticket_messages FOR ALL TO public
  USING (has_role(auth.uid(), 'admin'::app_role));
