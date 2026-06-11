# Email Intake Edge Function (Supabase)

## O que é

Edge Function serverless em **Deno** que roda no Supabase Cloud.
- ✅ Server-side (API key segura)
- ✅ URL pública sempre ativa
- ✅ Sem necessidade de PC ligado
- ✅ Escalável automaticamente

---

## Arquivos criados

```
supabase/functions/email-intake/
├── index.ts      # Função Deno
└── deno.json     # Config de imports
```

---

## Setup no Lovable

### 1. Copiar arquivos

Os arquivos já estão em:
- `supabase/functions/email-intake/index.ts`
- `supabase/functions/email-intake/deno.json`

Sincronize com Lovable (git pull ou copie manualmente).

### 2. Configurar secret

No **Lovable Cloud / Settings → Secrets**:

```
EMAIL_INTAKE_API_KEY = seu_api_key_bem_longo_aleatorio_12345678
```

### 3. Deploy automático

Lovable faz deploy automático de Edge Functions quando você faz push em `supabase/functions/`.

Ou via CLI:
```bash
supabase functions deploy email-intake
```

---

## Endpoint público

Depois do deploy, você terá uma URL tipo:

```
https://seu-projeto.supabase.co/functions/v1/email-intake
```

---

## Testar a Edge Function

```bash
curl -X POST https://seu-projeto.supabase.co/functions/v1/email-intake \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_api_key_bem_longo_aleatorio_12345678" \
  -d '{
    "subject": "Teste de E-mail",
    "from": "claudio.filho@interative.com.br",
    "body": "Este é um e-mail de teste para criar um ticket.",
    "category": "suporte",
    "priority": "media"
  }'
```

**Resposta esperada:**
```json
{
  "ok": true,
  "ticketId": "uuid-do-ticket",
  "message": "Ticket criado com sucesso"
}
```

---

## Próximos passos

1. **Sincronizar** files com Lovable
2. **Adicionar secret** EMAIL_INTAKE_API_KEY no Lovable Cloud
3. **Deploy** da Edge Function (automático)
4. **Copiar URL** do endpoint
5. **Atualizar VargasTI** para chamar esse endpoint

---

## Estrutura da requisição

```typescript
POST /functions/v1/email-intake

Headers:
- Content-Type: application/json
- Authorization: Bearer EMAIL_INTAKE_API_KEY

Body:
{
  "subject": string (obrigatório),
  "from": string email (obrigatório),
  "body": string (obrigatório),
  "category": string (opcional, default: "suporte"),
  "priority": "alta" | "media" | "baixa" (opcional, default: "media"),
  "summary": string (opcional)
}
```

---

## Resposta

**Sucesso (201):**
```json
{
  "ok": true,
  "ticketId": "uuid",
  "message": "Ticket criado com sucesso"
}
```

**Erro (400/401/500):**
```json
{
  "ok": false,
  "error": "Descrição do erro"
}
```

---

## Monitorar execução

No **Lovable Cloud Console → Logs → Functions**, você vê os logs da função em tempo real.

---

## Segurança

✅ API key fica em `Deno.env.get()` (server-side, não exposto)
✅ Bearer token validado a cada request
✅ Dados sensíveis não logados
✅ CORS habilitado apenas para seu domínio (configurar se necessário)

---

**Quando terminar de syncronizar com Lovable, me avisa!** ✅
