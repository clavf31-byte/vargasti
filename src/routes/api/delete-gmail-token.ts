import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/delete-gmail-token")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase credentials not configured in environment");
          }

          const response = await fetch(
            `${supabaseUrl}/rest/v1/gmail_tokens?user_id=eq.system`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${supabaseKey}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!response.ok) {
            const error = await response.text();
            throw new Error(`Supabase error: ${error}`);
          }

          return new Response(
            JSON.stringify({ ok: true, message: "Token deletado com sucesso" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          console.error("[delete-gmail-token] Error:", err);
          const msg = err instanceof Error ? err.message : "Unknown error";
          return new Response(
            JSON.stringify({ ok: false, error: msg }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
