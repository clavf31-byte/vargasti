import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, Btn } from "@/components/shared";
import { ChevronLeft, ClipboardList } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/modelos/create")({
  head: () => ({ meta: [{ title: `Novo Modelo · CRM ${client.name}` }] }),
  component: NovoModeloPage,
});

function extractVariables(conteudo: string): string[] {
  const matches = conteudo.match(/\{\{([^}]+)\}\}/g) || [];
  const names = matches.map((m) => m.replace(/\{\{|\}\}/g, "").trim());
  return [...new Set(names)];
}

function NovoModeloPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nome: "", descricao: "", conteudo: "" });

  const handleCreate = async () => {
    if (!user || !form.nome.trim()) {
      alert("Nome do modelo é obrigatório");
      return;
    }
    if (!form.conteudo.trim()) {
      alert("Conteúdo do contrato é obrigatório");
      return;
    }

    setSaving(true);
    try {
      const variables = extractVariables(form.conteudo);
      const { error } = await (supabase as any).from("contract_templates").insert([{
        user_id: user.id,
        nome: form.nome,
        descricao: form.descricao,
        conteudo: form.conteudo,
        ativo: true,
        variaveis: variables,
      }]);
      if (error) throw error;
      navigate({ to: "/crm/contratos/modelos" });
    } catch (e) {
      alert("Erro ao criar modelo: " + (e instanceof Error ? e.message : "Erro desconhecido"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
        <PageHeader
          category="CRM"
          title="Novo Modelo de Contrato"
          icon={ClipboardList}
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
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Descrição</label>
              <input
                type="text"
                placeholder="Breve descrição do contrato"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                className="input-base w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Conteúdo do Contrato *</label>
            <p className="text-[11px] text-muted-foreground mb-1.5">Use variáveis como: {`{{cliente_nome}}`}, {`{{data}}`}, {`{{valor}}`}, etc.</p>
            <textarea
              placeholder="Cole aqui o conteúdo completo do contrato..."
              value={form.conteudo}
              onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
              rows={14}
              className="input-base w-full font-mono text-xs resize-y"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-4 py-2.5 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors"
            >
              {saving ? "Criando..." : "Criar Modelo"}
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
