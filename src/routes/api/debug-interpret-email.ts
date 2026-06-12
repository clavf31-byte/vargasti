import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug-interpret-email")({
  server: {
    handlers: {
      GET: async () => {
        try {
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
            JSON.stringify({
              error: err instanceof Error ? err.message : "Unknown error",
              stack: err instanceof Error ? err.stack : undefined,
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
