import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createAnthropicMessage } from "./anthropicRest";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";



// ── Gmail REST helpers (server-only) ──────────────────────────────────────────
function getGmailOAuthConfig() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI ?? "http://localhost:3000/api/gmail-callback";

  if (!clientId || !clientSecret) {
    throw new Error("Gmail credentials not configured");
  }

  return { clientId, clientSecret, redirectUri };
}

async function exchangeGmailCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getGmailOAuthConfig();
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await response.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error_description?: string;
  };

  if (!response.ok || !tokens.access_token) {
    throw new Error(tokens.error_description ?? "Failed to get Gmail access token");
  }

  return tokens;
}

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

const MAX_BODY_LENGTH = 5000;

function truncateBody(body: string): string {
  if (body.length > MAX_BODY_LENGTH) {
    return body.substring(0, MAX_BODY_LENGTH) + "\n\n[...truncado...]";
  }
  return body;
}

type FetchEmailsResult =
  | { emails: GmailEmail[]; authorized: true; message?: string }
  | { emails: []; authorized: false; message: string };

type GmailListResponse = {
  messages?: Array<{ id?: string; threadId?: string }>;
};

type GmailMessageResponse = {
  id?: string;
  threadId?: string;
  internalDate?: string;
  labelIds?: string[];
  payload?: {
    headers?: Array<{ name?: string | null; value?: string | null }>;
    body?: { data?: string | null };
    parts?: Array<{ mimeType?: string | null; body?: { data?: string | null } }>;
  };
};

function isGmailAuthorizationError(err: unknown) {
  return err instanceof Error && err.message === "Gmail not authorized";
}

// ── Get Gmail OAuth URL ───────────────────────────────────────────────────────
export const getGmailAuthUrl = createServerFn({ method: "GET" }).handler(async () => {
  const { clientId, redirectUri } = getGmailOAuthConfig();
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    scope: "https://www.googleapis.com/auth/gmail.modify",
    prompt: "consent",
  }).toString();
  return { url: url.toString() };
});

// ── Save Gmail Token ──────────────────────────────────────────────────────────
const SaveGmailTokenSchema = z.object({
  code: z.string(),
  userId: z.string(),
});

