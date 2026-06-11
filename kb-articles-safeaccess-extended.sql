-- SafeAccess Knowledge Base - Extended Articles
-- Version: 2.0
-- Created from: SafeAccess Funcionalidades + Tutorial Cadastro de Visitas
-- Last Updated: 2026-06-11

-- ============================================================================
-- VISÃO GERAL DO SISTEMA
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'SafeAccess - Sistema Completo de Controle de Acesso',
  '**SafeAccess** é um sistema 100% web de controle de acesso para pessoas e veículos.

**Características Principais:**
- Interface amigável e intuitiva
- Compatível com todos os principais navegadores
- Gerencia: Identificadores, Domínios, Controladores, Faixas Horárias, Grupos de Acesso
- Suporta múltiplas tecnologias de identificação
- Integração com câmeras CFTV
- Reconhecimento facial avançado
- Leitura de placas veiculares (LPR)
- Dashboard personalizável com widgets em tempo real

**Desenvolvido por:** Commbox Tecnologia
**Contato:** contato@commbox.com.br | +55 51 3026.2300',
  'published',
  now()
);

-- ============================================================================
-- DASHBOARD
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Dashboard - Visualização em Tempo Real',
  'O **Dashboard** é a tela inicial parametrizável que fornece visão geral do sistema.

**Recursos Disponíveis:**

**Widgets Gráficos:**
- Gráfico de acessos (autorizado, negado, manual)
- Gráfico de acessos no estacionamento
- Gráfico de visitantes presentes
- Acionamentos de contingência
- Presença e ocupação

**Widgets Contadores:**
- Equipamentos online/offline
- Identificadores provisórios utilizados
- Resumo de acessos
- Tipos de alarmes
- Vagas disponíveis no estacionamento
- Visitantes presentes
- Usuários ativos
- Identificadores ativos

**Funcionalidades:**
- ✓ Widgets deslocáveis e redimensionáveis
- ✓ Busca rápida de usuários (retorna nome, último acesso, sentido, equipamento)
- ✓ Comandos de acesso manual rápido
- ✓ Controle de trocas de área
- ✓ Filtro de domínio em widgets
- ✓ Configuração individual de cada widget',
  'published',
  now()
);

-- ============================================================================
-- GESTÃO DE ACESSOS
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Gestão de Acessos - Perfis e Permissões',
  'A **Gestão de Acessos** permite criar perfis completos de acesso com múltiplas tecnologias.

**Tipos de Perfis de Acesso:**

1. **Perfis de Usuário**
   - Definem locais onde usuários terão acesso
   - Faixas horárias (quando acesso é permitido)
   - Tecnologias: Biometria, Cartão, Senha, Facial
   - Combinações: Biometria + Senha, Cartão + Biometria, Senha + Biometria

2. **Tipos de Permissão**
   - Acesso padrão
   - Acompanhante (usuário pode trazer acompanhante)
   - Requer Acompanhante (deve ser acompanhado)
   - Dupla Autenticação
   - Tripla Autenticação

3. **Perfis de Veículos**
   - Liberação automática ou manual
   - Tecnologias de identificação
   - Faixas horárias por veículo

**Controles Avançados:**
- Restrição por horário, dias da semana e feriados
- Data de validade do grupo de acesso
- Controle de inatividade baseado em critérios
- Contagem de usuários em áreas controladas
- Bloqueio por ocupação máxima
- Regras de intervalo customizáveis
- Monitoramento de acesso por vídeo
- Perfis de monitoramento (público/privado)
- Necessita liberação para usuários/visitas',
  'published',
  now()
);

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Gestão de Acessos - Equipamentos de Acesso',
  'SafeAccess suporta diversos tipos de equipamentos para acesso.

**Equipamentos Suportados:**

**Controle de Portas:**
- Porta/Cancela Simples
- Catraca/Torniquete Genérico
- Catraca PNE
- Catraca Motorizada
- Catraca WOLPAC
- Cancela Duplo Acesso
- Eclusa

**Controladoras:**
- MCA v0
- MCA v2
- MCA v4

