# Fase 2: Automation & Workflow - Database Setup

Execute no Lovable (Supabase SQL)

---

## 1. Tabela: Links de Aprovação
```sql
CREATE TABLE orcamento_approval_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orcamento_id UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  token VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  expires_at TIMESTAMP DEFAULT (now() + interval '30 days'),
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_approval_links_token ON orcamento_approval_links(token);
CREATE INDEX idx_approval_links_orcamento ON orcamento_approval_links(orcamento_id);

ALTER TABLE orcamento_approval_links ENABLE ROW LEVEL SECURITY;
-- Public policy para acessar por token (sem auth)
CREATE POLICY "Anyone can view by token" ON orcamento_approval_links 
  FOR SELECT USING (true);
```

---

## 2. Tabela: Ordens de Serviço
```sql
CREATE TABLE ordens_servico (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  orcamento_id UUID REFERENCES orcamentos(id) ON DELETE SET NULL,
  numero_formatado TEXT UNIQUE,
  descricao TEXT,
  status VARCHAR(20) DEFAULT 'aberta', -- aberta, em_andamento, concluida, cancelada
  prioridade VARCHAR(20) DEFAULT 'normal',
  data_inicio DATE,
  data_conclusao DATE,
  responsavel_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  anotacoes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_os_user ON ordens_servico(user_id);
CREATE INDEX idx_os_cliente ON ordens_servico(cliente_id);
CREATE INDEX idx_os_orcamento ON ordens_servico(orcamento_id);

ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own OS" ON ordens_servico FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own OS" ON ordens_servico FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own OS" ON ordens_servico FOR UPDATE USING (auth.uid() = user_id);
```

---

## 3. Tabela: Items da OS
```sql
CREATE TABLE os_itens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  os_id UUID NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL, -- servico, peca
  servico_id UUID REFERENCES servicos(id) ON DELETE SET NULL,
  peca_id UUID REFERENCES pecas(id) ON DELETE SET NULL,
  quantidade NUMERIC(10,2),
  preco_unitario NUMERIC(10,2),
  subtotal NUMERIC(10,2),
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_os_itens_os ON os_itens(os_id);
CREATE INDEX idx_os_itens_servico ON os_itens(servico_id);
CREATE INDEX idx_os_itens_peca ON os_itens(peca_id);
```

---

## 4. Tabela: Notas Fiscais (NFe)
```sql
CREATE TABLE notas_fiscais (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  orcamento_id UUID REFERENCES orcamentos(id) ON DELETE SET NULL,
  os_id UUID REFERENCES ordens_servico(id) ON DELETE SET NULL,
  numero_nfe TEXT UNIQUE,
  serie_nfe INT,
  data_emissao DATE,
  data_saida DATE,
  valor_subtotal NUMERIC(10,2),
  valor_desconto NUMERIC(10,2) DEFAULT 0,
  valor_impostos NUMERIC(10,2) DEFAULT 0,
  valor_total NUMERIC(10,2),
  status VARCHAR(20) DEFAULT 'rascunho', -- rascunho, emitida, cancelada
  chave_acesso VARCHAR(44),
  protocolo_autorizacao VARCHAR(20),
  xml_nfe TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_nf_user ON notas_fiscais(user_id);
CREATE INDEX idx_nf_cliente ON notas_fiscais(cliente_id);
CREATE INDEX idx_nf_orcamento ON notas_fiscais(orcamento_id);

ALTER TABLE notas_fiscais ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own NF" ON notas_fiscais FOR SELECT USING (auth.uid() = user_id);
```

---

## 5. Tabela: Histórico de Status (Audit)
```sql
CREATE TABLE orcamento_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  orcamento_id UUID NOT NULL REFERENCES orcamentos(id) ON DELETE CASCADE,
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50) NOT NULL,
  motivo TEXT,
  alterado_por UUID REFERENCES profiles(id),
  data_alteracao TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_status_hist_orcamento ON orcamento_status_history(orcamento_id);
```

---

## 6. Atualizar: orcamentos (adicionar approval_token)
```sql
ALTER TABLE orcamentos
ADD COLUMN approval_token VARCHAR(64) UNIQUE,
ADD COLUMN approval_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
ADD COLUMN approved_at TIMESTAMP,
ADD COLUMN rejected_at TIMESTAMP;
```

---

## 7. Funções Utilitárias

### Gerar Token de Aprovação
```sql
CREATE OR REPLACE FUNCTION gerar_approval_token()
RETURNS VARCHAR AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;
```

### Atualizar cliente_financeiro após mudança de status
```sql
CREATE OR REPLACE FUNCTION atualizar_financeiro_orcamento()
RETURNS TRIGGER AS $$
BEGIN
  -- Incrementar qtd_orcamentos se novo
  IF NEW.status_enum = 'aprovado' AND OLD.status_enum != 'aprovado' THEN
    UPDATE cliente_financeiro
    SET total_orcamentos = COALESCE(total_orcamentos, 0) + NEW.total
    WHERE cliente_id = NEW.cliente_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_orcamento_financeiro
AFTER INSERT OR UPDATE ON orcamentos
FOR EACH ROW
EXECUTE FUNCTION atualizar_financeiro_orcamento();
```

---

## Resumo de Novas Colunas/Tabelas

| Tabela | Tipo | Descrição |
|--------|------|-----------|
| orcamento_approval_links | Nova | Links públicos de aprovação |
| ordens_servico | Nova | Work orders geradas de orçamentos |
| os_itens | Nova | Itens da OS |
| notas_fiscais | Nova | Invoices/NFe |
| orcamento_status_history | Nova | Audit trail |
| orcamentos | Update | approval_token, approval_status, datas |

---

## Confirmação

Após criar tudo, confirme que:
- [ ] orcamento_approval_links criada
- [ ] ordens_servico criada
- [ ] os_itens criada
- [ ] notas_fiscais criada
- [ ] orcamento_status_history criada
- [ ] orcamentos atualizada com approval fields
- [ ] RLS policies aplicadas
- [ ] Triggers criados

**Avisa quando terminar!**
