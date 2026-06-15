# ✅ Schema CRM - Tabelas Ativas no Supabase

**Data de Ativação:** 15/06/2026  
**Status:** 🟢 Todas as 6 tabelas ativas e operacionais  
**RLS:** ✅ Ativado em todas as tabelas

---

## 📊 Tabelas Ativas

### 1️⃣ clientes
```sql
CREATE TABLE public.clientes (
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
  cnpj_cpf TEXT UNIQUE,  -- ⚠️ NÃO é cpf_cnpj
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
✅ RLS: Ativo  
✅ Índices: user_id, email

---

### 2️⃣ orcamentos
```sql
CREATE TABLE public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  status TEXT DEFAULT 'rascunho',
  total DECIMAL(10, 2) DEFAULT 0,
  descricao TEXT,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_vencimento TIMESTAMP WITH TIME ZONE,  -- ⚠️ NÃO é data_validade
  alerta_enviado BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
✅ RLS: Ativo  
✅ Índices: user_id, cliente_id, status

---

### 3️⃣ pagamentos
```sql
CREATE TABLE public.pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  valor DECIMAL(10, 2) NOT NULL,
  data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metodo TEXT,  -- ⚠️ NÃO é metodo_pagamento
  referencia TEXT,  -- ✅ Campo para rastrear pagamento (ex: transação)
  observacoes TEXT,  -- ✅ Campo para notas
  status TEXT DEFAULT 'confirmado',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
✅ RLS: Ativo  
✅ Índices: user_id, orcamento_id

---

### 4️⃣ email_logs
```sql
CREATE TABLE public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,  -- Ex: 'orcamento_enviado', 'nf_enviada'
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enviado',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
✅ RLS: Ativo  
✅ Índices: orcamento_id, recipient, type

---

### 5️⃣ notas_fiscais
```sql
CREATE TABLE public.notas_fiscais (
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
```
✅ RLS: Ativo  
✅ Índices: orcamento_id, cliente_id, numero

---

### 6️⃣ alertas
```sql
CREATE TABLE public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,  -- Ex: 'vencimento', 'atraso'
  mensagem TEXT NOT NULL,
  severidade TEXT DEFAULT 'warning',  -- 'info', 'warning', 'error'
  lido BOOLEAN DEFAULT FALSE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_leitura TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
✅ RLS: Ativo  
✅ Índices: orcamento_id, lido, tipo

---

## ⚠️ Diferenças do Documento Anterior

| Campo | Doc Antigo | Schema Atual | Status |
|-------|-----------|-------------|--------|
| clientes.cpf_cnpj | `cpf_cnpj` | `cnpj_cpf` | ❌ Corrigido |
| orcamentos.data_validade | `data_validade` | `data_vencimento` | ❌ Corrigido |
| pagamentos.metodo_pagamento | `metodo_pagamento` | `metodo` | ❌ Corrigido |
| pagamentos.referencia | ❌ Não existia | `referencia` | ✅ Adicionado |
| pagamentos.observacoes | ❌ Não existia | `observacoes` | ✅ Adicionado |

---

## 🎯 Status do CRM

### ✅ Pronto para Usar
- [x] 6 tabelas ativas
- [x] RLS configurado
- [x] Índices criados
- [x] Foreign keys validadas
- [x] Nomes alinhados com código

### 📝 Próximos Passos (ETAPA 5)
- [ ] Automação: Email on status change
- [ ] Automação: NF generation on payment
- [ ] Automação: Vencimento alerts (system-wide)

---

## 🚀 Como Testar

```bash
# 1. Acesse o CRM
https://vargasti.lovable.app/crm/orcamentos

# 2. Teste a criação
- Criar novo cliente
- Criar novo orçamento
- Registrar pagamento
- Ver alertas

# 3. Verifique dados no Supabase
SELECT * FROM clientes LIMIT 1;
SELECT * FROM orcamentos LIMIT 1;
```

---

## 📌 Importante

**Usar SEMPRE os nomes corretos:**
- ✅ `cnpj_cpf` (não `cpf_cnpj`)
- ✅ `data_vencimento` (não `data_validade`)
- ✅ `metodo` (não `metodo_pagamento`)
- ✅ `referencia` (campo novo)
- ✅ `observacoes` (campo novo)

---

**Documentação Atualizada:** 15/06/2026  
**Responsável:** Claude Code  
**Validação:** Esquema verificado e alinhado com código ✅
