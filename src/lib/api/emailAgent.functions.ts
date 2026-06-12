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
      const getHeader = (name: string) => headers.find((h: { name?: string | null; value?: string | null }) => h.name === name)?.value ?? "";

      let body = "";
      if (emailRes.data.payload?.parts) {
        const part = emailRes.data.payload.parts.find((p: { mimeType?: string | null }) => p.mimeType === "text/plain");
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

export const sendToHelpdeskApi = createServerFn({ method: "POST" })
  .inputValidator(SendToHelpdeskSchema)
  .handler(async ({ data }) => {
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
  });

// ── Process Email: Read → Interpret → Send to Helpdesk ────────────────────────
export const processEmailPipeline = createServerFn({ method: "POST" })
  .inputValidator(z.object({ maxEmails: z.number().default(1) }))
  .handler(async ({ data }) => {
    try {
      console.log("[email-pipeline] Starting email processing");

      // Fetch unread emails
      const emailsResult = await fetchNewEmails({ data: { maxResults: data.maxEmails } });

      if (!emailsResult.emails.length) {
        console.log("[email-pipeline] No unread emails");
        return { ok: true, processed: 0, message: "No unread emails" };
      }

      let processedCount = 0;

      for (const email of emailsResult.emails) {
        try {
          console.log("[email-pipeline] Processing:", { from: email.from, subject: email.subject });

          // Interpret with Claude
          const analysis = await interpretEmailWithClaude(email);
          console.log("[email-pipeline] Analysis:", analysis);

          // If it's a request, send to Helpdesk
          if (analysis.isRequest) {
            try {
              await sendToHelpdeskApi({
                data: {
                  emailId: email.id,
                  from: email.from,
                  subject: email.subject,
                  body: email.body,
                  category: analysis.category || "suporte",
                  priority: analysis.priority || "media",
                  summary: analysis.summary || email.subject,
                },
              });

              console.log("[email-pipeline] Sent to Helpdesk:", email.subject);
              processedCount++;
            } catch (err) {
              console.error("[email-pipeline] Error sending to Helpdesk:", err);
            }
          } else {
            console.log("[email-pipeline] Email is not a request, skipping");
          }

          // Mark as read
          await markEmailAsRead({ data: { messageId: email.id } });
          console.log("[email-pipeline] Marked as read:", email.id);
        } catch (err) {
          console.error("[email-pipeline] Error processing email:", err);
        }
      }

      return {
        ok: true,
        processed: processedCount,
        total: emailsResult.emails.length,
        message: `Processed ${processedCount}/${emailsResult.emails.length} emails`,
      };
    } catch (err) {
      console.error("[email-pipeline] Fatal error:", err);
      throw err;
    }
  });
