import { useState, useEffect } from "react";
import { supabase as _supabase } from "@/integrations/supabase/client";
const supabase = _supabase as any;

export type EmailCategory = {
  name: string;
  keywords: string[];
};

export type EmailWhitelist = {
  id: string;
  email: string;
  domain: string;
};

export type EmailPriority = {
  id: string;
  keywords: string[];
  priority: "alta" | "media" | "baixa";
};

export type EmailBlacklist = {
  id: string;
  email: string;
  domain: string;
  reason: "spam" | "fornecedor" | "dominio-bloqueado" | "outro";
};

const DEFAULT_CATEGORIES: EmailCategory[] = [
  { name: "Impressora", keywords: ["impressora", "printer", "imprimir", "print", "papel"] },
  { name: "Rede", keywords: ["internet", "conexão", "wifi", "rede", "conectar", "ping", "latência"] },
  { name: "Email", keywords: ["email", "outlook", "gmail", "enviar", "receber", "anexo"] },
  { name: "Software", keywords: ["software", "programa", "aplicativo", "erro", "crash", "travado"] },
  { name: "Hardware", keywords: ["hardware", "dispositivo", "mouse", "teclado", "monitor", "pc"] },
  { name: "VPN", keywords: ["vpn", "remoto", "acesso remoto", "proxy"] },
  { name: "Banco de Dados", keywords: ["banco", "banco de dados", "database", "sql", "backup"] },
  { name: "Suporte", keywords: ["help", "suporte", "ajuda", "problema", "não funciona", "dúvida"] },
];

const DEFAULT_PRIORITIES: EmailPriority[] = [
  {
    id: "urgent",
    keywords: ["urgente", "urgency", "asap", "crítico", "crítica", "parado", "offline"],
    priority: "alta",
  },
  {
    id: "high",
    keywords: ["problema", "erro", "não funciona", "quebrado", "travado"],
    priority: "alta",
  },
  {
    id: "low",
    keywords: ["dúvida", "informação", "pergunta", "como"],
    priority: "baixa",
  },
];

export function useEmailConfig() {
  const [categories, setCategories] = useState<EmailCategory[]>(DEFAULT_CATEGORIES);
  const [whitelist, setWhitelist] = useState<EmailWhitelist[]>([]);
  const [priorities, setPriorities] = useState<EmailPriority[]>(DEFAULT_PRIORITIES);
  const [blacklist, setBlacklist] = useState<EmailBlacklist[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Carregar do Supabase via RPC (com fallback robusto)
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const { data, error } = await supabase.rpc("load_email_settings");

        if (error) throw error;

        if (data && data.length > 0) {
          const result = data[0];
          if (result.categories?.length > 0) setCategories(result.categories);
          else setCategories(DEFAULT_CATEGORIES);

          if (result.whitelist?.length > 0) setWhitelist(result.whitelist);
          if (result.priorities?.length > 0) setPriorities(result.priorities);
          else setPriorities(DEFAULT_PRIORITIES);

          if (result.blacklist?.length > 0) setBlacklist(result.blacklist);
        } else {
          // RPC returned empty, check localStorage
          const savedBL = localStorage.getItem("email_blacklist");
          if (savedBL) setBlacklist(JSON.parse(savedBL));
        }
      } catch (err) {
        console.error("[useEmailConfig] Error loading from Supabase:", err);
        // Fallback to localStorage
        const savedCat = localStorage.getItem("email_categories");
        const savedWL = localStorage.getItem("email_whitelist");
        const savedPri = localStorage.getItem("email_priorities");
        const savedBL = localStorage.getItem("email_blacklist");
        if (savedCat) setCategories(JSON.parse(savedCat));
        if (savedWL) setWhitelist(JSON.parse(savedWL));
        if (savedPri) setPriorities(JSON.parse(savedPri));
        if (savedBL) setBlacklist(JSON.parse(savedBL));
      } finally {
        setLoaded(true);
      }
    };

    loadConfig();
  }, []);

  // Salvar via RPC (com permissões elevadas)
  const saveCategories = async (newCategories: EmailCategory[]) => {
    setCategories(newCategories);
    try {
      const { data, error } = await supabase.rpc("save_email_settings", {
        p_categories: newCategories,
      });

      if (error) throw error;
      console.log("[useEmailConfig] Categories saved:", data);
    } catch (err) {
      console.error("[useEmailConfig] Error saving categories:", err);
      localStorage.setItem("email_categories", JSON.stringify(newCategories));
    }
  };

  const saveWhitelist = async (newWhitelist: EmailWhitelist[]) => {
    setWhitelist(newWhitelist);
    try {
      const { data, error } = await supabase.rpc("save_email_settings", {
        p_whitelist: newWhitelist,
      });

      if (error) throw error;
      console.log("[useEmailConfig] Whitelist saved:", data);
    } catch (err) {
      console.error("[useEmailConfig] Error saving whitelist:", err);
      localStorage.setItem("email_whitelist", JSON.stringify(newWhitelist));
    }
  };

  const savePriorities = async (newPriorities: EmailPriority[]) => {
    setPriorities(newPriorities);
    try {
      const { data, error } = await supabase.rpc("save_email_settings", {
        p_priorities: newPriorities,
      });

      if (error) throw error;
      console.log("[useEmailConfig] Priorities saved:", data);
    } catch (err) {
      console.error("[useEmailConfig] Error saving priorities:", err);
      localStorage.setItem("email_priorities", JSON.stringify(newPriorities));
    }
  };

  const saveBlacklist = async (newBlacklist: EmailBlacklist[]) => {
    setBlacklist(newBlacklist);
    try {
      const { data, error } = await supabase.rpc("save_email_settings", {
        p_blacklist: newBlacklist,
      });

      if (error) throw error;
      console.log("[useEmailConfig] Blacklist saved:", data);
    } catch (err) {
      console.error("[useEmailConfig] Error saving blacklist:", err);
      localStorage.setItem("email_blacklist", JSON.stringify(newBlacklist));
    }
  };

  return {
    categories,
    whitelist,
    priorities,
    blacklist,
    loaded,
    saveCategories,
    saveWhitelist,
    savePriorities,
    saveBlacklist,
  };
}
