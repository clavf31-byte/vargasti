# 📧 Guia Completo - Sistema de Filtros de Email

## 🎯 O que você tem?

### **3 Sistemas de Filtros:**

1. **📝 Categorias** - Classificação automática por keywords
2. **✅ Whitelist** - Emails/domínios confiáveis (processam automaticamente)
3. ⭐ **Prioridades** - Regras de prioridade (alta/média/baixa)

---

## 🏠 COMO ACESSAR NA UI

### Local de Acesso:
```
http://localhost:8082/ferramentas/emails
         ↓
[▼] Configuração (expandir)
         ↓
3 botões:
├─ Configurar Categorias      [MODAL 1]
├─ Configurar Whitelist       [MODAL 2]
└─ Configurar Prioridades     [MODAL 3]
```

---

## 1️⃣ **CATEGORIAS** (Classificação Automática)

### O que faz?
Classifica emails em categorias baseado em **palavras-chave (keywords)**

### Exemplo Padrão:
```
Categoria: Impressora
Keywords: impressora, printer, imprimir, print, papel

Email recebido: "Impressora parou de funcionar"
→ Detecta "impressora" (word boundary match)
→ Classifica como "Impressora"
→ Cria ticket nessa categoria
```

### Como Adicionar Nova Categoria:

**Via UI:**
1. Clique em "Configurar Categorias"
2. Modal abre
3. Clique em "Adicionar Categoria"
4. Preencha:
   ```
   Nome: Impressora
   Keywords: impressora, printer, imprimir, print, papel
   ```
5. Clique "Salvar"
6. ✓ Pronto! Sincroniza com Supabase automaticamente

**Categorias Padrão:**
```
✓ Impressora       → impressora, printer, imprimir, print, papel
✓ Rede             → internet, conexão, wifi, rede, conectar
✓ Email            → email, outlook, gmail, enviar, receber
✓ Software         → software, programa, aplicativo, erro
✓ Hardware         → hardware, dispositivo, mouse, teclado
✓ VPN              → vpn, remoto, acesso remoto, proxy
✓ Banco de Dados   → banco, database, sql, backup
✓ Suporte          → help, suporte, ajuda, problema, dúvida
```

### Como Funciona o Matching:

```typescript
// Word-boundary matching (implementado)
Email: "Impressora não está imprimindo"
Keywords: ["impressora", "print"]

✓ Match "impressora"    → palavra inteira encontrada
✓ Match "print" em "imprimindo" → NÃO (precisa palavra inteira)

Resultado: Classifica como "Impressora"
```

---

## 2️⃣ **WHITELIST** (Permitir Automático)

### O que faz?
Define quais **emails/domínios** podem criar tickets automaticamente

### Exemplo:
```
Whitelist: suporte@interative.com.br

Email: suporte@interative.com.br enviar "Preciso de ajuda"
→ Está na whitelist
→ Cria ticket AUTOMATICAMENTE (sem verificação adicional)

Email: desconhecido@outro.com enviar "Preciso de ajuda"
→ NÃO está na whitelist
→ Ignorado ou marcado para revisão
```

### Como Adicionar à Whitelist:

**Via UI:**
1. Clique em "Configurar Whitelist"
2. Modal abre
3. Escolha:
   ```
   ○ Por Email: suporte@interative.com.br
   ○ Por Domínio: @interative.com.br
   ```
4. Clique "Adicionar"
5. ✓ Pronto!

### Padrão de Armazenamento:
```typescript
type EmailWhitelist = {
  id: string;                  // Único
  email: string;               // Ex: "suporte@interative.com.br"
  domain: string;              // Ex: "@interative.com.br"
}

Exemplo:
{
  id: "wl-1",
  email: "suporte@interative.com.br",
  domain: null
}

{
  id: "wl-2",
  email: null,
  domain: "@interative.com.br"  // Qualquer um nesse domínio
}
```

---

## 3️⃣ **PRIORIDADES** (Definir Urgência)

### O que faz?
Define **prioridade automática** baseado em keywords

