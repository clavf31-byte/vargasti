import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/clientes")({
  head: () => {
    const base = pageHead({ path: "/clientes", title: "Clientes — VargasTI", description: "Clientes VargasTI: conheça as empresas que confiam em nossas soluções de TI em Porto Alegre.", crumb: "Clientes" });
    return { ...base };
  },
  component: () => <LandingPage scrollTo="clientes" />,
});
