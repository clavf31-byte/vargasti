-- ============================================================
-- orcamento_compartilhamento : rastreio de compartilhamentos
-- Re-executável (idempotente)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.orcamento_compartilhamento (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id  uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  cliente_id    uuid NOT NULL REFERENCES public.clientes(id)  ON DELETE CASCADE,
  canal         text NOT NULL CHECK (canal  IN ('whatsapp','email','sms','qrcode')),
  status        text NOT NULL DEFAULT 'enviado'
                CHECK (status IN ('enviado','visualizado','clicado','aprovado','rejeitado')),
  enviado_em      timestamptz DEFAULT now(),
  visualizado_em  timestamptz,
  clicado_em      timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orc_compart_orcamento_id ON public.orcamento_compartilhamento(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orc_compart_cliente_id   ON public.orcamento_compartilhamento(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orc_compart_canal        ON public.orcamento_compartilhamento(canal);
CREATE INDEX IF NOT EXISTS idx_orc_compart_status       ON public.orcamento_compartilhamento(status);

ALTER TABLE public.orcamento_compartilhamento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "orc_compart_select_own" ON public.orcamento_compartilhamento;
CREATE POLICY "orc_compart_select_own"
  ON public.orcamento_compartilhamento FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orcamentos o
    WHERE o.id = orcamento_compartilhamento.orcamento_id
      AND o.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "orc_compart_insert_own" ON public.orcamento_compartilhamento;
CREATE POLICY "orc_compart_insert_own"
  ON public.orcamento_compartilhamento FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orcamentos o
    WHERE o.id = orcamento_compartilhamento.orcamento_id
      AND o.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "orc_compart_update_own" ON public.orcamento_compartilhamento;
CREATE POLICY "orc_compart_update_own"
  ON public.orcamento_compartilhamento FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.orcamentos o
    WHERE o.id = orcamento_compartilhamento.orcamento_id
      AND o.user_id = auth.uid()
  ));
