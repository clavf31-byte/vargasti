import client from "@/config/client";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, StatCard } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Search, Trash2, Banknote, CheckCircle2, Clock, X } from "lucide-react";

export const Route = createFileRoute("/crm/pagamentos")({
  head: () => ({ meta: [{ title: `Pagamentos · CRM ${client.name}` }] }),
  component: PagamentosPage,
});

type Pagamento = {
  id: string;
  orcamento_id: string;
  valor: number;
  data_pagamento: string;
  metodo?: string | null;
  referencia?: string | null;
  status: "pendente" | "pago" | "cancelado";
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; icon: React.ReactElement }> = {
  pendente:  { label: "Pendente",  color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  icon: <Clock size={13} /> },
  pago:      { label: "Pago",      color: "#22c55e", bg: "rgba(34,197,94,0.1)",   icon: <CheckCircle2 size={13} /> },
  cancelado: { label: "Cancelado", color: "#ef4444", bg: "rgba(239,68,68,0.1)",   icon: <Clock size={13} /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? STATUS_CFG.pendente;
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

function ModalPagamento({ pag, onClose, onConfirm }: {
  pag: Pagamento;
  onClose: () => void;
  onConfirm: (valorPago: number) => Promise<void>;
}) {
  const [valorPago, setValorPago] = useState(pag.valor.toFixed(2));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const parsed = parseFloat(valorPago) || 0;
  const saldo = Math.max(0, pag.valor - parsed);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: colors.backgroundSecondary, border: `1px solid ${colors.border}`, borderRadius: borderRadius.lg, padding: spacing.xl, width: "100%", maxWidth: "400px", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg }}>
          <h3 style={{ margin: 0, color: colors.text, fontSize: "16px", fontWeight: 700 }}>Registrar Pagamento</h3>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", color: colors.textSecondary, cursor: "pointer" }}><X size={18} /></button>
        </div>

        <div style={{ marginBottom: spacing.lg, padding: spacing.md, background: colors.background, borderRadius: borderRadius.md }}>
          <div style={{ fontSize: "12px", color: colors.textSecondary }}>Referência</div>
          <div style={{ fontSize: "14px", color: colors.text, fontWeight: 600 }}>{pag.referencia || "—"}</div>
          <div style={{ fontSize: "12px", color: colors.textSecondary, marginTop: spacing.xs }}>Valor total</div>
          <div style={{ fontSize: "20px", color: colors.primary, fontWeight: 700 }}>R$ {pag.valor.toFixed(2)}</div>
        </div>

        <div style={{ marginBottom: spacing.md }}>
          <label style={{ display: "block", fontSize: "13px", color: colors.textSecondary, marginBottom: spacing.sm, fontWeight: 600 }}>Valor pago</label>
          <input
            ref={inputRef}
            type="number"
            step="0.01"
            min="0.01"
            max={pag.valor}
            value={valorPago}
            onChange={(e) => setValorPago(e.target.value)}
            style={{ width: "100%", padding: spacing.md, background: colors.background, border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, color: colors.text, fontSize: "16px", fontWeight: 700, boxSizing: "border-box" as const }}
          />
        </div>

        {saldo > 0.009 && (
          <div style={{ marginBottom: spacing.lg, padding: spacing.md, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: borderRadius.md }}>
            <div style={{ fontSize: "12px", color: "#f59e0b", fontWeight: 600 }}>Saldo restante a quitar</div>
            <div style={{ fontSize: "18px", color: "#f59e0b", fontWeight: 700 }}>R$ {saldo.toFixed(2)}</div>
            <div style={{ fontSize: "11px", color: colors.textSecondary, marginTop: 4 }}>Um novo registro pendente será criado pelo saldo.</div>
          </div>
        )}

        <div style={{ display: "flex", gap: spacing.md }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: spacing.md, background: colors.background, border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, color: colors.text, cursor: "pointer", fontSize: "14px" }}>
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving || parsed <= 0}
            onClick={async () => { setSaving(true); await onConfirm(parsed); }}
            style={{ flex: 1, padding: spacing.md, background: colors.primary, border: "none", borderRadius: borderRadius.md, color: "#000", cursor: "pointer", fontSize: "14px", fontWeight: 700, opacity: saving || parsed <= 0 ? 0.6 : 1 }}
          >
            {saving ? "Salvando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PagamentosPage() {
  const { user } = useAuth();
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [filtrados, setFiltrados] = useState<Pagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [modalPag, setModalPag] = useState<Pagamento | null>(null);

  const loadPagamentos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("pagamentos")
      .select("*")
      .eq("user_id", user.id)
      .order("data_pagamento", { ascending: false });
    setPagamentos((data as Pagamento[]) || []);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadPagamentos().finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    let r = pagamentos;
    if (statusFilter) r = r.filter((p) => p.status === statusFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      r = r.filter((p) =>
        (p.referencia ?? "").toLowerCase().includes(q) ||
        (p.metodo ?? "").toLowerCase().includes(q)
      );
    }
    setFiltrados(r);
  }, [pagamentos, searchTerm, statusFilter]);

  async function confirmarPagamento(pag: Pagamento, valorPago: number) {
    const hoje = new Date().toISOString().split("T")[0];
    const saldo = Math.round((pag.valor - valorPago) * 100) / 100;

    // Atualiza pagamento atual com valor pago efetivo
    await supabase
      .from("pagamentos")
      .update({ status: "pago", valor: valorPago, data_pagamento: hoje })
      .eq("id", pag.id);

    // Cria registro pendente pelo saldo, se houver
    if (saldo > 0.009) {
      await (supabase as any).from("pagamentos").insert({
        orcamento_id: pag.orcamento_id,
        user_id: user!.id,
        valor: saldo,
        status: "pendente",
        data_pagamento: hoje,
        referencia: pag.referencia ? `${pag.referencia} (saldo)` : null,
      });
    }

    // Criar OS automaticamente se ainda não existir
    const { data: existingOS } = await (supabase as any)
      .from("ordens_servico")
      .select("id")
      .eq("orcamento_id", pag.orcamento_id)
      .maybeSingle();

    if (!existingOS) {
      const { data: orc } = await supabase
        .from("orcamentos")
        .select("cliente_id, notas, numero_formatado")
        .eq("id", pag.orcamento_id)
        .single();

      if (orc) {
        const year = new Date().getFullYear();
        const { count } = await (supabase as any)
          .from("ordens_servico")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user!.id);
        const seq = String((count ?? 0) + 1).padStart(6, "0");

        await (supabase as any).from("ordens_servico").insert({
          user_id: user!.id,
          cliente_id: (orc as any).cliente_id,
          orcamento_id: pag.orcamento_id,
          numero_formatado: `OS-${year}-${seq}`,
          descricao: (orc as any).notas ?? (orc as any).numero_formatado,
          status: "aberta",
          prioridade: "normal",
          data_inicio: hoje,
        });
      }
    }

    setModalPag(null);
    loadPagamentos();
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este pagamento?")) return;
    await supabase.from("pagamentos").delete().eq("id", id);
    loadPagamentos();
  };

  const totalPago     = pagamentos.filter((p) => p.status === "pago").reduce((s, p) => s + (p.valor || 0), 0);
  const totalPendente = pagamentos.filter((p) => p.status === "pendente").reduce((s, p) => s + (p.valor || 0), 0);
  const qtdPendente   = pagamentos.filter((p) => p.status === "pendente").length;

  const statuses = ["pendente", "pago", "cancelado"];

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "1600px", margin: "0 auto" }}>
        <PageHeader
          title="Pagamentos"
          subtitle={`${pagamentos.length} total • ${filtrados.length} exibindo`}
          icon={<Banknote size={32} color={colors.primary} />}
        />

        {/* KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: spacing.lg, marginBottom: spacing.xxl }}>
          <StatCard label="Total Recebido" value={`R$ ${totalPago.toFixed(2)}`} color={colors.success} />
          <StatCard label="A Receber (pendente)" value={`R$ ${totalPendente.toFixed(2)}`} color="#f59e0b" />
          <StatCard label="Pagamentos Pendentes" value={qtdPendente} color="#f59e0b" />
        </div>

        {/* Filtros + Busca */}
        <Card>
          <div style={{ display: "flex", gap: spacing.md, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "200px", position: "relative" }}>
              <Search size={18} style={{ position: "absolute", left: spacing.md, top: "50%", transform: "translateY(-50%)", color: colors.textSecondary }} />
              <input
                type="text"
                placeholder="Buscar por referência ou método..."
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
                    borderRadius: borderRadius.full,
                    cursor: "pointer", fontSize: "12px", fontWeight: 600,
                    textTransform: "capitalize" as const, transition: "all 0.2s",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Tabela */}
        {loading ? (
          <p style={{ color: colors.textSecondary }}>Carregando...</p>
        ) : filtrados.length === 0 ? (
          <Card>
            <p style={{ color: colors.textSecondary, margin: 0, textAlign: "center" }}>
              {pagamentos.length === 0 ? "Nenhum pagamento registrado" : "Nenhum pagamento encontrado"}
            </p>
          </Card>
        ) : (
          <Card>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    {["Referência", "Valor", "Status", "Data", "Método", "Ações"].map((h, i) => (
                      <th key={h} style={{ padding: spacing.md, textAlign: i === 5 ? "center" : "left", color: colors.textSecondary, fontWeight: 600, fontSize: "12px" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((pag) => (
                    <tr
                      key={pag.id}
                      style={{ borderBottom: `1px solid ${colors.borderLight}`, transition: "background 0.2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = colors.backgroundTertiary; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <td style={{ padding: spacing.md, color: colors.primary, fontWeight: 600 }}>
                        {pag.referencia || pag.orcamento_id.slice(0, 8) + "..."}
                      </td>
                      <td style={{ padding: spacing.md, color: pag.status === "pago" ? colors.success : "#f59e0b", fontWeight: 600 }}>
                        R$ {pag.valor.toFixed(2)}
                      </td>
                      <td style={{ padding: spacing.md }}>
                        <StatusBadge status={pag.status ?? "pendente"} />
                      </td>
                      <td style={{ padding: spacing.md, color: colors.textSecondary }}>
                        {new Date(pag.data_pagamento).toLocaleDateString("pt-BR")}
                      </td>
                      <td style={{ padding: spacing.md, color: colors.textSecondary }}>
                        {pag.metodo || "—"}
                      </td>
                      <td style={{ padding: spacing.md, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: spacing.sm, justifyContent: "center" }}>
                          {(pag.status === "pendente") && (
                            <button
                              onClick={() => setModalPag(pag)}
                              style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.4)", color: "#22c55e", padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.sm, cursor: "pointer", fontSize: "12px", display: "flex", gap: "4px", alignItems: "center", fontWeight: 600 }}
                            >
                              <CheckCircle2 size={13} /> Marcar pago
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(pag.id)}
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
      {modalPag && (
        <ModalPagamento
          pag={modalPag}
          onClose={() => setModalPag(null)}
          onConfirm={(valor) => confirmarPagamento(modalPag, valor)}
        />
      )}
    </AppShell>
  );
}
