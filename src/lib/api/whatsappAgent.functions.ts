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

// ── Evolution API proxy (server-side to avoid CORS) ──────────────────────────

const EvolutionActionSchema = z.object({
  evolution_url: z.string(),
  evolution_key: z.string(),
  instance_name: z.string(),
  action: z.enum(["check_status", "create_instance", "get_qr", "set_webhook"]),
  webhook_url: z.string().optional(),
});

// Validate URL is https public hostname (no private/loopback/link-local IPs)
function assertSafeExternalUrl(raw: string): URL {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new Error("URL inválida");
  }
  if (u.protocol !== "https:") {
    throw new Error("Apenas URLs https:// são permitidas");
  }
  const host = u.hostname.toLowerCase();
  // Block literal IPs in private/loopback/link-local ranges and any non-public host
  const blockedHostnames = ["localhost", "metadata.google.internal", "metadata.goog"];
  if (blockedHostnames.includes(host)) throw new Error("Host não permitido");
  // IPv6 loopback / link-local
  if (host === "[::1]" || host.startsWith("[fc") || host.startsWith("[fd") || host.startsWith("[fe80")) {
    throw new Error("Host não permitido");
  }
  // IPv4 literal
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    ) {
      throw new Error("Host não permitido");
    }
  }
  return u;
}

export const evolutionAction = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(EvolutionActionSchema)
  .handler(async ({ data, context }) => {
    const { userId } = context as { userId: string | null };
    if (!userId) throw new Error("Não autenticado");

    const safeUrl = assertSafeExternalUrl(data.evolution_url);
    const base = safeUrl.toString().replace(/\/$/, "");
    const headers = { "Content-Type": "application/json", apikey: data.evolution_key };

    if (data.action === "check_status") {
      const res = await fetch(`${base}/instance/connectionState/${encodeURIComponent(data.instance_name)}`, { headers });
      if (!res.ok) return { state: "disconnected" };
      const json = await res.json() as { instance?: { state?: string } };
      return { state: json?.instance?.state ?? "disconnected" };
    }

    if (data.action === "create_instance") {
      const res = await fetch(`${base}/instance/create`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          instanceName: data.instance_name,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      });
      const json = await res.json() as Record<string, unknown>;
      // Evolution API v2 returns QR inside the create response when qrcode: true
      const qrcodeField = json?.qrcode as Record<string, unknown> | undefined;
      const qr = (qrcodeField?.base64 as string) ?? null;
      return { ok: res.ok, data: json, qr };
    }

    if (data.action === "get_qr") {
      const res = await fetch(`${base}/instance/connect/${encodeURIComponent(data.instance_name)}`, { headers });
      if (!res.ok) return { qr: null };
      const json = await res.json() as { base64?: string; qrcode?: { base64?: string } };
      return { qr: json?.base64 ?? json?.qrcode?.base64 ?? null };
    }

    if (data.action === "set_webhook" && data.webhook_url) {
      assertSafeExternalUrl(data.webhook_url);
      const res = await fetch(`${base}/webhook/set/${encodeURIComponent(data.instance_name)}`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: data.webhook_url,
            webhookByEvents: false,
            webhookBase64: false,
            events: ["MESSAGES_UPSERT"],
          },
        }),
      });
      const json = await res.json() as any;
      return { ok: res.ok, data: json };
    }

    return { ok: false };
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
      await admin
        .from("notes")
        .insert({
          user_id: cfg.user_id,
          title: noteTitle,
          content: noteContent,
          category: "Geral",
          tags: "whatsapp,agente",
          status: "rascunho",
          updated_at: new Date().toISOString(),
        })
        .then(undefined, () => null);
    }

    return { ok: true, reply };
  });
