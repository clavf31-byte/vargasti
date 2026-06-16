# Teste Completo do Fluxo de Orçamentos - Fase 2

## 🎯 Objetivo
Validar o fluxo completo de orçamentos: Criar → Enviar → Aprovar → Converter OS → Gerar NF

---

## ✅ Checklist de Teste

### 1️⃣ Criar Orçamento (Fase 1 - Já testado)
- [ ] Navegar para `/crm/orcamentos`
- [ ] Clicar "Novo Orçamento"
- [ ] Preencher dados:
  - Cliente: "Teste Cliente"
  - Itens: Adicionar 2 itens (1 Serviço, 1 Peça)
  - Desconto: R$ 50
  - Impostos: R$ 100
- [ ] Verificar número auto-gerado (ORC-2026-XXXXXX)
- [ ] Salvar orçamento
- [ ] **Esperado:** Status = "Rascunho"

---

### 2️⃣ Enviar por Email (Fase 2 - NOVO)
- [ ] Clicar botão "Enviar por Email"
- [ ] **Esperado:**
  - Status muda para "Enviado"
  - Link de aprovação gerado (exibido na página)
  - Email template mostrado (não envia de verdade, apenas simula)

**Link deve estar no formato:**
```
http://localhost:5500/orcamento/approve/{token}
```

---

### 3️⃣ Página de Aprovação Pública (Fase 2 - NOVO)
- [ ] Copiar o link de aprovação da página anterior
- [ ] Abrir em **aba incógnita** (simular cliente externo, sem autenticação)
- [ ] URL: `/orcamento/approve/{token}`

**Esperado - Tela carrega com:**
- [ ] Dados do orçamento visíveis
- [ ] Resumo: cliente, valor total, itens listados
- [ ] Dois botões: "Aprovar" e "Rejeitar"

**Teste Aprovação:**
- [ ] Clicar "Aprovar Orçamento"
- [ ] **Esperado:**
  - Página muda para "Orçamento Aprovado ✓"
  - Mensagem de sucesso
  - Resume com o número do orçamento

**Teste Rejeição:**
- [ ] (Em outro orçamento) Clicar "Rejeitar"
- [ ] Digitar motivo: "Preço acima do orçado"
- [ ] Clicar "Rejeitar Orçamento"
- [ ] **Esperado:**
  - Página muda para "Orçamento Rejeitado"
  - Motivo exibido

---

### 4️⃣ Voltar à Página de Detalhes (Fase 2)
- [ ] Volta no navegador para a página de detalhes do orçamento
- [ ] **Esperado:**
  - Status agora é "Aprovado" (ou "Rejeitado")
  - Seção "Status de Aprovação" mostra:
    - ✓ "Aprovado em DD/MM/YYYY"
    - Ou ❌ "Rejeitado"
  - Badge visual atualizada

---

### 5️⃣ Converter em Ordem de Serviço (Fase 2 - NOVO)
- [ ] (Com orçamento aprovado) Clicar "Converter em OS"
- [ ] **Esperado:**
  - Botão muda para "Criando..."
  - Mensagem: "✅ Ordem de Serviço criada: OS-2026-XXXXXX"
  - Status do orçamento muda para "Faturado"

**Verificar criação da OS:**
- [ ] Navegar para `/crm/tarefas`
- [ ] **Esperado:**
  - OS criada está listada
  - Itens copiados do orçamento
  - Cliente vinculado

---

### 6️⃣ Gerar Nota Fiscal (Fase 2 - NOVO)
- [ ] Voltar para página do orçamento (aprovado)
- [ ] Clicar "Gerar Nota Fiscal"
- [ ] **Esperado:**
  - Botão muda para "Gerando..."
  - Mensagem: "✅ Nota Fiscal criada: XXXXXXXX"
  - Status permanece "Faturado"

**Verificar NF no banco:**
- [ ] Banco de dados (Supabase)
- [ ] Tabela `notas_fiscais` deve ter novo registro com:
  - `numero_nfe`: XXXXXXXX
  - `valor_total`: R$ (do orçamento)
  - `status`: "rascunho"

