import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug-process-email")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !supabaseKey) {
            return new Response(
              JSON.stringify({ error: "Supabase credentials not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // Get token
          const tokenResponse = await fetch(
            `${supabaseUrl}/rest/v1/gmail_tokens?select=access_token&user_id=eq.system`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            }
          );

          const tokenData = (await tokenResponse.json()) as Array<{ access_token: string }>;
          const accessToken = tokenData[0]?.access_token;

          if (!accessToken) {
            return new Response(
              JSON.stringify({ error: "No access token found" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Fetch unread emails
          const searchParams = new URLSearchParams({
            q: "is:unread",
            maxResults: "1",
          });

          const gmailListResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?${searchParams.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const gmailList = (await gmailListResponse.json()) as {
            messages?: Array<{ id: string }>;
          };

          if (!gmailList.messages?.[0]?.id) {
            return new Response(
              JSON.stringify({ error: "No unread emails found" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          // Get email details
          const emailId = gmailList.messages[0].id;
          const emailResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${emailId}?format=full`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const emailData = await emailResponse.json();

          return new Response(
            JSON.stringify({
              ok: true,
              emailId,
              emailStatus: emailResponse.status,
              headers: emailData.payload?.headers?.slice(0, 5),
              snippet: emailData.snippet,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          console.error("[debug-process-email] Error:", err);
          return new Response(
            JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
