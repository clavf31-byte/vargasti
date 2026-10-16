-- Criar tabela orcamento_modelos para armazenar modelos de orçamento
CREATE TABLE IF NOT EXISTS orcamento_modelos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  itens JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_orcamento_modelos_user ON orcamento_modelos(user_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_modelos_created ON orcamento_modelos(user_id, created_at DESC);

-- RLS: Usuário só vê seus próprios modelos
ALTER TABLE orcamento_modelos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quote models"
  ON orcamento_modelos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create quote models"
  ON orcamento_modelos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quote models"
  ON orcamento_modelos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quote models"
  ON orcamento_modelos FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER trg_orcamento_modelos_updated_at
  BEFORE UPDATE ON orcamento_modelos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON orcamento_modelos TO authenticated;
GRANT ALL ON orcamento_modelos TO service_role;
