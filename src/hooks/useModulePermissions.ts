import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ModulePermissions = {
  can_access_crm: boolean;
  can_access_email: boolean;
  can_access_excel: boolean;
  can_access_notes: boolean;
  can_access_projects: boolean;
  can_access_files: boolean;
};

const ALL_TRUE: ModulePermissions = {
  can_access_crm: true,
  can_access_email: true,
  can_access_excel: true,
  can_access_notes: true,
  can_access_projects: true,
  can_access_files: true,
};

export function useModulePermissions() {
  const { user } = useAuth();
  const [perms, setPerms] = useState<ModulePermissions>(ALL_TRUE);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    Promise.all([
      supabase
        .from("user_module_permissions")
        .select("can_access_crm,can_access_email,can_access_excel,can_access_notes,can_access_projects,can_access_files")
        .eq("user_id", user.id)
        .limit(1),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .order("role", { ascending: true })
        .limit(1),
    ]).then(([{ data: permRows }, { data: roleRows }]) => {
      const permData = permRows?.[0] ?? null;
      const roleData = roleRows?.[0] ?? null;
      if (permData) {
        setPerms({
          can_access_crm: permData.can_access_crm,
          can_access_email: permData.can_access_email,
          can_access_excel: permData.can_access_excel,
          can_access_notes: permData.can_access_notes,
          can_access_projects: permData.can_access_projects,
          can_access_files: permData.can_access_files,
        });
      }
      setIsAdmin(roleData?.role === "admin");
      setLoaded(true);
    });
  }, [user?.id]);

  return { perms, isAdmin, loaded };
}
