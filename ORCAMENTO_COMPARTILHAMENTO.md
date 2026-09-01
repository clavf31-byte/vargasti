# 📱 Compartilhamento de Orçamentos - Guia Completo

## ✨ O que foi implementado

Um sistema robusto e profissional para compartilhar orçamentos com clientes através de múltiplos canais.

### Canais Disponíveis

| Canal | Funcionalidade | Requisito |
|-------|-----------------|-----------|
| **WhatsApp** | Envia mensagem pré-formatada direto para o cliente | Telefone cadastrado |
| **Email** | Compartilha via cliente de email padrão | Email cadastrado |
| **SMS** | Envia link via mensagem de texto | Telefone cadastrado |
| **QR Code** | Gera QR code do link para compartilhamento presencial | Nenhum |

---

## 🎯 Fluxo de Uso

```
1. Visualizar Orçamento
    ↓
2. Clicar botão "Compartilhar"
    ↓
3. Modal se abre com todas as opções
    ↓
4. Escolher canal (WhatsApp, Email, SMS ou Copiar Link)
    ↓
5. Sistema registra compartilhamento no banco
    ↓
6. Cliente recebe mensagem com link de aprovação
```

---

## 🔧 Arquivos Modificados/Criados

### 1. **`src/hooks/useOrcamentoCompartilhamento.ts`** (NOVO)
Hook que gerencia toda a lógica de compartilhamento.

**Funções principais:**
- `rastrearCompartilhamento()` - Registra cada compartilhamento no banco
- `gerarMensagemProfissional()` - Cria mensagem formatada e profissional
- `construirUrlWhatsApp()` - Monta URL com mensagem e telefone
- `construirUrlSMS()` - Monta link SMS com mensagem curta
- `gerarTextoCompartilhamento()` - Cria texto simples para copiar

### 2. **`src/components/crm/OrcamentoCompartilhamento.tsx`** (NOVO)
Componente modal elegante que exibe:
- **QR Code** do link de aprovação (pode ser baixado)
- **Link direto** copiável
- **Botões de compartilhamento** (WhatsApp, Email, SMS)
- **Preview da mensagem** que será enviada

### 3. **`src/routes/crm.orcamentos.$id.tsx`** (ATUALIZADO)
- Botão "Compartilhar" replaces "Enviar por Email"
- Integração com novo modal
- Importação do novo componente

### 4. **`package.json`** (ATUALIZADO)
- Adicionada dependência: `qrcode.react@^1.0.1`

### 5. **`supabase/migrations/add_orcamento_compartilhamento.sql`** (NOVO)
Cria tabela `orcamento_compartilhamento` para rastreamento:
- Registra que, quando e como foi compartilhado
- Índices para performance
- Row Level Security (RLS) ativado

---

## 📊 Recurso de Rastreamento

### O que é registrado?

Cada vez que um orçamento é compartilhado, o sistema registra:

```json
{
  "orcamento_id": "uuid",
  "cliente_id": "uuid",
  "canal": "whatsapp",           // whatsapp, email, sms, qrcode
  "status": "enviado",            // enviado, visualizado, clicado, aprovado, rejeitado
  "enviado_em": "2026-09-01T14:30:00Z",
  "visualizado_em": null,
  "clicado_em": null
}
```

### Possibilidades Futuras

- Rastreamento de visualizações (Webhook)
- Estatísticas de conversão por canal
- Lembretes automáticos se não visualizar
- Analytics de taxa de aprovação

---

## 🎨 Interface - Fluxo Visual

```
┌─────────────────────────────────────────────┐
│   Orçamento #2024-001                       │
│   Cliente: João Silva                       │
│   Valor: R$ 5.500,00                        │
│                                              │
│   [Editar] [Compartilhar] [PDF] [OS]        │
│                ↓ click                        │
│   ┌──────────────────────────────────────┐  │
│   │ Compartilhar Orçamento       [X]     │  │
│   │                                       │  │
│   │ QR Code                               │  │
│   │ ┌─────────────────────────┐          │  │
│   │ │   [QR CODE IMAGE]       │          │  │
│   │ │                         │          │  │
│   │ └─────────────────────────┘          │  │
│   │ [Baixar QR Code]                     │  │
│   │                                       │  │
│   │ Link Direto                           │  │
│   │ [code: https://vargasti.com/...]     │  │
│   │ [Copiar Link]                        │  │
│   │                                       │  │
│   │ Compartilhar Via                      │  │
│   │ [WhatsApp] [Email] [SMS]             │  │
│   │                                       │  │
│   │ Prévia da Mensagem                    │  │
│   │ "Olá João Silva 👋                    │  │
│   │  Seu orçamento está pronto! ✅       │  │
│   │  #2024-001 - R$ 5.500,00..."        │  │
│   └──────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

---

## 💬 Exemplo de Mensagens Geradas

### WhatsApp
```
Olá João Silva 👋

Seu orçamento está pronto! ✅

Número: #2024-001
Valor: R$ 5.500,00
Válido até: 08 de setembro de 2026

Clique no link abaixo para revisar e aprovar:
https://vargasti.com/orcamento/approve/abc123def456

Se tiver dúvidas, é só chamar! 😊

VargasTI
```

### SMS (versão curta)
```
Olá João Silva, seu orçamento #2024-001 está pronto. Clique: https://vargasti.com/orcamento/approve/abc123def456
```

### Email
Mesmo formato que WhatsApp, em HTML

---

## ⚙️ Configuração Necessária

### 1. Instalar Dependências
```bash
bun install
```

### 2. Aplicar Migration no Supabase
```sql
-- Executar o arquivo: supabase/migrations/add_orcamento_compartilhamento.sql
```

Ou via CLI:
```bash
supabase db push
```

### 3. Verificar Variáveis de Ambiente
O sistema usa `VITE_APP_URL` para gerar os links. Ensure está configurado em `.env`:
```
VITE_APP_URL=https://vargasti.com.br
```

---

## 🔒 Segurança

✅ **Row Level Security (RLS)** ativado na tabela  
✅ Apenas o usuário proprietário do orçamento pode registrar compartilhamentos  
✅ URLs de aprovação usam tokens criptografados  
✅ Links expiram em 7 dias (configurável)  

---

## 📈 Métricas Futuras

Com os dados de compartilhamento, será possível:

- Taxa de conversão por canal (%)
- Tempo médio entre envio e aprovação
- Quais clientes têm maior chance de aprovar
- Melhor horário para enviar (por cliente)
- Comparação de canais (qual tem mais sucesso)

---

## 🚀 Próximas Melhorias (Backlog)

- [ ] Webhook para rastrear visualizações/cliques
- [ ] Agendamento de reenvios automáticos
- [ ] Customização de mensagem por cliente
- [ ] Integração com Twilio para SMS
- [ ] Análise de performance no dashboard
- [ ] Template de mensagem personalizável
- [ ] Assinatura digital de orçamentos

---

## 📞 Suporte

Dúvidas sobre a implementação? Verifique:

1. **Hook**: `src/hooks/useOrcamentoCompartilhamento.ts`
2. **Componente**: `src/components/crm/OrcamentoCompartilhamento.tsx`
3. **Schema**: `supabase/migrations/add_orcamento_compartilhamento.sql`
