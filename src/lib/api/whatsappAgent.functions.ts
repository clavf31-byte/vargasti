import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createClient } from "@supabase/supabase-js";
import type Anthropic from "@anthropic-ai/sdk";

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
  label: string;
  evolution_url: string;
  evolution_key: string;
  instance_name: string;
  claude_system_prompt: string;
  group_system_prompt: string;
  auto_reply: boolean;
  save_as_notes: boolean;
  webhook_token: string;
  reply_to_groups: boolean;
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

// ── getWhatsappConfigs ────────────────────────────────────────────────────────
export const getWhatsappConfigs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context as { supabase: ReturnType<typeof getAdminClient>; userId: string };
    const { data } = await supabase
      .from("whatsapp_config")
      .select("*")
      .eq("user_id", userId)
      .order("label");
    return (data ?? []) as (WhatsappConfig & { id: string })[];
  });

// ── getWhatsappConfig (single by ID) ───────────────────────────────────────────
const GetConfigSchema = z.object({
  configId: z.string(),
});

export const getWhatsappConfig = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(GetConfigSchema)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: ReturnType<typeof getAdminClient>; userId: string };
    const { data: cfg } = await supabase
      .from("whatsapp_config")
      .select("*")
      .eq("id", data.configId)
      .eq("user_id", userId)
      .maybeSingle();
    return cfg as (WhatsappConfig & { id: string }) | null;
  });

// ── saveWhatsappConfig ────────────────────────────────────────────────────────
const SaveConfigSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().min(1),
  evolution_url: z.string(),
  evolution_key: z.string(),
  instance_name: z.string().min(1),
  claude_system_prompt: z.string(),
  group_system_prompt: z.string(),
  auto_reply: z.boolean(),
  save_as_notes: z.boolean(),
  webhook_token: z.string(),
  reply_to_groups: z.boolean().optional().default(false),
});

export const saveWhatsappConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(SaveConfigSchema)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: ReturnType<typeof getAdminClient>; userId: string };
    const configId = data.id ?? (await import("crypto")).randomUUID?.() ?? crypto.randomUUID();

    const { error } = await supabase.from("whatsapp_config").upsert(
      {
        id: configId,
        user_id: userId,
        label: data.label,
        evolution_url: data.evolution_url,
        evolution_key: data.evolution_key,
        instance_name: data.instance_name,
        claude_system_prompt: data.claude_system_prompt,
        group_system_prompt: data.group_system_prompt,
        auto_reply: data.auto_reply,
        save_as_notes: data.save_as_notes,
        webhook_token: data.webhook_token,
        reply_to_groups: data.reply_to_groups ?? false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    );
    if (error) throw new Error(error.message);
    return { ok: true, id: configId };
  });

// ── deleteWhatsappConfig ───────────────────────────────────────────────────────
const DeleteConfigSchema = z.object({
  configId: z.string(),
});

export const deleteWhatsappConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(DeleteConfigSchema)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: ReturnType<typeof getAdminClient>; userId: string };
    const { error } = await supabase
      .from("whatsapp_config")
      .delete()
      .eq("id", data.configId)
      .eq("user_id", userId);
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

// ── deleteContactMessages ──────────────────────────────────────────────────────
const DeleteContactSchema = z.object({
  fromNumber: z.string(),
});

export const deleteContactMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(DeleteContactSchema)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context as { supabase: ReturnType<typeof getAdminClient>; userId: string };
    await supabase.from("whatsapp_messages").delete().eq("user_id", userId).eq("from_number", data.fromNumber);
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
  const trimmed = (raw ?? "").trim();
  if (!trimmed) throw new Error("URL da Evolution API não configurada");
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    throw new Error(`URL inválida: "${raw}"`);
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

    type Result = {
      ok?: boolean;
      state?: string;
      qr?: string | null;
      data?: any;
    };

    if (data.action === "check_status") {
      const res = await fetch(`${base}/instance/connectionState/${encodeURIComponent(data.instance_name)}`, { headers });
      if (!res.ok) return { state: "disconnected" } as Result;
      const json = await res.json() as { instance?: { state?: string } };
      return { state: json?.instance?.state ?? "disconnected" } as Result;
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
      const qrcodeField = json?.qrcode as Record<string, unknown> | undefined;
      const qr = (qrcodeField?.base64 as string) ?? null;
      return { ok: res.ok, data: json, qr } as Result;
    }

    if (data.action === "get_qr") {
      const res = await fetch(`${base}/instance/connect/${encodeURIComponent(data.instance_name)}`, { headers });
      if (!res.ok) return { qr: null } as Result;
      const json = await res.json() as { base64?: string; qrcode?: { base64?: string } };
      return { qr: json?.base64 ?? json?.qrcode?.base64 ?? null } as Result;
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
      const json = await res.json() as Record<string, unknown>;
      return { ok: res.ok, data: json } as Result;
    }

    return { ok: false } as Result;
  });

