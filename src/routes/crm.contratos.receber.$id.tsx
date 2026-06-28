import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/AppShell";
import { PageHeader, LoadingState } from "@/components/shared";
import { Upload, CheckCircle2, ArrowLeft, FileUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crm/contratos/receber/$id")({
  head: () => ({ meta: [{ title: `Receber Contrato · CRM ${client.name}` }] }),
  component: ReceberContrato,
});

interface Contrato {
  id: string;
  titulo: string;
  clientes?: { nome: string } | null;
}

function ReceberContrato() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [arquivo, setArquivo] = useState<File | null>(null);

  useEffect(() => { loadContrato(); }, [id]);

  const loadContrato = async () => {
    if (!user) return;
    try {
      const { data, error } = await (supabase as any)
        .from("contracts")
        .select("id, titulo, clientes(nome)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setContrato(data as Contrato);
    } catch {
      navigate({ to: "/crm/contratos" });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!arquivo || !contrato || !user) { alert("Selecione um arquivo"); return; }
    setUploading(true);
    try {
      const fileName = `contratos/${id}/${arquivo.name}`;
      const { error: uploadError } = await supabase.storage
        .from("contracts")
        .upload(fileName, arquivo, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("contracts").getPublicUrl(fileName);

      await (supabase as any).from("contracts").update({
        status: "assinado",
        arquivo_assinado_url: urlData.publicUrl,
        assinado_em: new Date().toISOString(),
      }).eq("id", id).eq("user_id", user.id);

      try {
        await (supabase as any).from("contract_history").insert([{
          contract_id: id,
          acao: "arquivo_recebido",
          detalhes: { arquivo_nome: arquivo.name, arquivo_url: urlData.publicUrl, timestamp: new Date().toISOString() },
        }]);
      } catch {}

      alert("Contrato assinado recebido com sucesso!");
      navigate({ to: "/crm/contratos/$id", params: { id } });
    } catch (e) {
      alert("Erro ao fazer upload: " + (e instanceof Error ? e.message : "Erro desconhecido"));
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <AppShell><LoadingState /></AppShell>;

  return (
    <AppShell>
      <div className="p-4 md:p-6 space-y-5 max-w-2xl mx-auto">
        <button
          onClick={() => navigate({ to: "/crm/contratos/$id", params: { id } })}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-select hover:text-select/80 transition-colors"
        >
          <ArrowLeft className="size-4" /> Voltar
        </button>

        <PageHeader
          category="CRM"
          title="Receber Contrato Assinado"
          icon={FileUp}
          subtitle={contrato?.titulo}
        />

        <div className="card-graphite p-6 space-y-4">
          <div
            className={cn(
              "rounded-xl border-2 border-dashed p-8 text-center transition-colors",
              arquivo ? "border-brand/50 bg-brand/5" : "border-border hover:border-select/40"
            )}
          >
            <Upload className="size-10 mx-auto mb-3 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground mb-1">Selecione o PDF assinado</h3>
            <p className="text-xs text-muted-foreground mb-4">Faça upload do contrato assinado digitalmente pelo cliente</p>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setArquivo(e.target.files?.[0] || null)}
              className="input-base w-full"
            />
          </div>

          {arquivo && (
            <div className="flex items-center gap-3 p-3 bg-brand/10 border border-brand/30 rounded-lg">
              <CheckCircle2 className="size-5 text-brand shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{arquivo.name}</p>
                <p className="text-xs text-muted-foreground">{(arquivo.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleUpload}
              disabled={!arquivo || uploading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand text-brand-foreground text-sm font-semibold rounded-lg hover:bg-brand/90 disabled:opacity-50 transition-colors"
            >
              <CheckCircle2 className="size-4" /> {uploading ? "Salvando..." : "Confirmar Assinatura"}
            </button>
            <button
              onClick={() => navigate({ to: "/crm/contratos/$id", params: { id } })}
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
