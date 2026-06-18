
-- Scope policies to authenticated role explicitly
ALTER POLICY "Users manage own client financial" ON public.cliente_financeiro TO authenticated;

ALTER POLICY "Users can manage own cliente_tags" ON public.cliente_tags TO authenticated;
ALTER POLICY "Users can view own cliente_tags" ON public.cliente_tags TO authenticated;

ALTER POLICY "Users manage own sequences" ON public.orcamento_sequences TO authenticated;
ALTER POLICY "Users manage own services" ON public.servicos TO authenticated;
ALTER POLICY "Users manage own parts" ON public.pecas TO authenticated;

ALTER POLICY "Users can delete own oportunidades" ON public.oportunidades TO authenticated;
ALTER POLICY "Users can insert own oportunidades" ON public.oportunidades TO authenticated;
ALTER POLICY "Users can update own oportunidades" ON public.oportunidades TO authenticated;
ALTER POLICY "Users can view own oportunidades" ON public.oportunidades TO authenticated;

-- Prevent authenticated users from inserting/updating/deleting their own roles (privilege escalation)
CREATE POLICY "Deny user_roles writes from authenticated insert"
  ON public.user_roles AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (false);
CREATE POLICY "Deny user_roles writes from authenticated update"
  ON public.user_roles AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (false) WITH CHECK (false);
CREATE POLICY "Deny user_roles writes from authenticated delete"
  ON public.user_roles AS RESTRICTIVE FOR DELETE TO authenticated
  USING (false);
