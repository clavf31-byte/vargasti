import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CRMMetrics {
  clientesCount: number;
  orcamentosCount: number;
  pagamentosCount: number;
}

export function useCRMMetrics(): CRMMetrics {
  const { user } = useAuth();
  const [clientesCount, setClientesCount] = useState<number>(0);
  const [orcamentosCount, setOrcamentosCount] = useState<number>(0);
  const [pagamentosCount, setPagamentosCount] = useState<number>(0);

  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;

    async function loadMetrics() {
      try {
        const [clientesRes, orcamentosRes, pagamentosRes] = await Promise.all([
          supabase.from("clientes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("orcamentos").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("pagamentos").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        ]);

        if (isMounted) {
          setClientesCount(clientesRes.count ?? 0);
          setOrcamentosCount(orcamentosRes.count ?? 0);
          setPagamentosCount(pagamentosRes.count ?? 0);
        }
      } catch (err) {
        console.error("[useCRMMetrics]", err);
      }
    }

    loadMetrics();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  return {
    clientesCount,
    orcamentosCount,
    pagamentosCount,
  };
}
