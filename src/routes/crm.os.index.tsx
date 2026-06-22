import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, StatCard } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Search, Wrench, CheckCircle2, Clock, Loader2, XCircle, Trash2, Eye } from "lucide-react";
import { atualizarStatusOS } from "@/hooks/useOrdenServico";

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

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactElement }> = {
  aberta:       { label: "Aberta",       color: "#3b82f6", bg: "rgba(59,130,246,0.1)",  icon: <Clock size={13} /> },
  em_andamento: { label: "Em Andamento", color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  icon: <Loader2 size={13} /> },
  concluida:    { label: "Concluída",    color: "#22c55e", bg: "rgba(34,197,94,0.1)",   icon: <CheckCircle2 size={13} /> },
  cancelada:    { label: "Cancelada",    color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: <XCircle size={13} /> },
};

const PRIORIDADE_CFG: Record<string, { label: string; color: string }> = {
  baixa:  { label: "Baixa",  color: colors.textSecondary },
  normal: { label: "Normal", color: colors.primary },
  alta:   { label: "Alta",   color: "#ef4444" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.aberta;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "4px",
      padding: "3px 8px", borderRadius: "20px", fontSize: "11px", fontWeight: 700,
      color: cfg.color, background: cfg.bg,
    }}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

function OrdensServicoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
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

  const qtdAberta      = ordens.filter((o) => o.status === "aberta").length;
  const qtdAndamento   = ordens.filter((o) => o.status === "em_andamento").length;
  const qtdConcluida   = ordens.filter((o) => o.status === "concluida").length;

  const statuses = ["aberta", "em_andamento", "concluida", "cancelada"] as const;

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "1600px", margin: "0 auto" }}>
        <PageHeader
          title="Ordens de Serviço"
          subtitle={`${ordens.length} total • ${filtradas.length} exibindo`}
          icon={<Wrench size={32} color={colors.primary} />}
        />

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: spacing.lg, marginBottom: spacing.xxl }}>
          <StatCard label="Abertas" value={qtdAberta} color="#3b82f6" />
          <StatCard label="Em Andamento" value={qtdAndamento} color="#f59e0b" />
          <StatCard label="Concluídas" value={qtdConcluida} color={colors.success} />
        </div>

        {/* Filtros */}
        <Card>
          <div style={{ display: "flex", gap: spacing.md, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: spacing.md, top: "50%", transform: "translateY(-50%)", color: colors.textSecondary }} />
              <input
                type="text"
                placeholder="Buscar por número, cliente, técnico..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: "100%", padding: `${spacing.sm} ${spacing.md} ${spacing.sm} 40px`, background: colors.background, border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, color: colors.text, fontSize: "14px" }}
              />
            </div>
            <div style={{ display: "flex", gap: spacing.sm }}>
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(statusFilter === s ? null : s)}
                  style={{
                    padding: `${spacing.sm} ${spacing.md}`,
                    background: statusFilter === s ? (STATUS_CFG[s]?.color ?? colors.primary) : colors.background,
                    color: statusFilter === s ? "#fff" : colors.text,
                    border: `1px solid ${statusFilter === s ? (STATUS_CFG[s]?.color ?? colors.primary) : colors.border}`,
                    borderRadius: borderRadius.full, cursor: "pointer", fontSize: "12px", fontWeight: 600, transition: "all 0.2s",
                  }}
                >
                  {STATUS_CFG[s].label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Tabela */}
        {loading ? (
          <p style={{ color: colors.textSecondary }}>Carregando...</p>
        ) : filtradas.length === 0 ? (
          <Card>
            <p style={{ color: colors.textSecondary, margin: 0, textAlign: "center" }}>
              {ordens.length === 0
                ? "Nenhuma OS criada. Converta um orçamento aprovado em OS."
                : "Nenhuma OS encontrada"}
            </p>
          </Card>
        ) : (
          <Card>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    {["Número", "Cliente", "Status", "Prioridade", "Orçamento", "Data", "Técnico", "Ações"].map((h, i) => (
                      <th key={h} style={{ padding: spacing.md, textAlign: i === 7 ? "center" : "left", color: colors.textSecondary, fontWeight: 600, fontSize: "12px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((os) => (
                    <tr
                      key={os.id}
                      style={{ borderBottom: `1px solid ${colors.borderLight}`, transition: "background 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = colors.backgroundTertiary; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: spacing.md, color: colors.primary, fontWeight: 700 }}>
                        {os.numero_formatado || os.id.slice(0, 8)}
                      </td>
                      <td style={{ padding: spacing.md, color: colors.text }}>
                        {os.cliente?.nome || "—"}
                      </td>
                      <td style={{ padding: spacing.md }}>
                        <StatusBadge status={os.status} />
                      </td>
                      <td style={{ padding: spacing.md }}>
                        <span style={{ color: PRIORIDADE_CFG[os.prioridade]?.color ?? colors.text, fontWeight: 600, fontSize: "12px" }}>
                          {PRIORIDADE_CFG[os.prioridade]?.label ?? os.prioridade}
                        </span>
                      </td>
                      <td style={{ padding: spacing.md, color: colors.textSecondary, fontSize: "12px" }}>
                        {os.orcamento?.numero_formatado || "—"}
                      </td>
                      <td style={{ padding: spacing.md, color: colors.textSecondary }}>
                        {new Date(os.data_inicio).toLocaleDateString("pt-BR")}
                      </td>
                      <td style={{ padding: spacing.md, color: colors.textSecondary }}>
                        {os.tecnico || "—"}
                      </td>
                      <td style={{ padding: spacing.md }}>
                        <div style={{ display: "flex", gap: spacing.sm, justifyContent: "center", flexWrap: "wrap" }}>
                          {os.status === "aberta" && (
                            <button
                              onClick={() => handleStatus(os.id, "em_andamento")}
                              style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.4)", color: "#f59e0b", padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.sm, cursor: "pointer", fontSize: "12px", fontWeight: 600 }}
                            >
                              Iniciar
                            </button>
                          )}
                          {os.status === "em_andamento" && (
                            <button
                              onClick={() => handleStatus(os.id, "concluida")}
                              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.4)", color: "#22c55e", padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.sm, cursor: "pointer", fontSize: "12px", fontWeight: 600, display: "flex", gap: "4px", alignItems: "center" }}
                            >
                              <CheckCircle2 size={13} /> Concluir
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(os.id)}
                            style={{ background: colors.background, border: `1px solid ${colors.error}`, color: colors.error, padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.sm, cursor: "pointer", fontSize: "12px", display: "flex", gap: "4px", alignItems: "center" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
