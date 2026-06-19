import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/contexts/AuthContext";

export const Route = createFileRoute("/debug-user-id")({
  component: DebugUserID,
});

function DebugUserID() {
  const { user } = useAuth();

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
      <h1>🔍 Debug: User ID</h1>
      <p style={{ fontSize: "18px", color: "#0f0" }}>
        user.id: <strong>{user?.id}</strong>
      </p>
      <p>Email: {user?.email}</p>
      <p style={{ color: "#999", fontSize: "12px" }}>Copie o UUID acima e use em emailAgent.functions.ts linha 600</p>
    </div>
  );
}
