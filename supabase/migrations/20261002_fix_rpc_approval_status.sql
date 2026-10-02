-- ============================================================
-- Fix: RPC approve_orcamento_by_token não estava atualizando status TEXT
-- Isso impedia o trigger de disparar ao aprovar via email link
-- ============================================================

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
         status = 'aprovado',           -- FIX: Adicionar coluna status TEXT
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
