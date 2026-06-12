import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────────────────────
export type GmailEmail = {
  id: string;
  threadId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: number;
  labels: string[];
};

type FetchEmailsResult =
  | { emails: GmailEmail[]; authorized: true; message?: string }
  | { emails: []; authorized: false; message: string };

class GmailAuthError extends Error {
  constructor(msg = "Gmail not authorized") {
    super(msg);
    this.name = "GmailAuthError";
  }
}

// ── Token management ─────────────────────────────────────────────────────────
async function getAdmin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GMAIL_CLIENT_ID!;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET!;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    throw new GmailAuthError(`Failed to refresh Gmail token: ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };

  const admin = await getAdmin();
  await admin
    .from("gmail_tokens")
    .update({
      access_token: data.access_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", "system");

  return data.access_token;
}

async function getAccessToken(): Promise<string> {
  const admin = await getAdmin();
  const { data } = await admin
    .from("gmail_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", "system")
    .maybeSingle();

  if (!data?.access_token) throw new GmailAuthError();

  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  if (expiresAt - Date.now() < 60_000) {
    if (!data.refresh_token) throw new GmailAuthError("Gmail token expired and no refresh token");
    return refreshAccessToken(data.refresh_token);
  }
  return data.access_token;
}

async function gmailFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) throw new GmailAuthError();
  if (!res.ok) throw new Error(`Gmail API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ── Fetch unread emails ──────────────────────────────────────────────────────
type GmailHeader = { name?: string; value?: string };
type GmailPart = { mimeType?: string; body?: { data?: string }; parts?: GmailPart[] };
type GmailMessage = {
  id: string;
  threadId: string;
  internalDate: string;
  labelIds?: string[];
  payload?: { headers?: GmailHeader[]; body?: { data?: string }; parts?: GmailPart[] };
};

function decodePart(parts: GmailPart[] | undefined): string {
  if (!parts) return "";
  for (const p of parts) {
    if (p.mimeType === "text/plain" && p.body?.data) {
      return Buffer.from(p.body.data, "base64url").toString("utf-8");
    }
  }
  for (const p of parts) {
    const nested = decodePart(p.parts);
    if (nested) return nested;
  }
  return "";
}

async function fetchUnreadEmails(maxResults: number): Promise<FetchEmailsResult> {
  try {
    const list = await gmailFetch<{ messages?: { id: string }[] }>(
      `/users/me/messages?q=${encodeURIComponent("is:unread")}&maxResults=${maxResults}`
    );

    if (!list.messages?.length) return { emails: [], authorized: true };

    const emails: GmailEmail[] = [];
    for (const m of list.messages) {
      const msg = await gmailFetch<GmailMessage>(`/users/me/messages/${m.id}?format=full`);
      const headers = msg.payload?.headers ?? [];
      const h = (n: string) => headers.find((x) => x.name === n)?.value ?? "";
      let body = "";
      if (msg.payload?.parts) body = decodePart(msg.payload.parts);
      else if (msg.payload?.body?.data)
        body = Buffer.from(msg.payload.body.data, "base64url").toString("utf-8");

      emails.push({
        id: msg.id,
        threadId: msg.threadId,
        from: h("From"),
        to: h("To"),
        subject: h("Subject"),
        body,
        timestamp: parseInt(msg.internalDate ?? "0"),
        labels: msg.labelIds ?? [],
      });
    }
    return { emails, authorized: true };
  } catch (err) {
    if (err instanceof GmailAuthError) {
      return {
        emails: [],
        authorized: false,
        message: "Gmail precisa ser autorizado antes de processar e-mails.",
      };
    }
    throw err;
  }
}

export const fetchNewEmails = createServerFn({ method: "POST" })
  .inputValidator(z.object({ maxResults: z.number().default(10) }))
  .handler(async ({ data }) => fetchUnreadEmails(data.maxResults));

// ── Mark as read ─────────────────────────────────────────────────────────────
async function markEmailAsReadInternal(messageId: string) {
  await gmailFetch(`/users/me/messages/${messageId}/modify`, {
    method: "POST",
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
  });
  return { ok: true };
}

export const markEmailAsRead = createServerFn({ method: "POST" })
  .inputValidator(z.object({ messageId: z.string() }))
  .handler(async ({ data }) => markEmailAsReadInternal(data.messageId));

// ── Claude interpretation ────────────────────────────────────────────────────
export async function interpretEmailWithClaude(email: GmailEmail) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("Anthropic API key not configured");

  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: `Você é um agente que analisa e-mails de suporte.
Classifique o e-mail e extraia informações importantes.
Responda em JSON com os campos: isRequest (bool), category (string), priority (string), summary (string).`,
    messages: [
      {
        role: "user",
        content: `Analise este e-mail:\nDe: ${email.from}\nAssunto: ${email.subject}\nConteúdo: ${email.body}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");
  try {
    return JSON.parse(content.text);
  } catch {
    return { isRequest: false, category: "unknown", priority: "media", summary: email.subject };
  }
}

// ── Helpdesk ─────────────────────────────────────────────────────────────────
const SendToHelpdeskSchema = z.object({
  emailId: z.string(),
  from: z.string(),
  subject: z.string(),
  body: z.string(),
  category: z.string(),
  priority: z.string(),
  summary: z.string(),
});
type HelpdeskPayload = z.infer<typeof SendToHelpdeskSchema>;

async function sendToHelpdeskInternal(data: HelpdeskPayload) {
  const url = process.env.HELPDESK_EMAIL_INTAKE_URL;
  const key = process.env.HELPDESK_EMAIL_INTAKE_API_KEY;
  if (!url || !key) throw new Error("Helpdesk configuration missing");

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      subject: data.subject,
      from: data.from,
      body: data.body,
      category: data.category,
      priority: data.priority,
      summary: data.summary,
    }),
  });
  if (!res.ok) throw new Error(`Helpdesk API error: ${res.status} ${res.statusText}`);
  const result = (await res.json()) as { ok: boolean; ticketId?: string };
  return { ok: true, ticketId: result.ticketId };
}

export const sendToHelpdeskApi = createServerFn({ method: "POST" })
  .inputValidator(SendToHelpdeskSchema)
  .handler(async ({ data }) => sendToHelpdeskInternal(data));

// ── Pipeline ─────────────────────────────────────────────────────────────────
export const processEmailPipeline = createServerFn({ method: "POST" })
  .inputValidator(z.object({ maxEmails: z.number().default(1) }))
  .handler(async ({ data }) => {
    try {
      const emailsResult = await fetchUnreadEmails(data.maxEmails);
      if (emailsResult.authorized === false) {
        return {
          ok: false,
          authorized: false,
          processed: 0,
          total: 0,
          message: emailsResult.message,
        };
      }
      if (!emailsResult.emails.length) {
        return { ok: true, authorized: true, processed: 0, total: 0, message: "No unread emails" };
      }

      let processedCount = 0;
      for (const email of emailsResult.emails) {
        try {
          const analysis = await interpretEmailWithClaude(email);
          if (analysis.isRequest) {
            try {
              await sendToHelpdeskInternal({
                emailId: email.id,
                from: email.from,
                subject: email.subject,
                body: email.body,
                category: analysis.category || "suporte",
                priority: analysis.priority || "media",
                summary: analysis.summary || email.subject,
              });
              processedCount++;
            } catch (err) {
              console.error("[email-pipeline] Helpdesk error:", err);
            }
          }
          await markEmailAsReadInternal(email.id);
        } catch (err) {
          console.error("[email-pipeline] Email error:", err);
        }
      }

      return {
        ok: true,
        authorized: true,
        processed: processedCount,
        total: emailsResult.emails.length,
        message: `Processed ${processedCount}/${emailsResult.emails.length} emails`,
      };
    } catch (err) {
      if (err instanceof GmailAuthError) {
        return {
          ok: false,
          authorized: false,
          processed: 0,
          total: 0,
          message: "Gmail precisa ser autorizado antes de processar e-mails.",
        };
      }
      throw err;
    }
  });
