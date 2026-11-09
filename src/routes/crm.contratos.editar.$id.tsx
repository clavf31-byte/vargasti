import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, LoadingState, Btn } from "@/components/shared";
import { ChevronLeft, ScrollText } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/editar/$id")({
  head: () => ({ meta: [{ title: `Editar Contrato · CRM ${client.name}` }] }),
  component: EditarContratoPage,
});

interface Contrato {
  id: string;
  titulo: string;
  conteudo: string;
  status: string;
}

function EditarContratoPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ titulo: "", conteudo: "" });

  useEffect(() => {
    loadContrato();
  }, [id, user]);

  const loadContrato = async () => {
    if (!user || !id) return;
    try {
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("id, titulo, conteudo, status")
        .eq("id", id)
        .single();
      if (error) throw error;
      setContrato(data);
      setForm({ titulo: data.titulo, conteudo: data.conteudo });
    } catch (e) {
      console.error("Erro:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !id || !form.titulo.trim() || !form.conteudo.trim()) {
      alert("Título e conteúdo são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("contracts")
        .update({ titulo: form.titulo, conteudo: form.conteudo })
        .eq("id", id);
      if (error) throw error;
      navigate({ to: `/crm/contratos/${id}` });
    } catch (e) {
      alert("Erro: " + (e instanceof Error ? e.message : "Erro desconhecido"));
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

  if (!contrato) {
    return (
      <AppShell>
        <div className="p-6 text-center text-muted-foreground">
          Contrato não encontrado
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 flex flex-col h-screen max-w-7xl mx-auto">
        <PageHeader
          category="CRM"
          title="Editar Contrato"
          icon={ScrollText}
          actions={
            <Btn variant="secondary" onClick={() => id && navigate({ to: `/crm/contratos/${id}` })}>
              <ChevronLeft className="size-4" /> Voltar
            </Btn>
          }
        />

        <div className="card-graphite p-4 flex flex-col flex-1 space-y-3 overflow-hidden">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Título *</label>
            <input type="text" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="input-base w-full text-sm" />
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Conteúdo *</label>
            <textarea value={form.conteudo} onChange={(e) => setForm({ ...form, conteudo: e.target.value })} className="input-base w-full font-mono text-xs flex-1 resize-none" />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Salvando..." : "Salvar Mudanças"}
            </button>
            <button
              onClick={() => id && navigate({ to: `/crm/contratos/${id}` })}
              className="px-4 py-2 border border-border text-sm text-foreground rounded-lg hover:bg-surface-2 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
