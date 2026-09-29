-- ============================================================
-- Adicionar campos necessários para automação do fluxo
-- ============================================================

-- 1. Adicionar campos faltantes à tabela pagamentos
ALTER TABLE pagamentos
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS atendimento_id uuid,
  ADD COLUMN IF NOT EXISTS descricao text;

-- 2. Adicionar foreign key para atendimentos
ALTER TABLE pagamentos
  ADD CONSTRAINT IF NOT EXISTS fk_pagamentos_atendimento
  FOREIGN KEY (atendimento_id) REFERENCES atendimentos(id) ON DELETE SET NULL;

-- 3. Criar index para performance
CREATE INDEX IF NOT EXISTS idx_pagamentos_atendimento_id ON pagamentos(atendimento_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_status ON pagamentos(status);

-- 4. Garantir que atendimentos tem coluna 'status'
ALTER TABLE atendimentos
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'aberto';

-- 5. Criar trigger para update_at automático em pagamentos (se não existir)
DROP TRIGGER IF EXISTS trg_pagamentos_updated_at ON pagamentos;
CREATE TRIGGER trg_pagamentos_updated_at
  BEFORE UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION touch_atendimentos_updated_at();