export const saveGmailToken = createServerFn({ method: "POST" })
  .inputValidator(SaveGmailTokenSchema)
  .handler(async ({ data }) => {
    const tokens = await exchangeGmailCodeForTokens(data.code);

    if (!tokens.access_token) {
      throw new Error("Failed to get access token");
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const response = await fetch(`${supabaseUrl}/rest/v1/gmail_tokens`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: data.userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to save Gmail token: ${error}`);
    }

    return { ok: true, authorized: true };
  });

// ── Refresh Gmail Access Token with Retry Logic ──────────────────────────────
async function refreshGmailAccessTokenWithRetry(
  refreshToken: string,
  maxRetries = 3
): Promise<{ access_token?: string; expires_in?: number } | null> {
  const { clientId, clientSecret } = getGmailOAuthConfig();

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: "refresh_token",
        }),
      });

      const tokens = await response.json() as {
        access_token?: string;
        expires_in?: number;
        error_description?: string;
      };

      if (!response.ok || !tokens.access_token) {
        throw new Error(tokens.error_description ?? "Failed to refresh Gmail access token");
      }

      return tokens;
    } catch (err) {
      console.warn(`[email-polling] Token refresh attempt ${attempt + 1}/${maxRetries} failed:`, err);
      if (attempt < maxRetries - 1) {
        const backoffMs = 1000 * Math.pow(2, attempt);
        await new Promise(r => setTimeout(r, backoffMs));
        continue;
      }
      console.error("[email-polling] Token refresh failed after retries:", err);
      return null;
    }
  }
  return null;
}

async function getGmailAccessToken(userId: string = "system") {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials not configured");
  }

  const response = await fetch(
    `${supabaseUrl}/rest/v1/gmail_tokens?select=access_token,refresh_token,expires_at&user_id=eq.${userId}`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch Gmail token: ${response.statusText}`);
  }

  const data = (await response.json()) as Array<{
    access_token: string;
    refresh_token: string;
    expires_at: string | null;
  }>;

  const tokenData = data[0];
  if (!tokenData?.access_token) {
    throw new Error("Gmail not authorized");
  }

  const expiresAt = tokenData.expires_at ? new Date(tokenData.expires_at).getTime() : 0;
  const shouldRefresh = Boolean(
    tokenData.refresh_token && expiresAt && expiresAt <= Date.now() + 60_000
  );

  if (!shouldRefresh) return tokenData.access_token;

  const refreshed = await refreshGmailAccessTokenWithRetry(tokenData.refresh_token);

  if (!refreshed?.access_token) {
    throw new Error("Failed to refresh Gmail token after multiple retries");
  }

  await fetch(`${supabaseUrl}/rest/v1/gmail_tokens?user_id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      access_token: refreshed.access_token,
      expires_at: refreshed.expires_in
        ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        : null,
      updated_at: new Date().toISOString(),
    }),
  });

  return refreshed.access_token;
}

async function gmailRequest<T>(path: string, init: RequestInit = {}, userId: string = "system"): Promise<T> {
  const accessToken = await getGmailAccessToken(userId);
  const response = await fetch(`https://gmail.googleapis.com/gmail/v1${path}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gmail API error: ${response.status} ${details}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function fetchUnreadEmails(maxResults: number, userId: string = "system"): Promise<FetchEmailsResult> {
    try {
      await getGmailAccessToken(userId);
    } catch (err) {
      if (isGmailAuthorizationError(err)) {
        return {
          emails: [],
          authorized: false,
          message: "Gmail precisa ser autorizado antes de processar e-mails.",
        };
      }

      throw err;
    }

    const searchParams = new URLSearchParams({
      q: "is:unread",
      maxResults: String(maxResults),
    });
    const listRes = await gmailRequest<GmailListResponse>(`/users/me/messages?${searchParams.toString()}`, {}, userId);

    if (!listRes.messages?.length) {
      return { emails: [], authorized: true };
    }

    const emails: GmailEmail[] = [];

    for (const msg of listRes.messages) {
      if (!msg.id) continue;

      const emailRes = await gmailRequest<GmailMessageResponse>(`/users/me/messages/${msg.id}?format=full`, {}, userId);

      const headers = emailRes.payload?.headers ?? [];
      const getHeader = (name: string) => headers.find((h: { name?: string | null; value?: string | null }) => h.name === name)?.value ?? "";

      let body = "";
      if (emailRes.payload?.parts) {
        const part = emailRes.payload.parts.find((p: { mimeType?: string | null }) => p.mimeType === "text/plain");
        if (part?.body?.data) {
          body = Buffer.from(part.body.data, "base64url").toString("utf-8");
        }
      } else if (emailRes.payload?.body?.data) {
        body = Buffer.from(emailRes.payload.body.data, "base64url").toString("utf-8");
      }

      emails.push({
        id: msg.id,
        threadId: emailRes.threadId ?? msg.threadId ?? "",
        from: getHeader("From"),
        to: getHeader("To"),
        subject: getHeader("Subject"),
        body: truncateBody(body),
        timestamp: parseInt(emailRes.internalDate ?? "0"),
        labels: emailRes.labelIds ?? [],
      });
    }

    return { emails, authorized: true };
}

// ── Fetch New Emails ──────────────────────────────────────────────────────────
export const fetchNewEmails = createServerFn({ method: "POST" })
  .inputValidator(z.object({ maxResults: z.number().default(10) }))
  .handler(async ({ data }) => fetchUnreadEmails(data.maxResults));

// ── Mark Email as Read ────────────────────────────────────────────────────────
const MarkAsReadSchema = z.object({
  messageId: z.string(),
});

async function markEmailAsReadInternal(messageId: string, userId: string = "system") {
  await gmailRequest(`/users/me/messages/${messageId}/modify`, {
    method: "POST",
    body: JSON.stringify({
      removeLabelIds: ["UNREAD"],
    }),
  }, userId);

  return { ok: true };
}

export const markEmailAsRead = createServerFn({ method: "POST" })
  .inputValidator(MarkAsReadSchema)
  .handler(async ({ data }) => markEmailAsReadInternal(data.messageId));

// ── Interpret Email with Claude ───────────────────────────────────────────────
async function getEmailConfig() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const response = await fetch(
      `${supabaseUrl}/rest/v1/email_settings?id=eq.00000000-0000-0000-0000-000000000000&select=*`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
      }
    );

    if (!response.ok) {
      console.warn("[getEmailConfig] Failed to fetch config from Supabase");
      return null;
    }

    const data = (await response.json()) as Array<{
      categories?: Array<{ name: string; keywords: string[] }>;
      priorities?: Array<{ id: string; keywords: string[]; priority: string }>;
    }>;

    return data[0] || null;
  } catch (err) {
    console.error("[getEmailConfig] Error:", err);
    return null;
  }
}

