-- ============================================================
-- Fix: Remover log de comentários dos triggers (atendimento_comentarios não mais usável)
-- ============================================================

-- Atualizar trigger de criar OS (remover INSERT em atendimento_comentarios)
CREATE OR REPLACE FUNCTION aprovar_orcamento_criar_os()
RETURNS TRIGGER AS $$
DECLARE
  v_os_numero text;
  v_novo_os_id uuid;
BEGIN
  IF NEW.status = 'aprovado' AND (OLD.status IS NULL OR OLD.status <> 'aprovado') THEN

    v_os_numero := 'OS-' || LPAD(nextval('os_numero_seq')::text, 5, '0');

    INSERT INTO ordens_servico (
      user_id,
      numero_formatado,
      cliente_id,
      orcamento_id,
      status,
      prioridade,
      descricao,
      data_inicio,
      created_at,
      updated_at
    )
    VALUES (
      NEW.user_id,
      v_os_numero,
      NEW.cliente_id,
      NEW.id,
      'aberta',
      'normal',
      COALESCE(NEW.descricao, ''),
      CURRENT_DATE,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_novo_os_id;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Atualizar trigger de criar pagamento (remover INSERT em atendimento_comentarios)
CREATE OR REPLACE FUNCTION concluir_os_criar_pagamento()
RETURNS TRIGGER AS $$
DECLARE
  v_orcamento record;
BEGIN
  IF NEW.status = 'concluida' AND (OLD.status IS NULL OR OLD.status <> 'concluida') THEN

    IF NEW.orcamento_id IS NOT NULL THEN
      SELECT * INTO v_orcamento FROM orcamentos WHERE id = NEW.orcamento_id;

      IF v_orcamento IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM pagamentos WHERE orcamento_id = NEW.orcamento_id
      ) THEN
        INSERT INTO pagamentos (
          user_id,
          orcamento_id,
          cliente_id,
          valor,
          status,
          data_pagamento,
          referencia,
          created_at,
          updated_at
        )
        VALUES (
          NEW.user_id,
          NEW.orcamento_id,
          NEW.cliente_id,
          v_orcamento.total,
          'pendente',
          CURRENT_DATE,
          v_orcamento.numero,
          NOW(),
          NOW()
        );

      END IF;
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
