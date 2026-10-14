import nodemailer from 'nodemailer';

export const isEmailConfigured = () => Boolean(
  process.env.SMTP_HOST &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS &&
  process.env.EMAIL_FROM &&
  String(process.env.EMAIL_ENABLED || '').toLowerCase() === 'true'
);

export const sendEmailIfConfigured = async ({ to, subject, text, html }) => {
  if (!isEmailConfigured()) {
    return {
      status: 'disabled',
      delivered: false,
      provider: 'smtp',
      reason: 'Email provider credentials are not configured. Notifications remain stored only in the application database.',
    };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });

  return {
    status: info?.accepted?.length ? 'sent' : 'failed',
    delivered: Boolean(info?.accepted?.length),
    provider: 'smtp',
    messageId: info?.messageId || null,
  };
};
