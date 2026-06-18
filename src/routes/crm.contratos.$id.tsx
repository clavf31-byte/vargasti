import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { ChevronLeft, ScrollText, FileEdit, CheckCircle2, Mail, Trash2, Send } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/$id")({
  head: () => ({ meta: [{ title: "Contrato · CRM VargasTI" }] }),
  component: ContratoDetalhePage,
});

interface Contrato {
  id: string;
  titulo: string;
  conteudo: string;
  status: string;
  cliente_id: string;
  clientes?: { nome: string };
  email_enviado_em?: string;
  assinado_em?: string;
  created_at: string;
  updated_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string; icon: typeof ScrollText }> = {
  rascunho: { label: "Rascunho", color: colors.textSecondary, icon: FileEdit },
  enviado: { label: "Enviado", color: colors.primary, icon: Mail },
  assinado: { label: "Assinado", color: colors.success, icon: CheckCircle2 },
};

function ContratoDetalhePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = Route.useParams();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    load();
  }, [user, id]);

  async function load() {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("*, clientes(nome)")
        .eq("id", id)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      setContrato(data);
    } catch {
      setContrato(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(novoStatus: string) {
    if (!contrato) return;
    setUpdating(true);
    const extra: Record<string, string> = {};
    if (novoStatus === "enviado") extra.email_enviado_em = new Date().toISOString();
    if (novoStatus === "assinado") extra.assinado_em = new Date().toISOString();
    try {
      await (supabase as any)
        .from("contracts")
        .update({ status: novoStatus, ...extra })
        .eq("id", id);
      setContrato({ ...contrato, status: novoStatus, ...extra });
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Deletar este contrato permanentemente?")) return;
    await (supabase as any).from("contracts").delete().eq("id", id);
    navigate({ to: "/crm/contratos" });
  }

  if (loading) {
    return (
      <AppShell>
        <div style={{ padding: spacing.xl }}>
          <p style={{ color: colors.textSecondary }}>Carregando...</p>
        </div>
      </AppShell>
    );
  }

  if (!contrato) {
    return (
      <AppShell>
        <div style={{ padding: spacing.xl }}>
          <p style={{ color: colors.error }}>Contrato não encontrado.</p>
          <Button variant="secondary" onClick={() => navigate({ to: "/crm/contratos" })}>
            Voltar
          </Button>
        </div>
      </AppShell>
    );
  }

  const statusInfo = STATUS_LABELS[contrato.status] || STATUS_LABELS.rascunho;
  const StatusIcon = statusInfo.icon;

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "900px", margin: "0 auto" }}>
        <button
          onClick={() => navigate({ to: "/crm/contratos" })}
          style={{
            display: "flex", alignItems: "center", gap: spacing.sm,
            background: "transparent", border: "none", color: colors.primary,
            cursor: "pointer", marginBottom: spacing.lg, fontSize: "14px", fontWeight: 600,
          }}
        >
          <ChevronLeft size={18} /> Voltar
        </button>

        <PageHeader
          title={contrato.titulo}
          subtitle={(contrato.clientes as any)?.nome || "Sem cliente"}
          icon={<ScrollText size={32} color={colors.primary} />}
          action={
            <div style={{ display: "flex", gap: spacing.sm, alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: statusInfo.color }}>
                <StatusIcon size={14} /> {statusInfo.label}
              </span>
              {contrato.status === "rascunho" && (
                <Button variant="primary" onClick={() => handleStatusChange("enviado")} disabled={updating}>
                  <Send size={14} /> Marcar como Enviado
                </Button>
              )}
              {contrato.status === "enviado" && (
                <Button variant="primary" onClick={() => handleStatusChange("assinado")} disabled={updating}>
                  <CheckCircle2 size={14} /> Marcar como Assinado
                </Button>
              )}
              <button
                onClick={handleDelete}
                style={{
                  background: "transparent", border: `1px solid ${colors.error}`,
                  color: colors.error, padding: `${spacing.sm} ${spacing.md}`,
                  borderRadius: borderRadius.md, cursor: "pointer", fontSize: "13px",
                  display: "flex", alignItems: "center", gap: "4px",
                }}
              >
                <Trash2 size={14} /> Deletar
              </button>
            </div>
          }
        />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: spacing.md, marginBottom: spacing.lg }}>
          {[
            { label: "Criado em", value: new Date(contrato.created_at).toLocaleDateString("pt-BR") },
            { label: "Email enviado em", value: contrato.email_enviado_em ? new Date(contrato.email_enviado_em).toLocaleDateString("pt-BR") : "—" },
            { label: "Assinado em", value: contrato.assinado_em ? new Date(contrato.assinado_em).toLocaleDateString("pt-BR") : "—" },
          ].map(({ label, value }) => (
            <Card key={label} style={{ padding: spacing.md }}>
              <div style={{ fontSize: "11px", color: colors.textSecondary, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: colors.text }}>{value}</div>
            </Card>
          ))}
        </div>

        <Card>
          <div style={{ fontSize: "12px", color: colors.textSecondary, marginBottom: spacing.md, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Conteúdo do Contrato
          </div>
          <pre style={{
            whiteSpace: "pre-wrap", wordBreak: "break-word", fontFamily: "inherit",
            fontSize: "14px", lineHeight: "1.7", color: colors.text, margin: 0,
          }}>
            {contrato.conteudo}
          </pre>
        </Card>
      </div>
    </AppShell>
  );
}
