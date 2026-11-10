import { createFileRoute } from "@tanstack/react-router";
import { pageHead } from "@/lib/seo";
import { LandingPage } from "@/components/LandingPage";

export const Route = createFileRoute("/sobre")({
  head: () => {
    const base = pageHead({ path: "/sobre", title: "Sobre a VargasTI — Especialistas em tecnologia", description: "Sobre VargasTI: especialistas em tecnologia com a missão de conectar empresas através de soluções eficientes em Porto Alegre e região.", crumb: "Sobre" });
    return { ...base };
  },
  component: () => <LandingPage scrollTo="sobre" />,
});
