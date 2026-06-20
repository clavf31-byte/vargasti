ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gestor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'administrativo';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'tecnico';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operador';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'cliente';

ALTER TABLE public.user_module_permissions ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb;