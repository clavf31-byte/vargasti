import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import {
  getOperator, updateUser, updatePermissions, deleteUser, updateUserPassword,
} from "@/lib/api/adminUsers.functions";
import type { UserRow } from "@/lib/api/adminUsers.functions";
import {
  roleConfig, OPERATOR_ROLES, PERMISSION_GROUPS, ROLE_DEFAULT_PERMISSIONS,
} from "@/lib/operatorPermissions";
import type { OperatorRole } from "@/lib/operatorPermissions";
import {
  ArrowLeft, Shield, Check, X, ChevronDown, Eye, EyeOff,
  KeyRound, UserX, UserCheck, Trash2, ShieldCheck, History,
  CheckSquare, Square,
} from "lucide-react";

export const Route = createFileRoute("/admin/$operatorId")({
  component: OperatorDetailPage,
});

type Tab = "dados" | "permissoes" | "seguranca" | "historico";

const TABS: { id: Tab; label: string }[] = [
  { id: "dados", label: "Dados Gerais" },
  { id: "permissoes", label: "Permissões" },
  { id: "seguranca", label: "Segurança" },
  { id: "historico", label: "Histórico" },
];

const STATUS_CLS = {
  pending: "text-warning bg-warning/10 border-warning/20",
  approved: "text-brand bg-brand/10 border-brand/20",
  rejected: "text-destructive bg-destructive/10 border-destructive/20",
};
const STATUS_LABEL = { pending: "Pendente", approved: "Ativo", rejected: "Rejeitado" };

function validatePassword(pwd: string) {
  if (pwd.length < 8) return "Mínimo 8 caracteres.";
  if (!/[a-zA-Z]/.test(pwd)) return "Deve conter letras.";
  if (!/[0-9]/.test(pwd)) return "Deve conter números.";
  return null;
}

