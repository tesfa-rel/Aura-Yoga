import nodemailer from 'nodemailer';

// SMTP is optional. When it isn't configured (common in dev), we log instead of
// failing so flows like password reset still work end-to-end.
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const fromAddress = process.env.EMAIL_FROM || 'AURA Yoga <no-reply@aura-yoga.com>';

const transporter =
  smtpHost && smtpUser && smtpPass
    ? nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      })
    : null;

export const emailService = {
  isConfigured(): boolean {
    return transporter !== null;
  },

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
    const subject = 'Reset your AURA Yoga password';
    const text = `We received a request to reset your password.\n\nReset it here (valid for 1 hour): ${resetUrl}\n\nIf you didn't request this, you can safely ignore this email.`;

    if (!transporter) {
      console.log(`[emailService] SMTP not configured — would send password reset to ${to}: ${resetUrl}`);
      return false;
    }

    try {
      await transporter.sendMail({ from: fromAddress, to, subject, text });
      return true;
    } catch (error) {
      console.error('[emailService] Failed to send password reset email:', error);
      return false;
    }
  },
};
