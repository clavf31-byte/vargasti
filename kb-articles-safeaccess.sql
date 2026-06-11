-- SafeAccess Knowledge Base Articles
-- Version: 1.0
-- Last Updated: 2026-06-11
-- Author: Claudio Vargas
-- Purpose: Access control system documentation for WhatsApp AI Agent

-- SafeAccess - O que é?
INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'SafeAccess - O que é?',
  'SafeAccess é o sistema de controle de acesso da Interative Tecnossegurança. É uma solução completa para gerenciar acesso de visitantes, funcionários e eventos em suas instalações.

**Versão Atual:** 10.0
**Módulos Principais:**
- Cadastro de Visitantes
- Gerenciamento de Eventos/Visitas
- Controle Biométrico
- Identificação por Cartão
- Captura Facial

O sistema permite que você registre, autorize e controle o acesso de pessoas ao seu estabelecimento de forma segura e eficiente.',
  'published',
  now()
);

-- Novo Módulo de Visitas v10
INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'SafeAccess v10 - Novo Módulo de Visitas',
  'A versão 10.0 do SafeAccess trouxe uma reformulação completa do módulo de Visitas/Eventos.

**O que mudou:**
- **Listagem:** Agora utiliza cards organizados por data, com layout moderno
- **Nomenclatura:** "Cadastro de Visitantes" → "Adicionar Evento"
- **Campo Contato:** Renomeado para "Anfitrião"
- **Motivo da Visita:** Renomeado para "Informações do Evento"

**Benefícios:**
- Interface mais intuitiva e moderna
- Melhor organização por data
- Nomenclatura alinhada com eventos corporativos',
  'published',
  now()
);

-- Passo 1: Clique em Adicionar Evento
INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Como Adicionar um Evento - Passo 1',
  'Para criar um novo evento/visita no SafeAccess:

1. Acesse a tela principal de **Visitas/Eventos**
2. Localize o botão verde **"+ ADICIONAR EVENTO"** no canto superior direito
3. Clique nele para abrir o formulário de cadastro

**Dica:** O botão está sempre visível na parte superior da tela, em verde destacado.',
  'published',
  now()
);

-- Passo 2: Preencha os campos do evento
INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Como Preencher os Campos do Evento - Passo 2',
  'O formulário de evento possui três seções principais:

**1. ANFITRIÃO** (antigo "Contato")
- Selecione a pessoa responsável que será o anfitrião
- Use a busca para encontrar rápido

**2. INFORMAÇÕES DO EVENTO** (antigo "Motivo da Visita")
- **Nome do Evento:** Descrição do evento/visita
- **Grupo de Usuários:** Selecione o grupo (ex: VISITANTES)
- **Grupo de Acesso:** Defina as permissões de acesso
- **Data Início:** Quando começa o evento
- **Data Término:** Quando termina o evento
- **Hora Início:** Horário de entrada
- **Hora Término:** Horário de saída

**3. VISITANTE**
- Busque se o visitante já esteve na unidade
- Se não encontrar, clique em "+ CRIAR NOVO VISITANTE"',
  'published',
  now()
);

-- Passo 3: Criar novo visitante
INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Como Criar um Novo Visitante - Passo 3',
  'Se o visitante está visitando pela primeira vez, você precisa criar um novo cadastro:

1. No campo "VISITANTE", clique em **"+ CRIAR NOVO VISITANTE"**
2. Um formulário será aberto para preenchimento dos dados
3. Preencha as informações conforme as instruções de cada campo
4. Clique em "SALVAR" quando terminar

**Nota:** Caso o visitante já tenha sido cadastrado anteriormente, ele aparecerá na busca e você pode apenas selecioná-lo.',
  'published',
  now()
);

-- Passo 4: Preencher dados do visitante
INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Como Preencher Dados do Visitante - Passo 4',
  'Ao criar um novo visitante, preencha os seguintes campos:

**NOME** (Obrigatório)
- Apague o texto padrão "VISITANTE"
- Digite o nome completo do visitante

**CPF** (Obrigatório)
- Campo obrigatório
- Insira o CPF do visitante para identificação

**IDENTIFICADOR**
- Número do cartão de acesso (se houver)
- Deixe em branco se não houver cartão

**BIOMETRIA**
- Usado para cadastro de impressão digital ou reconhecimento biométrico
- Opcional, depende da configuração do seu sistema

**FOTO** (Recomendado)
- Inclua a foto capturada via câmera ou carregue um arquivo
- Importante para reconhecimento facial
- Use HTTPS para captura de foto via câmera
- Posicione o rosto dentro da área demarcada

**DOCUMENTOS BRASILEIROS**
- CPF: Também pode ser preenchido aqui
- Otros documentos conforme necessário',
  'published',
  now()
);

