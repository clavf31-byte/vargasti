import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, LoadingState } from "@/components/shared";
import { Send, ArrowLeft, FileEdit, Mail, CheckCircle2, Pencil, ScrollText } from "lucide-react";

export const Route = createFileRoute("/crm/contratos/$id")({
  head: () => ({ meta: [{ title: `Contrato · CRM ${client.name}` }] }),
  component: ContratoDetalhe,
});

interface Contrato {
  id: string;
  titulo: string;
  status: string;
  conteudo: string;
  clientes?: { nome: string } | null;
  email_enviado_em?: string | null;
  assinado_em?: string | null;
  created_at: string;
}

function ContratoDetalhe() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(false);
  const [conteudo, setConteudo] = useState("");

  useEffect(() => { loadContrato(); }, [id]);

  const loadContrato = async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("id, titulo, status, conteudo, clientes(nome), email_enviado_em, assinado_em, created_at")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setContrato(data as Contrato);
      setConteudo(data.conteudo || "");
    } catch {
      navigate({ to: "/crm/contratos" });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!user) return;
    try {
      const { error } = await (supabase as any)
        .from("contracts")
        .update({ conteudo })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      await loadContrato();
      setEditando(false);
    } catch {
      alert("Erro ao salvar");
    }
  };

  if (loading) return <AppShell><LoadingState /></AppShell>;

  if (!contrato) {
    return <AppShell><div className="p-6 text-sm text-destructive">Contrato não encontrado</div></AppShell>;
  }

  const hasVars = /\{\{[^}]+\}\}/.test(conteudo);

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
        <button
          onClick={() => navigate({ to: "/crm/contratos" })}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-select hover:text-select/80 transition-colors"
        >
          <ArrowLeft className="size-4" /> Voltar
        </button>

        <PageHeader
          category="CRM"
          title={contrato.titulo}
          icon={ScrollText}
          subtitle={(contrato.clientes as any)?.nome}
        />

        <div className="card-graphite p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold capitalize">
              {contrato.status === "rascunho" && <span className="inline-flex items-center gap-1 text-muted-foreground"><FileEdit className="size-4" /> Rascunho</span>}
              {contrato.status === "enviado"  && <span className="inline-flex items-center gap-1 text-info"><Mail className="size-4" /> Enviado</span>}
              {contrato.status === "assinado" && <span className="inline-flex items-center gap-1 text-brand"><CheckCircle2 className="size-4" /> Assinado</span>}
            </div>

            <div className="flex items-center gap-2">
              {!editando && contrato.status === "rascunho" && (
                <>
                  <button
                    onClick={() => navigate({ to: `/crm/contratos/${id}/enviar` })}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors"
                  >
                    <Send className="size-3.5" /> Enviar
                  </button>
                  <button
                    onClick={() => setEditando(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border text-foreground rounded-lg hover:bg-surface-2 transition-colors"
                  >
                    <Pencil className="size-3.5" /> Editar
                  </button>
                </>
              )}
              {editando && (
                <>
                  <button onClick={handleSaveEdit}
                    className="px-3 py-1.5 text-xs font-semibold bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 transition-colors">
                    Salvar
                  </button>
                  <button onClick={() => setEditando(false)}
                    className="px-3 py-1.5 text-xs font-semibold border border-border text-foreground rounded-lg hover:bg-surface-2 transition-colors">
                    Cancelar
                  </button>
                </>
              )}
            </div>
          </div>

          {editando ? (
            <textarea
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              className="input-base w-full font-mono text-xs resize-y"
              rows={20}
            />
          ) : (
            <>
              {hasVars && (
                <div className="px-3 py-2 text-xs font-medium text-warning bg-warning/10 border border-warning/30 rounded-lg">
                  Este contrato ainda contém variáveis não preenchidas. Clique em "Editar" para substituí-las.
                </div>
              )}
              <div
                className="p-4 bg-surface rounded-lg border border-border min-h-96 text-sm text-foreground leading-relaxed whitespace-pre-wrap break-words"
                dangerouslySetInnerHTML={{
                  __html: conteudo
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/\{\{([^}]+)\}\}/g, '<mark style="background:rgba(253,224,71,0.3);padding:1px 4px;border-radius:3px;color:#854d0e;">{{$1}}</mark>'),
                }}
              />
            </>
          )}
        </div>

        <div className="card-graphite p-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">Criado em</div>
            <div className="font-medium text-foreground">{new Date(contrato.created_at).toLocaleDateString("pt-BR")}</div>
          </div>
          {contrato.email_enviado_em && (
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Enviado em</div>
              <div className="font-medium text-foreground">{new Date(contrato.email_enviado_em).toLocaleDateString("pt-BR")}</div>
            </div>
          )}
          {contrato.assinado_em && (
            <div>
              <div className="text-xs text-muted-foreground mb-0.5">Assinado em</div>
              <div className="font-medium text-brand">{new Date(contrato.assinado_em).toLocaleDateString("pt-BR")}</div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
