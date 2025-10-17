import twilio from 'twilio';
import { logger } from '@/utils/logger';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

if (!accountSid || !authToken) {
  logger.warn('Twilio credentials not configured. SMS and WhatsApp features will be disabled.');
}

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export const sendSMS = async (to: string, message: string): Promise<void> => {
  if (!client || !phoneNumber) {
    logger.error('Twilio SMS not configured');
    throw new Error('SMS service not available');
  }

  try {
    // Ensure phone number is in international format
    const formattedTo = to.startsWith('+') ? to : `+${to}`;
    
    const result = await client.messages.create({
      body: message,
      from: phoneNumber,
      to: formattedTo
    });

    logger.info('SMS sent successfully', {
      to: formattedTo.replace(/(.{3}).*(.{3})/, '$1***$2'),
      sid: result.sid,
      status: result.status
    });
  } catch (error) {
    logger.error('Failed to send SMS:', error);
    throw new Error('Failed to send SMS');
  }
};

export const sendWhatsApp = async (to: string, message: string): Promise<void> => {
  if (!client || !whatsappNumber) {
    logger.error('Twilio WhatsApp not configured');
    throw new Error('WhatsApp service not available');
  }

  try {
    // Ensure phone number is in international format
    const formattedTo = to.startsWith('+') ? `whatsapp:${to}` : `whatsapp:+${to}`;
    
    const result = await client.messages.create({
      body: message,
      from: whatsappNumber,
      to: formattedTo
    });

    logger.info('WhatsApp message sent successfully', {
      to: formattedTo.replace(/(.{3}).*(.{3})/, '$1***$2'),
      sid: result.sid,
      status: result.status
    });
  } catch (error) {
    logger.error('Failed to send WhatsApp message:', error);
    throw new Error('Failed to send WhatsApp message');
  }
};

export const verifyPhoneNumber = async (phoneNumber: string): Promise<boolean> => {
  if (!client) {
    logger.warn('Twilio not configured, skipping phone verification');
    return true; // Allow in development
  }

  try {
    const lookup = await client.lookups.v1.phoneNumbers(phoneNumber).fetch();
    return !!lookup.phoneNumber;
  } catch (error) {
    logger.warn('Phone number verification failed:', error);
    return false;
  }
};

export const getDeliveryStatus = async (messageSid: string): Promise<string | null> => {
  if (!client) {
    return null;
  }

  try {
    const message = await client.messages(messageSid).fetch();
    return message.status;
  } catch (error) {
    logger.error('Failed to get message status:', error);
    return null;
  }
};

// Format phone number to international format
export const formatPhoneNumber = (phoneNumber: string, defaultCountryCode: string = '212'): string => {
  // Remove all non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If it starts with 0, remove it (common in Morocco)
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // If it doesn't start with country code, add default (Morocco: 212)
  if (!cleaned.startsWith(defaultCountryCode)) {
    cleaned = defaultCountryCode + cleaned;
  }
  
  return `+${cleaned}`;
};

// Validate Moroccan phone number
export const isValidMoroccanPhone = (phoneNumber: string): boolean => {
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Moroccan mobile numbers: +212 6XX XXX XXX or +212 7XX XXX XXX
  const moroccanMobileRegex = /^(\+212|212|0)?[67]\d{8}$/;
  
  return moroccanMobileRegex.test(cleaned);
};

export default {
  sendSMS,
  sendWhatsApp,
  verifyPhoneNumber,
  getDeliveryStatus,
  formatPhoneNumber,
  isValidMoroccanPhone
};
