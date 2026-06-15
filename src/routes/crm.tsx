import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CRMLayout } from "@/components/crm/CRMLayout";

export const Route = createFileRoute("/crm")({
  head: () => ({ meta: [{ title: "CRM · VargasTI Lab" }] }),
  component: CRMLayoutPage,
});

function CRMLayoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate({ to: "/crm/dashboard", replace: true });
  }, [navigate]);

  return (
    <CRMLayout>
      <Outlet />
    </CRMLayout>
  );
}
