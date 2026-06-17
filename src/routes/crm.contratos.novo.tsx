import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Card, Button } from "@/components/ui";
import { colors, spacing, borderRadius } from "@/lib/colors";
import { ChevronRight, ChevronLeft, ScrollText } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/novo")({
  head: () => ({ meta: [{ title: "Novo Contrato · CRM VargasTI" }] }),
  component: NovoContratoPage,
});

interface Template {
  id: string;
  nome: string;
  descricao: string;
  conteudo: string;
}

interface Cliente {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  cnpj_cpf?: string | null;
  endereco?: string | null;
}

function extractVariables(conteudo: string): string[] {
  const matches = conteudo.match(/\{\{([^}]+)\}\}/g) || [];
  const names = matches.map((m) => m.replace(/\{\{|\}\}/g, "").trim());
  return [...new Set(names)];
}

function substituteVariables(conteudo: string, valores: Record<string, string>): string {
  let result = conteudo;
  for (const [key, value] of Object.entries(valores)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }
  return result;
}

function buildAutoValues(cliente: Cliente | undefined): Record<string, string> {
  const hoje = new Date();
  return {
    cliente_nome: cliente?.nome || "",
    cliente_email: cliente?.email || "",
    cliente_telefone: cliente?.telefone || "",
    cliente_cnpj: cliente?.cnpj_cpf || "",
    cliente_cpf: cliente?.cnpj_cpf || "",
    cliente_endereco: cliente?.endereco || "",
    data: hoje.toLocaleDateString("pt-BR"),
    data_atual: hoje.toLocaleDateString("pt-BR"),
    ano: hoje.getFullYear().toString(),
    mes: hoje.toLocaleDateString("pt-BR", { month: "long" }),
  };
}

function NovoContratoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);

  const [form, setForm] = useState({ template_id: "", cliente_id: "", titulo: "" });
  const [variaveis, setVariaveis] = useState<string[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [tempRes, clientRes] = await Promise.all([
        supabase.from("contract_templates").select("id, nome, descricao, conteudo").eq("user_id", user.id).eq("ativo", true),
        supabase.from("clientes").select("id, nome, email, telefone, cnpj_cpf, endereco").eq("user_id", user.id).order("nome"),
      ]);
      setTemplates(tempRes.data || []);
      setClientes(clientRes.data || []);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!form.template_id || !form.cliente_id || !form.titulo.trim()) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    const template = templates.find((t) => t.id === form.template_id);
    const cliente = clientes.find((c) => c.id === form.cliente_id);

    if (!template) return;

    const vars = extractVariables(template.conteudo);
    const auto = buildAutoValues(cliente);

    const initialValues: Record<string, string> = {};
    for (const v of vars) {
      initialValues[v] = auto[v] || "";
    }

    setVariaveis(vars);
    setValores(initialValues);
    setStep(2);
  };

  const handleCreate = async () => {
    if (!user) return;

    setCriando(true);
    try {
      const template = templates.find((t) => t.id === form.template_id);
      if (!template) throw new Error("Template não encontrado");

      const conteudoFinal = substituteVariables(template.conteudo, valores);
      const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

      const { data: contrato, error } = await supabase
        .from("contracts")
        .insert([{
          user_id: user.id,
          cliente_id: form.cliente_id,
          template_id: form.template_id,
          titulo: form.titulo,
          conteudo_preenchido: conteudoFinal,
          status: "rascunho",
          token_assinatura: token,
        }])
        .select()
        .single();

      if (error) throw error;

      await supabase.from("contract_history").insert([{
        contract_id: contrato.id,
        acao: "criado",
        detalhes: { criado_em: new Date().toISOString() },
      }]);

      navigate({ to: `/crm/contratos/${contrato.id}` });
    } catch (e) {
      console.error("Erro:", e);
      alert("Erro ao criar contrato: " + (e instanceof Error ? e.message : "Erro desconhecido"));
    } finally {
      setCriando(false);
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
    fontSize: "13px",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontWeight: 600 as const,
  };

  if (loading) {
    return (
      <AppShell>
        <p style={{ padding: spacing.xl, color: colors.textSecondary }}>Carregando...</p>
      </AppShell>
    );
  }

  const selectedTemplate = templates.find((t) => t.id === form.template_id);

  return (
    <AppShell>
      <div style={{ padding: spacing.xl, maxWidth: "800px", margin: "0 auto" }}>
        <PageHeader title="Novo Contrato" subtitle={step === 1 ? "Passo 1 de 2 — Dados básicos" : "Passo 2 de 2 — Preencher variáveis"} icon={<ScrollText size={32} color={colors.primary} />} />

        {step === 1 && (
          <Card>
            <div style={{ display: "grid", gap: spacing.lg }}>
              <div>
                <label style={labelStyle}>Modelo de Contrato *</label>
                <select value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })} style={inputStyle}>
                  <option value="">Selecione um modelo</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
                {templates.length === 0 && (
                  <p style={{ margin: `${spacing.sm} 0 0`, fontSize: "12px", color: colors.error }}>
                    Nenhum modelo ativo. <button onClick={() => navigate({ to: "/crm/contratos/modelos" })} style={{ background: "none", border: "none", color: colors.primary, cursor: "pointer", fontSize: "12px", padding: 0 }}>Criar modelo →</button>
                  </p>
                )}
              </div>

              {selectedTemplate && (
                <div style={{ padding: spacing.md, background: colors.backgroundTertiary, borderRadius: borderRadius.md, fontSize: "13px", color: colors.textSecondary }}>
                  <strong style={{ color: colors.text }}>{selectedTemplate.nome}</strong>
                  {selectedTemplate.descricao && <p style={{ margin: `${spacing.sm} 0 0` }}>{selectedTemplate.descricao}</p>}
                  {(() => {
                    const vars = extractVariables(selectedTemplate.conteudo);
                    return vars.length > 0 ? (
                      <p style={{ margin: `${spacing.sm} 0 0` }}>
                        Variáveis: {vars.map(v => (
                          <span key={v} style={{ background: colors.primary + "22", color: colors.primary, padding: "2px 6px", borderRadius: "4px", fontSize: "11px", marginRight: "4px" }}>{`{{${v}}}`}</span>
                        ))}
                      </p>
                    ) : null;
                  })()}
                </div>
              )}

              <div>
                <label style={labelStyle}>Cliente *</label>
                <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} style={inputStyle}>
                  <option value="">Selecione um cliente</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Título do Contrato *</label>
                <input
                  type="text"
                  placeholder="ex: Contrato de Suporte TI — Empresa X"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  style={inputStyle}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.xl }}>
              <Button variant="primary" onClick={handleNext}>
                Próximo <ChevronRight size={16} />
              </Button>
              <Button variant="secondary" onClick={() => navigate({ to: "/crm/contratos" })}>
                Cancelar
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <>
            {variaveis.length === 0 ? (
              <Card>
                <p style={{ color: colors.textSecondary, marginBottom: spacing.lg }}>
                  Este modelo não possui variáveis. O contrato será criado com o conteúdo do template diretamente.
                </p>
                <div style={{ display: "flex", gap: spacing.md }}>
                  <Button variant="primary" onClick={handleCreate} disabled={criando}>
                    {criando ? "Criando..." : "Criar Contrato"}
                  </Button>
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    <ChevronLeft size={16} /> Voltar
                  </Button>
                </div>
              </Card>
            ) : (
              <Card>
                <p style={{ color: colors.textSecondary, fontSize: "13px", marginBottom: spacing.lg }}>
                  Preencha as variáveis abaixo. Campos com dados do cliente foram preenchidos automaticamente.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: spacing.lg }}>
                  {variaveis.map((v) => {
                    const isAuto = buildAutoValues(clientes.find(c => c.id === form.cliente_id))[v] !== undefined;
                    return (
                      <div key={v}>
                        <label style={labelStyle}>
                          {`{{${v}}}`}
                          {isAuto && <span style={{ marginLeft: "6px", fontSize: "11px", color: colors.primary, fontWeight: 400 }}>auto</span>}
                        </label>
                        <input
                          type="text"
                          value={valores[v] || ""}
                          onChange={(e) => setValores({ ...valores, [v]: e.target.value })}
                          placeholder={`Valor para ${v}`}
                          style={inputStyle}
                        />
                      </div>
                    );
                  })}
                </div>

                <div style={{ marginTop: spacing.xl, padding: spacing.md, background: colors.backgroundTertiary, borderRadius: borderRadius.md }}>
                  <p style={{ margin: 0, fontSize: "12px", color: colors.textSecondary }}>
                    Variáveis não preenchidas serão mantidas como <code>{`{{nome_da_variavel}}`}</code> no contrato e podem ser editadas depois.
                  </p>
                </div>

                <div style={{ display: "flex", gap: spacing.md, marginTop: spacing.xl }}>
                  <Button variant="primary" onClick={handleCreate} disabled={criando}>
                    {criando ? "Criando..." : "Criar Contrato"}
                  </Button>
                  <Button variant="secondary" onClick={() => setStep(1)}>
                    <ChevronLeft size={16} /> Voltar
                  </Button>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
