import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/plataforma")({
  head: () => {
    const base = pageHead({ path: "/plataforma", title: "Plataforma de gestão de TI — VargasTI", description: "Plataforma VargasTI: sistema integrado de helpdesk, gestão de ativos, agendamento e muito mais.", crumb: "Plataforma" });
    return { ...base };
  },
  component: () => <LandingPage scrollTo="plataforma" />,
});
