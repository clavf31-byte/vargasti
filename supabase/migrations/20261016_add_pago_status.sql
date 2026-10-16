-- Adicionar status 'pago' ao enum de status do orçamento
ALTER TABLE orcamentos
DROP CONSTRAINT IF EXISTS orcamentos_status_enum_check;

ALTER TABLE orcamentos
ADD CONSTRAINT orcamentos_status_enum_check
CHECK (status_enum IN ('rascunho','enviado','visualizado','aprovado','rejeitado','cancelado','faturado','pago'));

-- Adicionar coluna data_pagamento se não existir
ALTER TABLE orcamentos
ADD COLUMN IF NOT EXISTS data_pagamento TIMESTAMP WITH TIME ZONE;
