
CREATE TABLE IF NOT EXISTS public.ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  orcamento_id uuid REFERENCES public.orcamentos(id) ON DELETE SET NULL,
  numero_formatado text,
  descricao text,
  status text NOT NULL DEFAULT 'aberta',
  prioridade text NOT NULL DEFAULT 'normal',
  data_inicio date DEFAULT CURRENT_DATE,
  data_prevista date,
  data_conclusao date,
  tecnico text,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ordens_servico TO authenticated;
GRANT ALL ON public.ordens_servico TO service_role;

ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ordens_servico' AND policyname='user_own_os'
  ) THEN
    CREATE POLICY "user_own_os" ON public.ordens_servico
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.os_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'peca',
  servico_id uuid,
  peca_id uuid,
  descricao text,
  quantidade numeric NOT NULL DEFAULT 1,
  preco_unitario numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.os_itens TO authenticated;
GRANT ALL ON public.os_itens TO service_role;

ALTER TABLE public.os_itens ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='os_itens' AND policyname='user_own_os_itens'
  ) THEN
    CREATE POLICY "user_own_os_itens" ON public.os_itens
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM public.ordens_servico
          WHERE ordens_servico.id = os_itens.os_id
            AND ordens_servico.user_id = auth.uid()
        )
      ) WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.ordens_servico
          WHERE ordens_servico.id = os_itens.os_id
            AND ordens_servico.user_id = auth.uid()
        )
      );
  END IF;
END $$;

ALTER TABLE public.pagamentos
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pendente';

CREATE OR REPLACE FUNCTION public.criar_pagamento_ao_aprovar()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status_enum = 'aprovado' AND (OLD.status_enum IS DISTINCT FROM 'aprovado') THEN
    IF NOT EXISTS (SELECT 1 FROM public.pagamentos WHERE orcamento_id = NEW.id) THEN
      INSERT INTO public.pagamentos (orcamento_id, user_id, valor, status, data_pagamento, referencia)
      VALUES (NEW.id, NEW.user_id, NEW.total, 'pendente', CURRENT_DATE, NEW.numero_formatado);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_criar_pagamento_ao_aprovar ON public.orcamentos;
CREATE TRIGGER trg_criar_pagamento_ao_aprovar
  AFTER UPDATE ON public.orcamentos
  FOR EACH ROW EXECUTE FUNCTION public.criar_pagamento_ao_aprovar();
