import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { listUsers, updateUser, deleteUser, updateUserPassword } from "@/lib/api/adminUsers.functions";
import type { UserRow } from "@/lib/api/adminUsers.functions";
import { PageHeader, StatCard, Toolbar, Btn, EmptyState, LoadingState } from "@/components/shared";
import {
  Shield, Search, Check, X, Trash2,
  RefreshCw, User, ChevronDown, KeyRound, Eye, EyeOff,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin · VargasTI Lab" }] }),
  component: AdminPage,
});

const ROLE_LABELS: Record<UserRow["role"], string> = {
  admin: "Admin",
  operator: "Operador",
  viewer: "Visualizador",
};

const ROLE_CLASSES: Record<UserRow["role"], string> = {
  admin: "bg-brand/10 border-brand/20 text-brand",
  operator: "bg-info/10 border-info/20 text-info",
  viewer: "bg-surface-2 border-border text-muted-foreground",
};

const STATUS_CLASSES: Record<UserRow["status"], string> = {
  pending: "bg-warning/10 border-warning/20 text-warning",
  active: "bg-brand/10 border-brand/20 text-brand",
  rejected: "bg-destructive/10 border-destructive/20 text-destructive",
};

const STATUS_LABELS: Record<UserRow["status"], string> = {
  pending: "Pendente",
  active: "Ativo",
  rejected: "Rejeitado",
};

