import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable";
import { Loader2, Eye, EyeOff, Shield, Layers } from "lucide-react";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  useEffect(() => {
    if (!loading && session) navigate({ to: "/" });
  }, [session, loading, navigate]);

  function switchMode(next: "login" | "signup") {
    setMode(next);
    setError("");
    setSuccess("");
  }

  async function handleGoogle() {
    setError("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setError(result.error.message ?? "Falha ao entrar com Google");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      setSubmitting(false);
      if (error) setError(error.message);
      else {
        setSuccess("Conta criada! Verifique seu e-mail para confirmar.");
        setEmail("");
        setPassword("");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setSubmitting(false);
      if (error) setError(error.message);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      fontFamily: "Inter, Segoe UI, Arial, sans-serif",
      color: "#f4f8fb",
      background: "#0a1628",
      position: "relative",
      overflow: "hidden",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      alignItems: "center",
    }}>
      {/* Circuit background overlay */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.15, pointerEvents: "none" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Horizontal lines */}
        {[80, 160, 240, 320, 400, 480].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="600" y2={y} stroke="#13c8d3" strokeWidth="0.5" />
        ))}
        {/* Vertical lines */}
        {[60, 140, 220, 300, 380, 460, 540].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="600" stroke="#13c8d3" strokeWidth="0.5" />
        ))}
        {/* Nodes */}
        {[[60,80],[140,160],[220,240],[300,320],[380,80],[460,160],[140,400],[300,480]].map(([cx,cy],i) => (
          <circle key={i} cx={cx} cy={cy} r="3" fill="#13c8d3" />
        ))}
        {/* Right side lines */}
        {[120, 200, 280, 360, 440, 520].map((y) => (
          <line key={`rh${y}`} x1="700" y1={y} x2="1400" y2={y} stroke="#13c8d3" strokeWidth="0.5" />
        ))}
        {[760, 840, 920, 1000, 1080, 1160, 1240, 1320].map((x) => (
          <line key={`rv${x}`} x1={x} y1="0" x2={x} y2="600" stroke="#13c8d3" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Glow effects */}
      <div style={{
        position: "absolute", top: "-200px", left: "-200px",
        width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(0,100,255,0.2) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-100px", right: "-100px",
        width: "400px", height: "400px",
        background: "radial-gradient(circle, rgba(19,200,211,0.15) 0%, transparent 60%)",
        pointerEvents: "none",
      }} />

      {/* LEFT — Brand */}
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "60px 40px", position: "relative", zIndex: 1,
      }}>
        {/* Logo SVG */}
        <div style={{ marginBottom: "32px", filter: "drop-shadow(0 0 32px rgba(19,200,211,0.5))" }}>
          <svg viewBox="0 0 200 200" width="140" height="140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="logoGrad" x1="30" y1="80" x2="170" y2="190">
                <stop offset="0%" stopColor="#13c8d3" />
                <stop offset="50%" stopColor="#0066ff" />
                <stop offset="100%" stopColor="#13c8d3" />
              </linearGradient>
              <linearGradient id="circuitGrad" x1="60" y1="10" x2="140" y2="90">
                <stop offset="0%" stopColor="#13c8d3" />
                <stop offset="100%" stopColor="#0066ff" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
              </filter>
            </defs>
            {/* V shape */}
            <path d="M35 75 L100 175 L165 75 H132 L100 128 L68 75 Z"
              stroke="url(#logoGrad)" strokeWidth="10" strokeLinejoin="round" fill="none" />
            {/* Circuit lines up */}
            <line x1="68" y1="73" x2="68" y2="42" stroke="url(#circuitGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="100" y1="73" x2="100" y2="22" stroke="url(#circuitGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="132" y1="73" x2="132" y2="42" stroke="url(#circuitGrad)" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="84" y1="92" x2="84" y2="55" stroke="url(#circuitGrad)" strokeWidth="2" strokeLinecap="round" />
            <line x1="116" y1="92" x2="116" y2="55" stroke="url(#circuitGrad)" strokeWidth="2" strokeLinecap="round" />
            {/* Connector lines */}
            <line x1="68" y1="42" x2="84" y2="55" stroke="url(#circuitGrad)" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="100" y1="22" x2="84" y2="55" stroke="url(#circuitGrad)" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="100" y1="22" x2="116" y2="55" stroke="url(#circuitGrad)" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="132" y1="42" x2="116" y2="55" stroke="url(#circuitGrad)" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="68" y1="42" x2="100" y2="22" stroke="url(#circuitGrad)" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="100" y1="22" x2="132" y2="42" stroke="url(#circuitGrad)" strokeWidth="1.5" strokeDasharray="3 2" />
            {/* Nodes */}
            <circle cx="68" cy="34" r="5" fill="#13c8d3" filter="url(#glow)" />
            <circle cx="100" cy="14" r="6" fill="#13c8d3" filter="url(#glow)" />
            <circle cx="132" cy="34" r="5" fill="#13c8d3" filter="url(#glow)" />
            <circle cx="84" cy="52" r="4" fill="#0066ff" filter="url(#glow)" />
            <circle cx="116" cy="52" r="4" fill="#0066ff" filter="url(#glow)" />
          </svg>
        </div>

        {/* Brand name */}
        <h1 style={{
          fontSize: "52px", fontWeight: 900, margin: "0 0 24px",
          letterSpacing: "-2px", lineHeight: 1,
        }}>
          Vargas<span style={{ color: "#13c8d3" }}>TI</span>
        </h1>

        {/* Tagline */}
        <p style={{
          fontSize: "11px", letterSpacing: "5px", lineHeight: 2,
          fontWeight: 600, textTransform: "uppercase", textAlign: "center",
          color: "#8da2b4", margin: 0,
        }}>
          Soluções que conectam.<br />
          Suporte que{" "}
          <span style={{ color: "#13c8d3" }}>transforma.</span>
        </p>
      </div>

      {/* RIGHT — Login Card */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "40px 60px 40px 20px", position: "relative", zIndex: 1,
      }}>
        <div style={{
          width: "100%", maxWidth: "480px",
          background: "rgba(10, 20, 40, 0.85)",
          border: "1px solid rgba(19,200,211,0.3)",
          borderRadius: "20px",
          boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 40px rgba(19,200,211,0.08)",
          backdropFilter: "blur(20px)",
          overflow: "hidden",
        }}>
          <div style={{ padding: "32px 32px 24px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "28px" }}>
              <div>
                <h2 style={{ fontSize: "26px", fontWeight: 800, margin: "0 0 8px", color: "#f4f8fb" }}>
                  Bem-vindo{" "}
                  <span style={{ color: "#f5c842" }}>de volta!</span>
                </h2>
                <p style={{ margin: 0, color: "#8da2b4", fontSize: "13px", lineHeight: 1.5 }}>
                  Informe seu e-mail e senha<br />para acessar o sistema.
                </p>
              </div>
              <div style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "6px 12px", borderRadius: "20px",
                border: "1px solid rgba(19,200,211,0.3)",
                background: "rgba(19,200,211,0.08)",
                fontSize: "12px", fontWeight: 600, color: "#f4f8fb",
                whiteSpace: "nowrap",
              }}>
                <Shield size={14} color="#13c8d3" />
                <span style={{ color: "#8da2b4" }}>Ambiente</span>
                <span style={{ color: "#13c8d3" }}>Seguro</span>
              </div>
            </div>

            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={submitting}
              style={{
                width: "100%", height: "48px", borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                color: "#f4f8fb", fontSize: "14px", fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: "12px", cursor: "pointer", transition: "all 0.2s",
                marginBottom: "20px",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            >
              <svg width="20" height="20" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.4 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.8-3.3-11.4-8l-6.5 5C9.4 39.5 16.1 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.4-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
              </svg>
              Entrar com Google
            </button>

            {/* Divider */}
            <div style={{
              display: "flex", alignItems: "center", gap: "12px",
              marginBottom: "20px", color: "#4a5568", fontSize: "13px",
            }}>
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
              ou
              <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#f4f8fb" }}>
                  E-mail
                </label>
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px",
                  background: "rgba(255,255,255,0.05)", padding: "0 14px", height: "48px",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <input
                    type="email" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    style={{
                      flex: 1, border: 0, outline: 0, background: "transparent",
                      color: "#f4f8fb", fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              {/* Senha */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "#f4f8fb" }}>
                  Senha
                </label>
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px",
                  background: "rgba(255,255,255,0.05)", padding: "0 14px", height: "48px",
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a5568" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <input
                    type={showPassword ? "text" : "password"} value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    style={{
                      flex: 1, border: 0, outline: 0, background: "transparent",
                      color: "#f4f8fb", fontSize: "14px",
                    }}
                  />
                  <button
                    type="button" onClick={() => setShowPassword(!showPassword)}
                    style={{ background: "none", border: "none", color: "#4a5568", cursor: "pointer", padding: 0, display: "flex" }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px", color: "#8da2b4" }}>
                  <input
                    type="checkbox" checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#13c8d3" }}
                  />
                  Lembrar-me
                </label>
                <a href="#" style={{ color: "#13c8d3", fontSize: "13px", fontWeight: 600, textDecoration: "none" }}>
                  Esqueci minha senha &rsaquo;
                </a>
              </div>

              {error && <p style={{ color: "#ef4444", fontSize: "13px", marginBottom: "16px" }}>{error}</p>}
              {success && <p style={{ color: "#22c55e", fontSize: "13px", marginBottom: "16px" }}>{success}</p>}

              {/* Submit */}
              <button
                type="submit" disabled={submitting}
                style={{
                  width: "100%", height: "50px", borderRadius: "12px", border: 0,
                  background: "linear-gradient(135deg, #13c8d3, #0066ff)",
                  color: "#fff", fontSize: "16px", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  gap: "10px", cursor: submitting ? "not-allowed" : "pointer",
                  boxShadow: "0 8px 30px rgba(0,100,255,0.4)",
                  opacity: submitting ? 0.7 : 1, transition: "all 0.2s",
                }}
              >
                {submitting ? (
                  <Loader2 size={20} style={{ animation: "spin 1s linear infinite" }} />
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    {mode === "login" ? "Entrar" : "Criar Conta"}
                  </>
                )}
              </button>
            </form>

            {/* Switch mode */}
            <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#8da2b4" }}>
              {mode === "login" ? (
                <>Não tem conta?{" "}
                  <a href="#" onClick={(e) => { e.preventDefault(); switchMode("signup"); }}
                    style={{ color: "#13c8d3", fontWeight: 700, textDecoration: "none" }}>
                    Criar conta
                  </a>
                </>
              ) : (
                <>Já tem conta?{" "}
                  <a href="#" onClick={(e) => { e.preventDefault(); switchMode("login"); }}
                    style={{ color: "#13c8d3", fontWeight: 700, textDecoration: "none" }}>
                    Entrar
                  </a>
                </>
              )}
            </p>
          </div>

          {/* Footer */}
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
          }}>
            {[
              { icon: <span style={{ fontSize: "10px", color: "#22c55e" }}>●</span>, title: "Sistema Online", sub: "Todos os serviços OK" },
              { icon: <Layers size={16} color="#13c8d3" />, title: "V2.5.0", sub: "22/05/2026" },
              { icon: <Shield size={16} color="#22c55e" />, title: "Ambiente Seguro", sub: "Seus dados protegidos" },
            ].map((item, i) => (
              <div key={i} style={{
                padding: "16px 14px", display: "flex", alignItems: "center", gap: "10px",
                borderRight: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}>
                <div style={{ flexShrink: 0 }}>{item.icon}</div>
                <div>
                  <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "#f4f8fb" }}>{item.title}</p>
                  <p style={{ margin: 0, fontSize: "11px", color: "#4a5568" }}>{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
