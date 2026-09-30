-- ============================================================
-- Sincronizar Status Atendimento com Pagamento
-- Se Pagamento está 'pago', Atendimento automaticamente fica 'concluido'
-- ============================================================

-- 1. Sincronizar Atendimentos que têm Pagamento pago
UPDATE atendimentos
SET status = 'concluido',
    data_conclusao = CURRENT_DATE,
    updated_at = NOW()
WHERE pagamento_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM pagamentos
    WHERE pagamentos.id = atendimentos.pagamento_id
    AND pagamentos.status = 'pago'
  )
  AND status != 'concluido';

-- 2. Função que força sincronização quando Pagamento é atualizado
CREATE OR REPLACE FUNCTION sincronizar_atendimento_pagamento_pago()
RETURNS TRIGGER AS $$
DECLARE
  v_atendimento_id uuid;
BEGIN
  -- Se Pagamento foi mudado para 'pago'
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    -- Atualizar Atendimento vinculado
    UPDATE atendimentos
    SET status = 'concluido',
        data_conclusao = COALESCE(data_conclusao, CURRENT_DATE),
        updated_at = NOW()
    WHERE pagamento_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger quando Pagamento é atualizado para 'pago'
DROP TRIGGER IF EXISTS trg_sincronizar_atendimento_pagamento_pago ON pagamentos;
CREATE TRIGGER trg_sincronizar_atendimento_pagamento_pago
  AFTER UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION sincronizar_atendimento_pagamento_pago();