export async function interpretEmailWithClaude(email: GmailEmail) {
  const text = `${email.subject} ${email.body}`.toLowerCase();

  // Buscar configurações do Supabase
  const config = await getEmailConfig();

  // Categorias: usar config do Supabase ou defaults
  const categories: Record<string, string[]> = {};
  if (config?.categories && Array.isArray(config.categories)) {
    for (const cat of config.categories) {
      if (cat.name && Array.isArray(cat.keywords)) {
        categories[cat.name] = cat.keywords;
      }
    }
  } else {
    // Defaults
    categories["Impressora"] = ["impressora", "printer", "imprimir", "print", "papel"];
    categories["Rede"] = ["internet", "conexão", "wifi", "rede", "conectar", "ping", "latência"];
    categories["Email"] = ["email", "outlook", "gmail", "enviar", "receber", "anexo"];
    categories["Software"] = ["software", "programa", "aplicativo", "erro", "crash", "travado"];
    categories["Hardware"] = ["hardware", "dispositivo", "mouse", "teclado", "monitor", "pc"];
    categories["VPN"] = ["vpn", "remoto", "acesso remoto", "proxy"];
    categories["Banco de Dados"] = ["banco", "banco de dados", "database", "sql", "backup"];
    categories["Suporte"] = ["help", "suporte", "ajuda", "problema", "não funciona", "dúvida"];
  }

  let category = "Suporte";
  for (const [cat, keywords] of Object.entries(categories)) {
    if (keywords.some((kw) => text.includes(kw))) {
      category = cat;
      break;
    }
  }

  // Prioridades: usar config do Supabase ou defaults
  let priority = "media";
  if (config?.priorities && Array.isArray(config.priorities)) {
    for (const rule of config.priorities) {
      if (rule.keywords && Array.isArray(rule.keywords)) {
        if (rule.keywords.some((kw) => text.includes(kw))) {
          priority = rule.priority || "media";
          break;
        }
      }
    }
  } else {
    // Defaults
    const urgentKeywords = ["urgente", "urgency", "asap", "crítico", "crítica", "parado", "offline"];
    const highKeywords = ["problema", "erro", "não funciona", "quebrado", "travado"];
    const lowKeywords = ["dúvida", "informação", "pergunta", "como"];

    if (urgentKeywords.some((kw) => text.includes(kw))) priority = "alta";
    else if (highKeywords.some((kw) => text.includes(kw))) priority = "alta";
    else if (lowKeywords.some((kw) => text.includes(kw))) priority = "baixa";
  }

  // Sempre considera como request
  return {
    isRequest: true,
    category,
    priority,
    summary: email.subject || "Email recebido",
  };
}

