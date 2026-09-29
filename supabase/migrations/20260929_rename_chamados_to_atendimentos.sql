-- ============================================================
-- Rename Chamados to Atendimentos + Add workflow fields
-- Cole no Lovable > Supabase > SQL Editor e execute
-- ============================================================

-- 1. Rename tables
ALTER TABLE chamado_comentarios RENAME TO atendimento_comentarios;
ALTER TABLE chamados RENAME TO atendimentos;

-- 2. Rename foreign key constraint in comments table
ALTER TABLE atendimento_comentarios RENAME COLUMN chamado_id TO atendimento_id;
ALTER TABLE atendimento_comentarios DROP CONSTRAINT chamado_comentarios_chamado_id_fkey;
ALTER TABLE atendimento_comentarios
  ADD CONSTRAINT atendimento_comentarios_atendimento_id_fkey
  FOREIGN KEY (atendimento_id) REFERENCES atendimentos(id) ON DELETE CASCADE;

-- 3. Rename sequence and update it
ALTER SEQUENCE chamados_numero_seq RENAME TO atendimentos_numero_seq;

-- 4. Update trigger function for new table name
CREATE OR REPLACE FUNCTION generate_atendimento_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_formatado IS NULL THEN
    NEW.numero_formatado := 'ATD-' || LPAD(nextval('atendimentos_numero_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER trg_chamado_numero ON atendimentos;
CREATE TRIGGER trg_atendimento_numero
  BEFORE INSERT ON atendimentos
  FOR EACH ROW EXECUTE FUNCTION generate_atendimento_numero();

-- 5. Update updated_at trigger
CREATE OR REPLACE FUNCTION touch_atendimentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER trg_chamados_updated_at ON atendimentos;
CREATE TRIGGER trg_atendimentos_updated_at
  BEFORE UPDATE ON atendimentos
  FOR EACH ROW EXECUTE FUNCTION touch_atendimentos_updated_at();

-- 6. Add workflow-related columns
ALTER TABLE atendimentos
  ADD COLUMN IF NOT EXISTS orcamento_id uuid REFERENCES orcamentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ordem_servico_id uuid REFERENCES ordens_servico(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pagamento_id uuid REFERENCES pagamentos(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS equipamento text,
  ADD COLUMN IF NOT EXISTS defeito text;

-- 7. Update RLS policies
DROP POLICY IF EXISTS "chamados_owner" ON atendimentos;
CREATE POLICY "atendimentos_owner" ON atendimentos
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chamado_comentarios_owner" ON atendimento_comentarios;
CREATE POLICY "atendimento_comentarios_owner" ON atendimento_comentarios
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM atendimentos WHERE id = atendimento_id AND user_id = auth.uid())
  )
  WITH CHECK (auth.uid() = user_id);

-- 8. Create indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_atendimentos_orcamento_id ON atendimentos(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_ordem_servico_id ON atendimentos(ordem_servico_id);
CREATE INDEX IF NOT EXISTS idx_atendimentos_pagamento_id ON atendimentos(pagamento_id);
