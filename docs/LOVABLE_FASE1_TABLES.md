# Fase 1: CRM Tables - Auto-Numbering, Services, Parts Catalog

## Executar no Lovable (Supabase SQL)

### 1. Tabela: Numeração de Orçamentos
```sql
CREATE TABLE orcamento_sequences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  next_number INT NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, year)
);

CREATE INDEX idx_orcamento_sequences_user_year ON orcamento_sequences(user_id, year);

-- RLS
ALTER TABLE orcamento_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sequences" ON orcamento_sequences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own sequences" ON orcamento_sequences FOR UPDATE USING (auth.uid() = user_id);
```

### 2. Tabela: Serviços
```sql
CREATE TABLE servicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  valor_padrao DECIMAL(10,2) NOT NULL DEFAULT 0,
  unidade TEXT NOT NULL DEFAULT 'Unidade',
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_servicos_user ON servicos(user_id);
CREATE INDEX idx_servicos_ativo ON servicos(ativo);

-- RLS
ALTER TABLE servicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own services" ON servicos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own services" ON servicos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own services" ON servicos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own services" ON servicos FOR DELETE USING (auth.uid() = user_id);
```

### 3. Tabela: Peças (Catálogo)
```sql
CREATE TABLE pecas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  codigo TEXT NOT NULL,
  descricao TEXT NOT NULL,
  categoria TEXT NOT NULL,
  fabricante TEXT,
  valor_custo DECIMAL(10,2) DEFAULT 0,
  valor_venda DECIMAL(10,2) NOT NULL DEFAULT 0,
  estoque INT DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, codigo)
);

CREATE INDEX idx_pecas_user ON pecas(user_id);
CREATE INDEX idx_pecas_ativo ON pecas(ativo);
CREATE INDEX idx_pecas_codigo ON pecas(codigo);

-- RLS
ALTER TABLE pecas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own parts" ON pecas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own parts" ON pecas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own parts" ON pecas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own parts" ON pecas FOR DELETE USING (auth.uid() = user_id);
```

### 4. Atualizar: orcamentos (adicionar novos status)
```sql
ALTER TABLE orcamentos 
ADD COLUMN numero_formatado TEXT UNIQUE,
ADD COLUMN status_enum TEXT CHECK (status_enum IN ('rascunho', 'enviado', 'visualizado', 'aprovado', 'rejeitado', 'cancelado', 'faturado')) DEFAULT 'rascunho',
ADD COLUMN desconto DECIMAL(10,2) DEFAULT 0,
ADD COLUMN impostos DECIMAL(10,2) DEFAULT 0,
ADD COLUMN data_visualizacao TIMESTAMP,
ADD COLUMN data_aprovacao TIMESTAMP,
ADD COLUMN data_rejeicao TIMESTAMP,
ADD COLUMN motivo_rejeicao TEXT;

-- Migrar status antigos para novo enum
UPDATE orcamentos SET status_enum = 'rascunho' WHERE status = 'rascunho';
UPDATE orcamentos SET status_enum = 'enviado' WHERE status = 'enviado';
UPDATE orcamentos SET status_enum = 'aprovado' WHERE status = 'aprovado';
UPDATE orcamentos SET status_enum = 'faturado' WHERE status = 'pago';

-- Remover coluna antiga (opcional, manter compatibilidade por enquanto)
-- ALTER TABLE orcamentos DROP COLUMN status;
```

### 5. Atualizar: orcamento_itens (adicionar tipos)
```sql
ALTER TABLE orcamento_itens
ADD COLUMN tipo TEXT CHECK (tipo IN ('servico', 'peca')) DEFAULT 'peca',
ADD COLUMN servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
ADD COLUMN peca_id UUID REFERENCES pecas(id) ON DELETE SET NULL;

CREATE INDEX idx_orcamento_itens_servico ON orcamento_itens(servico_id);
CREATE INDEX idx_orcamento_itens_peca ON orcamento_itens(peca_id);
```

### 6. Tabela: Histórico Financeiro do Cliente
```sql
CREATE TABLE cliente_financeiro (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_orcamentos DECIMAL(10,2) DEFAULT 0,
  qtd_orcamentos INT DEFAULT 0,
  total_os DECIMAL(10,2) DEFAULT 0,
  qtd_os INT DEFAULT 0,
  total_nf DECIMAL(10,2) DEFAULT 0,
  qtd_nf INT DEFAULT 0,
  total_pago DECIMAL(10,2) DEFAULT 0,
  total_aberto DECIMAL(10,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(cliente_id)
);

CREATE INDEX idx_cliente_financeiro_user ON cliente_financeiro(user_id);

-- RLS
ALTER TABLE cliente_financeiro ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own client financial" ON cliente_financeiro FOR SELECT USING (auth.uid() = user_id);
```

---

## Dados Iniciais (Serviços Padrão)

```sql
-- Inserir serviços padrão (substitua {user_id} pelo ID do usuário)
INSERT INTO servicos (user_id, nome, categoria, valor_padrao, unidade, descricao) VALUES
('{user_id}', 'Hora Técnica Presencial', 'Serviços Técnicos', 120.00, 'Hora', 'Atendimento técnico presencial'),
('{user_id}', 'Hora Técnica Remota', 'Serviços Técnicos', 80.00, 'Hora', 'Atendimento técnico remoto'),
('{user_id}', 'Instalação de Equipamento', 'Instalação', 150.00, 'Unidade', 'Instalação de hardware/software'),
('{user_id}', 'Configuração de Rede', 'Redes', 200.00, 'Hora', 'Configuração e setup de redes'),
('{user_id}', 'Deslocamento', 'Deslocamento', 60.00, 'Unidade', 'Taxa de deslocamento'),
('{user_id}', 'Manutenção Preventiva', 'Manutenção', 300.00, 'Unidade', 'Serviço de manutenção preventiva');
```

---

## Confirmação

Após criar as tabelas, confirme que você executou tudo e avise que está pronto para prosseguir com a implementação Frontend.
