CREATE OR REPLACE FUNCTION public.get_orcamento_by_approval_token(_token text)
RETURNS TABLE (
  id uuid,
  numero text,
  numero_formatado text,
  cliente_id uuid,
  status text,
  status_enum text,
  approval_status varchar,
  total numeric,
  desconto numeric,
  impostos numeric,
  data_vencimento date,
  data_criacao timestamptz,
  data_visualizacao timestamptz,
  data_aprovacao timestamptz,
  data_rejeicao timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  motivo_rejeicao text,
  notas text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id, o.numero, o.numero_formatado, o.cliente_id, o.status, o.status_enum,
    o.approval_status, o.total, o.desconto, o.impostos,
    o.data_vencimento, o.data_criacao, o.data_visualizacao,
    o.data_aprovacao, o.data_rejeicao, o.approved_at, o.rejected_at,
    o.motivo_rejeicao, o.notas, o.created_at, o.updated_at
  FROM public.orcamentos o
  WHERE o.approval_token = _token
    AND o.approval_token IS NOT NULL
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_orcamento_by_approval_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_orcamento_itens_by_approval_token(_token text)
RETURNS SETOF public.orcamento_itens
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.*
  FROM public.orcamento_itens i
  JOIN public.orcamentos o ON o.id = i.orcamento_id
  WHERE o.approval_token = _token
    AND o.approval_token IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.get_orcamento_itens_by_approval_token(text) TO anon, authenticated;