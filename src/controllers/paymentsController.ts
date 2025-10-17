import { Response } from 'express';
import { supabase } from '@/config/supabase';
import { AuthenticatedRequest } from '@/middleware/auth';
import { 
  validationError, 
  authError, 
  notFoundError, 
  serverError 
} from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

export const getPaymentHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { limit = 20, offset = 0, status } = req.query;

  if (!userId) {
    throw authError('User not authenticated');
  }

  try {
    let query = supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (status && ['pending', 'completed', 'failed', 'refunded'].includes(status as string)) {
      query = query.eq('status', status);
    }

    const { data: payments, error, count } = await query;

    if (error) {
      logger.error('Failed to fetch payments:', error);
      throw serverError('Failed to fetch payment history');
    }

    res.status(200).json({
      success: true,
      data: {
        payments: payments || [],
        pagination: {
          total: count || 0,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      }
    });
  } catch (error) {
    logger.error('Get payment history failed:', error);
    throw error;
  }
};

export const getWalletBalance = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    throw authError('User not authenticated');
  }

  try {
    const { data: wallet, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // Create wallet if it doesn't exist
      const { data: newWallet, error: createError } = await supabase
        .from('wallets')
        .insert({
          user_id: userId,
          balance: 0,
          currency: 'MAD'
        })
        .select()
        .single();

      if (createError) {
        logger.error('Failed to create wallet:', createError);
        throw serverError('Failed to get wallet balance');
      }

      res.status(200).json({
        success: true,
        data: { wallet: newWallet }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { wallet }
    });
  } catch (error) {
    logger.error('Get wallet balance failed:', error);
    throw error;
  }
};

export const addWalletFunds = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { amount, payment_method, reference_number } = req.body;

  if (!userId) {
    throw authError('User not authenticated');
  }

  try {
    if (!amount || amount <= 0) {
      throw validationError('Valid amount is required');
    }

    if (!payment_method || !['card', 'mobile_money', 'bank_transfer'].includes(payment_method)) {
      throw validationError('Valid payment method is required');
    }

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount,
        payment_method,
        status: 'pending',
        reference_number: reference_number || null,
        description: 'Wallet top-up'
      })
      .select()
      .single();

    if (paymentError) {
      logger.error('Failed to create payment:', paymentError);
      throw serverError('Failed to process payment');
    }

    logger.info('Wallet top-up initiated', { userId, amount, paymentMethod: payment_method });

    res.status(201).json({
      success: true,
      message: 'Payment initiated successfully',
      data: { payment }
    });
  } catch (error) {
    logger.error('Add wallet funds failed:', error);
    throw error;
  }
};

export const processRidePayment = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { ride_id, payment_method } = req.body;

  if (!userId) {
    throw authError('User not authenticated');
  }

  try {
    if (!ride_id || !payment_method) {
      throw validationError('Ride ID and payment method are required');
    }

    // Get ride details
    const { data: ride, error: rideError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', ride_id)
      .single();

    if (rideError || !ride) {
      throw notFoundError('Ride not found');
    }

    // Check authorization
    if (ride.passenger_id !== userId) {
      throw authError('Not authorized to pay for this ride');
    }

    if (ride.status !== 'completed') {
      throw validationError('Can only pay for completed rides');
    }

    const amount = ride.final_price || ride.estimated_price;

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        ride_id,
        user_id: userId,
        amount,
        payment_method,
        status: 'completed',
        description: `Payment for ride ${ride_id}`
      })
      .select()
      .single();

    if (paymentError) {
      logger.error('Failed to create payment:', paymentError);
      throw serverError('Failed to process payment');
    }

    // If payment method is wallet, deduct from wallet
    if (payment_method === 'wallet') {
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        throw notFoundError('Wallet not found');
      }

      if (wallet.balance < amount) {
        throw validationError('Insufficient wallet balance');
      }

      // Update wallet balance
      await supabase
        .from('wallets')
        .update({ balance: wallet.balance - amount })
        .eq('id', wallet.id);

      // Record transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'debit',
          amount,
          description: `Payment for ride ${ride_id}`,
          reference_id: payment.id
        });
    }

    logger.info('Ride payment processed', { rideId: ride_id, userId, amount });

    res.status(200).json({
      success: true,
      message: 'Payment processed successfully',
      data: { payment }
    });
  } catch (error) {
    logger.error('Process ride payment failed:', error);
    throw error;
  }
};

export const getWalletTransactions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { limit = 20, offset = 0 } = req.query;

  if (!userId) {
    throw authError('User not authenticated');
  }

  try {
    // Get user's wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (walletError || !wallet) {
      throw notFoundError('Wallet not found');
    }

    // Get transactions
    const { data: transactions, error, count } = await supabase
      .from('wallet_transactions')
      .select('*', { count: 'exact' })
      .eq('wallet_id', wallet.id)
      .order('created_at', { ascending: false })
      .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

    if (error) {
      logger.error('Failed to fetch transactions:', error);
      throw serverError('Failed to fetch transactions');
    }

    res.status(200).json({
      success: true,
      data: {
        transactions: transactions || [],
        pagination: {
          total: count || 0,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      }
    });
  } catch (error) {
    logger.error('Get wallet transactions failed:', error);
    throw error;
  }
};