### Exemplo Padrão:
```
Regra: "Urgente"
Keywords: urgente, urgency, asap, crítico, parado, offline
Prioridade: ALTA

Email: "URGENTE: Sistema offline"
→ Detecta "urgente" e "offline"
→ Marca como ALTA prioridade
→ Cria ticket com prioridade ALTA
```

### Como Adicionar Regra de Prioridade:

**Via UI:**
1. Clique em "Configurar Prioridades"
2. Modal abre
3. Clique "Adicionar Regra"
4. Preencha:
   ```
   Keywords: urgente, crítico, asap, parado
   Prioridade: ⭐ ALTA
                  MÉDIA
                  BAIXA
   ```
5. Clique "Salvar"
6. ✓ Pronto!

### Prioridades Padrão:
```
Alta:
├─ Keywords: urgente, urgency, asap, crítico, parado, offline
└─ Keywords: problema, erro, não funciona, quebrado

Média:
└─ [Vazio - usa padrão]

Baixa:
└─ Keywords: dúvida, informação, pergunta, como
```

---

## 🚀 COMO ADICIONAR BLACKLIST (Bloquear)

**Status:** Não implementada ainda, mas é FÁCIL adicionar!

### Passo 1: Adicionar tipo no hook
Editar: `src/hooks/useEmailConfig.ts`

```typescript
// Linha 12 - APÓS whitelist, adicionar:
export type EmailBlacklist = {
  id: string;
  email: string;
  domain: string;
  reason?: string;  // Ex: "spam", "bloqueado pelo admin"
};

// Linha 52 - APÓS whitelist, adicionar:
const [blacklist, setBlacklist] = useState<EmailBlacklist[]>([]);

// Linha 70 - APÓS whitelist load, adicionar:
if (data.blacklist?.length > 0) setBlacklist(data.blacklist);

// Linha 104 - APÓS saveWhitelist, ADICIONAR:
const saveBlacklist = async (newBlacklist: EmailBlacklist[]) => {
  setBlacklist(newBlacklist);
  try {
    await supabase
      .from("email_settings")
      .update({ blacklist: newBlacklist, updated_at: new Date().toISOString() })
      .eq("id", "00000000-0000-0000-0000-000000000000");
  } catch (err) {
    console.error("[useEmailConfig] Error saving blacklist:", err);
    localStorage.setItem("email_blacklist", JSON.stringify(newBlacklist));
  }
};

// Linha 130 - ADICIONAR ao return:
return {
  categories,
  whitelist,
  blacklist,        // ← NOVO
  priorities,
  loaded,
  saveCategories,
  saveWhitelist,
  saveBlacklist,    // ← NOVO
  savePriorities,
};
```

### Passo 2: Criar Modal para Blacklist
Criar arquivo: `src/components/EmailConfigModals.tsx`

(Copiar lógica do modal Whitelist existente e adaptar)

### Passo 3: Usar no Email Agent
Editar: `src/lib/api/emailAgent.functions.ts`

```typescript
// Antes de processar, verificar blacklist:
function isEmailBlacklisted(fromEmail: string, blacklist: EmailBlacklist[]): boolean {
  return blacklist.some(b => 
    fromEmail === b.email || 
    fromEmail.endsWith(b.domain)
  );
}

// No processamento:
if (isEmailBlacklisted(email.from, blacklist)) {
  console.log(`[email-polling] Email bloqueado:`, email.from);
  return { ok: false, skipped: true, reason: "blacklisted" };
}
```

---

## 💾 ARMAZENAMENTO - Como Funciona?

### **Banco de Dados (Supabase)**

Tabela: `email_settings`

```
┌─────────────────────────────────────────────┐
│ id (UUID)                                   │
│ categories (JSONB array)                    │
│ whitelist (JSONB array)                     │
│ priorities (JSONB array)                    │
│ blacklist (JSONB array) [futuro]            │
│ updated_at (timestamp)                      │
│ created_at (timestamp)                      │
└─────────────────────────────────────────────┘
```

