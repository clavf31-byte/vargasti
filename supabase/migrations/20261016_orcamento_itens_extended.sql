-- Adicionar campos faltando em orcamento_itens
ALTER TABLE orcamento_itens
ADD COLUMN IF NOT EXISTS tipo TEXT CHECK (tipo IN ('servico', 'peca')),
ADD COLUMN IF NOT EXISTS servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS peca_id UUID REFERENCES pecas(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS tarefas JSONB DEFAULT '[]'::jsonb;

-- Índices
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_tipo ON orcamento_itens(tipo);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_servico ON orcamento_itens(servico_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_peca ON orcamento_itens(peca_id);
