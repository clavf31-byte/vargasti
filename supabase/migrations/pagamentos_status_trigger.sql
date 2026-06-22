-- Adiciona coluna status em pagamentos e trigger automático ao aprovar orçamento
-- Cole no Lovable > Supabase > SQL Editor e execute

-- 1. Coluna status
ALTER TABLE pagamentos
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente';

-- 2. Função do trigger
CREATE OR REPLACE FUNCTION criar_pagamento_ao_aprovar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status_enum = 'aprovado' AND (OLD.status_enum IS DISTINCT FROM 'aprovado') THEN
    IF NOT EXISTS (SELECT 1 FROM pagamentos WHERE orcamento_id = NEW.id) THEN
      INSERT INTO pagamentos (orcamento_id, user_id, valor, status, data_pagamento, referencia)
      VALUES (NEW.id, NEW.user_id, NEW.total, 'pendente', CURRENT_DATE, NEW.numero_formatado);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Trigger na tabela orcamentos
DROP TRIGGER IF EXISTS trg_criar_pagamento_ao_aprovar ON orcamentos;
CREATE TRIGGER trg_criar_pagamento_ao_aprovar
  AFTER UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION criar_pagamento_ao_aprovar();
