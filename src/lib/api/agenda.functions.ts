import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type AgendaEvento = {
  id: string;
  user_id: string;
  titulo: string;
  descricao: string | null;
  tipo: "reuniao" | "visita" | "compromisso" | "prazo" | "lembrete" | "outro";
  data_inicio: string;
  data_fim: string | null;
  dia_inteiro: boolean;
  local: string | null;
  status: "agendado" | "confirmado" | "cancelado" | "concluido";
  prioridade: "alta" | "normal" | "baixa";
  cliente_id: string | null;
  chamado_id: string | null;
  os_id: string | null;
  notificar_whatsapp: boolean;
  notificar_numero: string | null;
  notificar_minutos_antes: number;
  notificado_em: string | null;
  created_at: string;
  updated_at: string;
  cliente_nome?: string | null;
  chamado_titulo?: string | null;
  chamado_numero?: string | null;
  os_numero?: string | null;
};

export type AgendaEventoCalendario = Pick<
  AgendaEvento,
  "id" | "titulo" | "tipo" | "data_inicio" | "status" | "prioridade"
>;

const eventoSchema = z.object({
  titulo: z.string().min(1),
  descricao: z.string().nullable().optional(),
  tipo: z.enum(["reuniao", "visita", "compromisso", "prazo", "lembrete", "outro"]),
  data_inicio: z.string(),
  data_fim: z.string().nullable().optional(),
  dia_inteiro: z.boolean().optional().default(false),
  local: z.string().nullable().optional(),
  status: z.enum(["agendado", "confirmado", "cancelado", "concluido"]).optional().default("agendado"),
  prioridade: z.enum(["alta", "normal", "baixa"]).optional().default("normal"),
  cliente_id: z.string().uuid().nullable().optional(),
  chamado_id: z.string().uuid().nullable().optional(),
  os_id: z.string().uuid().nullable().optional(),
  notificar_whatsapp: z.boolean().optional().default(false),
  notificar_numero: z.string().nullable().optional(),
  notificar_minutos_antes: z.number().optional().default(30),
});

export const getAgendaStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
    const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const [hoje, semana, atrasados, concluidos] = await Promise.all([
      supabaseAdmin.from("agenda_eventos").select("id", { count: "exact", head: true })
        .eq("user_id", context.userId).gte("data_inicio", todayStart).lte("data_inicio", todayEnd).neq("status", "cancelado"),
      supabaseAdmin.from("agenda_eventos").select("id", { count: "exact", head: true })
        .eq("user_id", context.userId).gt("data_inicio", now.toISOString()).lte("data_inicio", weekEnd).neq("status", "cancelado"),
      supabaseAdmin.from("agenda_eventos").select("id", { count: "exact", head: true })
        .eq("user_id", context.userId).lt("data_inicio", now.toISOString()).not("status", "in", '("cancelado","concluido")'),
      supabaseAdmin.from("agenda_eventos").select("id", { count: "exact", head: true })
        .eq("user_id", context.userId).eq("status", "concluido"),
    ]);

    return {
      hoje: hoje.count ?? 0,
      semana: semana.count ?? 0,
      atrasados: atrasados.count ?? 0,
      concluidos: concluidos.count ?? 0,
    };
  });

export const listEventosMes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ ano: z.number(), mes: z.number() }))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const inicio = new Date(data.ano, data.mes - 1, 1).toISOString();
    const fim = new Date(data.ano, data.mes, 0, 23, 59, 59).toISOString();

    const { data: eventos, error } = await supabaseAdmin
      .from("agenda_eventos")
      .select("id, titulo, tipo, data_inicio, status, prioridade")
      .eq("user_id", context.userId)
      .gte("data_inicio", inicio)
      .lte("data_inicio", fim)
      .order("data_inicio");

    if (error) throw new Error(error.message);
    return (eventos ?? []) as AgendaEventoCalendario[];
  });

