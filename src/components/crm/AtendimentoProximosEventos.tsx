import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, MapPin } from "lucide-react";

interface Evento {
  id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  data_inicio: string;
  data_fim: string | null;
  local: string | null;
  status: string;
  prioridade: string;
}

const TIPO_CFG: Record<string, { label: string; dot: string }> = {
  reuniao: { label: "Reunião", dot: "bg-blue-500" },
  visita: { label: "Visita", dot: "bg-green-500" },
  compromisso: { label: "Compromisso", dot: "bg-cyan-500" },
  prazo: { label: "Prazo", dot: "bg-yellow-500" },
  lembrete: { label: "Lembrete", dot: "bg-purple-500" },
  outro: { label: "Outro", dot: "bg-gray-500" },
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  agendado: { label: "Agendado", cls: "text-cyan-400 bg-cyan-400/10" },
  confirmado: { label: "Confirmado", cls: "text-green-400 bg-green-400/10" },
  cancelado: { label: "Cancelado", cls: "text-red-400 bg-red-400/10" },
  concluido: { label: "Concluído", cls: "text-green-600 bg-green-600/10" },
};

export function AtendimentoProximosEventos({ atendimentoId, dataAgendamento }: { atendimentoId: string; dataAgendamento?: string | null }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventos();
  }, [atendimentoId]);

  async function loadEventos() {
    setLoading(true);
    try {
      const { data } = await (supabase as any)
        .from("agenda_eventos")
        .select("*")
        .eq("atendimento_id", atendimentoId)
        .neq("status", "cancelado")
        .order("data_inicio", { ascending: true });
      setEventos(data || []);
    } finally {
      setLoading(false);
    }
  }

  function fmtDate(iso: string, withTime = true) {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  }

  if (loading) {
    return (
      <div className="card-graphite p-4">
        <p className="text-xs text-muted-foreground">Carregando eventos...</p>
      </div>
    );
  }

  return (
    <div className="card-graphite p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="size-4 text-muted-foreground" />
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Próximos Eventos</h3>
      </div>

      {dataAgendamento && (
        <div className="px-3 py-2 rounded-lg bg-brand/10 border border-brand/25 flex items-start gap-2">
          <Clock className="size-3.5 mt-0.5 text-brand shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-brand">Atendimento Agendado</p>
            <p className="text-xs text-brand/70">{fmtDate(dataAgendamento)}</p>
          </div>
        </div>
      )}

      {eventos.length === 0 ? (
        <p className="text-xs text-muted-foreground/50 text-center py-2">Nenhum evento vinculado</p>
      ) : (
        <div className="space-y-2">
          {eventos.map((evt) => {
            const tipoCfg = TIPO_CFG[evt.tipo] || TIPO_CFG.outro;
            const statusCfg = STATUS_CFG[evt.status] || STATUS_CFG.agendado;
            return (
              <div key={evt.id} className="px-3 py-2 rounded-lg bg-surface-2 border border-border/50 space-y-1">
                <div className="flex items-start gap-2">
                  <span className={`size-2 rounded-full ${tipoCfg.dot} shrink-0 mt-1`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{evt.titulo}</p>
                    <p className={`text-[10px] font-bold ${statusCfg.cls} px-1.5 py-0.5 rounded w-fit mt-1`}>
                      {statusCfg.label}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-muted-foreground/70 ml-3">
                  <span className="flex items-center gap-1">
                    <Clock className="size-2.5" />
                    {fmtDate(evt.data_inicio)}
                  </span>
                  {evt.local && (
                    <span className="flex items-center gap-1">
                      <MapPin className="size-2.5" />
                      {evt.local}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
