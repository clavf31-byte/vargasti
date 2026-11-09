ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_users FROM anon;
GRANT SELECT ON public.admin_users TO authenticated;
GRANT ALL ON public.admin_users TO service_role;
CREATE POLICY "Users view own admin row" ON public.admin_users FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "read_role_permissions" ON public.role_default_permissions;

DROP POLICY IF EXISTS "Public read clientes" ON public.clientes;
DROP POLICY IF EXISTS "Public read ordens_servico" ON public.ordens_servico;
DROP POLICY IF EXISTS "Public read orcamentos for evaluation" ON public.orcamentos;
DROP POLICY IF EXISTS "Public insert avaliacoes" ON public.avaliacoes;

DROP POLICY IF EXISTS "allow_all_select" ON public.contract_templates;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_templates TO authenticated;
CREATE POLICY "Users manage own contract_templates" ON public.contract_templates FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);