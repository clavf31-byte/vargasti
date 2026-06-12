import { useState, useEffect } from "react";

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

const DEFAULT_WHITELIST: EmailWhitelist[] = [];

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
  const [whitelist, setWhitelist] = useState<EmailWhitelist[]>(DEFAULT_WHITELIST);
  const [priorities, setPriorities] = useState<EmailPriority[]>(DEFAULT_PRIORITIES);
  const [loaded, setLoaded] = useState(false);

  // Carregar do localStorage
  useEffect(() => {
    const savedCategories = localStorage.getItem("email_categories");
    const savedWhitelist = localStorage.getItem("email_whitelist");
    const savedPriorities = localStorage.getItem("email_priorities");

    if (savedCategories) setCategories(JSON.parse(savedCategories));
    if (savedWhitelist) setWhitelist(JSON.parse(savedWhitelist));
    if (savedPriorities) setPriorities(JSON.parse(savedPriorities));

    setLoaded(true);
  }, []);

  // Salvar no localStorage
  const saveCategories = (newCategories: EmailCategory[]) => {
    setCategories(newCategories);
    localStorage.setItem("email_categories", JSON.stringify(newCategories));
  };

  const saveWhitelist = (newWhitelist: EmailWhitelist[]) => {
    setWhitelist(newWhitelist);
    localStorage.setItem("email_whitelist", JSON.stringify(newWhitelist));
  };

  const savePriorities = (newPriorities: EmailPriority[]) => {
    setPriorities(newPriorities);
    localStorage.setItem("email_priorities", JSON.stringify(newPriorities));
  };

  return {
    categories,
    whitelist,
    priorities,
    loaded,
    saveCategories,
    saveWhitelist,
    savePriorities,
  };
}
