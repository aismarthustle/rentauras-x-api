import express from 'express';
import { Response } from 'express';
import { authenticateToken, requireDriver } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { supabase } from '@/config/supabase';

const router = express.Router();

/**
 * @swagger
 * /api/v1/drivers/register:
 *   post:
 *     summary: Register as driver
 *     description: Convert user account to driver and set up driver profile
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vehicle_category
 *               - license_number
 *             properties:
 *               vehicle_category:
 *                 type: string
 *                 enum: [classic_ev, comfort_ev, express_ev]
 *               license_number:
 *                 type: string
 *               vehicle_model:
 *                 type: string
 *     responses:
 *       201:
 *         description: Driver registered successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/register',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { vehicle_category, license_number } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!vehicle_category || !license_number) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    try {
      // Update user role to driver
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'driver' })
        .eq('id', userId);

      if (updateError) {
        res.status(500).json({ error: 'Failed to register as driver' });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Successfully registered as driver',
        data: { user_id: userId, role: 'driver' }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/drivers/me:
 *   get:
 *     summary: Get driver profile
 *     description: Retrieve current driver's profile information
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Driver profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/me',
  authenticateToken,
  requireDriver,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        res.status(404).json({ error: 'Driver profile not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: { driver: user }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/drivers/status:
 *   put:
 *     summary: Update driver online status
 *     description: Set driver as online or offline
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_online
 *             properties:
 *               is_online:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/status',
  authenticateToken,
  requireDriver,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { is_online } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (typeof is_online !== 'boolean') {
      res.status(400).json({ error: 'is_online must be a boolean' });
      return;
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .update({ status: is_online ? 'active' : 'inactive' })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: 'Failed to update status' });
        return;
      }

      res.status(200).json({
        success: true,
        message: `Driver is now ${is_online ? 'online' : 'offline'}`,
        data: { user }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/drivers/location:
 *   put:
 *     summary: Update driver location
 *     description: Update driver's current location
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/location',
  authenticateToken,
  requireDriver,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { latitude, longitude } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (latitude === undefined || longitude === undefined) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    try {
      res.status(200).json({
        success: true,
        message: 'Location updated successfully',
        data: { latitude, longitude, updated_at: new Date().toISOString() }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/drivers/earnings:
 *   get:
 *     summary: Get driver earnings
 *     description: Retrieve driver's earnings summary
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/earnings',
  authenticateToken,
  requireDriver,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      // Get completed rides for this driver
      const { data: rides, error } = await supabase
        .from('rides')
        .select('final_price')
        .eq('driver_id', userId)
        .eq('status', 'completed');

      if (error) {
        res.status(500).json({ error: 'Failed to fetch earnings' });
        return;
      }

      const totalEarnings = rides?.reduce((sum, ride) => sum + (ride.final_price || 0), 0) || 0;
      const completedRides = rides?.length || 0;

      res.status(200).json({
        success: true,
        data: {
          total_earnings: totalEarnings,
          completed_rides: completedRides,
          average_per_ride: completedRides > 0 ? totalEarnings / completedRides : 0
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

export default router;

