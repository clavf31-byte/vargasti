import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface EmailIntakeRequest {
  subject: string;
  from: string;
  body: string;
  category?: string;
  priority?: "alta" | "media" | "baixa";
  summary?: string;
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Validate Bearer token
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const validApiKey = Deno.env.get("EMAIL_INTAKE_API_KEY");

    if (!validApiKey || token !== validApiKey) {
      console.error("[email-intake] Invalid or missing API key");
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = (await req.json()) as EmailIntakeRequest;

    // Validate required fields
    if (!body.subject || !body.from || !body.body) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing required fields: subject, from, body" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[email-intake] Creating ticket from email:", {
      from: body.from,
      subject: body.subject,
      category: body.category || "suporte",
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create ticket in database
    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        title: body.subject,
        description: `**Via E-mail:** ${body.from}\n\n${body.body}`,
        status: "aberto",
        priority: body.priority || "media",
        category: body.category || "suporte",
        source: "email",
        email_source: body.from,
        created_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) {
      console.error("[email-intake] Database error:", error.message);
      return new Response(
        JSON.stringify({ ok: false, error: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    console.log("[email-intake] Ticket created:", ticket?.id);

    return new Response(
      JSON.stringify({
        ok: true,
        ticketId: ticket?.id,
        message: "Ticket criado com sucesso",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[email-intake] Error:", err);

    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
