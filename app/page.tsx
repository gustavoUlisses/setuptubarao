"use client";

import { useState, useEffect, useRef } from "react";

const BENEFITS = [
  {
    icon: "⚡",
    title: "Setup completo em minutos",
    desc: "Scripts que instalam e configuram tudo automaticamente. Sem googlar tutorial desatualizado.",
  },
  {
    icon: "🔧",
    title: "Ferramentas de dev curadas",
    desc: "As melhores ferramentas, aliases, configs e atalhos que devs sênior usam todo dia.",
  },
  {
    icon: "🐧",
    title: "WSL, Linux & macOS",
    desc: "Funciona nos três ambientes. Detecta automaticamente e adapta o setup pro seu sistema.",
  },
  {
    icon: "📦",
    title: "Configs prontas",
    desc: "Git, Zsh, Neovim, VS Code, Docker, Node, Python. Tudo configurado e pronto pra produção.",
  },
  {
    icon: "🔄",
    title: "Atualizações vitalícias",
    desc: "Paga uma vez, tem pra sempre. Toda atualização futura chega no seu email.",
  },
  {
    icon: "🇧🇷",
    title: "Feito para devs brasileiros",
    desc: "Documentação em PT-BR. Suporte em PT-BR. Sem desculpa de barreira de idioma.",
  },
];

