import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";

export const Route = createFileRoute("/crm/contratos/novo")({
  head: () => ({ meta: [{ title: "Novo Contrato · CRM VargasTI" }] }),
  component: NovoContratoPage,
});

interface Template {
  id: string;
  nome: string;
  descricao: string;
}

interface Cliente {
  id: string;
  nome: string;
}

function NovoContratoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    template_id: "",
    cliente_id: "",
    titulo: "",
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [tempRes, clientRes] = await Promise.all([
        supabase
          .from("contract_templates")
          .select("id, nome, descricao")
          .eq("user_id", user.id)
          .eq("ativo", true),
        supabase
          .from("clientes")
          .select("id, nome")
          .eq("user_id", user.id)
          .order("nome"),
      ]);

      setTemplates(tempRes.data || []);
      setClientes(clientRes.data || []);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !form.template_id || !form.cliente_id || !form.titulo.trim()) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    try {
      // Buscar template
      const { data: template, error: templateError } = await supabase
        .from("contract_templates")
        .select("conteudo")
        .eq("id", form.template_id)
        .single();

      if (templateError) throw templateError;

      // Gerar token de assinatura
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

      // Criar contrato
      const { data: contrato, error: contratoError } = await supabase
        .from("contracts")
        .insert([
          {
            user_id: user.id,
            cliente_id: form.cliente_id,
            template_id: form.template_id,
            titulo: form.titulo,
            conteudo_preenchido: template?.conteudo || "",
            status: "rascunho",
            token_assinatura: token,
          },
        ])
        .select()
        .single();

      if (contratoError) throw contratoError;

      // Registrar na auditoria
      await supabase.from("contract_history").insert([
        {
          contract_id: contrato.id,
          acao: "criado",
          detalhes: { criado_em: new Date().toISOString() },
        },
      ]);

      navigate({ to: `/crm/contratos/${contrato.id}` });
    } catch (e) {
      console.error("Erro:", e);
      alert("Erro ao criar contrato");
    }
  };

  const inputStyle = {
    width: "100%",
    padding: spacing.md,
    background: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: borderRadius.md,
    color: colors.text,
    fontSize: "14px",
    boxSizing: "border-box" as const,
  };

  const labelStyle = {
    display: "block" as const,
    fontSize: "14px",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: 600 as const,
  };

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "800px", margin: "0 auto" }}>
        <PageHeader title="Novo Contrato" subtitle="Confeccione um novo contrato" icon="📜" />

        {loading ? (
          <p style={{ color: colors.textSecondary }}>Carregando...</p>
        ) : (
          <Card>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: spacing.lg }}>
              <div>
                <label style={labelStyle}>Modelo de Contrato *</label>
                <select
                  value={form.template_id}
                  onChange={(e) => setForm({ ...form, template_id: e.target.value })}
                  style={inputStyle}
                  required
                >
                  <option value="">Selecione um modelo</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Cliente *</label>
                <select
                  value={form.cliente_id}
                  onChange={(e) => setForm({ ...form, cliente_id: e.target.value })}
                  style={inputStyle}
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Título do Contrato *</label>
                <input
                  type="text"
                  placeholder="ex: Contrato de Suporte TI - Athena Urbanismo"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.xl }}>
              <Button variant="primary" onClick={handleCreate}>
                Criar Contrato
              </Button>
              <Button variant="secondary" onClick={() => navigate({ to: "/crm/contratos" })}>
                Cancelar
              </Button>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
