-- Adicionar campo tarefas para armazenar lista de tarefas/componentes do modelo
ALTER TABLE item_modelos
ADD COLUMN IF NOT EXISTS tarefas JSONB DEFAULT '[]'::jsonb;

-- Atualizar índices se necessário
CREATE INDEX IF NOT EXISTS idx_item_modelos_user_updated ON item_modelos(user_id, updated_at DESC);
