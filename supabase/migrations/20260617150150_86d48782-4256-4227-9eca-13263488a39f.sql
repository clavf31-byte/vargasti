
-- 1) email_processing_log: explicit deny for non-service roles on writes
CREATE POLICY "deny_insert_email_processing_log"
  ON public.email_processing_log AS RESTRICTIVE
  FOR INSERT TO authenticated, anon
  WITH CHECK (false);

CREATE POLICY "deny_update_email_processing_log"
  ON public.email_processing_log AS RESTRICTIVE
  FOR UPDATE TO authenticated, anon
  USING (false) WITH CHECK (false);

CREATE POLICY "deny_delete_email_processing_log"
  ON public.email_processing_log AS RESTRICTIVE
  FOR DELETE TO authenticated, anon
  USING (false);

-- 2) Hide secret approval_token column from client roles.
--    Owners can still UPDATE it (UPDATE privilege is separate from SELECT)
--    and the link is delivered via email at generation time. PostgREST `*`
--    expansion respects column-level grants, so existing select("*") calls
--    keep working — they just no longer return this column.
REVOKE SELECT (approval_token) ON public.orcamentos FROM authenticated, anon, PUBLIC;

-- 3) Lock down SECURITY DEFINER functions from public/anon exposure.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.get_approval_link_by_token(varchar) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_approval_link_by_token(varchar) TO service_role;

REVOKE EXECUTE ON FUNCTION public.gerar_approval_token() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.gerar_approval_token() TO authenticated, service_role;
