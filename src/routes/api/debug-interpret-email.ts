import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug-interpret-email")({
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

          const { interpretEmailWithClaude } = await import("@/lib/api/emailAgent.functions");

          const testEmail = {
            id: "test",
            from: "user@example.com",
            subject: "Impressora não está imprimindo",
            body: "A impressora parou de funcionar. Pode verificar?",
            threadId: "test",
            timestamp: Date.now(),
            labels: [],
          };

          const result = await interpretEmailWithClaude(testEmail);

          return new Response(JSON.stringify({ ok: true, result }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[debug-interpret-email] Error:", err);
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

      },
    },
  },
});
