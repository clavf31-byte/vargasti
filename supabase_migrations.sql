-- ============================================
-- VARGASTI CRM - AUTOMAÇÕES
-- Crie as tabelas para emails, notas fiscais e alertas
-- ============================================

-- 1. TABELA: EMAIL_LOGS
-- Rastreia todos os emails enviados pelo sistema
CREATE TABLE IF NOT EXISTS public.email_logs (
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
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs(recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(type);

-- 2. TABELA: NOTAS_FISCAIS
-- Armazena informações das Notas Fiscais geradas
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
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
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_cliente ON public.notas_fiscais(cliente_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_numero ON public.notas_fiscais(numero);

-- 3. TABELA: ALERTAS
-- Alertas do sistema (vencimentos, atrasos, etc)
CREATE TABLE IF NOT EXISTS public.alertas (
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
CREATE INDEX IF NOT EXISTS idx_alertas_lido ON public.alertas(lido);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo ON public.alertas(tipo);

-- 4. ALTERAR TABELA: ORCAMENTOS
-- Adicionar coluna para rastrear se alerta foi enviado
ALTER TABLE IF EXISTS public.orcamentos
ADD COLUMN IF NOT EXISTS alerta_enviado BOOLEAN DEFAULT FALSE;

-- 5. HABILITAR RLS (Row Level Security)
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alertas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Pronto! As tabelas foram criadas com sucesso
-- ============================================
