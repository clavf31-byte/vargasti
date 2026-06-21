import client from "@/config/client";
import { createFileRoute, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/crm")({
  head: () => ({ meta: [{ title: `CRM · ${client.name}` }] }),
  component: CRMLayoutPage,
});

function CRMLayoutPage() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === "/crm" || pathname === "/crm/") {
      navigate({ to: "/crm/clientes", replace: true });
    }
  }, [navigate, pathname]);

  return <Outlet />;
}
