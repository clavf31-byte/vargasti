# Teste do Workflow de Gerenciamento de Permissões

## Pré-requisitos
- ✅ Tabela `user_module_permissions` criada no Supabase
- ✅ RLS policies configuradas
- ✅ Usuário admin logado
- ✅ Servidor rodando em localhost:8082 (ou porta configurada)

## Passos para Testar

### 1. Verificação de Acesso (Admin Only)

**Teste 1.1 - Admin pode acessar**
1. Login com usuário admin
2. Navegue para `/config/permissions`
3. ✅ Esperado: Página carrega com tabela de usuários

**Teste 1.2 - Não-admin não pode acessar**
1. Login com usuário normal (não admin)
2. Navegue para `/config/permissions`
3. ✅ Esperado: Mostrar mensagem "Apenas administradores podem gerenciar permissões"

**Teste 1.3 - Usuário não autenticado é redirecionado**
1. Limpe o localStorage (ou feche a aba e abra nova)
2. Navegue para `/config/permissions` sem estar logado
3. ✅ Esperado: Redireciona para `/login`

---

### 2. Carregamento de Dados

**Teste 2.1 - Carrega lista de usuários**
1. Admin acessa `/config/permissions`
2. Aguarde o loading "Carregando usuários..."
3. ✅ Esperado: Tabela mostra todos os usuários do sistema
4. ✅ Esperado: Cada usuário mostra nome, email e role

**Teste 2.2 - Carrega permissões salvas**
1. No Supabase, insira uma linha em `user_module_permissions`:
   ```sql
   INSERT INTO user_module_permissions (user_id, can_access_crm, can_access_email, can_access_excel, can_access_notes, can_access_projects, can_access_files)
   VALUES ('USER_ID_AQUI', true, false, true, false, true, false);
   ```
2. Recarregue a página
3. ✅ Esperado: O usuário mostra:
   - ✓ CRM (check)
   - ✗ Email (x)
   - ✓ Excel (check)
   - ✗ Anotações (x)
   - ✓ Projetos (check)
   - ✗ Arquivos (x)

---

### 3. Concessão de Acesso

**Teste 3.1 - Conceder acesso a um módulo**
1. Admin clica no botão ✗ de um usuário para qualquer módulo
2. ✅ Esperado: Botão muda para ✓ (com cor verde)
3. ✅ Esperado: Botão fica desabilitado por alguns segundos (estado saving)
4. ✅ Esperado: Após salvar, o acesso é atualizado no banco

**Teste 3.2 - Revogar acesso a um módulo**
1. Admin clica no botão ✓ de um usuário que já tem acesso
2. ✅ Esperado: Botão muda para ✗ (com cor cinza)
3. ✅ Esperado: Mudança é salva no banco

**Teste 3.3 - Salvar persiste entre recargas**
1. Admin concede acesso a um módulo para um usuário
2. Aguarde o salvamento (2-3 segundos)
3. Recarregue a página (F5)
4. ✅ Esperado: O acesso continua concedido (persiste no banco)

---

### 4. Tratamento de Erros

**Teste 4.1 - Rollback em caso de erro**
1. Desconecte a internet ou simule um erro de conexão
2. Admin tenta conceder acesso a um módulo
3. ✅ Esperado: Mudança é revertida automaticamente
4. ✅ Esperado: Mostra mensagem de erro (se implementada)

**Teste 4.2 - Múltiplas mudanças simultâneas**
1. Admin clica rapidamente em vários botões de permissões
2. ✅ Esperado: Sistema salva todas as mudanças corretamente
3. ✅ Esperado: Sem conflitos de dados no banco

---

### 5. Validação de Dados no Banco

**Teste 5.1 - Verificar dados no Supabase**
1. No Supabase, vá para **Table Editor**
2. Abra tabela `user_module_permissions`
3. ✅ Esperado: Ver registros atualizados com os dados corretos
4. ✅ Esperado: Campo `updated_at` é atualizado automaticamente

**Teste 5.2 - RLS está funcionando**
1. Faça login com usuário não-admin
2. No console do navegador, execute:
   ```javascript
   supabase.from('user_module_permissions').select('*').then(r => console.log(r))
   ```
3. ✅ Esperado: Retorna erro de permissão (RLS bloqueando)

---

## Resumo de Testes

| Teste | Descrição | Status |
|-------|-----------|--------|
| 1.1 | Admin pode acessar | ⬜ |
| 1.2 | Não-admin bloqueado | ⬜ |
| 1.3 | Não autenticado redireciona | ⬜ |
| 2.1 | Carrega usuários | ⬜ |
| 2.2 | Carrega permissões salvas | ⬜ |
| 3.1 | Conceder acesso | ⬜ |
| 3.2 | Revogar acesso | ⬜ |
| 3.3 | Persiste entre recargas | ⬜ |
| 4.1 | Rollback em erro | ⬜ |
| 4.2 | Múltiplas mudanças | ⬜ |
| 5.1 | Dados no banco corretos | ⬜ |
| 5.2 | RLS funcionando | ⬜ |

## Notas

- ✅ = Esperado funcionar
- ⬜ = Aguardando teste
- ❌ = Falha

Se algum teste falhar, documente o erro e a solução aqui.
