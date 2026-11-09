import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/shared";
import { ChevronRight, ChevronLeft, ScrollText } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/novo")({
  head: () => ({ meta: [{ title: `Novo Contrato · CRM ${client.name}` }] }),
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
    cliente_nome:     cliente?.nome || "",
    cliente_email:    cliente?.email || "",
    cliente_telefone: cliente?.telefone || "",
    cliente_cnpj:     cliente?.cnpj_cpf || "",
    cliente_cpf:      cliente?.cnpj_cpf || "",
    cliente_endereco: cliente?.endereco || "",
    data:             hoje.toLocaleDateString("pt-BR"),
    data_atual:       hoje.toLocaleDateString("pt-BR"),
    ano:              hoje.getFullYear().toString(),
    mes:              hoje.toLocaleDateString("pt-BR", { month: "long" }),
  };
}

function NovoContratoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2>(1);
  const [modo, setModo] = useState<"modelo" | "texto">("modelo");

  const [form, setForm] = useState({ template_id: "", cliente_id: "", titulo: "" });
  const [textoBruto, setTextoBruto] = useState("");
  const [variaveis, setVariaveis] = useState<string[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [criando, setCriando] = useState(false);

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [tempRes, clientRes] = await Promise.all([
        (supabase as any).from("contract_templates").select("id, nome, descricao, conteudo").eq("ativo", true),
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
    if (modo === "modelo") {
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
      for (const v of vars) initialValues[v] = auto[v] || "";

      setVariaveis(vars);
      setValores(initialValues);
    } else {
      if (!form.cliente_id || !form.titulo.trim() || !textoBruto.trim()) {
        alert("Preencha cliente, título e cole o texto");
        return;
      }
      const vars = extractVariables(textoBruto);
      if (vars.length === 0) {
        alert("Nenhuma variável encontrada. Use {{nome}} para marcar variáveis");
        return;
      }
      const cliente = clientes.find((c) => c.id === form.cliente_id);
      const auto = buildAutoValues(cliente);
      const initialValues: Record<string, string> = {};
      for (const v of vars) initialValues[v] = auto[v] || "";

      setVariaveis(vars);
      setValores(initialValues);
    }
    setStep(2);
  };

  const handleCreate = async () => {
    if (!user) return;

    const variaveisVazias = variaveis.filter(v => !valores[v] || valores[v].trim() === "");
    if (variaveisVazias.length > 0) {
      alert(`Preencha todas as variáveis:\n${variaveisVazias.map(v => `• {{${v}}}`).join("\n")}`);
      return;
    }

    setCriando(true);
    try {
      let conteudoFinal = "";
      let template_id = null;

      if (modo === "modelo") {
        const template = templates.find((t) => t.id === form.template_id);
        if (!template) throw new Error("Template não encontrado");
        conteudoFinal = substituteVariables(template.conteudo, valores);
        template_id = template.id;
      } else {
        conteudoFinal = substituteVariables(textoBruto, valores);
      }

      const { data: contrato, error } = await (supabase as any)
        .from("contracts")
        .insert([{ user_id: user.id, cliente_id: form.cliente_id, template_id, titulo: form.titulo, conteudo: conteudoFinal, status: "rascunho" }])
        .select().single();

      if (error) throw error;
      await (supabase as any).from("contract_history").insert([{ contract_id: contrato.id, acao: "criado", detalhes: { criado_em: new Date().toISOString() } }]);
      navigate({ to: `/crm/contratos/${contrato.id}` });
    } catch (e) {
      alert("Erro ao criar contrato: " + (e instanceof Error ? e.message : "Erro desconhecido"));
    } finally {
      setCriando(false);
    }
  };

  if (loading) {
    return <AppShell><div className="p-6 text-sm text-muted-foreground">Carregando...</div></AppShell>;
  }

  const selectedTemplate = templates.find((t) => t.id === form.template_id);

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
        <PageHeader
          category="CRM"
          title="Novo Contrato"
          icon={ScrollText}
          subtitle={step === 1 ? "Passo 1 de 2 — Dados básicos" : "Passo 2 de 2 — Preencher variáveis"}
        />

        {step === 1 && (
          <div className="card-graphite p-6 space-y-6">
            {/* Escolher Modo */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-3">Como deseja criar o contrato?</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2" style={{ borderColor: modo === "modelo" ? "var(--color-select)" : "var(--color-border)" }}>
                  <input type="radio" checked={modo === "modelo"} onChange={() => setModo("modelo")} />
                  <span className="text-sm font-medium">📋 Usar Modelo Existente</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer p-3 rounded-lg border-2" style={{ borderColor: modo === "texto" ? "var(--color-select)" : "var(--color-border)" }}>
                  <input type="radio" checked={modo === "texto"} onChange={() => setModo("texto")} />
                  <span className="text-sm font-medium">📝 Colar Texto Bruto</span>
                </label>
              </div>
            </div>

            {/* Cliente e Título (sempre aparecem) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cliente *</label>
                <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} className="input-base w-full">
                  <option value="">Selecione um cliente</option>
                  {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Título do Contrato *</label>
                <input type="text" placeholder="ex: Contrato de Suporte" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="input-base w-full" />
              </div>
            </div>

            {/* Modo Modelo */}
            {modo === "modelo" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Modelo de Contrato *</label>
                  <select value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })} className="input-base w-full">
                    <option value="">Selecione um modelo</option>
                    {templates.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
                  </select>
                  {templates.length === 0 && (
                    <p className="mt-1 text-xs text-destructive">
                      Nenhum modelo ativo.{" "}
                      <button onClick={() => navigate({ to: "/crm/contratos/modelos" })} className="text-select underline cursor-pointer">
                        Criar modelo →
                      </button>
                    </p>
                  )}
                </div>
                {selectedTemplate && (
                  <div className="rounded-lg p-3 bg-surface-2 text-xs text-muted-foreground">
                    <strong className="text-foreground">{selectedTemplate.nome}</strong>
                    {selectedTemplate.descricao && <p className="mt-1">{selectedTemplate.descricao}</p>}
                  </div>
                )}
              </>
            )}

            {/* Modo Texto */}
            {modo === "texto" && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cole o Texto do Contrato *</label>
                <p className="text-[11px] text-muted-foreground mb-1.5">Marque as variáveis com: {`{{nome}}`}, {`{{data}}`}, {`{{valor}}`}, etc.</p>
                <textarea value={textoBruto} onChange={(e) => setTextoBruto(e.target.value)} rows={10} placeholder="Cole o texto aqui..." className="input-base w-full font-mono text-xs resize-y" />
                {textoBruto && extractVariables(textoBruto).length > 0 && (
                  <div className="mt-3 p-3 bg-surface-2 rounded-lg">
                    <p className="text-[11px] font-semibold text-muted-foreground mb-2">Variáveis detectadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {extractVariables(textoBruto).map((v) => (
                        <code key={v} className="bg-surface px-2 py-1 rounded text-[10px] text-select font-mono border border-select/20">
                          {`{{${v}}}`}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button onClick={handleNext} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:bg-brand/90 transition-colors">
                Próximo <ChevronRight className="size-4" />
              </button>
              <button onClick={() => navigate({ to: "/crm/contratos" })} className="px-4 py-2.5 border border-border text-sm text-foreground rounded-lg hover:bg-surface-2 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            {variaveis.length === 0 ? (
              <div className="card-graphite p-6 space-y-4">
                <p className="text-sm text-muted-foreground">Nenhuma variável encontrada.</p>
                <div className="flex gap-2">
                  <button onClick={handleCreate} disabled={criando} className="px-4 py-2.5 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors">
                    {criando ? "Criando..." : "Criar Contrato"}
                  </button>
                  <button onClick={() => setStep(1)} className="inline-flex items-center gap-1 px-4 py-2.5 border border-border text-sm text-foreground rounded-lg hover:bg-surface-2 transition-colors">
                    <ChevronLeft className="size-4" /> Voltar
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {/* Esquerda: Form */}
                <div className="card-graphite p-6 space-y-4">
                  <p className="text-xs text-muted-foreground">Preencha as variáveis. Auto-preenchidas estão marcadas.</p>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {variaveis.map((v) => {
                      const isAuto = buildAutoValues(clientes.find(c => c.id === form.cliente_id))[v] !== undefined;
                      return (
                        <div key={v}>
                          <label className="block text-xs font-semibold text-muted-foreground mb-1 font-mono">
                            {`{{${v}}}`} {isAuto && <span className="font-sans font-normal text-select ml-1 text-[10px]">auto</span>}
                          </label>
                          <input type="text" value={valores[v] || ""} onChange={(e) => setValores({ ...valores, [v]: e.target.value })} placeholder={`Valor para ${v}`} className="input-base w-full text-sm" />
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-lg p-2.5 bg-yellow/10 border border-yellow/30 text-[11px] text-yellow">
                    ⚠️ Todas as variáveis são obrigatórias. Preencha antes de criar.
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={handleCreate} disabled={criando} className="flex-1 px-4 py-2.5 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors">
                      {criando ? "Criando..." : "Criar Contrato"}
                    </button>
                    <button onClick={() => setStep(1)} className="inline-flex items-center gap-1 px-4 py-2.5 border border-border text-sm text-foreground rounded-lg hover:bg-surface-2 transition-colors">
                      <ChevronLeft className="size-4" />
                    </button>
                  </div>
                </div>

                {/* Direita: Preview */}
                <div className="card-graphite p-6 space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Preview do Contrato</p>
                  <div className="bg-surface rounded-lg p-4 text-xs text-foreground font-mono overflow-y-auto max-h-[600px] whitespace-pre-wrap leading-relaxed">
                    {modo === "modelo"
                      ? substituteVariables(templates.find(t => t.id === form.template_id)?.conteudo || "", valores)
                      : substituteVariables(textoBruto, valores)
                    }
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
