
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evolution_url TEXT NOT NULL DEFAULT '',
  evolution_key TEXT NOT NULL DEFAULT '',
  instance_name TEXT NOT NULL DEFAULT 'vargasti',
  claude_system_prompt TEXT DEFAULT '',
  auto_reply BOOLEAN DEFAULT true,
  save_as_notes BOOLEAN DEFAULT false,
  webhook_token TEXT DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_config TO authenticated;
GRANT ALL ON public.whatsapp_config TO service_role;

ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_config" ON public.whatsapp_config
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_name TEXT,
  from_number TEXT,
  from_name TEXT,
  message TEXT,
  response TEXT,
  direction TEXT DEFAULT 'incoming',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_messages" ON public.whatsapp_messages
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_created
  ON public.whatsapp_messages(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_whatsapp_config_token
  ON public.whatsapp_config(webhook_token);
