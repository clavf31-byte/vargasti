ALTER TABLE public.whatsapp_config DROP CONSTRAINT IF EXISTS whatsapp_config_user_id_key;
ALTER TABLE public.whatsapp_config ADD COLUMN IF NOT EXISTS label TEXT NOT NULL DEFAULT 'Agente 1';
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_config_user_label ON public.whatsapp_config(user_id, label);