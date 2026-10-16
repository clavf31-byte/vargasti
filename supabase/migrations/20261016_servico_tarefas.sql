-- Criar tabela servico_tarefas para armazenar tarefas/atividades de cada serviço
CREATE TABLE IF NOT EXISTS servico_tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servico_id UUID NOT NULL REFERENCES servicos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_servico_tarefas_servico ON servico_tarefas(servico_id);
CREATE INDEX IF NOT EXISTS idx_servico_tarefas_ordem ON servico_tarefas(servico_id, ordem);

-- RLS: Usuário só vê tarefas de seus próprios serviços
ALTER TABLE servico_tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own service tasks"
  ON servico_tarefas FOR SELECT
  USING (
    servico_id IN (
      SELECT id FROM servicos WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create tasks for own services"
  ON servico_tarefas FOR INSERT
  WITH CHECK (
    servico_id IN (
      SELECT id FROM servicos WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update tasks of own services"
  ON servico_tarefas FOR UPDATE
  USING (
    servico_id IN (
      SELECT id FROM servicos WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete tasks of own services"
  ON servico_tarefas FOR DELETE
  USING (
    servico_id IN (
      SELECT id FROM servicos WHERE user_id = auth.uid()
    )
  );

-- Trigger para atualizar updated_at
CREATE TRIGGER trg_servico_tarefas_updated_at
  BEFORE UPDATE ON servico_tarefas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON servico_tarefas TO authenticated;
GRANT ALL ON servico_tarefas TO service_role;
