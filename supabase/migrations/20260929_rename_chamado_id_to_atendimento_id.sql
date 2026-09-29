-- ============================================================
-- Renomear chamado_id para atendimento_id em agenda_eventos
-- Mantém consistência com renomeação de tabela chamados → atendimentos
-- ============================================================

-- 1. Remover constraint de FK se existir com nome específico
ALTER TABLE agenda_eventos
DROP CONSTRAINT IF EXISTS fk_agenda_eventos_chamado_id;

-- 2. Renomear coluna
ALTER TABLE agenda_eventos
RENAME COLUMN chamado_id TO atendimento_id;

-- 3. Recriar FK com novo nome
ALTER TABLE agenda_eventos
ADD CONSTRAINT fk_agenda_eventos_atendimento_id
FOREIGN KEY (atendimento_id) REFERENCES atendimentos(id) ON DELETE SET NULL;

-- 4. Recriar índice se existia
DROP INDEX IF EXISTS idx_agenda_eventos_chamado_id;
CREATE INDEX idx_agenda_eventos_atendimento_id ON agenda_eventos(atendimento_id);
