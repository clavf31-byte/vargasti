import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/crm/atendimentos")({
  component: () => <Outlet />,
});
