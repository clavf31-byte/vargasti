import client from "@/config/client";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { listUsers, updateUser, createOperator } from "@/lib/api/adminUsers.functions";
import type { UserRow } from "@/lib/api/adminUsers.functions";
import { StatCard, Btn, EmptyState, LoadingState } from "@/components/shared";
import { roleConfig, OPERATOR_ROLES } from "@/lib/operatorPermissions";
import type { OperatorRole } from "@/lib/operatorPermissions";
import {
  Shield, RefreshCw, User, Clock, UserCheck, UserX,
  Search, Pencil, X, Check, UserPlus, Eye, EyeOff,
  Copy, RefreshCcw, Mail,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: `Operadores · ${client.name}` }] }),
  component: OperatorListPage,
});

const STATUS_CLS = {
  pending: "text-warning bg-warning/10 border-warning/20",
  approved: "text-brand bg-brand/10 border-brand/20",
  rejected: "text-destructive bg-destructive/10 border-destructive/20",
};

const STATUS_LABEL = { pending: "Pendente", approved: "Ativo", rejected: "Rejeitado" };

function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$";
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

type NewOpForm = {
  full_name: string;
  email: string;
  role: OperatorRole;
  password: string;
  send_email: boolean;
};

type Created = { email: string; password: string };

function NewOperatorDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState<NewOpForm>({
    full_name: "",
    email: "",
    role: "operador",
    password: generatePassword(),
    send_email: true,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: keyof NewOpForm, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await createOperator({ data: form });
      setCreated({ email: form.email, password: form.password });
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar operador.");
    } finally {
      setBusy(false);
    }
  }

  function copyCredentials() {
    if (!created) return;
    navigator.clipboard.writeText(`Email: ${created.email}\nSenha: ${created.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (created) {
    return (
      <Overlay onClose={onClose}>
        <div className="space-y-5">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-full bg-brand/10 border border-brand/20 grid place-items-center">
              <UserCheck className="size-4 text-brand" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Operador criado</h2>
              <p className="text-[11px] text-muted-foreground">Conta ativa com acesso imediato</p>
            </div>
          </div>

          <div className="rounded-xl bg-secondary/40 border border-border p-4 space-y-3 font-mono text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground text-xs">Email</span>
              <span className="text-foreground truncate">{created.email}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-muted-foreground text-xs">Senha</span>
              <span className="text-foreground">{created.password}</span>
            </div>
          </div>

          {form.send_email && (
            <p className="flex items-center gap-2 text-xs text-brand">
              <Mail className="size-3.5 shrink-0" />
              Email de acesso enviado para {created.email}
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={copyCredentials}
              className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg bg-secondary border border-border text-sm text-foreground hover:bg-secondary/80 transition-colors"
            >
              <Copy className="size-3.5" />
              {copied ? "Copiado!" : "Copiar credenciais"}
            </button>
            <button
              onClick={onClose}
              className="flex-1 h-9 rounded-lg bg-brand text-sm font-medium text-brand-foreground hover:bg-brand/90 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </Overlay>
    );
  }

  return (
    <Overlay onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-2.5 mb-1">
          <UserPlus className="size-4 text-brand" />
          <h2 className="text-base font-bold text-foreground">Novo Operador</h2>
        </div>

        <Field label="Nome completo">
          <input
            required
            value={form.full_name}
            onChange={(e) => set("full_name", e.target.value)}
            placeholder="Ex: João Silva"
            className="input-base"
          />
        </Field>

        <Field label="E-mail">
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="joao@empresa.com"
            className="input-base"
          />
        </Field>

        <Field label="Função">
          <select
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            className="input-base cursor-pointer"
          >
            {OPERATOR_ROLES.filter((r) => r.value !== "admin").map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Senha temporária">
          <div className="relative">
            <input
              required
              minLength={8}
              type={showPwd ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="input-base pr-20"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-0.5">
              <button
                type="button"
                onClick={() => set("password", generatePassword())}
                title="Gerar nova senha"
                className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCcw className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="p-1.5 rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPwd ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
              </button>
            </div>
          </div>
        </Field>

        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={form.send_email}
            onChange={(e) => set("send_email", e.target.checked)}
            className="h-4 w-4 rounded border-border bg-secondary text-brand"
          />
          <span className="text-sm text-foreground">Enviar email de acesso ao operador</span>
        </label>

        {error && (
          <p className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-9 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={busy}
            className="flex-1 h-9 rounded-lg bg-brand text-sm font-medium text-brand-foreground hover:bg-brand/90 disabled:opacity-60 transition-colors"
          >
            {busy ? "Criando..." : "Criar Operador"}
          </button>
        </div>
      </form>
    </Overlay>
  );
}

function Overlay({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}

function OperatorListPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [operators, setOperators] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<OperatorRole | "">("");
  const [filterStatus, setFilterStatus] = useState<"" | "pending" | "approved" | "rejected">("");
  const [showNew, setShowNew] = useState(false);

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

  const pending = operators.filter((u) => u.status === "pending");
  const filtered = operators.filter(
    (u) =>
      u.status !== "pending" &&
      (search === "" ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.full_name ?? "").toLowerCase().includes(search.toLowerCase())) &&
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
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Shield className="size-5 text-brand" />
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">Gestão de Operadores</h1>
              <p className="text-[11px] text-muted-foreground">Funções, permissões e acessos ao sistema</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Btn variant="secondary" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Btn>
            <Btn size="sm" onClick={() => setShowNew(true)}>
              <UserPlus className="size-3.5" />
              Novo Operador
            </Btn>
          </div>
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

        {/* Pendentes */}
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
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-4 px-3 py-2.5 rounded-lg bg-warning/5 border border-warning/15"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    <div className="size-8 rounded-full bg-secondary border border-border grid place-items-center shrink-0 text-[11px] font-semibold text-muted-foreground">
                      {(u.full_name ?? u.email).slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.full_name ?? u.email.split("@")[0]}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleStatus(u.id, "approved")}
                      disabled={!!busy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand text-xs font-medium hover:bg-brand/20 disabled:opacity-50 transition-colors"
                    >
                      <UserCheck className="size-3.5" /> Aprovar
                    </button>
                    <button
                      onClick={() => handleStatus(u.id, "rejected")}
                      disabled={!!busy}
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

        {/* Filtros */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou e-mail..."
              className="w-full pl-8 pr-3 py-2 text-sm bg-white/5 border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand/40 transition-colors"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as OperatorRole | "")}
            className="px-3 py-2 text-sm bg-white/5 border border-border rounded-lg text-foreground focus:outline-none focus:border-brand/40 cursor-pointer"
          >
            <option value="">Todas as funções</option>
            {OPERATOR_ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
            className="px-3 py-2 text-sm bg-white/5 border border-border rounded-lg text-foreground focus:outline-none focus:border-brand/40 cursor-pointer"
          >
            <option value="">Todos os status</option>
            <option value="approved">Ativo</option>
            <option value="rejected">Rejeitado</option>
          </select>
        </div>

        {/* Tabela */}
        <div className="card-graphite">
          {loading ? (
            <LoadingState label="Carregando operadores..." />
          ) : filtered.length === 0 ? (
            <EmptyState icon={User} title="Nenhum operador encontrado" subtitle="Ajuste os filtros ou crie um novo operador." />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left text-[10px] text-muted-foreground uppercase tracking-widest px-5 py-3 font-medium">Operador</th>
                  <th className="text-left text-[10px] text-muted-foreground uppercase tracking-widest px-4 py-3 font-medium hidden md:table-cell">Função</th>
                  <th className="text-left text-[10px] text-muted-foreground uppercase tracking-widest px-4 py-3 font-medium hidden md:table-cell">Status</th>
                  <th className="text-left text-[10px] text-muted-foreground uppercase tracking-widest px-4 py-3 font-medium hidden lg:table-cell">Último acesso</th>
                  <th className="text-right text-[10px] text-muted-foreground uppercase tracking-widest px-5 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filtered.map((u) => {
                  const isSelf = u.id === user?.id;
                  const isBusy = busy?.startsWith(u.id);
                  const rc = roleConfig(u.role);

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-white/[0.02] transition-colors"
                      style={{ opacity: u.status === "rejected" ? 0.55 : 1 }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-secondary border border-border grid place-items-center shrink-0 text-[11px] font-semibold text-muted-foreground">
                            {(u.full_name ?? u.email).slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-medium text-foreground">
                                {u.full_name ?? u.email.split("@")[0]}
                              </span>
                              {isSelf && (
                                <span className="text-[9px] text-brand bg-brand/10 border border-brand/20 rounded px-1 py-0.5 uppercase tracking-wide">você</span>
                              )}
                              {u.provider === "google" && (
                                <span className="text-[9px] text-sky-400 bg-sky-500/10 border border-sky-500/20 rounded px-1 py-0.5">Google</span>
                              )}
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${rc.cls}`}>
                          <Shield className="size-3 shrink-0" />
                          {rc.label}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className={`inline-block px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${STATUS_CLS[u.status]}`}>
                          {STATUS_LABEL[u.status]}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        <span className="text-[11px] text-muted-foreground">
                          {u.last_sign_in_at
                            ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR")
                            : "—"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 w-[120px]">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => navigate({ to: "/admin/$operatorId", params: { operatorId: u.id } })}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand text-[11px] font-medium hover:bg-brand/20 transition-colors"
                          >
                            <Pencil className="size-3" /> Editar
                          </button>
                          <div className="w-7 shrink-0 flex items-center justify-center">
                            {!isSelf && u.status === "approved" && (
                              <button
                                onClick={() => handleStatus(u.id, "rejected")}
                                disabled={isBusy}
                                title="Revogar acesso"
                                className="p-1.5 rounded-lg text-muted-foreground/40 hover:bg-destructive/10 hover:text-destructive border border-transparent hover:border-destructive/20 transition-colors disabled:opacity-30"
                              >
                                <X className="size-3.5" />
                              </button>
                            )}
                            {!isSelf && u.status === "rejected" && (
                              <button
                                onClick={() => handleStatus(u.id, "approved")}
                                disabled={isBusy}
                                title="Reativar acesso"
                                className="p-1.5 rounded-lg bg-brand/10 border border-brand/20 text-brand hover:bg-brand/20 transition-colors disabled:opacity-50"
                              >
                                <Check className="size-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <p className="text-[10px] text-muted-foreground text-right">
            {filtered.length} operador{filtered.length !== 1 ? "es" : ""}
          </p>
        )}
      </div>

      {showNew && (
        <NewOperatorDialog
          onClose={() => setShowNew(false)}
          onCreated={() => { load(); }}
        />
      )}
    </AppShell>
  );
}
