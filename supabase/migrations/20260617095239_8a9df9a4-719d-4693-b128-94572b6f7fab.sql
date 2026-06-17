
-- 1) Remove public read on approval links
DROP POLICY IF EXISTS "Anyone can view by token" ON public.orcamento_approval_links;

-- Secure lookup function: returns the link only when the exact token is supplied
CREATE OR REPLACE FUNCTION public.get_approval_link_by_token(_token varchar)
RETURNS TABLE (
  id uuid,
  orcamento_id uuid,
  token varchar,
  status text,
  approved_at timestamptz,
  rejected_at timestamptz,
  rejection_reason text,
  expires_at timestamptz,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, orcamento_id, token, status, approved_at, rejected_at, rejection_reason, expires_at, created_at
  FROM public.orcamento_approval_links
  WHERE token = _token
    AND (expires_at IS NULL OR expires_at > now())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_approval_link_by_token(varchar) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_approval_link_by_token(varchar) TO anon, authenticated;

-- 2) notas_fiscais: add direct user_id ownership as fallback
DROP POLICY IF EXISTS "Users access nf of own orcamentos" ON public.notas_fiscais;
CREATE POLICY "Users access own notas fiscais"
ON public.notas_fiscais
FOR ALL
TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = notas_fiscais.orcamento_id AND o.user_id = auth.uid())
)
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = notas_fiscais.orcamento_id AND o.user_id = auth.uid())
);

-- 3) orcamento_status_history: enforce immutability explicitly
CREATE POLICY "No updates to status history"
ON public.orcamento_status_history
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "No deletes from status history"
ON public.orcamento_status_history
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);
