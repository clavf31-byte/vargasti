-- ============================================================
-- Vincular Orçamentos Antigos a Novos Atendimentos
-- Cria um Atendimento para cada Orçamento órfão (sem atendimento pai)
-- ============================================================

INSERT INTO atendimentos (
  user_id,
  numero_formatado,
  titulo,
  status,
  prioridade,
  orcamento_id,
  cliente_id,
  descricao,
  data_inicio,
  created_at,
  updated_at
)
SELECT
  o.user_id,
  'ATD-' || LPAD(ROW_NUMBER() OVER (PARTITION BY o.user_id ORDER BY o.created_at) + COALESCE((SELECT MAX(CAST(SUBSTRING(numero_formatado, 5) AS INTEGER)) FROM atendimentos WHERE user_id = o.user_id), 0)::text, 5, '0'),
  'Atendimento de Orçamento ' || o.numero_formatado,
  CASE
    WHEN o.status_enum = 'aprovado' THEN 'em_triagem'
    WHEN o.status_enum = 'rejeitado' THEN 'cancelado'
    ELSE 'aberto'
  END,
  COALESCE(o.prioridade, 'normal'),
  o.id,
  o.cliente_id,
  'Atendimento criado automaticamente a partir de orçamento: ' || o.numero_formatado || ' | Valor: R$ ' || o.total,
  CURRENT_DATE,
  o.created_at,
  NOW()
FROM orcamentos o
WHERE
  -- Apenas orçamentos que NÃO têm atendimento vinculado
  NOT EXISTS (
    SELECT 1 FROM atendimentos a
    WHERE a.orcamento_id = o.id
  )
  -- E que ainda não foram processados por esta migration
  AND o.created_at < NOW()
ORDER BY o.user_id, o.created_at;

-- Log de quantos foram criados
-- SELECT COUNT(*) as "Atendimentos Criados" FROM atendimentos WHERE descricao LIKE 'Atendimento criado automaticamente%';
