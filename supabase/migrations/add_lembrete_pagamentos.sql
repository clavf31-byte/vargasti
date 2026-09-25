-- Adiciona campos de lembrete para pagamentos
ALTER TABLE public.pagamentos
ADD COLUMN data_lembrete DATE,
ADD COLUMN lembrete_visto BOOLEAN DEFAULT false;

-- Índice para buscar lembretes vencidos rapidamente
CREATE INDEX idx_pagamentos_lembrete
ON public.pagamentos(data_lembrete, lembrete_visto)
WHERE data_lembrete IS NOT NULL;