export const listEventosDia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ data: z.string() }))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: eventos, error } = await supabaseAdmin
      .from("agenda_eventos")
      .select("*, clientes(nome), chamados(titulo, numero_formatado), ordens_servico(numero_formatado)")
      .eq("user_id", context.userId)
      .gte("data_inicio", `${data.data}T00:00:00`)
      .lte("data_inicio", `${data.data}T23:59:59`)
      .order("data_inicio");

    if (error) throw new Error(error.message);

    return ((eventos ?? []).map((e: any) => ({
      ...e,
      cliente_nome: e.clientes?.nome ?? null,
      chamado_titulo: e.chamados?.titulo ?? null,
      chamado_numero: e.chamados?.numero_formatado ?? null,
      os_numero: e.ordens_servico?.numero_formatado ?? null,
    }))) as AgendaEvento[];
  });

export const loadFormData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [clientes, chamados, os] = await Promise.all([
      supabaseAdmin.from("clientes").select("id, nome").eq("user_id", context.userId).order("nome").limit(100),
      supabaseAdmin.from("chamados").select("id, titulo, numero_formatado").eq("user_id", context.userId)
        .not("status", "eq", "concluido").order("created_at", { ascending: false }).limit(50),
      supabaseAdmin.from("ordens_servico").select("id, numero_formatado, descricao").eq("user_id", context.userId)
        .not("status", "eq", "concluida").order("created_at", { ascending: false }).limit(50),
    ]);

    return {
      clientes: (clientes.data ?? []) as { id: string; nome: string }[],
      chamados: (chamados.data ?? []) as { id: string; titulo: string; numero_formatado: string | null }[],
      os: (os.data ?? []) as { id: string; numero_formatado: string | null; descricao: string | null }[],
    };
  });

export const createEvento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(eventoSchema)
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error, data: created } = await supabaseAdmin
      .from("agenda_eventos")
      .insert({ ...data, user_id: context.userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return created;
  });

export const updateEvento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }).merge(eventoSchema.partial()))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...updates } = data;
    const { error } = await supabaseAdmin
      .from("agenda_eventos")
      .update(updates)
      .eq("id", id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteEvento = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("agenda_eventos")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendWhatsappLembrete = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: evento, error: eventoError } = await supabaseAdmin
      .from("agenda_eventos")
      .select("*, clientes(nome)")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .single();

    if (eventoError || !evento) throw new Error("Evento não encontrado");
    if (!evento.notificar_numero) throw new Error("Número de WhatsApp não configurado no evento");

    const { data: config } = await supabaseAdmin
      .from("whatsapp_config")
      .select("evolution_url, evolution_key, instance_name")
      .eq("user_id", context.userId)
      .limit(1)
      .single();

    if (!config) throw new Error("Configuração do WhatsApp não encontrada. Configure em Ferramentas > WhatsApp");

    const dtBrasilia = new Date(evento.data_inicio).toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      weekday: "long",
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });

    let msg = `🗓️ *Lembrete de Agenda*\n\n*${evento.titulo}*\n📅 ${dtBrasilia}`;
    if (evento.local) msg += `\n📍 ${evento.local}`;
    if ((evento as any).clientes?.nome) msg += `\n👤 ${(evento as any).clientes.nome}`;
    if (evento.descricao) msg += `\n\n${evento.descricao}`;

    const numero = String(evento.notificar_numero).replace(/\D/g, "");
    const sendUrl = `${config.evolution_url}/message/sendText/${config.instance_name}`;

    const res = await fetch(sendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.evolution_key },
      body: JSON.stringify({ number: numero, text: msg }),
    });

    if (!res.ok) throw new Error(`Falha ao enviar mensagem WhatsApp (${res.status})`);

    await supabaseAdmin
      .from("agenda_eventos")
      .update({ notificado_em: new Date().toISOString() })
      .eq("id", data.id);

    return { ok: true };
  });
