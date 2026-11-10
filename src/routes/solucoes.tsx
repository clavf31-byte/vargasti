import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { LandingPage } from "@/components/LandingPage";

const SERVICES = ["Suporte técnico em TI", "Gestão de ativos de TI", "Central de serviços (helpdesk)", "Orçamentos e ordens de serviço", "Agenda integrada", "Segurança de rede"];

export const Route = createFileRoute("/solucoes")({
  head: () => {
    const base = pageHead({ path: "/solucoes", title: "Soluções em TI para empresas — VargasTI", description: "Conheça as soluções VargasTI: suporte técnico, gestão de ativos, central de serviços, orçamentos, agenda integrada e segurança.", crumb: "Soluções" });
    return { ...base,
    scripts: [
      ...base.scripts,
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: SERVICES.map((name, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: { "@type": "Service", name, serviceType: name, provider: { "@type": "LocalBusiness", name: "VargasTI", url: "https://www.vargasti.com.br" }, areaServed: { "@type": "City", name: "Porto Alegre" } },
          })),
        }),
      },
    ] };
  },
  component: () => <LandingPage scrollTo="solucoes" />,
});
