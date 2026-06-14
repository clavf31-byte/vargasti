#!/usr/bin/env node

/**
 * Script para gerar tabelas de automações do CRM no Supabase
 *
 * Uso:
 *   npx node scripts/generate-crm-tables.js
 *
 * Você será solicitado a entrar com:
 * - SUPABASE_URL
 * - SUPABASE_ADMIN_KEY (pode ser obtida em Project Settings > API)
 */

const fs = require('fs');
const path = require('path');

// SQL statements to execute
const SQL_STATEMENTS = [
  {
    name: 'email_logs',
    sql: `CREATE TABLE IF NOT EXISTS public.email_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      subject TEXT NOT NULL,
      orcamento_id UUID REFERENCES public.orcamentos(id) ON DELETE CASCADE,
      status TEXT DEFAULT 'enviado',
      sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_email_logs_orcamento ON public.email_logs(orcamento_id);
    CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);`
  },
  {
    name: 'notas_fiscais',
    sql: `CREATE TABLE IF NOT EXISTS public.notas_fiscais (
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
    CREATE INDEX IF NOT EXISTS idx_notas_fiscais_orcamento ON public.notas_fiscais(orcamento_id);
    CREATE INDEX IF NOT EXISTS idx_notas_fiscais_cliente ON public.notas_fiscais(cliente_id);`
  },
  {
    name: 'alertas',
    sql: `CREATE TABLE IF NOT EXISTS public.alertas (
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
    CREATE INDEX IF NOT EXISTS idx_alertas_orcamento ON public.alertas(orcamento_id);
    CREATE INDEX IF NOT EXISTS idx_alertas_lido ON public.alertas(lido);`
  },
  {
    name: 'coluna_alerta_enviado',
    sql: `ALTER TABLE IF EXISTS public.orcamentos ADD COLUMN IF NOT EXISTS alerta_enviado BOOLEAN DEFAULT FALSE;`
  }
];

async function executeSQL() {
  try {
    console.log('🔧 VargasTI - Gerador de Tabelas CRM\n');

    // Get credentials from .env file
    const envPath = path.resolve(__dirname, '..', '.env.local');
    let supabaseUrl = process.env.VITE_SUPABASE_URL;
    let supabaseAdminKey = process.env.SUPABASE_ADMIN_KEY;

    if (!supabaseUrl || !supabaseAdminKey) {
      console.log('⚠️  Credenciais não encontradas em variáveis de ambiente.');
      console.log('\n📝 Para executar este script, você precisa:');
      console.log('   1. Criar um arquivo .env.local com:');
      console.log('      VITE_SUPABASE_URL=sua_url_aqui');
      console.log('      SUPABASE_ADMIN_KEY=sua_chave_aqui');
      console.log('\n   Ou executar manualmente:');
      console.log('   1. Abra: https://app.supabase.com');
      console.log('   2. Selecione seu projeto');
      console.log('   3. Vá para SQL Editor');
      console.log('   4. Abra o arquivo: supabase_migrations.sql');
      console.log('   5. Clique em Run\n');
      process.exit(1);
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseAdminKey);

    console.log('✓ Conectado ao Supabase\n');
    console.log('📊 Criando tabelas...\n');

    for (const statement of SQL_STATEMENTS) {
      try {
        console.log(`⏳ Criando ${statement.name}...`);

        const { error } = await supabase.rpc('exec_sql', {
          sql: statement.sql
        });

        if (error && error.code !== 'PGRST100') {
          throw error;
        }

        console.log(`✅ ${statement.name} criada com sucesso!\n`);
      } catch (err) {
        console.log(`⚠️  ${statement.name}: ${err.message}\n`);
      }
    }

    console.log('\n✅ Processo concluído!');
    console.log('\n📋 Proximas etapas:');
    console.log('   1. Crie um cliente no /crm/clientes');
    console.log('   2. Crie um orçamento no /crm/orcamentos');
    console.log('   3. Teste as automações!');

  } catch (err) {
    console.error('❌ Erro:', err.message);
    process.exit(1);
  }
}

executeSQL();
