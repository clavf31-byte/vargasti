import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/gmail-callback")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");

        if (error) return new Response(`Authorization failed: ${error}`, { status: 400 });
        if (!code) return new Response("Missing authorization code", { status: 400 });

        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;
        const redirectUri = process.env.GMAIL_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
          return new Response("Gmail OAuth credentials not configured", { status: 500 });
        }

        try {
          const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
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

          if (!tokenRes.ok) {
            throw new Error(`Token exchange failed: ${await tokenRes.text()}`);
          }

          const tokens = (await tokenRes.json()) as {
            access_token: string;
            refresh_token?: string;
            expires_in: number;
          };

          if (!tokens.access_token) throw new Error("Failed to get access token");

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error: dbError } = await supabaseAdmin.from("gmail_tokens").upsert(
            {
              user_id: "system",
              access_token: tokens.access_token,
              refresh_token: tokens.refresh_token || null,
              expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

          if (dbError) throw dbError;

          return new Response(
            `<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0e27;"><div style="text-align:center;background:#151b35;padding:40px;border-radius:12px;border:1px solid #2d3a5f;"><h1 style="color:#3BDC8A;margin:0 0 10px;">✅ Sucesso!</h1><p style="color:#8892a6;margin:0 0 20px;">Gmail autorizado. Pode fechar esta aba.</p></div></body></html>`,
            { status: 200, headers: { "Content-Type": "text/html" } }
          );
        } catch (err) {
          console.error("[gmail-callback] Error:", err);
          const msg = err instanceof Error ? err.message : "Unknown error";
          return new Response(
            `<html><body style="font-family:sans-serif;padding:40px;background:#0a0e27;color:#fff;"><h1 style="color:#ff6b6b;">❌ Erro</h1><p>${msg}</p></body></html>`,
            { status: 500, headers: { "Content-Type": "text/html" } }
          );
        }
      },
    },
  },
});
