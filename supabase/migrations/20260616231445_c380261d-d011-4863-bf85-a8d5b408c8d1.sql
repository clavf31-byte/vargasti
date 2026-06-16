
-- Fase 1: CRM - Numeração, Serviços, Peças, Financeiro

-- 1. orcamento_sequences
CREATE TABLE public.orcamento_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  next_number INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, year)
);
CREATE INDEX idx_orcamento_sequences_user_year ON public.orcamento_sequences(user_id, year);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamento_sequences TO authenticated;
GRANT ALL ON public.orcamento_sequences TO service_role;
ALTER TABLE public.orcamento_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sequences" ON public.orcamento_sequences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. servicos
CREATE TABLE public.servicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor_padrao NUMERIC(10,2) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'Unidade',
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_servicos_user ON public.servicos(user_id);
CREATE INDEX idx_servicos_ativo ON public.servicos(ativo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.servicos TO authenticated;
GRANT ALL ON public.servicos TO service_role;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own services" ON public.servicos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_servicos_updated_at BEFORE UPDATE ON public.servicos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. pecas
CREATE TABLE public.pecas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  fabricante TEXT,
  valor_custo NUMERIC(10,2) NOT NULL DEFAULT 0,
  valor_venda NUMERIC(10,2) NOT NULL DEFAULT 0,
  estoque INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, codigo)
);
CREATE INDEX idx_pecas_user ON public.pecas(user_id);
CREATE INDEX idx_pecas_ativo ON public.pecas(ativo);
CREATE INDEX idx_pecas_codigo ON public.pecas(codigo);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pecas TO authenticated;
GRANT ALL ON public.pecas TO service_role;
ALTER TABLE public.pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own parts" ON public.pecas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_pecas_updated_at BEFORE UPDATE ON public.pecas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. orcamentos: novos campos
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS numero_formatado TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS status_enum TEXT CHECK (status_enum IN ('rascunho','enviado','visualizado','aprovado','rejeitado','cancelado','faturado')) DEFAULT 'rascunho',
  ADD COLUMN IF NOT EXISTS desconto NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS impostos NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS data_visualizacao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_aprovacao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS data_rejeicao TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS motivo_rejeicao TEXT;

UPDATE public.orcamentos SET status_enum = 'rascunho' WHERE status = 'rascunho' AND status_enum IS NULL;
UPDATE public.orcamentos SET status_enum = 'enviado' WHERE status = 'enviado' AND status_enum IS NULL;
UPDATE public.orcamentos SET status_enum = 'aprovado' WHERE status = 'aprovado' AND status_enum IS NULL;
UPDATE public.orcamentos SET status_enum = 'faturado' WHERE status = 'pago' AND status_enum IS NULL;

-- 5. orcamento_itens: tipos
ALTER TABLE public.orcamento_itens
  ADD COLUMN IF NOT EXISTS tipo TEXT CHECK (tipo IN ('servico','peca')) DEFAULT 'peca',
  ADD COLUMN IF NOT EXISTS servico_id UUID REFERENCES public.servicos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS peca_id UUID REFERENCES public.pecas(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_servico ON public.orcamento_itens(servico_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_itens_peca ON public.orcamento_itens(peca_id);

-- 6. cliente_financeiro
CREATE TABLE public.cliente_financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_orcamentos NUMERIC(10,2) NOT NULL DEFAULT 0,
  qtd_orcamentos INT NOT NULL DEFAULT 0,
  total_os NUMERIC(10,2) NOT NULL DEFAULT 0,
  qtd_os INT NOT NULL DEFAULT 0,
  total_nf NUMERIC(10,2) NOT NULL DEFAULT 0,
  qtd_nf INT NOT NULL DEFAULT 0,
  total_pago NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_aberto NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cliente_id)
);
CREATE INDEX idx_cliente_financeiro_user ON public.cliente_financeiro(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cliente_financeiro TO authenticated;
GRANT ALL ON public.cliente_financeiro TO service_role;
ALTER TABLE public.cliente_financeiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own client financial" ON public.cliente_financeiro FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_cliente_financeiro_updated_at BEFORE UPDATE ON public.cliente_financeiro FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
