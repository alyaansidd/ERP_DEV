import nodemailer from 'nodemailer';

const getTransportConfig = () => {
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  return {
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };
};

const validateEmailConfig = () => {
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const missingVars = requiredVars.filter((key) => !process.env[key]);

  if (missingVars.length > 0) {
    throw new Error(`Missing SMTP configuration: ${missingVars.join(', ')}`);
  }
};

export const isSmtpConfigured = () => {
  const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  return requiredVars.every((key) => Boolean(process.env[key]));
};

export const sendPasswordResetOtpEmail = async ({ to, name, otp }) => {
  validateEmailConfig();

  const transporter = nodemailer.createTransport(getTransportConfig());
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  const expiryMinutes = process.env.PASSWORD_RESET_OTP_TTL_MINUTES || '10';

  const subject = 'ERP Password Reset OTP';
  const text = `Hello ${name},\n\nYour OTP for password reset is ${otp}. It is valid for ${expiryMinutes} minutes.\n\nIf you did not request this, ignore this email.`;
  const html = `
    <p>Hello ${name},</p>
    <p>Your OTP for password reset is:</p>
    <h2 style="letter-spacing: 2px;">${otp}</h2>
    <p>This OTP is valid for <strong>${expiryMinutes} minutes</strong>.</p>
    <p>If you did not request this, you can ignore this email.</p>
  `;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html
  });
};
