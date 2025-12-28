/**
 * Escapes HTML special characters to prevent XSS
 */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

interface AccountDeletedEmailProps {
  email: string;
}

/**
 * Email template sent after successful account deletion
 * Returns a plain HTML string for use with Resend's html property
 */
export function accountDeletedEmailHtml({ email }: AccountDeletedEmailProps): string {
  const safeEmail = escapeHtml(email);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; margin: 0; padding: 40px 20px;">
  <table role="presentation" style="background-color: #ffffff; margin: 0 auto; padding: 40px 20px; max-width: 560px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);" width="560" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <h1 style="color: #0f172a; font-size: 24px; font-weight: 600; text-align: center; margin: 0 0 24px 0;">Account Deleted</h1>

        <div style="padding: 0 20px;">
          <p style="color: #334155; font-size: 16px; line-height: 24px; margin: 16px 0;">Hi,</p>
          <p style="color: #334155; font-size: 16px; line-height: 24px; margin: 16px 0;">
            Your webresume.now account associated with <strong>${safeEmail}</strong> has been permanently deleted.
          </p>
          <p style="color: #334155; font-size: 16px; line-height: 24px; margin: 16px 0;">All your data has been removed, including:</p>
          <ul style="color: #334155; font-size: 16px; line-height: 24px; margin: 16px 0; padding-left: 24px;">
            <li style="margin: 8px 0;">Your profile information</li>
            <li style="margin: 8px 0;">All uploaded resume files</li>
            <li style="margin: 8px 0;">Your published portfolio page</li>
            <li style="margin: 8px 0;">All associated account data</li>
          </ul>
          <p style="color: #334155; font-size: 16px; line-height: 24px; margin: 16px 0;">
            This action cannot be undone. If you wish to use webresume.now again in the future, you will need to create a new account.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;">

        <div style="padding: 0 20px;">
          <p style="color: #64748b; font-size: 14px; line-height: 20px; margin: 8px 0;">
            If you did not request this deletion, please contact us immediately at
            <a href="mailto:support@webresume.now" style="color: #4f46e5; text-decoration: underline;">support@webresume.now</a>
          </p>
          <p style="color: #64748b; font-size: 14px; line-height: 20px; margin: 8px 0;">
            Thank you for using webresume.now.
          </p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
