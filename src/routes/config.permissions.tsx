import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/config/permissions")({
  beforeLoad: () => {
    throw redirect({ to: "/admin" });
  },
  component: () => null,
});
