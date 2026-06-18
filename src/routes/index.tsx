import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Headphones, Boxes, MessagesSquare, FileText, CalendarDays, ShieldCheck,
  ArrowRight, ArrowUpRight, User, Building2, Monitor, Phone, Menu, X,
  Sparkles, Leaf, HeartHandshake,
} from "lucide-react";
import vargastiLogo from "@/assets/vargasti-logo-clean.png.asset.json";

const SYSTEM_URL = "https://app.vargasti.com.br";
const WHATSAPP_URL = "https://wa.me/5500000000000";

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
      { property: "og:url", content: "https://app.vargasti.com.br/" },
    ],
    links: [{ rel: "canonical", href: "https://app.vargasti.com.br/" }],
  }),
  component: LandingPage,
});

/* ---------- Building blocks ---------- */

const NAV = [
  { id: "inicio", label: "Início" },
  { id: "solucoes", label: "Soluções" },
  { id: "plataforma", label: "Plataforma" },
  { id: "clientes", label: "Clientes" },
  { id: "sobre", label: "Sobre" },
  { id: "contato", label: "Contato" },
];

const FEATURES = [
  { icon: Headphones,     title: "Suporte Técnico",    desc: "Atendimento presencial e remoto com agilidade, qualidade e eficiência." },
  { icon: Boxes,          title: "Gestão de Ativos",   desc: "Inventário completo, histórico, peças, garantia e localização." },
  { icon: MessagesSquare, title: "Central de Serviços",desc: "Chamados, ordens de serviço e SLA em um único lugar." },
  { icon: FileText,       title: "Orçamentos",         desc: "Propostas digitais, aprovação online e histórico completo." },
  { icon: CalendarDays,   title: "Agenda Integrada",   desc: "Agendamentos, técnicos, visitas e compromissos centralizados." },
  { icon: ShieldCheck,    title: "Segurança & Backup", desc: "Proteção de dados, monitoramento e backup em nuvem." },
];

const STATS = [
  { icon: Building2, value: "+50",   label: "Empresas\nAtendidas" },
  { icon: Monitor,   value: "+1000", label: "Ativos\nGerenciados" },
  { icon: Headphones,value: "+500",  label: "Atendimentos\nRealizados" },
  { icon: ShieldCheck,value: "99,9%",label: "Disponibilidade\ndos Serviços" },
];

const CLIENTS = [
  "CM ROSÁRIO", "SANTA CASA", "ALFA SOLUÇÕES", "AGROFORTE", "BRASIL TRANSPORTES",
];

const FOOTER_PILLARS = [
  { icon: Sparkles,       title: "Plataforma Própria",   desc: "Desenvolvida para centralizar sua gestão." },
  { icon: HeartHandshake, title: "Atendimento Humanizado", desc: "Suporte próximo, ágil e eficiente." },
  { icon: Leaf,           title: "Tecnologia & Inovação",  desc: "Soluções modernas para desafios reais." },
  { icon: ShieldCheck,    title: "Segurança Garantida",    desc: "Ambiente seguro e dados sempre protegidos." },
];

/* ---------- Holographic V logo ---------- */
function HoloLogo() {
  return (
    <div className="relative aspect-square w-full max-w-[420px] mx-auto select-none">
      {/* outer glow */}
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(34,211,238,0.35),transparent_60%)] blur-2xl" />
      <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_60%,rgba(16,185,129,0.25),transparent_55%)] blur-2xl" />

      {/* hologram base rings */}
      <div className="absolute left-1/2 bottom-[8%] -translate-x-1/2 w-[78%] h-[18%]">
        <div className="absolute inset-0 rounded-[50%] border border-cyan-400/40 shadow-[0_0_40px_rgba(34,211,238,0.4)]" />
        <div className="absolute inset-[18%] rounded-[50%] border border-cyan-300/30" />
        <div className="absolute inset-[36%] rounded-[50%] border border-emerald-300/30" />
      </div>

      {/* light beam */}
      <div className="absolute left-1/2 top-[10%] -translate-x-1/2 w-[2px] h-[80%] bg-gradient-to-b from-cyan-300/0 via-cyan-300/40 to-cyan-300/0" />

      {/* logo */}
      <img
        src={vargastiLogo.url}
        alt="VargasTI"
        className="absolute inset-0 m-auto w-[62%] object-contain drop-shadow-[0_0_40px_rgba(34,211,238,0.55)] animate-[float_6s_ease-in-out_infinite]"
        draggable={false}
      />

      {/* floating circuit dots */}
      <span className="absolute top-[18%] left-[22%] size-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)] animate-pulse" />
      <span className="absolute top-[34%] right-[18%] size-1 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.9)] animate-pulse" />
      <span className="absolute bottom-[28%] left-[18%] size-1 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.9)] animate-pulse" />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  );
}