**Tecnologias de Identificação:**
- Biometria (impressão digital)
- Leitura de Cartão (MIFARE, código de barras)
- Senha numérica
- Reconhecimento Facial
- QR Code
- Combinações de tecnologias

**Recursos de Monitoramento:**
✓ Visualização de status ONLINE/OFFLINE em tempo real
✓ Histórico de eventos por equipamento
✓ Notificações por e-mail quando offline
✓ Agendamento de comandos (trancar/destrancar)
✓ Visualização de playback de acesso
✓ Monitoramento de bateria/fonte da MCA v2/v4',
  'published',
  now()
);

-- ============================================================================
-- GESTÃO DE USUÁRIOS
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Gestão de Usuários - Cadastro e Características',
  'Sistema completo de gerenciamento de usuários com suporte a múltiplas fotos e documentos.

**Características do Cadastro:**

**Informações Básicas:**
- Nome completo
- CPF (obrigatório)
- Múltiplos telefones (classificados por tipo)
- Vínculo a local físico (ex: casa 703)

**Arquivos e Fotos:**
- Até 5 fotos (uma como principal)
- Captura de foto principal + 4 documentos
- Imagem de assinatura
- Documentos digitalizados

**Agrupamento:**
- Grupos de usuários customizáveis (Funcionários, Terceiros, Visitantes, Moradores)
- Campos obrigatórios por grupo
- Campos adicionais customizáveis

**Situações de Cadastro:**
- Ativo / Inativo
- Possibilidade de bloquear acesso por situação

**Controles de Validade:**
- Controle de documentos vencidos
- Bloqueio por vencimento geral ou por grupo de acesso
- Notificações por e-mail antes/depois vencimento
- LGPD: exclusão automática de cadastros

**Funcionalidades Especiais:**
✓ Afastamentos e férias com controle de bloqueio
✓ QR Code temporário
✓ Acompanhantes temporários
✓ Alerta/observações múltiplas
✓ Bloqueio em lote
✓ Importação de usuários (.csv/.txt)
✓ Importação de fotos
✓ Configuração de cartão MIFARE personalizado
✓ Acesso sistema somente para cadastro de visitas',
  'published',
  now()
);

-- ============================================================================
-- GESTÃO DE VISITANTES
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Gestão de Visitantes - Registro e Autorização',
  'Sistema de controle de visitantes com agendamento e autorização.

**Busca Rápida:**
- Por nome, RG ou CPF
- Dados armazenados para reutilização em futuras visitas

**Cadastro de Visita:**
- Anfitrião da visita (contato responsável)
- Grupo de usuários (VISITANTES, etc)
- Grupo de acesso
- Data e hora de início/término
- Biometria do visitante
- Foto (webcam ou câmera CFTV)
- 5 imagens armazenáveis

**Recursos Avançados:**
- Agendamento de visitas
- Baixa automática quando cartão depositado na urna
- Baixa manual de visitante
- Listagem de visitantes presentes
- Verificação se contato está presente
- Mensagem de alerta se visitante tem observação
- Campos personalizáveis e obrigatórios
- Limite máximo de visitantes configurável
- Faixa horária da visita

**Autorização:**
- Liberação por autorização do operador
- Acesso com QR Code gerado
- Cadastro sem presença do visitado (notificação ao operador)
- Ativação automática de visitas agendadas
- Identificação de acompanhantes

**Integração CIP:**
- Geração de convite de visita
- Aprimoramento da gestão de acesso

**LGPD:**
- Exclusão automática baseada em último acesso
- Visitantes expirados listados em aba específica',
  'published',
  now()
);

-- ============================================================================
-- IDENTIFICADORES
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Gestão de Identificadores - Cartões e Tecnologias',
  'Gerenciamento de todos os tipos de identificadores para acesso.

**Tecnologias Suportadas:**
- Código de barras
- MIFARE (cartões inteligentes)
- Cartões personalizados MIFARE
- QR Code (geração automática)
- CPF/Passaporte (para recintos alfandegários)

**Registro de Identificadores:**