const TICKER_ITEMS = [
  "SETUP EM MINUTOS",
  "SEM TUTORIAL DESATUALIZADO",
  "CONFIGURAÇÃO AUTOMÁTICA",
  "SUPORTE EM PT-BR",
  "PAGUE UMA VEZ",
  "PARA WSL · LINUX · MACOS",
];

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => nameRef.current?.focus(), 50);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), cpfCnpj: cpfCnpj.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao processar. Tente novamente.");
        return;
      }

      if (data.invoiceUrl) {
        window.location.href = data.invoiceUrl;
      }
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const tickerAll = [...TICKER_ITEMS, ...TICKER_ITEMS];

  return (
    <>
      {/* ── TICKER ── */}
      <div
        style={{
          background: "var(--accent)",
          overflow: "hidden",
          whiteSpace: "nowrap",
          padding: "10px 0",
        }}
      >
        <div className="ticker-track" style={{ display: "inline-flex" }}>
          {tickerAll.map((item, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "#fff",
                padding: "0 32px",
              }}
            >
              {item}{" "}
              <span style={{ opacity: 0.5, marginLeft: "32px" }}>●</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── HEADER ── */}
      <header
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "18px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
        className="animate-fade-in"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🦈</span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 700,
              fontSize: "15px",
              letterSpacing: "0.08em",
              color: "var(--text)",
            }}
          >
            SETUP<span style={{ color: "var(--accent)" }}>TUBARÃO</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="glow-dot" />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "var(--green)",
              letterSpacing: "0.1em",
            }}
          >
            DISPONÍVEL AGORA
          </span>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* ── HERO ── */}
        <section
          style={{
            minHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "80px 24px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background grid */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(rgba(255,77,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,0,0.03) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
              pointerEvents: "none",
            }}
          />
          {/* Glow */}
          <div
            style={{
              position: "absolute",
              top: "30%",
              left: "50%",
              transform: "translate(-50%,-50%)",
              width: "600px",
              height: "600px",
              background:
                "radial-gradient(circle, rgba(255,77,0,0.08) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ position: "relative", maxWidth: "860px", width: "100%" }}>
            <div
              className="animate-fade-up"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "rgba(255,77,0,0.1)",
                border: "1px solid rgba(255,77,0,0.3)",
                borderRadius: "100px",
                padding: "6px 16px",
                marginBottom: "32px",
              }}
            >
              <span style={{ fontSize: "12px" }}>🔥</span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--accent2)",
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                }}
              >
                LANÇAMENTO · OFERTA ESPECIAL
              </span>
            </div>

            <h1
              className="animate-fade-up delay-100"
              style={{
                fontSize: "clamp(42px, 8vw, 88px)",
                fontWeight: 800,
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
                marginBottom: "24px",
                color: "var(--text)",
              }}
            >
              Para de perder tempo{" "}
              <span
                style={{
                  color: "var(--accent)",
                  display: "inline-block",
                  position: "relative",
                }}
              >
                configurando
                <svg
                  style={{
                    position: "absolute",
                    bottom: "-8px",
                    left: 0,
                    width: "100%",
                    height: "8px",
                  }}
                  viewBox="0 0 300 8"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M2 6 C50 2, 150 2, 298 6"
                    stroke="#ff4d00"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.6"
                  />
                </svg>
              </span>{" "}
              ambiente.
            </h1>

            <p
              className="animate-fade-up delay-200"
              style={{
                fontSize: "clamp(16px, 2.5vw, 20px)",
                color: "var(--muted)",
                maxWidth: "560px",
                margin: "0 auto 48px",
                lineHeight: 1.6,
              }}
            >
              Um script, tudo configurado. Dev environment completo em menos de{" "}
              <strong style={{ color: "var(--text)" }}>10 minutos</strong> — do
              zero ao produtivo.
            </p>

            <div
              className="animate-fade-up delay-300"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <button
                onClick={() => setModalOpen(true)}
                className="btn-primary"
                style={{
                  padding: "20px 56px",
                  fontSize: "18px",
                  borderRadius: "8px",
                }}
              >
                Comprar agora — R$27
              </button>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--muted)",
                  letterSpacing: "0.08em",
                }}
              >
                PIX · BOLETO · CARTÃO &nbsp;|&nbsp; ENTREGA IMEDIATA POR EMAIL
              </span>
            </div>
          </div>

          {/* Terminal preview */}
          <div
            className="animate-fade-up delay-500"
            style={{
              marginTop: "72px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              overflow: "hidden",
              maxWidth: "640px",
              width: "100%",
              textAlign: "left",
              boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "var(--surface2)",
              }}
            >
              {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: c,
                  }}
                />
              ))}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--muted)",
                  marginLeft: "8px",
                }}
              >
                terminal
              </span>
            </div>
            <div
              style={{
                padding: "20px 24px",
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                lineHeight: 1.8,
              }}
            >
              {[
                { cmd: "$ bash setup.sh", color: "var(--text)" },
                { cmd: "✓ Instalando Zsh + Oh My Zsh...", color: "var(--green)" },
                { cmd: "✓ Configurando Git global...", color: "var(--green)" },
                { cmd: "✓ Instalando Node.js (nvm)...", color: "var(--green)" },
                { cmd: "✓ Docker Desktop configurado...", color: "var(--green)" },
                { cmd: "✓ VS Code + extensões instaladas...", color: "var(--green)" },
                { cmd: "🦈 Setup concluído em 8min 32s", color: "var(--accent2)" },
              ].map((line, i) => (
                <div key={i} style={{ color: line.color }}>
                  {line.cmd}
                </div>
              ))}
              <div style={{ color: "var(--accent)", marginTop: "4px" }}>
                ${" "}
                <span
                  style={{
                    animation: "blink 1s step-end infinite",
                    color: "var(--text)",
                  }}
                >
                  █
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── SOCIAL PROOF BAR ── */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            padding: "24px",
            display: "flex",
            justifyContent: "center",
            gap: "clamp(24px, 5vw, 80px)",
            flexWrap: "wrap",
          }}
        >
          {[
            { num: "10min", label: "pra ficar produtivo" },
            { num: "6+", label: "ambientes suportados" },
            { num: "∞", label: "atualizações inclusas" },
            { num: "R$27", label: "pagamento único" },
          ].map(({ num, label }) => (
            <div key={num} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "clamp(22px, 4vw, 32px)",
                  fontWeight: 700,
                  color: "var(--accent)",
                  letterSpacing: "-0.02em",
                }}
              >
                {num}
              </div>
              <div
                style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* ── BENEFITS ── */}
        <section
          style={{ padding: "96px 24px", maxWidth: "1100px", margin: "0 auto" }}
        >
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span className="accent-line" />
            <h2
              style={{
                fontSize: "clamp(28px, 5vw, 48px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
              }}
            >
              O que vem no .zip
            </h2>
            <p
              style={{ color: "var(--muted)", marginTop: "16px", fontSize: "16px" }}
            >
              Tudo que você precisa, pronto pra usar.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: "16px",
            }}
          >
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className="card"
                style={{
                  padding: "28px",
                  borderRadius: "12px",
                  transition: "border-color 0.2s, transform 0.2s",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "rgba(255,77,0,0.4)";
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(-4px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor =
                    "var(--border)";
                  (e.currentTarget as HTMLDivElement).style.transform =
                    "translateY(0)";
                }}
              >
                <div style={{ fontSize: "28px", marginBottom: "16px" }}>
                  {b.icon}
                </div>
                <h3
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    marginBottom: "8px",
                    color: "var(--text)",
                  }}
                >
                  {b.title}
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "var(--muted)",
                    lineHeight: 1.6,
                  }}
                >
                  {b.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── GUARANTEE ── */}
        <section
          style={{
            padding: "80px 24px",
            borderTop: "1px solid var(--border)",
          }}
        >
          <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "24px" }}>🛡️</div>
            <h2
              style={{
                fontSize: "clamp(24px, 4vw, 36px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: "16px",
              }}
            >
              Garantia de 7 dias
            </h2>
            <p style={{ color: "var(--muted)", fontSize: "16px", lineHeight: 1.7 }}>
              Se por qualquer motivo o setup não funcionar pra você, manda um email
              em até{" "}
              <strong style={{ color: "var(--text)" }}>7 dias</strong> e devolvemos
              100% do valor. Sem burocracia, sem pergunta, sem enrolação.
            </p>
            <div
              style={{
                marginTop: "40px",
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: "rgba(0,230,118,0.08)",
                border: "1px solid rgba(0,230,118,0.2)",
                borderRadius: "100px",
                padding: "10px 20px",
              }}
            >
              <span className="glow-dot" />
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: "var(--green)",
                  letterSpacing: "0.08em",
                }}
              >
                RISCO ZERO GARANTIDO
              </span>
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section
          style={{
            padding: "96px 24px",
            textAlign: "center",
            borderTop: "1px solid var(--border)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse at center, rgba(255,77,0,0.06) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <h2
              style={{
                fontSize: "clamp(28px, 5vw, 52px)",
                fontWeight: 800,
                letterSpacing: "-0.02em",
                marginBottom: "16px",
                lineHeight: 1.1,
              }}
            >
              Pronto pra parar de perder tempo?
            </h2>
            <p
              style={{
                color: "var(--muted)",
                fontSize: "16px",
                marginBottom: "40px",
              }}
            >
              Um investimento de R$27 que você recupera na primeira hora
              economizada.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className="btn-primary"
              style={{ padding: "22px 64px", fontSize: "20px", borderRadius: "8px" }}
            >
              Comprar agora — R$27
            </button>
            <p
              style={{
                marginTop: "16px",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                color: "var(--muted)",
                letterSpacing: "0.08em",
              }}
            >
              PIX · BOLETO · CARTÃO &nbsp;|&nbsp; DOWNLOAD IMEDIATO POR EMAIL
            </p>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer
        style={{
          borderTop: "1px solid var(--border)",
          padding: "24px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--muted)",
          }}
        >
          🦈 SetupTubarão © {new Date().getFullYear()}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "12px",
            color: "var(--muted)",
          }}
        >
          Dúvidas? contato@setuptubarao.com.br
        </span>
      </footer>

      {/* ── MODAL ── */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setModalOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(8px)",
            }}
            className="animate-fade-in"
          />

          {/* Modal card */}
          <div
            className="animate-fade-up card"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "440px",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 40px 100px rgba(0,0,0,0.8)",
            }}
          >
            <div style={{ height: "4px", background: "var(--accent)" }} />

            <div style={{ padding: "32px" }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  color: "var(--muted)",
                  width: "32px",
                  height: "32px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>

              <div style={{ marginBottom: "24px" }}>
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    marginBottom: "6px",
                  }}
                >
                  Finalizar compra
                </h2>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{ color: "var(--muted)", fontSize: "14px" }}>
                    SetupTubarão — Licença completa
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontWeight: 700,
                      color: "var(--accent)",
                      fontSize: "18px",
                    }}
                  >
                    R$27
                  </span>
                </div>
              </div>

              <form
                onSubmit={handleCheckout}
                style={{ display: "flex", flexDirection: "column", gap: "16px" }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "var(--muted)",
                      marginBottom: "8px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    NOME COMPLETO
                  </label>
                  <input
                    ref={nameRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Seu nome"
                    required
                    minLength={2}
                    maxLength={100}
                    autoComplete="name"
                    className="input-field"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontSize: "15px",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "var(--muted)",
                      marginBottom: "8px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    EMAIL
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    maxLength={254}
                    autoComplete="email"
                    className="input-field"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontSize: "15px",
                    }}
                  />
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--muted)",
                      marginTop: "6px",
                    }}
                  >
                    O link de download será enviado para este email.
                  </p>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "var(--muted)",
                      marginBottom: "8px",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    placeholder="000.000.000-00"
                    required
                    minLength={11}
                    maxLength={18}
                    autoComplete="off"
                    className="input-field"
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontSize: "15px",
                    }}
                  />
                </div>

                {error && (
                  <div
                    style={{
                      background: "rgba(255,77,0,0.1)",
                      border: "1px solid rgba(255,77,0,0.3)",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      fontSize: "14px",
                      color: "var(--accent2)",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{
                    padding: "16px",
                    fontSize: "16px",
                    borderRadius: "8px",
                    marginTop: "4px",
                  }}
                >
                  {loading ? "Gerando cobrança..." : "Pagar R$27 agora →"}
                </button>
              </form>

              <div
                style={{
                  marginTop: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "16px",
                  flexWrap: "wrap",
                }}
              >
                {[
                  "🔒 Pagamento seguro",
                  "📦 Download imediato",
                  "🛡️ Garantia 7 dias",
                ].map((item) => (
                  <span
                    key={item}
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "var(--muted)",
                      letterSpacing: "0.06em",
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
