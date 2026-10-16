-- Atualizar status de orçamentos que já têm pagamentos confirmados
UPDATE orcamentos
SET status_enum = 'pago', data_pagamento = (
  SELECT MAX(data_pagamento)
  FROM pagamentos
  WHERE pagamentos.orcamento_id = orcamentos.id
  AND pagamentos.status = 'pago'
)
WHERE id IN (
  SELECT DISTINCT orcamento_id
  FROM pagamentos
  WHERE status = 'pago'
)
AND status_enum != 'pago';
