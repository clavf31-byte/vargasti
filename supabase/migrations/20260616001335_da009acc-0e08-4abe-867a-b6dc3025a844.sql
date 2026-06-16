CREATE TABLE IF NOT EXISTS public.email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  whitelist JSONB NOT NULL DEFAULT '[]'::jsonb,
  priorities JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_settings TO authenticated;
GRANT ALL ON public.email_settings TO service_role;

ALTER TABLE public.email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read email_settings"
  ON public.email_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated can insert email_settings"
  ON public.email_settings FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update email_settings"
  ON public.email_settings FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER trg_email_settings_updated
  BEFORE UPDATE ON public.email_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.email_settings (id)
  VALUES ('00000000-0000-0000-0000-000000000000')
  ON CONFLICT DO NOTHING;