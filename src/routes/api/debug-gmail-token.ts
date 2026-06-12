import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug-gmail-token")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          // Security: Verify admin access
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response("Unauthorized", { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const token = authHeader.replace("Bearer ", "");
          const { data, error } = await supabaseAdmin.auth.getClaims(token);
          if (error || !data?.claims?.sub) {
            return new Response("Unauthorized", { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(data.claims.sub);
          if (userError || !userData?.user || userData.user.app_metadata?.role !== "admin") {
            return new Response("Unauthorized", { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !supabaseKey) {
            return new Response(
              JSON.stringify({ error: "Supabase credentials not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          const response = await fetch(
            `${supabaseUrl}/rest/v1/gmail_tokens?select=*&user_id=eq.${data.claims.sub}`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            }
          );

          const tokenData = await response.json();

          return new Response(JSON.stringify({ ok: true, data: tokenData, status: response.status }), {
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
