export const SITE = "https://www.vargasti.com.br";

export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [{ name: "Início", path: "/" }, ...items].map((it, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: it.name,
        item: `${SITE}${it.path === "/" ? "/" : it.path}`,
      })),
    }),
  };
}

export function pageHead(o: { path: string; title: string; description: string; type?: string; crumb?: string }) {
  const url = `${SITE}${o.path}`;
  return {
    meta: [
      { title: o.title },
      { name: "description", content: o.description },
      { property: "og:title", content: o.title },
      { property: "og:description", content: o.description },
      { property: "og:type", content: o.type ?? "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: url }],
    scripts: o.crumb ? [breadcrumbLd([{ name: o.crumb, path: o.path }])] : [],
  };
}