// ── processWebhookMessage (called from API route, no user auth) ───────────────
const WebhookSchema = z.object({
  token: z.string(),
  fromNumber: z.string(),
  fromName: z.string(),
  message: z.string(),
  instanceName: z.string(),
  imageUrl: z.string().nullable().optional(),
  configId: z.string().optional(),
  isGroup: z.boolean().optional(),
});

const DEFAULT_SYSTEM_PROMPT = `Você é o assistente virtual da VargasTI, empresa de suporte em TI e segurança eletrônica.

Seu nome é **Vargas**. Você atende pelo WhatsApp corporativo e representa a empresa com profissionalismo e simpatia.

## Como você se comporta
- Fale em português brasileiro, de forma natural e acessível — sem ser robótico
- Seja direto, mas humano. Evite respostas longas demais para WhatsApp
- Use emojis com moderação quando ajudar a deixar a mensagem mais clara
- Quando não souber algo, seja honesto e oriente o caminho certo
- Lembre do contexto da conversa — o histórico está disponível para você

## O que você faz
1. **Lê e interpreta** a solicitação do cliente
2. **Orienta** como resolver na hora, se possível (reiniciar equipamento, verificar cabo, etc.)
3. **Avalia** se o problema precisa de atendimento técnico presencial ou abertura de chamado
4. **Cria uma anotação** automaticamente quando identificar que será necessário acompanhamento (use a tool create_ticket_note)

## Quando criar uma anotação (chamado)
- Problema que não pode ser resolvido remotamente
- Equipamento com defeito confirmado
- Instalação, manutenção preventiva ou corretiva necessária
- Cliente relata recorrência do mesmo problema
- Solicitação que exige visita técnica

## Prioridades
- **alta**: sistema de segurança inoperante, câmeras offline, alarme disparando sem motivo, acesso bloqueado
- **media**: lentidão, equipamento com falha intermitente, dúvidas de configuração
- **baixa**: solicitações de informação, dúvidas gerais, manutenções agendadas

Ao criar a anotação, informe o cliente que o chamado foi registrado e que a equipe entrará em contato.`;

const AGENT_TOOLS = [
  {
    name: "create_ticket_note",
    description: "Cria uma anotação no sistema para abertura de chamado técnico. Use quando o problema não pode ser resolvido via WhatsApp e precisa de acompanhamento.",
    input_schema: {
      type: "object" as const,
      properties: {
        title: { type: "string", description: "Título curto do chamado (ex: 'Câmera offline - Cliente João')" },
        description: { type: "string", description: "Descrição completa do problema relatado, contexto e orientações já fornecidas" },
        priority: { type: "string", enum: ["alta", "media", "baixa"], description: "Prioridade do chamado" },
        contact: { type: "string", description: "Nome e número do contato" },
      },
      required: ["title", "description", "priority", "contact"],
    },
  },
  {
    name: "get_datetime",
    description: "Retorna a data e hora atual no Brasil (America/Sao_Paulo). Use quando precisar saber o horário atual para contexto da resposta.",
    input_schema: {
      type: "object" as const,
      properties: {},
      required: [],
    },
  },
] as const;

