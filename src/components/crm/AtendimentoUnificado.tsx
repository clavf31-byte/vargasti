import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, FileSpreadsheet, Wrench, CreditCard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { OrcamentoFormInline } from "@/components/crm/OrcamentoFormInline";
import { OrcamentoItensTable } from "@/components/crm/OrcamentoItensTable";
import { OrcamentoItemForm } from "@/components/crm/OrcamentoItemForm";
import { InlineFormPanel } from "@/components/shared";
import { supabase } from "@/integrations/supabase/client";
import type { Atendimento } from "@/hooks/useChamados";

type Fase = "entrada" | "orcamento" | "os" | "pagamento";

const FASES: { key: Fase; label: string; icon: typeof CheckCircle2 }[] = [
  { key: "entrada", label: "Entrada", icon: CheckCircle2 },
  { key: "orcamento", label: "Orçamento", icon: FileSpreadsheet },
  { key: "os", label: "OS", icon: Wrench },
  { key: "pagamento", label: "Pagamento", icon: CreditCard },
];

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  aberto: { label: "Aberto", color: "text-slate-400" },
  em_triagem: { label: "Em triagem", color: "text-cyan-400" },
  em_andamento: { label: "Em andamento", color: "text-yellow-400" },
  concluido: { label: "Concluído", color: "text-green-400" },
};

const PRIO_CFG: Record<string, { label: string; color: string }> = {
  alta: { label: "Alta", color: "text-red-400" },
  normal: { label: "Normal", color: "text-yellow-400" },
  baixa: { label: "Baixa", color: "text-slate-400" },
};

interface AtendimentoUnificadoProps {
  atendimento: Atendimento;
  clientes: any[];
  onNavigateBack?: () => void;
}

