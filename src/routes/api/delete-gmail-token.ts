import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/delete-gmail-token")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );

          const { error } = await supabaseAdmin
            .from("gmail_tokens")
            .delete()
            .eq("user_id", "system");

          if (error) throw error;

          return new Response(
            `<html><body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0a0e27;"><div style="text-align:center;background:#151b35;padding:40px;border-radius:12px;border:1px solid #2d3a5f;"><h1 style="color:#3BDC8A;margin:0 0 10px;">✅ Token deletado!</h1><p style="color:#8892a6;margin:0;">Token de Gmail removido. Autorize novamente com a Interative.</p></div></body></html>`,
            { status: 200, headers: { "Content-Type": "text/html" } }
          );
        } catch (err) {
          console.error("[delete-gmail-token] Error:", err);
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