function initials(name: string | null, email: string) {
  if (name) return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

function validatePassword(pwd: string): string | null {
  if (pwd.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(pwd)) return "A senha deve conter letras.";
  if (!/[0-9]/.test(pwd)) return "A senha deve conter números.";
  return null;
}

function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [openRole, setOpenRole] = useState<string | null>(null);

  // modal alterar senha
  const [pwdTarget, setPwdTarget] = useState<UserRow | null>(null);
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdBusy, setPwdBusy] = useState(false);

  const isAdmin = (user?.app_metadata as { role?: string } | undefined)?.role === "admin";

  useEffect(() => {
    if (!isAdmin) navigate({ to: "/" });
  }, [isAdmin, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar usuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin, load]);

  async function handleStatus(id: string, status: UserRow["status"]) {
    setBusy(id + status);
    try {
      await updateUser({ data: { id, status } });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status } : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar.");
    } finally {
      setBusy(null);
    }
  }

  async function handleRole(id: string, role: UserRow["role"]) {
    setOpenRole(null);
    setBusy(id + role);
    try {
      await updateUser({ data: { id, role } });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar.");
    } finally {
      setBusy(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;
    setBusy(id + "del");
    try {
      await deleteUser({ data: { id } });
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao remover.");
    } finally {
      setBusy(null);
    }
  }

  function openPwdModal(u: UserRow) {
    setPwdTarget(u);
    setNewPwd("");
    setConfirmPwd("");
    setShowNew(false);
    setShowConfirm(false);
    setPwdError("");
    setPwdSuccess(false);
  }

  async function handlePwdSubmit() {
    if (!pwdTarget) return;
    const validErr = validatePassword(newPwd);
    if (validErr) { setPwdError(validErr); return; }
    if (newPwd !== confirmPwd) { setPwdError("As senhas não coincidem."); return; }
    setPwdBusy(true);
    setPwdError("");
    try {
      await updateUserPassword({ data: { userId: pwdTarget.id, password: newPwd } });
      setPwdSuccess(true);
      setTimeout(() => setPwdTarget(null), 1500);
    } catch (e) {
      setPwdError(e instanceof Error ? e.message : "Erro ao alterar senha.");
    } finally {
      setPwdBusy(false);
    }
  }

  const filtered = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const counts = {
    total: users.length,
    active: users.filter((u) => u.status === "active").length,
    pending: users.filter((u) => u.status === "pending").length,
    rejected: users.filter((u) => u.status === "rejected").length,
  };

  if (!isAdmin) return null;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
        <PageHeader
          category="Administração"
          title="Gestão de Usuários"
          icon={Shield}
          subtitle="Aprove contas, gerencie funções e acessos."
          actions={
            <Btn variant="secondary" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Btn>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total" value={String(counts.total).padStart(2, "0")} />
          <StatCard label="Ativos" value={String(counts.active).padStart(2, "0")} colorClass="text-brand" />
          <StatCard label="Pendentes" value={String(counts.pending).padStart(2, "0")} colorClass="text-warning" />
          <StatCard label="Rejeitados" value={String(counts.rejected).padStart(2, "0")} colorClass="text-destructive" />
        </div>

        {/* Search */}
        <Toolbar searchValue={search} onSearchChange={setSearch} placeholder="Buscar por nome ou e-mail..." />

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* List */}
        <div className="card-graphite overflow-hidden">
          {loading ? (
            <LoadingState label="Carregando usuários..." />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={User}
              title={search ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
              subtitle={search ? "Ajuste sua busca e tente novamente." : "Convide pessoas para começar."}
            />
          ) : (
            <div className="divide-y divide-border/50">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[1fr_140px_140px_120px] gap-4 px-5 py-3 bg-surface-2/40">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Usuário</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Função</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Status</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Ações</span>
              </div>

              {filtered.map((u) => {
                const isBusy = busy?.startsWith(u.id);
                const isSelf = u.id === user?.id;
                const isGoogle = u.provider === "google";


                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_140px_140px_120px] gap-3 md:gap-4 px-4 py-3.5 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* User info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-full bg-secondary border border-border grid place-items-center shrink-0 text-[11px] font-semibold text-muted-foreground">
                        {initials(u.full_name, u.email)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate leading-tight flex items-center gap-1.5 flex-wrap">
                          {u.full_name ?? u.email.split("@")[0]}
                          {isSelf && (
                            <span className="text-[9px] text-brand bg-brand/10 border border-brand/20 rounded px-1 py-0.5 uppercase tracking-wide">você</span>
                          )}
                          {isGoogle && (
                            <span className="text-[9px] text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded px-1 py-0.5">Login Google</span>
                          )}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                        {u.last_sign_in_at && (
                          <p className="text-[9px] text-muted-foreground/50 mt-0.5">
                            Último acesso: {new Date(u.last_sign_in_at).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Role */}
                    <div className="flex items-center md:justify-start">
                      <div className="relative">
                        <button
                          onClick={() => setOpenRole(openRole === u.id ? null : u.id)}
                          disabled={isBusy || isSelf}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${ROLE_CLASSES[u.role]}`}
                        >
                          <Shield className="size-3 shrink-0" />
                          {ROLE_LABELS[u.role]}
                          {!isSelf && <ChevronDown className="size-3 opacity-60" />}
                        </button>

                        {openRole === u.id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenRole(null)} />
                            <div className="absolute left-0 top-full mt-1 z-20 bg-surface border border-border rounded-xl shadow-xl overflow-hidden min-w-[130px]">
                              {(["admin", "operator", "viewer"] as UserRow["role"][]).map((r) => (
                                <button
                                  key={r}
                                  onClick={() => handleRole(u.id, r)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${u.role === r ? "bg-brand/10 text-brand" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                                >
                                  {u.role === r && <Check className="size-3" />}
                                  {u.role !== r && <span className="size-3" />}
                                  {ROLE_LABELS[r]}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center gap-2 md:justify-start">
                      <span className={`px-2 py-1 rounded-lg border text-[11px] font-medium ${STATUS_CLASSES[u.status]}`}>
                        {STATUS_LABELS[u.status]}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      {u.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleStatus(u.id, "active")}
                            disabled={isBusy}
                            title="Aprovar"
                            className="p-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-colors disabled:opacity-50"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleStatus(u.id, "rejected")}
                            disabled={isBusy}
                            title="Rejeitar"
                            className="p-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50"
                          >
                            <X className="size-3.5" />
                          </button>
                        </>
                      )}
                      {u.status === "active" && (
                        <button
                          onClick={() => handleStatus(u.id, "rejected")}
                          disabled={isBusy || isSelf}
                          title="Revogar acesso"
                          className="p-1.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                      {u.status === "rejected" && (
                        <button
                          onClick={() => handleStatus(u.id, "active")}
                          disabled={isBusy}
                          title="Reativar"
                          className="p-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-colors disabled:opacity-50"
                        >
                          <Check className="size-3.5" />
                        </button>
                      )}
                      {!isGoogle && !isSelf && (
                        <button
                          onClick={() => openPwdModal(u)}
                          disabled={isBusy}
                          title="Alterar senha"
                          className="p-1.5 rounded-lg text-muted-foreground/50 hover:bg-brand/10 hover:text-brand border border-transparent hover:border-brand/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <KeyRound className="size-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={isBusy || isSelf}
                        title="Remover usuário"
                        className="p-1.5 rounded-lg text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 border border-transparent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-right">
            {filtered.length} de {users.length} usuários
          </p>
        )}
      </div>

      {/* Modal: alterar senha */}
      {pwdTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm space-y-5">
            <div className="flex items-center gap-2">
              <KeyRound className="size-4 text-brand" />
              <h2 className="text-sm font-semibold text-foreground">Alterar senha</h2>
            </div>

            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">
                Usuário: <span className="text-foreground font-medium">{pwdTarget.full_name ?? pwdTarget.email}</span>
              </p>
              <p className="text-[11px] text-muted-foreground">{pwdTarget.email}</p>
            </div>

            {pwdSuccess ? (
              <div className="flex items-center gap-2 py-3 px-4 bg-brand/10 border border-brand/20 rounded-xl">
                <Check className="size-4 text-brand shrink-0" />
                <p className="text-sm text-brand">Senha alterada com sucesso.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Nova senha</label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={newPwd}
                      onChange={(e) => { setNewPwd(e.target.value); setPwdError(""); }}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full bg-white/5 border border-border rounded-xl px-3 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/40 transition-all"
                    />
                    <button type="button" onClick={() => setShowNew((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showNew ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Confirmar senha</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPwd}
                      onChange={(e) => { setConfirmPwd(e.target.value); setPwdError(""); }}
                      placeholder="Repita a nova senha"
                      onKeyDown={(e) => e.key === "Enter" && handlePwdSubmit()}
                      className={`w-full bg-white/5 border rounded-xl px-3 pr-9 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-all ${pwdError ? "border-destructive/50" : "border-border focus:border-brand/40"}`}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showConfirm ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    </button>
                  </div>
                </div>

                {pwdError && (
                  <p className="text-xs text-destructive">{pwdError}</p>
                )}

                <div className="text-[10px] text-muted-foreground/60 space-y-0.5 pt-1">
                  <p>• Mínimo 8 caracteres</p>
                  <p>• Deve conter letras e números</p>
                </div>
              </div>
            )}

            {!pwdSuccess && (
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setPwdTarget(null)}
                  disabled={pwdBusy}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePwdSubmit}
                  disabled={pwdBusy || !newPwd || !confirmPwd}
                  className="px-3 py-1.5 text-xs bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {pwdBusy ? "Salvando..." : "Confirmar"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
