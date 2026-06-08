import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { User, Shield, Monitor, LayoutDashboard, NotebookPen, Wrench, FolderKanban, Files } from "lucide-react";

export const Route = createFileRoute("/config")({
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

  const [modules, setModules] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem("vargasti-modules") || "{}"); } catch { return {}; }
  });

  function toggleModule(key: string) {
    setModules((prev) => {
      const updated = { ...prev, [key]: !(prev[key] ?? true) };
      localStorage.setItem("vargasti-modules", JSON.stringify(updated));
      return updated;
    });
  }

  const isModuleEnabled = (key: string) => modules[key] ?? true;

  return (
    <AppShell>
      <div className="p-4 md:p-5 space-y-4 max-w-xl">
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1">Config</div>
          <h1 className="text-sm text-foreground">Configurações</h1>
        </div>

        {/* Profile section */}
        <section className="bg-surface border border-border rounded p-4 space-y-3">
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase tracking-widest">
            <User className="size-3" />
            perfil
          </div>
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-secondary border border-border grid place-items-center overflow-hidden shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="size-full object-cover" />
              ) : (
                <User className="size-4 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-xs text-foreground">{displayName}</p>
              <p className="text-[10px] text-muted-foreground">{user?.email}</p>
              <p className="text-[9px] text-muted-foreground mt-0.5">
                Conta via {user?.app_metadata?.provider === "google" ? "Google OAuth" : "Email/Senha"}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-border">
            <div>
              <p className="text-[10px] text-foreground">Sessão ativa</p>
              <p className="text-[9px] text-muted-foreground">Clique para encerrar a sessão atual</p>
            </div>
            <button
              onClick={signOut}
              className="px-3 py-1.5 rounded text-[10px] border border-border text-muted-foreground hover:text-red-400 hover:border-red-400/30 hover:bg-red-500/5 transition-colors"
            >
              Sair
            </button>
          </div>
        </section>

        {/* Modules section */}
        <section className="bg-surface border border-border rounded p-4 space-y-3">
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase tracking-widest">
            <Monitor className="size-3" />
            módulos
          </div>
          <div className="space-y-2">
            {MODULES.map(({ key, label, icon: Icon, required }) => (
              <div key={key} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2">
                  <Icon className={`size-3.5 ${isModuleEnabled(key) ? "text-brand" : "text-muted-foreground"}`} />
                  <span className="text-[10px] text-foreground">{label}</span>
                  {required && <span className="text-[8px] text-muted-foreground border border-muted-foreground/20 rounded px-1">obrigatório</span>}
                </div>
                <button
                  onClick={() => !required && toggleModule(key)}
                  disabled={required}
                  className={`relative w-8 h-4 rounded-full border transition-colors ${
                    isModuleEnabled(key) ? "bg-brand/20 border-brand/40" : "bg-surface-2 border-border"
                  } ${required ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <span className={`absolute top-0.5 size-3 rounded-full transition-all ${
                    isModuleEnabled(key) ? "left-4 bg-brand" : "left-0.5 bg-muted-foreground"
                  }`} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-[9px] text-muted-foreground">Controles salvos localmente neste navegador.</p>
        </section>

        {/* System info */}
        <section className="bg-surface border border-border rounded p-4 space-y-2">
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground uppercase tracking-widest">
            <Shield className="size-3" />
            sistema
          </div>
          <div className="space-y-1 text-[9px]">
            {[
              ["Versão", "2.0.0"],
              ["Build", "Matrix Edition"],
              ["Stack", "React 18 + TanStack Router + Supabase"],
              ["Auth", "Supabase Auth (Google OAuth + Email)"],
              ["Storage", "Supabase PostgreSQL"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
