import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const INTERNAL = {
  "/solucoes": "/solucoes",
  "/sobre": "/sobre",
  "/contato": "/contato",
  "/plataforma": "/plataforma",
} as const;

export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = p.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
        if (m && m[2] in INTERNAL) {
          return (
            <Link key={i} to={INTERNAL[m[2] as keyof typeof INTERNAL]} className="text-cyan-300 underline underline-offset-4 hover:text-cyan-200">
              {m[1]}
            </Link>
          );
        }
        return <span key={i}>{m ? m[1] : p}</span>;
      })}
    </>
  );
}

export function BlogShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05070d] text-slate-200">
      <header className="border-b border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg tracking-tight text-white">
            Vargas<span className="text-cyan-300">TI</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-slate-300">
            <Link to="/solucoes" className="hover:text-white">Soluções</Link>
            <Link to="/blog" className="hover:text-white">Blog</Link>
            <Link to="/sobre" className="hover:text-white">Sobre</Link>
            <Link to="/contato" className="hover:text-white">Contato</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">{children}</main>
      <footer className="border-t border-white/[0.06] py-6 text-center text-[11px] text-slate-500">
        © {new Date().getFullYear()} VargasTI · Soluções que conectam
      </footer>
    </div>
  );
}

export function BlogCta() {
  return (
    <aside className="mt-12 rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-white">Quer uma TI que funciona sem dor de cabeça?</h2>
      <p className="mt-2 text-slate-300">
        A VargasTI cuida do suporte técnico, da segurança e da gestão de equipamentos da sua empresa em Porto Alegre e região. Converse com a nossa equipe e receba uma avaliação da sua estrutura atual.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/contato" className="rounded-lg bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300">
          Fale com a VargasTI
        </Link>
        <Link to="/solucoes" className="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/5">
          Ver soluções
        </Link>
      </div>
    </aside>
  );
}
