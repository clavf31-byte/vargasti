# 🚀 Setup das Automações no Supabase

## Passo 1: Acessar o Supabase Dashboard

1. Acesse https://supabase.com
2. Faça login com sua conta
3. Selecione seu projeto `vargasti`

---

## Passo 2: Executar o SQL

### Via SQL Editor (Recomendado)

1. No painel esquerdo, clique em **SQL Editor**
2. Clique em **New Query**
3. Copie todo o conteúdo do arquivo `supabase_migrations.sql`
4. Cole no editor
5. Clique em **Run** (ou Ctrl+Enter)

```
✅ Success: 8 rows affected
```

### Via Arquivo .sql

1. No Supabase Dashboard, vá para **SQL Editor**
2. Clique nos 3 pontos `...` → **Open file**
3. Selecione `supabase_migrations.sql`
4. Clique em **Run**

---

## Passo 3: Verificar se Funcionou

Após executar, verifique se as tabelas foram criadas:

### No SQL Editor, execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('email_logs', 'notas_fiscais', 'alertas');
```

**Resultado esperado:**
```
table_name
-----------
alertas
email_logs
notas_fiscais
```

---

## Passo 4: Verificar Colunas da Tabela orcamentos

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orcamentos' 
ORDER BY ordinal_position;
```

**Deve incluir:**
- ✅ `alerta_enviado` (BOOLEAN)

---

## 🎯 O que foi criado?

| Tabela | Descrição | Objetivo |
|--------|-----------|----------|
| **email_logs** | Rastreamento de emails | Log de orçamentos/NF enviados |
| **notas_fiscais** | Notas Fiscais geradas | Armazena NF com PDF/XML |
| **alertas** | Alertas do sistema | Vencimentos e notificações |

---

## ⚠️ Troubleshooting

### Erro: "relation 'orcamentos' does not exist"

Significa que a tabela `orcamentos` não existe no seu banco. Verifique:

```sql
SELECT * FROM information_schema.tables 
WHERE table_name = 'orcamentos';
```

Se não existir, você precisa criar primeiro:

```sql
CREATE TABLE IF NOT EXISTS public.orcamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  numero TEXT NOT NULL,
  total DECIMAL(10, 2) DEFAULT 0,
  data_vencimento DATE,
  notas TEXT,
  status TEXT DEFAULT 'rascunho',
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## ✅ Pronto!

Agora você pode:
1. Criar clientes com email
2. Criar orçamentos
3. Enviar orçamentos (automação de email)
4. Registrar pagamento (gera NF automaticamente)
5. Ver alertas de vencimento na dashboard

Teste em http://localhost:5173/crm/orcamentos
