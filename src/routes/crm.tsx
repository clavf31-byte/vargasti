import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/crm")({
  head: () => ({ meta: [{ title: "CRM · VargasTI Lab" }] }),
  component: CRMLayout,
});

function CRMLayout() {
  return <Outlet />;
}
