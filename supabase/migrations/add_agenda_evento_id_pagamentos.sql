-- Adiciona referência para evento da agenda quando pagamento é agendado
ALTER TABLE public.pagamentos
ADD COLUMN agenda_evento_id UUID REFERENCES public.agenda_eventos(id) ON DELETE SET NULL;

-- Índice para buscar pagamentos agendados
CREATE INDEX idx_pagamentos_agenda_evento_id
ON public.pagamentos(agenda_evento_id)
WHERE agenda_evento_id IS NOT NULL;
