import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/contato")({
  head: () => {
    const base = pageHead({ path: "/contato", title: "Contato — VargasTI | Suporte de TI em Porto Alegre", description: "Entre em contato com VargasTI. Telefone, email e formulário. Estamos prontos para atender sua empresa em POA.", crumb: "Contato" });
    return { ...base };
  },
  component: () => <LandingPage scrollTo="contato" />,
});
