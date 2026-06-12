import { createFileRoute } from "@tanstack/react-router";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/gmail-callback")({
  beforeLoad: async ({ search }: { search: Record<string, string> }) => {
    const code = search.code;
    const error = search.error;

    if (error) {
      return new Response(`Authorization failed: ${error}`, { status: 400 });
    }

    if (!code) {
      return new Response("Missing authorization code", { status: 400 });
    }

    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_REDIRECT_URI;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    if (!clientId || !clientSecret || !redirectUri) {
      return new Response("Gmail OAuth credentials not configured", { status: 500 });
    }

    if (!supabaseUrl || !supabaseKey) {
      return new Response("Supabase credentials not configured", { status: 500 });
    }

    try {
      const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );

      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.access_token) {
        throw new Error("Failed to get access token");
      }

      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: dbError } = await supabase
        .from("gmail_tokens")
        .upsert({
          user_id: "system",
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
          updated_at: new Date().toISOString(),
        });

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }

      console.log("[gmail-callback] Tokens saved successfully for user: system");

      return new Response(
        `<html>
          <head><title>Gmail Authorization</title></head>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0a0e27;">
            <div style="text-align: center; background: #151b35; padding: 40px; border-radius: 12px; border: 1px solid #2d3a5f;">
              <h1 style="color: #3BDC8A; margin: 0 0 10px 0;">✅ Sucesso!</h1>
              <p style="color: #8892a6; margin: 0 0 20px 0;">Gmail foi autorizado com sucesso.</p>
              <p style="color: #5a6f8f; font-size: 12px; margin: 0;">Os tokens foram salvos automaticamente. Você pode fechar esta aba e voltar para o app.</p>
            </div>
          </body>
        </html>`,
        {
          status: 200,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    } catch (err) {
      console.error("[gmail-callback] Error:", err);
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      return new Response(
        `<html>
          <head><title>Gmail Authorization Error</title></head>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0a0e27;">
            <div style="text-align: center; background: #151b35; padding: 40px; border-radius: 12px; border: 1px solid #2d3a5f;">
              <h1 style="color: #ff6b6b; margin: 0 0 10px 0;">❌ Erro na Autorização</h1>
              <p style="color: #8892a6; margin: 0 0 20px 0;">${errorMessage}</p>
              <p style="color: #5a6f8f; font-size: 12px; margin: 0;">Tente novamente acessando a página de E-mails.</p>
            </div>
          </body>
        </html>`,
        {
          status: 500,
          headers: {
            "Content-Type": "text/html",
          },
        }
      );
    }
  },
});
