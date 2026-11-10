DROP POLICY IF EXISTS "public_read_tokens" ON public.contract_access_tokens;
DROP POLICY IF EXISTS "public_update_tokens" ON public.contract_access_tokens;
DROP POLICY IF EXISTS "public_insert_tokens" ON public.contract_access_tokens;
DROP POLICY IF EXISTS "owner_manage_tokens" ON public.contract_access_tokens;
CREATE POLICY "owner_manage_tokens" ON public.contract_access_tokens FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()));

DROP POLICY IF EXISTS "public_update_contracts" ON public.contracts;
DROP POLICY IF EXISTS "allow_public_read_contracts" ON public.contracts;

DROP POLICY IF EXISTS "public_read_signatures" ON public.contract_signatures;
DROP POLICY IF EXISTS "public_insert_signatures" ON public.contract_signatures;
DROP POLICY IF EXISTS "owner_manage_signatures" ON public.contract_signatures;
CREATE POLICY "owner_manage_signatures" ON public.contract_signatures FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()));