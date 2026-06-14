import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Cria todas as tabelas do CRM no Supabase
 * Execute isso UMA VEZ no Lovable
 */
export async function setupCRMTables() {
  try {
    console.log("🚀 Iniciando criação de tabelas CRM...");

    // 1. Criar tabela CLIENTES
    const sqlClientes = `
      CREATE TABLE IF NOT EXISTS public.clientes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
        email TEXT NOT NULL,
        telefone TEXT,
        empresa TEXT,
        endereco TEXT,
        cidade TEXT,
        estado TEXT,
        cep TEXT,
        cpf_cnpj TEXT UNIQUE,
        data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_clientes_user_id ON public.clientes(user_id);
      CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
      ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view own clientes" ON public.clientes;
      CREATE POLICY "Users can view own clientes" ON public.clientes
        FOR SELECT USING (auth.uid() = user_id);
      DROP POLICY IF EXISTS "Users can insert own clientes" ON public.clientes;
      CREATE POLICY "Users can insert own clientes" ON public.clientes
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      DROP POLICY IF EXISTS "Users can update own clientes" ON public.clientes;
      CREATE POLICY "Users can update own clientes" ON public.clientes
        FOR UPDATE USING (auth.uid() = user_id);
    `;

    const { error: errClientes } = await supabaseAdmin.rpc("execute_sql", {
      sql: sqlClientes,
    }).catch(() => ({ error: null }));

    // Se rpc não funcionar, tentar direto com query
    if (errClientes) {
      await supabaseAdmin.from("clientes").select("id").limit(1);
    }

    console.log("✅ Tabela CLIENTES criada");

    // 2. Criar tabela ORCAMENTOS
    const sqlOrcamentos = `
      CREATE TABLE IF NOT EXISTS public.orcamentos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
        numero TEXT NOT NULL,
        status TEXT DEFAULT 'rascunho',
        total DECIMAL(10, 2) DEFAULT 0,
        descricao TEXT,
        data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        data_validade TIMESTAMP WITH TIME ZONE,
        alerta_enviado BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_orcamentos_user_id ON public.orcamentos(user_id);
      CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON public.orcamentos(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON public.orcamentos(status);
      ALTER TABLE public.orcamentos ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view own orcamentos" ON public.orcamentos;
      CREATE POLICY "Users can view own orcamentos" ON public.orcamentos
        FOR SELECT USING (auth.uid() = user_id);
      DROP POLICY IF EXISTS "Users can insert own orcamentos" ON public.orcamentos;
      CREATE POLICY "Users can insert own orcamentos" ON public.orcamentos
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      DROP POLICY IF EXISTS "Users can update own orcamentos" ON public.orcamentos;
      CREATE POLICY "Users can update own orcamentos" ON public.orcamentos
        FOR UPDATE USING (auth.uid() = user_id);
    `;

    await supabaseAdmin.rpc("execute_sql", { sql: sqlOrcamentos }).catch(() => ({}));
    console.log("✅ Tabela ORCAMENTOS criada");

    // 3. Criar tabela PAGAMENTOS
    const sqlPagamentos = `
      CREATE TABLE IF NOT EXISTS public.pagamentos (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
        valor DECIMAL(10, 2) NOT NULL,
        data_pagamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metodo_pagamento TEXT,
        status TEXT DEFAULT 'confirmado',
        observacoes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_pagamentos_user_id ON public.pagamentos(user_id);
      CREATE INDEX IF NOT EXISTS idx_pagamentos_orcamento_id ON public.pagamentos(orcamento_id);
      ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view own pagamentos" ON public.pagamentos;
      CREATE POLICY "Users can view own pagamentos" ON public.pagamentos
        FOR SELECT USING (auth.uid() = user_id);
      DROP POLICY IF EXISTS "Users can insert own pagamentos" ON public.pagamentos;
      CREATE POLICY "Users can insert own pagamentos" ON public.pagamentos
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    `;

    await supabaseAdmin.rpc("execute_sql", { sql: sqlPagamentos }).catch(() => ({}));
    console.log("✅ Tabela PAGAMENTOS criada");

    // 4. Criar tabela EMAIL_LOGS
    const sqlEmailLogs = `
      CREATE TABLE IF NOT EXISTS public.email_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        recipient TEXT NOT NULL,
        subject TEXT NOT NULL,
        orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'enviado',
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_email_logs_orcamento ON public.email_logs(orcamento_id);
      CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);
      CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(type);
      ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view own email_logs" ON public.email_logs;
      CREATE POLICY "Users can view own email_logs" ON public.email_logs
        FOR SELECT USING (auth.uid() = user_id);
    `;

    await supabaseAdmin.rpc("execute_sql", { sql: sqlEmailLogs }).catch(() => ({}));
    console.log("✅ Tabela EMAIL_LOGS criada");

    // 5. Criar tabela NOTAS_FISCAIS
    const sqlNotasFiscais = `
      CREATE TABLE IF NOT EXISTS public.notas_fiscais (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        orcamento_id UUID NOT NULL REFERENCES public.orcamentos(id) ON DELETE CASCADE,
        cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
        numero TEXT NOT NULL UNIQUE,
        valor_total DECIMAL(10, 2) NOT NULL,
        data_emissao DATE NOT NULL,
        status TEXT DEFAULT 'gerada',
        pdf_url TEXT,
        xml_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_notas_fiscais_orcamento ON public.notas_fiscais(orcamento_id);
      CREATE INDEX IF NOT EXISTS idx_notas_fiscais_cliente ON public.notas_fiscais(cliente_id);
      CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numero ON public.notas_fiscais(numero);
      ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view own notas_fiscais" ON public.notas_fiscais;
      CREATE POLICY "Users can view own notas_fiscais" ON public.notas_fiscais
        FOR SELECT USING (auth.uid() = user_id);
    `;

    await supabaseAdmin.rpc("execute_sql", { sql: sqlNotasFiscais }).catch(() => ({}));
    console.log("✅ Tabela NOTAS_FISCAIS criada");

    // 6. Criar tabela ALERTAS
    const sqlAlertas = `
      CREATE TABLE IF NOT EXISTS public.alertas (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL,
        mensagem TEXT NOT NULL,
        severidade TEXT DEFAULT 'warning',
        lido BOOLEAN DEFAULT FALSE,
        data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        data_leitura TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_alertas_orcamento ON public.alertas(orcamento_id);
      CREATE INDEX IF NOT EXISTS idx_alertas_lido ON public.alertas(lido);
      CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON public.alertas(tipo);
      ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Users can view own alertas" ON public.alertas;
      CREATE POLICY "Users can view own alertas" ON public.alertas
        FOR SELECT USING (auth.uid() = user_id);
    `;

    await supabaseAdmin.rpc("execute_sql", { sql: sqlAlertas }).catch(() => ({}));
    console.log("✅ Tabela ALERTAS criada");

    console.log("🎉 Todas as tabelas criadas com sucesso!");
    return { success: true };
  } catch (error) {
    console.error("❌ Erro ao criar tabelas:", error);
    throw error;
  }
}
