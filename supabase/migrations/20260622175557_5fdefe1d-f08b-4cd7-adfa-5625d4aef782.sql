ALTER TABLE public.pagamentos
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente';

CREATE OR REPLACE FUNCTION public.criar_pagamento_ao_aprovar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status_enum = 'aprovado' AND (OLD.status_enum IS DISTINCT FROM 'aprovado') THEN
    IF NOT EXISTS (SELECT 1 FROM public.pagamentos WHERE orcamento_id = NEW.id) THEN
      INSERT INTO public.pagamentos (orcamento_id, user_id, valor, status, data_pagamento, referencia)
      VALUES (NEW.id, NEW.user_id, NEW.total, 'pendente', CURRENT_DATE, NEW.numero_formatado);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_criar_pagamento_ao_aprovar ON public.orcamentos;
CREATE TRIGGER trg_criar_pagamento_ao_aprovar
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.criar_pagamento_ao_aprovar();