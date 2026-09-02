-- Ordens de Serviço: separar problema x solução.
-- `descricao` continua sendo a descrição do problema / serviço a fazer
-- (mantida pra não quebrar PDF, busca e OS já existentes).
-- `solucao` é o que foi efetivamente feito, preenchido durante/após o serviço.
ALTER TABLE public.ordens_servico
  ADD COLUMN IF NOT EXISTS solucao text;