---

### 7️⃣ Download do PDF (Fase 2 - APRIMORADO)
- [ ] Clicar "Gerar PDF"
- [ ] **Esperado:**
  - Arquivo baixado: `VargasTI_[Cliente]_Orcamento-[Numero]_[Data].pdf`
  - PDF abre com:
    - ✅ Cabeçalho VargasTI
    - ✅ Dados do cliente
    - ✅ Itens categorizados
    - ✅ Subtotal, Desconto, Impostos, Total
    - ✅ **NOVO:** Seção "Aprovação Online" com link
    - ✅ **NOVO:** Área de assinatura do cliente

---

## 🔄 Fluxo Alternativo: Rejeitar

Se quiser testar rejeição:

1. Criar novo orçamento
2. Enviar por email (gera link)
3. Na página pública (`/approve/{token}`), rejeitar com motivo
4. Voltar à página de detalhes
5. **Esperado:**
   - Status = "Rejeitado"
   - Botões "Converter OS" e "Gerar NF" desaparecem
   - Badge vermelha mostrando rejeição

---

## 📊 Dados de Teste Recomendados

### Cliente Teste
```
Nome: João da Silva
Email: joao@empresa.com.br
Telefone: (51) 9999-8888
Endereço: Rua Teste, 123
Cidade: Porto Alegre
Estado: RS
```

### Orçamento Teste
```
Cliente: João da Silva
Data Vencimento: (30 dias)
Desconto: R$ 100.00
Impostos: R$ 250.00

Itens:
  1. Hora Técnica Presencial (Serviço)
     - Qtd: 4h
     - Valor: R$ 120/h
     - Subtotal: R$ 480

  2. Memória RAM 8GB (Peça)
     - Qtd: 1
     - Valor: R$ 350
     - Subtotal: R$ 350

Subtotal: R$ 830
Desconto: -R$ 100
Impostos: +R$ 250
Total: R$ 980
```

---

## 🐛 Possíveis Problemas & Soluções

| Problema | Causa | Solução |
|----------|-------|---------|
| Link de aprovação não gerado | Token não salvo | Verificar Supabase: tabela `orcamentos` coluna `approval_token` |
| Página `/approve/{token}` branca | Supabase query falhou | Verificar console do navegador, verificar RLS policies |
| Botão "Converter OS" cinzento | Status não é "aprovado" | Verificar em Supabase: `approval_status` deve ser "approved" |
| NF não aparece | Insert falhou | Verificar console, verificar RLS na tabela `notas_fiscais` |
| PDF não baixa | jsPDF erro | Abrir console F12, verificar erros de PDF |

---

## ✨ Checklist Final (Completo = Fase 2 OK)

- [ ] Orçamento criado com auto-numeração
- [ ] Email enviado com link gerado
- [ ] Cliente acessa link público sem autenticação
- [ ] Cliente aprova/rejeita com sucesso
- [ ] Status atualiza em tempo real
- [ ] OS criada automaticamente com itens
- [ ] NF criada automaticamente com valores
- [ ] PDF inclui seção de aprovação
- [ ] Todos os botões funcionam
- [ ] Supabase atualizado corretamente

---

## 🚀 Se Tudo Passar

Sistema pronto para produção! ✅

---

## 📝 Relatório de Teste

Após completar todos os testes, report:

```
Teste de Fase 2 - [DATA]

Resultado Geral: ✅ PASSOU / ❌ FALHOU

Testes Concluídos:
- [ ] 1. Criar Orçamento
- [ ] 2. Enviar por Email
- [ ] 3. Aprovação Pública
- [ ] 4. Rejeição
- [ ] 5. Converter OS
- [ ] 6. Gerar NF
- [ ] 7. Download PDF

Problemas Encontrados:
(nenhum / lista aqui)

Observações:
(qualquer feedback)
```

---

**Pronto para começar os testes?** 🧪
