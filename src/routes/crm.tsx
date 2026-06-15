import { createFileRoute, useNavigate, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/crm")({
  head: () => ({ meta: [{ title: "CRM · VargasTI Lab" }] }),
  component: CRMLayout,
});

function CRMLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/crm/orcamentos" });
  }, [navigate]);

  return <Outlet />;
}
