# Tabelas para Novas Features do CRM

Execute este SQL no Lovable:

```sql
-- 1. ORCAMENTO_ITENS (Itens do Orçamento)
CREATE TABLE IF NOT EXISTS public.orcamento_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  quantidade DECIMAL(10, 2) NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(12, 2) NOT NULL,
  subtotal DECIMAL(12, 2) NOT NULL,
  ordem INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orcamento_itens_orcamento_id ON public.orcamento_itens(orcamento_id);

ALTER TABLE public.orcamento_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orcamento_itens" ON public.orcamento_itens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = orcamento_itens.orcamento_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own orcamento_itens" ON public.orcamento_itens
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = orcamento_itens.orcamento_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own orcamento_itens" ON public.orcamento_itens
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = orcamento_itens.orcamento_id
      AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own orcamento_itens" ON public.orcamento_itens
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = orcamento_itens.orcamento_id
      AND o.user_id = auth.uid()
    )
  );

-- 2. TAREFAS (Tasks/Follow-ups)
CREATE TABLE IF NOT EXISTS public.tarefas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_progresso', 'concluida')),
  prioridade TEXT DEFAULT 'normal' CHECK (prioridade IN ('baixa', 'normal', 'alta')),
  data_vencimento TIMESTAMPTZ NOT NULL,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  criada_em TIMESTAMPTZ DEFAULT now(),
  concluida_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tarefas_user_id ON public.tarefas(user_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_cliente_id ON public.tarefas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_orcamento_id ON public.tarefas(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON public.tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_vencimento ON public.tarefas(data_vencimento);

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tarefas" ON public.tarefas
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = responsavel_id);

CREATE POLICY "Users can insert own tarefas" ON public.tarefas
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tarefas" ON public.tarefas
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = responsavel_id);

CREATE POLICY "Users can delete own tarefas" ON public.tarefas
  FOR DELETE USING (auth.uid() = user_id);
```

Depois confirme que as 2 tabelas foram criadas!
