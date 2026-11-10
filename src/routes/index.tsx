import { createFileRoute } from "@tanstack/react-router";
import { LandingPage } from "@/components/LandingPage";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "VargasTI — Soluções que conectam. Suporte que transforma." },
      {
        name: "description",
        content:
          "Tecnologia inteligente para empresas que buscam eficiência, segurança e inovação. Suporte técnico, gestão de ativos, orçamentos e plataforma própria.",
      },
      { property: "og:title", content: "VargasTI — Suporte que transforma." },
      {
        property: "og:description",
        content:
          "Plataforma completa para gestão de TI: suporte, ativos, chamados, orçamentos e agenda em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.vargasti.com.br/" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/907a6cd1-2920-45bb-920b-ce91e86e32a2/id-preview-d9c14fc2--7986ff08-8133-4212-8727-07856cd99021.lovable.app-1780923585782.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "VargasTI — Suporte que transforma." },
      { name: "twitter:description", content: "Tecnologia inteligente para empresas que buscam eficiência, segurança e inovação." },
      { name: "keywords", content: "suporte técnico TI Porto Alegre, gestão de TI, helpdesk empresarial, monitoramento de redes, suporte informática RS, VargasTI, gestão de ativos de TI, ordem de serviço TI" },
    ],
    links: [{ rel: "canonical", href: "https://www.vargasti.com.br/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": "VargasTI",
        "description": "Soluções completas em TI: suporte técnico, gestão de ativos, helpdesk, orçamentos e monitoramento de redes para empresas.",
        "url": "https://www.vargasti.com.br",
        "telephone": "+5551998808343",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+5551998808343",
          "contactType": "customer service",
          "availableLanguage": "Portuguese",
          "contactOption": "TollFree",
        },
        "areaServed": {
          "@type": "State",
          "name": "Rio Grande do Sul",
          "addressCountry": "BR",
        },
        "serviceType": [
          "Suporte Técnico em TI",
          "Gestão de Ativos de TI",
          "Helpdesk Empresarial",
          "Monitoramento de Redes",
          "Manutenção de Computadores",
          "Backup e Segurança de Dados",
        ],
        "address": {
          "@type": "PostalAddress",
          "addressRegion": "RS",
          "addressCountry": "BR",
        },
        "sameAs": [
          "https://www.vargasti.com.br",
          "https://wa.me/5551998808343",
        ],
      }),
    }],
  }),
  component: () => <LandingPage />,
});
