import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Plus, Search, Filter } from "lucide-react";

export const Route = createFileRoute("/usuarios")({
  head: () => ({ meta: [{ title: "Gestão de Usuários · VargasTI Lab" }] }),
  component: UsuariosPage,
});

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  status: "online" | "idle" | "offline";
  avatar_url?: string;
}

function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id:user_id, full_name, email");

      if (!error && data) {
        const mockUsers: User[] = (data as any[]).map((u: any, idx: number) => ({
          id: u.id,
          full_name: u.full_name || "Usuário",
          email: u.email || "sem-email@example.com",
          role: idx === 0 ? "Administrador" : "Usuário",
          status: idx < 2 ? "online" : idx < 3 ? "idle" : "offline",
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}`,
        }));
        setUsers(mockUsers);
      }
    } catch (e) {
      console.error("Erro ao carregar usuários:", e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: users.length,
    online: users.filter((u) => u.status === "online").length,
    admins: users.filter((u) => u.role === "Administrador").length,
    pending: 1,
  };

  const statusConfig = {
    online: { badge: "bg-green-500/20 text-green-400", dot: "bg-green-400" },
    idle: { badge: "bg-amber-500/20 text-amber-400", dot: "bg-amber-400" },
    offline: { badge: "bg-slate-500/20 text-slate-400", dot: "bg-slate-500" },
  };

  return (
    <AppShell>
      <div className="p-6 space-y-6 bg-slate-900 min-h-screen">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-6 h-6 text-cyan-400" />
              <h1 className="text-2xl font-bold text-slate-100">Gestão de Usuários</h1>
            </div>
            <p className="text-sm text-slate-400">Administre os usuários do sistema</p>
          </div>
          <button className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
            <Plus className="w-4 h-4 inline mr-2" />
            Novo Usuário
          </button>
        </div>

        {/* ESTATÍSTICAS */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total de Usuários", value: stats.total, color: "text-cyan-400" },
            { label: "Online", value: stats.online, color: "text-green-400" },
            { label: "Administradores", value: stats.admins, color: "text-amber-400" },
            { label: "Pendentes", value: stats.pending, color: "text-purple-400" },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
              <p className="text-xs text-slate-400 uppercase tracking-widest mb-2">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* FILTROS */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex gap-3">
          <div className="flex-1 flex items-center gap-2 bg-slate-700 rounded px-3 py-2">
            <Search className="w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none flex-1"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded hover:bg-slate-600 transition-colors">
            <Filter className="w-4 h-4" />
            <span className="text-sm">Filtros</span>
          </button>
        </div>

        {/* LISTA DE USUÁRIOS */}
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">Usuários Ativos</p>

          {loading ? (
            <div className="text-center py-8 text-slate-400">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Nenhum usuário encontrado</div>
          ) : (
            filtered.map((user) => {
              const statusCfg = statusConfig[user.status];
              const initials = user.full_name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              return (
                <div
                  key={user.id}
                  className="bg-slate-800 border border-slate-700 rounded-lg p-4 flex items-center justify-between hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-sm font-bold text-white">
                      {initials}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-100">{user.full_name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="px-3 py-1 rounded bg-slate-700 text-xs font-semibold text-slate-300 mr-3">
                    {user.role}
                  </div>

                  {/* Status */}
                  <div className={`px-2 py-1 rounded text-xs font-semibold flex items-center gap-1.5 ${statusCfg.badge} mr-3`}>
                    <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`}></span>
                    {user.status === "online" ? "Online" : user.status === "idle" ? "Ocioso" : "Offline"}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 transition-colors">
                      Editar
                    </button>
                    <button className="px-3 py-1 rounded text-xs bg-slate-700 hover:bg-slate-600 transition-colors">
                      Mais
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
