CREATE TABLE IF NOT EXISTS public.role_default_permissions (
  role        text PRIMARY KEY,
  permissions jsonb NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.role_default_permissions TO authenticated;
GRANT ALL ON public.role_default_permissions TO service_role;

ALTER TABLE public.role_default_permissions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.touch_role_permissions_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_role_permissions_updated_at ON public.role_default_permissions;
CREATE TRIGGER trg_role_permissions_updated_at
  BEFORE UPDATE ON public.role_default_permissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_role_permissions_updated_at();

DROP POLICY IF EXISTS "read_role_permissions" ON public.role_default_permissions;
CREATE POLICY "read_role_permissions" ON public.role_default_permissions
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "write_role_permissions" ON public.role_default_permissions;
CREATE POLICY "write_role_permissions" ON public.role_default_permissions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.role_default_permissions (role, permissions) VALUES
('gestor', '{
  "dashboard.view": true, "dashboard.view_financial": true, "dashboard.view_technical": true,
  "crm.view": true, "crm.create": true, "crm.edit": true, "crm.view_history": true,
  "orcamentos.view": true, "orcamentos.create": true, "orcamentos.edit": true,
  "orcamentos.approve": true, "orcamentos.cancel": true, "orcamentos.send_email": true,
  "orcamentos.pdf": true, "orcamentos.view_values": true,
  "os.view": true, "os.view_all": true, "os.create": true, "os.edit": true,
  "os.assign": true, "os.complete": true, "os.cancel": true,
  "agenda.view": true, "agenda.view_all": true, "agenda.create": true, "agenda.edit": true,
  "assets.view": true, "assets.view_stock": true, "assets.approve_request": true,
  "kb.view": true,
  "reports.view": true, "reports.export": true, "reports.view_financial": true, "reports.view_technical": true,
  "admin.view_operators": true, "admin.approve_access": true
}'::jsonb),
('administrativo', '{
  "dashboard.view": true,
  "crm.view": true, "crm.create": true, "crm.edit": true,
  "orcamentos.view": true, "orcamentos.create": true, "orcamentos.edit": true,
  "orcamentos.send_email": true, "orcamentos.pdf": true, "orcamentos.view_values": true,
  "kb.view": true,
  "reports.view": true
}'::jsonb),
('tecnico', '{
  "dashboard.view": true, "dashboard.view_technical": true,
  "crm.view": true,
  "os.view": true, "os.view_own": true, "os.create": true, "os.assign": true, "os.complete": true,
  "agenda.view": true, "agenda.create": true, "agenda.edit": true,
  "assets.view": true, "assets.move": true,
  "kb.view": true
}'::jsonb),
('operador', '{
  "dashboard.view": true,
  "crm.view": true,
  "os.view": true, "os.view_own": true, "os.create": true,
  "agenda.view": true,
  "kb.view": true
}'::jsonb),
('cliente', '{
  "dashboard.view": true,
  "os.view": true, "os.view_own": true, "os.create": true,
  "kb.view": true
}'::jsonb)
ON CONFLICT (role) DO NOTHING;