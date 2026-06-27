import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, StatCard, EmptyState, LoadingState, StatusBadge } from "@/components/shared";
import { Search, Wrench, CheckCircle2, Trash2 } from "lucide-react";
import { atualizarStatusOS } from "@/hooks/useOrdenServico";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm/os/")({
  head: () => ({ meta: [{ title: `Ordens de Serviço · CRM ${client.name}` }] }),
  component: OrdensServicoPage,
});

type OS = {
  id: string;
  numero_formatado: string;
  status: "aberta" | "em_andamento" | "concluida" | "cancelada";
  prioridade: string;
  descricao?: string;
  data_inicio: string;
  data_conclusao?: string;
  tecnico?: string;
  cliente?: { id: string; nome: string } | null;
  orcamento?: { numero_formatado: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em Andamento",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const PRIORIDADE_CLS: Record<string, string> = {
  baixa:  "text-muted-foreground",
  normal: "text-select",
  alta:   "text-destructive",
};

const STATUS_ACTIVE_CLS: Record<string, string> = {
  aberta:       "bg-info text-white border-info",
  em_andamento: "bg-warning text-white border-warning",
  concluida:    "bg-brand text-brand-foreground border-brand",
  cancelada:    "bg-destructive text-destructive-foreground border-destructive",
};

function OrdensServicoPage() {
  const { user } = useAuth();
  const [ordens, setOrdens] = useState<OS[]>([]);
  const [filtradas, setFiltradas] = useState<OS[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const loadOrdens = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ordens_servico")
      .select("*, cliente:cliente_id(id, nome), orcamento:orcamento_id(numero_formatado)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setOrdens((data as OS[]) || []);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadOrdens().finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    let r = ordens;
    if (statusFilter) r = r.filter((o) => o.status === statusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      r = r.filter((o) =>
        (o.numero_formatado ?? "").toLowerCase().includes(q) ||
        (o.cliente?.nome ?? "").toLowerCase().includes(q) ||
        (o.tecnico ?? "").toLowerCase().includes(q)
      );
    }
    setFiltradas(r);
  }, [ordens, searchTerm, statusFilter]);

  async function handleStatus(id: string, novoStatus: OS["status"]) {
    await atualizarStatusOS(id, novoStatus);
    loadOrdens();
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza?")) return;
    await supabase.from("ordens_servico").delete().eq("id", id);
    loadOrdens();
  }

  const qtdAberta    = ordens.filter((o) => o.status === "aberta").length;
  const qtdAndamento = ordens.filter((o) => o.status === "em_andamento").length;
  const qtdConcluida = ordens.filter((o) => o.status === "concluida").length;

  const statuses = ["aberta", "em_andamento", "concluida", "cancelada"] as const;

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        <PageHeader
          category="CRM"
          title="Ordens de Serviço"
          icon={Wrench}
          iconClass="text-select"
          subtitle={`${ordens.length} total · ${filtradas.length} exibindo`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Abertas" value={qtdAberta} iconClass="text-info" />
          <StatCard label="Em Andamento" value={qtdAndamento} iconClass="text-warning" />
          <StatCard label="Concluídas" value={qtdConcluida} iconClass="text-brand" />
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar por número, cliente, técnico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface/60 border border-border rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:border-select/60 focus:ring-2 focus:ring-select/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                className={cn(
                  "px-3 py-1 text-xs font-semibold rounded-full border capitalize transition-colors",
                  statusFilter === s
                    ? STATUS_ACTIVE_CLS[s]
                    : "text-muted-foreground border-border hover:border-muted-foreground/40"
                )}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <LoadingState />
        ) : filtradas.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title={ordens.length === 0 ? "Nenhuma OS criada. Converta um orçamento aprovado em OS." : "Nenhuma OS encontrada"}
          />
        ) : (
          <div className="card-graphite overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  {["Número", "Cliente", "Status", "Prioridade", "Orçamento", "Data", "Técnico", "Ações"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ${i === 7 ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map((os) => (
                  <tr key={os.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-select">{os.numero_formatado || os.id.slice(0, 8)}</td>
                    <td className="px-4 py-3 text-foreground">{os.cliente?.nome || "—"}</td>
                    <td className="px-4 py-3"><StatusBadge status={os.status} /></td>
                    <td className={cn("px-4 py-3 text-xs font-semibold capitalize", PRIORIDADE_CLS[os.prioridade])}>
                      {os.prioridade}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{os.orcamento?.numero_formatado || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(os.data_inicio).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-3 text-muted-foreground">{os.tecnico || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {os.status === "aberta" && (
                          <button onClick={() => handleStatus(os.id, "em_andamento")}
                            className="px-2 py-1 text-xs font-semibold border border-warning/30 text-warning bg-warning/10 rounded-lg hover:bg-warning/20 transition-colors">
                            Iniciar
                          </button>
                        )}
                        {os.status === "em_andamento" && (
                          <button onClick={() => handleStatus(os.id, "concluida")}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold border border-brand/30 text-brand bg-brand/10 rounded-lg hover:bg-brand/20 transition-colors">
                            <CheckCircle2 className="size-3" /> Concluir
                          </button>
                        )}
                        <button onClick={() => handleDelete(os.id)}
                          className="inline-flex items-center justify-center p-1.5 border border-destructive/30 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/15 transition-colors">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