/* ---------- Demo dashboard preview ---------- */
function DashboardMock() {
  return (
    <div className="relative rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-[#062235]/95 via-[#06151f]/95 to-[#04111d]/95 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7),0_0_60px_-20px_rgba(34,211,238,0.4)] backdrop-blur-xl overflow-hidden">
      {/* title bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <div className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-cyan-400/70" />
          <span className="size-2 rounded-full bg-emerald-400/70" />
          <span className="size-2 rounded-full bg-slate-500/70" />
        </div>
        <div className="text-[9px] text-slate-500">app.vargasti.com.br</div>
        <div className="flex gap-2 text-slate-500"><span>—</span><span>×</span></div>
      </div>

      <div className="grid grid-cols-[110px_1fr] min-h-[280px]">
        {/* sidebar */}
        <aside className="border-r border-white/5 p-2 space-y-1 bg-black/20">
          <div className="flex items-center gap-1.5 px-2 py-1.5">
            <img src={vargastiLogo.url} alt="" className="size-5 object-contain" />
            <span className="text-[10px] font-bold text-white">VargasTI</span>
          </div>
          {["Dashboard","Clientes","Ativos","Chamados","Ordens de Serviço","Orçamentos","Agenda","Relatórios","Configurações"].map((l, i) => (
            <div key={l} className={`px-2 py-1.5 rounded text-[9px] ${i === 0 ? "bg-cyan-500/15 text-cyan-300" : "text-slate-400"}`}>
              {l}
            </div>
          ))}
        </aside>

        {/* main */}
        <div className="p-3 space-y-3">
          {/* KPIs */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { lbl: "Clientes", val: "128", trend: "↑ 12 este mês", color: "text-cyan-300" },
              { lbl: "Ativos", val: "1.482", trend: "↑ 38 este mês", color: "text-emerald-300" },
              { lbl: "Chamados", val: "256", trend: "↓ 8% vs mês passado", color: "text-cyan-300" },
              { lbl: "Ordens de Serviço", val: "189", trend: "↑ 15 este mês", color: "text-emerald-300" },
            ].map((k) => (
              <div key={k.lbl} className="rounded-md border border-white/5 bg-white/[0.02] p-2">
                <div className="text-[8px] text-slate-400 truncate">{k.lbl}</div>
                <div className="text-sm font-bold text-white">{k.val}</div>
                <div className={`text-[7px] ${k.color}`}>{k.trend}</div>
              </div>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-3 gap-2">
            {/* line chart */}
            <div className="col-span-1 rounded-md border border-white/5 bg-white/[0.02] p-2">
              <div className="text-[8px] text-slate-400 mb-1">Atendimentos</div>
              <svg viewBox="0 0 100 50" className="w-full h-12">
                <defs>
                  <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,40 L17,28 L33,32 L50,18 L67,22 L83,10 L100,14 L100,50 L0,50 Z" fill="url(#lg)" />
                <path d="M0,40 L17,28 L33,32 L50,18 L67,22 L83,10 L100,14" fill="none" stroke="#22d3ee" strokeWidth="1.2" />
              </svg>
            </div>
            {/* donut */}
            <div className="col-span-1 rounded-md border border-white/5 bg-white/[0.02] p-2">
              <div className="text-[8px] text-slate-400 mb-1">Status dos Chamados</div>
              <div className="relative grid place-items-center h-12">
                <svg viewBox="0 0 36 36" className="size-12 -rotate-90">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#1e293b" strokeWidth="4" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#22d3ee" strokeWidth="4" strokeDasharray="40 88" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#10b981" strokeWidth="4" strokeDasharray="30 88" strokeDashoffset="-40" />
                  <circle cx="18" cy="18" r="14" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="18 88" strokeDashoffset="-70" />
                </svg>
                <div className="absolute text-[8px] font-bold text-white">256</div>
              </div>
            </div>
            {/* activity */}
            <div className="col-span-1 rounded-md border border-white/5 bg-white/[0.02] p-2 space-y-1">
              <div className="text-[8px] text-slate-400">Atividades Recentes</div>
              {[
                "Novo chamado · agora",
                "OS #189 concluída · 2h",
                "Ativo cadastrado · 5h",
                "Orçamento enviado · 1d",
              ].map((t) => (
                <div key={t} className="text-[7px] text-slate-300 truncate">{t}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [active, setActive] = useState("inicio");

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + 120;
      for (const n of [...NAV].reverse()) {
        const el = document.getElementById(n.id);
        if (el && el.offsetTop <= y) { setActive(n.id); break; }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#04060e] text-slate-100 overflow-x-hidden">
      {/* GLOBAL BG */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(34,211,238,0.12),transparent_55%),radial-gradient(circle_at_85%_30%,rgba(16,185,129,0.10),transparent_55%),radial-gradient(circle_at_50%_90%,rgba(59,130,246,0.10),transparent_60%)]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(34,211,238,0.6)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>

      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#04060e]/80 border-b border-white/[0.06]">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 h-[78px] flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={vargastiLogo.url} alt="VargasTI" className="h-12 w-12 object-contain drop-shadow-[0_0_14px_rgba(34,211,238,0.45)]" />
            <div className="leading-tight">
              <div className="text-xl font-extrabold tracking-tight">
                <span className="text-white">Vargas</span>
                <span className="bg-gradient-to-r from-cyan-300 to-emerald-400 bg-clip-text text-transparent">TI</span>
              </div>
              <div className="text-[9px] tracking-[0.22em] text-cyan-300/70 uppercase">Soluções que conectam</div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-8 mx-auto">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className={`relative text-sm font-medium transition-colors ${
                  active === n.id ? "text-cyan-300" : "text-slate-300 hover:text-white"
                }`}
              >
                {n.label}
                {active === n.id && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-[2px] w-6 rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                )}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 ml-auto">
            <a
              href={SYSTEM_URL}
              className="inline-flex items-center gap-2 h-11 px-4 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-cyan-400/40 text-sm text-slate-100 transition"
            >
              <User size={15} /> Portal do Cliente
            </a>
            <a
              href={SYSTEM_URL}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-sm font-bold text-slate-950 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.7)] transition"
            >
              Acessar Sistema <ArrowUpRight size={15} />
            </a>
          </div>

          <button
            onClick={() => setMenuOpen((s) => !s)}
            className="lg:hidden ml-auto p-2 rounded-lg border border-white/10 bg-white/[0.03] text-slate-200"
            aria-label="Menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden border-t border-white/5 bg-[#04060e]/95 px-4 py-4 space-y-2">
            {NAV.map((n) => (
              <a
                key={n.id}
                href={`#${n.id}`}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5"
              >
                {n.label}
              </a>
            ))}
            <div className="pt-2 grid grid-cols-2 gap-2">
              <a href={SYSTEM_URL} className="text-center text-sm py-2.5 rounded-lg border border-white/10 bg-white/[0.03]">Portal</a>
              <a href={SYSTEM_URL} className="text-center text-sm py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold">Acessar</a>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="inicio" className="relative">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 pt-10 lg:pt-16 pb-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1.2fr] gap-10 lg:gap-12 items-center">
            {/* LEFT */}
            <div className="space-y-7">
              <p className="text-[11px] sm:text-xs font-semibold tracking-[0.32em] text-cyan-300 uppercase">
                Soluções que conectam
              </p>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black uppercase leading-[0.95] tracking-tight">
                <span className="text-white">Suporte que</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.35)]">
                  transforma.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
                Tecnologia inteligente para empresas que buscam{" "}
                <span className="text-cyan-300 font-semibold">eficiência</span>,{" "}
                <span className="text-emerald-300 font-semibold">segurança</span> e{" "}
                <span className="text-cyan-300 font-semibold">inovação</span>.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={SYSTEM_URL}
                  className="inline-flex items-center gap-2 h-13 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-sm font-bold text-white shadow-[0_15px_40px_-12px_rgba(34,211,238,0.6)] hover:-translate-y-0.5 transition"
                >
                  Solicitar Demonstração <ArrowRight size={16} />
                </a>
                <a
                  href={WHATSAPP_URL}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 h-13 py-3.5 px-6 rounded-xl border border-emerald-400/40 bg-emerald-500/[0.05] hover:bg-emerald-500/[0.12] text-sm font-semibold text-emerald-300 transition"
                >
                  <Phone size={15} /> Falar com Especialista
                </a>
              </div>
            </div>

            {/* RIGHT: holo + dashboard */}
            <div className="relative">
              <div className="absolute -top-6 -left-6 sm:left-0">
                <HoloLogo />
              </div>
              <div className="relative lg:translate-x-12 lg:translate-y-8">
                <DashboardMock />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="solucoes" className="relative">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="group relative rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.025] to-white/[0.01] p-5 hover:border-cyan-400/30 hover:-translate-y-1 transition-all backdrop-blur-sm"
              >
                <div className="grid place-items-center size-12 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.07] text-cyan-300 mb-4 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition">
                  <Icon size={22} strokeWidth={1.6} />
                </div>
                <h3 className="text-base font-bold text-white text-center mb-1.5">{title}</h3>
                <p className="text-[12px] text-slate-400 text-center leading-relaxed">{desc}</p>
                <div className="mt-4 grid place-items-center text-cyan-400/70 group-hover:text-cyan-300 transition">
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS + CLIENTS */}
      <section id="plataforma" className="relative">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Stats */}
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.025] to-white/[0.01] p-6 backdrop-blur-sm">
            <p className="text-[11px] font-bold tracking-[0.22em] text-slate-400 uppercase mb-5">
              Números que refletem nosso compromisso
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {STATS.map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="grid place-items-center size-11 rounded-xl border border-cyan-400/25 bg-cyan-500/[0.07] text-cyan-300 shrink-0">
                    <Icon size={20} strokeWidth={1.6} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-2xl font-extrabold bg-gradient-to-r from-cyan-300 to-emerald-400 bg-clip-text text-transparent leading-none">
                      {value}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-tight mt-1 whitespace-pre-line">{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Clients */}
          <div id="clientes" className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.025] to-white/[0.01] p-6 backdrop-blur-sm">
            <p className="text-[11px] font-bold tracking-[0.22em] text-slate-400 uppercase mb-5">
              Empresas que confiam na VargasTI
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 items-center">
              {CLIENTS.map((c) => (
                <div
                  key={c}
                  className="h-14 rounded-lg border border-white/5 bg-white/[0.02] grid place-items-center text-[10px] font-bold tracking-wider text-slate-400 hover:text-cyan-300 hover:border-cyan-400/30 transition text-center px-2"
                >
                  {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER BAND */}
      <section id="sobre" className="relative">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.025] to-white/[0.01] p-6 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr_2.2fr] gap-6 items-start">
              <div className="flex items-center gap-3">
                <img src={vargastiLogo.url} alt="" className="h-14 w-14 object-contain drop-shadow-[0_0_14px_rgba(34,211,238,0.45)]" />
                <div className="leading-tight">
                  <div className="text-2xl font-extrabold">
                    <span className="text-white">Vargas</span>
                    <span className="bg-gradient-to-r from-cyan-300 to-emerald-400 bg-clip-text text-transparent">TI</span>
                  </div>
                  <div className="text-[9px] tracking-[0.22em] text-cyan-300/70 uppercase">Soluções que conectam</div>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                A VargasTI oferece soluções completas em tecnologia, unindo suporte especializado e uma plataforma própria para transformar a gestão da sua empresa.
              </p>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {FOOTER_PILLARS.map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-2.5">
                    <div className="grid place-items-center size-9 rounded-lg border border-cyan-400/25 bg-cyan-500/[0.07] text-cyan-300 shrink-0">
                      <Icon size={16} strokeWidth={1.6} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-white">{title}</div>
                      <div className="text-[10px] text-slate-400 leading-snug">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTATO */}
      <footer id="contato" className="border-t border-white/[0.06] mt-4">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <p className="text-[11px] text-slate-500 tracking-wider">
            © {new Date().getFullYear()} VargasTI · Soluções que conectam
          </p>
          <div className="flex items-center gap-3 text-xs">
            <a href={SYSTEM_URL} className="text-slate-400 hover:text-cyan-300 transition">Acessar Sistema</a>
            <span className="text-slate-700">·</span>
            <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-emerald-300 transition">WhatsApp</a>
            <span className="text-slate-700">·</span>
            <Link to="/login" className="text-slate-400 hover:text-cyan-300 transition">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
