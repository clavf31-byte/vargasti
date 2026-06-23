DROP POLICY IF EXISTS user_own_os ON public.ordens_servico;
CREATE POLICY user_own_os ON public.ordens_servico
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_own_os_itens ON public.os_itens;
CREATE POLICY user_own_os_itens ON public.os_itens
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ordens_servico o WHERE o.id = os_itens.os_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ordens_servico o WHERE o.id = os_itens.os_id AND o.user_id = auth.uid()));