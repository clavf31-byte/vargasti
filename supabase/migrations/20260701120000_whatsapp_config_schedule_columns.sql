ALTER TABLE public.whatsapp_config
  ADD COLUMN IF NOT EXISTS schedule_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS schedule_start text NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS schedule_end text NOT NULL DEFAULT '18:00',
  ADD COLUMN IF NOT EXISTS schedule_days text NOT NULL DEFAULT '1,2,3,4,5';
