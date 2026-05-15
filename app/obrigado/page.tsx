export default function Obrigado() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div style={{ maxWidth: "480px" }}>
        <div style={{ fontSize: "64px", marginBottom: "24px" }}>🦈</div>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 800,
            letterSpacing: "-0.02em",
            marginBottom: "16px",
            color: "var(--text)",
          }}
        >
          Compra realizada!
        </h1>
        <p
          style={{
            color: "var(--muted)",
            fontSize: "16px",
            lineHeight: 1.7,
            marginBottom: "32px",
          }}
        >
          Assim que o pagamento for confirmado, você receberá um email com o
          link de download. Verifique também sua caixa de spam.
        </p>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "20px 24px",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--muted)",
            lineHeight: 1.8,
            textAlign: "left",
          }}
        >
          <div style={{ color: "var(--green)" }}>✓ Pedido recebido</div>
          <div style={{ color: "var(--muted)" }}>⏳ Aguardando confirmação do pagamento</div>
          <div style={{ color: "var(--muted)" }}>📧 Email com download será enviado</div>
        </div>
        <p
          style={{
            marginTop: "24px",
            fontSize: "13px",
            color: "var(--muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          Pix e cartão: confirmação imediata. Boleto: até 3 dias úteis.
        </p>
      </div>
    </div>
  );
}
