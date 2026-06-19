import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet, Link, createRootRouteWithContext, useRouter,
  HeadContent, Scripts, useNavigate, useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs font-mono text-brand uppercase tracking-widest mb-2">Error · 404</p>
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O recurso solicitado não existe ou foi movido.
        </p>
        <div className="mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Falha ao carregar
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Algo deu errado. Tente novamente ou volte ao início.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Início
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VargasTI — Knowledge Hub" },
      { name: "description", content: "Central de conhecimento, laboratório de testes, soluções, scripts e documentação técnica." },
      { name: "author", content: "VargasTI" },
      { property: "og:title", content: "VargasTI — Knowledge Hub" },
      { property: "og:description", content: "Central de conhecimento, laboratório de testes, soluções, scripts e documentação técnica." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "VargasTI — Knowledge Hub" },
      { name: "twitter:description", content: "Central de conhecimento, laboratório de testes, soluções, scripts e documentação técnica." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/907a6cd1-2920-45bb-920b-ce91e86e32a2/id-preview-d9c14fc2--7986ff08-8133-4212-8727-07856cd99021.lovable.app-1780923585782.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/907a6cd1-2920-45bb-920b-ce91e86e32a2/id-preview-d9c14fc2--7986ff08-8133-4212-8727-07856cd99021.lovable.app-1780923585782.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function PendingScreen({ email, onSignOut }: { email?: string; onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-[#04060e] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/30 mb-6">
          <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Aguardando aprovação</h1>
        <p className="text-sm text-slate-400 mb-1">Sua conta <span className="text-slate-300">{email}</span> foi criada.</p>
        <p className="text-sm text-slate-400 mb-8">Um administrador precisa aprovar seu acesso antes de você entrar no sistema.</p>
        <button
          onClick={onSignOut}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline"
        >
          Sair e usar outra conta
        </button>
      </div>
    </div>
  );
}

function RejectedScreen({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="min-h-screen bg-[#04060e] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mb-6">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">Acesso negado</h1>
        <p className="text-sm text-slate-400 mb-8">Sua solicitação de acesso foi recusada. Entre em contato com o administrador.</p>
        <button
          onClick={onSignOut}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline"
        >
          Sair
        </button>
      </div>
    </div>
  );
}

function AuthGuard() {
  const { session, loading, userStatus, statusLoading, signOut } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    const isAppHost = typeof window !== "undefined" && window.location.hostname === "app.vargasti.com.br";
    const isLandingRoute = pathname === "/";
    const isPublic =
      (!isAppHost && isLandingRoute) ||
      pathname === "/login" ||
      pathname.startsWith("/orcamento/approve/");

    if (isAppHost && isLandingRoute) {
      navigate({ to: session ? "/dashboard" : "/login" });
      return;
    }

    if (!session && !isPublic) {
      navigate({ to: "/login" });
    } else if (session && pathname === "/login") {
      navigate({ to: "/dashboard" });
    }
  }, [session, loading, pathname, navigate]);

  if (loading || (session && statusLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="size-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
      </div>
    );
  }

  if (session && userStatus === "pending") {
    return <PendingScreen email={session.user.email} onSignOut={signOut} />;
  }

  if (session && userStatus === "rejected") {
    return <RejectedScreen onSignOut={signOut} />;
  }

  return <Outlet />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthGuard />
      </AuthProvider>
    </QueryClientProvider>
  );
}
