# Database Migrations - Automações CRM

Você precisa executar os seguintes SQL no Supabase para suportar as automações.

## Tabela: email_logs

Rastreia todos os emails enviados pelo sistema (orçamentos, NF, alertas).

```sql
CREATE TABLE email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'orcamento_enviado', 'nf_gerada', 'alerta_vencimento'
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  orcamento_id uuid REFERENCES orcamentos(id),
  status TEXT DEFAULT 'enviado', -- 'enviado', 'falha', 'nao_lido'
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_logs_orcamento ON email_logs(orcamento_id);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient);
```

## Tabela: notas_fiscais

Armazena informações das Notas Fiscais geradas automaticamente.

```sql
CREATE TABLE notas_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid REFERENCES orcamentos(id) NOT NULL,
  cliente_id uuid REFERENCES clientes(id) NOT NULL,
  numero TEXT NOT NULL UNIQUE,
  valor_total DECIMAL(10, 2) NOT NULL,
  data_emissao DATE NOT NULL,
  status TEXT DEFAULT 'gerada', -- 'gerada', 'enviada', 'cancelada'
  pdf_url TEXT,
  xml_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notas_fiscais_orcamento ON notas_fiscais(orcamento_id);
CREATE INDEX idx_notas_fiscais_cliente ON notas_fiscais(cliente_id);
```

## Tabela: alertas

Alertas do sistema (vencimentos, atrasos, etc).

```sql
CREATE TABLE alertas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid REFERENCES orcamentos(id),
  tipo TEXT NOT NULL, -- 'vencimento', 'atraso', 'pendencia'
  mensagem TEXT NOT NULL,
  severidade TEXT DEFAULT 'warning', -- 'info', 'warning', 'error'
  lido BOOLEAN DEFAULT FALSE,
  data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_leitura TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_alertas_orcamento ON alertas(orcamento_id);
CREATE INDEX idx_alertas_lido ON alertas(lido);
```

## Alterações na Tabela: orcamentos

Adicionar colunas para suportar automações.

```sql
ALTER TABLE orcamentos 
ADD COLUMN IF NOT EXISTS alerta_enviado BOOLEAN DEFAULT FALSE;
```

## Passos para aplicar

1. Abra o Supabase Dashboard
2. Vá para SQL Editor
3. Cole cada bloco SQL acima
4. Execute cada um separadamente
5. Verifique se não há erros

## Verificação

Para verificar se as tabelas foram criadas corretamente, execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('email_logs', 'notas_fiscais', 'alertas');
```

Deve retornar 3 linhas.
