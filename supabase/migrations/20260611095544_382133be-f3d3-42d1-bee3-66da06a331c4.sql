
-- Create knowledge base articles table
CREATE TABLE public.kb_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.kb_articles TO authenticated;
GRANT ALL ON public.kb_articles TO service_role;

ALTER TABLE public.kb_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read published articles"
ON public.kb_articles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can manage articles"
ON public.kb_articles FOR ALL
TO authenticated
USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_kb_articles_updated_at
BEFORE UPDATE ON public.kb_articles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed SafeAccess KB articles
INSERT INTO public.kb_articles (title, content, status) VALUES
('SafeAccess - O que é?', E'SafeAccess é o sistema de controle de acesso da Interative Tecnossegurança. É uma solução completa para gerenciar acesso de visitantes, funcionários e eventos em suas instalações.\n\n**Versão Atual:** 10.0\n**Módulos Principais:**\n- Cadastro de Visitantes\n- Gerenciamento de Eventos/Visitas\n- Controle Biométrico\n- Identificação por Cartão\n- Captura Facial\n\nO sistema permite que você registre, autorize e controle o acesso de pessoas ao seu estabelecimento de forma segura e eficiente.', 'published'),
('SafeAccess v10 - Novo Módulo de Visitas', E'A versão 10.0 do SafeAccess trouxe uma reformulação completa do módulo de Visitas/Eventos.\n\n**O que mudou:**\n- **Listagem:** Agora utiliza cards organizados por data, com layout moderno\n- **Nomenclatura:** "Cadastro de Visitantes" → "Adicionar Evento"\n- **Campo Contato:** Renomeado para "Anfitrião"\n- **Motivo da Visita:** Renomeado para "Informações do Evento"\n\n**Benefícios:**\n- Interface mais intuitiva e moderna\n- Melhor organização por data\n- Nomenclatura alinhada com eventos corporativos', 'published'),
('Como Adicionar um Evento - Passo 1', E'Para criar um novo evento/visita no SafeAccess:\n\n1. Acesse a tela principal de **Visitas/Eventos**\n2. Localize o botão verde **"+ ADICIONAR EVENTO"** no canto superior direito\n3. Clique nele para abrir o formulário de cadastro\n\n**Dica:** O botão está sempre visível na parte superior da tela, em verde destacado.', 'published'),
('Como Preencher os Campos do Evento - Passo 2', E'O formulário de evento possui três seções principais:\n\n**1. ANFITRIÃO** (antigo "Contato")\n- Selecione a pessoa responsável que será o anfitrião\n- Use a busca para encontrar rápido\n\n**2. INFORMAÇÕES DO EVENTO** (antigo "Motivo da Visita")\n- **Nome do Evento:** Descrição do evento/visita\n- **Grupo de Usuários:** Selecione o grupo (ex: VISITANTES)\n- **Grupo de Acesso:** Defina as permissões de acesso\n- **Data Início:** Quando começa o evento\n- **Data Término:** Quando termina o evento\n- **Hora Início:** Horário de entrada\n- **Hora Término:** Horário de saída\n\n**3. VISITANTE**\n- Busque se o visitante já esteve na unidade\n- Se não encontrar, clique em "+ CRIAR NOVO VISITANTE"', 'published'),
('Como Criar um Novo Visitante - Passo 3', E'Se o visitante está visitando pela primeira vez, você precisa criar um novo cadastro:\n\n1. No campo "VISITANTE", clique em **"+ CRIAR NOVO VISITANTE"**\n2. Um formulário será aberto para preenchimento dos dados\n3. Preencha as informações conforme as instruções de cada campo\n4. Clique em "SALVAR" quando terminar\n\n**Nota:** Caso o visitante já tenha sido cadastrado anteriormente, ele aparecerá na busca e você pode apenas selecioná-lo.', 'published'),
('Como Preencher Dados do Visitante - Passo 4', E'Ao criar um novo visitante, preencha os seguintes campos:\n\n**NOME** (Obrigatório)\n- Apague o texto padrão "VISITANTE"\n- Digite o nome completo do visitante\n\n**CPF** (Obrigatório)\n- Campo obrigatório\n- Insira o CPF do visitante para identificação\n\n**IDENTIFICADOR**\n- Número do cartão de acesso (se houver)\n- Deixe em branco se não houver cartão\n\n**BIOMETRIA**\n- Usado para cadastro de impressão digital ou reconhecimento biométrico\n- Opcional, depende da configuração do seu sistema\n\n**FOTO** (Recomendado)\n- Inclua a foto capturada via câmera ou carregue um arquivo\n- Importante para reconhecimento facial\n- Use HTTPS para captura de foto via câmera\n- Posicione o rosto dentro da área demarcada\n\n**DOCUMENTOS BRASILEIROS**\n- CPF: Também pode ser preenchido aqui\n- Otros documentos conforme necessário', 'published'),
('Como Capturar a Foto do Visitante - Passo 5', E'A foto é essencial para o sistema de reconhecimento facial:\n\n**COMO CAPTURAR:**\n\n1. **Posicione o rosto** dentro da área demarcada (círculo na tela)\n2. **Clique no botão "Capturar"** para tirar a foto\n3. Aguarde o sistema processar a imagem\n\n**DICAS IMPORTANTES:**\n- ✅ Posicione o rosto no centro do círculo\n- ✅ Use boa iluminação\n- ✅ Mantenha expressão neutra\n- ❌ NÃO use óculos ou acessórios que atrapalhem a leitura facial\n- ❌ NÃO use chapéus, bonés ou lenços que cubram o rosto\n- ❌ NÃO fique muito perto ou muito longe da câmera\n\n**Protocolo:** Para captura de foto via câmera do browser, o endereço DEVE usar protocolo HTTPS (seguro).', 'published'),
('Como Finalizar e Salvar o Cadastro - Passo 6', E'Após preencher todos os dados e incluir a foto do visitante, você tem duas opções:\n\n**OPÇÃO 1: SALVAR**\n- Salva o cadastro do visitante\n- Fecha o formulário\n- Retorna à tela de eventos\n\n**OPÇÃO 2: SALVAR E CADASTRAR NOVO**\n- Salva o visitante atual\n- Abre automaticamente um novo formulário em branco\n- Útil quando você precisa cadastrar vários visitantes em sequência\n\n**Dica:** Escolha a opção "SALVAR E CADASTRAR NOVO" quando estiver registrando múltiplos visitantes para acelerar o processo.', 'published'),
('Troubleshooting: Câmera não funciona ou foto não captura', E'Se você está tendo problemas ao capturar a foto:\n\n**PROBLEMA: A câmera não abre**\n- ✓ Verifique se a câmera está conectada ao computador\n- ✓ Verifique se outra aplicação está usando a câmera\n- ✓ Feche outros programas que usem câmera (Skype, Zoom, Teams)\n- ✓ Reinicie o navegador\n- ✓ Verifique as permissões de câmera no seu navegador\n\n**PROBLEMA: Foto sai preta ou com linha**\n- ✓ Posicione melhor o rosto no círculo\n- ✓ Aumente a iluminação do ambiente\n- ✓ Limpe a lente da câmera\n- ✓ Verifique se não está muito perto\n\n**PROBLEMA: Recebe erro HTTPS**\n- ✓ O endereço da página DEVE começar com https://\n- ✓ Não é possível capturar foto em conexões http não-seguras\n- ✓ Verifique com seu administrador de TI\n\n**Dica:** Se problemas persistirem, carregue uma foto já existente do computador em vez de capturar.', 'published'),
('Troubleshooting: Visitante não aparece na busca', E'Se você não encontra o visitante ao fazer a busca:\n\n**POSSÍVEIS MOTIVOS:**\n\n1. **Visitante ainda não foi cadastrado**\n   - Solução: Clique em "+ CRIAR NOVO VISITANTE"\n\n2. **Nome está digitado de forma diferente**\n   - Tente buscar pelo CPF em vez do nome\n   - Use apenas números do CPF (sem ponto ou hífen)\n\n3. **Visitante foi cadastrado em outro evento antigo**\n   - Tente buscar partes do nome\n   - Tente buscar pelo telefone se souber\n\n4. **Banco de dados não sincronizado**\n   - Atualize a página (F5)\n   - Aguarde alguns segundos e tente novamente\n\n**DICA:** Sempre cadastre visitantes com nome completo para facilitar buscas futuras.', 'published'),
('Boas Práticas - Cadastro de Visitas', E'Seguindo estas boas práticas, você terá um controle de acesso mais eficiente:\n\n**AO CADASTRAR VISITANTE:**\n✓ Use o nome completo (não apelidos)\n✓ Capture foto em boa iluminação\n✓ Verifique se não está com óculos na foto\n✓ Guarde o CPF para futuras buscas\n\n**AO CRIAR EVENTO:**\n✓ Defina o anfitrião correto\n✓ Escolha o grupo de acesso apropriado\n✓ Defina datas/horários corretos\n✓ Revise antes de salvar\n\n**SEGURANÇA:**\n✓ Sempre confirme a identidade do visitante\n✓ Não reutilize fotos de visitantes diferentes\n✓ Mantenha dados atualizados\n✓ Revise eventos pendentes regularmente\n\n**PARA MÚLTIPLOS VISITANTES:**\n✓ Use "SALVAR E CADASTRAR NOVO"\n✓ Tenha todos os documentos em mão\n✓ Realize em lote para eficiência', 'published');