// ── Send to Helpdesk Edge Function ────────────────────────────────────────────
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
  const helpdeskUrl = process.env.HELPDESK_EMAIL_INTAKE_URL;
  const helpdeskApiKey = process.env.HELPDESK_EMAIL_INTAKE_API_KEY;

  if (!helpdeskUrl || !helpdeskApiKey) {
    throw new Error("Helpdesk configuration missing");
  }

  const response = await fetch(helpdeskUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${helpdeskApiKey}`,
    },
    body: JSON.stringify({
      subject: data.subject,
      from: data.from,
      body: data.body,
      category: data.category,
      priority: data.priority,
      summary: data.summary,
    }),
  });

  if (!response.ok) {
    throw new Error(`Helpdesk API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json() as { ok: boolean; ticketId?: string };
  return { ok: true, ticketId: result.ticketId };
}

export const sendToHelpdeskApi = createServerFn({ method: "POST" })
  .inputValidator(SendToHelpdeskSchema)
  .handler(async ({ data }) => sendToHelpdeskInternal(data));

// ── Process Email: Read → Interpret → Send to Helpdesk ────────────────────────
export const processEmailPipeline = createServerFn({ method: "POST" })
  .inputValidator(z.object({ maxEmails: z.number().default(1), userId: z.string().optional() }))
  .handler(async ({ data }) => {
    try {
      const userId = data.userId ?? "system";
      console.log("[email-pipeline] Starting email processing for user:", userId);

      // Fetch unread emails
      const emailsResult = await fetchUnreadEmails(data.maxEmails, userId);

      if (emailsResult.authorized === false) {
        console.log("[email-pipeline] Gmail not authorized");
        return {
          ok: false,
          authorized: false,
          processed: 0,
          total: 0,
          message: emailsResult.message,
        };
      }

      if (!emailsResult.emails.length) {
        console.log("[email-pipeline] No unread emails");
        return { ok: true, authorized: true, processed: 0, total: 0, message: "No unread emails" };
      }

      let processedCount = 0;

      for (const email of emailsResult.emails) {
        try {
          console.log("[email-pipeline] Processing:", { from: email.from, subject: email.subject });

          // Check if ticket already exists for this email (deduplication)
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
          if (supabaseUrl && supabaseKey) {
            const checkResponse = await fetch(
              `${supabaseUrl}/rest/v1/tickets?select=id&external_ref=eq.gmail-${email.id}`,
              {
                headers: {
                  apikey: supabaseKey,
                  Authorization: `Bearer ${supabaseKey}`,
                },
              }
            );
            const existingData = (await checkResponse.json()) as Array<{ id: string }>;
            if (existingData && existingData.length > 0) {
              console.log("[email-pipeline] Ticket already exists for", email.id);
              await markEmailAsReadInternal(email.id, userId);
              continue;
            }
          }

          // Interpret with Claude
          const analysis = await interpretEmailWithClaude(email);
          console.log("[email-pipeline] Analysis:", analysis);

          // If it's a request, send to Helpdesk
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

              console.log("[email-pipeline] Sent to Helpdesk:", email.subject);
              processedCount++;

              // Mark as read only after successful ticket creation
              await markEmailAsReadInternal(email.id, userId);
              console.log("[email-pipeline] Marked as read:", email.id);
            } catch (err) {
              console.error("[email-pipeline] Error sending to Helpdesk:", err);
            }
          } else {
            console.log("[email-pipeline] Email is not a request, skipping");
          }
        } catch (err) {
          console.error("[email-pipeline] Error processing email:", err);
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
      if (isGmailAuthorizationError(err)) {
        return {
          ok: false,
          authorized: false,
          processed: 0,
          total: 0,
          message: "Gmail precisa ser autorizado antes de processar e-mails.",
        };
      }

      console.error("[email-pipeline] Fatal error:", err);
      throw err;
    }
  });
