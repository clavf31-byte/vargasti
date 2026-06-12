import { createFileRoute } from "@tanstack/react-router";
import {
  processWebhookMessage,
  isTakingOver,
  isResolved,
  isConversationPaused,
  resumeConversation,
  pauseConversation,
  isCallingAI,
} from "@/lib/api/whatsappAgent.server";

// Store last message date per contact to detect first message of day
const lastMessageDateMap = new Map<string, string>();

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
          if (payloadStr.includes("archive")) {
            console.log("[whatsapp-webhook] Archive keyword detected. Full payload:", JSON.stringify({ data, key }, null, 2));
          }

          const remoteJid = (key?.remoteJid as string) ?? "";
          const isGroup = remoteJid.includes("@g.us");
          const fromNumber = remoteJid.replace("@s.whatsapp.net", "").replace("@g.us", "");
          const fromName = (data?.pushName as string) ?? fromNumber;

          // Skip archived chats
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

          const msgObj = data?.message as Record<string, unknown>;

          const message =
            (msgObj?.conversation as string) ??
            ((msgObj?.extendedTextMessage as Record<string, unknown>)?.text as string) ??
            "";

          const imageMessage = msgObj?.imageMessage as Record<string, unknown> | undefined;
          const imageUrl = (imageMessage?.url as string) ?? null;
          const imageCaption = (imageMessage?.caption as string) ?? null;

          if (!fromNumber) {
            return new Response(JSON.stringify({ ok: true, skipped: true }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          const finalMessage = message || imageCaption || (imageUrl ? "[Imagem enviada]" : "");
          if (!finalMessage) {
            return new Response(JSON.stringify({ ok: true, skipped: true }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // Use webhook token as the partition key for pause records (self-consistent).
          const pauseKey = { userId: token, fromNumber, instanceName };

          // CONVERSATION PAUSE LOGIC ----------------------------------------------

          // "Deixa comigo" → pause IA
          if (isTakingOver(finalMessage)) {
            await pauseConversation({
              data: { ...pauseKey, isGroup },
            }).catch(() => null);

            console.log("[webhook] Claudio assumiu conversa:", { fromNumber, instanceName });
            return new Response(JSON.stringify({ ok: true, skipped: true, reason: "claudio_taking_over" }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // "Resolvido" → resume IA
          if (isResolved(finalMessage)) {
            await resumeConversation({ data: pauseKey }).catch(() => null);
            console.log("[webhook] Resolvido — retomando IA:", { fromNumber, instanceName });
          }

          // Conversation paused?
          const { isPaused } = await isConversationPaused({ data: pauseKey });

          if (isPaused) {
            if (isCallingAI(finalMessage)) {
              await resumeConversation({ data: pauseKey }).catch(() => null);
              console.log("[webhook] IA chamada durante pausa — retomando:", { fromNumber, instanceName });
            } else {
              console.log("[webhook] Conversa pausada — Claudio cuidando:", { fromNumber, instanceName });
              return new Response(JSON.stringify({ ok: true, skipped: true, reason: "paused" }), {
                headers: { "Content-Type": "application/json" },
              });
            }
          }

          // -----------------------------------------------------------------------

          // First message of day?
          const today = new Date().toDateString();
          const contactKey = `${fromNumber}-${instanceName}`;
          const lastDate = lastMessageDateMap.get(contactKey);
          const isFirstMessageOfDay = lastDate !== today;
          lastMessageDateMap.set(contactKey, today);

          const result = await processWebhookMessage({
            data: { token, fromNumber, fromName, message: finalMessage, instanceName, imageUrl, isGroup, isFirstMessageOfDay },
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
