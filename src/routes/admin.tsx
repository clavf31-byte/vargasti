import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useModulePermissions } from "@/hooks/useModulePermissions";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAdmin, loaded } = useModulePermissions();
  const navigate = useNavigate();

  useEffect(() => {
    if (loaded && !isAdmin) navigate({ to: "/dashboard" });
  }, [isAdmin, loaded, navigate]);

  if (!loaded || !isAdmin) return null;
  return <Outlet />;
}
