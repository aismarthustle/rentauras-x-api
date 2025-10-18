import express from 'express';
import { Response } from 'express';
import { authenticateToken, requireAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { supabase } from '@/config/supabase';

const router = express.Router();

/**
 * @swagger
 * /api/v1/admin/drivers/pending:
 *   get:
 *     summary: Get pending drivers
 *     description: Retrieve list of drivers pending approval (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pending drivers retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/drivers/pending',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { data: drivers, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'driver')
        .eq('status', 'inactive')
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({ error: 'Failed to fetch pending drivers' });
        return;
      }

      res.status(200).json({
        success: true,
        data: { drivers: drivers || [] }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/admin/drivers/{driverId}/approve:
 *   put:
 *     summary: Approve driver
 *     description: Approve a pending driver (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Driver approved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Driver not found
 */
router.put('/drivers/:driverId/approve',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { driverId } = req.params;

    try {
      const { data: driver, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', driverId)
        .eq('role', 'driver')
        .single();

      if (fetchError || !driver) {
        res.status(404).json({ error: 'Driver not found' });
        return;
      }

      const { data: updatedDriver, error: updateError } = await supabase
        .from('users')
        .update({ status: 'active' })
        .eq('id', driverId)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({ error: 'Failed to approve driver' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Driver approved successfully',
        data: { driver: updatedDriver }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/admin/drivers/{driverId}/reject:
 *   put:
 *     summary: Reject driver
 *     description: Reject a pending driver (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: driverId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Driver rejected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Driver not found
 */
router.put('/drivers/:driverId/reject',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { driverId } = req.params;

    try {
      const { data: driver, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', driverId)
        .eq('role', 'driver')
        .single();

      if (fetchError || !driver) {
        res.status(404).json({ error: 'Driver not found' });
        return;
      }

      const { data: updatedDriver, error: updateError } = await supabase
        .from('users')
        .update({ status: 'suspended' })
        .eq('id', driverId)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({ error: 'Failed to reject driver' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Driver rejected successfully',
        data: { driver: updatedDriver }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/admin/rides/active:
 *   get:
 *     summary: Get all active rides
 *     description: Retrieve all active rides in the system (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active rides retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/rides/active',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { data: rides, error } = await supabase
        .from('rides')
        .select('*')
        .in('status', ['pending', 'accepted', 'in_progress'])
        .order('created_at', { ascending: false });

      if (error) {
        res.status(500).json({ error: 'Failed to fetch active rides' });
        return;
      }

      res.status(200).json({
        success: true,
        data: { rides: rides || [] }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/admin/analytics:
 *   get:
 *     summary: Get platform analytics
 *     description: Retrieve platform statistics and analytics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/analytics',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total drivers
      const { count: totalDrivers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'driver');

      // Get total rides
      const { count: totalRides } = await supabase
        .from('rides')
        .select('*', { count: 'exact', head: true });

      // Get completed rides
      const { count: completedRides } = await supabase
        .from('rides')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');

      // Get total revenue
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('status', 'completed');

      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      res.status(200).json({
        success: true,
        data: {
          total_users: totalUsers || 0,
          total_drivers: totalDrivers || 0,
          total_rides: totalRides || 0,
          completed_rides: completedRides || 0,
          total_revenue: totalRevenue,
          completion_rate: totalRides ? ((completedRides || 0) / totalRides * 100).toFixed(2) : 0
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/admin/settings:
 *   put:
 *     summary: Update platform settings
 *     description: Update platform configuration (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: object
 *     responses:
 *       200:
 *         description: Settings updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/settings',
  authenticateToken,
  requireAdmin,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { key, value } = req.body;

    if (!key || !value) {
      res.status(400).json({ error: 'Key and value are required' });
      return;
    }

    try {
      const { data: setting, error } = await supabase
        .from('app_settings')
        .upsert({ key, value }, { onConflict: 'key' })
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: 'Failed to update settings' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: { setting }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

export default router;

