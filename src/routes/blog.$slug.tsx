import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getPost } from "@/content/blog";
import { BlogCta, BlogShell, RichText } from "@/components/blog/BlogShell";
import { breadcrumbLd, SITE } from "@/lib/seo";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => {
    const post = getPost(params.slug);
    if (!post) throw notFound();
    return post;
  },
  head: ({ params, loaderData: p }) => {
    if (!p) return { meta: [{ title: "Artigo não encontrado — VargasTI" }, { name: "robots", content: "noindex" }] };
    const url = `${SITE}/blog/${params.slug}`;
    return {
      meta: [
        { title: `${p.title} | VargasTI` },
        { name: "description", content: p.description },
        { property: "og:title", content: p.title },
        { property: "og:description", content: p.description },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "article:published_time", content: p.date },
        { name: "twitter:card", content: "summary" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: p.title,
            description: p.description,
            datePublished: p.date,
            inLanguage: "pt-BR",
            mainEntityOfPage: url,
            author: { "@type": "Organization", name: "VargasTI", url: SITE },
            publisher: { "@type": "Organization", name: "VargasTI", url: SITE },
          }),
        },
        breadcrumbLd([
          { name: "Blog", path: "/blog" },
          { name: p.title, path: `/blog/${params.slug}` },
        ]),
      ],
    };
  },
  notFoundComponent: () => (
    <BlogShell>
      <h1 className="text-2xl font-bold text-white">Artigo não encontrado</h1>
      <Link to="/blog" className="mt-4 inline-block text-cyan-300">← Voltar ao blog</Link>
    </BlogShell>
  ),
  component: PostPage,
});

function PostPage() {
  const p = Route.useLoaderData();
  return (
    <BlogShell>
      <nav className="text-xs text-slate-500">
        <Link to="/" className="hover:text-slate-300">Início</Link> / <Link to="/blog" className="hover:text-slate-300">Blog</Link>
      </nav>
      <article className="mt-4">
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight text-white">{p.title}</h1>
        <p className="mt-3 text-xs text-slate-500">
          {new Date(p.date + "T12:00:00").toLocaleDateString("pt-BR")} · {p.readMinutes} min de leitura
        </p>
        <div className="mt-8 space-y-4 text-[17px] leading-relaxed text-slate-300">
          {p.intro.map((t, i) => <p key={i}><RichText text={t} /></p>)}
        </div>
        {p.sections.map((s) => (
          <section key={s.h2} className="mt-10">
            <h2 className="text-2xl font-semibold text-white">{s.h2}</h2>
            <div className="mt-4 space-y-4 text-[17px] leading-relaxed text-slate-300">
              {s.body.map((t, i) => <p key={i}><RichText text={t} /></p>)}
            </div>
            {s.bullets && (
              <ul className="mt-4 list-disc pl-6 space-y-2 text-slate-300">
                {s.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </section>
        ))}
        <BlogCta />
      </article>
    </BlogShell>
  );
}
