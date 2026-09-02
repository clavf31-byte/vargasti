-- ============================================================
-- Ordens de Serviço: numeração atômica + coluna tecnico
-- Re-executável (idempotente)
-- ============================================================

-- 1. Coluna tecnico — o código (crm.os.index.tsx, OSForm) já referencia,
--    faltava no banco. Texto livre com o nome do técnico responsável.
ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS tecnico text;

-- 2. Sequência própria de OS (independente de orcamento_sequences).
--    Convenção: next_number = quantidade que existirá APÓS a próxima chamada.
CREATE TABLE IF NOT EXISTS public.os_sequences (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL,
  year        int  NOT NULL,
  next_number int  NOT NULL DEFAULT 1,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, year)
);

ALTER TABLE public.os_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "os_sequences_own" ON public.os_sequences;
CREATE POLICY "os_sequences_own"
  ON public.os_sequences FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. RPC atômico: reserva e devolve o próximo número já formatado.
--    INSERT ... ON CONFLICT DO UPDATE ... RETURNING num uma statement só
--    => sem race entre duas OS criadas ao mesmo tempo.
CREATE OR REPLACE FUNCTION public.gerar_numero_os(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _year int := extract(year from now())::int;
  _n    int;
BEGIN
  -- Só deixa reservar número para a própria conta.
  IF _user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'não autorizado';
  END IF;

  INSERT INTO public.os_sequences (user_id, year, next_number)
  VALUES (_user_id, _year, 2)
  ON CONFLICT (user_id, year)
  DO UPDATE SET next_number = public.os_sequences.next_number + 1
  RETURNING next_number - 1 INTO _n;

  RETURN 'OS-' || _year || '-' || lpad(_n::text, 6, '0');
END;
$$;

GRANT EXECUTE ON FUNCTION public.gerar_numero_os(uuid) TO authenticated;
