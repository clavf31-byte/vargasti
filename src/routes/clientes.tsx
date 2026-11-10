import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — VargasTI" },
      { name: "description", content: "Empresas que confiam na VargasTI para resolver seus problemas de TI." },
      { property: "og:title", content: "Clientes — VargasTI" },
      { property: "og:description", content: "Empresas que confiam na VargasTI para resolver seus problemas de TI." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.vargasti.com.br/clientes" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: "https://www.vargasti.com.br/clientes" }],
  }),
  component: () => <LandingPage scrollTo="clientes" />,
});
