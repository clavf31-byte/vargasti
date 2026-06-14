import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable";
import { Loader2 } from "lucide-react";

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

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: "/" });
    }
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
      if (error) {
        setError(error.message);
      } else {
        setSuccess("Conta criada! Verifique seu e-mail para confirmar.");
        setEmail("");
        setPassword("");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setSubmitting(false);
      if (error) {
        setError(error.message);
      }
    }
  }

  return (
    <div className="min-h-screen" style={styles.body}>
      <div style={styles.wave}></div>

      <main style={styles.page}>
        {/* Brand Side */}
        <section style={styles.brandSide}>
          <div style={styles.logo}>
            <svg viewBox="0 0 220 220" fill="none" style={{ width: "180px", height: "180px" }}>
              <path d="M42 70L110 185L178 70H144L110 129L76 70H42Z" stroke="url(#g1)" strokeWidth="12" strokeLinejoin="round"/>
              <path d="M74 68V34M110 88V26M146 68V34M92 95V56M128 95V56" stroke="url(#g2)" strokeWidth="8" strokeLinecap="round"/>
              <circle cx="74" cy="32" r="10" fill="#04d9ff"/>
              <circle cx="110" cy="24" r="10" fill="#18e66b"/>
              <circle cx="146" cy="32" r="10" fill="#04d9ff"/>
              <circle cx="92" cy="55" r="8" fill="#04d9ff"/>
              <circle cx="128" cy="55" r="8" fill="#18e66b"/>
              <defs>
                <linearGradient id="g1" x1="42" y1="70" x2="178" y2="185">
                  <stop stopColor="#04d9ff"/>
                  <stop offset=".55" stopColor="#0078ff"/>
                  <stop offset="1" stopColor="#18e66b"/>
                </linearGradient>
                <linearGradient id="g2" x1="74" y1="24" x2="146" y2="95">
                  <stop stopColor="#18e66b"/>
                  <stop offset="1" stopColor="#0078ff"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 style={styles.brandName}>
            Vargas
            <span style={{ background: "linear-gradient(135deg,#0cd8ff,#0080ff 52%,#20ef75)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              TI
            </span>
          </h1>
          <div style={styles.neon}></div>
          <p style={styles.tagline}>
            Soluções que conectam.<br/>
            Suporte que <span style={{ color: "#0089ff", textShadow: "0 0 18px rgba(0,120,255,.65)" }}>transforma.</span>
          </p>
        </section>

        {/* Login Card */}
        <section style={styles.card}>
          <div style={styles.inner}>
            <div style={styles.head}>
              <div>
                <h2 style={styles.h2}>
                  Bem-vindo <span style={{ color: "#18e66b" }}>de volta!</span>
                </h2>
                <p style={styles.headP}>Informe seu e-mail e senha<br/>para acessar o sistema.</p>
              </div>
              <div style={styles.safe}>🛡 Ambiente Seguro</div>
            </div>

            <button type="button" onClick={handleGoogle} style={styles.button} disabled={submitting}>
              <svg width="28" height="28" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
                <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.4 6.3 14.7z"/>
                <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.3 0-9.8-3.3-11.4-8l-6.5 5C9.4 39.5 16.1 44 24 44z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.4-2.3 4.4-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
              </svg>
              Entrar com Google
            </button>

            <div style={styles.sep}>ou</div>

            <form onSubmit={handleSubmit}>
              <div style={styles.group}>
                <label style={styles.label}>E-mail</label>
                <div style={styles.input}>
                  <span>✉</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Digite seu e-mail"
                    style={styles.inputField}
                  />
                </div>
              </div>

              <div style={styles.group}>
                <label style={styles.label}>Senha</label>
                <div style={styles.input}>
                  <span>🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    style={styles.inputField}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: "none", border: "none", color: "#91a7bb", cursor: "pointer", fontSize: "18px", padding: 0 }}
                  >
                    {showPassword ? "👁" : "👁"}
                  </button>
                </div>
              </div>

              <div style={styles.options}>
                <label style={styles.remember}>
                  <input type="checkbox" style={{ marginRight: "8px" }} /> Lembrar-me
                </label>
                <a href="#" style={styles.forgot}>Esqueci minha senha ›</a>
              </div>

              {error && <div style={{ color: "#ff6b6b", fontSize: "14px", marginBottom: "16px" }}>{error}</div>}
              {success && <div style={{ color: "#18e66b", fontSize: "14px", marginBottom: "16px" }}>{success}</div>}

              <button type="submit" style={styles.loginBtn} disabled={submitting}>
                {submitting ? <Loader2 style={{ animation: "spin 1s linear infinite" }} size={20} /> : "↪ Entrar"}
              </button>
            </form>

            <div style={styles.create}>
              <span>Não tem conta? <a href="#" onClick={(e) => { e.preventDefault(); switchMode("signup"); }} style={{ color: "#18e66b", textDecoration: "none", fontWeight: "800" }}>Criar conta</a></span>
            </div>
          </div>

          <footer style={styles.footer}>
            <div style={styles.foot}>
              <div style={{ ...styles.icon, color: "#18e66b" }}>●</div>
              <div><strong style={{ display: "block", fontSize: "18px", marginBottom: "4px" }}>Sistema Online</strong><small style={{ color: "#a7b4c2", fontSize: "15px" }}>Todos os serviços OK</small></div>
            </div>
            <div style={styles.foot}>
              <div style={styles.icon}>▱</div>
              <div><strong style={{ display: "block", fontSize: "18px", marginBottom: "4px" }}>V2.5.0</strong><small style={{ color: "#a7b4c2", fontSize: "15px" }}>22/05/2026</small></div>
            </div>
            <div style={styles.foot}>
              <div style={{ ...styles.icon, color: "#18e66b" }}>🛡</div>
              <div><strong style={{ display: "block", fontSize: "18px", marginBottom: "4px" }}>Ambiente Seguro</strong><small style={{ color: "#a7b4c2", fontSize: "15px" }}>Seus dados protegidos</small></div>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}

