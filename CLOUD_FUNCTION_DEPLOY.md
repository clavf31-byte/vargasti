# Deploy Cloud Function para Gmail Webhook

## 1. Instalar Google Cloud CLI

```bash
# Windows
choco install google-cloud-sdk

# Ou download: https://cloud.google.com/sdk/docs/install
```

Após instalar:
```bash
gcloud init
gcloud auth login
gcloud config set project vargasti-email-499123
```

---

## 2. Configurar Environment Variables

Crie um arquivo `env.yaml` na pasta da função:

```yaml
GMAIL_CLIENT_ID: "145943032171-6ddn618v660i2915ie6qc45f83s99thm.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET: "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"
GMAIL_REDIRECT_URI: "http://localhost:3000/api/gmail-callback"
ANTHROPIC_API_KEY: "sk-ant-xxxxx"
WEBHOOK_SECRET: "webhook_secret_bem_longo_aleatorio_123456"
GMAIL_ACCESS_TOKEN: "ya29.xxxxx"
HELPDESK_API_URL: "https://seu-helpdesk.com/api/email-intake"
HELPDESK_API_KEY: "bearer_token_do_helpdesk"
```

---

## 3. Deploy da Cloud Function

```bash
cd functions/gmail-webhook-processor

gcloud functions deploy gmailWebhookProcessor \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --entry-point gmailWebhookProcessor \
  --env-vars-file env.yaml \
  --memory 512MB \
  --timeout 60s
```

Após o deploy, você receberá uma URL tipo:
```
https://REGION-PROJECT-ID.cloudfunctions.net/gmailWebhookProcessor
```

---

## 4. Atualizar Webhook no Pub/Sub

1. Google Cloud Console → Pub/Sub → Subscriptions
2. Clique em `gmail-webhook-sub`
3. Clique **"Editar"**
4. Atualize o **Push endpoint** para:
   ```
   https://REGION-PROJECT-ID.cloudfunctions.net/gmailWebhookProcessor
   ```
5. Atualize o header **Authorization**:
   ```
   Bearer webhook_secret_bem_longo_aleatorio_123456
   ```
6. **Salvar**

---

## 5. Obter Gmail Access Token

O `GMAIL_ACCESS_TOKEN` precisa ser um token válido. Você pode:

### Opção A: Usar token de desenvolvimento
1. Acesse: `http://localhost:3000/api/gmail-auth`
2. Faça login e autorize
3. Copie o access_token que será salvo
4. Use-o nas env vars

### Opção B: Implementar armazenamento
Criar uma função que lê o token do Supabase (tabela `gmail_tokens`)

---

## 6. Monitorar Execução

```bash
# Ver logs em tempo real
gcloud functions logs read gmailWebhookProcessor --limit 50 --follow

# Ver detalhes da função
gcloud functions describe gmailWebhookProcessor
```

---

## 7. Testar Webhook

### Teste manual via curl:
```bash
curl -X POST https://REGION-PROJECT-ID.cloudfunctions.net/gmailWebhookProcessor \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer webhook_secret_bem_longo_aleatorio_123456" \
  -d '{
    "message": {
      "data": "'$(echo '{"emailThreadId":"xxx"}' | base64)'"
    }
  }'
```

### Enviar e-mail de teste:
1. Envie um e-mail para `claudio.filho@interative.com.br`
2. Monitorar logs: `gcloud functions logs read gmailWebhookProcessor --limit 50`
3. Verificar se ticket foi criado no Helpdesk

---

## 8. Troubleshooting

**"Invalid or missing Bearer token"**
- Verifique se o header Authorization está correto no Pub/Sub
- Use o mesmo WEBHOOK_SECRET em env vars

**"No Gmail access token available"**
- Obtenha um token válido via endpoint `/api/gmail-auth`
- Salve em `GMAIL_ACCESS_TOKEN`

**"Helpdesk API error"**
- Verifique se a API do Helpdesk está respondendo
- Confirme o `HELPDESK_API_KEY` está correto
- Teste a API manualmente com curl

**Timeout da função**
- Aumente `--timeout` para 120s ou mais
- Verifique conexão com APIs externas

---

## 9. Próximos Passos

- [ ] Implementar armazenamento de token no Supabase
- [ ] Criar endpoint `/api/gmail-auth` pra obter tokens
- [ ] Implementar refresh automático de tokens
- [ ] Adicionar rate limiting
- [ ] Criar UI para gerenciar configurações

---

## Dúvidas?

Consulte:
- [Cloud Functions Docs](https://cloud.google.com/functions/docs)
- [Gmail API](https://developers.google.com/gmail/api)
- [Pub/Sub Push Delivery](https://cloud.google.com/pubsub/docs/push)
