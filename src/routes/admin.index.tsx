import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { listUsers, updateUser } from "@/lib/api/adminUsers.functions";
import type { UserRow } from "@/lib/api/adminUsers.functions";
import { StatCard, Btn, EmptyState, LoadingState } from "@/components/shared";
import { roleConfig, OPERATOR_ROLES } from "@/lib/operatorPermissions";
import type { OperatorRole } from "@/lib/operatorPermissions";
import {
  Shield, RefreshCw, User, Clock, UserCheck, UserX,
  Search, ChevronDown, Pencil, X, Check, Filter,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Operadores · VargasTI" }] }),
  component: OperatorListPage,
});

const STATUS_CLS = {
  pending: "text-warning bg-warning/10 border-warning/20",
  approved: "text-brand bg-brand/10 border-brand/20",
  rejected: "text-destructive bg-destructive/10 border-destructive/20",
};

const STATUS_LABEL = { pending: "Pendente", approved: "Ativo", rejected: "Rejeitado" };

function OperatorListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [operators, setOperators] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [openRole, setOpenRole] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<OperatorRole | "">("");
  const [filterStatus, setFilterStatus] = useState<"" | "pending" | "approved" | "rejected">("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setOperators(await listUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar operadores.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleStatus(id: string, status: UserRow["status"]) {
    setBusy(id + status);
    try {
      await updateUser({ data: { id, status } });
      setOperators((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar.");
    } finally {
      setBusy(null);
    }
  }

  async function handleRole(id: string, role: OperatorRole) {
    setOpenRole(null);
    setBusy(id + role);
    try {
      await updateUser({ data: { id, role } });
      setOperators((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar.");
    } finally {
      setBusy(null);
    }
  }

  const pending = operators.filter((u) => u.status === "pending");
  const active = operators.filter(
    (u) =>
      u.status !== "pending" &&
      (search === "" || u.email.toLowerCase().includes(search.toLowerCase()) || (u.full_name ?? "").toLowerCase().includes(search.toLowerCase())) &&
      (filterRole === "" || u.role === filterRole) &&
      (filterStatus === "" || u.status === filterStatus),
  );

  const counts = {
    total: operators.length,
    approved: operators.filter((u) => u.status === "approved").length,
    pending: pending.length,
    rejected: operators.filter((u) => u.status === "rejected").length,
    admins: operators.filter((u) => u.role === "admin").length,
  };

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="size-5 text-brand" />
              <h1 className="text-xl font-bold text-foreground">Gestão de Operadores</h1>
            </div>
            <p className="text-xs text-muted-foreground">Gerencie funções, permissões e acessos ao sistema.</p>
          </div>
          <Btn variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Btn>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <StatCard label="Total" value={String(counts.total).padStart(2, "0")} />
          <StatCard label="Ativos" value={String(counts.approved).padStart(2, "0")} colorClass="text-brand" />
          <StatCard label="Pendentes" value={String(counts.pending).padStart(2, "0")} colorClass="text-warning" />
          <StatCard label="Rejeitados" value={String(counts.rejected).padStart(2, "0")} colorClass="text-destructive" />
          <StatCard label="Admins" value={String(counts.admins).padStart(2, "0")} colorClass="text-purple-400" />
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Pending approvals */}
        {pending.length > 0 && (
          <div className="card-graphite p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-warning" />
              <span className="text-sm font-semibold text-warning">
                Aguardando aprovação ({pending.length})
              </span>
            </div>
            <div className="space-y-2">
              {pending.map((u) => (
                <div key={u.id} className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg bg-warning/5 border border-warning/15">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{u.full_name ?? u.email.split("@")[0]}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleStatus(u.id, "approved")}
                      disabled={busy?.startsWith(u.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand text-xs font-medium hover:bg-brand/20 disabled:opacity-50 transition-colors"
                    >
                      <UserCheck className="size-3.5" /> Aprovar
                    </button>
                    <button
                      onClick={() => handleStatus(u.id, "rejected")}
                      disabled={busy?.startsWith(u.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                    >
                      <UserX className="size-3.5" /> Rejeitar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-white/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/40 transition-colors"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as OperatorRole | "")}
              className="pl-8 pr-8 py-2 text-sm bg-white/5 border border-border rounded-lg text-foreground focus:outline-none focus:border-brand/40 appearance-none cursor-pointer"
            >
              <option value="">Todas as funções</option>
              {OPERATOR_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="px-3 py-2 text-sm bg-white/5 border border-border rounded-lg text-foreground focus:outline-none focus:border-brand/40 appearance-none cursor-pointer"
            >
              <option value="">Todos os status</option>
              <option value="approved">Ativo</option>
              <option value="pending">Pendente</option>
              <option value="rejected">Rejeitado</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="card-graphite overflow-hidden">
          {loading ? (
            <LoadingState label="Carregando operadores..." />
          ) : active.length === 0 ? (
            <EmptyState icon={User} title="Nenhum operador encontrado" subtitle="Ajuste os filtros ou aprove operadores pendentes." />
          ) : (
            <div className="divide-y divide-border/50">
              <div className="hidden md:grid grid-cols-[1fr_160px_120px_100px_auto] gap-4 px-5 py-3 bg-surface-2/40">
                {["OPERADOR", "FUNÇÃO", "STATUS", "ACESSO", "AÇÕES"].map((h) => (
                  <span key={h} className="text-[10px] text-muted-foreground uppercase tracking-widest">{h}</span>
                ))}
              </div>

              {active.map((u) => {
                const isSelf = u.id === user?.id;
                const isBusy = busy?.startsWith(u.id);
                const rc = roleConfig(u.role);

                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_160px_120px_100px_auto] gap-3 md:gap-4 px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
                    style={{ opacity: u.status === "rejected" ? 0.6 : 1 }}
                  >
                    {/* Operador */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-full bg-secondary border border-border grid place-items-center shrink-0 text-[11px] font-semibold text-muted-foreground">
                        {(u.full_name ?? u.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate flex items-center gap-1.5 flex-wrap">
                          {u.full_name ?? u.email.split("@")[0]}
                          {isSelf && <span className="text-[9px] text-brand bg-brand/10 border border-brand/20 rounded px-1 py-0.5 uppercase">você</span>}
                          {u.provider === "google" && <span className="text-[9px] text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded px-1 py-0.5">Google</span>}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>

                    {/* Função */}
                    <div className="flex items-center">
                      <div className="relative">
                        <button
                          onClick={() => !isSelf && setOpenRole(openRole === u.id ? null : u.id)}
                          disabled={isBusy || isSelf}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${rc.cls}`}
                        >
                          <Shield className="size-3 shrink-0" />
                          {rc.label}
                          {!isSelf && <ChevronDown className="size-3 opacity-60" />}
                        </button>

                        {openRole === u.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenRole(null)} />
                            <div className="absolute left-0 top-full mt-1 z-20 card-graphite shadow-xl overflow-hidden min-w-[170px]">
                              {OPERATOR_ROLES.map((r) => (
                                <button
                                  key={r.value}
                                  onClick={() => handleRole(u.id, r.value)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${u.role === r.value ? "bg-brand/10 text-brand" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                                >
                                  {u.role === r.value ? <Check className="size-3" /> : <span className="size-3" />}
                                  {r.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center">
                      <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${STATUS_CLS[u.status]}`}>
                        {STATUS_LABEL[u.status]}
                      </span>
                    </div>

                    {/* Último acesso */}
                    <div className="flex items-center">
                      <span className="text-[11px] text-muted-foreground">
                        {u.last_sign_in_at
                          ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR")
                          : "—"}
                      </span>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate({ to: "/admin/$operatorId", params: { operatorId: u.id } })}
                        title="Editar operador"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand text-[11px] font-medium hover:bg-brand/20 transition-colors"
                      >
                        <Pencil className="size-3" /> Editar
                      </button>
                      {!isSelf && u.status === "approved" && (
                        <button
                          onClick={() => handleStatus(u.id, "rejected")}
                          disabled={isBusy}
                          title="Revogar acesso"
                          className="p-1.5 rounded-lg text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-colors disabled:opacity-30"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                      {!isSelf && u.status === "rejected" && (
                        <button
                          onClick={() => handleStatus(u.id, "approved")}
                          disabled={isBusy}
                          title="Reativar"
                          className="p-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-colors disabled:opacity-50"
                        >
                          <Check className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!loading && active.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-right">
            {active.length} operador{active.length !== 1 ? "es" : ""}
          </p>
        )}
      </div>
    </AppShell>
  );
}
