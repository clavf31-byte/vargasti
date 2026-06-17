# Configuração Resend para Envio de Contratos

## 🚀 Passo a Passo

### 1. Criar Conta Resend
1. Vá para [resend.com](https://resend.com)
2. Clique em **"Sign Up"**
3. Crie sua conta (recomendado usar GitHub)
4. Confirme email

### 2. Obter API Key
1. Acesse [resend.com/api-keys](https://resend.com/api-keys)
2. Clique **"Create API Key"**
3. Nome: `vargasti-contratos`
4. Copie a chave (começa com `re_`)

### 3. Configurar Variáveis de Ambiente

**Arquivo: `.env.local`**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=contratos@vargasti.com.br
RESEND_REPLY_TO=contratos@vargasti.com.br
```

### 4. Testar Email (Opcional)

Para testar antes de produção:

```bash
# Instalar Resend CLI (opcional)
npm install -g resend

# Ou testar direto pela aplicação
```

---

## 📧 Emails Suportados

### Modo Desenvolvimento (Sandbox)
- Resend cria automaticamente um email de teste
- Só funciona com emails adicionados como **"Invited Testers"**

### Modo Produção
1. Adicione seu domínio no Resend
2. Configure registros DNS (CNAME, TXT)
3. Ative envio real

---

## ✉️ O que o Sistema Envia

Quando você clica em **"Enviar Contrato"**:

1. ✅ Email para o cliente
2. ✅ Com instruções em HTML formatado
3. ✅ Orientações para assinatura digital
4. ✅ Links para programas de assinatura (Gov.br, Signer, etc)
5. ✅ ID do contrato para referência

---

## 🔧 Troubleshooting

### "RESEND_API_KEY não configurada"
- Verifique `.env.local`
- Reinicie o servidor (`npm run dev`)

### Email não chega
- **Sandbox**: confirme email em "Invited Testers"
- **Produção**: verifique registros DNS
- Verifique pasta SPAM

### Email de teste não funciona
- Resend gratuito aceita até 100 emails/dia
- Reinicie servidor se adicionou nova API key

---

## 📋 Configuração Recomendada

```env
# Resend
RESEND_API_KEY=re_seu_token_aqui
RESEND_FROM_EMAIL=contratos@vargasti.com.br
RESEND_REPLY_TO=contratos@vargasti.com.br

# Opcional - para logs
RESEND_DEBUG=true
```

---

## 🎉 Pronto!

O sistema está 100% integrado com Resend. 

**Basta:**
1. ✅ Adicionar sua API key em `.env.local`
2. ✅ Criar um contrato
3. ✅ Clicar "Enviar"
4. ✅ Cliente recebe email bonito com instruções

---

## 📞 Suporte Resend

- Documentação: https://resend.com/docs
- Discord: https://discord.gg/resend
- Email: support@resend.com
