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
    const newItem: OrcamentoItem = {
      descricao: "",
      quantidade: 1,
      preco_unitario: 0,
      subtotal: 0,
      categoria: "Produtos, peças e materiais",
    };
    setItens([...itens, newItem]);
  }

  function updateItem(index: number, item: OrcamentoItem) {
    const updated = [...itens];
    updated[index] = item;
    setItens(updated);
  }

  function removeItem(index: number) {
    setItens(itens.filter((_, i) => i !== index));
  }

  async function saveItens(orcamentoIdParam: string) {
    try {
      // Deletar itens antigos
      await supabase
        .from("orcamento_itens")
        .delete()
        .eq("orcamento_id", orcamentoIdParam);

      // Inserir novos itens
      const itensToSave = itens
        .filter((item) => item.descricao.trim())
        .map((item, idx) => ({
          orcamento_id: orcamentoIdParam,
          descricao: item.descricao,
          quantidade: item.quantidade,
          preco_unitario: item.preco_unitario,
          subtotal: item.subtotal,
          categoria: item.categoria || "Produtos, peças e materiais",
          ordem: idx,
        }));

      if (itensToSave.length > 0) {
        const { error } = await supabase
          .from("orcamento_itens")
          .insert(itensToSave);

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
    updateItem,
    removeItem,
    saveItens,
    loadItens,
  };
}
