ALTER TABLE public.notification_deliveries
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS provider_message_id text;
CREATE INDEX IF NOT EXISTS notification_deliveries_pending_idx ON public.notification_deliveries(created_at) WHERE status = 'pending_provider';

CREATE OR REPLACE FUNCTION public.enqueue_escalation_email() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_set public.notification_settings%ROWTYPE;
BEGIN
  IF NEW.escalated_at IS NOT NULL AND OLD.escalated_at IS DISTINCT FROM NEW.escalated_at THEN
    SELECT * INTO v_set FROM public.notification_settings WHERE organization_id = public.stgl_organization_id() AND event_type = 'breakdown.escalated';
    IF FOUND AND v_set.email_enabled AND cardinality(coalesce(v_set.email_recipients,'{}')) > 0 THEN
      INSERT INTO public.notification_deliveries(organization_id, event_type, channel, email_recipients, payload)
      VALUES (NEW.organization_id, 'breakdown.escalated', 'email', v_set.email_recipients,
        jsonb_build_object('breakdown_id', NEW.id, 'subject', 'Escalated: ' || NEW.reference, 'reason', NEW.escalation_reason));
    END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.enqueue_escalation_email() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS breakdowns_escalation_email ON public.breakdowns;
CREATE TRIGGER breakdowns_escalation_email AFTER UPDATE OF escalated_at ON public.breakdowns
  FOR EACH ROW EXECUTE FUNCTION public.enqueue_escalation_email();