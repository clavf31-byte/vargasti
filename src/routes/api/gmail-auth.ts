import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/gmail-auth")({
  server: {
    handlers: {
      GET: async () => {
        const { google } = await import("googleapis");
        const clientId = process.env.GMAIL_CLIENT_ID;
        const clientSecret = process.env.GMAIL_CLIENT_SECRET;
        const redirectUri = process.env.GMAIL_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
          return new Response("Gmail OAuth credentials not configured", { status: 500 });
        }

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
        const authUrl = oauth2Client.generateAuthUrl({
          access_type: "offline",
          scope: [
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.modify",
          ],
          prompt: "consent",
        });

        return new Response(null, { status: 302, headers: { Location: authUrl } });
      },
    },
  },
});
