import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import {
  PERMISSION_GROUPS, OPERATOR_ROLES, ROLE_DEFAULT_PERMISSIONS,
} from "@/lib/operatorPermissions";
import type { OperatorRole } from "@/lib/operatorPermissions";
import { ArrowLeft, Check, Loader2, Save, RotateCcw, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/config/permissions")({
  head: () => ({ meta: [{ title: "Permissões por Perfil · Config" }] }),
  component: RolePermissionsPage,
});

const EDITABLE_ROLES = OPERATOR_ROLES.filter((r) => r.value !== "admin");

async function loadRolePerms(): Promise<Record<OperatorRole, Record<string, boolean>>> {
  const { data } = await (supabase as any)
    .from("role_default_permissions")
    .select("role, permissions");

  const result = { ...ROLE_DEFAULT_PERMISSIONS } as Record<OperatorRole, Record<string, boolean>>;
  if (data) {
    for (const row of data) {
      if (row.role !== "admin") result[row.role as OperatorRole] = row.permissions;
    }
  }
  return result;
}

async function saveRolePerms(role: OperatorRole, permissions: Record<string, boolean>) {
  await (supabase as any)
    .from("role_default_permissions")
    .upsert({ role, permissions }, { onConflict: "role" });
}

function RolePermissionsPage() {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState<OperatorRole>("gestor");
  const [allPerms, setAllPerms] = useState<Record<OperatorRole, Record<string, boolean>>>({} as any);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  useEffect(() => {
    loadRolePerms().then((data) => { setAllPerms(data); setLoading(false); });
  }, []);

  const perms = allPerms[activeRole] ?? {};

  function togglePerm(key: string) {
    setAllPerms((prev) => ({
      ...prev,
      [activeRole]: { ...prev[activeRole], [key]: !prev[activeRole]?.[key] },
    }));
    setDirty(true);
  }

  function toggleModule(module: string, value: boolean) {
    const group = PERMISSION_GROUPS.find((g) => g.module === module);
    if (!group) return;
    const updates: Record<string, boolean> = {};
    group.perms.forEach((p) => { updates[`${module}.${p.key}`] = value; });
    setAllPerms((prev) => ({
      ...prev,
      [activeRole]: { ...prev[activeRole], ...updates },
    }));
    setDirty(true);
  }

  function restoreDefault() {
    setAllPerms((prev) => ({
      ...prev,
      [activeRole]: { ...(ROLE_DEFAULT_PERMISSIONS[activeRole] ?? {}) },
    }));
    setDirty(true);
  }

  async function handleSave() {
    setSaving(true);
    await saveRolePerms(activeRole, allPerms[activeRole] ?? {});
    setSaving(false);
    setDirty(false);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  }

  const rc = OPERATOR_ROLES.find((r) => r.value === activeRole)!;

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 space-y-5">

        {/* Cabeçalho */}
        <div>
          <button
            onClick={() => navigate({ to: "/config" })}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="size-3.5" /> Voltar para Configurações
          </button>
          <h1 className="text-xl font-bold text-foreground">Permissões por Perfil</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Configure o que cada perfil pode fazer. Essas configurações são os padrões aplicados a novos usuários e ao restaurar permissões individuais.
          </p>
        </div>

        {/* Admin note */}
        <div className="flex items-center gap-3 px-4 py-3 bg-brand/5 border border-brand/20 rounded-xl">
          <ShieldCheck className="size-4 text-brand shrink-0" />
          <p className="text-xs text-muted-foreground">
            O perfil <span className="text-brand font-semibold">Administrador</span> sempre tem acesso total e não pode ser restringido.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-5">

          {/* Sidebar de perfis */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-1 mb-3">Perfis</p>
            {EDITABLE_ROLES.map((r) => {
              const active = r.value === activeRole;
              return (
                <button
                  key={r.value}
                  onClick={() => { setActiveRole(r.value); setDirty(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    active
                      ? "border-brand/40 bg-brand/5"
                      : "border-transparent hover:border-border hover:bg-surface-2"
                  }`}
                >
                  <span className={`size-2.5 rounded-full shrink-0 ${
                    r.value === "gestor"         ? "bg-purple-400" :
                    r.value === "administrativo" ? "bg-sky-400" :
                    r.value === "tecnico"        ? "bg-orange-400" :
                    r.value === "operador"       ? "bg-slate-400" :
                    "bg-emerald-400"
                  }`} />
                  <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
                    {r.label}
                  </span>
                  {active && <span className="ml-auto size-1.5 rounded-full bg-brand" />}
                </button>
              );
            })}
          </div>

          {/* Conteúdo */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Header do perfil ativo */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg border text-xs font-bold ${rc.cls}`}>
                      {rc.label}
                    </span>
                    {dirty && (
                      <span className="text-[10px] text-warning bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-full">
                        Alterações não salvas
                      </span>
                    )}
                  </div>
                  <button
                    onClick={restoreDefault}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <RotateCcw className="size-3" /> Restaurar padrão
                  </button>
                </div>

                {/* Grid de permissões */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PERMISSION_GROUPS.map((group) => {
                    const allOn = group.perms.every((p) => !!perms[`${group.module}.${p.key}`]);
                    return (
                      <div key={group.module} className="card-selectable p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">{group.label}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleModule(group.module, true)}
                              className="text-[10px] text-brand hover:underline"
                            >
                              tudo
                            </button>
                            <span className="text-[10px] text-border">|</span>
                            <button
                              onClick={() => toggleModule(group.module, false)}
                              className="text-[10px] text-muted-foreground hover:text-foreground hover:underline"
                            >
                              limpar
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {group.perms.map((p) => {
                            const key = `${group.module}.${p.key}`;
                            const enabled = !!perms[key];
                            return (
                              <button
                                key={key}
                                onClick={() => togglePerm(key)}
                                className="w-full flex items-center gap-2.5 text-left group"
                              >
                                <div className={`size-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                  enabled
                                    ? "bg-brand border-brand"
                                    : "border-border group-hover:border-brand/40"
                                }`}>
                                  {enabled && <Check className="size-2.5 text-white" />}
                                </div>
                                <span className={`text-[11px] transition-colors ${
                                  enabled ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                }`}>
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

                {/* Salvar */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {savedMsg && (
                    <span className="text-xs text-brand flex items-center gap-1">
                      <Check className="size-3" /> Salvo com sucesso
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!dirty || saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition-colors disabled:opacity-40"
                  >
                    {saving
                      ? <Loader2 className="size-3.5 animate-spin" />
                      : <Save className="size-3.5" />
                    }
                    Salvar permissões do perfil
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
