export type BlogSection = { h2: string; body: string[]; bullets?: string[] };
export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string;
  readMinutes: number;
  intro: string[];
  sections: BlogSection[];
};

// Links internos usam a sintaxe [texto](/caminho) e são convertidos em links do site.
export const POSTS: BlogPost[] = [
  {
    slug: "sinais-empresa-precisa-suporte-ti-profissional",
    title: "5 sinais de que sua empresa precisa de suporte de TI profissional",
    description:
      "Lentidão, quedas, backups duvidosos: veja 5 sinais de que sua empresa já precisa de suporte de TI profissional e como resolver isso sem complicação.",
    date: "2026-11-10",
    readMinutes: 6,
    intro: [
      "Em muitas pequenas e médias empresas, a TI cresce no improviso. Alguém da equipe que \"entende de computador\" resolve os problemas do dia a dia, um sobrinho configura o roteador e o backup fica para depois. Funciona por um tempo, até que um problema maior aparece e custa caro.",
      "Se você está em dúvida sobre o momento certo de contratar um suporte de TI profissional, observe os sinais abaixo. Se dois ou mais deles parecem familiares, provavelmente esse momento já chegou.",
    ],
    sections: [
      {
        h2: "1. Os mesmos problemas voltam toda semana",
        body: [
          "Impressora que para de funcionar, internet que cai no meio da tarde, computador que trava sempre no mesmo programa. Quando o problema se repete, ele não foi resolvido, só foi contornado. Cada reinicialização improvisada esconde uma causa que continua lá.",
          "Um suporte profissional trabalha com registro de chamados: cada ocorrência fica documentada, o histórico mostra padrões e a causa raiz é tratada de vez. É a diferença entre apagar incêndios e evitar que eles comecem. Na VargasTI, todo atendimento fica registrado na nossa [central de serviços](/solucoes), com acompanhamento até a solução.",
        ],
      },
      {
        h2: "2. Sua equipe perde tempo esperando a TI",
        body: [
          "Some os minutos que cada colaborador perde por dia com lentidão, senhas bloqueadas, arquivos que não abrem ou sistemas fora do ar. Multiplique pelo tamanho da equipe e pelos dias úteis do mês. O resultado costuma surpreender: é tempo produtivo pago e não aproveitado.",
          "Além do tempo, há o desgaste. Profissionais frustrados com ferramentas que não funcionam rendem menos e ficam mais propensos a criar \"soluções\" próprias, como salvar arquivos em pen drives ou usar contas pessoais, o que abre outros riscos.",
        ],
      },
      {
        h2: "3. Ninguém sabe ao certo se o backup funciona",
        body: [
          "Pergunte na sua empresa: onde está o backup, com que frequência ele é feito e quando foi a última vez que alguém testou restaurar um arquivo? Se as respostas forem vagas, o backup na prática não existe.",
          "Perda de dados pode acontecer por falha de disco, erro humano, furto de equipamento ou ataque de ransomware. Um backup confiável precisa ser automático, ficar fora do equipamento principal e ser testado periodicamente. Esse é um dos primeiros itens que um suporte profissional organiza.",
        ],
      },
      {
        h2: "4. Não existe um inventário dos equipamentos",
        body: [
          "Quantos computadores a empresa tem? Qual a idade de cada um? Quais licenças de software estão ativas e quando vencem? Sem essas respostas, fica difícil planejar compras, renovar garantias ou identificar a máquina que está atrasando todo um setor.",
          "A gestão de ativos de TI resolve isso com um cadastro centralizado de equipamentos, softwares e manutenções. Com ele, as decisões deixam de ser no achismo e o orçamento de tecnologia passa a ser previsível. Esse controle faz parte das [soluções da VargasTI](/solucoes) e fica disponível na nossa plataforma.",
        ],
      },
      {
        h2: "5. A segurança depende da sorte",
        body: [
          "Senhas compartilhadas, antivírus vencido, Wi-Fi da visita na mesma rede do financeiro e atualizações do sistema sempre adiadas. Nenhum desses pontos parece grave isoladamente, mas juntos formam a porta de entrada mais comum para ataques e vazamentos.",
          "Empresas pequenas não estão livres desse risco. Pelo contrário: muitas vezes são alvos justamente por terem menos proteção. Um suporte profissional aplica uma base mínima de segurança e mantém essa base atualizada.",
        ],
        bullets: [
          "Atualizações de sistema e programas aplicadas com regularidade",
          "Antivírus ativo e monitorado em todas as máquinas",
          "Rede de visitantes separada da rede interna",
          "Contas individuais com senhas fortes e verificação em duas etapas",
        ],
      },
      {
        h2: "Bônus: a TI virou assunto da diretoria",
        body: [
          "Quando o dono ou o gestor da empresa passa parte do dia resolvendo problemas de computador, negociando com operadora de internet ou procurando quem conserte a impressora, há um custo escondido: é o tempo de quem deveria estar cuidando do negócio.",
          "Tecnologia deve ser uma ferramenta que sustenta o crescimento, não mais uma tarefa na lista de quem decide. Delegar a TI para um parceiro especializado libera a liderança para focar em clientes, vendas e equipe, com a segurança de que alguém está acompanhando a parte técnica de perto.",
          "Também fica mais fácil planejar. Com relatórios de atendimento e um inventário atualizado, a diretoria passa a enxergar quanto a empresa gasta com tecnologia, onde estão os gargalos e quais investimentos trazem mais retorno, em vez de descobrir tudo só quando algo quebra.",
        ],
      },
      {
        h2: "O que muda com um suporte de TI profissional",
        body: [
          "Contratar suporte não significa necessariamente ter um técnico em tempo integral na empresa. Para a maioria das PMEs, o modelo mais eficiente é um parceiro externo que combina atendimento remoto, visitas presenciais quando necessário e manutenção preventiva.",
          "Na prática, você ganha um canal único para pedir ajuda, prazos de atendimento combinados, histórico de tudo o que foi feito e alguém olhando para a sua TI antes que ela pare. Para entender como trabalhamos e quem somos, conheça a [VargasTI](/sobre).",
        ],
      },
    ],
  },
  {
    slug: "como-escolher-provedor-helpdesk-porto-alegre",
    title: "Como escolher um provedor de helpdesk em Porto Alegre",
    description:
      "Guia prático para escolher um provedor de helpdesk em Porto Alegre: prazos de atendimento, suporte presencial, transparência e o que perguntar antes.",
    date: "2026-11-10",
    readMinutes: 6,
    intro: [
      "Escolher um provedor de helpdesk é escolher quem vai atender sua equipe nos momentos de maior pressão: o sistema que parou no fechamento do mês, a internet que caiu antes de uma reunião importante, o computador do diretor que não liga.",
      "Por isso, preço não pode ser o único critério. Abaixo estão os pontos que realmente fazem diferença na hora de contratar um helpdesk em Porto Alegre e região metropolitana, e as perguntas que vale fazer antes de assinar.",
    ],
    sections: [
      {
        h2: "Entenda o que sua empresa precisa",
        body: [
          "Antes de comparar fornecedores, faça um retrato rápido da sua TI: quantos usuários e computadores existem, quais sistemas são críticos para o negócio, se há servidor local ou tudo está na nuvem, e quais problemas mais aparecem hoje.",
          "Com isso em mãos, fica mais fácil avaliar propostas e evitar pagar por serviços que não serão usados ou, pior, descobrir depois que algo importante ficou de fora do contrato.",
        ],
      },
      {
        h2: "Prazos de atendimento claros",
        body: [
          "Um bom provedor deixa explícito em quanto tempo responde a um chamado e em quanto tempo resolve, de acordo com a prioridade. Um problema que para a empresa inteira não pode esperar na mesma fila de uma troca de mouse.",
          "Pergunte como as prioridades são definidas, qual o horário de atendimento e o que acontece fora dele. Desconfie de promessas genéricas como \"atendimento rápido\" sem nenhum número por trás.",
        ],
      },
      {
        h2: "Atendimento remoto e presencial",
        body: [
          "A maior parte dos chamados pode ser resolvida remotamente, o que é mais rápido e mais barato. Mas alguns problemas exigem alguém no local: cabeamento, troca de peças, configuração de rede, instalação de equipamentos.",
          "Ter um provedor com atuação em Porto Alegre e região faz diferença nesses casos. Pergunte qual a área de cobertura presencial, como as visitas são agendadas e se elas estão incluídas no contrato ou são cobradas à parte.",
        ],
      },
      {
        h2: "Transparência: você consegue acompanhar os chamados?",
        body: [
          "Um ponto muitas vezes esquecido é a visibilidade. Você deveria conseguir ver quais chamados foram abertos, quem atendeu, quanto tempo levou e qual foi a solução. Sem isso, é impossível saber se o serviço contratado está sendo entregue.",
          "Na VargasTI, os clientes acompanham atendimentos, orçamentos e ordens de serviço em uma plataforma própria, com histórico completo. Veja mais sobre isso nas nossas [soluções](/solucoes).",
        ],
      },
      {
        h2: "Prevenção, não só correção",
        body: [
          "Helpdesk que só age quando algo quebra mantém sua empresa sempre um passo atrás. Procure um parceiro que também ofereça manutenção preventiva, monitoramento, controle de backup e gestão de ativos.",
          "Essas rotinas reduzem o volume de chamados ao longo do tempo e evitam paradas inesperadas, o que no fim das contas sai mais barato do que qualquer atendimento emergencial.",
        ],
      },
      {
        h2: "Sinais de alerta em uma proposta",
        body: [
          "Algumas características de uma proposta merecem atenção redobrada. Contratos muito longos sem possibilidade de saída, cobrança por chamado sem nenhum teto mensal e ausência de qualquer relatório de atendimento são exemplos comuns.",
          "Outro ponto é a dependência de uma única pessoa. Se todo o conhecimento sobre a sua TI fica na cabeça de um técnico, qualquer férias ou desligamento vira um problema para você. Prefira provedores que documentam senhas, configurações e equipamentos de forma organizada e que entregam essa documentação para a empresa.",
          "Por fim, observe como o fornecedor lida com segurança e privacidade. Ele vai acessar seus computadores e dados, então precisa explicar como protege esses acessos, quem da equipe dele pode entrar nos seus sistemas e como isso fica registrado.",
        ],
      },
      {
        h2: "Perguntas para fazer antes de contratar",
        body: ["Use esta lista nas conversas com os fornecedores que você está avaliando:"],
        bullets: [
          "Qual o prazo de resposta e de solução para cada nível de prioridade?",
          "Qual o horário de atendimento e como funcionam urgências fora dele?",
          "Visitas presenciais estão incluídas? Qual a área de cobertura?",
          "Como eu acompanho os chamados e os relatórios do serviço?",
          "O contrato inclui manutenção preventiva e verificação de backup?",
          "Como funciona a cobrança de peças, equipamentos e serviços extras?",
          "Quanto tempo leva para encerrar o contrato, se for preciso?",
        ],
      },
      {
        h2: "Conheça antes de decidir",
        body: [
          "Uma boa conversa inicial já revela muito: o fornecedor fez perguntas sobre o seu negócio ou só apresentou um preço? Explicou como trabalha de forma clara? Um parceiro de TI deve facilitar a sua rotina desde o primeiro contato.",
          "Se quiser conhecer melhor a nossa forma de trabalhar, leia [sobre a VargasTI](/sobre) ou [fale diretamente com a gente](/contato).",
        ],
      },
    ],
  },
  {
    slug: "seguranca-de-rede-checklist-para-empresas",
    title: "Segurança de rede: checklist para empresas",
    description:
      "Checklist prático de segurança de rede para empresas: firewall, Wi-Fi, senhas, atualizações, backup e treinamento da equipe. Veja o que revisar hoje.",
    date: "2026-11-10",
    readMinutes: 7,
    intro: [
      "A rede é o caminho por onde passam os dados da sua empresa: e-mails, sistemas financeiros, arquivos de clientes, câmeras e até a impressora. Se ela estiver vulnerável, tudo o que está conectado a ela também está.",
      "Este checklist reúne os controles básicos que toda empresa, de qualquer tamanho, deveria ter. Use-o para uma revisão rápida e marque o que já está em ordem e o que precisa de atenção.",
    ],
    sections: [
      {
        h2: "1. Firewall e roteador",
        body: [
          "O roteador fornecido pela operadora de internet geralmente vem com configurações de fábrica pensadas para uso doméstico. Em uma empresa, ele precisa ser revisado ou substituído por um equipamento adequado.",
        ],
        bullets: [
          "Senha de administração do roteador trocada (nunca a senha padrão)",
          "Firmware do roteador e do firewall atualizado",
          "Portas abertas para a internet revisadas e justificadas",
          "Acesso remoto à administração desativado ou protegido",
        ],
      },
      {
        h2: "2. Wi-Fi corporativo e de visitantes",
        body: [
          "Compartilhar a senha do Wi-Fi interno com visitantes, fornecedores e celulares pessoais é um dos erros mais comuns. Qualquer dispositivo nessa rede consegue, em tese, enxergar os computadores e servidores da empresa.",
        ],
        bullets: [
          "Rede de visitantes separada da rede interna",
          "Criptografia WPA2 ou WPA3 ativa",
          "Senha do Wi-Fi interno trocada periodicamente e quando alguém sai da empresa",
          "Dispositivos como câmeras e TVs isolados em rede própria, quando possível",
        ],
      },
      {
        h2: "3. Senhas e acessos",
        body: [
          "Contas compartilhadas impedem saber quem fez o quê e dificultam bloquear o acesso de quem saiu da empresa. Cada pessoa deve ter seu próprio usuário, com apenas as permissões que precisa para trabalhar.",
        ],
        bullets: [
          "Usuários individuais, sem contas genéricas compartilhadas",
          "Verificação em duas etapas no e-mail e nos sistemas críticos",
          "Uso de um gerenciador de senhas em vez de planilhas ou papéis",
          "Acessos removidos no mesmo dia em que um colaborador é desligado",
        ],
      },
      {
        h2: "4. Atualizações e antivírus",
        body: [
          "Grande parte dos ataques explora falhas que já foram corrigidas pelos fabricantes, mas que continuam abertas porque as atualizações foram adiadas. Manter sistemas em dia é uma das proteções mais baratas e eficazes.",
        ],
        bullets: [
          "Sistema operacional e programas atualizados automaticamente",
          "Antivírus ativo, atualizado e com alertas monitorados",
          "Equipamentos sem suporte do fabricante identificados e com plano de troca",
        ],
      },
      {
        h2: "5. Backup",
        body: [
          "Backup é a última linha de defesa contra ransomware, falhas de hardware e erros humanos. Ele só cumpre esse papel se estiver fora do alcance de um ataque e se a restauração funcionar de verdade.",
        ],
        bullets: [
          "Backup automático dos dados importantes",
          "Ao menos uma cópia fora do escritório ou na nuvem",
          "Cópia protegida contra alteração ou exclusão pelo ataque",
          "Teste de restauração feito periodicamente",
        ],
      },
      {
        h2: "6. Pessoas e processos",
        body: [
          "Tecnologia sozinha não resolve. Um e-mail falso bem feito pode convencer qualquer pessoa a clicar em um link ou passar uma senha. A equipe precisa saber reconhecer tentativas de golpe e a quem avisar quando algo parecer estranho.",
          "Também vale ter um inventário atualizado dos equipamentos conectados à rede. Não dá para proteger o que você não sabe que existe. A gestão de ativos, que faz parte das [soluções da VargasTI](/solucoes), ajuda exatamente nisso.",
        ],
        bullets: [
          "Orientação periódica da equipe sobre e-mails e mensagens suspeitas",
          "Canal claro para reportar incidentes",
          "Inventário de computadores, celulares e equipamentos de rede",
        ],
      },
      {
        h2: "Com que frequência revisar este checklist",
        body: [
          "Segurança não é um projeto que termina. Equipamentos novos entram na rede, pessoas chegam e saem da empresa, sistemas mudam e novas ameaças aparecem todos os meses. Uma configuração que estava correta há um ano pode não estar mais hoje.",
          "Como referência, vale revisar este checklist pelo menos a cada trimestre e sempre que houver uma mudança importante: troca de internet, mudança de endereço, contratação de um novo sistema ou saída de alguém com acesso administrativo.",
          "Registrar cada revisão também ajuda. Saber o que foi verificado, quando e por quem facilita auditorias, conversas com clientes que exigem cuidados com dados e o atendimento à LGPD, que pede medidas de segurança adequadas para proteger informações pessoais.",
        ],
      },
      {
        h2: "E se vários itens ficaram sem marcar?",
        body: [
          "É normal. A maioria das empresas descobre lacunas na primeira revisão. O importante é priorizar: comece por backup, atualizações e senhas, que são os pontos com maior impacto e menor custo.",
          "Se preferir contar com quem faz isso todos os dias, a equipe da VargasTI pode revisar sua rede e montar um plano de ação. Saiba mais [sobre a VargasTI](/sobre).",
        ],
      },
    ],
  },
];

export const getPost = (slug: string) => POSTS.find((p) => p.slug === slug);
