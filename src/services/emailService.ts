import nodemailer from 'nodemailer';
import { logger } from '@/utils/logger';

// Create transporter
const createTransporter = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    logger.warn('Email SMTP not configured. Email features will be disabled.');
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
};

const transporter = createTransporter();

export const sendEmail = async (to: string, subject: string, text: string, html?: string): Promise<void> => {
  if (!transporter) {
    logger.error('Email service not configured');
    throw new Error('Email service not available');
  }

  try {
    const info = await transporter.sendMail({
      from: `"Rentauras X" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text
    });

    logger.info('Email sent successfully', {
      to: to.replace(/(.{3}).*(@.*)/, '$1***$2'),
      subject,
      messageId: info.messageId
    });
  } catch (error) {
    logger.error('Failed to send email:', error);
    throw new Error('Failed to send email');
  }
};

export default { sendEmail };
