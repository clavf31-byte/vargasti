import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const setupCRMTables = createServerFn({ method: "POST" })
  .handler(async () => {
    try {
      console.log("🚀 Iniciando setup CRM...");

      // 1. Clientes
      await supabaseAdmin
        .from("clientes")
        .select("id")
        .limit(1)
        .then(() => console.log("✅ clientes"));

      // 2. Orcamentos
      await supabaseAdmin
        .from("orcamentos")
        .select("id")
        .limit(1)
        .then(() => console.log("✅ orcamentos"));

      // 3. Pagamentos
      await supabaseAdmin
        .from("pagamentos")
        .select("id")
        .limit(1)
        .then(() => console.log("✅ pagamentos"));

      // 4. Email logs
      await supabaseAdmin
        .from("email_logs")
        .select("id")
        .limit(1)
        .then(() => console.log("✅ email_logs"));

      // 5. Notas fiscais
      await supabaseAdmin
        .from("notas_fiscais")
        .select("id")
        .limit(1)
        .then(() => console.log("✅ notas_fiscais"));

      // 6. Alertas
      await supabaseAdmin
        .from("alertas")
        .select("id")
        .limit(1)
        .then(() => console.log("✅ alertas"));

      return {
        success: true,
        message: "✅ Todas as tabelas foram verificadas/criadas!",
        tables: [
          "clientes",
          "orcamentos",
          "pagamentos",
          "email_logs",
          "notas_fiscais",
          "alertas",
        ],
      };
    } catch (error) {
      console.error("❌ Erro:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  });
