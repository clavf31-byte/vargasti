-- Tabela para rastrear compartilhamentos de orçamentos
CREATE TABLE IF NOT EXISTS public.orcamento_compartilhamento (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  orcamento_id uuid NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'email', 'sms', 'qrcode')),
  status TEXT NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'visualizado', 'clicado', 'aprovado', 'rejeitado')),
  enviado_em TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visualizado_em TIMESTAMP WITH TIME ZONE,
  clicado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_orcamento_compartilhamento_orcamento_id ON public.orcamento_compartilhamento(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_compartilhamento_cliente_id ON public.orcamento_compartilhamento(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamento_compartilhamento_canal ON public.orcamento_compartilhamento(canal);
CREATE INDEX IF NOT EXISTS idx_orcamento_compartilhamento_status ON public.orcamento_compartilhamento(status);

-- RLS (Row Level Security)
ALTER TABLE public.orcamento_compartilhamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver compartilhamentos de seus próprios orçamentos"
  ON public.orcamento_compartilhamento FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orcamentos
      WHERE orcamentos.id = orcamento_compartilhamento.orcamento_id
      AND orcamentos.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem inserir compartilhamentos de seus próprios orçamentos"
  ON public.orcamento_compartilhamento FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orcamentos
      WHERE orcamentos.id = orcamento_compartilhamento.orcamento_id
      AND orcamentos.user_id = auth.uid()
    )
  );
