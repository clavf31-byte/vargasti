-- ============================================================
-- Automação do Fluxo Atendimento: Orçamento → OS → Pagamento
-- ============================================================

-- 1. TRIGGER: Quando orçamento é aprovado, criar OS automaticamente
CREATE OR REPLACE FUNCTION criar_os_ao_aprovar_orcamento()
RETURNS TRIGGER AS $$
DECLARE
  v_atendimento_id uuid;
  v_numero_os text;
BEGIN
  -- Só processa quando status muda para 'aprovado'
  IF NEW.status_enum = 'aprovado' AND OLD.status_enum != 'aprovado' THEN
    -- Buscar atendimento vinculado a este orçamento
    SELECT id INTO v_atendimento_id
    FROM atendimentos
    WHERE orcamento_id = NEW.id
    LIMIT 1;

    -- Se encontrou atendimento, criar OS
    IF v_atendimento_id IS NOT NULL THEN
      -- Gerar número OS via RPC (se existir)
      BEGIN
        SELECT 'OS-' || LPAD((SELECT COUNT(*) + 1)::text, 5, '0') INTO v_numero_os;
      EXCEPTION WHEN OTHERS THEN
        v_numero_os := 'OS-' || LPAD(TO_CHAR(NEW.id::text LIKE '%')::int + 1, 5, '0');
      END;

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
      ) VALUES (
        NEW.user_id,
        'OS-' || LPAD((SELECT MAX(CAST(SUBSTRING(numero_formatado, 4) AS INTEGER)) + 1 FROM ordens_servico WHERE user_id = NEW.user_id)::text, 5, '0'),
        'aberta',
        NEW.prioridade,
        NEW.cliente_id,
        NEW.id,
        'OS gerada automaticamente de orçamento aprovado: ' || NEW.numero_formatado,
        CURRENT_DATE,
        NOW(),
        NOW()
      );

      -- Atualizar atendimento com referência à OS criada
      UPDATE atendimentos
      SET ordem_servico_id = (
        SELECT id FROM ordens_servico
        WHERE orcamento_id = NEW.id
        ORDER BY created_at DESC
        LIMIT 1
      ),
      updated_at = NOW()
      WHERE id = v_atendimento_id;

      -- Log do sistema
      INSERT INTO atendimento_comentarios (
        atendimento_id,
        user_id,
        conteudo,
        tipo,
        created_at
      ) VALUES (
        v_atendimento_id,
        NEW.user_id,
        'Orçamento ' || NEW.numero_formatado || ' foi aprovado. OS criada automaticamente.',
        'sistema',
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_criar_os_ao_aprovar_orcamento ON orcamentos;
CREATE TRIGGER trg_criar_os_ao_aprovar_orcamento
  AFTER UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION criar_os_ao_aprovar_orcamento();

-- ============================================================

-- 2. TRIGGER: Quando OS é concluída, criar Pagamento automaticamente
CREATE OR REPLACE FUNCTION criar_pagamento_ao_concluir_os()
RETURNS TRIGGER AS $$
DECLARE
  v_atendimento_id uuid;
  v_valor_orcamento decimal(12,2);
BEGIN
  -- Só processa quando status muda para 'concluida'
  IF NEW.status = 'concluida' AND OLD.status != 'concluida' THEN
    -- Buscar atendimento e valor do orçamento
    SELECT a.id, o.total
    INTO v_atendimento_id, v_valor_orcamento
    FROM atendimentos a
    LEFT JOIN orcamentos o ON a.orcamento_id = o.id
    WHERE a.ordem_servico_id = NEW.id
    LIMIT 1;

    -- Se encontrou atendimento, criar Pagamento
    IF v_atendimento_id IS NOT NULL THEN
      INSERT INTO pagamentos (
        user_id,
        orcamento_id,
        atendimento_id,
        valor,
        status,
        descricao,
        created_at,
        updated_at
      ) VALUES (
        NEW.user_id,
        NEW.orcamento_id,
        v_atendimento_id,
        COALESCE(v_valor_orcamento, 0),
        'pendente',
        'Pagamento gerado automaticamente da OS ' || NEW.numero_formatado,
        NOW(),
        NOW()
      );

      -- Atualizar atendimento com referência ao Pagamento
      UPDATE atendimentos
      SET pagamento_id = (
        SELECT id FROM pagamentos
        WHERE orcamento_id = NEW.orcamento_id
        ORDER BY created_at DESC
        LIMIT 1
      ),
      updated_at = NOW()
      WHERE id = v_atendimento_id;

      -- Log do sistema
      INSERT INTO atendimento_comentarios (
        atendimento_id,
        user_id,
        conteudo,
        tipo,
        created_at
      ) VALUES (
        v_atendimento_id,
        NEW.user_id,
        'OS ' || NEW.numero_formatado || ' concluída. Pagamento pendente de R$ ' || COALESCE(v_valor_orcamento, 0) || ' criado automaticamente.',
        'sistema',
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_criar_pagamento_ao_concluir_os ON ordens_servico;
CREATE TRIGGER trg_criar_pagamento_ao_concluir_os
  AFTER UPDATE ON ordens_servico
  FOR EACH ROW
  EXECUTE FUNCTION criar_pagamento_ao_concluir_os();

-- ============================================================

-- 3. TRIGGER: Quando Pagamento é pago, finalizar Atendimento automaticamente
CREATE OR REPLACE FUNCTION finalizar_atendimento_ao_pagar()
RETURNS TRIGGER AS $$
DECLARE
  v_atendimento_id uuid;
BEGIN
  -- Só processa quando status muda para 'pago'
  IF NEW.status = 'pago' AND OLD.status != 'pago' THEN
    -- Buscar atendimento
    SELECT id INTO v_atendimento_id
    FROM atendimentos
    WHERE pagamento_id = NEW.id
    LIMIT 1;

    -- Se encontrou atendimento e não tem pendências, finalizar
    IF v_atendimento_id IS NOT NULL THEN
      UPDATE atendimentos
      SET status = 'concluido',
          updated_at = NOW()
      WHERE id = v_atendimento_id;

      -- Log do sistema
      INSERT INTO atendimento_comentarios (
        atendimento_id,
        user_id,
        conteudo,
        tipo,
        created_at
      ) VALUES (
        v_atendimento_id,
        NEW.user_id,
        'Pagamento confirmado. Atendimento finalizado automaticamente.',
        'sistema',
        NOW()
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_finalizar_atendimento_ao_pagar ON pagamentos;
CREATE TRIGGER trg_finalizar_atendimento_ao_pagar
  AFTER UPDATE ON pagamentos
  FOR EACH ROW
  EXECUTE FUNCTION finalizar_atendimento_ao_pagar();

-- ============================================================
-- Nota: Estes triggers assumem que:
-- 1. Tabela 'pagamentos' existe com coluna 'atendimento_id'
-- 2. Tabela 'atendimentos' tem coluna 'status' com valor 'concluido'
-- 3. Tabela 'atendimento_comentarios' existe para logs
-- ============================================================
