-- ============================================================
-- Validar Status Conclusão: Se tem data_conclusao, status é concluido
-- ============================================================

-- 1. Função que força status = 'concluido' se data_conclusao está preenchida
CREATE OR REPLACE FUNCTION validar_status_conclusao_atendimento()
RETURNS TRIGGER AS $$
BEGIN
  -- Se data_conclusao foi preenchida, forçar status = 'concluido'
  IF NEW.data_conclusao IS NOT NULL AND NEW.status != 'concluido' THEN
    NEW.status := 'concluido';
  END IF;

  -- Se status é 'concluido' mas data_conclusao é nula, preenchê-la
  IF NEW.status = 'concluido' AND NEW.data_conclusao IS NULL THEN
    NEW.data_conclusao := CURRENT_DATE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger antes de INSERT ou UPDATE
DROP TRIGGER IF EXISTS trg_validar_status_conclusao_atendimento ON atendimentos;
CREATE TRIGGER trg_validar_status_conclusao_atendimento
  BEFORE INSERT OR UPDATE ON atendimentos
  FOR EACH ROW
  EXECUTE FUNCTION validar_status_conclusao_atendimento();

-- 3. Corrigir Atendimentos que já estão com data_conclusao mas status != concluido
UPDATE atendimentos
SET status = 'concluido'
WHERE data_conclusao IS NOT NULL AND status != 'concluido';
