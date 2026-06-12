import { createFileRoute } from "@tanstack/react-router";
import { google } from "googleapis";

export const Route = createFileRoute("/api/gmail-auth")({
  beforeLoad: async () => {
    const clientId = process.env.GMAIL_CLIENT_ID;
    const clientSecret = process.env.GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.GMAIL_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error("Gmail OAuth credentials not configured");
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.modify",
      ],
      prompt: "consent",
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: authUrl,
      },
    });
  },
});