export const processWebhookMessage = createServerFn({ method: "POST" })
  .inputValidator(WebhookSchema)
  .handler(async ({ data }) => {
    const admin = getAdminClient();

    let cfg: any;
    if (data.configId) {
      const { data: c } = await admin
        .from("whatsapp_config")
        .select("*")
        .eq("id", data.configId)
        .maybeSingle();
      cfg = c;
    } else {
      const { data: cfgs } = await admin
        .from("whatsapp_config")
        .select("*")
        .eq("webhook_token", data.token);
      cfg = cfgs?.find((c: any) => c.instance_name === data.instanceName) ?? cfgs?.[0];
    }

    if (!cfg) return { ok: false, reason: "config not found" };

    // Skip groups if reply_to_groups is false
    if (data.isGroup && !cfg.reply_to_groups) {
      return { ok: true, skipped: true, reason: "group_ignored" };
    }

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

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return { ok: false, reason: "no API key" };

    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    // Load conversation history for this contact (last 10 messages)
    const { data: history } = await admin
      .from("whatsapp_messages")
      .select("direction, message")
      .eq("user_id", cfg.user_id)
      .eq("from_number", data.fromNumber)
      .order("created_at", { ascending: false })
      .limit(10);

    type MsgParam = { role: "user" | "assistant"; content: string | Anthropic.ContentBlockParam[] };
    const historyMessages: MsgParam[] = (history ?? [])
      .reverse()
      .map((m: { direction: string; message: string }) => ({
        role: m.direction === "outgoing" ? "assistant" : "user",
        content: m.message,
      }));

    // Build current message — if image present, include it
    let currentUserContent: string | Anthropic.ContentBlockParam[] = `${data.fromName}: ${data.message}`;
    if (data.imageUrl) {
      currentUserContent = [
        { type: "text", text: `${data.fromName}: ${data.message}` },
        { type: "image", source: { type: "url", url: data.imageUrl } },
      ];
    }

    const messages: MsgParam[] = [
      ...historyMessages.filter((_, i, arr) => !(i === arr.length - 1 && arr[arr.length - 1].role === "user" && typeof arr[arr.length - 1].content === "string" && arr[arr.length - 1].content === data.message)),
      { role: "user", content: currentUserContent },
    ];

    const systemPrompt = (data.isGroup ? cfg.group_system_prompt : cfg.claude_system_prompt) || DEFAULT_SYSTEM_PROMPT;
    const useVision = !!data.imageUrl;
    const model = useVision ? "claude-opus-4-8" : "claude-haiku-4-5-20251001";

    // Tool-use loop (max 3 iterations)
    let currentMessages = messages as Anthropic.MessageParam[];
    let finalReply = "";
    let noteCreated = false;

    for (let i = 0; i < 3; i++) {
      const resp = await client.messages.create({
        model,
        max_tokens: useVision ? 2048 : 1024,
        system: systemPrompt,
        tools: AGENT_TOOLS as unknown as Anthropic.Tool[],
        messages: currentMessages,
      });

      if (resp.stop_reason === "end_turn") {
        finalReply = resp.content
          .filter((b) => b.type === "text")
          .map((b) => (b as Anthropic.TextBlock).text)
          .join("");
        break;
      }

      if (resp.stop_reason === "tool_use") {
        const toolUseBlocks = resp.content.filter((b) => b.type === "tool_use") as Anthropic.ToolUseBlock[];
        const toolResults: Anthropic.ToolResultBlockParam[] = [];

        for (const tool of toolUseBlocks) {
          if (tool.name === "get_datetime") {
            const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
            toolResults.push({ type: "tool_result", tool_use_id: tool.id, content: now });
          }

          if (tool.name === "create_ticket_note") {
            const input = tool.input as { title: string; description: string; priority: string; contact: string };
            const noteContent = `**Contato:** ${input.contact}\n**Prioridade:** ${input.priority.toUpperCase()}\n\n**Descrição:**\n${input.description}\n\n---\n*Registrado via WhatsApp Agente em ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}*`;
            await admin.from("notes").insert({
              user_id: cfg.user_id,
              title: `[WA] ${input.title}`,
              content: noteContent,
              category: "Suporte",
              tags: `whatsapp,chamado,${input.priority}`,
              status: "rascunho",
              updated_at: new Date().toISOString(),
            }).then(undefined, () => null);
            noteCreated = true;
            toolResults.push({ type: "tool_result", tool_use_id: tool.id, content: "Anotação criada com sucesso." });
          }
        }

        currentMessages = [
          ...currentMessages,
          { role: "assistant", content: resp.content },
          { role: "user", content: toolResults },
        ];
        continue;
      }

      // Fallback: extract any text from last response
      finalReply = resp.content
        .filter((b) => b.type === "text")
        .map((b) => (b as Anthropic.TextBlock).text)
        .join("");
      break;
    }

    if (!finalReply) finalReply = "Entendido! Já registrei e nossa equipe entrará em contato em breve.";

    // Save outgoing message
    await admin.from("whatsapp_messages").insert({
      user_id: cfg.user_id,
      instance_name: data.instanceName,
      from_number: data.fromNumber,
      from_name: data.fromName,
      message: finalReply,
      response: null,
      direction: "outgoing",
      created_at: new Date().toISOString(),
    });

    // Send via Evolution API — validate URL to prevent SSRF
    try {
      const safeBase = assertSafeExternalUrl(cfg.evolution_url);
      const sendUrl = `${safeBase.toString().replace(/\/$/, "")}/message/sendText/${data.instanceName}`;
      await fetch(sendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: cfg.evolution_key },
        body: JSON.stringify({ number: data.fromNumber, text: finalReply }),
      }).catch(() => null);
    } catch (err) {
      console.warn("[whatsapp-webhook] Blocked unsafe evolution_url:", (err as Error).message);
    }

    return { ok: true, reply: finalReply, noteCreated };
  });
