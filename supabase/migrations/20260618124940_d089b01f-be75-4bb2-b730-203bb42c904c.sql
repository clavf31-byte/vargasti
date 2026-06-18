CREATE OR REPLACE FUNCTION public.atualizar_financeiro_orcamento()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status_enum = 'aprovado' AND (OLD.status_enum IS DISTINCT FROM 'aprovado') THEN
    INSERT INTO public.cliente_financeiro (cliente_id, user_id, total_orcamentos, qtd_orcamentos)
    VALUES (NEW.cliente_id, NEW.user_id, COALESCE(NEW.total, 0), 1)
    ON CONFLICT (cliente_id) DO UPDATE
      SET total_orcamentos = COALESCE(public.cliente_financeiro.total_orcamentos, 0) + COALESCE(NEW.total, 0),
          qtd_orcamentos = COALESCE(public.cliente_financeiro.qtd_orcamentos, 0) + 1,
          updated_at = now();
  END IF;
  RETURN NEW;
END;
$function$;