import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug-process-pipeline")({
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

          const { data: roleData } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", data.claims.sub)
            .eq("role", "admin")
            .maybeSingle();
          if (!roleData) {
            return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const { processEmailPipeline } = await import("@/lib/api/emailAgent.functions");

          const result = await processEmailPipeline({ data: { maxEmails: 5 } });

          return new Response(JSON.stringify({ ok: true, result }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[debug-process-pipeline] Error:", err);
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

      },
    },
  },
});
