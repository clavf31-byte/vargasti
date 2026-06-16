# Setup de Gerenciamento de Permissões

## 1. Criar a Tabela no Supabase

1. Acesse o [Supabase Dashboard](https://app.supabase.com/)
2. Vá para **SQL Editor**
3. Crie uma nova query
4. Copie e cole o conteúdo de `create_permissions_table.sql`
5. Execute a query

Alternativamente, você pode:
1. Ir para **Table Editor**
2. Clique em **Create a new table**
3. Configure da seguinte forma:

**Table Name:** `user_module_permissions`

**Columns:**
| Name | Type | Default | Required |
|------|------|---------|----------|
| id | UUID | gen_random_uuid() | ✓ |
| user_id | UUID | - | ✓ |
| can_access_crm | BOOLEAN | true | ✓ |
| can_access_email | BOOLEAN | true | ✓ |
| can_access_excel | BOOLEAN | true | ✓ |
| can_access_notes | BOOLEAN | true | ✓ |
| can_access_projects | BOOLEAN | true | ✓ |
| can_access_files | BOOLEAN | true | ✓ |
| created_at | TIMESTAMPTZ | now() | ✓ |
| updated_at | TIMESTAMPTZ | now() | ✓ |

**Primary Key:** id  
**Unique Constraint:** user_id  
**Foreign Key:** user_id → auth.users(id)

## 2. Configurar RLS (Row Level Security)

Após criar a tabela:

1. Vá para **Authentication > Policies**
2. Selecione a tabela `user_module_permissions`
3. Clique em **Create a policy**

**Policy 1 - Admins podem gerenciar:**
- Name: `Admins can manage all permissions`
- Definition: All
- Using: `EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin')`

**Policy 2 - Usuários podem ver suas próprias permissões:**
- Name: `Users can view own permissions`
- Definition: Select
- Using: `user_id = auth.uid()`

## 3. Testar o Módulo

1. Acesse a página `/config/permissions`
2. Se você for admin, verá a lista de usuários
3. Clique nos botões para conceder/revogar acesso
4. As mudanças são salvas automaticamente no banco

## Funcionalidades

✅ Apenas admins podem acessar a página  
✅ Carrega usuários do banco de dados  
✅ Carrega permissões existentes de cada usuário  
✅ Salva mudanças em tempo real no Supabase  
✅ Mostra estado de loading durante o salvamento  
✅ Valida permissões na base de dados  
