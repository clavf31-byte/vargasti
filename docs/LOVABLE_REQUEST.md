# Pedido para Lovable

Crie esta tabela no Supabase:

```sql
CREATE TABLE public.user_module_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  can_access_crm BOOLEAN NOT NULL DEFAULT true,
  can_access_email BOOLEAN NOT NULL DEFAULT true,
  can_access_excel BOOLEAN NOT NULL DEFAULT true,
  can_access_notes BOOLEAN NOT NULL DEFAULT true,
  can_access_projects BOOLEAN NOT NULL DEFAULT true,
  can_access_files BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_module_permissions_user_id
ON public.user_module_permissions(user_id);

ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all permissions"
ON public.user_module_permissions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Users can view own permissions"
ON public.user_module_permissions
FOR SELECT
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.update_user_module_permissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_module_permissions_updated_at
BEFORE UPDATE ON public.user_module_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_user_module_permissions_updated_at();
```

**Pronto!** Depois confirme que foi criado.