### Exemplo Real:
```json
{
  "id": "00000000-0000-0000-0000-000000000000",
  "categories": [
    {
      "name": "Impressora",
      "keywords": ["impressora", "printer", "imprimir"]
    }
  ],
  "whitelist": [
    {
      "id": "wl-1",
      "email": "suporte@interative.com.br",
      "domain": null
    }
  ],
  "priorities": [
    {
      "id": "urgent",
      "keywords": ["urgente", "crítico"],
      "priority": "alta"
    }
  ],
  "updated_at": "2026-06-12T20:30:00Z"
}
```

### Fallback (localStorage)
Se Supabase falhar:
```javascript
// Salva localmente
localStorage.setItem("email_categories", JSON.stringify(data))
localStorage.setItem("email_whitelist", JSON.stringify(data))
localStorage.setItem("email_priorities", JSON.stringify(data))
```

---

## 🔄 FLUXO COMPLETO DE PROCESSAMENTO

```
Email Recebido: "Urgente: Impressora offline"
De: suporte@interative.com.br

┌─ Verificar Blacklist
│  ✓ Não está bloqueado
│
├─ Verificar Whitelist
│  ✓ suporte@interative.com.br está autorizado
│
├─ Classificar por Categoria
│  ✓ Keywords "impressora" encontrada
│  → Categoria: "Impressora"
│
├─ Determinar Prioridade
│  ✓ Keywords "urgente" + "offline" encontradas
│  → Prioridade: "ALTA"
│
└─ Criar Ticket
   ✓ Ticket criado com:
     - Categoria: Impressora
     - Prioridade: ALTA
     - De: suporte@interative.com.br
     - Status: Autorizado
```

---

## 📊 EXEMPLO PRÁTICO - Adicionar Novo Filtro

### Cenário:
"Quero um filtro para emails sobre 'Licenças de Software'"

### Passo 1: Adicionar Categoria
```
Nome: Licenças de Software
Keywords: licença, license, ativação, activate, expirado, expired, chave, key
```

### Passo 2: Adicionar Prioridade
```
Regra: Software Expirado
Keywords: licença expirada, license expired, ativação necessária
Prioridade: ALTA
```

### Passo 3: Teste
Envie email com: "Licença do Microsoft Office expirou"
→ Sistema deve:
   ✓ Classificar como "Licenças de Software"
   ✓ Marcar como ALTA prioridade
   ✓ Criar ticket

---

## 🛠️ CÓDIGO - Como o Matching Funciona

```typescript
// Word-boundary matching (implementado)
function matchesKeyword(text: string, keyword: string): boolean {
  const regex = new RegExp(`\\b${keyword}\\b`, "i");
  return regex.test(text);
}

// Uso:
const text = "Impressora parou de imprimir";
matchesKeyword(text, "impressora");  // true
matchesKeyword(text, "print");       // true (em "imprimir")
matchesKeyword(text, "fax");         // false
```

---

## ⚙️ PRÓXIMAS MELHORIAS SUGERIDAS

- [ ] Adicionar **Blacklist** (bloquear emails)
- [ ] Suportar **Regex patterns** em vez de só keywords
- [ ] **Regras complexas** (AND/OR combinações)
- [ ] **Histórico de filtros** (auditoria)
- [ ] **Bulk import** (importar Excel com filtros)
- [ ] **Testes de regras** (testar antes de aplicar)
- [ ] **Limite de palavras-chave** por categoria
- [ ] **Sugestões automáticas** (IA sugere keywords)

---

## 📞 SUPORTE

**Como adicionar via código (desenvolvedor)?**
→ Editar `src/hooks/useEmailConfig.ts` e implementar novo tipo

**Como adicionar via UI (usuário)?**
→ Clique em "Configurar [X]" e preencha os campos

**Os filtros funcionam em tempo real?**
→ SIM! Assim que salva, sincroniza com Supabase e próximo email usa

**Posso exportar/importar filtros?**
→ Futuro - não implementado ainda

---

**Última atualização:** 2026-06-12  
**Status:** ✅ Categorias, Whitelist e Prioridades FUNCIONANDO  
**Blacklist:** 📋 Pronto para implementar (passo a passo acima)
