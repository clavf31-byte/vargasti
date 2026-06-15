import { useState } from "react";
import { Eye, EyeOff, Zap, Shield, Rocket } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a1e2e 0%, #16213e 50%, #0f3460 100%)", position: "relative", overflow: "hidden" }}>
      {/* Animated Background Elements */}
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        background: "radial-gradient(circle, rgba(19, 200, 211, 0.1) 0%, transparent 70%)",
        borderRadius: "50%",
        top: "-200px",
        left: "-200px",
        animation: "float 20s ease-in-out infinite"
      }} />
      <div style={{
        position: "absolute",
        width: "400px",
        height: "400px",
        background: "radial-gradient(circle, rgba(102, 187, 106, 0.05) 0%, transparent 70%)",
        borderRadius: "50%",
        bottom: "-150px",
        right: "-150px",
        animation: "float 25s ease-in-out infinite reverse"
      }} />

      {/* Grid Pattern Overlay */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `
          linear-gradient(0deg, transparent 24%, rgba(19, 200, 211, 0.05) 25%, rgba(19, 200, 211, 0.05) 26%, transparent 27%, transparent 74%, rgba(19, 200, 211, 0.05) 75%, rgba(19, 200, 211, 0.05) 76%, transparent 77%, transparent),
          linear-gradient(90deg, transparent 24%, rgba(19, 200, 211, 0.05) 25%, rgba(19, 200, 211, 0.05) 26%, transparent 27%, transparent 74%, rgba(19, 200, 211, 0.05) 75%, rgba(19, 200, 211, 0.05) 76%, transparent 77%, transparent)
        `,
        backgroundSize: "50px 50px",
        opacity: 0.3,
        pointerEvents: "none"
      }} />

      <div style={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center", maxWidth: "1200px", width: "100%" }}>
          {/* Left Side - Branding & Features */}
          <div style={{ display: "none" }}>
            {/* Hidden on mobile */}
          </div>
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "40px"
          }}>
            {/* Logo & Title */}
            <div>
              <div style={{
                width: "80px",
                height: "80px",
                background: "linear-gradient(135deg, #13c8d3 0%, #0bd0d7 100%)",
                borderRadius: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
                boxShadow: "0 20px 40px rgba(19, 200, 211, 0.3)",
                animation: "pulse 3s ease-in-out infinite"
              }}>
                <Zap size={40} color="white" />
              </div>
              <h1 style={{ fontSize: "48px", fontWeight: 800, color: "#eaf3f8", margin: 0, lineHeight: 1.2 }}>
                VargasTI<br />
                <span style={{ background: "linear-gradient(135deg, #13c8d3, #0bd0d7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                  CRM Hub
                </span>
              </h1>
              <p style={{ fontSize: "16px", color: "#8da2b4", marginTop: "10px" }}>
                Gerencie orçamentos, clientes e automações em um único lugar
              </p>
            </div>

            {/* Features */}
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {[
                { icon: Shield, title: "Seguro", desc: "Dados protegidos com RLS por usuário" },
                { icon: Rocket, title: "Rápido", desc: "Automações em tempo real" },
                { icon: Zap, title: "Poderoso", desc: "Tudo que você precisa no CRM" }
              ].map((feature, i) => (
                <div key={i} style={{ display: "flex", gap: "15px", alignItems: "flex-start" }}>
                  <div style={{
                    width: "50px",
                    height: "50px",
                    background: "rgba(19, 200, 211, 0.1)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid rgba(19, 200, 211, 0.2)"
                  }}>
                    <feature.icon size={24} color="#13c8d3" />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, color: "#eaf3f8" }}>{feature.title}</p>
                    <p style={{ margin: "5px 0 0 0", fontSize: "13px", color: "#8da2b4" }}>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quote */}
            <div style={{
              background: "rgba(19, 200, 211, 0.05)",
              border: "1px solid rgba(19, 200, 211, 0.2)",
              borderRadius: "16px",
              padding: "20px",
              borderLeft: "4px solid #13c8d3"
            }}>
              <p style={{ margin: 0, fontSize: "14px", color: "#13c8d3", fontStyle: "italic" }}>
                "A automação não é sobre fazer menos. É sobre fazer melhor."
              </p>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div style={{
            background: "rgba(6, 34, 53, 0.4)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(19, 200, 211, 0.2)",
            borderRadius: "24px",
            padding: "50px 40px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            maxWidth: "100%"
          }}>
            {/* Form Header */}
            <div style={{ marginBottom: "40px" }}>
              <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#eaf3f8", margin: "0 0 10px 0" }}>
                Bem-vindo
              </h2>
              <p style={{ fontSize: "14px", color: "#8da2b4", margin: 0 }}>
                Digite seu email e senha para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Email Field */}
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  style={{
                    width: "100%",
                    padding: "14px 16px",
                    background: "rgba(6, 34, 53, 0.8)",
                    border: "1px solid rgba(19, 200, 211, 0.3)",
                    borderRadius: "12px",
                    color: "#eaf3f8",
                    fontSize: "14px",
                    fontFamily: "inherit",
                    transition: "all 0.3s ease",
                    boxSizing: "border-box"
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "rgba(19, 200, 211, 0.8)";
                    e.currentTarget.style.background = "rgba(6, 34, 53, 1)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "rgba(19, 200, 211, 0.3)";
                    e.currentTarget.style.background = "rgba(6, 34, 53, 0.8)";
                  }}
                />
              </div>

              {/* Password Field */}
              <div>
                <label style={{ display: "block", fontSize: "12px", color: "#8da2b4", marginBottom: "8px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Senha
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: "100%",
                      padding: "14px 16px",
                      paddingRight: "45px",
                      background: "rgba(6, 34, 53, 0.8)",
                      border: "1px solid rgba(19, 200, 211, 0.3)",
                      borderRadius: "12px",
                      color: "#eaf3f8",
                      fontSize: "14px",
                      fontFamily: "inherit",
                      transition: "all 0.3s ease",
                      boxSizing: "border-box"
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = "rgba(19, 200, 211, 0.8)";
                      e.currentTarget.style.background = "rgba(6, 34, 53, 1)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "rgba(19, 200, 211, 0.3)";
                      e.currentTarget.style.background = "rgba(6, 34, 53, 0.8)";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#8da2b4",
                      cursor: "pointer",
                      padding: "8px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "color 0.2s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#13c8d3")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#8da2b4")}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember & Forgot */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px" }}>
                <label style={{ color: "#8da2b4", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="checkbox" style={{ cursor: "pointer", accentColor: "#13c8d3" }} />
                  Lembrar-me
                </label>
                <a href="#" style={{ color: "#13c8d3", textDecoration: "none", transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#0bd0d7")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#13c8d3")}
                >
                  Esqueceu a senha?
                </a>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: "100%",
                  padding: "14px",
                  background: isLoading
                    ? "rgba(19, 200, 211, 0.5)"
                    : "linear-gradient(135deg, #13c8d3 0%, #0bd0d7 100%)",
                  border: "none",
                  borderRadius: "12px",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  transition: "all 0.3s ease",
                  marginTop: "20px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  boxShadow: "0 10px 30px rgba(19, 200, 211, 0.3)",
                  opacity: isLoading ? 0.7 : 1
                }}
                onMouseEnter={(e) => !isLoading && (e.currentTarget.style.transform = "translateY(-2px)", e.currentTarget.style.boxShadow = "0 15px 40px rgba(19, 200, 211, 0.4)")}
                onMouseLeave={(e) => !isLoading && (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.boxShadow = "0 10px 30px rgba(19, 200, 211, 0.3)")}
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </button>

              {/* Divider */}
              <div style={{ position: "relative", margin: "20px 0" }}>
                <div style={{ borderTop: "1px solid rgba(19, 200, 211, 0.2)" }} />
                <span style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "rgba(6, 34, 53, 0.4)", padding: "0 10px", color: "#8da2b4", fontSize: "12px" }}>
                  OU
                </span>
              </div>

              {/* Google Login */}
              <button
                type="button"
                style={{
                  width: "100%",
                  padding: "14px",
                  background: "rgba(19, 200, 211, 0.1)",
                  border: "1px solid rgba(19, 200, 211, 0.3)",
                  borderRadius: "12px",
                  color: "#13c8d3",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px"
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(19, 200, 211, 0.2)", e.currentTarget.style.borderColor = "rgba(19, 200, 211, 0.5)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(19, 200, 211, 0.1)", e.currentTarget.style.borderColor = "rgba(19, 200, 211, 0.3)")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                </svg>
                Entrar com Google
              </button>
            </form>

            {/* Sign Up Link */}
            <div style={{ textAlign: "center", marginTop: "30px", paddingTop: "20px", borderTop: "1px solid rgba(19, 200, 211, 0.1)" }}>
              <p style={{ color: "#8da2b4", fontSize: "13px", margin: 0 }}>
                Não tem conta?{" "}
                <a href="#" style={{ color: "#13c8d3", textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#0bd0d7")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#13c8d3")}
                >
                  Criar conta
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Version & Build Info */}
      <div style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        fontSize: "12px",
        color: "#8da2b4",
        textAlign: "right",
        zIndex: 10
      }}>
        <div style={{ marginBottom: "4px" }}>
          <span style={{ color: "#13c8d3", fontWeight: 600 }}>v2.0.1</span>
        </div>
        <div>Build #376 • 2026-06-14</div>
        <div style={{ marginTop: "4px", fontSize: "11px", color: "#4a6b7e" }}>
          ✓ Sistema Online
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 20px 40px rgba(19, 200, 211, 0.3); }
          50% { box-shadow: 0 20px 60px rgba(19, 200, 211, 0.5); }
        }
        input::placeholder {
          color: rgba(141, 162, 180, 0.5);
        }
      `}</style>
    </div>
  );
}
