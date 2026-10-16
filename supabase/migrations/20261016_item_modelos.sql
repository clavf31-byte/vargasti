-- Criar tabela item_modelos para armazenar modelos de itens (serviços/peças)
CREATE TABLE IF NOT EXISTS item_modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT CHECK (tipo IN ('servico', 'peca')) DEFAULT 'servico',
  preco_unitario NUMERIC(10,2) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'Unidade',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_item_modelos_user ON item_modelos(user_id);
CREATE INDEX IF NOT EXISTS idx_item_modelos_tipo ON item_modelos(user_id, tipo);
CREATE INDEX IF NOT EXISTS idx_item_modelos_created ON item_modelos(user_id, created_at DESC);

-- RLS: Usuário só vê seus próprios modelos
ALTER TABLE item_modelos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own item models"
  ON item_modelos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create item models"
  ON item_modelos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own item models"
  ON item_modelos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own item models"
  ON item_modelos FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER trg_item_modelos_updated_at
  BEFORE UPDATE ON item_modelos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON item_modelos TO authenticated;
GRANT ALL ON item_modelos TO service_role;
