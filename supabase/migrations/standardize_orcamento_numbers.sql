-- Padroniza numeração de orçamentos de 6 para 3 dígitos
-- ORC-2026-000006 → ORC-2026-006
-- ORC-2026-000042 → ORC-2026-042

UPDATE public.orcamentos
SET numero_formatado =
  CASE
    WHEN numero_formatado ~ '^ORC-[0-9]{4}-[0-9]{6}$' THEN
      CONCAT(
        SUBSTRING(numero_formatado, 1, 8),
        CAST(CAST(SUBSTRING(numero_formatado, 10) AS INTEGER) AS TEXT)
      )
    ELSE numero_formatado
  END
WHERE numero_formatado ~ '^ORC-[0-9]{4}-[0-9]{6}$';
