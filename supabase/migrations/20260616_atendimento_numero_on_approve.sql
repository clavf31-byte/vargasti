-- Adiciona campo para rastrear se veio do email
ALTER TABLE public.atendimentos
ADD COLUMN IF NOT EXISTS criado_via_email BOOLEAN DEFAULT FALSE;

-- Função para alocar número automaticamente ao sair de rascunho
CREATE OR REPLACE FUNCTION public.allocate_numero_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  v_numero INT;
BEGIN
  -- Se está mudando DE rascunho PARA outro status E não tem número alocado
  IF OLD.status = 'rascunho'
     AND NEW.status != 'rascunho'
     AND NEW.numero IS NULL THEN

    -- Aloca número automaticamente
    v_numero := public.allocate_atendimento_numero(NEW.user_id);
    NEW.numero := v_numero;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para alocar número ao mudar status
DROP TRIGGER IF EXISTS trg_allocate_numero_on_status_change ON public.atendimentos;
CREATE TRIGGER trg_allocate_numero_on_status_change
BEFORE UPDATE ON public.atendimentos
FOR EACH ROW
EXECUTE FUNCTION public.allocate_numero_on_status_change();

-- Constraint: Rascunho deve ter numero NULL
CREATE OR REPLACE FUNCTION public.validate_rascunho_sem_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'rascunho' AND NEW.numero IS NOT NULL THEN
    RAISE EXCEPTION 'Atendimento em rascunho não deve ter número alocado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_rascunho ON public.atendimentos;
CREATE TRIGGER trg_validate_rascunho
BEFORE INSERT OR UPDATE ON public.atendimentos
FOR EACH ROW
EXECUTE FUNCTION public.validate_rascunho_sem_numero();
