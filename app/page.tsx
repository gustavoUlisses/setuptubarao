"use client";

import { useState, useEffect, useRef } from "react";

const BENEFITS = [
  { icon: "⚡", title: "Setup completo em minutos", desc: "Scripts que instalam e configuram tudo automaticamente. Sem googlar tutorial desatualizado." },
  { icon: "🔧", title: "Ferramentas de dev curadas", desc: "As melhores ferramentas, aliases, configs e atalhos que devs sênior usam todo dia." },
  { icon: "🐧", title: "WSL, Linux & macOS", desc: "Funciona nos três ambientes. Detecta automaticamente e adapta o setup pro seu sistema." },
  { icon: "📦", title: "Configs prontas", desc: "Git, Zsh, Neovim, VS Code, Docker, Node, Python. Tudo configurado e pronto pra produção." },
  { icon: "🔄", title: "Atualizações vitalícias", desc: "Paga uma vez, tem pra sempre. Toda atualização futura chega no seu email." },
  { icon: "🇧🇷", title: "Feito para devs brasileiros", desc: "Documentação em PT-BR. Suporte em PT-BR. Sem desculpa de barreira de idioma." },
];

const TICKER_ITEMS = ["SETUP EM MINUTOS", "SEM TUTORIAL DESATUALIZADO", "CONFIGURAÇÃO AUTOMÁTICA", "SUPORTE EM PT-BR", "PAGUE UMA VEZ", "PARA WSL · LINUX · MACOS"];

type Step = "form" | "pix" | "card-form" | "card-holder" | "card-processing" | "paid";
type PayMethod = "PIX" | "CARD";

interface QrCode { encodedImage: string; payload: string; expirationDate: string; }

function fmt(val: string, type: "cpf" | "phone" | "cep" | "card" | "expiry") {
  const d = val.replace(/\D/g, "");
  if (type === "cpf") return d.length <= 11 ? d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, e) => [a, b, c].filter(Boolean).join(".") + (e ? "-" + e : "")) : d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, a, b, c, e, f) => [a, b, c, e].filter(Boolean).join(".") + (f ? "/" + f.padEnd(4, "") : "")).replace(/\.(\d{4})\//, ".$1/");
  if (type === "phone") return d.replace(/(\d{2})(\d{4,5})(\d{0,4})/, (_, a, b, c) => `(${a}) ${b}${c ? "-" + c : ""}`);
  if (type === "cep") return d.replace(/(\d{5})(\d{0,3})/, (_, a, b) => a + (b ? "-" + b : ""));
  if (type === "card") return d.replace(/(\d{4})/g, "$1 ").trim().slice(0, 19);
  if (type === "expiry") return d.replace(/(\d{2})(\d{0,2})/, (_, a, b) => a + (b ? "/" + b : ""));
  return val;
}

