import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState, LoadingState, StatusBadge, Btn, InlineFormPanel } from "@/components/shared";
import { Plus, Eye, Send, FileUp, Trash2, ScrollText, FileEdit, CheckCircle2, Mail, X, ChevronRight, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/")({
  head: () => ({ meta: [{ title: `Contratos · CRM ${client.name}` }] }),
  component: ContratosPage,
});

interface Contrato {
  id: string;
  titulo: string;
  cliente_id: string;
  clientes?: { nome: string };
  status: string;
  email_enviado_em?: string;
  assinado_em?: string;
  created_at: string;
}

interface Template { id: string; nome: string; descricao: string; conteudo: string }
interface ClienteBasic { id: string; nome: string; email?: string | null; telefone?: string | null; cnpj_cpf?: string | null; endereco?: string | null }

function extractVars(conteudo: string) {
  return [...new Set((conteudo.match(/\{\{([^}]+)\}\}/g) || []).map((m) => m.replace(/\{\{|\}\}/g, "").trim()))];
}
function substituteVars(conteudo: string, vals: Record<string, string>) {
  return Object.entries(vals).reduce((s, [k, v]) => s.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v), conteudo);
}
function buildAutoVals(c?: ClienteBasic): Record<string, string> {
  const hoje = new Date();
  return { cliente_nome: c?.nome || "", cliente_email: c?.email || "", cliente_telefone: c?.telefone || "", cliente_cnpj: c?.cnpj_cpf || "", cliente_cpf: c?.cnpj_cpf || "", cliente_endereco: c?.endereco || "", data: hoje.toLocaleDateString("pt-BR"), data_atual: hoje.toLocaleDateString("pt-BR"), ano: String(hoje.getFullYear()), mes: hoje.toLocaleDateString("pt-BR", { month: "long" }) };
}

