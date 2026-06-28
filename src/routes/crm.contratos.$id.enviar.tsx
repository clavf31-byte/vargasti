import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, LoadingState } from "@/components/shared";
import { Send, ArrowLeft, Mail } from "lucide-react";
import { sendContractEmail } from "@/lib/api/sendContractEmail";

export const Route = createFileRoute("/crm/contratos/$id/enviar")({
  head: () => ({ meta: [{ title: `Enviar Contrato · CRM ${client.name}` }] }),
  component: EnviarContrato,
});

interface Contrato {
  id: string;
  titulo: string;
  clientes?: { nome: string; email?: string | null } | null;
}

function EnviarContrato() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => { loadContrato(); }, [id]);

  const loadContrato = async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("id, titulo, clientes(nome, email)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setContrato(data as Contrato);
      setEmail((data.clientes as any)?.email || "");
      setMensagem(
        `Prezado(a) ${(data.clientes as any)?.nome || "cliente"},\n\nSegue em anexo o contrato ${data.titulo} para assinatura.\n\nPor favor, baixe, assine digitalmente e devolva assinado.\n\nAtenciosamente`
      );
    } catch {
      navigate({ to: "/crm/contratos" });
    } finally {
      setLoading(false);
    }
  };

  const handleEnviar = async () => {
    if (!email.trim() || !contrato) { alert("Preencha o email do cliente"); return; }
    setEnviando(true);
    try {
      const result = await sendContractEmail({
        data: {
          contractId: id,
          clientEmail: email,
          clientName: (contrato.clientes as any)?.nome || "Cliente",
          contractTitle: contrato.titulo,
          message: mensagem,
        },
      });

      if (!result.success) throw new Error("Erro ao enviar email");

      await (supabase as any).from("contracts").update({
        status: "enviado",
        email_enviado_para: email,
        email_enviado_em: new Date().toISOString(),
      }).eq("id", id);

      try {
        await (supabase as any).from("contract_history").insert([{
          contract_id: id,
          acao: "enviado",
          detalhes: { email_enviado_para: email, timestamp: new Date().toISOString() },
        }]);
      } catch {}

      alert("Contrato enviado com sucesso!");
      navigate({ to: `/crm/contratos/${id}` });
    } catch (e) {
      alert("Erro ao enviar: " + (e instanceof Error ? e.message : "Erro desconhecido"));
    } finally {
      setEnviando(false);
    }
  };

  if (loading) return <AppShell><LoadingState /></AppShell>;

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
        <button
          onClick={() => navigate({ to: `/crm/contratos/${id}` })}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-select hover:text-select/80 transition-colors"
        >
          <ArrowLeft className="size-4" /> Voltar
        </button>

        <PageHeader
          category="CRM"
          title="Enviar Contrato"
          icon={Mail}
          subtitle={contrato?.titulo}
        />

        <div className="card-graphite p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Email do Cliente *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@example.com"
              className="input-base w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Mensagem (opcional)</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={6}
              placeholder="Mensagem para enviar junto ao contrato"
              className="input-base w-full resize-y"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              O cliente receberá o PDF do contrato e poderá assiná-lo digitalmente.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleEnviar}
              disabled={enviando || !email.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors"
            >
              <Send className="size-4" /> {enviando ? "Enviando..." : "Enviar Contrato"}
            </button>
            <button
              onClick={() => navigate({ to: `/crm/contratos/${id}` })}
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
