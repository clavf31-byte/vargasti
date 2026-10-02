-- ============================================================
-- Redesign: Automação de Orçamento → OS (Versão Simplificada)
-- Data: 2026-10-02
-- Objetivo: Remover complexidade, usar 1 trigger único que funciona
-- ============================================================

-- 1. REMOVER TRIGGERS ANTIGOS
DROP TRIGGER IF EXISTS trg_sincronizar_status_orcamento ON orcamentos;
DROP TRIGGER IF EXISTS trg_criar_os_ao_aprovar_orcamento ON orcamentos;
DROP TRIGGER IF EXISTS trg_orcamentos_updated ON orcamentos;
DROP TRIGGER IF EXISTS trg_orcamento_financeiro ON orcamentos;

-- 2. REMOVER FUNÇÕES ANTIGAS
DROP FUNCTION IF EXISTS sincronizar_status_orcamento();
DROP FUNCTION IF EXISTS criar_os_ao_aprovar_orcamento();

-- 3. CRIAR SEQUÊNCIA PARA NÚMEROS OS (garante unicidade)
CREATE SEQUENCE IF NOT EXISTS os_numero_seq START 1 INCREMENT 1;

-- 4. FUNÇÃO ÚNICA E ROBUSTA: Criar OS ao Aprovar Orçamento
CREATE OR REPLACE FUNCTION aprovar_orcamento_criar_os()
RETURNS TRIGGER AS $$
DECLARE
  v_atendimento_id uuid;
  v_os_numero text;
  v_prioridade text;
  v_novo_os_id uuid;
BEGIN
  -- Verificar se status mudou para 'aprovado'
  -- OLD.status pode ser NULL (novo registro) ou diferente de 'aprovado'
  IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status <> 'aprovado') THEN

    -- Buscar atendimento vinculado
    SELECT id, prioridade
    INTO v_atendimento_id, v_prioridade
    FROM atendimentos
    WHERE orcamento_id = NEW.id
    LIMIT 1;

    -- Se encontrou atendimento, criar OS
    IF v_atendimento_id IS NOT NULL THEN

      -- Gerar número OS sequencial
      v_os_numero := 'OS-' || LPAD(nextval('os_numero_seq')::text, 5, '0');

      -- Inserir nova OS
      INSERT INTO ordens_servico (
        user_id,
        numero_formatado,
        status,
        prioridade,
        cliente_id,
        orcamento_id,
        descricao,
        data_inicio,
        created_at,
        updated_at
      )
      VALUES (
        NEW.user_id,
        v_os_numero,
        'aberta',
        COALESCE(v_prioridade, 'normal'),
        NEW.cliente_id,
        NEW.id,
        'OS criada automaticamente',
        CURRENT_DATE,
        NOW(),
        NOW()
      )
      RETURNING id INTO v_novo_os_id;

      -- Atualizar atendimento com referência à OS
      UPDATE atendimentos
      SET ordem_servico_id = v_novo_os_id,
          updated_at = NOW()
      WHERE id = v_atendimento_id;

      -- Log no sistema (comentário automático)
      INSERT INTO atendimento_comentarios (
        atendimento_id,
        user_id,
        conteudo,
        tipo,
        created_at
      )
      VALUES (
        v_atendimento_id,
        NEW.user_id,
        'Orçamento ' || NEW.numero_formatado || ' aprovado. OS ' || v_os_numero || ' criada automaticamente.',
        'sistema',
        NOW()
      );

    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. CRIAR TRIGGER (AFTER UPDATE para não interferir com lógica de negócio)
CREATE TRIGGER trg_aprovar_orcamento_criar_os
  AFTER UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION aprovar_orcamento_criar_os();

-- ============================================================
-- VERIFICAÇÃO
-- ============================================================
-- Execute após rodar a migration:
--
-- SELECT * FROM pg_trigger WHERE tgname = 'trg_aprovar_orcamento_criar_os';
-- -- Resultado esperado: 1 trigger ativo
--
-- SELECT nextval('os_numero_seq');
-- -- Resultado esperado: um número sequencial
--
-- ============================================================
