import express from 'express';
import { authenticateToken } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { Response } from 'express';
import { supabase } from '@/config/supabase';

const router = express.Router();

/**
 * @swagger
 * /api/v1/payments:
 *   get:
 *     summary: Get payment history
 *     description: Retrieve payment history for the authenticated user
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, refunded]
 *         description: Filter payments by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of payments to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of payments to skip
 *     responses:
 *       200:
 *         description: Payment history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       amount:
 *                         type: number
 *                         example: 45.50
 *                       currency:
 *                         type: string
 *                         example: 'MAD'
 *                       status:
 *                         type: string
 *                         enum: [pending, completed, failed, refunded]
 *                       payment_method:
 *                         type: string
 *                         enum: [card, wallet, bank_transfer]
 *                       ride_id:
 *                         type: string
 *                         format: uuid
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get payment history
router.get('/',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { status, limit = '20', offset = '0' } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
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
        res.status(500).json({ error: 'Failed to fetch payments' });
        return;
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
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/payments:
 *   post:
 *     summary: Process payment
 *     description: Process a payment for a completed ride
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ride_id
 *               - amount
 *               - payment_method
 *             properties:
 *               ride_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID of the completed ride
 *               amount:
 *                 type: number
 *                 description: Payment amount
 *                 example: 45.50
 *               payment_method:
 *                 type: string
 *                 enum: [card, wallet, bank_transfer]
 *                 description: Payment method
 *               card_token:
 *                 type: string
 *                 description: Payment gateway token (required for card payments)
 *               tip:
 *                 type: number
 *                 description: Optional tip amount
 *                 example: 5.00
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     payment_id:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       example: 'completed'
 *                     transaction_id:
 *                       type: string
 *       400:
 *         description: Invalid request data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       402:
 *         description: Payment failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Process payment
router.post('/',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { ride_id, amount, payment_method, tip } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!ride_id || !amount || !payment_method) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    if (!['card', 'wallet', 'bank_transfer'].includes(payment_method)) {
      res.status(400).json({ error: 'Invalid payment method' });
      return;
    }

    try {
      // Verify ride exists and belongs to user
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', ride_id)
        .single();

      if (rideError || !ride) {
        res.status(404).json({ error: 'Ride not found' });
        return;
      }

      if (ride.passenger_id !== userId && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Unauthorized to pay for this ride' });
        return;
      }

      // Create payment record
      const totalAmount = amount + (tip || 0);
      const { data: payment, error: paymentError } = await supabase
        .from('payments')
        .insert({
          ride_id,
          user_id: userId,
          amount: totalAmount,
          payment_method,
          status: 'completed',
          transaction_id: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          metadata: {
            tip: tip || 0,
            base_amount: amount,
            payment_date: new Date().toISOString()
          }
        })
        .select()
        .single();

      if (paymentError) {
        res.status(500).json({ error: 'Failed to process payment' });
        return;
      }

      // Update ride payment status
      await supabase
        .from('rides')
        .update({ payment_status: 'completed', final_price: totalAmount })
        .eq('id', ride_id);

      res.status(200).json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          payment_id: payment.id,
          status: payment.status,
          transaction_id: payment.transaction_id,
          amount: totalAmount
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

export default router;
