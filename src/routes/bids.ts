import express from 'express';
import { Response } from 'express';
import { authenticateToken, requireDriver } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { supabase } from '@/config/supabase';

const router = express.Router();

/**
 * @swagger
 * /api/v1/bids:
 *   post:
 *     summary: Place a bid on a ride
 *     description: Driver places a bid on an auction-type ride
 *     tags: [Bids]
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
 *               - bid_amount
 *             properties:
 *               ride_id:
 *                 type: string
 *                 format: uuid
 *               bid_amount:
 *                 type: number
 *                 example: 45.50
 *     responses:
 *       201:
 *         description: Bid placed successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/',
  authenticateToken,
  requireDriver,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { ride_id, bid_amount } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!ride_id || !bid_amount || bid_amount <= 0) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }

    try {
      // Verify ride exists
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', ride_id)
        .single();

      if (rideError || !ride) {
        res.status(404).json({ error: 'Ride not found' });
        return;
      }

      // Create bid
      const { data: bid, error: bidError } = await supabase
        .from('ride_bids')
        .insert({
          ride_id,
          driver_id: userId,
          bid_amount,
          status: 'pending'
        })
        .select()
        .single();

      if (bidError) {
        res.status(500).json({ error: 'Failed to place bid' });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Bid placed successfully',
        data: { bid }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/bids/ride/{rideId}:
 *   get:
 *     summary: Get bids for a ride
 *     description: Retrieve all bids placed on a specific ride
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bids retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ride not found
 */
router.get('/ride/:rideId',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      // Verify ride exists and belongs to user
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (rideError || !ride) {
        res.status(404).json({ error: 'Ride not found' });
        return;
      }

      // Only passenger or admin can view bids
      if (ride.passenger_id !== userId && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Unauthorized to view bids for this ride' });
        return;
      }

      const { data: bids, error: bidsError } = await supabase
        .from('ride_bids')
        .select('*')
        .eq('ride_id', rideId)
        .order('bid_amount', { ascending: true });

      if (bidsError) {
        res.status(500).json({ error: 'Failed to fetch bids' });
        return;
      }

      res.status(200).json({
        success: true,
        data: { bids: bids || [] }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/bids/{bidId}/accept:
 *   put:
 *     summary: Accept a bid
 *     description: Passenger accepts a driver's bid on their ride
 *     tags: [Bids]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bidId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Bid accepted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Bid not found
 */
router.put('/:bidId/accept',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { bidId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      // Get bid details
      const { data: bid, error: bidError } = await supabase
        .from('ride_bids')
        .select('*')
        .eq('id', bidId)
        .single();

      if (bidError || !bid) {
        res.status(404).json({ error: 'Bid not found' });
        return;
      }

      // Get ride details
      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', bid.ride_id)
        .single();

      if (rideError || !ride) {
        res.status(404).json({ error: 'Ride not found' });
        return;
      }

      // Only passenger can accept bid
      if (ride.passenger_id !== userId && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Unauthorized to accept this bid' });
        return;
      }

      // Update bid status
      const { data: updatedBid, error: updateError } = await supabase
        .from('ride_bids')
        .update({ status: 'accepted' })
        .eq('id', bidId)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({ error: 'Failed to accept bid' });
        return;
      }

      // Update ride with driver and final price
      await supabase
        .from('rides')
        .update({
          driver_id: bid.driver_id,
          final_price: bid.bid_amount,
          status: 'accepted'
        })
        .eq('id', bid.ride_id);

      // Reject other bids for this ride
      await supabase
        .from('ride_bids')
        .update({ status: 'rejected' })
        .eq('ride_id', bid.ride_id)
        .neq('id', bidId);

      res.status(200).json({
        success: true,
        message: 'Bid accepted successfully',
        data: { bid: updatedBid }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

export default router;

