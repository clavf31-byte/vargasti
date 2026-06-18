DROP FUNCTION IF EXISTS public.get_orcamento_by_approval_token(text);

CREATE OR REPLACE FUNCTION public.get_orcamento_by_approval_token(_token text)
 RETURNS TABLE(id uuid, numero text, numero_formatado text, cliente_id uuid, cliente_nome text, status text, status_enum text, approval_status character varying, total numeric, desconto numeric, impostos numeric, data_vencimento date, data_criacao timestamp with time zone, data_visualizacao timestamp with time zone, data_aprovacao timestamp with time zone, data_rejeicao timestamp with time zone, approved_at timestamp with time zone, rejected_at timestamp with time zone, motivo_rejeicao text, notas text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    o.id, o.numero, o.numero_formatado, o.cliente_id, c.nome AS cliente_nome,
    o.status, o.status_enum,
    o.approval_status, o.total, o.desconto, o.impostos,
    o.data_vencimento, o.data_criacao, o.data_visualizacao,
    o.data_aprovacao, o.data_rejeicao, o.approved_at, o.rejected_at,
    o.motivo_rejeicao, o.notas, o.created_at, o.updated_at
  FROM public.orcamentos o
  LEFT JOIN public.clientes c ON c.id = o.cliente_id
  WHERE o.approval_token = _token
    AND o.approval_token IS NOT NULL
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_orcamento_by_approval_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_orcamento_by_approval_token(text) TO anon, authenticated;