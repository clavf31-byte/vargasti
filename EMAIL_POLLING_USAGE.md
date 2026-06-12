# Email Polling - Como Usar

## Arquivos criados

- `src/lib/api/emailAgent.functions.ts` (atualizado)
- `src/lib/api/emailPolling.ts` (novo)

---

## Setup

### 1. Adicionar env vars

No `.env.local`:

```env
HELPDESK_EMAIL_INTAKE_URL=https://seu-projeto.supabase.co/functions/v1/email-intake
HELPDESK_EMAIL_INTAKE_API_KEY=seu_api_key_aleatorio_12345678
```

### 2. Importar no seu app

```typescript
import { startEmailPolling, stopEmailPolling, triggerEmailPolling } from "@/lib/api/emailPolling";
```

---

## Uso

### Opção 1: Polling automático (a cada 5 min)

```typescript
// No seu layout ou app root (roda uma vez ao iniciar)
useEffect(() => {
  startEmailPolling({
    intervalMs: 5 * 60 * 1000, // 5 minutes
    maxEmailsPerPoll: 5,
  });

  return () => stopEmailPolling();
}, []);
```

### Opção 2: Polling customizado

```typescript
// Começar com intervalo de 1 minuto, 10 e-mails por ciclo
startEmailPolling({
  intervalMs: 60 * 1000,
  maxEmailsPerPoll: 10,
});

// Parar
stopEmailPolling();

// Checar status
if (isEmailPollingActive()) {
  console.log("Polling is running");
}
```

### Opção 3: Botão manual (sem polling automático)

```typescript
import { triggerEmailPolling } from "@/lib/api/emailPolling";

export function EmailCheckButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const result = await triggerEmailPolling(5);
      console.log("Result:", result);
      // Show toast: "Verificado X e-mails"
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? "Verificando..." : "Verificar E-mails"}
    </button>
  );
}
```

---

## Fluxo de processamento

```
1. Fetch unread emails from Gmail
   ↓
2. For each email:
   - Interpret with Claude
   - If is request:
     - Send to Helpdesk API
     - Log result
   - Mark as read
   ↓
3. Return: { ok, processed, total, message }
```

---

## Resposta do polling

```typescript
{
  ok: true,
  processed: 3,           // Tickets created
  total: 5,               // Emails processed
  message: "Processed 3/5 emails"
}
```

---

## Monitorar logs

No seu `pages/api/logs` ou console:

```
[email-pipeline] Starting email processing
[email-pipeline] Processing: { from: "...", subject: "..." }
[email-pipeline] Analysis: { isRequest: true, category: "suporte", priority: "media" }
[email-pipeline] Sent to Helpdesk: Email title
[email-pipeline] Marked as read: message-id
```

---

## Checklist antes de usar

- [ ] Gmail OAuth autorizado (`/api/gmail-auth`)
- [ ] Token salvo em `gmail_tokens` table
- [ ] `HELPDESK_EMAIL_INTAKE_URL` configurado
- [ ] `HELPDESK_EMAIL_INTAKE_API_KEY` configurado
- [ ] Edge Function deployada no Helpdesk
- [ ] SQL migrations executadas no Supabase

---

## Troubleshooting

**"Gmail not authorized"**
- Visite `/api/gmail-auth` e autorize
- Confirm token is saved

**"Helpdesk API error"**
- Verifique `HELPDESK_EMAIL_INTAKE_URL` está correto
- Verifique `HELPDESK_EMAIL_INTAKE_API_KEY` está correto
- Teste Edge Function com curl

**"No unread emails"**
- É normal, não há e-mails não lidos
- Envie um e-mail de teste

---

## Performance

- **Polling interval**: Recomendado 5-10 minutos
- **Max emails per poll**: Recomendado 5-10
- **Timeout**: Cada e-mail leva ~2-5 segundos (Claude API)
- **Total time**: ~15-30 segundos por ciclo

---

## Parar polling e testar manual

```typescript
// Parar o automático
stopEmailPolling();

// Testar manual uma vez
const result = await triggerEmailPolling(1);
console.log("Result:", result);
```

---

**Pronto pra testar!** ✅
