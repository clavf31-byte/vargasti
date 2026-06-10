import { createAPIFileRoute } from "@tanstack/react-start/api";
import { processWebhookMessage } from "@/lib/api/whatsappAgent.functions";

export const APIRoute = createAPIFileRoute("/api/whatsapp-webhook")({
  POST: async ({ request }) => {
    try {
      const token = new URL(request.url).searchParams.get("token") ?? "";
      const body = await request.json() as Record<string, unknown>;

      // Evolution API v2 webhook payload structure
      const event = body.event as string;
      if (event !== "messages.upsert") {
        return new Response(JSON.stringify({ ok: true, skipped: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const instanceName = (body.instance as string) ?? "";
      const data = body.data as Record<string, unknown>;
      const key = data?.key as Record<string, unknown>;

      // Skip messages sent by us
      if (key?.fromMe) {
        return new Response(JSON.stringify({ ok: true, skipped: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const remoteJid = (key?.remoteJid as string) ?? "";
      const fromNumber = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
      const fromName = (data?.pushName as string) ?? fromNumber;
      const msgObj = data?.message as Record<string, unknown>;
      const message =
        (msgObj?.conversation as string) ??
        (msgObj?.extendedTextMessage as Record<string, unknown>)?.text as string ??
        "";

      if (!message || !fromNumber) {
        return new Response(JSON.stringify({ ok: true, skipped: true }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await processWebhookMessage({
        data: { token, fromNumber, fromName, message, instanceName },
      });

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      return new Response(
        JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "unknown" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
});