function OperatorDetailPage() {
  const { operatorId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [operator, setOperator] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("dados");
  const [saving, setSaving] = useState(false);
  const [openRole, setOpenRole] = useState(false);

  // Permissões granulares
  const [perms, setPerms] = useState<Record<string, boolean>>({});
  const [permsDirty, setPermsDirty] = useState(false);
  const [permsSaving, setPermsSaving] = useState(false);
  const [permsMsg, setPermsMsg] = useState("");

  // Segurança
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdBusy, setPwdBusy] = useState(false);

  const isSelf = operator?.id === user?.id;

  useEffect(() => {
    setLoading(true);
    setError("");
    getOperator({ data: { id: operatorId } })
      .then((data) => {
        setOperator(data);
        setPerms(Object.keys(data.permissions).length > 0
          ? data.permissions
          : (ROLE_DEFAULT_PERMISSIONS[data.role] ?? {}));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Operador não encontrado."))
      .finally(() => setLoading(false));
  }, [operatorId]);

  async function handleRoleChange(role: OperatorRole) {
    if (!operator) return;
    setOpenRole(false);
    setSaving(true);
    try {
      await updateUser({ data: { id: operator.id, role } });
      const defaults = ROLE_DEFAULT_PERMISSIONS[role] ?? {};
      setOperator({ ...operator, role });
      if (!permsDirty) {
        setPerms(defaults);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status: UserRow["status"]) {
    if (!operator) return;
    setSaving(true);
    try {
      await updateUser({ data: { id: operator.id, status } });
      setOperator({ ...operator, status });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar.");
    } finally {
      setSaving(false);
    }
  }

  function togglePerm(key: string) {
    setPerms((prev) => ({ ...prev, [key]: !prev[key] }));
    setPermsDirty(true);
    setPermsMsg("");
  }

  function toggleModule(module: string, value: boolean) {
    const group = PERMISSION_GROUPS.find((g) => g.module === module);
    if (!group) return;
    const updates: Record<string, boolean> = {};
    group.perms.forEach((p) => { updates[`${module}.${p.key}`] = value; });
    setPerms((prev) => ({ ...prev, ...updates }));
    setPermsDirty(true);
    setPermsMsg("");
  }

  function restoreDefaults() {
    if (!operator) return;
    setPerms(ROLE_DEFAULT_PERMISSIONS[operator.role] ?? {});
    setPermsDirty(true);
    setPermsMsg("");
  }

  async function savePerms() {
    if (!operator) return;
    setPermsSaving(true);
    try {
      await updatePermissions({ data: { userId: operator.id, permissions: perms } });
      setOperator({ ...operator, permissions: perms });
      setPermsDirty(false);
      setPermsMsg("Permissões salvas.");
      setTimeout(() => setPermsMsg(""), 3000);
    } catch (e) {
      setPermsMsg(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setPermsSaving(false);
    }
  }

  async function handleDelete() {
    if (!operator || !confirm(`Excluir ${operator.full_name ?? operator.email}? Esta ação não pode ser desfeita.`)) return;
    setSaving(true);
    try {
      await deleteUser({ data: { id: operator.id } });
      navigate({ to: "/admin" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
      setSaving(false);
    }
  }

  async function handlePwdSubmit() {
    if (!operator) return;
    const err = validatePassword(newPwd);
    if (err) { setPwdError(err); return; }
    if (newPwd !== confirmPwd) { setPwdError("As senhas não coincidem."); return; }
    setPwdBusy(true);
    setPwdError("");
    try {
      await updateUserPassword({ data: { userId: operator.id, password: newPwd } });
      setPwdSuccess(true);
      setNewPwd("");
      setConfirmPwd("");
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch (e) {
      setPwdError(e instanceof Error ? e.message : "Erro ao alterar senha.");
    } finally {
      setPwdBusy(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="size-5 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
        </div>
      </AppShell>
    );
  }

  if (error || !operator) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button onClick={() => navigate({ to: "/admin" })} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="size-3.5" /> Voltar
          </button>
          <p className="text-sm text-destructive">{error || "Operador não encontrado."}</p>
        </div>
      </AppShell>
    );
  }

  const rc = roleConfig(operator.role);

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-5">
        {/* Back + header */}
        <div>
          <button
            onClick={() => navigate({ to: "/admin" })}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Voltar para Operadores
          </button>

          <div className="flex items-start gap-4 flex-wrap">
            <div className="size-12 rounded-full bg-secondary border border-border grid place-items-center text-sm font-bold text-muted-foreground shrink-0">
              {(operator.full_name ?? operator.email).slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground">{operator.full_name ?? operator.email.split("@")[0]}</h1>
              <p className="text-xs text-muted-foreground">{operator.email}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold ${rc.cls}`}>
                  {rc.label}
                </span>
                <span className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-semibold ${STATUS_CLS[operator.status]}`}>
                  {STATUS_LABEL[operator.status]}
                </span>
                {operator.provider === "google" && (
                  <span className="px-2.5 py-0.5 rounded-lg border text-[11px] text-sky-400 bg-sky-500/10 border-sky-500/20">Google</span>
                )}
                {isSelf && (
                  <span className="px-2 py-0.5 rounded border text-[9px] uppercase tracking-wide text-brand bg-brand/10 border-brand/20">você</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>
        )}

        {/* Tabs */}
        <div className="border-b border-border/60">
          <div className="flex gap-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  tab === t.id
                    ? "border-brand text-brand"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* TAB: Dados Gerais */}
        {tab === "dados" && (
          <div className="card-graphite p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nome */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Nome</label>
                <p className="text-sm text-foreground">{operator.full_name ?? "—"}</p>
              </div>
              {/* Email */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">E-mail</label>
                <p className="text-sm text-foreground">{operator.email}</p>
              </div>
              {/* Função */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Função</label>
                <div className="relative inline-block">
                  <button
                    onClick={() => !isSelf && setOpenRole(!openRole)}
                    disabled={saving || isSelf}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${rc.cls}`}
                  >
                    <Shield className="size-3.5" />
                    {rc.label}
                    {!isSelf && <ChevronDown className="size-3 opacity-60" />}
                  </button>
                  {openRole && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenRole(false)} />
                      <div className="absolute left-0 top-full mt-1 z-20 card-graphite shadow-xl overflow-hidden min-w-[180px]">
                        {OPERATOR_ROLES.map((r) => (
                          <button
                            key={r.value}
                            onClick={() => handleRoleChange(r.value)}
                            className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors ${operator.role === r.value ? "bg-brand/10 text-brand" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}
                          >
                            {operator.role === r.value ? <Check className="size-3" /> : <span className="size-3" />}
                            {r.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              {/* Status */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Status</label>
                <span className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${STATUS_CLS[operator.status]}`}>
                  {STATUS_LABEL[operator.status]}
                </span>
              </div>
              {/* Membro desde */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Membro desde</label>
                <p className="text-sm text-foreground">{new Date(operator.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              {/* Último acesso */}
              <div>
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider block mb-1.5">Último acesso</label>
                <p className="text-sm text-foreground">
                  {operator.last_sign_in_at ? new Date(operator.last_sign_in_at).toLocaleString("pt-BR") : "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Permissões */}
        {tab === "permissoes" && (
          <div className="space-y-4">
            {operator.role === "admin" ? (
              <div className="card-graphite p-6 flex items-center gap-3">
                <ShieldCheck className="size-5 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Administrador tem acesso total</p>
                  <p className="text-xs text-muted-foreground">Administradores não têm restrições de permissão.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <p className="text-xs text-muted-foreground">
                    Permissões individuais para <span className="text-foreground font-medium">{operator.full_name ?? operator.email}</span>.
                    Sobrescrevem o perfil padrão.
                  </p>
                  <button
                    onClick={restoreDefaults}
                    className="text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
                  >
                    Restaurar padrão do perfil
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {PERMISSION_GROUPS.map((group) => {
                    const allEnabled = group.perms.every((p) => perms[`${group.module}.${p.key}`]);
                    const noneEnabled = group.perms.every((p) => !perms[`${group.module}.${p.key}`]);

                    return (
                      <div key={group.module} className="card-graphite p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">{group.label}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => toggleModule(group.module, true)}
                              className="text-[10px] text-brand hover:underline px-1"
                            >
                              tudo
                            </button>
                            <span className="text-[10px] text-muted-foreground">|</span>
                            <button
                              onClick={() => toggleModule(group.module, false)}
                              className="text-[10px] text-muted-foreground hover:text-foreground hover:underline px-1"
                            >
                              limpar
                            </button>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {group.perms.map((p) => {
                            const key = `${group.module}.${p.key}`;
                            const enabled = !!perms[key];
                            return (
                              <button
                                key={key}
                                onClick={() => togglePerm(key)}
                                className="w-full flex items-center gap-2.5 text-left group"
                              >
                                <div className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${enabled ? "bg-brand border-brand" : "border-border group-hover:border-brand/50"}`}>
                                  {enabled && <Check className="size-2.5 text-brand-foreground" />}
                                </div>
                                <span className={`text-[11px] transition-colors ${enabled ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"}`}>
                                  {p.label}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  {permsMsg && (
                    <p className={`text-xs ${permsMsg.includes("salvas") ? "text-brand" : "text-destructive"}`}>
                      {permsMsg}
                    </p>
                  )}
                  <div className="flex gap-2 ml-auto">
                    <button
                      onClick={savePerms}
                      disabled={!permsDirty || permsSaving}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand text-brand-foreground text-xs font-medium hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {permsSaving ? "Salvando..." : "Salvar permissões"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB: Segurança */}
        {tab === "seguranca" && (
          <div className="space-y-4">
            {/* Alterar senha */}
            {operator.provider === "email" && !isSelf && (
              <div className="card-graphite p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <KeyRound className="size-4 text-brand" />
                  <h3 className="text-sm font-semibold text-foreground">Alterar senha</h3>
                </div>

                {pwdSuccess ? (
                  <div className="flex items-center gap-2 py-2.5 px-3 bg-brand/10 border border-brand/20 rounded-lg">
                    <Check className="size-4 text-brand shrink-0" />
                    <p className="text-xs text-brand">Senha alterada com sucesso.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                          <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
                          <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showConfirm ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                    {pwdError && <p className="text-xs text-destructive">{pwdError}</p>}
                    <button
                      onClick={handlePwdSubmit}
                      disabled={pwdBusy || !newPwd || !confirmPwd}
                      className="px-4 py-2 text-xs font-medium bg-brand text-brand-foreground rounded-lg hover:bg-brand/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      {pwdBusy ? "Alterando..." : "Confirmar alteração"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Controle de acesso */}
            {!isSelf && (
              <div className="card-graphite p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-brand" />
                  <h3 className="text-sm font-semibold text-foreground">Controle de acesso</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {operator.status !== "approved" && (
                    <button
                      onClick={() => handleStatusChange("approved")}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-brand/10 border border-brand/20 text-brand text-xs font-medium hover:bg-brand/20 disabled:opacity-50 transition-colors"
                    >
                      <UserCheck className="size-3.5" /> Reativar acesso
                    </button>
                  )}
                  {operator.status === "approved" && (
                    <button
                      onClick={() => handleStatusChange("rejected")}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                    >
                      <UserX className="size-3.5" /> Revogar acesso
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Zona de perigo */}
            {!isSelf && operator.role !== "admin" && (
              <div className="card-graphite p-5 space-y-3 border-destructive/20">
                <div className="flex items-center gap-2">
                  <X className="size-4 text-destructive" />
                  <h3 className="text-sm font-semibold text-destructive">Zona de perigo</h3>
                </div>
                <p className="text-xs text-muted-foreground">Esta ação é irreversível. O operador será excluído permanentemente.</p>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive/20 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="size-3.5" /> Excluir operador permanentemente
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB: Histórico */}
        {tab === "historico" && (
          <div className="card-graphite p-8 flex flex-col items-center justify-center gap-3 text-center">
            <History className="size-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Histórico de auditoria</p>
            <p className="text-xs text-muted-foreground/60 max-w-sm">
              Logs de alterações, aprovações e acessos serão exibidos aqui após a configuração das tabelas de auditoria.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
