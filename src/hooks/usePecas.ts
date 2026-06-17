import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Peca {
  id?: string;
  codigo: string;
  descricao: string;
  categoria: string;
  fabricante?: string | null;
  valor_custo: number;
  valor_venda: number;
  estoque: number;
  ativo: boolean;
}

export function usePecas(userId?: string) {
  const [pecas, setPecas] = useState<Peca[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    loadPecas();
  }, [userId]);

  async function loadPecas() {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pecas")
        .select("*")
        .eq("user_id", userId)
        .eq("ativo", true)
        .order("codigo");

      if (error) throw error;
      setPecas(data || []);
    } catch (err) {
      console.error("Erro ao carregar peças:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addPeca(peca: Peca) {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("pecas")
        .insert([{ ...peca, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      setPecas([...pecas, data]);
      return data;
    } catch (err) {
      console.error("Erro ao criar peça:", err);
      throw err;
    }
  }

  async function updatePeca(id: string, peca: Peca) {
    try {
      const { data, error } = await supabase
        .from("pecas")
        .update(peca)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setPecas(pecas.map((p) => (p.id === id ? data : p)));
      return data;
    } catch (err) {
      console.error("Erro ao atualizar peça:", err);
      throw err;
    }
  }

  async function deletePeca(id: string) {
    try {
      const { error } = await supabase
        .from("pecas")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
      setPecas(pecas.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Erro ao deletar peça:", err);
      throw err;
    }
  }

  async function buscarPorCodigo(codigo: string) {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from("pecas")
        .select("*")
        .eq("user_id", userId)
        .eq("codigo", codigo.toUpperCase())
        .eq("ativo", true)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      return null;
    }
  }

  return {
    pecas,
    loading,
    loadPecas,
    addPeca,
    updatePeca,
    deletePeca,
    buscarPorCodigo,
  };
}
