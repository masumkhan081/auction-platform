/**
 * Plain-function email templates. Returning `{ subject, text, html }` keeps the
 * MailService transport-agnostic and the templates trivially testable.
 *
 * Kept minimal in P1C — visual polish (branding, mjml/react-email) is a P2/P3
 * concern. The wire format is stable.
 */

export type RenderedEmail = {
  subject: string;
  text: string;
  html: string;
};

const baseLayout = (innerHtml: string): string => `<!DOCTYPE html>
<html>
  <body style="font-family: system-ui, sans-serif; color: #111;">
    <div style="max-width: 540px; margin: 24px auto; padding: 24px; border: 1px solid #eee; border-radius: 12px;">
      ${innerHtml}
      <p style="margin-top: 32px; font-size: 12px; color: #888;">Auction Platform</p>
    </div>
  </body>
</html>`;

export const renderEmailVerificationOtp = (params: { otp: string }): RenderedEmail => ({
  subject: 'Verify your email',
  text: `Your verification code is: ${params.otp}\nIt expires in 10 minutes.`,
  html: baseLayout(
    `<h2>Verify your email</h2>
     <p>Your verification code is:</p>
     <p style="font-size: 28px; letter-spacing: 4px; font-weight: 600;">${params.otp}</p>
     <p>It expires in 10 minutes. If you didn't request this, you can ignore the email.</p>`,
  ),
});

export const renderPasswordReset = (params: { resetUrl: string }): RenderedEmail => ({
  subject: 'Reset your password',
  text: `Reset your password: ${params.resetUrl}\nThis link expires in 30 minutes.`,
  html: baseLayout(
    `<h2>Reset your password</h2>
     <p>Click the link below to choose a new password. The link expires in 30 minutes.</p>
     <p><a href="${params.resetUrl}" style="background: #111; color: #fff; padding: 10px 16px; border-radius: 6px; text-decoration: none;">Reset password</a></p>
     <p style="font-size: 12px; color: #888;">If the button doesn't work, paste this URL: ${params.resetUrl}</p>`,
  ),
});
