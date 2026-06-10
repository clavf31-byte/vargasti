import { createFileRoute } from "@tanstack/react-router";
import { processWebhookMessage } from "@/lib/api/whatsappAgent.functions";

export const Route = createFileRoute("/api/whatsapp-webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const token = new URL(request.url).searchParams.get("token") ?? "";
          const body = (await request.json()) as Record<string, unknown>;

          const event = body.event as string;
          if (event !== "messages.upsert") {
            return new Response(JSON.stringify({ ok: true, skipped: true }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          const instanceName = (body.instance as string) ?? "";
          const data = body.data as Record<string, unknown>;
          const key = data?.key as Record<string, unknown>;

          if (key?.fromMe) {
            return new Response(JSON.stringify({ ok: true, skipped: true }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // Debug: log full payload structure for archived detection
          const payloadStr = JSON.stringify({ data, key }).toLowerCase();
          const hasArchiveKeyword = payloadStr.includes("archive");
          if (hasArchiveKeyword) {
            console.log("[whatsapp-webhook] Archive keyword detected. Full payload:", JSON.stringify({ data, key }, null, 2));
          }

          // Skip archived chats — check multiple possible locations for archived flag
          const isArchived =
            (data?.chat as Record<string, unknown> | undefined)?.archived === true ||
            (data?.isArchived === true) ||
            (key?.archived === true) ||
            (data?.isArchived === "true") ||
            (JSON.stringify(data).includes('"archived":true'));

          if (isArchived) {
            console.log("[whatsapp-webhook] Skipped archived chat:", { fromNumber, fromName });
            return new Response(JSON.stringify({ ok: true, skipped: true, reason: "archived" }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          const remoteJid = (key?.remoteJid as string) ?? "";
          const fromNumber = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
          const fromName = (data?.pushName as string) ?? fromNumber;
          const msgObj = data?.message as Record<string, unknown>;

          const message =
            (msgObj?.conversation as string) ??
            ((msgObj?.extendedTextMessage as Record<string, unknown>)?.text as string) ??
            "";

          // Extract image URL if present
          const imageMessage = msgObj?.imageMessage as Record<string, unknown> | undefined;
          const imageUrl = (imageMessage?.url as string) ?? null;
          const imageCaption = (imageMessage?.caption as string) ?? null;

          if (!fromNumber) {
            return new Response(JSON.stringify({ ok: true, skipped: true }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // If image present, use image caption or a placeholder; if text present, use text; if neither, skip
          const finalMessage = message || imageCaption || (imageUrl ? "[Imagem enviada]" : "");
          if (!finalMessage) {
            return new Response(JSON.stringify({ ok: true, skipped: true }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          const result = await processWebhookMessage({
            data: { token, fromNumber, fromName, message: finalMessage, instanceName, imageUrl },
          });

          return new Response(JSON.stringify(result), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[whatsapp-webhook] processing error:", err);
          return new Response(
            JSON.stringify({ ok: false, error: "Webhook processing failed" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
