
CREATE TABLE IF NOT EXISTS public.conversation_pauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_number TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  is_group BOOLEAN NOT NULL,
  paused_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resume_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '2 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_pauses TO authenticated;
GRANT ALL ON public.conversation_pauses TO service_role;

ALTER TABLE public.conversation_pauses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own pauses"
ON public.conversation_pauses
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_conversation_pauses_lookup
ON public.conversation_pauses(user_id, from_number, instance_name);
