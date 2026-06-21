-- ============================================================
-- ROLE DEFAULT PERMISSIONS
-- Cole no Lovable > Supabase > SQL Editor e execute
-- ============================================================

CREATE TABLE IF NOT EXISTS role_default_permissions (
  role        text PRIMARY KEY,
  permissions jsonb NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION touch_role_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_role_permissions_updated_at ON role_default_permissions;
CREATE TRIGGER trg_role_permissions_updated_at
  BEFORE UPDATE ON role_default_permissions
  FOR EACH ROW EXECUTE FUNCTION touch_role_permissions_updated_at();

ALTER TABLE role_default_permissions ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer autenticado
DROP POLICY IF EXISTS "read_role_permissions" ON role_default_permissions;
CREATE POLICY "read_role_permissions" ON role_default_permissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Escrita: apenas admin
DROP POLICY IF EXISTS "write_role_permissions" ON role_default_permissions;
CREATE POLICY "write_role_permissions" ON role_default_permissions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Defaults iniciais
INSERT INTO role_default_permissions (role, permissions) VALUES
('gestor', '{
  "dashboard.view": true, "dashboard.view_financial": true, "dashboard.view_technical": true,
  "crm.view": true, "crm.create": true, "crm.edit": true, "crm.view_history": true,
  "orcamentos.view": true, "orcamentos.create": true, "orcamentos.edit": true,
  "orcamentos.approve": true, "orcamentos.cancel": true, "orcamentos.send_email": true,
  "orcamentos.pdf": true, "orcamentos.view_values": true,
  "os.view": true, "os.view_all": true, "os.create": true, "os.edit": true,
  "os.assign": true, "os.complete": true, "os.cancel": true,
  "agenda.view": true, "agenda.view_all": true, "agenda.create": true, "agenda.edit": true,
  "assets.view": true, "assets.view_stock": true, "assets.approve_request": true,
  "kb.view": true,
  "reports.view": true, "reports.export": true, "reports.view_financial": true, "reports.view_technical": true,
  "admin.view_operators": true, "admin.approve_access": true
}'),
('administrativo', '{
  "dashboard.view": true,
  "crm.view": true, "crm.create": true, "crm.edit": true,
  "orcamentos.view": true, "orcamentos.create": true, "orcamentos.edit": true,
  "orcamentos.send_email": true, "orcamentos.pdf": true, "orcamentos.view_values": true,
  "kb.view": true,
  "reports.view": true
}'),
('tecnico', '{
  "dashboard.view": true, "dashboard.view_technical": true,
  "crm.view": true,
  "os.view": true, "os.view_own": true, "os.create": true, "os.assign": true, "os.complete": true,
  "agenda.view": true, "agenda.create": true, "agenda.edit": true,
  "assets.view": true, "assets.move": true,
  "kb.view": true
}'),
('operador', '{
  "dashboard.view": true,
  "crm.view": true,
  "os.view": true, "os.view_own": true, "os.create": true,
  "agenda.view": true,
  "kb.view": true
}'),
('cliente', '{
  "dashboard.view": true,
  "os.view": true, "os.view_own": true, "os.create": true,
  "kb.view": true
}')
ON CONFLICT (role) DO NOTHING;
