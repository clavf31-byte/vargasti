import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/crm/orcamentos")({
  component: () => <Outlet />,
});
