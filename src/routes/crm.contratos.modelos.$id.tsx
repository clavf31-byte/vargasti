import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, LoadingState, Btn } from "@/components/shared";
import { ChevronLeft, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/modelos/$id")({
  head: () => ({ meta: [{ title: `Editar Modelo · CRM ${client.name}` }] }),
  component: EditModeloPage,
});

interface Template {
  id: string;
  nome: string;
  descricao: string;
  conteudo: string;
  ativo: boolean;
}

function extractVariables(conteudo: string): string[] {
  const matches = conteudo.match(/\{\{([^}]+)\}\}/g) || [];
  const names = matches.map((m) => m.replace(/\{\{|\}\}/g, "").trim());
  return [...new Set(names)];
}

function EditModeloPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", descricao: "", conteudo: "", ativo: true });

  useEffect(() => {
    loadTemplate();
  }, [id, user]);

  const loadTemplate = async () => {
    if (!user || !id) return;
    try {
      const { data, error } = await (supabase as any)
        .from("contract_templates")
        .select("id, nome, descricao, conteudo, ativo")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) {
        setTemplate(data);
        setForm({
          nome: data.nome,
          descricao: data.descricao,
          conteudo: data.conteudo,
          ativo: data.ativo,
        });
      }
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !id) return;
    if (!form.nome.trim()) {
      alert("Nome do modelo é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const variables = extractVariables(form.conteudo);
      const { error } = await (supabase as any)
        .from("contract_templates")
        .update({
          nome: form.nome,
          descricao: form.descricao,
          conteudo: form.conteudo,
          ativo: form.ativo,
          variaveis: variables,
        })
        .eq("id", id);

      if (error) throw error;
      navigate({ to: "/crm/contratos/modelos" });
    } catch (e) {
      alert("Erro ao salvar: " + (e instanceof Error ? e.message : "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-6">
          <LoadingState />
        </div>
      </AppShell>
    );
  }

  if (!template) {
    return (
      <AppShell>
        <div className="p-6 text-center text-muted-foreground">
          Modelo não encontrado
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
        <PageHeader
          category="CRM"
          title="Editar Modelo"
          icon={ClipboardList}
          subtitle={form.nome || "Sem nome"}
          actions={
            <Btn variant="secondary" onClick={() => navigate({ to: "/crm/contratos/modelos" })}>
              <ChevronLeft className="size-4" /> Voltar
            </Btn>
          }
        />

        <div className="card-graphite p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Nome do Modelo *</label>
              <input
                type="text"
                placeholder="ex: Contrato de Suporte TI"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                className="input-base w-full"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Status</label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-foreground">{form.ativo ? "Ativo" : "Inativo"}</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Descrição</label>
            <input
              type="text"
              placeholder="Descreva o contrato"
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="input-base w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Conteúdo do Contrato *</label>
            <p className="text-[11px] text-muted-foreground mb-1.5">Use variáveis como: {`{{cliente_nome}}`}, {`{{data}}`}, {`{{valor}}`}, etc.</p>
            <textarea
              placeholder="Cole aqui o conteúdo do seu contrato..."
              value={form.conteudo}
              onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
              rows={12}
              className="input-base w-full font-mono text-xs resize-y"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2.5 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Salvando..." : "Salvar Mudanças"}
            </button>
            <button
              onClick={() => navigate({ to: "/crm/contratos/modelos" })}
              className="px-4 py-2.5 border border-border text-sm text-foreground rounded-lg hover:bg-surface-2 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
