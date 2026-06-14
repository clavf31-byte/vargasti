
-- ============ CLIENTES ============
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  documento TEXT,
  endereco TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own clientes" ON public.clientes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ ORCAMENTOS ============
CREATE TABLE IF NOT EXISTS public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  data_vencimento DATE,
  notas TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  alerta_enviado BOOLEAN NOT NULL DEFAULT FALSE,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamentos TO authenticated;
GRANT ALL ON public.orcamentos TO service_role;
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own orcamentos" ON public.orcamentos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente ON public.orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_user ON public.orcamentos(user_id);

-- ============ EMAIL_LOGS ============
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'enviado',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_logs TO authenticated;
GRANT ALL ON public.email_logs TO service_role;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access email_logs of own orcamentos" ON public.email_logs
  FOR ALL TO authenticated
  USING (
    orcamento_id IS NULL OR EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = email_logs.orcamento_id AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    orcamento_id IS NULL OR EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = email_logs.orcamento_id AND o.user_id = auth.uid()
    )
  );
CREATE INDEX IF NOT EXISTS idx_email_logs_orcamento ON public.email_logs(orcamento_id);

-- ============ NOTAS_FISCAIS ============
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero TEXT NOT NULL UNIQUE,
  valor_total NUMERIC(12,2) NOT NULL,
  data_emissao DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'gerada',
  pdf_url TEXT,
  xml_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notas_fiscais TO authenticated;
GRANT ALL ON public.notas_fiscais TO service_role;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access nf of own orcamentos" ON public.notas_fiscais
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orcamentos o
    WHERE o.id = notas_fiscais.orcamento_id AND o.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orcamentos o
    WHERE o.id = notas_fiscais.orcamento_id AND o.user_id = auth.uid()
  ));
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_orcamento ON public.notas_fiscais(orcamento_id);

-- ============ ALERTAS ============
CREATE TABLE IF NOT EXISTS public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  severidade TEXT NOT NULL DEFAULT 'warning',
  lido BOOLEAN NOT NULL DEFAULT FALSE,
  data_criacao TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_leitura TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alertas TO authenticated;
GRANT ALL ON public.alertas TO service_role;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users access alertas of own orcamentos" ON public.alertas
  FOR ALL TO authenticated
  USING (
    orcamento_id IS NULL OR EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = alertas.orcamento_id AND o.user_id = auth.uid()
    )
  )
  WITH CHECK (
    orcamento_id IS NULL OR EXISTS (
      SELECT 1 FROM public.orcamentos o
      WHERE o.id = alertas.orcamento_id AND o.user_id = auth.uid()
    )
  );
CREATE INDEX IF NOT EXISTS idx_alertas_orcamento ON public.alertas(orcamento_id);

-- ============ TRIGGERS updated_at ============
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_orcamentos_updated BEFORE UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_notas_fiscais_updated BEFORE UPDATE ON public.notas_fiscais
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
