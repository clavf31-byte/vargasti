import { createAPIFileRoute } from "@tanstack/react-start/api";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  );
}

export const APIRoute = createAPIFileRoute("/api/cron/agenda-resumo")({
  GET: async ({ request }) => {
    if (request.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const admin = getAdmin();
    const hoje = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });

    const { data: configs } = await admin
      .from("whatsapp_config")
      .select("user_id, evolution_url, evolution_key, instance_name, notificar_numero")
      .not("evolution_url", "is", null);

    if (!configs?.length) return Response.json({ ok: true, enviados: 0 });

    let enviados = 0;

    const numeroDestino = (process.env.CRON_WHATSAPP_NUMERO ?? "").replace(/\D/g, "");

    for (const cfg of configs) {
      if (!numeroDestino) continue;

      const { data: eventos } = await admin
        .from("agenda_eventos")
        .select("titulo, data_inicio, dia_inteiro")
        .eq("user_id", cfg.user_id)
        .gte("data_inicio", `${hoje}T00:00:00`)
        .lte("data_inicio", `${hoje}T23:59:59`)
        .not("status", "in", '("cancelado","concluido")')
        .order("data_inicio");

      if (!eventos?.length) continue;

      const linhas = eventos.map((e: any) => {
        const hora = e.dia_inteiro
          ? "dia inteiro"
          : new Date(e.data_inicio).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit" });
        return `• ${e.titulo} — ${hora}`;
      });

      const dataFormatada = new Date(`${hoje}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
      const msg = `📅 *Agenda de hoje — ${dataFormatada}*\n\n${linhas.join("\n")}`;

      await fetch(`${cfg.evolution_url}/message/sendText/${cfg.instance_name}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: cfg.evolution_key },
        body: JSON.stringify({ number: numeroDestino, text: msg }),
      });

      enviados++;
    }

    return Response.json({ ok: true, enviados });
  },
});
