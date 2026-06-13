import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  fetchUnreadEmails,
  markEmailAsReadInternal,
  sendToHelpdeskInternal,
  interpretEmailWithClaude,
} from "@/lib/api/emailAgent.functions";

const GmailWebhookSchema = z.object({
  message: z.object({
    data: z.string(),
    messageId: z.string().optional(),
    publishTime: z.string().optional(),
  }).optional(),
}).optional();

export const Route = createFileRoute("/api/gmail-webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          // Shared-secret auth: require ?secret=... matching GMAIL_WEBHOOK_SECRET.
          // Configure the secret in Lovable Cloud and append it to the webhook
          // URL registered in Google Cloud Pub/Sub.
          const expectedSecret = process.env.GMAIL_WEBHOOK_SECRET;
          if (!expectedSecret) {
            console.error("[gmail-webhook] GMAIL_WEBHOOK_SECRET not configured");
            return new Response("Unauthorized", { status: 401 });
          }
          const providedSecret = new URL(request.url).searchParams.get("secret");
          if (providedSecret !== expectedSecret) {
            return new Response("Unauthorized", { status: 401 });
          }

          const body = (await request.json()) as Record<string, unknown>;

          // Validate webhook payload structure
          const parsed = GmailWebhookSchema.safeParse(body);
          if (!parsed.success) {
            return new Response(JSON.stringify({ error: "Invalid payload" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const message = parsed.data?.message as Record<string, unknown> | undefined;
          if (!message?.data) {
            return new Response(JSON.stringify({ ok: true }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          const data = message.data as string;
          const decoded = Buffer.from(data, "base64").toString("utf-8");
          const payload = JSON.parse(decoded) as Record<string, unknown>;

          console.log("[gmail-webhook] Received notification:", payload);

          const emailsResult = await fetchUnreadEmails(1);
          if (emailsResult.authorized === false || !emailsResult.emails?.length) {
            return new Response(JSON.stringify({ ok: true }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          const email = emailsResult.emails[0];
          const analysis = await interpretEmailWithClaude(email);

          if (analysis.isRequest) {
            await sendToHelpdeskInternal({
              emailId: email.id,
              from: email.from,
              subject: email.subject,
              body: email.body,
              category: analysis.category ?? "suporte",
              priority: analysis.priority ?? "media",
              summary: analysis.summary ?? email.subject,
            });
          }

          await markEmailAsReadInternal(email.id);

          return new Response(JSON.stringify({ ok: true, processed: analysis.isRequest }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[gmail-webhook] Error:", err);
          return new Response(JSON.stringify({ ok: false, error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
