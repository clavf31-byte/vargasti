import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OrcamentoItem {
  id?: string;
  orcamento_id?: string;
  descricao: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  categoria?: string;
  tipo?: "servico" | "peca";
  servico_id?: string;
  peca_id?: string;
  tarefas?: string[];
}

export function useOrcamentoItens(orcamentoId?: string) {
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!orcamentoId) return;
    loadItens();
  }, [orcamentoId]);

  async function loadItens() {
    if (!orcamentoId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orcamento_itens")
        .select("*")
        .eq("orcamento_id", orcamentoId)
        .order("ordem", { ascending: true });

      if (error) throw error;
      setItens((data || []) as OrcamentoItem[]);
    } catch (err) {
      console.error("Erro ao carregar itens:", err);
    } finally {
      setLoading(false);
    }
  }

  function addItem() {
    setItens((prev) => [
      ...prev,
      { descricao: "", quantidade: 1, preco_unitario: 0, subtotal: 0 },
    ]);
  }

  function addItens(novos: OrcamentoItem[]) {
    setItens((prev) => [...prev, ...novos]);
  }

  function updateItem(index: number, item: OrcamentoItem) {
    setItens((prev) => prev.map((it, i) => (i === index ? item : it)));
  }

  function removeItem(index: number) {
    setItens((prev) => prev.filter((_, i) => i !== index));
  }

  // Insere os novos antes de apagar os antigos: se o INSERT falhar, nada é perdido.
  async function saveItens(orcamentoIdParam: string) {
    try {
      const { data: antigos, error: selectError } = await supabase
        .from("orcamento_itens")
        .select("id")
        .eq("orcamento_id", orcamentoIdParam);
      if (selectError) throw selectError;

      const itensToSave = itens
        .filter((item) => item.descricao.trim())
        .map((item, idx) => ({
          orcamento_id: orcamentoIdParam,
          descricao: item.descricao,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
          ordem: idx,
          tipo: item.tipo,
          servico_id: item.servico_id,
          peca_id: item.peca_id,
          tarefas: item.tarefas,
        }));

      if (itensToSave.length > 0) {
        const { error } = await supabase.from("orcamento_itens").insert(itensToSave);
        if (error) throw error;
      }

      const idsAntigos = (antigos || []).map((i) => i.id);
      if (idsAntigos.length > 0) {
        const { error } = await supabase.from("orcamento_itens").delete().in("id", idsAntigos);
        if (error) throw error;
      }

      return true;
    } catch (err) {
      console.error("Erro ao salvar itens:", err);
      throw err;
    }
  }

  const total = itens.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    itens,
    total,
    loading,
    addItem,
    addItens,
    updateItem,
    removeItem,
    saveItens,
    loadItens,
  };
}