**Formas de Cadastro:**
1. Unitária (um por um)
2. Lote com numeração sequencial
3. Lote via leitora USB
4. Importação de arquivo .txt ou .csv

**Atributos:**
- Status (Ativa, Inativa, Extraviada)
- Tipo (Permanente, Visitante, Terceiro, Provisório)
- Data de validade
- Associação com usuário

**Funcionalidades:**
✓ Pesquisa rápida
✓ Vencimento automático de identificadores provisórios
✓ Geração de QR Code com formatos (decimal, hexadecimal, dinâmico)
✓ Customização de impressão QR Code
✓ Terminal Morpho Wave (sem toque)
✓ Dupla autenticação: Mifare + Facial

**Leitura:**
- Via leitora de mesa USB
- Captura de biometria
- Leitura de cartão integrada',
  'published',
  now()
);

-- ============================================================================
-- RECONHECIMENTO FACIAL
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Reconhecimento Facial - Integração e Equipamentos',
  'Sistema avançado de identificação por reconhecimento facial.

**Equipamentos Compatíveis:**

**Terminais ZKteco:**
- Speed Face-V5, V5 TD, V4L(F)
- Pro Face X (TI)
- Detecção de temperatura
- Detecção de máscara

**Outros Fabricantes:**
- Comba ScanVis - GateGuard Series
- Hikvision: DS-K1T671M, DS-K1T673TDWX
- DAHUA: DHI-ASI7214Y-V3 (7\", 50k faces), DHI-ASI6214J-MFW (4,3\", 6k faces)
- Intelbras: SS 5530 MF FACE (v8.6+)
- Commbox: CXF 600

**CXF 600 Recursos Adicionais:**
- Leitura de QR Code
- Leitor de cartão MiFare
- Gestão de usuários integrada

**Software de Identificação:**
- Compatibilidade com SVA

**Recursos:**
✓ Vínculo com grupo de acesso
✓ Vínculo com controladoras MCA10
✓ Sincronização facial para reenviar usuários e fotos
✓ Dupla autenticação: Mifare + Facial

**Dicas de Uso:**
- Não use óculos na foto
- Boa iluminação essencial
- Mantenha expressão neutra
- Sem acessórios que cubram o rosto',
  'published',
  now()
);

-- ============================================================================
-- LPR - LEITURA DE PLACAS
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'LPR - Leitura de Placas Veiculares',
  'Sistema de Leitura de Placa Veicular (License Plate Recognition) para acesso automático de veículos.

**Tipos de Acesso:**

1. **Acesso Automático**
   - Leitura de placa automática
   - Liberação automática se placa autorizada
   - Sem intervenção do operador

2. **Acesso Assistido**
   - Operador analisa leitura
   - Liberação manual após validação
   - Maior controle e segurança

**Compatibilidades:**

**Gerenciadores de Vídeo:**
- Digifort
- Seventh
- Hikvision
- Axxon Next e Axxon One

**Câmeras Específicas:**
- Intelbras VIP7250 LPR
- Até 2 câmeras por sentido (entrada/saída)

**Integrações Software:**
- LPR SVA via serviços

**Funcionalidades:**
✓ Identificação de entrada e saída
✓ Relatório de veículos que entraram e não saíram
✓ Captura de imagem no momento do acesso
✓ Compatível com placas padrão Mercosul
✓ Parametrização de entrada/saída por câmera
✓ Perfis de acesso assistido customizáveis
✓ Monitoramento de acessos manuais e automáticos
✓ Relatórios detalhados de acesso veicular

**Disponível para:** Controladora MCA10',
  'published',
  now()
);

-- ============================================================================
-- INTEGRAÇÕES
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Integrações do SafeAccess com Sistemas Corporativos',
  'SafeAccess integra-se com diversos sistemas corporativos para automação completa.

**Microsoft Active Directory (AD):**
- Importação automática de usuários do AD
- Uso de credenciais de rede corporativa
- Sincronização automática de permissões
- Validade de vínculos por grupo de acesso
- Relatórios de auditoria de ações no AD

