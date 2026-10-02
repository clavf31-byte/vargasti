-- ============================================================
-- Fix: Sincronizar status e status_enum para ativar triggers
-- ============================================================

-- 1. Atualizar qualquer orcamento com status != status_enum
UPDATE orcamentos
SET status_enum = status::orcamento_status
WHERE status_enum::text != status
  OR (status IS NOT NULL AND status_enum IS NULL);

-- 2. Criar trigger para manter sincronizado quando status muda
CREATE OR REPLACE FUNCTION sincronizar_status_orcamento()
RETURNS TRIGGER AS $$
BEGIN
  -- Se status foi atualizado, sincronizar status_enum
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_enum := NEW.status::orcamento_status;
  END IF;

  -- Se status_enum foi atualizado, sincronizar status
  IF NEW.status_enum IS DISTINCT FROM OLD.status_enum THEN
    NEW.status := NEW.status_enum::text;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sincronizar_status_orcamento ON orcamentos;
CREATE TRIGGER trg_sincronizar_status_orcamento
  BEFORE UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION sincronizar_status_orcamento();

-- 3. Garantir que o trigger de criar OS também verifica status (text)
CREATE OR REPLACE FUNCTION criar_os_ao_aprovar_orcamento()
RETURNS TRIGGER AS $$
DECLARE
  v_atendimento_id uuid;
  v_numero_os text;
BEGIN
  -- Processa quando status muda para 'aprovado' (verifica ambas colunas)
  IF (NEW.status_enum = 'aprovado' OR NEW.status = 'aprovado')
     AND (OLD.status_enum != 'aprovado' AND OLD.status != 'aprovado') THEN

    -- Buscar atendimento vinculado a este orçamento
    SELECT id INTO v_atendimento_id
    FROM atendimentos
    WHERE orcamento_id = NEW.id
    LIMIT 1;

    -- Se encontrou atendimento, criar OS
    IF v_atendimento_id IS NOT NULL THEN
      -- Gerar número OS
      BEGIN
        SELECT 'OS-' || LPAD((SELECT COUNT(*) + 1)::text, 5, '0') INTO v_numero_os;
      EXCEPTION WHEN OTHERS THEN
        v_numero_os := 'OS-' || LPAD(EXTRACT(MICROSECOND FROM NOW())::int::text, 5, '0');
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
        'OS-' || LPAD(COALESCE((SELECT MAX(CAST(SUBSTRING(numero_formatado, 4) AS INTEGER)) FROM ordens_servico WHERE user_id = NEW.user_id)::int + 1, 1)::text, 5, '0'),
        'aberta',
        NEW.prioridade,
        NEW.cliente_id,
        NEW.id,
        'OS gerada automaticamente de orçamento aprovado: ' || NEW.numero_formatado,
        CURRENT_DATE,
        NOW(),
        NOW()
      ) ON CONFLICT DO NOTHING;

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

-- Recriar o trigger para aplicar a nova função
DROP TRIGGER IF EXISTS trg_criar_os_ao_aprovar_orcamento ON orcamentos;
CREATE TRIGGER trg_criar_os_ao_aprovar_orcamento
  AFTER UPDATE ON orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION criar_os_ao_aprovar_orcamento();
