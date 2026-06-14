
-- 1. email_logs: add user_id, backfill from orcamentos, tighten policy
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS user_id uuid;

UPDATE public.email_logs el
SET user_id = o.user_id
FROM public.orcamentos o
WHERE el.orcamento_id = o.id AND el.user_id IS NULL;

DROP POLICY IF EXISTS "Users can manage their own email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users manage email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "Users can view their email_logs" ON public.email_logs;

CREATE POLICY "Users manage own email_logs"
ON public.email_logs
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  OR (orcamento_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.orcamentos o WHERE o.id = email_logs.orcamento_id AND o.user_id = auth.uid()
  ))
)
WITH CHECK (
  user_id = auth.uid()
  OR (orcamento_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.orcamentos o WHERE o.id = email_logs.orcamento_id AND o.user_id = auth.uid()
  ))
);

-- 2. alertas: add user_id, backfill from orcamentos, tighten policy
ALTER TABLE public.alertas ADD COLUMN IF NOT EXISTS user_id uuid;

UPDATE public.alertas a
SET user_id = o.user_id
FROM public.orcamentos o
WHERE a.orcamento_id = o.id AND a.user_id IS NULL;

DROP POLICY IF EXISTS "Users can manage their own alertas" ON public.alertas;
DROP POLICY IF EXISTS "Users manage alertas" ON public.alertas;
DROP POLICY IF EXISTS "Users can view their alertas" ON public.alertas;

CREATE POLICY "Users manage own alertas"
ON public.alertas
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  OR (orcamento_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.orcamentos o WHERE o.id = alertas.orcamento_id AND o.user_id = auth.uid()
  ))
)
WITH CHECK (
  user_id = auth.uid()
  OR (orcamento_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.orcamentos o WHERE o.id = alertas.orcamento_id AND o.user_id = auth.uid()
  ))
);

-- 3. email_processing_log: remove any authenticated-user access (service_role only)
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='email_processing_log'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.email_processing_log', pol.policyname);
  END LOOP;
END $$;

REVOKE ALL ON public.email_processing_log FROM authenticated, anon;
GRANT ALL ON public.email_processing_log TO service_role;

-- Explicit deny-by-default: no policy means no access under RLS.
-- (RLS is already enabled; with no policies, authenticated/anon get nothing.)