-- Passo 5: Capturar foto
INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Como Capturar a Foto do Visitante - Passo 5',
  'A foto é essencial para o sistema de reconhecimento facial:

**COMO CAPTURAR:**

1. **Posicione o rosto** dentro da área demarcada (círculo na tela)
2. **Clique no botão "Capturar"** para tirar a foto
3. Aguarde o sistema processar a imagem

**DICAS IMPORTANTES:**
- ✅ Posicione o rosto no centro do círculo
- ✅ Use boa iluminação
- ✅ Mantenha expressão neutra
- ❌ NÃO use óculos ou acessórios que atrapalhem a leitura facial
- ❌ NÃO use chapéus, bonés ou lenços que cubram o rosto
- ❌ NÃO fique muito perto ou muito longe da câmera

**Protocolo:** Para captura de foto via câmera do browser, o endereço DEVE usar protocolo HTTPS (seguro).',
  'published',
  now()
);

-- Passo 6: Finalizar e salvar
INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Como Finalizar e Salvar o Cadastro - Passo 6',
  'Após preencher todos os dados e incluir a foto do visitante, você tem duas opções:

**OPÇÃO 1: SALVAR**
- Salva o cadastro do visitante
- Fecha o formulário
- Retorna à tela de eventos

**OPÇÃO 2: SALVAR E CADASTRAR NOVO**
- Salva o visitante atual
- Abre automaticamente um novo formulário em branco
- Útil quando você precisa cadastrar vários visitantes em sequência

**Dica:** Escolha a opção "SALVAR E CADASTRAR NOVO" quando estiver registrando múltiplos visitantes para acelerar o processo.',
  'published',
  now()
);

-- Troubleshooting: Foto não captura
INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Troubleshooting: Câmera não funciona ou foto não captura',
  'Se você está tendo problemas ao capturar a foto:

**PROBLEMA: A câmera não abre**
- ✓ Verifique se a câmera está conectada ao computador
- ✓ Verifique se outra aplicação está usando a câmera
- ✓ Feche outros programas que usem câmera (Skype, Zoom, Teams)
- ✓ Reinicie o navegador
- ✓ Verifique as permissões de câmera no seu navegador

**PROBLEMA: Foto sai preta ou com linha**
- ✓ Posicione melhor o rosto no círculo
- ✓ Aumente a iluminação do ambiente
- ✓ Limpe a lente da câmera
- ✓ Verifique se não está muito perto

**PROBLEMA: Recebe erro HTTPS**
- ✓ O endereço da página DEVE começar com https://
- ✓ Não é possível capturar foto em conexões http não-seguras
- ✓ Verifique com seu administrador de TI

**Dica:** Se problemas persistirem, carregue uma foto já existente do computador em vez de capturar.',
  'published',
  now()
);

-- Troubleshooting: Visitante não aparece na busca
INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Troubleshooting: Visitante não aparece na busca',
  'Se você não encontra o visitante ao fazer a busca:

**POSSÍVEIS MOTIVOS:**

1. **Visitante ainda não foi cadastrado**
   - Solução: Clique em "+ CRIAR NOVO VISITANTE"

2. **Nome está digitado de forma diferente**
   - Tente buscar pelo CPF em vez do nome
   - Use apenas números do CPF (sem ponto ou hífen)

3. **Visitante foi cadastrado em outro evento antigo**
   - Tente buscar partes do nome
   - Tente buscar pelo telefone se souber

4. **Banco de dados não sincronizado**
   - Atualize a página (F5)
   - Aguarde alguns segundos e tente novamente

**DICA:** Sempre cadastre visitantes com nome completo para facilitar buscas futuras.',
  'published',
  now()
);

-- Best Practices
INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Boas Práticas - Cadastro de Visitas',
  'Seguindo estas boas práticas, você terá um controle de acesso mais eficiente:

**AO CADASTRAR VISITANTE:**
✓ Use o nome completo (não apelidos)
✓ Capture foto em boa iluminação
✓ Verifique se não está com óculos na foto
✓ Guarde o CPF para futuras buscas

**AO CRIAR EVENTO:**
✓ Defina o anfitrião correto
✓ Escolha o grupo de acesso apropriado
✓ Defina datas/horários corretos
✓ Revise antes de salvar

**SEGURANÇA:**
✓ Sempre confirme a identidade do visitante
✓ Não reutilize fotos de visitantes diferentes
✓ Mantenha dados atualizados
✓ Revise eventos pendentes regularmente

**PARA MÚLTIPLOS VISITANTES:**
✓ Use "SALVAR E CADASTRAR NOVO"
✓ Tenha todos os documentos em mão
✓ Realize em lote para eficiência',
  'published',
  now()
);
