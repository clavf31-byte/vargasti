import { createFileRoute, Link } from "@tanstack/react-router";
import { POSTS } from "@/content/blog";
import { BlogShell } from "@/components/blog/BlogShell";
import { pageHead } from "@/lib/seo";

export const Route = createFileRoute("/blog/")({
  head: () =>
    pageHead({
      path: "/blog",
      title: "Blog de TI para empresas — VargasTI",
      description: "Artigos práticos sobre suporte técnico, helpdesk, segurança de rede e gestão de TI para empresas de Porto Alegre e região.",
      crumb: "Blog",
    }),
  component: BlogIndex,
});

function BlogIndex() {
  return (
    <BlogShell>
      <h1 className="text-3xl sm:text-4xl font-bold text-white">Blog VargasTI</h1>
      <p className="mt-3 text-slate-400">Dicas práticas de tecnologia para empresas que querem mais eficiência e segurança.</p>
      <div className="mt-10 space-y-5">
        {POSTS.map((p) => (
          <Link key={p.slug} to="/blog/$slug" params={{ slug: p.slug }} className="block rounded-xl border border-white/[0.08] bg-white/[0.02] p-6 hover:border-cyan-400/40 transition">
            <h2 className="text-xl font-semibold text-white">{p.title}</h2>
            <p className="mt-2 text-sm text-slate-400">{p.description}</p>
            <p className="mt-3 text-xs text-cyan-300">{p.readMinutes} min de leitura →</p>
          </Link>
        ))}
      </div>
    </BlogShell>
  );
}
