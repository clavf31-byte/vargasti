import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug-process-pipeline")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { processEmailPipeline } = await import("@/lib/api/emailAgent.functions");

          const result = await processEmailPipeline({ data: { maxEmails: 5 } });

          return new Response(JSON.stringify({ ok: true, result }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[debug-process-pipeline] Error:", err);
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
