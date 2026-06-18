CREATE OR REPLACE FUNCTION public.approve_orcamento_by_token(_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rows integer;
BEGIN
  UPDATE public.orcamentos
     SET approval_status = 'approved',
         status_enum = 'aprovado',
         approved_at = now(),
         data_aprovacao = now(),
         updated_at = now()
   WHERE approval_token = _token
     AND approval_token IS NOT NULL
     AND approval_status = 'pending';
  GET DIAGNOSTICS _rows = ROW_COUNT;
  RETURN _rows > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_orcamento_by_token(_token text, _motivo text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _rows integer;
BEGIN
  UPDATE public.orcamentos
     SET approval_status = 'rejected',
         status_enum = 'rejeitado',
         rejected_at = now(),
         data_rejeicao = now(),
         motivo_rejeicao = _motivo,
         updated_at = now()
   WHERE approval_token = _token
     AND approval_token IS NOT NULL
     AND approval_status = 'pending';
  GET DIAGNOSTICS _rows = ROW_COUNT;
  RETURN _rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.approve_orcamento_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reject_orcamento_by_token(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.approve_orcamento_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reject_orcamento_by_token(text, text) TO anon, authenticated;