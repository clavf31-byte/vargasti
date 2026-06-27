CREATE TABLE IF NOT EXISTS public.agenda_eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL DEFAULT 'compromisso'
    CONSTRAINT agenda_tipo CHECK (tipo IN ('reuniao','visita','compromisso','prazo','lembrete','outro')),
  data_inicio TIMESTAMPTZ NOT NULL,
  data_fim TIMESTAMPTZ,
  dia_inteiro BOOLEAN NOT NULL DEFAULT false,
  local TEXT,
  status TEXT NOT NULL DEFAULT 'agendado'
    CONSTRAINT agenda_status CHECK (status IN ('agendado','confirmado','cancelado','concluido')),
  prioridade TEXT NOT NULL DEFAULT 'normal'
    CONSTRAINT agenda_prioridade CHECK (prioridade IN ('alta','normal','baixa')),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  chamado_id UUID REFERENCES public.chamados(id) ON DELETE SET NULL,
  os_id UUID REFERENCES public.ordens_servico(id) ON DELETE SET NULL,
  notificar_whatsapp BOOLEAN NOT NULL DEFAULT false,
  notificar_numero TEXT,
  notificar_minutos_antes INTEGER NOT NULL DEFAULT 30,
  notificado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_eventos TO authenticated;
GRANT ALL ON public.agenda_eventos TO service_role;

ALTER TABLE public.agenda_eventos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_agenda" ON public.agenda_eventos
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_agenda_eventos_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_agenda_eventos_updated_at
  BEFORE UPDATE ON public.agenda_eventos
  FOR EACH ROW EXECUTE FUNCTION public.update_agenda_eventos_updated_at();

CREATE INDEX IF NOT EXISTS idx_agenda_eventos_user_data ON public.agenda_eventos (user_id, data_inicio);
CREATE INDEX IF NOT EXISTS idx_agenda_eventos_cliente ON public.agenda_eventos (cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_eventos_chamado ON public.agenda_eventos (chamado_id) WHERE chamado_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agenda_eventos_os ON public.agenda_eventos (os_id) WHERE os_id IS NOT NULL;