import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug-gmail-token")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !supabaseKey) {
            return new Response(
              JSON.stringify({ error: "Supabase credentials not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const response = await fetch(
            `${supabaseUrl}/rest/v1/gmail_tokens?select=*&user_id=eq.system`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            }
          );

          const data = await response.json();

          return new Response(JSON.stringify({ ok: true, data, status: response.status }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[debug-gmail-token] Error:", err);
          return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
