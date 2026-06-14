# 🚀 Gerar Tabelas de Automações - Guia Rápido

## ⚡ 3 Passos Simples

### **Passo 1: Abrir Supabase Dashboard**
Acesse: https://app.supabase.com

### **Passo 2: Ir para SQL Editor**
- Na barra lateral, clique em **SQL Editor**
- Clique em **+ New Query**

### **Passo 3: Copiar e Colar SQL**

Copie TODO o código abaixo e cole no editor:

```sql
-- ============================================
-- VARGASTI CRM - AUTOMAÇÕES
-- ============================================

-- 1. EMAIL_LOGS
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'enviado',
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_logs_orcamento ON public.email_logs(orcamento_id);

-- 2. NOTAS_FISCAIS
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE NOT NULL,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
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

-- 3. ALERTAS
CREATE TABLE IF NOT EXISTS public.alertas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- 4. ADICIONAR COLUNA EM ORCAMENTOS
ALTER TABLE IF EXISTS public.orcamentos ADD COLUMN IF NOT EXISTS alerta_enviado BOOLEAN DEFAULT FALSE;
```

### **Passo 4: Executar**
- Clique no botão **Run** (ou pressione `Ctrl+Enter`)
- Aguarde a mensagem de sucesso ✅

---

## ✅ Pronto!

Agora as tabelas estão criadas e as automações funcionarão:

✨ **Enviar Orçamento** → Email automático  
✨ **Registrar Pagamento** → NF gerada automaticamente  
✨ **Alertas** → Orçamentos vencidos aparecem no dashboard  

---

## 🆘 Teve Erro?

Se aparecer erro tipo:
```
relation "orcamentos" does not exist
```

Significa que a tabela `orcamentos` não existe ainda. Você precisa:
1. Criar os clientes primeiro
2. Depois criar os orçamentos
3. Depois rodar este script

---

## 📝 Verificar se Funcionou

No SQL Editor, execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('email_logs', 'notas_fiscais', 'alertas')
ORDER BY table_name;
```

Deve retornar **3 tabelas**.
