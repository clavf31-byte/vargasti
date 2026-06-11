import { createFileRoute } from "@tanstack/react-router";
import {
  fetchNewEmails,
  markEmailAsRead,
  createTicketFromEmail,
  interpretEmailWithClaude,
} from "@/lib/api/emailAgent.functions";

export const Route = createFileRoute("/api/gmail-webhook")({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = (await request.json()) as Record<string, unknown>;

          // Gmail webhook payload
          const message = body.message as Record<string, unknown>;
          if (!message?.data) {
            return new Response(JSON.stringify({ ok: true }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          // Decode base64 payload
          const data = message.data as string;
          const decoded = Buffer.from(data, "base64").toString("utf-8");
          const payload = JSON.parse(decoded) as Record<string, unknown>;

          console.log("[gmail-webhook] Received notification:", payload);

          // Fetch the email
          const emailsResult = await fetchNewEmails({ data: { maxResults: 1 } });

          if (!emailsResult.emails?.length) {
            console.log("[gmail-webhook] No new emails found");
            return new Response(JSON.stringify({ ok: true }), {
              headers: { "Content-Type": "application/json" },
            });
          }

          const email = emailsResult.emails[0];

          // Interpret with Claude
          const analysis = await interpretEmailWithClaude(email);

          console.log("[gmail-webhook] Email analysis:", {
            subject: email.subject,
            from: email.from,
            isRequest: analysis.isRequest,
            category: analysis.category,
          });

          // If it's a request, create a ticket
          if (analysis.isRequest) {
            await createTicketFromEmail({
              data: {
                emailId: email.id,
                from: email.from,
                subject: email.subject,
                body: email.body,
                category: analysis.category ?? "suporte",
                priority: analysis.priority ?? "media",
                summary: analysis.summary ?? email.subject,
              },
            });

            console.log("[gmail-webhook] Ticket created for:", email.subject);
          } else {
            console.log("[gmail-webhook] Email is not a request, skipping");
          }

          // Mark as read
          await markEmailAsRead({ data: { messageId: email.id } });

          return new Response(JSON.stringify({ ok: true, processed: analysis.isRequest }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (err) {
          console.error("[gmail-webhook] Error:", err);
          return new Response(JSON.stringify({ ok: false, error: String(err) }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
