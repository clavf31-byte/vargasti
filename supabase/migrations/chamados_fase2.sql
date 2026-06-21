-- ============================================================
-- CHAMADOS - Fase 2
-- Cole no Lovable > Supabase > SQL Editor e execute
-- ============================================================

-- 1. Tabela principal
CREATE TABLE IF NOT EXISTS chamados (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_formatado  text UNIQUE,
  titulo            text NOT NULL,
  descricao         text,
  status            text NOT NULL DEFAULT 'aberto',
  prioridade        text NOT NULL DEFAULT 'normal',
  cliente_id        uuid REFERENCES clientes(id) ON DELETE SET NULL,
  responsavel_id    uuid,
  user_id           uuid REFERENCES auth.users(id) NOT NULL,
  anotacoes         text,
  data_inicio       date,
  data_conclusao    date,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- 2. Comentários e histórico (campo tipo distingue)
CREATE TABLE IF NOT EXISTS chamado_comentarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id  uuid REFERENCES chamados(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid REFERENCES auth.users(id) NOT NULL,
  conteudo    text NOT NULL,
  tipo        text NOT NULL DEFAULT 'comentario', -- 'comentario' | 'sistema'
  metadata    jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 3. Numeração automática CHA-0001
CREATE SEQUENCE IF NOT EXISTS chamados_numero_seq START 1;

CREATE OR REPLACE FUNCTION generate_chamado_numero()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.numero_formatado IS NULL THEN
    NEW.numero_formatado := 'CHA-' || LPAD(nextval('chamados_numero_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chamado_numero ON chamados;
CREATE TRIGGER trg_chamado_numero
  BEFORE INSERT ON chamados
  FOR EACH ROW EXECUTE FUNCTION generate_chamado_numero();

-- 4. updated_at automático
CREATE OR REPLACE FUNCTION touch_chamados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_chamados_updated_at ON chamados;
CREATE TRIGGER trg_chamados_updated_at
  BEFORE UPDATE ON chamados
  FOR EACH ROW EXECUTE FUNCTION touch_chamados_updated_at();

-- 5. RLS
ALTER TABLE chamados ENABLE ROW LEVEL SECURITY;
ALTER TABLE chamado_comentarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chamados_owner" ON chamados;
CREATE POLICY "chamados_owner" ON chamados
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "chamado_comentarios_owner" ON chamado_comentarios;
CREATE POLICY "chamado_comentarios_owner" ON chamado_comentarios
  FOR ALL USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM chamados WHERE id = chamado_id AND user_id = auth.uid())
  )
  WITH CHECK (auth.uid() = user_id);
