import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

const STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function verifyGmailState(state: string | null): string | null {
  if (!state) return null;
  const secret = process.env.GMAIL_CLIENT_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) return null;
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const lastDot = decoded.lastIndexOf(".");
    if (lastDot < 0) return null;
    const payload = decoded.slice(0, lastDot);
    const sig = decoded.slice(lastDot + 1);
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const a = Buffer.from(sig, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    const [userId, tsStr] = payload.split(".");
    const ts = Number(tsStr);
    if (!userId || !Number.isFinite(ts)) return null;
    if (Date.now() - ts > STATE_MAX_AGE_MS) return null;
    return userId;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/gmail-callback")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const error = url.searchParams.get("error");
        const state = url.searchParams.get("state");

        if (error) return new Response(`Authorization failed: ${error}`, { status: 400 });
        if (!code) return new Response("Missing authorization code", { status: 400 });

        const userId = verifyGmailState(state);
        if (!userId) {
          return new Response(
            `<html><body style="font-family:sans-serif;padding:40px;background:#0a0e27;color:#fff;"><h1 style="color:#ff6b6b;">❌ Sessão inválida</h1><p>Inicie a autorização novamente a partir do aplicativo.</p></body></html>`,
            { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        }

        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;
        const redirectUri = process.env.GMAIL_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
          return new Response("Gmail OAuth credentials not configured", { status: 500 });
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
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
          const tokens = await tokenResponse.json() as {
            access_token?: string;
            refresh_token?: string;
            expires_in?: number;
            error_description?: string;
          };

          if (!tokenResponse.ok || !tokens.access_token) {
            throw new Error(tokens.error_description ?? "Failed to get access token");
          }

          const { error: dbError } = await supabaseAdmin.from("gmail_tokens").upsert({
            user_id: userId,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token || null,
            expires_at: tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null,
            updated_at: new Date().toISOString(),
          });

          if (dbError) throw dbError;

          return new Response(
            `<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0e27;"><div style="text-align:center;background:#151b35;padding:40px;border-radius:12px;border:1px solid #2d3a5f;"><h1 style="color:#3BDC8A;margin:0 0 10px;">✅ Sucesso!</h1><p style="color:#8892a6;margin:0 0 20px;">Gmail autorizado. Pode fechar esta aba.</p></div></body></html>`,
            { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        } catch (err) {
          console.error("[gmail-callback] Error:", err);
          return new Response(
            `<html><body style="font-family:sans-serif;padding:40px;background:#0a0e27;color:#fff;"><h1 style="color:#ff6b6b;">❌ Erro</h1><p>Não foi possível concluir a autorização do Gmail. Tente novamente.</p></body></html>`,
            { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
          );
        }
      },
    },
  },
});
