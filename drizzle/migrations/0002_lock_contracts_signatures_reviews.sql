DROP POLICY IF EXISTS "Public read avaliacoes" ON public.avaliacoes;
DROP POLICY IF EXISTS "allow_read_contracts_public" ON public.contracts;
DROP POLICY IF EXISTS "allow_insert_contract_signatures" ON public.contract_signatures;
DROP POLICY IF EXISTS "allow_insert_contract_signatures_public" ON public.contract_signatures;
DROP POLICY IF EXISTS "allow_read_contract_signatures" ON public.contract_signatures;
DROP POLICY IF EXISTS "allow_read_contract_signatures_public" ON public.contract_signatures;
REVOKE ALL ON public.contract_signatures FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_signatures TO authenticated;
GRANT ALL ON public.contract_signatures TO service_role;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage contract signatures" ON public.contract_signatures
FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.contracts c WHERE c.id = contract_id AND c.user_id = auth.uid()));