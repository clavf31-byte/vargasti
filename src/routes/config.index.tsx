import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import {
  User, Shield, Monitor, LayoutDashboard, NotebookPen, Wrench,
  FolderKanban, Files, Settings, LogOut, Lock,
} from "lucide-react";

export const Route = createFileRoute("/config/")({
  head: () => ({ meta: [{ title: "Configurações · VargasTI Lab" }] }),
  component: ConfigPage,
});

const MODULES = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, required: true },
  { key: "anotacoes", label: "Anotações", icon: NotebookPen, required: false },
  { key: "tools", label: "Tools", icon: Wrench, required: false },
  { key: "projetos", label: "Projetos", icon: FolderKanban, required: false },
  { key: "arquivos", label: "Arquivos", icon: Files, required: false },
];

function ConfigPage() {
  const { user, signOut } = useAuth();
  const displayName = user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "user";
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const provider = user?.app_metadata?.provider;

  const [modules, setModules] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem("vargasti-modules") || "{}");
    } catch {
      return {};
    }
  });

  function toggleModule(key: string) {
    setModules((prev) => {
      const updated = { ...prev, [key]: !(prev[key] ?? true) };
      localStorage.setItem("vargasti-modules", JSON.stringify(updated));
      return updated;
    });
  }

  const isEnabled = (key: string) => modules[key] ?? true;

  return (
    <AppShell>
      <div className="p-4 md:p-5 space-y-4 max-w-xl">
        <PageHeader
          category="Sistema"
          title="Configurações"
          icon={Settings}
          iconClass="text-muted-foreground"
        />

        {/* Perfil */}
        <section className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-surface-2/50">
            <User className="size-3.5 text-brand" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Perfil</span>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-secondary border border-border grid place-items-center overflow-hidden shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
                ) : (
                  <User className="size-5 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
                <span className={`inline-block mt-1 text-[9px] font-medium border rounded px-1.5 py-0.5 ${
                  provider === "google"
                    ? "text-sky-400 bg-sky-500/10 border-sky-500/20"
                    : "text-muted-foreground bg-surface-2 border-border"
                }`}>
                  {provider === "google" ? "Google OAuth" : "Email / Senha"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 px-3 bg-background/50 border border-border/50 rounded-xl">
              <div>
                <p className="text-xs font-medium text-foreground">Sessão ativa</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Encerrar a sessão atual</p>
              </div>
              <button
                onClick={signOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors"
              >
                <LogOut className="size-3.5" />
                Sair
              </button>
            </div>
          </div>
        </section>

        {/* Módulos */}
        <section className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-surface-2/50">
            <Monitor className="size-3.5 text-info" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Módulos</span>
          </div>
          <div className="p-4 space-y-1">
            {MODULES.map(({ key, label, icon: Icon, required }) => (
              <div
                key={key}
                className={`flex items-center justify-between py-2.5 px-3 rounded-xl transition-colors ${
                  isEnabled(key) ? "hover:bg-white/5" : "opacity-60"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`size-4 ${isEnabled(key) ? "text-brand" : "text-muted-foreground/50"}`} />
                  <span className="text-sm text-foreground">{label}</span>
                  {required && (
                    <span className="text-[8px] text-muted-foreground border border-muted-foreground/20 rounded px-1 py-0.5">
                      obrigatório
                    </span>
                  )}
                </div>
                <button
                  onClick={() => !required && toggleModule(key)}
                  disabled={required}
                  title={required ? "Módulo obrigatório" : isEnabled(key) ? "Desativar" : "Ativar"}
                  className={`relative w-9 h-5 rounded-full border transition-all ${
                    isEnabled(key) ? "bg-brand/20 border-brand/40" : "bg-surface-2 border-border"
                  } ${required ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span
                    className={`absolute top-0.5 size-3.5 rounded-full transition-all duration-200 ${
                      isEnabled(key) ? "left-[18px] bg-brand" : "left-0.5 bg-muted-foreground"
                    }`}
                  />
                </button>
              </div>
            ))}
            <p className="text-[9px] text-muted-foreground px-3 pt-2">Controles salvos localmente neste navegador.</p>
          </div>
        </section>

        {/* Permissões de Acesso */}
        <section className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-surface-2/50">
            <Lock className="size-3.5 text-amber-400" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Acesso</span>
          </div>
          <div className="p-4">
            <Link
              to="/config/permissions"
              className="flex items-center justify-between py-3 px-3 bg-background/50 border border-border/50 hover:border-brand/30 hover:bg-brand/5 rounded-xl transition-colors"
            >
              <div>
                <p className="text-sm font-medium text-foreground">Permissões de Usuários</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Gerenciar acesso aos módulos</p>
              </div>
              <Shield className="size-4 text-brand" />
            </Link>
          </div>
        </section>

        {/* Sistema */}
        <section className="bg-surface border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-surface-2/50">
            <Shield className="size-3.5 text-purple-400" />
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Sistema</span>
          </div>
          <div className="p-4">
            <div className="space-y-2">
              {[
                ["Versão", __APP_VERSION__],
                ["Build", `#${__BUILD_NUMBER__}`],
                ["Commit", __GIT_HASH__],
                ["Data", __BUILD_DATE__],
                ["Stack", "React 19 · TanStack · Supabase"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between items-center py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-[11px] text-muted-foreground">{k}</span>
                  <span className="text-[11px] text-foreground font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
