import express from 'express';
import { authenticateToken } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { Response } from 'express';
import { supabase } from '@/config/supabase';

const router = express.Router();

/**
 * @swagger
 * /api/v1/rides:
 *   get:
 *     summary: Get user's rides
 *     description: Retrieve all rides for the authenticated user (as passenger or driver)
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, in_progress, completed, cancelled]
 *         description: Filter rides by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of rides to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of rides to skip
 *     responses:
 *       200:
 *         description: List of rides retrieved successfully
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
 *                       status:
 *                         type: string
 *                         enum: [pending, accepted, in_progress, completed, cancelled]
 *                       pickup_location:
 *                         type: object
 *                         properties:
 *                           latitude:
 *                             type: number
 *                           longitude:
 *                             type: number
 *                       dropoff_location:
 *                         type: object
 *                         properties:
 *                           latitude:
 *                             type: number
 *                           longitude:
 *                             type: number
 *                       estimated_fare:
 *                         type: number
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
// Get user's rides
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
        .from('rides')
        .select('*', { count: 'exact' })
        .or(`passenger_id.eq.${userId},driver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (status && ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'].includes(status as string)) {
        query = query.eq('status', status);
      }

      const { data: rides, error, count } = await query;

      if (error) {
        res.status(500).json({ error: 'Failed to fetch rides' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          rides: rides || [],
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
 * /api/v1/rides:
 *   post:
 *     summary: Create new ride request
 *     description: Create a new ride request as a passenger
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickup_location
 *               - dropoff_location
 *             properties:
 *               pickup_location:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 33.9716
 *                   longitude:
 *                     type: number
 *                     example: -6.8498
 *                   address:
 *                     type: string
 *                     example: 'Casablanca, Morocco'
 *               dropoff_location:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 33.9716
 *                   longitude:
 *                     type: number
 *                     example: -6.8498
 *                   address:
 *                     type: string
 *                     example: 'Rabat, Morocco'
 *               scheduled_time:
 *                 type: string
 *                 format: date-time
 *                 description: Optional scheduled ride time
 *     responses:
 *       201:
 *         description: Ride request created successfully
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     status:
 *                       type: string
 *                       example: 'pending'
 *                     estimated_fare:
 *                       type: number
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
 */
// Create new ride request
router.post('/',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const {
      pickup_latitude,
      pickup_longitude,
      pickup_address,
      dropoff_latitude,
      dropoff_longitude,
      dropoff_address,
      category,
      distance_km,
      women_only,
      scheduled_at,
      passenger_count
    } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!pickup_latitude || !pickup_longitude || !dropoff_latitude || !dropoff_longitude || !category || !distance_km) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    try {
      // Calculate estimated price (simple formula: base + distance * rate)
      const basePrice = 10;
      const pricePerKm = 2;
      const estimatedPrice = basePrice + (distance_km * pricePerKm);

      const { data: ride, error } = await supabase
        .from('rides')
        .insert({
          passenger_id: userId,
          category,
          pickup_latitude,
          pickup_longitude,
          pickup_address,
          dropoff_latitude,
          dropoff_longitude,
          dropoff_address,
          estimated_price: estimatedPrice,
          distance_km,
          women_only: women_only || false,
          scheduled_at: scheduled_at || null,
          passenger_count: passenger_count || 1,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: 'Failed to create ride' });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Ride created successfully',
        data: { ride }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/rides/{rideId}:
 *   get:
 *     summary: Get ride details
 *     description: Retrieve details of a specific ride
 *     tags: [Rides]
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
 *         description: Ride details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ride not found
 */
router.get('/:rideId',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      const { data: ride, error } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (error || !ride) {
        res.status(404).json({ error: 'Ride not found' });
        return;
      }

      // Check if user is passenger or driver of this ride
      if (ride.passenger_id !== userId && ride.driver_id !== userId && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Unauthorized to view this ride' });
        return;
      }

      res.status(200).json({
        success: true,
        data: { ride }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/rides/{rideId}/status:
 *   put:
 *     summary: Update ride status
 *     description: Update the status of a ride (driver only)
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, in_progress, completed, cancelled]
 *     responses:
 *       200:
 *         description: Ride status updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ride not found
 */
router.put('/:rideId/status',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!['accepted', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    try {
      const { data: ride, error: fetchError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (fetchError || !ride) {
        res.status(404).json({ error: 'Ride not found' });
        return;
      }

      // Only driver can update ride status
      if (ride.driver_id !== userId && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Only driver can update ride status' });
        return;
      }

      const updateData: any = { status };
      if (status === 'in_progress') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { data: updatedRide, error: updateError } = await supabase
        .from('rides')
        .update(updateData)
        .eq('id', rideId)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({ error: 'Failed to update ride status' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Ride status updated successfully',
        data: { ride: updatedRide }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/rides/{rideId}/cancel:
 *   post:
 *     summary: Cancel a ride
 *     description: Cancel a pending or accepted ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: rideId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Reason for cancellation
 *     responses:
 *       200:
 *         description: Ride cancelled successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ride not found
 */
router.post('/:rideId/cancel',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { rideId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      const { data: ride, error: fetchError } = await supabase
        .from('rides')
        .select('*')
        .eq('id', rideId)
        .single();

      if (fetchError || !ride) {
        res.status(404).json({ error: 'Ride not found' });
        return;
      }

      // Only passenger or driver can cancel
      if (ride.passenger_id !== userId && ride.driver_id !== userId && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Unauthorized to cancel this ride' });
        return;
      }

      // Can only cancel pending or accepted rides
      if (!['pending', 'accepted'].includes(ride.status)) {
        res.status(400).json({ error: 'Can only cancel pending or accepted rides' });
        return;
      }

      const { data: cancelledRide, error: updateError } = await supabase
        .from('rides')
        .update({ status: 'cancelled' })
        .eq('id', rideId)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({ error: 'Failed to cancel ride' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Ride cancelled successfully',
        data: { ride: cancelledRide }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

export default router;
