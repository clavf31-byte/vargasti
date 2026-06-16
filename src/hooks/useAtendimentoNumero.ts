import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAtendimentoNumero() {
  const { user } = useAuth();

  const allocateNextNumber = async (): Promise<number> => {
    if (!user?.id) {
      throw new Error("User not authenticated");
    }

    try {
      const { data, error } = await (supabase as any).rpc("allocate_atendimento_numero", {
        p_user_id: user.id,
      });

      if (error) throw error;
      if (!data) throw new Error("Failed to allocate number");

      return Number(data);
    } catch (err) {
      console.error("[useAtendimentoNumero] Error allocating number:", err);
      throw err;
    }
  };

  return { allocateNextNumber };
}