export default function Home() {
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [payMethod, setPayMethod] = useState<PayMethod>("PIX");

  // Dados pessoais
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Pix
  const [qrCode, setQrCode] = useState<QrCode | null>(null);
  const [copied, setCopied] = useState(false);

  // Cartão
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [ccv, setCcv] = useState("");

  const [paymentId, setPaymentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (modalOpen) { setTimeout(() => nameRef.current?.focus(), 50); document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; stopPolling(); }
    return () => { document.body.style.overflow = ""; stopPolling(); };
  }, [modalOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && step === "form") setModalOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  function stopPolling() { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } }

  function startPolling(pid: string) {
    stopPolling();
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/status/${pid}`);
        const data = await res.json();
        if (data.paid) { stopPolling(); setStep("paid"); }
      } catch { /* ignora erros de rede */ }
    }, 4000);
  }

  function openModal() {
    setStep("form"); setError(""); setQrCode(null); setPaymentId("");
    setCpfCnpj(""); setPhone(""); setPostalCode(""); setAddressNumber("");
    setCardHolder(""); setCardNumber(""); setExpiry(""); setCcv("");
    setModalOpen(true);
  }

  async function handlePix() {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: "PIX", name: name.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erro ao processar."); return; }
      setPaymentId(data.paymentId);
      setQrCode(data.qrCode);
      setStep("pix");
      startPolling(data.paymentId);
    } catch { setError("Erro de conexão. Tente novamente."); }
    finally { setLoading(false); }
  }

  async function handleCardSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const [expiryMonth, expiryYear] = expiry.split("/");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method: "CARD",
          name: name.trim(), email: email.trim(),
          cpfCnpj: cpfCnpj.replace(/\D/g, ""),
          phone: phone.replace(/\D/g, ""),
          postalCode: postalCode.replace(/\D/g, ""),
          addressNumber: addressNumber.trim(),
          cardHolder: cardHolder.trim(),
          cardNumber: cardNumber.replace(/\D/g, ""),
          expiryMonth: expiryMonth?.trim(),
          expiryYear: expiryYear ? "20" + expiryYear.trim() : "",
          ccv: ccv.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Pagamento recusado. Verifique os dados."); return; }
      setPaymentId(data.paymentId);
      setStep("card-processing");
      startPolling(data.paymentId);
    } catch { setError("Erro de conexão. Tente novamente."); }
    finally { setLoading(false); }
  }

  function copyPix() {
    if (qrCode?.payload) { navigator.clipboard.writeText(qrCode.payload); setCopied(true); setTimeout(() => setCopied(false), 2500); }
  }

  const tickerAll = [...TICKER_ITEMS, ...TICKER_ITEMS];

  const labelStyle = { display: "block" as const, fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "var(--muted)", marginBottom: "6px", fontFamily: "var(--font-mono)" };
  const inputStyle = { width: "100%", padding: "11px 14px", borderRadius: "8px", fontSize: "14px" };
  const rowStyle = { display: "grid" as const, gridTemplateColumns: "1fr 1fr", gap: "12px" };

  return (
    <>
      {/* TICKER */}
      <div style={{ background: "var(--accent)", overflow: "hidden", whiteSpace: "nowrap", padding: "10px 0" }}>
        <div className="ticker-track" style={{ display: "inline-flex" }}>
          {tickerAll.map((item, i) => (
            <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, letterSpacing: "0.15em", color: "#fff", padding: "0 32px" }}>
              {item} <span style={{ opacity: 0.5, marginLeft: "32px" }}>●</span>
            </span>
          ))}
        </div>
      </div>

      {/* HEADER */}
      <header style={{ borderBottom: "1px solid var(--border)", padding: "18px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }} className="animate-fade-in">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px" }}>🦈</span>
          <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: "15px", letterSpacing: "0.08em" }}>
            SETUP<span style={{ color: "var(--accent)" }}>TUBARÃO</span>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="glow-dot" />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--green)", letterSpacing: "0.1em" }}>DISPONÍVEL AGORA</span>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {/* HERO */}
        <section style={{ minHeight: "90vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "80px 24px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,77,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,77,0,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "30%", left: "50%", transform: "translate(-50%,-50%)", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(255,77,0,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", maxWidth: "860px", width: "100%" }}>
            <div className="animate-fade-up" style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,77,0,0.1)", border: "1px solid rgba(255,77,0,0.3)", borderRadius: "100px", padding: "6px 16px", marginBottom: "32px" }}>
              <span style={{ fontSize: "12px" }}>🔥</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--accent2)", letterSpacing: "0.12em", fontWeight: 700 }}>LANÇAMENTO · OFERTA ESPECIAL</span>
            </div>
            <h1 className="animate-fade-up delay-100" style={{ fontSize: "clamp(42px, 8vw, 88px)", fontWeight: 800, lineHeight: 1.0, letterSpacing: "-0.03em", marginBottom: "24px" }}>
              Para de perder tempo{" "}
              <span style={{ color: "var(--accent)", display: "inline-block", position: "relative" }}>
                configurando
                <svg style={{ position: "absolute", bottom: "-8px", left: 0, width: "100%", height: "8px" }} viewBox="0 0 300 8" fill="none" preserveAspectRatio="none">
                  <path d="M2 6 C50 2, 150 2, 298 6" stroke="#ff4d00" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.6" />
                </svg>
              </span>{" "}ambiente.
            </h1>
            <p className="animate-fade-up delay-200" style={{ fontSize: "clamp(16px, 2.5vw, 20px)", color: "var(--muted)", maxWidth: "560px", margin: "0 auto 48px", lineHeight: 1.6 }}>
              Um script, tudo configurado. Dev environment completo em menos de <strong style={{ color: "var(--text)" }}>10 minutos</strong> — do zero ao produtivo.
            </p>
            <div className="animate-fade-up delay-300" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
              <button onClick={openModal} className="btn-primary" style={{ padding: "20px 56px", fontSize: "18px", borderRadius: "8px" }}>Comprar agora — R$27</button>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.08em" }}>PIX · CARTÃO DE CRÉDITO/DÉBITO &nbsp;|&nbsp; ENTREGA IMEDIATA POR EMAIL</span>
            </div>
          </div>
          <div className="animate-fade-up delay-500" style={{ marginTop: "72px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", overflow: "hidden", maxWidth: "640px", width: "100%", textAlign: "left", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}>
            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "8px", background: "var(--surface2)" }}>
              {["#ff5f57", "#febc2e", "#28c840"].map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", marginLeft: "8px" }}>terminal</span>
            </div>
            <div style={{ padding: "20px 24px", fontFamily: "var(--font-mono)", fontSize: "13px", lineHeight: 1.8 }}>
              {[{ cmd: "$ bash setup.sh", color: "var(--text)" }, { cmd: "✓ Instalando Zsh + Oh My Zsh...", color: "var(--green)" }, { cmd: "✓ Configurando Git global...", color: "var(--green)" }, { cmd: "✓ Instalando Node.js (nvm)...", color: "var(--green)" }, { cmd: "✓ Docker Desktop configurado...", color: "var(--green)" }, { cmd: "✓ VS Code + extensões instaladas...", color: "var(--green)" }, { cmd: "🦈 Setup concluído em 8min 32s", color: "var(--accent2)" }].map((l, i) => <div key={i} style={{ color: l.color }}>{l.cmd}</div>)}
              <div style={{ color: "var(--accent)", marginTop: "4px" }}>$ <span style={{ animation: "blink 1s step-end infinite", color: "var(--text)" }}>█</span></div>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "24px", display: "flex", justifyContent: "center", gap: "clamp(24px,5vw,80px)", flexWrap: "wrap" }}>
          {[{ num: "10min", label: "pra ficar produtivo" }, { num: "6+", label: "ambientes suportados" }, { num: "∞", label: "atualizações inclusas" }, { num: "R$27", label: "pagamento único" }].map(({ num, label }) => (
            <div key={num} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "clamp(22px,4vw,32px)", fontWeight: 700, color: "var(--accent)" }}>{num}</div>
              <div style={{ fontSize: "13px", color: "var(--muted)", marginTop: "4px" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* BENEFITS */}
        <section style={{ padding: "96px 24px", maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <span className="accent-line" />
            <h2 style={{ fontSize: "clamp(28px,5vw,48px)", fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1 }}>O que vem no .zip</h2>
            <p style={{ color: "var(--muted)", marginTop: "16px", fontSize: "16px" }}>Tudo que você precisa, pronto pra usar.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
            {BENEFITS.map((b, i) => (
              <div key={i} className="card" style={{ padding: "28px", borderRadius: "12px", transition: "border-color 0.2s, transform 0.2s", cursor: "default" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,77,0,0.4)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
                <div style={{ fontSize: "28px", marginBottom: "16px" }}>{b.icon}</div>
                <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>{b.title}</h3>
                <p style={{ fontSize: "14px", color: "var(--muted)", lineHeight: 1.6 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* GUARANTEE */}
        <section style={{ padding: "80px 24px", borderTop: "1px solid var(--border)" }}>
          <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: "56px", marginBottom: "24px" }}>🛡️</div>
            <h2 style={{ fontSize: "clamp(24px,4vw,36px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "16px" }}>Garantia de 7 dias</h2>
            <p style={{ color: "var(--muted)", fontSize: "16px", lineHeight: 1.7 }}>Se por qualquer motivo o setup não funcionar pra você, manda um email em até <strong style={{ color: "var(--text)" }}>7 dias</strong> e devolvemos 100% do valor. Sem burocracia, sem pergunta.</p>
            <div style={{ marginTop: "40px", display: "inline-flex", alignItems: "center", gap: "12px", background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)", borderRadius: "100px", padding: "10px 20px" }}>
              <span className="glow-dot" />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--green)", letterSpacing: "0.08em" }}>RISCO ZERO GARANTIDO</span>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: "96px 24px", textAlign: "center", borderTop: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, rgba(255,77,0,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative" }}>
            <h2 style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "16px", lineHeight: 1.1 }}>Pronto pra parar de perder tempo?</h2>
            <p style={{ color: "var(--muted)", fontSize: "16px", marginBottom: "40px" }}>Um investimento de R$27 que você recupera na primeira hora economizada.</p>
            <button onClick={openModal} className="btn-primary" style={{ padding: "22px 64px", fontSize: "20px", borderRadius: "8px" }}>Comprar agora — R$27</button>
            <p style={{ marginTop: "16px", fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--muted)", letterSpacing: "0.08em" }}>PIX · CARTÃO &nbsp;|&nbsp; DOWNLOAD IMEDIATO POR EMAIL</p>
          </div>
        </section>
      </main>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)" }}>🦈 SetupTubarão © {new Date().getFullYear()}</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)" }}>Dúvidas? contato@setuptubarao.com.br</span>
      </footer>

      {/* MODAL */}
      {modalOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div onClick={() => { if (step === "form") setModalOpen(false); }} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }} className="animate-fade-in" />

          <div className="animate-fade-up card" style={{ position: "relative", width: "100%", maxWidth: "440px", maxHeight: "90vh", overflowY: "auto", borderRadius: "16px", overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,0.8)" }}>
            <div style={{ height: "4px", background: "var(--accent)", flexShrink: 0 }} />
            <div style={{ padding: "28px 32px" }}>

              {/* STEP: FORM INICIAL */}
              {step === "form" && (
                <>
                  <button onClick={() => setModalOpen(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", width: "32px", height: "32px", borderRadius: "6px", cursor: "pointer", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "4px" }}>Finalizar compra</h2>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
                    <span style={{ color: "var(--muted)", fontSize: "13px" }}>SetupTubarão — Licença completa</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--accent)", fontSize: "18px" }}>R$27</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={labelStyle}>NOME COMPLETO</label>
                      <input ref={nameRef} type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" required minLength={2} maxLength={100} autoComplete="name" className="input-field" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>EMAIL</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required maxLength={254} autoComplete="email" className="input-field" style={inputStyle} />
                      <p style={{ fontSize: "11px", color: "var(--muted)", marginTop: "5px" }}>O link de download será enviado para este email.</p>
                    </div>
                  </div>

                  {error && <div style={{ marginTop: "12px", background: "rgba(255,77,0,0.1)", border: "1px solid rgba(255,77,0,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "var(--accent2)" }}>{error}</div>}

                  {/* Seletor de método */}
                  <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    {(["PIX", "CARD"] as PayMethod[]).map((m) => (
                      <button key={m} onClick={() => setPayMethod(m)} style={{ padding: "12px", borderRadius: "8px", border: `2px solid ${payMethod === m ? "var(--accent)" : "var(--border)"}`, background: payMethod === m ? "rgba(255,77,0,0.08)" : "var(--surface2)", color: payMethod === m ? "var(--text)" : "var(--muted)", cursor: "pointer", fontWeight: 700, fontSize: "13px", transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                        {m === "PIX" ? <><span>⚡</span> Pix</> : <><span>💳</span> Cartão</>}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={loading || !name.trim() || !email.trim()}
                    onClick={() => {
                      if (!name.trim() || name.trim().length < 2) { setError("Preencha seu nome completo."); return; }
                      if (!email.trim() || !email.includes("@")) { setError("Preencha um email válido."); return; }
                      setError("");
                      if (payMethod === "PIX") handlePix();
                      else setStep("card-form");
                    }}
                    className="btn-primary"
                    style={{ width: "100%", padding: "15px", fontSize: "15px", borderRadius: "8px", marginTop: "14px" }}
                  >
                    {loading ? "Gerando..." : payMethod === "PIX" ? "Gerar QR Code Pix →" : "Preencher dados do cartão →"}
                  </button>

                  <div style={{ marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
                    {["🔒 Pagamento seguro", "📦 Download imediato", "🛡️ Garantia 7 dias"].map((item) => (
                      <span key={item} style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.06em" }}>{item}</span>
                    ))}
                  </div>
                </>
              )}

              {/* STEP: CARTÃO — ETAPA 1: DADOS DO CARTÃO */}
              {step === "card-form" && (
                <>
                  <button onClick={() => { setStep("form"); setError(""); }} style={{ position: "absolute", top: "16px", left: "16px", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-mono)" }}>← voltar</button>
                  <div style={{ textAlign: "center", marginBottom: "20px", marginTop: "8px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "4px" }}>Dados do cartão</h2>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em" }}>ETAPA 1 DE 2</span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={labelStyle}>NÚMERO DO CARTÃO</label>
                      <input type="text" inputMode="numeric" value={cardNumber} onChange={(e) => setCardNumber(fmt(e.target.value, "card"))} placeholder="0000 0000 0000 0000" maxLength={19} autoComplete="cc-number" className="input-field" style={{ ...inputStyle, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }} />
                    </div>
                    <div style={rowStyle}>
                      <div>
                        <label style={labelStyle}>VALIDADE</label>
                        <input type="text" inputMode="numeric" value={expiry} onChange={(e) => setExpiry(fmt(e.target.value, "expiry"))} placeholder="MM/AA" maxLength={5} autoComplete="cc-exp" className="input-field" style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
                      </div>
                      <div>
                        <label style={labelStyle}>CVV</label>
                        <input type="text" inputMode="numeric" value={ccv} onChange={(e) => setCcv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="123" maxLength={4} autoComplete="cc-csc" className="input-field" style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>NOME NO CARTÃO</label>
                      <input type="text" value={cardHolder} onChange={(e) => setCardHolder(e.target.value.toUpperCase())} placeholder="COMO IMPRESSO NO CARTÃO" maxLength={100} autoComplete="cc-name" className="input-field" style={{ ...inputStyle, textTransform: "uppercase", letterSpacing: "0.04em" }} />
                    </div>
                  </div>

                  {error && <div style={{ marginTop: "12px", background: "rgba(255,77,0,0.1)", border: "1px solid rgba(255,77,0,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "var(--accent2)" }}>{error}</div>}

                  <button
                    onClick={() => {
                      const digits = cardNumber.replace(/\D/g, "");
                      if (digits.length < 13) { setError("Número do cartão inválido."); return; }
                      if (!expiry.match(/^\d{2}\/\d{2}$/)) { setError("Validade inválida. Use MM/AA."); return; }
                      if (ccv.length < 3) { setError("CVV inválido."); return; }
                      if (cardHolder.trim().length < 2) { setError("Informe o nome impresso no cartão."); return; }
                      setError("");
                      setStep("card-holder");
                    }}
                    className="btn-primary"
                    style={{ width: "100%", padding: "15px", fontSize: "15px", borderRadius: "8px", marginTop: "14px" }}
                  >
                    Continuar →
                  </button>
                  <p style={{ marginTop: "12px", fontSize: "11px", color: "var(--muted)", textAlign: "center", fontFamily: "var(--font-mono)" }}>🔒 Dados transmitidos com criptografia SSL</p>
                </>
              )}

              {/* STEP: CARTÃO — ETAPA 2: DADOS DO TITULAR */}
              {step === "card-holder" && (
                <>
                  <button onClick={() => { setStep("card-form"); setError(""); }} style={{ position: "absolute", top: "16px", left: "16px", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontFamily: "var(--font-mono)" }}>← voltar</button>
                  <div style={{ textAlign: "center", marginBottom: "20px", marginTop: "8px" }}>
                    <h2 style={{ fontSize: "18px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "4px" }}>Dados do titular</h2>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--muted)", letterSpacing: "0.1em" }}>ETAPA 2 DE 2 — NECESSÁRIOS PARA ANTIFRAUDE</span>
                  </div>

                  <form onSubmit={handleCardSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={labelStyle}>CPF / CNPJ</label>
                      <input type="text" inputMode="numeric" value={cpfCnpj} onChange={(e) => setCpfCnpj(fmt(e.target.value, "cpf"))} placeholder="000.000.000-00" required autoComplete="off" className="input-field" style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
                    </div>
                    <div style={rowStyle}>
                      <div>
                        <label style={labelStyle}>TELEFONE</label>
                        <input type="text" inputMode="numeric" value={phone} onChange={(e) => setPhone(fmt(e.target.value, "phone"))} placeholder="(11) 99999-9999" required className="input-field" style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
                      </div>
                      <div>
                        <label style={labelStyle}>CEP</label>
                        <input type="text" inputMode="numeric" value={postalCode} onChange={(e) => setPostalCode(fmt(e.target.value, "cep"))} placeholder="00000-000" required className="input-field" style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Nº DO ENDEREÇO</label>
                      <input type="text" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} placeholder="123" required maxLength={20} className="input-field" style={{ ...inputStyle, fontFamily: "var(--font-mono)" }} />
                    </div>

                    {error && <div style={{ background: "rgba(255,77,0,0.1)", border: "1px solid rgba(255,77,0,0.3)", borderRadius: "8px", padding: "10px 14px", fontSize: "13px", color: "var(--accent2)" }}>{error}</div>}

                    <button type="submit" disabled={loading} className="btn-primary" style={{ padding: "15px", fontSize: "15px", borderRadius: "8px", marginTop: "4px" }}>
                      {loading ? "Processando pagamento..." : "💳 Pagar R$27 agora"}
                    </button>
                    <p style={{ fontSize: "11px", color: "var(--muted)", textAlign: "center", fontFamily: "var(--font-mono)" }}>🔒 Dados transmitidos com criptografia SSL</p>
                  </form>
                </>
              )}

              {/* STEP: PIX QR CODE */}
              {step === "pix" && qrCode && (
                <div style={{ textAlign: "center" }}>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "16px" }}>⚡ Pague via Pix</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", marginBottom: "16px" }}>
                    <span className="glow-dot" />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--green)", letterSpacing: "0.08em" }}>AGUARDANDO PAGAMENTO...</span>
                  </div>
                  <div style={{ background: "#fff", borderRadius: "12px", padding: "16px", display: "inline-block", marginBottom: "16px" }}>
                    <img src={`data:image/png;base64,${qrCode.encodedImage}`} alt="QR Code Pix" style={{ width: "200px", height: "200px", display: "block" }} />
                  </div>
                  <p style={{ color: "var(--muted)", fontSize: "13px", marginBottom: "12px" }}>Escaneie o QR code ou copie o código abaixo</p>
                  <button onClick={copyPix} style={{ width: "100%", padding: "12px 16px", borderRadius: "8px", background: copied ? "rgba(0,230,118,0.1)" : "var(--surface2)", border: `1px solid ${copied ? "rgba(0,230,118,0.4)" : "var(--border)"}`, color: copied ? "var(--green)" : "var(--text)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: "13px", fontWeight: 700, transition: "all 0.2s" }}>
                    {copied ? "✓ COPIADO!" : "COPIAR CÓDIGO PIX"}
                  </button>
                  <p style={{ marginTop: "16px", fontSize: "11px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>Esta tela atualiza automaticamente após o pagamento.</p>
                </div>
              )}

              {/* STEP: CARTÃO PROCESSANDO */}
              {step === "card-processing" && (
                <div style={{ textAlign: "center", padding: "16px 0" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>💳</div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "12px" }}>Processando pagamento...</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center", marginBottom: "16px" }}>
                    <span className="glow-dot" />
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--green)", letterSpacing: "0.08em" }}>AGUARDANDO CONFIRMAÇÃO...</span>
                  </div>
                  <p style={{ fontSize: "13px", color: "var(--muted)", fontFamily: "var(--font-mono)" }}>Esta tela atualiza automaticamente.</p>
                </div>
              )}

              {/* STEP: PAGO */}
              {step === "paid" && (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "56px", marginBottom: "16px" }}>🎉</div>
                  <h2 style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "-0.02em", marginBottom: "12px", color: "var(--green)" }}>Pagamento confirmado!</h2>
                  <p style={{ color: "var(--muted)", fontSize: "14px", lineHeight: 1.7, marginBottom: "20px" }}>
                    O link de download foi enviado para<br /><strong style={{ color: "var(--text)" }}>{email}</strong>
                  </p>
                  <div style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.2)", borderRadius: "12px", padding: "16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--muted)", lineHeight: 1.8, textAlign: "left" }}>
                    <div style={{ color: "var(--green)" }}>✓ Pagamento recebido</div>
                    <div style={{ color: "var(--green)" }}>✓ Email enviado com link de download</div>
                    <div>📦 Link válido por 24 horas</div>
                  </div>
                  <p style={{ marginTop: "12px", fontSize: "11px", color: "var(--muted)" }}>Verifique também sua caixa de spam.</p>
                  <button onClick={() => setModalOpen(false)} className="btn-primary" style={{ marginTop: "20px", padding: "12px 32px", fontSize: "14px", borderRadius: "8px" }}>Fechar</button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </>
  );
}
