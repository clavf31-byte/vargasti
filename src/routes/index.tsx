import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { Wrench, NotebookPen, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard · VargasTI" }] }),
  component: Dashboard,
});

const MODULES = [
  {
    to: "/ferramentas" as const,
    icon: Wrench,
    label: "Ferramentas",
    description: "Mini-apps e utilitários pessoais.",
    badge: "1 disponível",
  },
  {
    to: "/anotacoes" as const,
    icon: NotebookPen,
    label: "Anotações",
    description: "Notas salvas e sincronizadas na nuvem.",
    badge: null,
  },
];

function Dashboard() {
  const { user } = useAuth();
  const firstName =
    user?.user_metadata?.full_name?.split(" ")[0] ??
    user?.email?.split("@")[0] ??
    "usuário";

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <AppShell>
      <div className="p-6 md:p-8 space-y-10">
        <div>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">
            {now.toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1 className="text-2xl font-semibold text-foreground">
            {greeting},{" "}
            <span className="text-brand capitalize">{firstName}</span>
          </h1>
        </div>

        <section>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-4">
            Módulos
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {MODULES.map(({ to, icon: Icon, label, description, badge }) => (
              <Link
                key={to}
                to={to}
                className="group bg-surface border border-border rounded-xl p-5 hover:border-brand/30 transition-all flex items-start gap-4"
              >
                <div className="size-11 rounded-lg bg-brand/10 border border-brand/20 grid place-items-center shrink-0">
                  <Icon className="size-5 text-brand" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-foreground font-medium group-hover:text-brand transition-colors">
                      {label}
                    </h3>
                    <ChevronRight className="size-4 text-muted-foreground group-hover:text-brand transition-colors shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                  {badge && (
                    <span className="mt-2 inline-block text-[10px] font-mono text-brand bg-brand/10 px-2 py-0.5 rounded">
                      {badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