function NovoContratoForm({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: (id: string) => void }) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [clientes, setClientes] = useState<ClienteBasic[]>([]);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({ template_id: "", cliente_id: "", titulo: "" });
  const [variaveis, setVariaveis] = useState<string[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    Promise.all([
      (supabase as any).from("contract_templates").select("id, nome, descricao, conteudo").eq("user_id", userId).eq("ativo", true),
      supabase.from("clientes").select("id, nome, email, telefone, cnpj_cpf, endereco").eq("user_id", userId).order("nome"),
    ]).then(([tRes, cRes]) => { setTemplates(tRes.data || []); setClientes(cRes.data || []); });
  }, [userId]);

  const selectedTemplate = templates.find((t) => t.id === form.template_id);
  const selectedCliente = clientes.find((c) => c.id === form.cliente_id);

  const handleNext = () => {
    if (!form.template_id || !form.cliente_id || !form.titulo.trim()) { alert("Preencha todos os campos obrigatórios"); return; }
    const vars = extractVars(selectedTemplate!.conteudo);
    const auto = buildAutoVals(selectedCliente);
    setVariaveis(vars);
    setValores(Object.fromEntries(vars.map((v) => [v, auto[v] || ""])));
    setStep(2);
  };

  const handleCreate = async () => {
    setCriando(true);
    try {
      const conteudoFinal = substituteVars(selectedTemplate!.conteudo, valores);
      const { data, error } = await (supabase as any).from("contracts").insert([{ user_id: userId, cliente_id: form.cliente_id, template_id: form.template_id, titulo: form.titulo, conteudo: conteudoFinal, status: "rascunho" }]).select().single();
      if (error) throw error;
      try { await (supabase as any).from("contract_history").insert([{ contract_id: data.id, acao: "criado", detalhes: { criado_em: new Date().toISOString() } }]); } catch {}
      onCreated(data.id);
    } catch (e) {
      alert("Erro ao criar contrato: " + (e instanceof Error ? e.message : "Erro desconhecido"));
    } finally { setCriando(false); }
  };

  return (
    <div className="card-graphite p-6 space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <div>
          <h2 className="text-base font-semibold text-foreground">Novo Contrato</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{step === 1 ? "Passo 1 de 2 — Dados básicos" : "Passo 2 de 2 — Variáveis"}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X className="size-5" /></button>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Modelo *</label>
              <select value={form.template_id} onChange={(e) => setForm({ ...form, template_id: e.target.value })} className="input-base w-full">
                <option value="">Selecione um modelo</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.nome}</option>)}
              </select>
              {templates.length === 0 && <p className="mt-1 text-xs text-destructive">Nenhum modelo ativo.</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Cliente *</label>
              <select value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} className="input-base w-full">
                <option value="">Selecione um cliente</option>
                {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Título *</label>
            <input type="text" placeholder="ex: Contrato de Suporte TI — Empresa X" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="input-base w-full" />
          </div>
          {selectedTemplate?.descricao && (
            <p className="text-xs text-muted-foreground px-3 py-2 bg-surface-2 rounded-lg">{selectedTemplate.descricao}</p>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={handleNext} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:bg-brand/90 transition-colors">
              Próximo <ChevronRight className="size-4" />
            </button>
            <button onClick={onClose} className="px-4 py-2.5 border border-border text-sm text-foreground rounded-lg hover:bg-surface-2 transition-colors">Cancelar</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          {variaveis.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma variável no modelo. O contrato será criado diretamente.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">Preencha as variáveis. Campos do cliente foram preenchidos automaticamente.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {variaveis.map((v) => (
                  <div key={v}>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1.5 font-mono">{`{{${v}}}`}</label>
                    <input type="text" value={valores[v] || ""} onChange={(e) => setValores({ ...valores, [v]: e.target.value })} placeholder={`Valor para ${v}`} className="input-base w-full" />
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="flex gap-2 pt-2">
            <button onClick={handleCreate} disabled={criando} className="px-4 py-2.5 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors">
              {criando ? "Criando..." : "Criar Contrato"}
            </button>
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-1 px-4 py-2.5 border border-border text-sm text-foreground rounded-lg hover:bg-surface-2 transition-colors">
              <ChevronLeft className="size-4" /> Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  rascunho: <><FileEdit className="size-3" /> Rascunho</>,
  enviado:  <><Mail className="size-3" /> Enviado</>,
  assinado: <><CheckCircle2 className="size-3" /> Assinado</>,
};

function ContratosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const loadContratos = async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("id, titulo, cliente_id, clientes(nome), status, email_enviado_em, assinado_em, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setContratos(data || []);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadContratos();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Deletar este contrato?")) return;
    try {
      await (supabase as any).from("contracts").delete().eq("id", id);
      loadContratos();
    } catch {
      alert("Erro ao deletar");
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        <PageHeader
          category="CRM"
          title="Contratos"
          icon={ScrollText}
          subtitle={`${contratos.length} contrato(s)`}
          actions={
            <Btn variant="primary" onClick={() => setIsFormOpen((v) => !v)}>
              <Plus className="size-4" /> {isFormOpen ? "Cancelar" : "Novo Contrato"}
            </Btn>
          }
        />

        <InlineFormPanel open={isFormOpen}>
          <NovoContratoForm
            userId={user!.id}
            onClose={() => setIsFormOpen(false)}
            onCreated={(id) => { setIsFormOpen(false); navigate({ to: "/crm/contratos/$id", params: { id } }); }}
          />
        </InlineFormPanel>

        <div className={`space-y-5 transition-opacity duration-300 ${isFormOpen ? "opacity-40 pointer-events-none select-none" : ""}`}>
        {loading ? (
          <LoadingState />
        ) : contratos.length === 0 ? (
          <EmptyState icon={ScrollText} title="Nenhum contrato criado" />
        ) : (
          <div className="card-graphite overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  {["Título", "Cliente", "Status", "Data", "Ações"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ${i === 4 ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contratos.map((c) => (
                  <tr key={c.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{c.titulo}</td>
                    <td className="px-4 py-3 text-muted-foreground">{(c.clientes as any)?.nome || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold capitalize">
                        {STATUS_ICON[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => navigate({ to: "/crm/contratos/$id", params: { id: c.id } })}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-select/30 text-select bg-select/10 rounded-lg hover:bg-select/20 transition-colors"
                        >
                          <Eye className="size-3" /> Ver
                        </button>
                        {c.status === "rascunho" && (
                          <button
                            onClick={() => navigate({ to: "/crm/contratos/enviar/$id", params: { id: c.id } })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-select/30 text-select bg-select/10 rounded-lg hover:bg-select/20 transition-colors"
                          >
                            <Send className="size-3" /> Enviar
                          </button>
                        )}
                        {c.status === "enviado" && (
                          <button
                            onClick={() => navigate({ to: "/crm/contratos/receber/$id", params: { id: c.id } })}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-brand/30 text-brand bg-brand/10 rounded-lg hover:bg-brand/20 transition-colors"
                          >
                            <FileUp className="size-3" /> Receber
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="inline-flex items-center justify-center p-1.5 border border-destructive/30 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/15 transition-colors"
                        >
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
      </div>
    </AppShell>
  );
}
