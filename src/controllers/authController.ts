import { Request, Response } from 'express';
import { supabase } from '@/config/supabase';
import { redisClient } from '@/config/redis';
import { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  AuthenticatedRequest 
} from '@/middleware/auth';
import { 
  validationError, 
  authError, 
  notFoundError, 
  conflictError 
} from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';
import { sendSMS, sendWhatsApp } from '@/services/twilioService';
import { sendEmail } from '@/services/emailService';

// Generate random OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in Redis with expiration
const storeOTP = async (identifier: string, otp: string): Promise<void> => {
  const expiryMinutes = parseInt(process.env.OTP_EXPIRY_MINUTES || '10');
  await redisClient.setEx(`otp:${identifier}`, expiryMinutes * 60, otp);
};

// Verify OTP from Redis
const verifyOTPFromRedis = async (identifier: string, otp: string): Promise<boolean> => {
  const storedOTP = await redisClient.get(`otp:${identifier}`);
  if (!storedOTP || storedOTP !== otp) {
    return false;
  }
  
  // Delete OTP after successful verification
  await redisClient.del(`otp:${identifier}`);
  return true;
};

export const sendOTP = async (req: Request, res: Response): Promise<void> => {
  const { phone, email, method, type } = req.body;
  
  if (!phone && !email) {
    throw validationError('Either phone or email is required');
  }

  const identifier = phone || email;
  const otp = generateOTP();

  try {
    // Store OTP in Redis
    await storeOTP(identifier, otp);

    // Send OTP based on method
    switch (method) {
      case 'sms':
        if (!phone) throw validationError('Phone number required for SMS');
        await sendSMS(phone, `Your Rentauras X verification code is: ${otp}. Valid for 10 minutes.`);
        break;
      
      case 'whatsapp':
        if (!phone) throw validationError('Phone number required for WhatsApp');
        await sendWhatsApp(phone, `Your Rentauras X verification code is: ${otp}. Valid for 10 minutes.`);
        break;
      
      case 'email':
        if (!email) throw validationError('Email required for email OTP');
        await sendEmail(
          email,
          'Rentauras X - Verification Code',
          `Your verification code is: ${otp}. This code will expire in 10 minutes.`
        );
        break;
      
      default:
        throw validationError('Invalid OTP method');
    }

    logger.info('OTP sent successfully', { 
      identifier: identifier.replace(/(.{3}).*(.{3})/, '$1***$2'), 
      method, 
      type 
    });

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      expiresIn: parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 // seconds
    });
  } catch (error) {
    logger.error('Failed to send OTP:', error);
    throw new Error('Failed to send OTP. Please try again.');
  }
};

export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  const { phone, email, otp, type, full_name, role } = req.body;
  
  if (!phone && !email) {
    throw validationError('Either phone or email is required');
  }

  const identifier = phone || email;

  // Verify OTP
  const isValidOTP = await verifyOTPFromRedis(identifier, otp);
  if (!isValidOTP) {
    throw authError('Invalid or expired OTP');
  }

  try {
    let user;

    if (type === 'register') {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`phone.eq.${phone || ''},email.eq.${email || ''}`)
        .single();

      if (existingUser) {
        throw conflictError('User already exists with this phone number or email');
      }

      // Create new user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          phone: phone || null,
          email: email || null,
          full_name,
          role: role || 'passenger',
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        logger.error('Failed to create user:', createError);
        throw new Error('Failed to create user account');
      }

      user = newUser;
      logger.info('New user registered', { userId: user.id, role: user.role });
    } else {
      // Login - find existing user
      const { data: existingUser, error: findError } = await supabase
        .from('users')
        .select('*')
        .or(`phone.eq.${phone || ''},email.eq.${email || ''}`)
        .single();

      if (findError || !existingUser) {
        throw notFoundError('User not found. Please register first.');
      }

      if (existingUser.status !== 'active') {
        throw authError('Account is suspended. Please contact support.');
      }

      user = existingUser;
      logger.info('User logged in', { userId: user.id, role: user.role });
    }

    // Generate tokens
    const accessToken = generateToken(user);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token in Redis
    await redisClient.setEx(
      `refresh_token:${user.id}`, 
      30 * 24 * 60 * 60, // 30 days
      refreshToken
    );

    res.status(200).json({
      success: true,
      message: type === 'register' ? 'Account created successfully' : 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          full_name: user.full_name,
          role: user.role,
          status: user.status,
          avatar_url: user.avatar_url,
          created_at: user.created_at
        },
        tokens: {
          access_token: accessToken,
          refresh_token: refreshToken,
          token_type: 'Bearer',
          expires_in: 24 * 60 * 60 // 24 hours in seconds
        }
      }
    });
  } catch (error) {
    logger.error('OTP verification failed:', error);
    throw error;
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refresh_token } = req.body;

  try {
    // Verify refresh token
    const { userId } = verifyRefreshToken(refresh_token);

    // Check if refresh token exists in Redis
    const storedToken = await redisClient.get(`refresh_token:${userId}`);
    if (!storedToken || storedToken !== refresh_token) {
      throw authError('Invalid refresh token');
    }

    // Get user data
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user || user.status !== 'active') {
      throw authError('User not found or inactive');
    }

    // Generate new tokens
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user.id);

    // Update refresh token in Redis
    await redisClient.setEx(
      `refresh_token:${user.id}`, 
      30 * 24 * 60 * 60, // 30 days
      newRefreshToken
    );

    res.status(200).json({
      success: true,
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: 'Bearer',
        expires_in: 24 * 60 * 60
      }
    });
  } catch (error) {
    logger.error('Token refresh failed:', error);
    throw authError('Invalid refresh token');
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (userId) {
    // Remove refresh token from Redis
    await redisClient.del(`refresh_token:${userId}`);
    logger.info('User logged out', { userId });
  }

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user;

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user?.id,
        email: user?.email,
        phone: user?.phone,
        role: user?.role,
        status: user?.status
      }
    }
  });
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { full_name, email, phone } = req.body;

  if (!userId) {
    throw authError('User not authenticated');
  }

  try {
    const updateData: any = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logger.error('Failed to update user profile:', error);
      throw new Error('Failed to update profile');
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    logger.error('Profile update failed:', error);
    throw error;
  }
};

// Placeholder implementations for additional auth methods
export const changePassword = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  // TODO: Implement password change for email-based accounts
  res.status(501).json({ message: 'Not implemented yet' });
};

export const forgotPassword = async (_req: Request, res: Response): Promise<void> => {
  // TODO: Implement password reset
  res.status(501).json({ message: 'Not implemented yet' });
};

export const resetPassword = async (_req: Request, res: Response): Promise<void> => {
  // TODO: Implement password reset
  res.status(501).json({ message: 'Not implemented yet' });
};

export const deleteAccount = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  // TODO: Implement account deletion
  res.status(501).json({ message: 'Not implemented yet' });
};