**Sistemas de RH e Folha:**
- Lyceum: cadastro/atualização de usuários
- Prime: cadastro/atualização de usuários
- GvDasa: sincronização de usuários e regras de acesso
- Envio de eventos de acesso para sistemas externos

**Infraestrutura:**
- Elevadores Thyssenkrupp (chamada antecipada)
- Direcionamento para elevador específico

**Gestão de Visitas:**
- Tactio: fluxo de visitas integrado ao totem
- API para cadastro/atualização de visitas
- CIP (Commbox Invite Provider): geração de convites

**CFTV e Câmeras:**
- Digifort
- Seventh
- Axxon Soft, Axxon One, Axxon Next
- Axis
- Intelbras (DVR)
- Hikvision (DVR)
- Visualização em tempo real
- Playback de câmeras
- Captura de fotos para cadastro de visitantes',
  'published',
  now()
);

-- ============================================================================
-- ESTACIONAMENTO
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Gestão de Estacionamento - Controle de Vagas',
  'Sistema completo de controle de ocupação e vagas de estacionamento.

**Recursos Disponíveis:**

**Organização:**
- Cadastro de setores
- Cadastro de vagas
- Grupos em setores (particionamentos)
- Vínculo de grupos de estacionamento a setores

**Controle de Ocupação:**
- Bloqueio automático ao atingir ocupação máxima
- Registro manual de entradas/saídas
- Vagas disponíveis por grupo
- Visualização em tempo real

**Cadastro de Veículos:**
- Placa padrão brasileiro
- Placa padrão Mercosul
- Proprietário
- Condutor

**Recursos de Sinalização:**
- Utilização de relés como semáforo
- Indicação de vagas disponíveis
- Indicação de lotação
- Monitoramento em tempo real no dashboard

**Informações:**
- Quantidade de vagas por grupo
- Ocupação máxima configurável
- Bloqueio automático quando lotado',
  'published',
  now()
);

-- ============================================================================
-- ALARMES E MONITORAMENTO
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Monitoramento e Gestão de Alarmes',
  'Sistema de monitoramento centralizado e gerenciamento inteligente de alarmes.

**Tipos de Monitoramento:**

1. **Acessos:**
   - Via log (histórico)
   - Via vídeo em tempo real
   - Personalizável (escolha de dados visíveis)

2. **Equipamentos:**
   - Status ONLINE/OFFLINE tempo real
   - Histórico de eventos (falha de comunicação, etc)
   - Notificações por e-mail

3. **Alarmes:**
   - Monitoramento através de plantas baixas
   - Interface dedicada para gestão

4. **Estacionamento:**
   - Monitoramento em tempo real de entrada/saída
   - Ocupação atual

**Gestão de Alarmes:**

**Configuração:**
- Qualquer evento pode ser configurado como alarme
- Criação de perfis de alarme
- Exemplos: Biometria de coação, tentativas fracassadas, etc

**Fluxo de Atendimento:**
- Controle do fluxo
- Orientação ao operador
- Procedimentos automatizados
- Justificativa de eventos agrupados

**Recursos:**
✓ Pausa de rolagem de eventos para análise
✓ Seleção múltipla de grupos de equipamentos
✓ Geração de relatórios de alarmes
✓ Remoção automática após X dias sem alteração
✓ Notificação de responsáveis sobre vencimentos

**Ações Automáticas:**
- Disparo de ações via evento de acesso
- Agendamento de eventos por data/hora
- Acionamentos de contingência',
  'published',
  now()
);

-- ============================================================================
-- TROUBLESHOOTING - ACESSO GERAL
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Troubleshooting - Problemas Comuns de Acesso',
  'Soluções para problemas mais frequentes no controle de acesso.

**PROBLEMA: Usuário não consegue acessar**

**Verificações:**
1. ✓ Usuário está ativo no cadastro?
2. ✓ Grupo de acesso está válido (não vencido)?
3. ✓ Identificador está associado ao usuário?
4. ✓ Identificador está ativo (não extraviado)?
5. ✓ Horário atual está na faixa permitida?
6. ✓ Equipamento de acesso está ONLINE?
7. ✓ Ocupação máxima da área foi atingida?

