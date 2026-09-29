-- ============================================================
-- Adicionar coluna data_agendamento à tabela atendimentos
-- Representa quando o atendimento está agendado para acontecer
-- ============================================================

ALTER TABLE atendimentos
ADD COLUMN data_agendamento timestamptz NULL;

CREATE INDEX idx_atendimentos_data_agendamento ON atendimentos(data_agendamento);
