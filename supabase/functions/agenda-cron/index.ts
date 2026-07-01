import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

serve(async (req: Request) => {
  if (req.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

  const { data: eventos } = await admin
    .from("agenda_eventos")
    .select("titulo, data_inicio, dia_inteiro")
    .gte("data_inicio", `${hoje}T00:00:00`)
    .lte("data_inicio", `${hoje}T23:59:59`)
    .not("status", "in", '("cancelado","concluido")')
    .order("data_inicio");

  if (!eventos?.length) {
    return Response.json({ ok: true, msg: "Sem eventos hoje." });
  }

  const { data: cfgs } = await admin
    .from("whatsapp_config")
    .select("evolution_url, evolution_key, instance_name")
    .limit(1);

  const cfg = cfgs?.[0];
  if (!cfg) return Response.json({ ok: false, msg: "Sem whatsapp_config." });

  const numero = Deno.env.get("CRON_WHATSAPP_NUMERO") ?? "";
  const dataFmt = new Date(`${hoje}T12:00:00`).toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo", weekday: "long", day: "2-digit", month: "long",
  });
  const linhas = eventos.map((e: any) => {
    const hora = e.dia_inteiro
      ? "dia inteiro"
      : new Date(e.data_inicio).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
    return `• ${e.titulo} — ${hora}`;
  });
  const msg = `📅 *Agenda de hoje — ${dataFmt}*\n\n${linhas.join("\n")}`;

  const res = await fetch(`${cfg.evolution_url}/message/sendText/${cfg.instance_name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: cfg.evolution_key },
    body: JSON.stringify({ number: numero.replace(/\D/g, ""), text: msg }),
  });

  const body = await res.text();
  return Response.json({ ok: res.ok, status: res.status, body });
});
