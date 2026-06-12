import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/gmail-auth")({
  server: {
    handlers: {
      GET: async () => {
        const clientId = process.env.GMAIL_CLIENT_ID;
        const redirectUri = process.env.GMAIL_REDIRECT_URI;

        if (!clientId || !redirectUri) {
          return new Response("Gmail OAuth credentials not configured", { status: 500 });
        }

        const params = new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          access_type: "offline",
          prompt: "consent",
          scope: [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.modify",
          ].join(" "),
        });

        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
        return new Response(null, { status: 302, headers: { Location: authUrl } });
      },
    },
  },
});
