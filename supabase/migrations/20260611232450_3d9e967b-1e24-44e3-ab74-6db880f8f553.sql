CREATE TABLE IF NOT EXISTS public.gmail_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.gmail_tokens TO authenticated;
GRANT ALL ON public.gmail_tokens TO service_role;

ALTER TABLE public.gmail_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own gmail tokens"
  ON public.gmail_tokens
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE TRIGGER update_gmail_tokens_updated_at
  BEFORE UPDATE ON public.gmail_tokens
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.email_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL UNIQUE,
  ticket_id UUID,
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT ALL ON public.email_processing_log TO service_role;

ALTER TABLE public.email_processing_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user_id ON public.gmail_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_processing_log_email_id ON public.email_processing_log(email_id);
CREATE INDEX IF NOT EXISTS idx_email_processing_log_ticket_id ON public.email_processing_log(ticket_id);