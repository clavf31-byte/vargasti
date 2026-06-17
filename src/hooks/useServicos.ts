import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Servico {
  id?: string;
  nome: string;
  categoria: string;
  valor_padrao: number;
  unidade: string;
  descricao?: string | null;
  ativo: boolean;
}

export function useServicos(userId?: string) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    loadServicos();
  }, [userId]);

  async function loadServicos() {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("servicos")
        .select("*")
        .eq("user_id", userId)
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setServicos(data || []);
    } catch (err) {
      console.error("Erro ao carregar serviços:", err);
    } finally {
      setLoading(false);
    }
  }

  async function addServico(servico: Servico) {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from("servicos")
        .insert([{ ...servico, user_id: userId }])
        .select()
        .single();

      if (error) throw error;
      setServicos([...servicos, data]);
      return data;
    } catch (err) {
      console.error("Erro ao criar serviço:", err);
      throw err;
    }
  }

  async function updateServico(id: string, servico: Servico) {
    try {
      const { data, error } = await supabase
        .from("servicos")
        .update(servico)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      setServicos(servicos.map((s) => (s.id === id ? data : s)));
      return data;
    } catch (err) {
      console.error("Erro ao atualizar serviço:", err);
      throw err;
    }
  }

  async function deleteServico(id: string) {
    try {
      const { error } = await supabase
        .from("servicos")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
      setServicos(servicos.filter((s) => s.id !== id));
    } catch (err) {
      console.error("Erro ao deletar serviço:", err);
      throw err;
    }
  }

  return {
    servicos,
    loading,
    loadServicos,
    addServico,
    updateServico,
    deleteServico,
  };
}
