import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/plataforma")({
  head: () => ({
    meta: [
      { title: "Plataforma — VargasTI" },
      { name: "description", content: "Plataforma própria VargasTI: chamados, ordens de serviço, orçamentos e agenda em um só lugar." },
      { property: "og:title", content: "Plataforma — VargasTI" },
      { property: "og:description", content: "Plataforma própria VargasTI: chamados, ordens de serviço, orçamentos e agenda em um só lugar." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.vargasti.com.br/plataforma" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.vargasti.com.br/plataforma" }],
  }),
  component: () => <LandingPage scrollTo="plataforma" />,
});
