/**
 * CONVERSATION PAUSE LOGIC
 *
 * Quando Claudio (user_id) responde em um grupo:
 * 1. Marca conversa como "paused" (Claudio cuidando)
 * 2. IA ignora mensagens daquele grupo por 2 horas
 * 3. Retoma automaticamente se:
 *    - Outra pessoa chamar
 *    - Claudio escrever palavra-chave "resolvido"
 *    - Passar 2 horas
 */

import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// ============================================================================
// SCHEMA: Conversation Pause Table (execute no Supabase SQL Editor)
// ============================================================================

/*
CREATE TABLE IF NOT EXISTS conversation_pauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  from_number TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  is_group BOOLEAN NOT NULL,
  paused_at TIMESTAMP DEFAULT now(),
  resume_at TIMESTAMP DEFAULT (now() + INTERVAL '2 hours'),
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_conversation_pauses_lookup ON conversation_pauses(user_id, from_number, instance_name);
*/

// ============================================================================
// SERVER FUNCTIONS
// ============================================================================

const PauseConversationSchema = z.object({
  userId: z.string(),
  fromNumber: z.string(),
  instanceName: z.string(),
  isGroup: z.boolean(),
});

/**
 * Marca conversa como "paused" quando Claudio intervém
 * Duração: 2 horas
 */
export const pauseConversation = createServerFn({ method: "POST" })
  .inputValidator(PauseConversationSchema)
  .handler(async ({ data }) => {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    );

    // Remove pausas antigas
    await supabase
      .from("conversation_pauses")
      .delete()
      .lte("resume_at", new Date().toISOString());

    // Cria nova pausa
    const { error } = await supabase.from("conversation_pauses").insert({
      user_id: data.userId,
      from_number: data.fromNumber,
      instance_name: data.instanceName,
      is_group: data.isGroup,
      paused_at: new Date().toISOString(),
      resume_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // +2 horas
    });

    if (error) throw new Error(error.message);
    return { ok: true, paused: true };
  });

/**
 * Verifica se conversa está pausada
 */
export const isConversationPaused = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      userId: z.string(),
      fromNumber: z.string(),
      instanceName: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    );

    const { data: pause } = await supabase
      .from("conversation_pauses")
      .select("id, resume_at")
      .eq("user_id", data.userId)
      .eq("from_number", data.fromNumber)
      .eq("instance_name", data.instanceName)
      .maybeSingle();

    if (!pause) return { isPaused: false };

    // Verifica se ainda está dentro do período de pausa
    const now = new Date();
    const resumeAt = new Date(pause.resume_at);
    const isPaused = now < resumeAt;

    return { isPaused, resumeAt: pause.resume_at };
  });

/**
 * Retoma conversa (remove pausa)
 */
export const resumeConversation = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string(),
      fromNumber: z.string(),
      instanceName: z.string(),
    })
  )
  .handler(async ({ data }) => {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    );

    const { error } = await supabase
      .from("conversation_pauses")
      .delete()
      .eq("user_id", data.userId)
      .eq("from_number", data.fromNumber)
      .eq("instance_name", data.instanceName);

    if (error) throw new Error(error.message);
    return { ok: true, resumed: true };
  });

// ============================================================================
// INTEGRAÇÃO COM WEBHOOK
// ============================================================================

/**
 * ADICIONAR NO whatsapp-webhook.ts ANTES DE processWebhookMessage:
 *
 * import { pauseConversation, resumeConversation, isConversationPaused, isTakingOver, isResolved } from "@/lib/api/whatsappAgent.functions";
 *
 * // Se Claudio escreve "Deixa comigo" ou similar - pausa a IA
 * if (isTakingOver(message)) {
 *   await pauseConversation({
 *     data: {
 *       userId: cfg.user_id,
 *       fromNumber,
 *       instanceName,
 *       isGroup,
 *     },
 *   }).catch(() => null);
 *
 *   return new Response(JSON.stringify({ ok: true, skipped: true }), ...);
 * }
 *
 * // Se Claudio escreve "Resolvido" ou similar - retoma a IA
 * if (isResolved(message)) {
 *   await resumeConversation({
 *     data: { userId: cfg.user_id, fromNumber, instanceName },
 *   }).catch(() => null);
 * }
 *
 * // Verifica se conversa está pausada (Claudio cuidando)
 * const { isPaused } = await isConversationPaused({
 *   data: {
 *     userId: cfg.user_id,
 *     fromNumber,
 *     instanceName,
 *   },
 * });
 *
 * if (isPaused) {
 *   // Se alguém chamar a IA, retoma
 *   if (isCallingAI(message)) {
 *     await resumeConversation({
 *       data: { userId: cfg.user_id, fromNumber, instanceName },
 *     }).catch(() => null);
 *   } else {
 *     // Senão, ignora (Claudio está cuidando)
 *     console.log("[webhook] Conversa pausada - Claudio está cuidando");
 *     return new Response(JSON.stringify({ ok: true, skipped: true, reason: "paused" }), ...);
 *   }
 * }
 */

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Detecta quando Claudio assume a conversa
 * Palavras-chave: "deixa comigo", "vou cuidar", "vou verificar", etc
 */
export function isTakingOver(message: string): boolean {
  const keywords = [
    "deixa comigo",
    "deixa que eu",
    "vou cuidar",
    "vou verificar",
    "vou conferir",
    "vou resolver",
    "eu cuido",
    "eu trato",
    "eu vejo",
  ];

  const msg = message.toLowerCase().trim();
  return keywords.some((kw) => msg.includes(kw));
}

/**
 * Detecta quando problema foi resolvido
 * Palavras-chave: "resolvido", "ok", "pronto", "feito", etc
 */
export function isResolved(message: string): boolean {
  const keywords = [
    "resolvido",
    "ok",
    "pronto",
    "beleza",
    "feito",
    "consegui",
    "resolveu",
    "funcionou",
    "✓",
    "✔️",
  ];

  const msg = message.toLowerCase().trim();
  return keywords.some((kw) => msg.includes(kw));
}

/**
 * Detecta se alguém está chamando a IA
 * (menção, resposta direta, etc)
 */
export function isCallingAI(message: string): boolean {
  const keywords = [
    "vargas",
    "claudio",
    "assistente",
    "@assistente",
    "bot",
    "ia",
    "dúvida",
    "ajuda",
    "?",
  ];

  const msg = message.toLowerCase().trim();
  return keywords.some((kw) => msg.includes(kw));
}

// ============================================================================
// EXEMPLO DE USO NO processWebhookMessage
// ============================================================================

/*
if (key?.fromMe) {
  // Claudio respondeu - pausa conversa
  await pauseConversation({
    data: {
      userId: cfg.user_id,
      fromNumber,
      instanceName,
      isGroup,
    },
  }).catch(() => null);

  // Se resolveu, retoma
  if (isResolved(message)) {
    await resumeConversation({
      data: { userId: cfg.user_id, fromNumber, instanceName },
    }).catch(() => null);
  }

  return new Response(JSON.stringify({ ok: true, skipped: true }), ...);
}

// Verifica pausa ANTES de responder
const { isPaused } = await isConversationPaused({
  data: { userId: cfg.user_id, fromNumber, instanceName },
});

if (isPaused) {
  // Mas retoma se alguém chamar
  if (isCallingAI(message)) {
    await resumeConversation({
      data: { userId: cfg.user_id, fromNumber, instanceName },
    }).catch(() => null);
  } else {
    // Senão, ignora
    return { ok: true, skipped: true, reason: "paused" };
  }
}
*/
