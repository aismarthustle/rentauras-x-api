import express from 'express';
import { Response } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { supabase } from '@/config/supabase';

const router = express.Router();

/**
 * @swagger
 * /api/v1/wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     description: Retrieve current wallet balance for authenticated user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/balance',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      const { data: wallet, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !wallet) {
        res.status(404).json({ error: 'Wallet not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          balance: wallet.balance,
          currency: wallet.currency || 'MAD'
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/wallet/add-funds:
 *   post:
 *     summary: Add funds to wallet
 *     description: Recharge wallet with specified amount
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 100
 *               payment_method:
 *                 type: string
 *                 enum: [card, bank_transfer, mobile_money]
 *     responses:
 *       200:
 *         description: Funds added successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/add-funds',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { amount, payment_method } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than 0' });
      return;
    }

    try {
      const { data: wallet, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError || !wallet) {
        res.status(404).json({ error: 'Wallet not found' });
        return;
      }

      const newBalance = wallet.balance + amount;

      const { data: updatedWallet, error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({ error: 'Failed to add funds' });
        return;
      }

      // Record transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'credit',
          amount,
          description: `Wallet recharge via ${payment_method || 'card'}`
        });

      res.status(200).json({
        success: true,
        message: 'Funds added successfully',
        data: {
          new_balance: updatedWallet.balance,
          amount_added: amount
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/wallet/withdraw:
 *   post:
 *     summary: Withdraw from wallet
 *     description: Withdraw funds from wallet to bank account
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 50
 *               bank_account:
 *                 type: string
 *     responses:
 *       200:
 *         description: Withdrawal processed successfully
 *       400:
 *         description: Invalid request data or insufficient balance
 *       401:
 *         description: Unauthorized
 */
router.post('/withdraw',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { amount } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Amount must be greater than 0' });
      return;
    }

    try {
      const { data: wallet, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError || !wallet) {
        res.status(404).json({ error: 'Wallet not found' });
        return;
      }

      if (wallet.balance < amount) {
        res.status(400).json({ error: 'Insufficient balance' });
        return;
      }

      const newBalance = wallet.balance - amount;

      const { data: updatedWallet, error: updateError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({ error: 'Failed to process withdrawal' });
        return;
      }

      // Record transaction
      await supabase
        .from('wallet_transactions')
        .insert({
          wallet_id: wallet.id,
          type: 'debit',
          amount,
          description: 'Wallet withdrawal'
        });

      res.status(200).json({
        success: true,
        message: 'Withdrawal processed successfully',
        data: {
          new_balance: updatedWallet.balance,
          amount_withdrawn: amount
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/wallet/transactions:
 *   get:
 *     summary: Get wallet transaction history
 *     description: Retrieve wallet transaction history for authenticated user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Transaction history retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/transactions',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { limit = '20', offset = '0' } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (walletError || !wallet) {
        res.status(404).json({ error: 'Wallet not found' });
        return;
      }

      const { data: transactions, error, count } = await supabase
        .from('wallet_transactions')
        .select('*', { count: 'exact' })
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
        return;
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
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

export default router;

