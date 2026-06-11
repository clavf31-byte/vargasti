import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";

// ── Supabase admin client ─────────────────────────────────────────────────────
function getAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
  return createClient(url, key);
}

// ── OAuth2 Client ─────────────────────────────────────────────────────────────
function getGoogleAuthClient() {
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI ?? "http://localhost:3000/api/gmail-callback";

  if (!clientId || !clientSecret) {
    throw new Error("Gmail credentials not configured");
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
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

// ── Get Gmail OAuth URL ───────────────────────────────────────────────────────
export const getGmailAuthUrl = createServerFn({ method: "GET" }).handler(async () => {
  const auth = getGoogleAuthClient();
  const url = auth.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.modify"],
    prompt: "consent",
  });
  return { url };
});

// ── Save Gmail Token ──────────────────────────────────────────────────────────
const SaveGmailTokenSchema = z.object({
  code: z.string(),
  userId: z.string(),
});

export const saveGmailToken = createServerFn({ method: "POST" })
  .inputValidator(SaveGmailTokenSchema)
  .handler(async ({ data }) => {
    const auth = getGoogleAuthClient();
    const { tokens } = await auth.getToken(data.code);

    if (!tokens.access_token) {
      throw new Error("Failed to get access token");
    }

    const admin = getAdminClient();
    const { error } = await admin.from("gmail_tokens").upsert(
      {
        user_id: data.userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) throw new Error(error.message);
    return { ok: true, authorized: true };
  });

// ── Get Gmail Client ──────────────────────────────────────────────────────────
async function getGmailClient() {
  const auth = getGoogleAuthClient();
  const admin = getAdminClient();

  // Fetch stored token
  const { data: tokenData } = await admin
    .from("gmail_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", "system")
    .maybeSingle();

  if (!tokenData?.access_token) {
    throw new Error("Gmail not authorized");
  }

  auth.setCredentials({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
  });

  return google.gmail({ version: "v1", auth });
}

// ── Fetch New Emails ──────────────────────────────────────────────────────────
export const fetchNewEmails = createServerFn({ method: "POST" })
  .inputValidator(z.object({ maxResults: z.number().default(10) }))
  .handler(async ({ data }) => {
    const gmail = await getGmailClient();

    // Fetch unread messages
    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
      maxResults: data.maxResults,
    });

    if (!listRes.data.messages?.length) {
      return { emails: [] };
    }

    const emails: GmailEmail[] = [];

    for (const msg of listRes.data.messages) {
      if (!msg.id) continue;

      const emailRes = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
        format: "full",
      });

      const headers = emailRes.data.payload?.headers ?? [];
      const getHeader = (name: string) => headers.find((h) => h.name === name)?.value ?? "";

      let body = "";
      if (emailRes.data.payload?.parts) {
        const part = emailRes.data.payload.parts.find((p) => p.mimeType === "text/plain");
        if (part?.body?.data) {
          body = Buffer.from(part.body.data, "base64").toString("utf-8");
        }
      } else if (emailRes.data.payload?.body?.data) {
        body = Buffer.from(emailRes.data.payload.body.data, "base64").toString("utf-8");
      }

      emails.push({
        id: msg.id,
        threadId: msg.threadId ?? "",
        from: getHeader("From"),
        to: getHeader("To"),
        subject: getHeader("Subject"),
        body,
        timestamp: parseInt(emailRes.data.internalDate ?? "0"),
        labels: emailRes.data.labelIds ?? [],
      });
    }

    return { emails };
  });

// ── Mark Email as Read ────────────────────────────────────────────────────────
const MarkAsReadSchema = z.object({
  messageId: z.string(),
});

export const markEmailAsRead = createServerFn({ method: "POST" })
  .inputValidator(MarkAsReadSchema)
  .handler(async ({ data }) => {
    const gmail = await getGmailClient();

    await gmail.users.messages.modify({
      userId: "me",
      id: data.messageId,
      requestBody: {
        removeLabelIds: ["UNREAD"],
      },
    });

    return { ok: true };
  });

// ── Interpret Email with Claude ───────────────────────────────────────────────
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
        content: `Analise este e-mail:
De: ${email.from}
Assunto: ${email.subject}
Conteúdo: ${email.body}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== "text") throw new Error("Unexpected response type");

  try {
    return JSON.parse(content.text);
  } catch {
    return {
      isRequest: false,
      category: "unknown",
      priority: "media",
      summary: email.subject,
    };
  }
}

// ── Create Ticket from Email ──────────────────────────────────────────────────
const CreateTicketSchema = z.object({
  emailId: z.string(),
  from: z.string(),
  subject: z.string(),
  body: z.string(),
  category: z.string(),
  priority: z.string(),
  summary: z.string(),
});

export const createTicketFromEmail = createServerFn({ method: "POST" })
  .inputValidator(CreateTicketSchema)
  .handler(async ({ data }) => {
    const admin = getAdminClient();

    // Map priority
    const priorityMap: Record<string, "alta" | "media" | "baixa"> = {
      high: "alta",
      media: "media",
      low: "baixa",
      urgente: "alta",
      normal: "media",
      baixa: "baixa",
    };

    const priority = priorityMap[data.priority.toLowerCase()] ?? "media";

    // Create ticket
    const { data: ticket, error } = await admin
      .from("tickets")
      .insert({
        title: data.subject,
        description: `**Via E-mail:** ${data.from}\n\n${data.body}`,
        status: "aberto",
        priority,
        category: data.category,
        source: "email",
        email_source: data.from,
        created_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) throw new Error(error.message);

    // Save email processing record
    await admin.from("email_processing_log").insert({
      email_id: data.emailId,
      ticket_id: ticket?.id,
      status: "processado",
      created_at: new Date().toISOString(),
    });

    return { ok: true, ticketId: ticket?.id };
  });
