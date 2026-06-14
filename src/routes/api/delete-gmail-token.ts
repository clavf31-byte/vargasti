import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/delete-gmail-token")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // Security: Verify admin access
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response("Unauthorized", { status: 403, headers: { "Content-Type": "application/json" } });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const token = authHeader.replace("Bearer ", "");
          const { data, error } = await supabaseAdmin.auth.getClaims(token);
          if (error || !data?.claims?.sub) {
            return new Response("Unauthorized", { status: 403, headers: { "Content-Type": "application/json" } });
          }

          const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(data.claims.sub);
          if (userError || !userData?.user || userData.user.app_metadata?.role !== "admin") {
            return new Response("Unauthorized", { status: 403, headers: { "Content-Type": "application/json" } });
          }

          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !supabaseKey) {
            throw new Error("Supabase credentials not configured in environment");
          }

          const response = await fetch(
            `${supabaseUrl}/rest/v1/gmail_tokens?user_id=eq.${data.claims.sub}`,
            {
              method: "DELETE",
              headers: {
                apikey: supabaseKey,
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
          return new Response(
            JSON.stringify({ ok: false, error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
