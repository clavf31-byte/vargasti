-- Adiciona coluna de número (sequencial) para atendimentos
ALTER TABLE public.atendimentos
ADD COLUMN IF NOT EXISTS numero INT,
ADD COLUMN IF NOT EXISTS numero_user_id UUID;

-- Tabela para rastrear números disponíveis (reciclados)
CREATE TABLE IF NOT EXISTS public.atendimento_numeros_disponiveis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  numero INT NOT NULL,
  reciclado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, numero)
);

ALTER TABLE public.atendimento_numeros_disponiveis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_numeros" ON public.atendimento_numeros_disponiveis
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Sequência para gerar números únicos por usuário
CREATE SEQUENCE IF NOT EXISTS atendimento_numero_seq START 1 INCREMENT 1;

-- Função para alocar próximo número (reutiliza reciclados)
CREATE OR REPLACE FUNCTION public.allocate_atendimento_numero(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  v_numero INT;
BEGIN
  -- Primeiro, tenta usar um número reciclado
  SELECT numero INTO v_numero
  FROM public.atendimento_numeros_disponiveis
  WHERE user_id = p_user_id
  ORDER BY reciclado_em ASC
  LIMIT 1;

  IF v_numero IS NOT NULL THEN
    -- Remove da tabela de disponíveis
    DELETE FROM public.atendimento_numeros_disponiveis
    WHERE user_id = p_user_id AND numero = v_numero;

    RETURN v_numero;
  ELSE
    -- Gera novo número baseado no máximo existente
    SELECT COALESCE(MAX(numero), 0) + 1 INTO v_numero
    FROM public.atendimentos
    WHERE user_id = p_user_id;

    RETURN v_numero;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para devolver número ao pool quando deletado
CREATE OR REPLACE FUNCTION public.recycle_atendimento_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.numero IS NOT NULL THEN
    INSERT INTO public.atendimento_numeros_disponiveis (user_id, numero)
    VALUES (OLD.user_id, OLD.numero)
    ON CONFLICT (user_id, numero) DO NOTHING;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger para reciclagem ao deletar
DROP TRIGGER IF EXISTS trg_recycle_atendimento_numero ON public.atendimentos;
CREATE TRIGGER trg_recycle_atendimento_numero
BEFORE DELETE ON public.atendimentos
FOR EACH ROW
EXECUTE FUNCTION public.recycle_atendimento_numero();

-- Trigger para manter numero_user_id sempre atualizado
DROP TRIGGER IF EXISTS trg_set_numero_user_id ON public.atendimentos;
CREATE TRIGGER trg_set_numero_user_id
BEFORE INSERT ON public.atendimentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
