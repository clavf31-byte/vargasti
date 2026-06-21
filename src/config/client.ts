const client = {
  name: "VargasTI",
  shortName: "VargasTI",
  slogan: "Soluções que conectam. Suporte que transforma.",
  sloganShort: "Suporte que transforma.",
  domain: "www.vargasti.com.br",
  appDomain: "app.vargasti.com.br",
  whatsapp: "https://wa.me/5551998808343",
  logoUrl: null as string | null,

  modules: {
    landing: true,
    crm: true,
    chamados: true,
    projetos: true,
    ferramentas: true,
    arquivos: true,
    anotacoes: true,
  },
} as const;

export default client;
