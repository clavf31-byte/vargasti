# 📧 Email Intake Tool - VargasTI

Sistema automático de leitura, categorização e criação de tickets a partir de emails Gmail.

## ✨ Funcionalidades

- ✅ **Autenticação Gmail OAuth 2.0** — Autorização segura
- ✅ **Polling Automático** — Verifica emails a cada 5 minutos
- ✅ **Categorização por Palavras-chave** — Sem IA, totalmente grátis
- ✅ **Criação Automática de Tickets** — No Helpdesk Interative
- ✅ **Interface com Botões de Debug** — Para troubleshooting

## 🚀 Como Usar

### 1. Autorizar Gmail

Acesse: `https://vargasti.lovable.app/api/gmail-auth`

- Clique para autorizar com sua conta Gmail
- Sistema salvará o token automaticamente

### 2. Acessar o Painel

Vá para: `/ferramentas/emails`

Você verá:
- Status "Automático" (polling ativo)
- Botão "Verificar Agora" (verificação manual)
- Botão "Deletar Token" (remover autorização)
- Seção "🔧 Debug" (troubleshooting)

### 3. Enviar Emails

Envie emails para a conta autorizada. O sistema:
1. Busca emails não lidos a cada 5 minutos (ou manualmente)
2. Categoriza por palavras-chave
3. Detecta prioridade
4. Cria ticket no Helpdesk Interative

## 📂 Categorias

| Categoria | Palavras-chave |
|-----------|---|
| **Impressora** | impressora, printer, imprimir, print, papel |
| **Rede** | internet, conexão, wifi, rede, conectar, ping, latência |
| **Email** | email, outlook, gmail, enviar, receber, anexo |
| **Software** | software, programa, aplicativo, erro, crash, travado |
| **Hardware** | hardware, dispositivo, mouse, teclado, monitor, pc |
| **VPN** | vpn, remoto, acesso remoto, proxy |
| **Banco de Dados** | banco, banco de dados, database, sql, backup |
| **Suporte** | help, suporte, ajuda, problema, não funciona, dúvida |

## 🎯 Detecção de Prioridade

- **Alta**: contém "urgente", "crítico", "problema", "erro", "não funciona", "travado"
- **Média**: padrão
- **Baixa**: contém "dúvida", "informação", "pergunta", "como"

## 🔧 Como Adicionar Mais Palavras-chave

Abra o arquivo: `src/lib/api/emailAgent.functions.ts`

Localize o objeto `categories` (linha ~342) e adicione:

```typescript
const categories: Record<string, string[]> = {
  "Impressora": ["impressora", "printer", ...],
  
  // ADICIONE AQUI:
  "Segurança": ["senha", "acesso", "login", "autenticação"],
  "Documentos": ["documento", "pdf", "word", "excel"],
};
```

Depois:
1. Faça commit das mudanças
2. Push para GitHub
3. Lovable fará deploy automático

## 🐛 Debug

Clique em "🔧 Debug" no painel para testar:

- **Token** → Verifica se Gmail está autorizado
- **Buscar Emails** → Testa busca de emails não lidos
- **Processar Email** → Testa detalhes de um email
- **Pipeline** → Testa pipeline completo
- **Interpretar** → Testa categorização

## 📊 Fluxo Completo

```
Email recebido (Gmail)
    ↓
Polling detecta (5 min ou manual)
    ↓
Busca em "is:unread"
    ↓
Extrai detalhes (De, Assunto, Corpo)
    ↓
Categoriza por palavras-chave
    ↓
Detecta prioridade
    ↓
Envia para Helpdesk Interative
    ↓
Ticket criada
    ↓
Email marcado como lido
```

## 🔐 Segurança

- Tokens salvos em Supabase (criptografados)
- OAuth 2.0 padrão
- Sem acesso a senhas
- Suporta 2FA na conta Gmail

## 💰 Custo

**Totalmente grátis!** 

A solução usa categorização por palavras-chave (sem IA), então:
- ✅ Zero custos com APIs
- ✅ Sem limite de requisições
- ✅ Escalável indefinidamente

## 🔄 Próximos Passos

- [ ] Integração com WhatsApp
- [ ] Dashboard de estatísticas
- [ ] Opção de usar IA (Claude/Gemini) para categorização melhorada
- [ ] Template de respostas automáticas
- [ ] Webhook para notificações externas

## 📞 Suporte

Para debug:
1. Acesse `/ferramentas/emails`
2. Expanda "🔧 Debug"
3. Clique nos botões para testar cada etapa
4. Verifique os resultados em JSON

---

**Sistema criado em 12/06/2026** | VargasTI Email Intake Tool
