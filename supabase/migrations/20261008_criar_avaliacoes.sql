-- Criar tabela de avaliações de clientes
CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comentario TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  UNIQUE(orcamento_id)
);

-- Criar índices
CREATE INDEX idx_avaliacoes_cliente ON avaliacoes(cliente_id);
CREATE INDEX idx_avaliacoes_user ON avaliacoes(user_id);
CREATE INDEX idx_avaliacoes_created ON avaliacoes(created_at DESC);

-- RLS: Clientes podem ler apenas suas avaliações via link público (sem user_id)
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avaliacoes - Usuário pode ler suas avaliações"
  ON avaliacoes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Avaliacoes - Usuário pode criar avaliações"
  ON avaliacoes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Avaliacoes - Usuário pode atualizar suas avaliações"
  ON avaliacoes FOR UPDATE
  USING (auth.uid() = user_id);
