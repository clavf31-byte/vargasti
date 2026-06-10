import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/version")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({
          version: __APP_VERSION__,
          gitHash: __GIT_HASH__,
          buildNumber: __BUILD_NUMBER__,
          buildDate: __BUILD_DATE__,
          timestamp: new Date().toISOString(),
        });
      },
    },
  },
});
