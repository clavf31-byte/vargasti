import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, Eye, EyeOff, LogIn, Shield, Layers, ChevronRight } from "lucide-react";
import vargastiLogo from "@/assets/vargasti-logo-clean.png.asset.json";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard" });
  }, [session, loading, navigate]);

  async function handleGoogle() {
    setError("");
    setGoogleLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setError(result.error.message ?? "Falha ao entrar com Google");
        setGoogleLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao conectar com Google");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setSubmitting(false);
      if (error) {
        setError(error.message);
      } else if (data?.session) {
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    }
  }

  return (
    <div className="fixed inset-0 flex bg-[#04060e] text-slate-100 overflow-hidden">
      {/* Brand panel (unchanged) */}
      <div className="hidden md:flex relative flex-1 overflow-hidden flex-col items-center justify-start pt-16 bg-gradient-to-br from-[#04060e] via-[#06121f] to-[#04060e] px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(34,211,238,0.15),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.12),transparent_55%)]" />
        <img
          src={vargastiLogo.url}
          alt="VargasTI"
          className="relative z-10 w-[45%] max-h-[35%] object-contain drop-shadow-[0_0_40px_rgba(34,211,238,0.35)]"
          draggable={false}
        />
        <div className="relative z-10 -mt-10 flex flex-col items-center text-center">
          <h2 className="text-5xl font-extrabold tracking-tight leading-none">
            <span className="text-white">Vargas</span>
            <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">TI</span>
          </h2>
          <div className="mt-4 h-px w-40 bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />
          <p className="mt-4 text-xs sm:text-sm font-medium tracking-[0.25em] text-slate-300/90 uppercase">
            Soluções que conectam.
          </p>
          <p className="mt-1 text-xs sm:text-sm font-medium tracking-[0.25em] text-slate-300/90 uppercase">
            Suporte que{" "}
            <span className="bg-gradient-to-r from-cyan-300 to-blue-500 bg-clip-text text-transparent">
              transforma.
            </span>
          </p>
        </div>
      </div>

      {/* Form panel — refined glass */}
      <div className="flex w-full md:w-[520px] lg:w-[600px] xl:w-[680px] items-center justify-center px-6 py-8 bg-[#04060e] relative overflow-y-auto">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-[120px]" />

        <div className="w-full max-w-[460px] relative">
          {/* Card */}
          <div className="relative rounded-3xl border border-white/10 bg-white/[0.025] backdrop-blur-2xl shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] p-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-7">
              <div className="min-w-0">
                <h1 className="text-[26px] font-bold text-white leading-tight tracking-tight">
                  Bem-vindo{" "}
                  <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                    de volta!
                  </span>
                </h1>
                <p className="mt-1.5 text-sm text-slate-400 leading-snug">
                  Informe seu e-mail e senha<br />para acessar o sistema.
                </p>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/[0.07] px-2.5 py-1 text-[11px] font-medium text-emerald-400 shrink-0">
                <Shield size={12} />
                <span className="inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Ambiente Seguro
                </span>
              </div>
            </div>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || submitting}
              className="group w-full flex items-center justify-center gap-2.5 h-12 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all text-sm font-medium text-slate-100 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {googleLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <GoogleIcon />
                  Entrar com Google
                </>
              )}
            </button>

            <div className="flex items-center gap-3 my-7">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="text-xs text-slate-500">ou</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 ml-1">
                  E-mail
                </label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    autoComplete="email"
                    className="w-full h-12 pl-11 pr-3 rounded-xl bg-white/[0.03] border border-white/10 focus:border-cyan-500/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-cyan-500/15 outline-none text-sm text-white placeholder:text-slate-600 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 ml-1">
                  Senha
                </label>
                <div className="relative group">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                    className="w-full h-12 pl-11 pr-11 rounded-xl bg-white/[0.03] border border-white/10 focus:border-cyan-500/60 focus:bg-white/[0.05] focus:ring-2 focus:ring-cyan-500/15 outline-none text-sm text-white placeholder:text-slate-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm pt-1">
                <label className="flex items-center gap-2 text-slate-400 hover:text-slate-300 cursor-pointer select-none transition-colors">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500 focus:ring-cyan-500/30"
                  />
                  <span className="text-xs">Lembrar-me</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
                >
                  Esqueci minha senha
                  <ChevronRight size={12} />
                </Link>
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group w-full h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 transition-all text-sm font-bold tracking-wide text-slate-950 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_10px_30px_-10px_rgba(16,185,129,0.6)] hover:shadow-[0_15px_35px_-10px_rgba(16,185,129,0.8)] hover:-translate-y-0.5 active:translate-y-0"
              >
                {submitting ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <LogIn size={18} />
                    Entrar
                  </>
                )}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-400">
              Não tem conta?{" "}
              <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 font-semibold">
                Criar conta
              </Link>
            </p>

            {/* Status bar */}
            <div className="mt-7 pt-5 border-t border-white/5 grid grid-cols-3 gap-3 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                <div className="min-w-0">
                  <div className="text-slate-200 font-medium truncate">Sistema Online</div>
                  <div className="text-slate-500 truncate">Todos os serviços OK</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-cyan-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-slate-200 font-medium truncate">V2.5.0</div>
                  <div className="text-slate-500 truncate">22/05/2026</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="text-slate-200 font-medium truncate">Ambiente Seguro</div>
                  <div className="text-slate-500 truncate">Seus dados protegidos</div>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-[10px] uppercase tracking-[0.2em] text-slate-600">
            © {new Date().getFullYear()} VargasTI · Soluções que conectam
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.1l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.1z"/>
      <path fill="#4CAF50" d="M24 44c5.4 0 10.3-2.1 13.9-5.4l-6.4-5.3c-2.1 1.5-4.7 2.4-7.5 2.4-5.3 0-9.7-3.4-11.3-8L6.1 33C9.5 39.5 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.4 5.3C41 35.5 44 30.2 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}
