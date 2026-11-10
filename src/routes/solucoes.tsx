import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/solucoes")({
  head: () => ({
    meta: [
      { title: "Soluções — VargasTI" },
      { name: "description", content: "Suporte técnico, gestão de ativos, helpdesk e monitoramento de redes para empresas." },
      { property: "og:title", content: "Soluções — VargasTI" },
      { property: "og:description", content: "Suporte técnico, gestão de ativos, helpdesk e monitoramento de redes para empresas." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.vargasti.com.br/solucoes" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.vargasti.com.br/solucoes" }],
  }),
  component: () => <LandingPage scrollTo="solucoes" />,
});
