
-- =========================================================
-- FASE 2: Automation & Workflow
-- =========================================================

-- 1. orcamento_approval_links
CREATE TABLE public.orcamento_approval_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_approval_links_token ON public.orcamento_approval_links(token);
CREATE INDEX idx_approval_links_orcamento ON public.orcamento_approval_links(orcamento_id);

GRANT SELECT ON public.orcamento_approval_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamento_approval_links TO authenticated;
GRANT ALL ON public.orcamento_approval_links TO service_role;

ALTER TABLE public.orcamento_approval_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view by token"
  ON public.orcamento_approval_links FOR SELECT
  USING (true);

CREATE POLICY "Owners manage approval links"
  ON public.orcamento_approval_links FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.user_id = auth.uid()));

-- 2. ordens_servico
CREATE TABLE public.ordens_servico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  numero_formatado TEXT UNIQUE,
  descricao TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'aberta',
  prioridade VARCHAR(20) NOT NULL DEFAULT 'normal',
  data_inicio DATE,
  data_conclusao DATE,
  responsavel_id UUID,
  anotacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_os_user ON public.ordens_servico(user_id);
CREATE INDEX idx_os_cliente ON public.ordens_servico(cliente_id);
CREATE INDEX idx_os_orcamento ON public.ordens_servico(orcamento_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_servico TO authenticated;
GRANT ALL ON public.ordens_servico TO service_role;

ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own OS"
  ON public.ordens_servico FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_ordens_servico_updated_at
  BEFORE UPDATE ON public.ordens_servico
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. os_itens
CREATE TABLE public.os_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id UUID NOT NULL REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('servico','peca')),
  servico_id UUID REFERENCES public.servicos(id) ON DELETE SET NULL,
  peca_id UUID REFERENCES public.pecas(id) ON DELETE SET NULL,
  quantidade NUMERIC(10,2),
  preco_unitario NUMERIC(10,2),
  subtotal NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_os_itens_os ON public.os_itens(os_id);
CREATE INDEX idx_os_itens_servico ON public.os_itens(servico_id);
CREATE INDEX idx_os_itens_peca ON public.os_itens(peca_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.os_itens TO authenticated;
GRANT ALL ON public.os_itens TO service_role;

ALTER TABLE public.os_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage items of own OS"
  ON public.os_itens FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.ordens_servico os WHERE os.id = os_id AND os.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.ordens_servico os WHERE os.id = os_id AND os.user_id = auth.uid()));

-- 4. notas_fiscais (existing) — add missing columns
ALTER TABLE public.notas_fiscais
  ADD COLUMN IF NOT EXISTS user_id UUID,
  ADD COLUMN IF NOT EXISTS os_id UUID REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS numero_nfe TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS serie_nfe INT,
  ADD COLUMN IF NOT EXISTS data_saida DATE,
  ADD COLUMN IF NOT EXISTS valor_subtotal NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS valor_desconto NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS valor_impostos NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS chave_acesso VARCHAR(44),
  ADD COLUMN IF NOT EXISTS protocolo_autorizacao VARCHAR(20),
  ADD COLUMN IF NOT EXISTS xml_nfe TEXT;

CREATE INDEX IF NOT EXISTS idx_nf_user ON public.notas_fiscais(user_id);
CREATE INDEX IF NOT EXISTS idx_nf_cliente ON public.notas_fiscais(cliente_id);
CREATE INDEX IF NOT EXISTS idx_nf_orcamento ON public.notas_fiscais(orcamento_id);

-- 5. orcamento_status_history
CREATE TABLE public.orcamento_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50) NOT NULL,
  motivo TEXT,
  alterado_por UUID,
  data_alteracao TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_status_hist_orcamento ON public.orcamento_status_history(orcamento_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.orcamento_status_history TO authenticated;
GRANT ALL ON public.orcamento_status_history TO service_role;

ALTER TABLE public.orcamento_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view orcamento history"
  ON public.orcamento_status_history FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.user_id = auth.uid()));

CREATE POLICY "Owners insert orcamento history"
  ON public.orcamento_status_history FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.orcamentos o WHERE o.id = orcamento_id AND o.user_id = auth.uid()));

-- 6. orcamentos — approval fields
ALTER TABLE public.orcamentos
  ADD COLUMN IF NOT EXISTS approval_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- 7. Helper function: generate approval token
CREATE OR REPLACE FUNCTION public.gerar_approval_token()
RETURNS VARCHAR
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- 8. Trigger: update cliente_financeiro on orcamento approval
CREATE OR REPLACE FUNCTION public.atualizar_financeiro_orcamento()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status_enum = 'aprovado' AND (OLD.status_enum IS DISTINCT FROM 'aprovado') THEN
    INSERT INTO public.cliente_financeiro (cliente_id, total_orcamentos, qtd_orcamentos)
    VALUES (NEW.cliente_id, COALESCE(NEW.total, 0), 1)
    ON CONFLICT (cliente_id) DO UPDATE
      SET total_orcamentos = COALESCE(public.cliente_financeiro.total_orcamentos, 0) + COALESCE(NEW.total, 0),
          qtd_orcamentos = COALESCE(public.cliente_financeiro.qtd_orcamentos, 0) + 1,
          updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orcamento_financeiro ON public.orcamentos;
CREATE TRIGGER trg_orcamento_financeiro
  AFTER INSERT OR UPDATE ON public.orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_financeiro_orcamento();
