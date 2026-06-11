const functions = require("@google-cloud/functions-framework");
const { google } = require("googleapis");
const Anthropic = require("@anthropic-ai/sdk");

// Configuration
const GMAIL_CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const GMAIL_CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const GMAIL_REDIRECT_URI = process.env.GMAIL_REDIRECT_URI || "http://localhost:3000/api/gmail-callback";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const HELPDESK_API_URL = process.env.HELPDESK_API_URL; // https://helpdesk-app.com/api/email-intake
const HELPDESK_API_KEY = process.env.HELPDESK_API_KEY; // Bearer token

// OAuth2 Client
function getGoogleAuthClient() {
  return new google.auth.OAuth2(GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REDIRECT_URI);
}

// Get Gmail Client with stored token
async function getGmailClient(accessToken) {
  const auth = getGoogleAuthClient();
  auth.setCredentials({
    access_token: accessToken,
  });
  return google.gmail({ version: "v1", auth });
}

// Fetch email details
async function fetchEmailDetails(gmail, messageId) {
  const emailRes = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const headers = emailRes.data.payload?.headers ?? [];
  const getHeader = (name) => headers.find((h) => h.name === name)?.value ?? "";

  let body = "";
  if (emailRes.data.payload?.parts) {
    const part = emailRes.data.payload.parts.find((p) => p.mimeType === "text/plain");
    if (part?.body?.data) {
      body = Buffer.from(part.body.data, "base64").toString("utf-8");
    }
  } else if (emailRes.data.payload?.body?.data) {
    body = Buffer.from(emailRes.data.payload.body.data, "base64").toString("utf-8");
  }

  return {
    id: messageId,
    from: getHeader("From"),
    to: getHeader("To"),
    subject: getHeader("Subject"),
    body,
    timestamp: parseInt(emailRes.data.internalDate ?? "0"),
  };
}

// Interpret with Claude
async function interpretWithClaude(email) {
  const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

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

// Send to Helpdesk API
async function sendToHelpdesk(email, analysis) {
  const payload = {
    subject: email.subject,
    from: email.from,
    body: email.body,
    category: analysis.category || "suporte",
    priority: analysis.priority || "media",
    summary: analysis.summary || email.subject,
  };

  const response = await fetch(HELPDESK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${HELPDESK_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Helpdesk API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

// Mark email as read
async function markAsRead(gmail, messageId) {
  await gmail.users.messages.modify({
    userId: "me",
    id: messageId,
    requestBody: {
      removeLabelIds: ["UNREAD"],
    },
  });
}

// Main Cloud Function
functions.http("gmailWebhookProcessor", async (req, res) => {
  try {
    // Validate webhook secret
    const authHeader = req.headers.authorization || "";
    if (authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
      console.error("[gmail-webhook] Invalid or missing Bearer token");
      return res.status(401).json({ error: "Unauthorized" });
    }

    console.log("[gmail-webhook] Received webhook request");

    // Parse Pub/Sub message
    const message = req.body?.message;
    if (!message?.data) {
      console.log("[gmail-webhook] No message data");
      return res.status(200).json({ ok: true });
    }

    // Decode base64 payload
    const data = Buffer.from(message.data, "base64").toString("utf-8");
    const payload = JSON.parse(data);
    console.log("[gmail-webhook] Payload:", payload);

    // TODO: Get access token from your storage
    // For now, you need to implement token retrieval from your database
    const accessToken = process.env.GMAIL_ACCESS_TOKEN;
    if (!accessToken) {
      console.error("[gmail-webhook] No Gmail access token available");
      return res.status(500).json({ error: "Missing Gmail access token" });
    }

    // Get Gmail client
    const gmail = await getGmailClient(accessToken);

    // Fetch unread emails
    const listRes = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
      maxResults: 1,
    });

    if (!listRes.data.messages?.length) {
      console.log("[gmail-webhook] No unread emails");
      return res.status(200).json({ ok: true, processed: false });
    }

    const messageId = listRes.data.messages[0].id;
    console.log("[gmail-webhook] Processing message:", messageId);

    // Fetch email details
    const email = await fetchEmailDetails(gmail, messageId);
    console.log("[gmail-webhook] Email:", { from: email.from, subject: email.subject });

    // Interpret with Claude
    const analysis = await interpretWithClaude(email);
    console.log("[gmail-webhook] Analysis:", analysis);

    // If it's a request, send to Helpdesk
    if (analysis.isRequest) {
      try {
        const ticketResult = await sendToHelpdesk(email, analysis);
        console.log("[gmail-webhook] Ticket created:", ticketResult);
      } catch (err) {
        console.error("[gmail-webhook] Error creating ticket:", err.message);
        return res.status(500).json({ error: "Failed to create ticket" });
      }
    } else {
      console.log("[gmail-webhook] Email is not a request, skipping");
    }

    // Mark as read
    await markAsRead(gmail, messageId);
    console.log("[gmail-webhook] Email marked as read");

    return res.status(200).json({
      ok: true,
      processed: analysis.isRequest,
      message: `Email ${analysis.isRequest ? "created ticket" : "processed"}`,
    });
  } catch (err) {
    console.error("[gmail-webhook] Error:", err);
    return res.status(500).json({ error: err.message });
  }
});
