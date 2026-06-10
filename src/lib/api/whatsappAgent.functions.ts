import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";

// ── Supabase admin client (uses service role for webhook access) ──────────────
function getAdminClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? "";
  return createClient(url, key);
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type WhatsappConfig = {
  id?: string;
  user_id?: string;
  evolution_url: string;
  evolution_key: string;
  instance_name: string;
  claude_system_prompt: string;
  auto_reply: boolean;
  save_as_notes: boolean;
  webhook_token: string;
};

export type WhatsappMessage = {
  id: string;
  from_number: string;
  from_name: string;
  message: string;
  response: string | null;
  direction: "incoming" | "outgoing";
  created_at: string;
};

// ── getWhatsappConfig ─────────────────────────────────────────────────────────
export const getWhatsappConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: ReturnType<typeof getAdminClient>; userId: string };
    const { data } = await supabase
      .from("whatsapp_config")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    return data as WhatsappConfig | null;
  });

// ── saveWhatsappConfig ────────────────────────────────────────────────────────
const SaveConfigSchema = z.object({
  evolution_url: z.string(),
  evolution_key: z.string(),
  instance_name: z.string().min(1),
  claude_system_prompt: z.string(),
  auto_reply: z.boolean(),
  save_as_notes: z.boolean(),
  webhook_token: z.string(),
});

export const saveWhatsappConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(SaveConfigSchema)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: ReturnType<typeof getAdminClient>; userId: string };
    const { error } = await supabase.from("whatsapp_config").upsert(
      { ...data, user_id: userId, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── getWhatsappMessages ───────────────────────────────────────────────────────
export const getWhatsappMessages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: ReturnType<typeof getAdminClient>; userId: string };
    const { data } = await supabase
      .from("whatsapp_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []) as WhatsappMessage[];
  });

// ── clearWhatsappMessages ─────────────────────────────────────────────────────
export const clearWhatsappMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: ReturnType<typeof getAdminClient>; userId: string };
    await supabase.from("whatsapp_messages").delete().eq("user_id", userId);
    return { ok: true };
  });

// ── processWebhookMessage (called from API route, no user auth) ───────────────
const WebhookSchema = z.object({
  token: z.string(),
  fromNumber: z.string(),
  fromName: z.string(),
  message: z.string(),
  instanceName: z.string(),
});

export const processWebhookMessage = createServerFn({ method: "POST" })
  .inputValidator(WebhookSchema)
  .handler(async ({ data }) => {
    const admin = getAdminClient();

    // Find config by webhook_token
    const { data: cfg } = await admin
      .from("whatsapp_config")
      .select("*")
      .eq("webhook_token", data.token)
      .eq("instance_name", data.instanceName)
      .maybeSingle();

    if (!cfg) return { ok: false, reason: "config not found" };

    // Save incoming message
    await admin.from("whatsapp_messages").insert({
      user_id: cfg.user_id,
      instance_name: data.instanceName,
      from_number: data.fromNumber,
      from_name: data.fromName,
      message: data.message,
      response: null,
      direction: "incoming",
      created_at: new Date().toISOString(),
    });

    if (!cfg.auto_reply) return { ok: true, reply: null };

    // Build Claude response
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { ok: false, reason: "no API key" };

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const systemPrompt = cfg.claude_system_prompt ||
      `Você é um assistente pessoal do VargasTI Lab. Responda de forma clara e direta em português brasileiro. Seja conciso — estamos no WhatsApp.`;

    const resp = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: `${data.fromName}: ${data.message}` }],
    });

    const reply = resp.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");

    // Save response
    await admin.from("whatsapp_messages").insert({
      user_id: cfg.user_id,
      instance_name: data.instanceName,
      from_number: data.fromNumber,
      from_name: data.fromName,
      message: reply,
      response: null,
      direction: "outgoing",
      created_at: new Date().toISOString(),
    });

    // Send via Evolution API
    const sendUrl = `${cfg.evolution_url.replace(/\/$/, "")}/message/sendText/${data.instanceName}`;
    await fetch(sendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: cfg.evolution_key },
      body: JSON.stringify({ number: data.fromNumber, text: reply }),
    }).catch(() => null);

    // Optionally save as note
    if (cfg.save_as_notes) {
      const noteTitle = `WA: ${data.fromName} — ${new Date().toLocaleDateString("pt-BR")}`;
      const noteContent = `**De:** ${data.fromName} (${data.fromNumber})\n**Mensagem:** ${data.message}\n**Resposta:** ${reply}`;
      await admin.from("notes").insert({
        user_id: cfg.user_id,
        title: noteTitle,
        content: noteContent,
        category: "Geral",
        tags: "whatsapp,agente",
        status: "rascunho",
        updated_at: new Date().toISOString(),
      }).catch(() => null);
    }

    return { ok: true, reply };
  });