const styles = {
  body: {
    margin: 0,
    minHeight: "100vh",
    fontFamily: "Inter, Segoe UI, Arial, sans-serif",
    color: "#f4f8fb",
    background: `
      linear-gradient(rgba(0,120,255,.07) 1px,transparent 1px),
      linear-gradient(90deg,rgba(0,120,255,.07) 1px,transparent 1px),
      radial-gradient(circle at 10% 70%,rgba(0,120,255,.22),transparent 32%),
      radial-gradient(circle at 85% 20%,rgba(0,255,130,.12),transparent 32%),
      linear-gradient(135deg,#020711,#031323 45%,#020914)
    `,
    backgroundSize: "72px 72px,72px 72px,100% 100%,100% 100%,100% 100%",
    overflowX: "hidden",
  } as React.CSSProperties,
  wave: {
    position: "fixed",
    left: "-80px",
    bottom: "-120px",
    width: "620px",
    height: "300px",
    opacity: 0.45,
    background: "radial-gradient(circle,rgba(0,180,255,.85) 1px,transparent 2px)",
    backgroundSize: "16px 16px",
    clipPath: "polygon(0 45%,18% 38%,38% 54%,60% 42%,78% 52%,100% 37%,100% 100%,0 100%)",
    filter: "drop-shadow(0 0 20px rgba(0,120,255,.55))",
  } as React.CSSProperties,
  page: {
    minHeight: "100vh",
    display: "grid",
    gridTemplateColumns: "0.92fr 1.08fr",
    alignItems: "center",
    gap: "32px",
    padding: "32px 48px",
    position: "relative",
  } as React.CSSProperties,
  brandSide: {
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "620px",
  } as React.CSSProperties,
  logo: {
    width: "180px",
    height: "180px",
    filter: "drop-shadow(0 0 24px rgba(0,130,255,.55))",
    marginBottom: "10px",
  } as React.CSSProperties,
  brandName: {
    fontSize: "clamp(42px, 5vw, 64px)",
    fontWeight: 900,
    letterSpacing: "-2px",
    margin: "10px 0 0",
    textShadow: "0 12px 30px rgba(0,0,0,.45)",
  } as React.CSSProperties,
  neon: {
    width: "160px",
    height: "4px",
    borderRadius: "999px",
    margin: "34px auto 36px",
    background: "linear-gradient(90deg,transparent,#00b9ff,transparent)",
    boxShadow: "0 0 22px rgba(0,140,255,.8)",
  } as React.CSSProperties,
  tagline: {
    fontSize: "14px",
    letterSpacing: "8px",
    lineHeight: 1.5,
    fontWeight: 600,
    textTransform: "uppercase",
    margin: 0,
  } as React.CSSProperties,
  card: {
    width: "min(100%,780px)",
    justifySelf: "center",
    background: "radial-gradient(circle at 92% 10%,rgba(0,255,130,.07),transparent 22%),radial-gradient(circle at 14% 18%,rgba(0,160,255,.08),transparent 28%),rgba(3,14,26,.82)",
    border: "1px solid rgba(20,190,255,.45)",
    borderRightColor: "rgba(20,255,110,.65)",
    borderRadius: "30px",
    boxShadow: "0 28px 90px rgba(0,0,0,.38),0 0 55px rgba(0,120,255,.12)",
    backdropFilter: "blur(18px)",
    overflow: "hidden",
  } as React.CSSProperties,
  inner: {
    padding: "44px 40px 28px",
  } as React.CSSProperties,
  head: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "34px",
  } as React.CSSProperties,
  h2: {
    fontSize: "clamp(24px, 2.5vw, 32px)",
    margin: "0 0 12px",
    letterSpacing: "-0.8px",
    color: "#f4f8fb",
  } as React.CSSProperties,
  headP: {
    margin: 0,
    color: "#c7d3df",
    fontSize: "14px",
    lineHeight: 1.35,
  } as React.CSSProperties,
  safe: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    padding: "14px 18px",
    borderRadius: "14px",
    border: "1px solid rgba(120,180,220,.24)",
    fontWeight: 700,
    whiteSpace: "nowrap",
    background: "rgba(5,18,30,.64)",
    color: "#fff",
  } as React.CSSProperties,
  button: {
    width: "100%",
    minHeight: "50px",
    borderRadius: "12px",
    border: "1px solid rgba(130,180,220,.36)",
    background: "rgba(2,12,22,.56)",
    color: "#f4f8fb",
    fontSize: "16px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    cursor: "pointer",
    transition: ".2s",
  } as React.CSSProperties,
  sep: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: "22px",
    margin: "40px 0 34px",
    color: "#b7c5d1",
    fontSize: "18px",
  } as React.CSSProperties,
  group: {
    marginBottom: "24px",
  } as React.CSSProperties,
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: 700,
    marginBottom: "8px",
    color: "#f4f8fb",
  } as React.CSSProperties,
  input: {
    minHeight: "48px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: "1px solid rgba(130,180,220,.34)",
    borderRadius: "10px",
    background: "rgba(3,18,32,.78)",
    padding: "0 16px",
    color: "#91a7bb",
  } as React.CSSProperties,
  inputField: {
    flex: 1,
    border: 0,
    outline: 0,
    background: "transparent",
    color: "#f4f8fb",
    fontSize: "15px",
    minWidth: 0,
  } as React.CSSProperties,
  options: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    margin: "22px 0 32px",
    gap: "20px",
    flexWrap: "wrap",
  } as React.CSSProperties,
  remember: {
    display: "inline-flex",
    alignItems: "center",
    gap: "12px",
    color: "#d5e0ea",
    fontSize: "18px",
    cursor: "pointer",
  } as React.CSSProperties,
  forgot: {
    color: "#04d9ff",
    textDecoration: "none",
    fontSize: "18px",
    fontWeight: 700,
  } as React.CSSProperties,
  loginBtn: {
    width: "100%",
    minHeight: "52px",
    borderRadius: "12px",
    border: 0,
    background: "linear-gradient(135deg,#18e66b,#0bb7c4 50%,#006cff)",
    color: "#f4f8fb",
    fontSize: "16px",
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    cursor: "pointer",
    boxShadow: "0 20px 38px rgba(0,110,255,.22)",
    marginTop: "16px",
  } as React.CSSProperties,
  create: {
    display: "grid",
    gridTemplateColumns: "1fr auto 1fr",
    alignItems: "center",
    gap: "20px",
    margin: "34px 0 2px",
    color: "#c7d4df",
    fontSize: "18px",
    textAlign: "center",
  } as React.CSSProperties,
  footer: {
    borderTop: "1px solid rgba(130,180,220,.22)",
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
  } as React.CSSProperties,
  foot: {
    padding: "28px 34px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    borderRight: "1px solid rgba(130,180,220,.22)",
  } as React.CSSProperties,
  icon: {
    width: "42px",
    height: "42px",
    display: "grid",
    placeItems: "center",
    color: "#04d9ff",
  } as React.CSSProperties,
};
