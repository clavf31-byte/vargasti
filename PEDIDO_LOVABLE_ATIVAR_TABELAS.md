# 🚀 Pedido para Lovable - Ativar Tabelas CRM

## Objetivo
Ativar (criar/verificar) as 6 tabelas do CRM no Supabase que foram implementadas no código.

---

## Instruções para Lovable

### Método 1: Via Admin Panel (Recomendado)

1. **Acesse a aplicação em produção:**
   ```
   https://vargasti.lovable.app/admin/setup
   ```

2. **Clique no botão:** "Criar Tabelas Agora"

3. **Aguarde a mensagem de sucesso:** 
   ```
   ✅ Todas as tabelas do CRM foram criadas com sucesso!
   Tabelas criadas: clientes, orcamentos, pagamentos, email_logs, notas_fiscais, alertas
   ```

4. **Pronto!** As tabelas estão ativas no Supabase

---

## Método 2: Via SQL (Se Método 1 falhar)

Se o botão não funcionar, execute este SQL no Supabase SQL Editor:

```sql
-- 1. CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  empresa TEXT,
  endereco TEXT,
  cidade TEXT,
  estado TEXT,
  cep TEXT,
  cpf_cnpj TEXT UNIQUE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- 2. ORCAMENTOS
CREATE TABLE IF NOT EXISTS public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  status TEXT DEFAULT 'rascunho',
  total DECIMAL(10, 2) DEFAULT 0,
  descricao TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_validade TIMESTAMP WITH TIME ZONE,
  alerta_enviado BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_orcamentos_user_id ON public.orcamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON public.orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON public.orcamentos(status);
ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;

-- 3. PAGAMENTOS
CREATE TABLE IF NOT EXISTS public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  valor DECIMAL(10, 2) NOT NULL,
  data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metodo_pagamento TEXT,
  status TEXT DEFAULT 'confirmado',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pagamentos_user_id ON public.pagamentos(user_id);
CREATE INDEX IF NOT EXISTS idx_pagamentos_orcamento_id ON public.pagamentos(orcamento_id);
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- 4. EMAIL_LOGS
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enviado',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_orcamento ON public.email_logs(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(type);
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- 5. NOTAS_FISCAIS
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero TEXT NOT NULL UNIQUE,
  valor_total DECIMAL(10, 2) NOT NULL,
  data_emissao DATE NOT NULL,
  status TEXT DEFAULT 'gerada',
  pdf_url TEXT,
  xml_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_orcamento ON public.notas_fiscais(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_cliente ON public.notas_fiscais(cliente_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numero ON public.notas_fiscais(numero);
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;

-- 6. ALERTAS
CREATE TABLE IF NOT EXISTS public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  severidade TEXT DEFAULT 'warning',
  lido BOOLEAN DEFAULT FALSE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_leitura TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_alertas_orcamento ON public.alertas(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_alertas_lido ON public.alertas(lido);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON public.alertas(tipo);
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
```

---

## Tabelas a Ativar

| Tabela | Descrição | Linhas de Código |
|--------|-----------|------------------|
| **clientes** | Dados dos clientes | 12 |
| **orcamentos** | Orçamentos registrados | 13 |
| **pagamentos** | Registros de pagamento | 12 |
| **email_logs** | Log de emails enviados | 10 |
| **notas_fiscais** | Notas Fiscais geradas | 13 |
| **alertas** | Alertas do sistema | 11 |

**Total:** 6 tabelas com RLS (Row Level Security) ativado

---

## Verificação Pós-Ativação

Após ativar, verifique no Supabase:

```sql
-- Verificar se todas as tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('clientes', 'orcamentos', 'pagamentos', 'email_logs', 'notas_fiscais', 'alertas')
ORDER BY table_name;
```

**Resultado esperado:**
```
table_name
-----------
alertas
clientes
email_logs
notas_fiscais
orcamentos
pagamentos
```

---

## Após Ativação - Testes

1. **Acesse o CRM:**
   ```
   https://vargasti.lovable.app/crm/orcamentos
   ```

2. **Teste as funcionalidades:**
   - ✅ Ver lista de orçamentos (vazia inicialmente)
   - ✅ Criar novo orçamento
   - ✅ Acessar clientes
   - ✅ Registrar pagamentos

---

## Informações Técnicas

- **Commit:** `9ccb1bf` e `8fca916`
- **Arquivo Setup:** `src/routes/admin.setup.tsx`
- **Função:** `setupCRMTables()` em `src/lib/api/setup-crm.server.ts`
- **Documentação:** `SESSAO_14_JUNHO_2026.md`

---

## Suporte

Se tiver dúvidas ou erros ao ativar, verifique:

1. ✅ Você está logado como **admin** no sistema
2. ✅ O Supabase está **conectado** ao Lovable
3. ✅ Permissões de **criar tabelas** estão ativas
4. ✅ Não há **conflitos de nomes** de tabelas existentes

---

**Data:** 15/06/2026  
**Status:** 🟢 Pronto para Ativação  
**Método Recomendado:** Via Admin Panel (/admin/setup)
