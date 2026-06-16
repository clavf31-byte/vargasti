import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import loginBg from "@/assets/login-bg.png.asset.json";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [session, loading, navigate]);

  async function handleGoogle() {
    setError("");
    setGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth("google", {
        redirectTo: window.location.origin,
      });
      if (error) {
        setError(error.message ?? "Falha ao entrar com Google");
        setGoogleLoading(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao conectar com Google");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      setSubmitting(false);
      if (error) {
        setError(error.message);
      } else if (data?.session) {
        navigate({ to: "/" });
      }
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Erro ao fazer login");
    }
  }

  // Image is 1536 x 1024 (3:2)
  // Overlay positions tuned to match the artwork's form area.
  const inputBase: React.CSSProperties = {
    position: "absolute",
    width: "37.9%",
    left: "52.6%",
    height: "5.4%",
    background: "transparent",
    border: 0,
    outline: 0,
    color: "#f4f8fb",
    fontSize: "clamp(11px, 1.05vw, 16px)",
    paddingLeft: "3.2%",
    paddingRight: "3.2%",
    fontFamily: "Inter, Segoe UI, Arial, sans-serif",
  };

  const btnReset: React.CSSProperties = {
    position: "absolute",
    background: "transparent",
    border: 0,
    cursor: "pointer",
    padding: 0,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "#04060e",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          width: "min(100vw, calc(100vh * 1.5))",
          height: "min(calc(100vw / 1.5), 100vh)",
          maxWidth: "100vw",
          maxHeight: "100vh",
        }}
      >
        <img
          src={loginBg.url}
          alt="VargasTI - Soluções que conectam, suporte que transforma"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            userSelect: "none",
            pointerEvents: "none",
          }}
          draggable={false}
        />

        {/* Google button overlay */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={googleLoading || submitting}
          aria-label="Entrar com Google"
          style={{
            ...btnReset,
            left: "52.6%",
            top: "26.8%",
            width: "37.9%",
            height: "6.8%",
            cursor: googleLoading || submitting ? "not-allowed" : "pointer",
            opacity: googleLoading || submitting ? 0.6 : 1,
            transition: "opacity 0.2s",
          }}
          title={googleLoading ? "Conectando ao Google..." : "Entrar com Google"}
        />

        {/* Email input */}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-label="E-mail"
          autoComplete="email"
          style={{ ...inputBase, top: "43.4%" }}
        />

        {/* Password input */}
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-label="Senha"
          autoComplete="current-password"
          style={{ ...inputBase, top: "54.8%" }}
        />

        {/* Show/hide password toggle */}
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          style={{
            ...btnReset,
            left: "87.5%",
            top: "54.8%",
            width: "3%",
            height: "5.4%",
          }}
        />

        {/* Submit button overlay */}
        <form onSubmit={handleSubmit} style={{ position: "absolute", inset: 0 }}>
          <button
            type="submit"
            disabled={submitting}
            aria-label="Entrar"
            style={{
              ...btnReset,
              left: "52.6%",
              top: "66.8%",
              width: "37.9%",
              height: "7.2%",
              cursor: submitting ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {submitting && <Loader2 size={20} color="#fff" style={{ animation: "spin 1s linear infinite" }} />}
          </button>
        </form>

        {error && (
          <p
            style={{
              position: "absolute",
              left: "52.6%",
              top: "76%",
              width: "37.9%",
              margin: 0,
              color: "#ff6b6b",
              fontSize: "clamp(11px, 0.9vw, 13px)",
              textAlign: "center",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
