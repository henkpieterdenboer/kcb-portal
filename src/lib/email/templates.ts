function emailLayout(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f9fafb;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f9fafb;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;border:1px solid #e5e7eb;">
          <tr>
            <td style="padding:32px 40px 0;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111827;">KCB Portal</h1>
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0;">
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 32px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px;background-color:#f9fafb;border-top:1px solid #e5e7eb;border-radius:0 0 8px 8px;">
              <p style="margin:0;font-size:12px;color:#6b7280;">This is an automated message from the KCB Portal.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailButton(url: string, label: string): string {
  return `
<!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="14%" strokecolor="#2563eb" fillcolor="#2563eb">
  <w:anchorlock/>
  <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;">${label}</center>
</v:roundrect>
<![endif]-->
<!--[if !mso]><!-->
<a href="${url}" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 32px;border-radius:6px;text-align:center;">${label}</a>
<!--<![endif]-->`;
}

export function activationEmailTemplate(name: string, url: string): string {
  return emailLayout(`
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#111827;">Welcome, ${name}!</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
      An account has been created for you on the KCB Portal. Please set your password by clicking the button below.
    </p>
    <p style="margin:0 0 24px;text-align:center;">
      ${emailButton(url, "Set your password")}
    </p>
    <p style="margin:0;font-size:12px;color:#6b7280;">
      This link expires in 24 hours. If you did not expect this email, you can safely ignore it.
    </p>
  `);
}

export function resetPasswordEmailTemplate(name: string, url: string): string {
  return emailLayout(`
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:#111827;">Password Reset</h2>
    <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.6;">
      Hi ${name}, a password reset has been requested for your account. Click the button below to set a new password.
    </p>
    <p style="margin:0 0 24px;text-align:center;">
      ${emailButton(url, "Reset password")}
    </p>
    <p style="margin:0;font-size:12px;color:#6b7280;">
      This link expires in 24 hours. If you did not request this, you can safely ignore it.
    </p>
  `);
}
