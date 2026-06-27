import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/debug-fetch-emails")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          // Security: Verify admin access
          const authHeader = request.headers.get("authorization");
          if (!authHeader?.startsWith("Bearer ")) {
            return new Response("Unauthorized", { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const token = authHeader.replace("Bearer ", "");
          const { data, error } = await supabaseAdmin.auth.getClaims(token);
          if (error || !data?.claims?.sub) {
            return new Response("Unauthorized", { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const { data: roleData } = await supabaseAdmin
            .from("user_roles")
            .select("role")
            .eq("user_id", data.claims.sub)
            .eq("role", "admin")
            .maybeSingle();
          if (!roleData) {
            return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
          }

          const supabaseUrl = process.env.SUPABASE_URL;
          const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

          if (!supabaseUrl || !supabaseKey) {
            return new Response(
              JSON.stringify({ error: "Supabase credentials not configured" }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }

          // Get token for authenticated user
          const tokenResponse = await fetch(
            `${supabaseUrl}/rest/v1/gmail_tokens?select=access_token&user_id=eq.${data.claims.sub}`,
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
            maxResults: "5",
          });

          const gmailResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages?${searchParams.toString()}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          const gmailData = await gmailResponse.json();

          return new Response(
            JSON.stringify({
              ok: true,
              gmailStatus: gmailResponse.status,
              gmailData,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (err) {
          console.error("[debug-fetch-emails] Error:", err);
          return new Response(
            JSON.stringify({ error: "Internal server error" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