export function AtendimentoUnificado({ atendimento, clientes, onNavigateBack }: AtendimentoUnificadoProps) {
  const { user } = useAuth();

  const [faseAtiva, setFaseAtiva] = useState<Fase>("entrada");
  const [orcamento, setOrcamento] = useState<any>(null);
  const [os, setOs] = useState<any>(null);
  const [pagamento, setPagamento] = useState<any>(null);
  const [isOrcamentoFormOpen, setIsOrcamentoFormOpen] = useState(false);
  const [isItemFormOpen, setIsItemFormOpen] = useState(false);
  const [orcamentoItens, setOrcamentoItens] = useState<any[]>([]);

  useEffect(() => {
    if (!atendimento) return;
    console.log("AtendimentoUnificado: useEffect triggered, loading data for:", atendimento.id);
    loadFaseData();
  }, [atendimento]);

  async function loadFaseData() {
    if (!atendimento) return;

    // Try to load by orcamento_id first, or search by atendimento_id
    let orc = null;
    try {
      if (atendimento.orcamento_id) {
        const { data, error } = await (supabase as any)
          .from("orcamentos")
          .select("*")
          .eq("id", atendimento.orcamento_id)
          .single();
        if (error) console.error("Load by orcamento_id error:", error);
        orc = data;
      } else {
        // Fallback: search by atendimento_id (for newly created orçamentos)
        const { data, error } = await (supabase as any)
          .from("orcamentos")
          .select("*")
          .eq("atendimento_id", atendimento.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();
        if (error) console.error("Load by atendimento_id error:", error);
        console.log("Loaded orçamento:", data, "for atendimento:", atendimento.id);
        orc = data;
      }
    } catch (err) {
      console.error("loadFaseData error:", err);
    }

    if (orc) {
      setOrcamento(orc);
      const { data: itens } = await (supabase as any)
        .from("orcamento_itens")
        .select("*")
        .eq("orcamento_id", orc.id)
        .order("ordem", { ascending: true });
      setOrcamentoItens(itens || []);
    }

    if (atendimento.ordem_servico_id) {
      const { data: osData } = await (supabase as any)
        .from("ordens_servico")
        .select("*")
        .eq("id", atendimento.ordem_servico_id)
        .single();
      setOs(osData);
    }

    if (atendimento.pagamento_id) {
      const { data: pag } = await (supabase as any)
        .from("pagamentos")
        .select("*")
        .eq("id", atendimento.pagamento_id)
        .single();
      setPagamento(pag);
    }
  }

  function getFaseAtivaIndex(): number {
    if (pagamento) return 3;
    if (os) return 2;
    if (orcamento) return 1;
    return 0;
  }

  async function handleAddItem(item: any) {
    console.log("handleAddItem called with:", item);
    if (!orcamento) {
      console.log("No orcamento found");
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from("orcamento_itens")
        .insert({
          orcamento_id: orcamento.id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
          tipo: item.tipo || "manual",
          servico_id: item.servico_id,
          peca_id: item.peca_id,
          ordem: orcamentoItens.length + 1,
        });

      if (error) {
        console.error("Error adding item:", error);
      } else {
        console.log("Item added successfully");
        setIsItemFormOpen(false);
        loadFaseData();
      }
    } catch (err) {
      console.error("Exception in handleAddItem:", err);
    }
  }

  const faseIdx = getFaseAtivaIndex();
  const statusCfg = STATUS_CFG[atendimento.status];
  const prioCfg = PRIO_CFG[atendimento.prioridade];

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        {onNavigateBack && (
          <button
            onClick={onNavigateBack}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Voltar
          </button>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground/60 bg-surface-2 border border-border px-2 py-0.5 rounded">
              {atendimento.numero_formatado}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${prioCfg.color}`}>
              {prioCfg.label}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{atendimento.titulo}</h1>
          <p className="text-xs text-muted-foreground">
            {atendimento.cliente_nome || "Sem cliente"} · Criado em{" "}
            {new Date(atendimento.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      {/* TIMELINE DE FASES */}
      <div className="card-graphite p-4">
        <div className="grid grid-cols-4 gap-2">
          {FASES.map((fase, idx) => {
            const Icon = fase.icon;
            const isDone = idx < faseIdx;
            const isActive = idx === faseIdx;

            return (
              <div key={fase.key} className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFaseAtiva(fase.key)}
                  className={`relative z-10 grid place-items-center size-10 rounded-full border-2 transition-all ${
                    isActive
                      ? "bg-brand border-brand shadow-[0_0_15px_rgba(19,200,211,0.3)] scale-110"
                      : isDone
                        ? "bg-brand/20 border-brand/60 text-brand"
                        : "bg-surface-2 border-border text-muted-foreground/40"
                  }`}
                >
                  <Icon className="size-5" />
                </button>
                <div className="text-center">
                  <p className="text-[10px] font-bold text-foreground">{fase.label}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTEÚDO DINÂMICO POR FASE */}
      {faseAtiva === "entrada" && (
        <div className="card-graphite p-6 space-y-4">
          <h2 className="text-base font-semibold text-brand">📥 Entrada do Equipamento</h2>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Problema Reportado</label>
              <div className="text-sm text-foreground mt-1">{atendimento.titulo}</div>
            </div>
            {atendimento.descricao && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Descrição</label>
                <div className="text-sm text-foreground mt-1">{atendimento.descricao}</div>
              </div>
            )}
            <div className="pt-3 border-t border-border">
              <button
                onClick={() => setFaseAtiva("orcamento")}
                className="px-4 py-2 bg-brand text-brand-foreground rounded-lg text-sm font-semibold hover:bg-brand/90 transition-colors"
              >
                Próximo: Fazer Orçamento →
              </button>
            </div>
          </div>
        </div>
      )}

      {faseAtiva === "orcamento" && (
        <div className="card-graphite p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-brand">💰 Orçamento</h2>
            {orcamento && <span className="text-xs text-muted-foreground">ORÇ-{orcamento.numero_formatado}</span>}
          </div>

          {!orcamento ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Crie um orçamento para este atendimento</p>
              <button
                onClick={() => setIsOrcamentoFormOpen(true)}
                className="px-4 py-2 bg-brand text-brand-foreground rounded-lg text-sm font-semibold hover:bg-brand/90 transition-colors"
              >
                + Criar Orçamento
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <OrcamentoItensTable
                itens={orcamentoItens}
                onAddItem={() => setIsItemFormOpen(true)}
                onUpdateItem={() => {}}
                onRemoveItem={() => {}}
              />
              <div className="grid grid-cols-2 gap-3 p-3 bg-surface/50 rounded-lg">
                <div>
                  <label className="text-[11px] text-muted-foreground uppercase">Status</label>
                  <div className="text-sm font-semibold text-foreground mt-1">{orcamento.status}</div>
                </div>
                <div className="text-right">
                  <label className="text-[11px] text-muted-foreground uppercase">Total</label>
                  <div className="text-lg font-bold text-brand mt-1">R$ {orcamento.total?.toFixed(2)}</div>
                </div>
              </div>
              {orcamento.status === "rascunho" && (
                <button
                  className="w-full px-4 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-lg text-sm font-semibold hover:bg-green-600/30 transition-colors"
                >
                  ✓ Aprovar Orçamento
                </button>
              )}
              {orcamento.status === "aprovado" && !os && (
                <button
                  className="w-full px-4 py-2 bg-brand text-brand-foreground rounded-lg text-sm font-semibold hover:bg-brand/90 transition-colors"
                >
                  Próximo: Criar OS →
                </button>
              )}
            </div>
          )}

          <InlineFormPanel open={isOrcamentoFormOpen}>
            <OrcamentoFormInline
              userId={user!.id}
              clientes={clientes}
              onSuccess={() => {
                setIsOrcamentoFormOpen(false);
                loadFaseData();
              }}
              isOpen={isOrcamentoFormOpen}
              onClose={() => setIsOrcamentoFormOpen(false)}
              atendimento_id={atendimento.id}
              cliente_id_pre={atendimento.cliente_id}
            />
          </InlineFormPanel>
        </div>
      )}

      {faseAtiva === "os" && (
        <div className="card-graphite p-6">
          <h2 className="text-base font-semibold text-brand">🔧 Ordem de Serviço</h2>
          {!os ? (
            <p className="text-sm text-muted-foreground mt-4">
              Será criada automaticamente ao aprovar o orçamento
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">
              OS criada com sucesso
            </p>
          )}
        </div>
      )}

      {faseAtiva === "pagamento" && (
        <div className="card-graphite p-6">
          <h2 className="text-base font-semibold text-brand">💳 Pagamento</h2>
          {!pagamento ? (
            <p className="text-sm text-muted-foreground mt-4">
              Será criado automaticamente ao concluir a OS
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">
              Pagamento registrado
            </p>
          )}
        </div>
      )}

      {/* MODAL ADICIONAR ITEM */}
      {isItemFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border max-h-[90vh] overflow-y-auto w-full max-w-2xl">
            <div className="p-4">
              <OrcamentoItemForm
                onAdd={handleAddItem}
                onClose={() => {
                  console.log("onClose called, setting isItemFormOpen to false");
                  setIsItemFormOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
