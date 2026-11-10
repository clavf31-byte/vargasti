import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — VargasTI" },
      { name: "description", content: "Conheça a VargasTI: soluções completas em tecnologia com suporte especializado." },
      { property: "og:title", content: "Sobre — VargasTI" },
      { property: "og:description", content: "Conheça a VargasTI: soluções completas em tecnologia com suporte especializado." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.vargasti.com.br/sobre" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.vargasti.com.br/sobre" }],
  }),
  component: () => <LandingPage scrollTo="sobre" />,
});
