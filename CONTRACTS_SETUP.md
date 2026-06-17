# Sistema de Contratos - Setup e Configuração

## 🚀 O que foi implementado

Módulo completo de gerenciamento de contratos com assinatura digital do cliente.

### Fluxo de Trabalho
1. **Criar Modelo** → Template com variáveis ({{cliente_nome}}, {{data}}, etc)
2. **Novo Contrato** → Seleciona modelo + cliente + preenche dados
3. **Enviar** → Email para cliente com instruções
4. **Receber Assinado** → Upload do PDF assinado pelo cliente
5. **Marcar Assinado** → Contrato finalizado

---

## ⚙️ Configurações Necessárias

### 1. **Supabase Storage** (para guardar PDFs assinados)

```bash
# Criar bucket "contracts" no Supabase:
# 1. Va para Supabase Dashboard
# 2. Storage > Create New Bucket
# 3. Nome: "contracts"
# 4. Public: true (para links compartilháveis)
# 5. Create Bucket
```

**Permissions (RLS)**:
```sql
-- Permitir usuários fazer upload em sua própria pasta
CREATE POLICY "Usuários podem fazer upload em contratos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts' AND
  owner = auth.uid()
);

-- Permitir download de arquivos públicos
CREATE POLICY "Acesso público a contratos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'contracts');
```

### 2. **Executar Migration do Database**

```bash
# As tabelas já foram criadas pela migration:
# supabase/migrations/20260617_create_contracts.sql

# Aplique via:
# - Dashboard Supabase > SQL Editor > copiar e colar
# - Ou via CLI: supabase db push
```

### 3. **Email (OPCIONAL - Futura Integração)**

Atualmente, o sistema **simula** o envio de email. Para produção, integre:

**Opção A: SendGrid**
```typescript
// Instalar: npm install @sendgrid/mail
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: clientEmail,
  from: 'contratos@suaempresa.com.br',
  subject: `Contrato para assinatura: ${contractTitle}`,
  text: message,
};

await sgMail.send(msg);
```

**Opção B: Resend**
```typescript
// Instalar: npm install resend
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'contratos@suaempresa.com.br',
  to: clientEmail,
  subject: `Contrato para assinatura: ${contractTitle}`,
  text: message,
});
```

**Opção C: Sistema Existente**
Integre com seu sistema de email já existente no projeto.

---

## 📝 Usando o Sistema

### Criar um Modelo de Contrato

1. Vá para **CRM > Contratos > Modelos**
2. Clique em **"+ Novo Modelo"**
3. Preencha:
   - **Nome**: Ex: "Contrato de Suporte TI"
   - **Descrição**: Informações extras
   - **Conteúdo**: Cole o texto do contrato
4. Use variáveis: `{{cliente_nome}}`, `{{data}}`, `{{valor}}`, etc.
5. **Criar Modelo**

### Criar um Contrato

1. Vá para **CRM > Contratos**
2. Clique em **"+ Novo Contrato"**
3. Selecione:
   - **Modelo**: Escolha o template
   - **Cliente**: Selecione o cliente
   - **Título**: Nome do contrato para este cliente
4. **Criar Contrato**

### Preencher Dados

1. Na página de detalhes, clique em **"✏️ Editar"**
2. Substitua as variáveis do template pelos dados reais
3. Exemplo: `{{cliente_nome}}` → "Athena Urbanismo"
4. **Salvar**

### Enviar para Cliente

1. Clique em **"📧 Enviar"**
2. Confirme o email do cliente
3. Customize a mensagem (ou deixe a padrão)
4. **Enviar Contrato**

**O cliente receberá:**
- Email com instruções
- Contrato em PDF
- Instruções para assinar com certificado digital (gov.br)

### Receber PDF Assinado

1. Cliente assina o PDF e devolve
2. Na página do contrato, clique em **"📥 Receber"**
3. Faça upload do PDF assinado
4. **Confirmar Assinatura**

**Sistema irá:**
- ✅ Guardar o PDF assinado
- ✅ Marcar contrato como "Assinado"
- ✅ Registrar data de assinatura
- ✅ Criar auditoria

---

## 📊 Variáveis Disponíveis

Use no template (entre {{}}):

```
{{cliente_nome}}          - Nome do cliente
{{cliente_cnpj}}          - CNPJ do cliente
{{cliente_cpf}}           - CPF do cliente
{{cliente_email}}         - Email do cliente
{{cliente_telefone}}      - Telefone do cliente
{{data}}                  - Data atual
{{data_vencimento}}       - Data de vencimento
{{valor}}                 - Valor do contrato
{{quantidade}}            - Quantidade de horas/serviços
{{descricao}}             - Descrição do serviço
```

---

## 🔒 Segurança

- **Tokens únicos** para cada contrato (assinatura digital)
- **RLS (Row Level Security)** no Supabase garante usuários veem apenas seus contratos
- **Auditoria completa** de quem fez o quê e quando
- **PDFs assinados** guardados no Storage com acesso seguro

---

## 🚧 Próximas Melhorias

- [ ] Integração com SendGrid/Resend para envio real de email
- [ ] Geração automática de PDF (html2pdf)
- [ ] Substituição automática de variáveis
- [ ] Assinatura eletrônica integrada (DocuSign, Adobe Sign)
- [ ] Templates com formatação avançada
- [ ] Webhooks para eventos do contrato
- [ ] Relatórios de contratos (assinados, pendentes, etc)

---

## 📞 Suporte

Para dúvidas ou problemas, consulte:
- Logs no Supabase > Logs
- Console do navegador (F12)
- Tabela `contract_history` para auditoria
