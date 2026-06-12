
-- conversation_pauses: scope policy to authenticated role only
DROP POLICY IF EXISTS "Users can manage their own pauses" ON public.conversation_pauses;
CREATE POLICY "Users can manage their own pauses"
ON public.conversation_pauses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- gmail_tokens: scope policy to authenticated role only
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='gmail_tokens' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.gmail_tokens', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "Users can manage their own gmail tokens"
ON public.gmail_tokens
FOR ALL
TO authenticated
USING ((auth.uid())::text = user_id)
WITH CHECK ((auth.uid())::text = user_id);

-- email_processing_log: explicit service-role-only policy (documents intent)
CREATE POLICY "Service role manages email processing log"
ON public.email_processing_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
