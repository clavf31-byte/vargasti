import { createServerFn } from "@tanstack/start";
import { z } from "zod";

export const getGmailAuthUrl = createServerFn({ method: "GET" }).handler(async () => {
  const googleapis = await import("googleapis");
  const { google } = googleapis;

  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const redirectUri = process.env.GMAIL_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Gmail OAuth credentials not configured");
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
    ],
    prompt: "consent",
  });

  return { authUrl };
});

export const saveGmailToken = createServerFn({ method: "POST" })
  .inputValidator(z.object({ code: z.string() }))
  .handler(async ({ data }) => {
    const googleapis = await import("googleapis");
    const { google } = googleapis;
    const { createClient } = await import("@supabase/supabase-js");

    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_REDIRECT_URI;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Gmail OAuth credentials not configured");
    }

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    const { tokens } = await oauth2Client.getToken(data.code);

    if (!tokens.access_token) {
      throw new Error("Failed to get access token");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error: dbError } = await supabase.from("gmail_tokens").upsert({
      user_id: "system",
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
      updated_at: new Date().toISOString(),
    });

    if (dbError) {
      throw dbError;
    }

    return { success: true, message: "Gmail tokens saved successfully" };
  });
