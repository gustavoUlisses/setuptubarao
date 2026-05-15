import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendDownloadEmail(
  email: string,
  downloadUrl: string
): Promise<void> {
  const from = process.env.EMAIL_FROM ?? "onboarding@resend.dev";
  const productName = "SetupTubarão";

  await resend.emails.send({
    from,
    to: email,
    subject: `Seu download está pronto — ${productName}`,
    html: `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seu download está pronto</title>
</head>
<body style="margin:0;padding:0;background:#0f0f0f;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border-radius:12px;overflow:hidden;border:1px solid #2a2a2a;">
          <tr>
            <td style="background:#ff6b00;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;">🎉 Compra confirmada!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <p style="color:#e0e0e0;font-size:16px;line-height:1.6;margin:0 0 24px;">
                Obrigado pela sua compra! Seu acesso ao <strong style="color:#ff6b00;">${productName}</strong> está pronto para download.
              </p>
              <p style="color:#a0a0a0;font-size:14px;line-height:1.6;margin:0 0 32px;">
                ⚠️ Este link é <strong>único e pessoal</strong>. Expira em <strong>24 horas</strong> e só pode ser usado <strong>uma vez</strong>.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${downloadUrl}"
                   style="display:inline-block;background:#ff6b00;color:#fff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:18px;font-weight:700;letter-spacing:0.5px;">
                  ⬇️ Baixar agora
                </a>
              </div>
              <p style="color:#666;font-size:12px;line-height:1.6;margin:32px 0 0;text-align:center;">
                Se o botão não funcionar, copie e cole este link no navegador:<br>
                <span style="color:#ff6b00;word-break:break-all;">${downloadUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px;border-top:1px solid #2a2a2a;text-align:center;">
              <p style="color:#555;font-size:12px;margin:0;">
                Problemas? Responda este email que te ajudamos.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  });
}
