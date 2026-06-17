import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { OrcamentoFormInline } from "@/components/crm/OrcamentoFormInline";
import { PageHeader, Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { Search, Filter, Trash2, Eye } from "lucide-react";

export const Route = createFileRoute("/crm/orcamentos")({
  head: () => ({ meta: [{ title: "Orçamentos · CRM VargasTI" }] }),
  component: OrcamentosPage,
});

function OrcamentosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orcamentos, setOrcamentos] = useState<any[]>([]);
  const [filtrados, setFiltrados] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const [orcRes, clientRes] = await Promise.all([
        supabase.from("orcamentos").select("*").eq("user_id", user.id).order("data_criacao", { ascending: false }),
        supabase.from("clientes").select("id, nome").eq("user_id", user.id),
      ]);
      setOrcamentos(orcRes.data || []);
      setClientes(clientRes.data || []);
    } catch (e) {
      console.error("Erro:", e);
    }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadData();
    setLoading(false);
  }, [user]);

  useEffect(() => {
    let resultado = orcamentos;
    if (searchTerm) resultado = resultado.filter((orc) => (orc.numero_formatado || orc.numero || "").toLowerCase().includes(searchTerm.toLowerCase()));
    if (statusFilter) resultado = resultado.filter((orc) => orc.status === statusFilter);
    setFiltrados(resultado);
  }, [orcamentos, searchTerm, statusFilter]);

  const handleSuccess = () => { loadData(); setIsFormOpen(false); };
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    try { await supabase.from("orcamentos").delete().eq("id", id); loadData(); } catch (e) { alert("Erro ao deletar"); }
  };

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = { rascunho: colors.textSecondary, enviado: colors.primary, aprovado: colors.success, rejeitado: colors.error };
    return map[status] || colors.text;
  };

  const statuses = ["rascunho", "enviado", "aprovado", "rejeitado"];

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "1600px", margin: "0 auto" }}>
        <PageHeader title="Orçamentos" subtitle={`${orcamentos.length} total • ${filtrados.length} exibindo`} action={<Button variant="primary" onClick={() => setIsFormOpen(!isFormOpen)}>{isFormOpen ? "Cancelar" : "+ Novo Orçamento"}</Button>} icon="📋" />

        {isFormOpen && <><OrcamentoFormInline isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} onSuccess={handleSuccess} userId={user!.id} clientes={clientes} /><div style={{ marginBottom: spacing.xl }} /></>}

        {!isFormOpen && (<Card><div style={{ display: "flex", gap: spacing.md, alignItems: "center", flexWrap: "wrap" }}><div style={{ flex: 1, minWidth: "200px", position: "relative" }}><Search size={18} style={{ position: "absolute", left: spacing.md, top: "50%", transform: "translateY(-50%)", color: colors.textSecondary }} /><input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: "100%", padding: `${spacing.sm} ${spacing.md} ${spacing.sm} 40px`, background: colors.background, border: `1px solid ${colors.border}`, borderRadius: borderRadius.md, color: colors.text, fontSize: "14px" }} /></div><div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}><Filter size={18} color={colors.textSecondary} />{statuses.map((s) => (<button key={s} onClick={() => setStatusFilter(statusFilter === s ? null : s)} style={{ padding: `${spacing.sm} ${spacing.md}`, background: statusFilter === s ? getStatusColor(s) : colors.background, color: statusFilter === s ? colors.background : colors.text, border: `1px solid ${statusFilter === s ? getStatusColor(s) : colors.border}`, borderRadius: borderRadius.full, cursor: "pointer", fontSize: "12px", fontWeight: 600, textTransform: "capitalize", transition: "all 0.3s" }}>{s}</button>))}</div></div></Card>)}

        {loading ? <p style={{ color: colors.textSecondary }}>Carregando...</p> : filtrados.length === 0 && !isFormOpen ? <Card><p style={{ color: colors.textSecondary, margin: 0, textAlign: "center" }}>{orcamentos.length === 0 ? "Nenhum" : "Nenhum encontrado"}</p></Card> : !isFormOpen ? (<Card><div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}><thead><tr style={{ borderBottom: `2px solid ${colors.border}` }}><th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600, fontSize: "12px" }}>Número</th><th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600, fontSize: "12px" }}>Status</th><th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600, fontSize: "12px" }}>Valor</th><th style={{ padding: spacing.md, textAlign: "left", color: colors.textSecondary, fontWeight: 600, fontSize: "12px" }}>Data</th><th style={{ padding: spacing.md, textAlign: "center", color: colors.textSecondary, fontWeight: 600, fontSize: "12px" }}>Ações</th></tr></thead><tbody>{filtrados.map((orc) => (<tr key={orc.id} style={{ borderBottom: `1px solid ${colors.borderLight}`, transition: "background 0.2s" }} onMouseEnter={(e) => { e.currentTarget.style.background = colors.backgroundTertiary; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}><td style={{ padding: spacing.md, color: colors.text, fontWeight: 500 }}>{orc.numero_formatado || orc.numero}</td><td style={{ padding: spacing.md, color: getStatusColor(orc.status), fontWeight: 600 }}>{orc.status}</td><td style={{ padding: spacing.md, color: colors.success, fontWeight: 600 }}>R$ {(orc.total || 0).toFixed(2)}</td><td style={{ padding: spacing.md, color: colors.textSecondary }}>{new Date(orc.data_criacao).toLocaleDateString("pt-BR")}</td><td style={{ padding: spacing.md, textAlign: "center", display: "flex", gap: spacing.sm, justifyContent: "center" }}><button onClick={() => navigate({ to: `/crm/orcamentos/${orc.id}` })} style={{ background: colors.background, border: `1px solid ${colors.border}`, color: colors.primary, padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.sm, cursor: "pointer", fontSize: "12px", display: "flex", gap: "4px", alignItems: "center" }}><Eye size={14} />Ver</button><button onClick={() => handleDelete(orc.id)} style={{ background: colors.background, border: `1px solid ${colors.error}`, color: colors.error, padding: `${spacing.sm} ${spacing.md}`, borderRadius: borderRadius.sm, cursor: "pointer", fontSize: "12px", display: "flex", gap: "4px", alignItems: "center" }}><Trash2 size={14} />Deletar</button></td></tr>))}</tbody></table></div></Card>) : null}
      </div>
    </AppShell>
  );
}