**Soluções Comuns:**
- Verificar data de validade do identificador
- Conferir horário de acesso no grupo de acesso
- Validar configuração biométrica (se usada)
- Resetar equipamento
- Notificar administrador

**PROBLEMA: Equipamento offline**

**Causas Possíveis:**
- Falha de rede/conectividade
- Equipamento desligado
- IP incorreto configurado
- Cabo de rede solto

**Solução:**
- Verificar conexão de rede
- Pingar equipamento por IP
- Verificar status no Dashboard
- Reiniciar equipamento se necessário

**PROBLEMA: Visitante não consegue sair**

**Possíveis Causas:**
- Visita já expirou
- Cartão não foi depositado na urna
- Baixa manual não realizada

**Soluções:**
- Realizar baixa manual do visitante
- Verificar data/hora da visita
- Renovar período se necessário',
  'published',
  now()
);

-- ============================================================================
-- MELHORES PRÁTICAS
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'Melhores Práticas - Implementação de Controle de Acesso',
  'Recomendações para implementação eficiente e segura do SafeAccess.

**PLANEJAMENTO:**
✓ Mapear todas as áreas que necessitam controle
✓ Definir grupos de usuários (Funcionários, Visitantes, Terceiros)
✓ Estabelecer grupos de acesso por função/departamento
✓ Definir faixas horárias de acesso

**CADASTRO DE USUÁRIOS:**
✓ Usar nome completo (facilita buscas futuras)
✓ Guardar cópias de documentos
✓ Atualizar dados regularmente
✓ Usar campos customizáveis para informações adicionais
✓ Manter fotos atualizadas

**IDENTIFICADORES:**
✓ Usar sistema sequencial para facilitar rastreamento
✓ Marcar identificadores físicos com número
✓ Manter controle de cartões em branco
✓ Registrar entrega a usuários
✓ Configurar validade apropriada

**VISITANTES:**
✓ Sempre capturar foto no cadastro
✓ Verificar documento de identidade
✓ Definir período apropriado de visita
✓ Confirmar com anfitrião
✓ Realizar baixa ao fim da visita

**SEGURANÇA:**
✓ Revisar logs regularmente
✓ Auditar tentativas de acesso negado
✓ Monitorar equipamentos offline
✓ Manter backup de dados
✓ Trocar senhas de operadores periodicamente
✓ Restringir permissões de operadores

**MANUTENÇÃO:**
✓ Verificar equipamentos regularmente
✓ Limpeza de leitores biométricos
✓ Atualizar firmware de equipamentos
✓ Gerar relatórios mensais
✓ Revisar acessos expirados',
  'published',
  now()
);

-- ============================================================================
-- CONFORMIDADE
-- ============================================================================

INSERT INTO kb_articles (title, content, status, created_at) VALUES (
  'LGPD - Conformidade e Privacidade de Dados',
  'Recursos do SafeAccess para atender à Lei Geral de Proteção de Dados (LGPD).

**Recursos de Conformidade:**

**Exclusão Automática de Dados:**
- Visitantes: exclusão baseada em último acesso ou última alteração
- Usuários: exclusão automática configurável
- Identificadores provisórios: baixa automática ao vencer

**Auditoria e Rastreamento:**
- Registro de todas as modificações em cadastros principais
- Rastreamento de ações por operador
- Logs de acesso (data, hora, usuário, equipamento)
- Relatórios de auditoria disponíveis

**Gestão de Consentimento:**
- Documentos podem ser anexados (políticas de privacidade)
- Leitura obrigatória antes de acesso

**Controle de Acesso:**
- Restrições por operador (não pode ver dados de outros operadores)
- Permissões granulares por módulo
- Rastreamento de quem acessa quais dados

**Relatórios:**
- Exportação de acessos por período
- Rastreamento de modificações
- Logs de operadores

**Recomendações:**
✓ Revisar política de dados regularmente
✓ Documentar consentimentos
✓ Configurar exclusão automática apropriada
✓ Auditar acessos regularmente
✓ Manter backup para conformidade
✓ Treinar operadores sobre LGPD',
  'published',
  now()
);
