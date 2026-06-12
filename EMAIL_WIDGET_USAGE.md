# 📧 Email Polling Widget - Como Usar

## Componente criado

`src/components/EmailPollingWidget.tsx`

---

## Como adicionar no seu app

### **Opção 1: No Dashboard/Home**

```typescript
import { EmailPollingWidget } from "@/components/EmailPollingWidget";

export function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <EmailPollingWidget />
      {/* resto do conteúdo */}
    </div>
  );
}
```

### **Opção 2: Na barra superior/navbar**

```typescript
import { EmailPollingWidget } from "@/components/EmailPollingWidget";

export function Navbar() {
  return (
    <nav>
      <div className="flex justify-between">
        <h1>VargasTI</h1>
        <EmailPollingWidget />
      </div>
    </nav>
  );
}
```

### **Opção 3: Em um drawer/sidebar**

```typescript
import { EmailPollingWidget } from "@/components/EmailPollingWidget";

export function Sidebar() {
  return (
    <aside>
      <h2>Utilitários</h2>
      <EmailPollingWidget />
    </aside>
  );
}
```

---

## O que o componente faz

✅ **Automático:**
- Começa quando app abre
- Verifica a cada 5 minutos
- Roda em background silenciosamente

✅ **Manual:**
- Botão "Verificar Agora"
- Força check imediato
- Mostra resultado na hora

✅ **Visual:**
- Status verde "Automático" (pulsante)
- Mostra quantos e-mails foram processados
- Mostra erros em vermelho
- Botão desativado enquanto carrega

---

## Exemplo visual

```
┌─────────────────────────────┐
│ E-mails      🟢 Automático  │
├─────────────────────────────┤
│ ✓ 3 de 5 e-mail(ns) proc.   │
├─────────────────────────────┤
│   [  Verificar Agora   ]    │
├─────────────────────────────┤
│ Verifica a cada 5 minutos   │
└─────────────────────────────┘
```

---

## Variáveis necessárias

O componente usa `emailPolling.ts` que precisa de:

```env
HELPDESK_EMAIL_INTAKE_URL=https://...
HELPDESK_EMAIL_INTAKE_API_KEY=abc123...
```

(Já estão no `.env.local`)

---

## Customizações (opcional)

### Mudar intervalo de polling

Em `EmailPollingWidget.tsx`, linha 30:

```typescript
intervalMs: 5 * 60 * 1000,  // Mudar este valor
```

- 1 minuto: `1 * 60 * 1000`
- 5 minutos: `5 * 60 * 1000` (padrão)
- 10 minutos: `10 * 60 * 1000`

### Mudar max e-mails por check

Em `EmailPollingWidget.tsx`, linha 31:

```typescript
maxEmailsPerPoll: 5,  // Mudar este valor
```

---

## Pronto!

Adicione o componente em qualquer lugar do seu app e tá funcionando! 🚀
