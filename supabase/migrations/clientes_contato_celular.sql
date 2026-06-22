-- Adiciona campos contato e celular à tabela clientes
-- Cole no Lovable > Supabase > SQL Editor e execute

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS contato text,
  ADD COLUMN IF NOT EXISTS celular text;
