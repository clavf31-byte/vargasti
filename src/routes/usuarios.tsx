import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search } from "lucide-react";

export const Route = createFileRoute("/usuarios")({
  head: () => ({ meta: [{ title: "Usuários · VargasTI Lab" }] }),
  component: UsuariosPage,
});

interface UserRow {
  id: string;
  full_name: string;
  email: string;
  role: "Administrador" | "Usuário";
  status: "online" | "idle" | "offline";
}

const STATUS_CLASSES: Record<UserRow["status"], string> = {
  online: "bg-brand/10 border-brand/20 text-brand",
  idle: "bg-warning/10 border-warning/20 text-warning",
  offline: "bg-surface-2 border-border text-muted-foreground",
};

const STATUS_LABELS: Record<UserRow["status"], string> = {
  online: "Online",
  idle: "Ocioso",
  offline: "Offline",
};

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function UsuariosPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { data, error } = await (supabase as any)
        .from("profiles")
        .select("id:user_id, full_name, email");

      if (!error && data) {
        const rows: UserRow[] = (data as any[]).map((u: any, idx: number) => ({
          id: u.id,
          full_name: u.full_name || "Usuário",
          email: u.email || "sem-email@example.com",
          role: idx === 0 ? "Administrador" : "Usuário",
          status: idx < 2 ? "online" : idx < 3 ? "idle" : "offline",
        }));
        setUsers(rows);
      }
    } catch (e) {
      console.error("Erro ao carregar usuários:", e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const counts = {
    total: users.length,
    online: users.filter((u) => u.status === "online").length,
    admins: users.filter((u) => u.role === "Administrador").length,
    pending: 1,
  };

  return (
    <AppShell>
      <div className="p-4 md:p-5 space-y-4">
        {/* Header */}
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Sistema</p>
          <h1 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
            <Users className="size-4 text-brand" />
            Gestão de Usuários
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Visualize os usuários do sistema</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "Total", value: counts.total, cls: "text-foreground" },
            { label: "Online", value: counts.online, cls: "text-brand" },
            { label: "Administradores", value: counts.admins, cls: "text-warning" },
            { label: "Pendentes", value: counts.pending, cls: "text-info" },
          ].map(({ label, value, cls }) => (
            <div key={label} className="bg-surface border border-border rounded-xl px-4 py-3">
              <div className={`text-2xl font-bold tabular-nums ${cls}`}>
                {String(value).padStart(2, "0")}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mt-1">
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/40 focus:ring-1 focus:ring-brand/20 transition-all"
          />
        </div>

        {/* List */}
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              Carregando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <div className="size-10 rounded-full bg-surface-2 border border-border grid place-items-center">
                <Users className="size-4 text-muted-foreground/50" />
              </div>
              <p className="text-xs text-muted-foreground">
                {search ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              <div className="hidden md:grid grid-cols-[1fr_140px_120px] gap-4 px-4 py-2.5 bg-surface-2/50">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Usuário</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Perfil</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Status</span>
              </div>

              {filtered.map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-1 md:grid-cols-[1fr_140px_120px] gap-3 md:gap-4 px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-full bg-secondary border border-border grid place-items-center shrink-0 text-[11px] font-semibold text-muted-foreground">
                      {initials(u.full_name)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate leading-tight">
                        {u.full_name}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center md:justify-start">
                    <span
                      className={`px-2 py-1 rounded-lg border text-[11px] font-medium ${
                        u.role === "Administrador"
                          ? "bg-brand/10 border-brand/20 text-brand"
                          : "bg-surface-2 border-border text-muted-foreground"
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>

                  <div className="flex items-center md:justify-start">
                    <span className={`px-2 py-1 rounded-lg border text-[11px] font-medium ${STATUS_CLASSES[u.status]}`}>
                      {STATUS_LABELS[u.status]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-right">
            {filtered.length} de {users.length} usuários
          </p>
        )}
      </div>
    </AppShell>
  );
}
