# API Email Intake para Helpdesk Interative (Lovable)

## Arquivo para criar no Helpdesk Interative

**Caminho:** `src/routes/api/email-intake.ts`

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// ── Supabase admin client ─────────────────────────────────────────────────────
function getAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
  return createClient(url, key);
}

// ── Schema ────────────────────────────────────────────────────────────────────
const EmailIntakeSchema = z.object({
  subject: z.string().min(1),
  from: z.string().email(),
  body: z.string().min(1),
  category: z.string().optional().default("suporte"),
  priority: z.enum(["alta", "media", "baixa"]).default("media"),
  summary: z.string().optional(),
});

type EmailIntake = z.infer<typeof EmailIntakeSchema>;

export const Route = createFileRoute("/api/email-intake")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // Validate Bearer token
          const authHeader = request.headers.get("authorization") || "";
          const token = authHeader.replace("Bearer ", "");
          
          // TODO: Replace with your actual API key validation
          const validApiKey = process.env.EMAIL_INTAKE_API_KEY;
          if (!validApiKey || token !== validApiKey) {
            console.error("[email-intake] Invalid or missing API key");
            return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
              status: 401,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Parse and validate request body
          const body = (await request.json()) as unknown;
          const data = EmailIntakeSchema.parse(body);

          console.log("[email-intake] Creating ticket from email:", {
            from: data.from,
            subject: data.subject,
            category: data.category,
          });

          // Create ticket in Supabase
          const admin = getAdminClient();

          const { data: ticket, error } = await admin
            .from("tickets")
            .insert({
              title: data.subject,
              description: `**Via E-mail:** ${data.from}\n\n${data.body}`,
              status: "aberto",
              priority: data.priority,
              category: data.category,
              source: "email",
              email_source: data.from,
              created_at: new Date().toISOString(),
            })
            .select()
            .maybeSingle();

          if (error) {
            console.error("[email-intake] Database error:", error.message);
            return new Response(
              JSON.stringify({ ok: false, error: error.message }),
              {
                status: 500,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          console.log("[email-intake] Ticket created:", ticket?.id);

          return new Response(
            JSON.stringify({
              ok: true,
              ticketId: ticket?.id,
              message: "Ticket criado com sucesso",
            }),
            {
              status: 201,
              headers: { "Content-Type": "application/json" },
            }
          );
        } catch (err) {
          console.error("[email-intake] Error:", err);

          // Handle validation errors
          if (err instanceof z.ZodError) {
            return new Response(
              JSON.stringify({
                ok: false,
                error: "Invalid request body",
                details: err.errors,
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              }
            );
          }

          return new Response(
            JSON.stringify({
              ok: false,
              error: err instanceof Error ? err.message : "Internal server error",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
```

---

## Passo a Passo no Lovable

### 1. Criar o arquivo
1. Abra seu projeto **Helpdesk Interative** no Lovable
2. Crie a pasta: `src/routes/api/`
3. Crie arquivo: `email-intake.ts`
4. Cole o código acima

### 2. Adicionar env var
No Lovable, em **Settings → Environment Variables**, adicione:

```
EMAIL_INTAKE_API_KEY=seu_api_key_bem_longo_aleatorio_123456789
```

### 3. Validar schema
Certifique-se que sua tabela `tickets` tem os campos:
- `title` (TEXT)
- `description` (TEXT)
- `status` (TEXT)
- `priority` (TEXT: alta/media/baixa)
- `category` (TEXT)
- `source` (TEXT)
- `email_source` (TEXT)
- `created_at` (TIMESTAMP)

---

## Testar a API

```bash
curl -X POST http://localhost:5173/api/email-intake \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer seu_api_key_bem_longo_aleatorio_123456789" \
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

## Depois que criar

Avisa aqui pra eu:
1. Atualizar VargasTI pra chamar essa API
2. Criar o polling de e-mails
3. Testar tudo junto

✅ **Bora lá!**
