-- ============================================================
-- Trigger: criar evento automaticamente quando atendimento tem data_agendamento
-- Se atendimento tem data_agendamento preenchida, cria evento na agenda_eventos
-- ============================================================

-- 1. Função que cria evento automaticamente
CREATE OR REPLACE FUNCTION criar_evento_agendamento_atendimento()
RETURNS TRIGGER AS $$
DECLARE
  v_evento_id uuid;
BEGIN
  -- Se data_agendamento foi preenchida
  IF NEW.data_agendamento IS NOT NULL AND OLD.data_agendamento IS DISTINCT FROM NEW.data_agendamento THEN
    -- Verificar se já existe evento para este atendimento
    SELECT id INTO v_evento_id FROM agenda_eventos
    WHERE atendimento_id = NEW.id
    AND tipo = 'compromisso'
    AND status != 'cancelado'
    LIMIT 1;

    IF v_evento_id IS NULL THEN
      -- Criar novo evento
      INSERT INTO agenda_eventos (
        user_id,
        titulo,
        descricao,
        tipo,
        data_inicio,
        data_fim,
        dia_inteiro,
        status,
        prioridade,
        cliente_id,
        atendimento_id,
        created_at,
        updated_at
      ) VALUES (
        NEW.user_id,
        'Atendimento: ' || NEW.titulo,
        'Atendimento #' || COALESCE(NEW.numero_formatado, NEW.id::text),
        'compromisso',
        NEW.data_agendamento,
        NEW.data_agendamento + interval '1 hour',
        false,
        'agendado',
        NEW.prioridade,
        NEW.cliente_id,
        NEW.id,
        NOW(),
        NOW()
      );
    ELSE
      -- Atualizar evento existente
      UPDATE agenda_eventos
      SET data_inicio = NEW.data_agendamento,
          data_fim = NEW.data_agendamento + interval '1 hour',
          updated_at = NOW()
      WHERE id = v_evento_id;
    END IF;
  ELSIF NEW.data_agendamento IS NULL AND OLD.data_agendamento IS NOT NULL THEN
    -- Se data_agendamento foi removida, cancelar evento
    UPDATE agenda_eventos
    SET status = 'cancelado',
        updated_at = NOW()
    WHERE atendimento_id = NEW.id
    AND tipo = 'compromisso'
    AND status != 'cancelado';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger que dispara após INSERT ou UPDATE
DROP TRIGGER IF EXISTS trg_criar_evento_agendamento_atendimento ON atendimentos;
CREATE TRIGGER trg_criar_evento_agendamento_atendimento
AFTER INSERT OR UPDATE ON atendimentos
FOR EACH ROW
EXECUTE FUNCTION criar_evento_agendamento_atendimento();
