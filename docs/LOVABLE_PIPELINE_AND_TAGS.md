# Tabelas para Pipeline de Vendas e Tags de Clientes

Execute este SQL no Lovable:

```sql
-- 1. OPORTUNIDADES (Pipeline de Vendas)
CREATE TABLE IF NOT EXISTS public.oportunidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor DECIMAL(12, 2),
  probabilidade INT DEFAULT 50,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'qualificado', 'proposta', 'ganho', 'perdido')),
  etapa_data TIMESTAMPTZ DEFAULT now(),
  data_fechamento_esperada TIMESTAMPTZ,
  motivo_perda TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oportunidades_user_id ON public.oportunidades(user_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_cliente_id ON public.oportunidades(cliente_id);
CREATE INDEX IF NOT EXISTS idx_oportunidades_status ON public.oportunidades(status);

ALTER TABLE public.oportunidades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own oportunidades" ON public.oportunidades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oportunidades" ON public.oportunidades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own oportunidades" ON public.oportunidades
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own oportunidades" ON public.oportunidades
  FOR DELETE USING (auth.uid() = user_id);

-- 2. TAGS DE CLIENTES
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Criar tabela de enum para tags (opcional, para validação)
CREATE TABLE IF NOT EXISTS public.cliente_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(cliente_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_cliente_tags_cliente_id ON public.cliente_tags(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cliente_tags_tag ON public.cliente_tags(tag);

ALTER TABLE public.cliente_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cliente_tags" ON public.cliente_tags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_tags.cliente_id
      AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own cliente_tags" ON public.cliente_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.clientes c
      WHERE c.id = cliente_tags.cliente_id
      AND c.user_id = auth.uid()
    )
  );
```

Depois confirme que as tabelas foram criadas!
