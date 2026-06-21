-- Chamados Fase 2: tabela principal + comentários + numeração + RLS

CREATE TABLE IF NOT EXISTS public.chamados (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_formatado  text UNIQUE,
  titulo            text NOT NULL,
  descricao         text,
  status            text NOT NULL DEFAULT 'aberto',
  prioridade        text NOT NULL DEFAULT 'normal',
  cliente_id        uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  responsavel_id    uuid,
  user_id           uuid REFERENCES auth.users(id) NOT NULL,
  anotacoes         text,
  data_inicio       date,
  data_conclusao    date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamados TO authenticated;
GRANT ALL ON public.chamados TO service_role;

ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chamado_comentarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id  uuid REFERENCES public.chamados(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES auth.users(id) NOT NULL,
  conteudo    text NOT NULL,
  tipo        text NOT NULL DEFAULT 'comentario',
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.chamado_comentarios TO authenticated;
GRANT ALL ON public.chamado_comentarios TO service_role;

ALTER TABLE public.chamado_comentarios ENABLE ROW LEVEL SECURITY;

-- Numeração CHA-0001
CREATE SEQUENCE IF NOT EXISTS public.chamados_numero_seq START 1;
GRANT USAGE ON SEQUENCE public.chamados_numero_seq TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.generate_chamado_numero()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.numero_formatado IS NULL THEN
    NEW.numero_formatado := 'CHA-' || LPAD(nextval('public.chamados_numero_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_chamado_numero ON public.chamados;
CREATE TRIGGER trg_chamado_numero
  BEFORE INSERT ON public.chamados
  FOR EACH ROW EXECUTE FUNCTION public.generate_chamado_numero();

DROP TRIGGER IF EXISTS trg_chamados_updated_at ON public.chamados;
CREATE TRIGGER trg_chamados_updated_at
  BEFORE UPDATE ON public.chamados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS policies
DROP POLICY IF EXISTS "chamados_owner" ON public.chamados;
CREATE POLICY "chamados_owner" ON public.chamados
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chamado_comentarios_owner" ON public.chamado_comentarios;
CREATE POLICY "chamado_comentarios_owner" ON public.chamado_comentarios
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.chamados WHERE id = chamado_id AND user_id = auth.uid())
  )
  WITH CHECK (auth.uid() = user_id);
