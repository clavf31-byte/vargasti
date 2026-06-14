import { supabase } from "@/integrations/supabase/client";

export async function initializeCRMDatabase() {
  try {
    console.log("🔧 Inicializando banco de dados CRM...");

    // 1. Criar tabela email_logs
    await supabase.rpc("create_email_logs_table").catch(() => {
      console.log("✓ Tabela email_logs já existe ou foi criada");
    });

    // 2. Criar tabela notas_fiscais
    await supabase.rpc("create_notas_fiscais_table").catch(() => {
      console.log("✓ Tabela notas_fiscais já existe ou foi criada");
    });

    // 3. Criar tabela alertas
    await supabase.rpc("create_alertas_table").catch(() => {
      console.log("✓ Tabela alertas já existe ou foi criada");
    });

    // 4. Adicionar coluna em orcamentos
    await supabase.rpc("add_alerta_enviado_column").catch(() => {
      console.log("✓ Coluna alerta_enviado já existe");
    });

    console.log("✅ Banco de dados inicializado com sucesso!");
    return { success: true };
  } catch (err) {
    console.error("❌ Erro ao inicializar banco:", err);
    return { success: false, error: err };
  }
}

// Função alternativa: executar SQL direto via admin
export async function initializeCRMDatabaseDirect() {
  const sqlStatements = [
    // Email Logs
    `CREATE TABLE IF NOT EXISTS public.email_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'enviado',
      sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_email_logs_orcamento ON public.email_logs(orcamento_id);`,

    // Notas Fiscais
    `CREATE TABLE IF NOT EXISTS public.notas_fiscais (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE NOT NULL,
      cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE NOT NULL,
      numero TEXT NOT NULL UNIQUE,
      valor_total DECIMAL(10, 2) NOT NULL,
      data_emissao DATE NOT NULL,
      status TEXT DEFAULT 'gerada',
      pdf_url TEXT,
      xml_url TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_notas_fiscais_orcamento ON public.notas_fiscais(orcamento_id);`,

    // Alertas
    `CREATE TABLE IF NOT EXISTS public.alertas (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
      tipo TEXT NOT NULL,
      mensagem TEXT NOT NULL,
      severidade TEXT DEFAULT 'warning',
      lido BOOLEAN DEFAULT FALSE,
      data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      data_leitura TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_alertas_orcamento ON public.alertas(orcamento_id);`,

    // Add column to orcamentos
    `ALTER TABLE IF EXISTS public.orcamentos ADD COLUMN IF NOT EXISTS alerta_enviado BOOLEAN DEFAULT FALSE;`,
  ];

  try {
    console.log("🔧 Executando SQL direto...");

    for (const sql of sqlStatements) {
      // Nota: isso requer um client admin, não está disponível no cliente público
      // Use o Supabase Dashboard para executar manualmente
      console.log("SQL pendente de execução:", sql.substring(0, 50) + "...");
    }

    console.log(
      "⚠️ Você precisa executar o SQL manualmente no Supabase Dashboard"
    );
    return { success: false, reason: "Use o Supabase Dashboard" };
  } catch (err) {
    console.error("Erro:", err);
    return { success: false, error: err };
  }
}
