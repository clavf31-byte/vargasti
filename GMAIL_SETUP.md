# Gmail Integration Setup

## 1. Environment Variables

Adicione ao seu `.env.local` ou `.env`:

```env
GMAIL_CLIENT_ID=YOUR_CLIENT_ID_HERE
GMAIL_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GMAIL_REDIRECT_URI=http://localhost:3000/api/gmail-callback
```

Obter credenciais em: https://console.cloud.google.com/apis/credentials

Para produção, usar:
```env
GMAIL_REDIRECT_URI=https://seu-dominio.com/api/gmail-callback
```

---

## 2. Database Migration

Execute este SQL no Supabase SQL Editor:

```sql
-- Gmail Tokens Table
CREATE TABLE IF NOT EXISTS gmail_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Email Processing Log
CREATE TABLE IF NOT EXISTS email_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id TEXT NOT NULL UNIQUE,
  ticket_id UUID REFERENCES tickets(id),
  status TEXT NOT NULL,
  error TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Add columns to tickets table (if not exist)
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS email_source TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gmail_tokens_user_id ON gmail_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_processing_log_email_id ON email_processing_log(email_id);
CREATE INDEX IF NOT EXISTS idx_email_processing_log_ticket_id ON email_processing_log(ticket_id);
```

---

## 3. Gmail Webhook Setup

No Google Cloud Console:

### Ativar Pub/Sub API
1. APIs e serviços → Biblioteca
2. Procure "Cloud Pub/Sub API" → Ativar

### Criar Topic
1. Pub/Sub → Topics
2. Criar novo tópico: `gmail-notifications`
3. Criar subscription com:
   - Push URL: `https://seu-dominio.com/api/gmail-webhook`
   - Request headers:
     ```
     Authorization: Bearer YOUR_WEBHOOK_SECRET
     ```

### Dar Permissões ao Gmail
```bash
# No Google Cloud Console, addicionar member:
# service-NUMERO-PROJECT@gcp-sa-gmail.iam.gserviceaccount.com
# com role: Pub/Sub Publisher
```

---

## 4. Autorização Inicial

### Via CLI
```bash
# Abrir navegador com URL de autorização
curl http://localhost:3000/api/gmail-auth
```

### Via UI (Optional - criar botão depois)
1. Clique em "Conectar Gmail"
2. Faça login com `claudio.filho@interative.com.br`
3. Autorize os scopes
4. Será redirecionado para sucesso

---

## 5. Fluxo de Funcionamento

```
Gmail recebe e-mail
    ↓
Gmail envia notificação via Pub/Sub
    ↓
POST /api/gmail-webhook
    ↓
Fetch último e-mail não lido
    ↓
Claude interpreta conteúdo
    ↓
Se for solicitação → Cria ticket em 'tickets'
    ↓
Marca e-mail como read no Gmail
    ↓
Log salvo em 'email_processing_log'
```

---

## 6. Testar

### Enviar e-mail de teste para `claudio.filho@interative.com.br`

O e-mail deve gerar um ticket automaticamente na tabela `tickets`.

### Monitorar logs

```sql
-- Verificar processamentos
SELECT * FROM email_processing_log ORDER BY created_at DESC LIMIT 10;

-- Ver tickets criados
SELECT id, title, source, email_source, created_at FROM tickets WHERE source = 'email';
```

---

## 7. Pacotes NPM Necessários

```bash
npm install googleapis
```

---

## 8. Próximos Passos (Optional)

- [ ] UI para conectar/desconectar Gmail
- [ ] Responder automaticamente aos e-mails
- [ ] Templates de resposta
- [ ] Rastreamento de e-mails respondidos
- [ ] Sincronização histórica de e-mails

---

## Troubleshooting

**"Gmail not authorized"**
- Execute a autorização inicial novamente
- Verifique se o token está salvo em `gmail_tokens`

**Webhook não recebe notificações**
- Verifique permissões do Pub/Sub
- Teste manualmente: POST para `/api/gmail-webhook`

**Claude não interpreta corretamente**
- Ajuste o system prompt em `interpretEmailWithClaude`
- Aumente max_tokens se necessário
