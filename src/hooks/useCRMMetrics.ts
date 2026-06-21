import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface OrcamentoRecente {
  id: string;
  numero_formatado: string;
  total: number;
  status_enum: string;
  created_at: string;
  cliente_nome: string;
}

export interface TarefaPendente {
  id: string;
  titulo: string;
  status: string;
  prioridade: string;
  data_vencimento: string;
  atrasada: boolean;
}

export interface CRMMetrics {
  clientesCount: number;
  clientesComOrcamento: number;
  orcamentosCount: number;
  orcamentosStatus: { aprovado: number; enviado: number; rascunho: number; rejeitado: number };
  orcamentosTotalAberto: number;
  pagamentosCount: number;
  pagamentosTotal: number;
  contratosCount: number;
  contratosStatus: { assinado: number; enviado: number; rascunho: number };
  tarefasPendentes: TarefaPendente[];
  tarefasAtrasadas: number;
  tarefasHoje: number;
  recentes: OrcamentoRecente[];
}

const INITIAL: CRMMetrics = {
  clientesCount: 0,
  clientesComOrcamento: 0,
  orcamentosCount: 0,
  orcamentosStatus: { aprovado: 0, enviado: 0, rascunho: 0, rejeitado: 0 },
  orcamentosTotalAberto: 0,
  pagamentosCount: 0,
  pagamentosTotal: 0,
  contratosCount: 0,
  contratosStatus: { assinado: 0, enviado: 0, rascunho: 0 },
  tarefasPendentes: [],
  tarefasAtrasadas: 0,
  tarefasHoje: 0,
  recentes: [],
};

export function useCRMMetrics(): CRMMetrics {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<CRMMetrics>(INITIAL);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    async function load() {
      const userId = user!.id;
      const todayStr = new Date().toISOString().split("T")[0];

      const [clientesRes, orcamentosRes, pagamentosRes, contratosRes, tarefasRes] = await Promise.all([
        supabase.from("clientes").select("id", { count: "exact" }).eq("user_id", userId),
        supabase
          .from("orcamentos")
          .select("id, status_enum, total, cliente_id, numero_formatado, created_at, clientes(nome)")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase.from("pagamentos").select("id, valor").eq("user_id", userId),
        supabase.from("contracts").select("id, status").eq("user_id", userId),
        supabase
          .from("tarefas")
          .select("id, titulo, status, prioridade, data_vencimento")
          .eq("user_id", userId)
          .neq("status", "concluida")
          .order("data_vencimento", { ascending: true })
          .limit(10),
      ]);

      if (!mounted) return;

      const orcs = (orcamentosRes.data || []) as any[];
      const pags = (pagamentosRes.data || []) as any[];
      const contratos = (contratosRes.data || []) as any[];
      const tarefas = (tarefasRes.data || []) as any[];

      const orcStatus = { aprovado: 0, enviado: 0, rascunho: 0, rejeitado: 0 };
      let totalAberto = 0;
      const clienteIdsComOrc = new Set<string>();
      for (const o of orcs) {
        const s = o.status_enum as keyof typeof orcStatus;
        if (s in orcStatus) orcStatus[s]++;
        if (s === "rascunho" || s === "enviado") totalAberto += o.total || 0;
        if (o.cliente_id) clienteIdsComOrc.add(o.cliente_id);
      }

      const contStatus = { assinado: 0, enviado: 0, rascunho: 0 };
      for (const c of contratos) {
        const s = (c.status as string)?.toLowerCase();
        if (s === "assinado") contStatus.assinado++;
        else if (s === "enviado") contStatus.enviado++;
        else contStatus.rascunho++;
      }

      const tarefasPendentes: TarefaPendente[] = tarefas.map((t: any) => ({
        id: t.id,
        titulo: t.titulo,
        status: t.status,
        prioridade: t.prioridade,
        data_vencimento: t.data_vencimento,
        atrasada: t.data_vencimento < todayStr,
      }));

      const tarefasAtrasadas = tarefasPendentes.filter((t) => t.atrasada).length;
      const tarefasHoje = tarefasPendentes.filter((t) => t.data_vencimento === todayStr).length;

      const recentes: OrcamentoRecente[] = orcs.slice(0, 4).map((o) => ({
        id: o.id,
        numero_formatado: o.numero_formatado,
        total: o.total || 0,
        status_enum: o.status_enum,
        created_at: o.created_at,
        cliente_nome: (o.clientes as any)?.nome || "—",
      }));

      setMetrics({
        clientesCount: clientesRes.count ?? 0,
        clientesComOrcamento: clienteIdsComOrc.size,
        orcamentosCount: orcs.length,
        orcamentosStatus: orcStatus,
        orcamentosTotalAberto: totalAberto,
        pagamentosCount: pags.length,
        pagamentosTotal: pags.reduce((s: number, p: any) => s + (p.valor || 0), 0),
        contratosCount: contratos.length,
        contratosStatus: contStatus,
        tarefasPendentes,
        tarefasAtrasadas,
        tarefasHoje,
        recentes,
      });
    }

    load();
    return () => { mounted = false; };
  }, [user?.id]);

  return metrics;
}
