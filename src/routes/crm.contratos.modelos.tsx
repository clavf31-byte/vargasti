import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, EmptyState, LoadingState, Btn } from "@/components/shared";
import { Plus, Edit2, Trash2, ClipboardList, Download } from "lucide-react";

const MODELO_SUPORTE_TI = {
  nome: "Contrato de Suporte e Infraestrutura de TI",
  descricao: "Contrato mensal com suporte tÃ©cnico, comodato de equipamentos e antivÃ­rus Acronis",
  conteudo: `PROPOSTA COMERCIAL E TÃ‰CNICA
Contrato Mensal de Suporte e Infraestrutura de TI

Cliente: {{cliente_nome}}
Data: {{data}}

...

_________________________________________________
{{cliente_nome}}
Data: ____ / ____ / ________`,
};

export const Route = createFileRoute("/crm/contratos/modelos")({
  head: () => ({ meta: [{ title: `Modelos de Contratos Â· CRM ${client.name}` }] }),
  component: ModelosPage,
});

interface Template {
  id: string;
  nome: string;
  descricao: string;
  ativo: boolean;
  created_at: string;
}

function ModelosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ nome: "", descricao: "", conteudo: "" });

  const loadTemplates = async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("contract_templates")
        .select("id, nome, descricao, ativo, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setTemplates(data || []);
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTemplates(); }, [user]);

  const handleCreate = async () => {
    if (!user || !newTemplate.nome.trim()) return;
    try {
      const { error } = await (supabase as any).from("contract_templates").insert([{
        user_id: user.id,
        nome: newTemplate.nome,
        descricao: newTemplate.descricao,
        conteudo: newTemplate.conteudo,
        variaveis: [],
      }]);
      if (error) throw error;
      setNewTemplate({ nome: "", descricao: "", conteudo: "" });
      setIsFormOpen(false);
      loadTemplates();
    } catch (e) {
      alert("Erro ao criar modelo");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    try {
      await (supabase as any).from("contract_templates").delete().eq("id", id);
      loadTemplates();
    } catch {
      alert("Erro ao deletar");
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
        <PageHeader
          category="CRM"
          title="Modelos de Contrato"
          icon={ClipboardList}
          subtitle={`${templates.length} modelo(s) criado(s)`}
          actions={
            <Btn variant="primary" onClick={() => setIsFormOpen(!isFormOpen)}>
              {isFormOpen ? "Cancelar" : <><Plus className="size-4" /> Novo Modelo</>}
            </Btn>
          }
        />

        {!isFormOpen && (
          <div className="card-graphite p-4 flex items-start justify-between gap-4">
            <div>
              <div className="font-semibold text-foreground text-sm">{MODELO_SUPORTE_TI.nome}</div>
              <div className="text-xs text-muted-foreground mt-1">{MODELO_SUPORTE_TI.descricao}</div>
              <div className="text-[11px] text-muted-foreground mt-2">
                VariÃ¡veis:{" "}
                <code className="bg-surface px-1 py-0.5 rounded text-[10px]">
                  {"{{cliente_nome}}, {{data}}, {{estacoes_trabalho}}, {{licencas_acronis}}, {{valor_setup}}, {{valor_mensal}}, {{vigencia_meses}}, {{dia_vencimento}}"}
                </code>
              </div>
            </div>
            <button
              onClick={() => { setNewTemplate({ nome: MODELO_SUPORTE_TI.nome, descricao: MODELO_SUPORTE_TI.descricao, conteudo: MODELO_SUPORTE_TI.conteudo }); setIsFormOpen(true); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-select text-white text-xs font-semibold rounded-lg hover:bg-select/90 transition-colors whitespace-nowrap shrink-0"
            >
              <Download className="size-3.5" /> Usar este Modelo
            </button>
          </div>
        )}

        {isFormOpen && (
          <div className="card-graphite p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nome do Modelo *</label>
                <input type="text" placeholder="ex: Contrato de Suporte TI" value={newTemplate.nome} onChange={(e) => setNewTemplate({ ...newTemplate, nome: e.target.value })} className="input-base w-full" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">DescriÃ§Ã£o</label>
                <input type="text" placeholder="Descreva o contrato" value={newTemplate.descricao} onChange={(e) => setNewTemplate({ ...newTemplate, descricao: e.target.value })} className="input-base w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">ConteÃºdo do Contrato *</label>
              <p className="text-[11px] text-muted-foreground mb-1.5">Use variÃ¡veis como: {"{{cliente_nome}}"}, {"{{data}}"}, {"{{valor}}"}, etc.</p>
              <textarea
                placeholder="Cole aqui o conteÃºdo do seu contrato..."
                value={newTemplate.conteudo}
                onChange={(e) => setNewTemplate({ ...newTemplate, conteudo: e.target.value })}
                rows={8}
                className="input-base w-full font-mono text-xs resize-y"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleCreate} className="px-4 py-2.5 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:bg-brand/90 transition-colors">
                Criar Modelo
              </button>
              <button onClick={() => setIsFormOpen(false)} className="px-4 py-2.5 border border-border text-sm text-foreground rounded-lg hover:bg-surface-2 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : templates.length === 0 ? (
          <EmptyState icon={ClipboardList} title="Nenhum modelo criado ainda" />
        ) : (
          <div className="card-graphite overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-border">
                  {["Nome", "DescriÃ§Ã£o", "AÃ§Ãµes"].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider ${i === 2 ? "text-center" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-surface-2/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{t.nome}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{t.descricao || "â€”"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate({ to: `/crm/contratos/modelos/${t.id}` })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-select/30 text-select bg-select/10 rounded-lg hover:bg-select/20 transition-colors"
                          title="Editar modelo"
                        >
                          <Edit2 className="size-3" /> Editar
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-destructive/30 text-destructive bg-destructive/5 rounded-lg hover:bg-destructive/15 transition-colors"
                        >
                          <Trash2 className="size-3" /> Deletar
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

