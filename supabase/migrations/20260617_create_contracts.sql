-- Contract Templates (Modelos de Contrato)
CREATE TABLE contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  conteudo TEXT NOT NULL, -- HTML/Text template com variáveis {{cliente_nome}}, {{data}}, etc
  variaveis JSONB DEFAULT '[]'::jsonb, -- Lista de variáveis esperadas: ["cliente_nome", "data_inicio", ...]
  arquivo_url TEXT, -- URL do arquivo template (PDF ou similar)
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, nome)
);

-- Contracts (Contratos Confeccionados)
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES contract_templates(id) ON DELETE RESTRICT,

  titulo TEXT NOT NULL,
  descricao TEXT,
  conteudo_preenchido TEXT, -- Conteúdo com variáveis já substituídas
  dados JSONB DEFAULT '{}'::jsonb, -- {"cliente_nome": "...", "data_inicio": "...", ...}

  status TEXT DEFAULT 'rascunho', -- rascunho, enviado, assinado
  email_enviado_para TEXT,
  email_enviado_em TIMESTAMP,
  arquivo_url TEXT, -- URL do PDF gerado
  arquivo_assinado_url TEXT, -- URL do PDF assinado que cliente enviou
  assinado_em TIMESTAMP,
  token_assinatura TEXT UNIQUE, -- Token seguro para validação

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Contract History (Auditoria)
CREATE TABLE contract_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  acao TEXT NOT NULL, -- criado, enviado, assinado, arquivo_recebido
  detalhes JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contracts_user_id ON contracts(user_id);
CREATE INDEX idx_contracts_cliente_id ON contracts(cliente_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_token ON contracts(token_assinatura);
CREATE INDEX idx_contract_templates_user_id ON contract_templates(user_id);
