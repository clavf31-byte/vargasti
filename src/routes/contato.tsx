import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — VargasTI" },
      { name: "description", content: "Fale com a VargasTI pelo WhatsApp e solicite atendimento para sua empresa." },
      { property: "og:title", content: "Contato — VargasTI" },
      { property: "og:description", content: "Fale com a VargasTI pelo WhatsApp e solicite atendimento para sua empresa." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.vargasti.com.br/contato" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.vargasti.com.br/contato" }],
  }),
  component: () => <LandingPage scrollTo="contato" />,
});
