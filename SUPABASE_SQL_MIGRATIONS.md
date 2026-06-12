# 🗄️ Supabase SQL Migrations

## O que fazer:

No **Lovable Helpdesk → Supabase → SQL Editor**

Cole **TODO** este código:

---

## Copie e Cole:

```sql
-- ============================================================================
-- Gmail Tokens Table
-- Armazena tokens de acesso do Gmail para VargasTI
-- ============================================================================

CREATE TABLE IF NOT EXISTS gmail_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Index para busca rápida
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user_id ON gmail_tokens(user_id);

-- ============================================================================
-- Email Processing Log
-- Rastreia qual e-mail foi processado e qual ticket foi criado
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL UNIQUE,
  ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'processado',
  error TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes para buscas
CREATE INDEX IF NOT EXISTS idx_email_processing_log_email_id ON email_processing_log(email_id);
CREATE INDEX IF NOT EXISTS idx_email_processing_log_ticket_id ON email_processing_log(ticket_id);
CREATE INDEX IF NOT EXISTS idx_email_processing_log_status ON email_processing_log(status);

-- ============================================================================
-- Alterações na tabela tickets (se necessário)
-- Adiciona campos para rastrear origem do ticket
-- ============================================================================

ALTER TABLE tickets
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS email_source TEXT;

-- Index para filtrar por source
CREATE INDEX IF NOT EXISTS idx_tickets_source ON tickets(source);

-- ============================================================================
-- Done!
-- ============================================================================
```

---

## Passos:

1. Abra **Supabase → SQL Editor** no Lovable Helpdesk
2. **Cole TODO o código acima**
3. Clique **RUN** ou **Execute**
4. Aguarde a mensagem de sucesso

---

## ✅ Pronto!

Tabelas criadas:
- `gmail_tokens`
- `email_processing_log`
- Novos campos em `tickets`

Avisa quando terminar! 🚀
