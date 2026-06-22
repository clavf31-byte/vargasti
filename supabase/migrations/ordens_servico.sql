-- Tabelas para Ordens de Serviço
-- Cole no Lovable > Supabase > SQL Editor e execute

CREATE TABLE IF NOT EXISTS ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES clientes(id) ON DELETE SET NULL,
  orcamento_id uuid REFERENCES orcamentos(id) ON DELETE SET NULL,
  numero_formatado text,
  descricao text,
  status text NOT NULL DEFAULT 'aberta',
  prioridade text NOT NULL DEFAULT 'normal',
  data_inicio date DEFAULT CURRENT_DATE,
  data_prevista date,
  data_conclusao date,
  tecnico text,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_os" ON ordens_servico
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS os_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid REFERENCES ordens_servico(id) ON DELETE CASCADE,
  tipo text NOT NULL DEFAULT 'peca',
  servico_id uuid,
  peca_id uuid,
  descricao text,
  quantidade numeric NOT NULL DEFAULT 1,
  preco_unitario numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE os_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_os_itens" ON os_itens
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ordens_servico
      WHERE ordens_servico.id = os_itens.os_id
        AND ordens_servico.user_id = auth.uid()
    )
  );
