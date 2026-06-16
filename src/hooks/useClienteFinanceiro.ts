import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ClienteFinanceiro {
  id?: string;
  cliente_id: string;
  total_orcamentos: number;
  qtd_orcamentos: number;
  total_os: number;
  qtd_os: number;
  total_nf: number;
  qtd_nf: number;
  total_pago: number;
  total_aberto: number;
}

export function useClienteFinanceiro(clienteId?: string) {
  const [financeiro, setFinanceiro] = useState<ClienteFinanceiro | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clienteId) return;
    loadFinanceiro();
  }, [clienteId]);

  async function loadFinanceiro() {
    if (!clienteId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cliente_financeiro")
        .select("*")
        .eq("cliente_id", clienteId)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      setFinanceiro(data || null);
    } catch (err) {
      console.error("Erro ao carregar financeiro do cliente:", err);
    } finally {
      setLoading(false);
    }
  }

  async function atualizarFinanceiro(
    clienteId: string,
    dados: Partial<ClienteFinanceiro>
  ) {
    try {
      // Tentar atualizar
      const { data: existing } = await supabase
        .from("cliente_financeiro")
        .select("*")
        .eq("cliente_id", clienteId)
        .single();

      if (existing) {
        const { data, error } = await supabase
          .from("cliente_financeiro")
          .update(dados)
          .eq("cliente_id", clienteId)
          .select()
          .single();

        if (error) throw error;
        setFinanceiro(data);
        return data;
      } else {
        // Criar novo registro
        const { data, error } = await supabase
          .from("cliente_financeiro")
          .insert([{ cliente_id: clienteId, ...dados }])
          .select()
          .single();

        if (error) throw error;
        setFinanceiro(data);
        return data;
      }
    } catch (err) {
      console.error("Erro ao atualizar financeiro:", err);
      throw err;
    }
  }

  async function adicionarOrcamento(
    clienteId: string,
    valor: number
  ) {
    if (!financeiro) {
      return atualizarFinanceiro(clienteId, {
        total_orcamentos: valor,
        qtd_orcamentos: 1,
      });
    }

    return atualizarFinanceiro(clienteId, {
      total_orcamentos: (financeiro.total_orcamentos || 0) + valor,
      qtd_orcamentos: (financeiro.qtd_orcamentos || 0) + 1,
    });
  }

  async function registrarPagamento(clienteId: string, valor: number) {
    if (!financeiro) {
      return atualizarFinanceiro(clienteId, {
        total_pago: valor,
        total_aberto: 0,
      });
    }

    const novoAberto = Math.max(
      0,
      (financeiro.total_aberto || 0) - valor
    );

    return atualizarFinanceiro(clienteId, {
      total_pago: (financeiro.total_pago || 0) + valor,
      total_aberto: novoAberto,
    });
  }

  return {
    financeiro,
    loading,
    loadFinanceiro,
    atualizarFinanceiro,
    adicionarOrcamento,
    registrarPagamento,
  };
}
