-- ============================================================
-- FASE 1: Remover Atendimento → Orçamento como ENTRADA
-- Data: 2026-10-02
-- Objetivo: Adicionar campos descritivos a orcamentos
-- ============================================================

-- 1. Adicionar campos descritivos a orcamentos (entrada completa)
ALTER TABLE orcamentos
  ADD COLUMN IF NOT EXISTS descricao TEXT,           -- Descrição do problema/equipamento
  ADD COLUMN IF NOT EXISTS observacoes TEXT,         -- Observações adicionais
  ADD COLUMN IF NOT EXISTS local TEXT,               -- Onde o equipamento está/foi levado
  ADD COLUMN IF NOT EXISTS data_agendamento DATE;    -- Quando será feito

-- 2. Remover vinculação com atendimentos (não usaremos mais)
-- ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS fk_orcamentos_atendimento;
-- ALTER TABLE orcamentos DROP COLUMN IF EXISTS atendimento_id;
-- (Deixar coluna por enquanto em caso de rollback, mas não usamos)

-- 3. Deletar dados de atendimentos (conforme solicitado)
-- DELETE FROM atendimentos;
-- (Comentado por segurança - descomente se tiver certeza)

-- 4. Criar índices para performance nas novas colunas
CREATE INDEX IF NOT EXISTS idx_orcamentos_data_agendamento ON orcamentos(data_agendamento);

-- ============================================================
-- Resultado esperado:
-- - Orcamento agora é a entrada completa do fluxo
-- - Possui: cliente, descrição, itens, observações, local, agendamento
-- - Próximo passo: Atualizar triggers e UI
-- ============================================================
