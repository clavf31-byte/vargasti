ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS contato text,
  ADD COLUMN IF NOT EXISTS celular text;