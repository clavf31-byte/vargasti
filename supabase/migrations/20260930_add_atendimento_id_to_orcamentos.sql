-- ============================================================
-- Adicionar coluna atendimento_id à tabela orcamentos
-- Permite vincular orçamento a um atendimento específico
-- ============================================================

ALTER TABLE orcamentos
ADD COLUMN atendimento_id UUID NULL
REFERENCES atendimentos(id) ON DELETE SET NULL;

CREATE INDEX idx_orcamentos_atendimento ON orcamentos(atendimento_id);
