import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getServerConfig } from "../config.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Example createServerFn. Server-side handler invoked from the client:
//   const result = await getGreeting({ data: { name: "Ada" } })
// The .handler body runs server-only — imports used only inside it (like
// .server.ts modules) are tree-shaken from the client bundle. Module-level
// code here still ships to the client; for truly server-only helpers, put
// them in a .server.ts file. Use this pattern instead of Supabase Edge
// Functions for server logic.

export const getGreeting = createServerFn({ method: "POST" })
  .inputValidator(z.object({ name: z.string().min(1) }))
  .handler(async ({ data }) => {
    const config = getServerConfig();
    return {
      greeting: `Hello, ${data.name}!`,
      mode: config.nodeEnv ?? "unknown",
    };
  });

// Setup CRM Tables — admin-only
export const setupCRMTables = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!context.userId) throw new Error("Unauthorized");
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    try {
      console.log("🚀 Iniciando criação de tabelas CRM...");

      const sql = `
        -- 1. CLIENTES
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

        -- 2. ORCAMENTOS
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

        -- 3. PAGAMENTOS
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

        -- 4. EMAIL_LOGS
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

        -- 5. NOTAS_FISCAIS
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

        -- 6. ALERTAS
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

      const { error } = await (supabaseAdmin.rpc as unknown as (fn: string, args: Record<string, unknown>) => Promise<{ error: unknown }>)("execute_sql", { sql });

      if (error) {
        console.error("❌ Erro ao criar tabelas:", error);
        throw error;
      }

      console.log("✅ Todas as tabelas criadas com sucesso!");
      return {
        success: true,
        message: "✅ Todas as tabelas do CRM foram criadas com sucesso!",
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
      console.error("❌ Erro ao criar tabelas:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erro desconhecido",
      };
    }
  });
