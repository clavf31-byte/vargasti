import { createFileRoute } from "@tanstack/react-router";
import { getGmailAuthUrl } from "@/lib/api/gmailAuth.functions";

export const Route = createFileRoute("/api/gmail-auth")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { authUrl } = await getGmailAuthUrl();
          return new Response(null, {
            status: 302,
            headers: { Location: authUrl },
          });
        } catch (err) {
          return new Response(
            JSON.stringify({ error: String(err) }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
