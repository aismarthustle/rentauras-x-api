import express from 'express';
import { authenticateToken } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { Response } from 'express';
import { supabase } from '@/config/supabase';

const router = express.Router();

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieve all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status (true/false)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ride_update, payment, promotion, system]
 *         description: Filter notifications by type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of notifications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of notifications to skip
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                       title:
 *                         type: string
 *                         example: 'Ride accepted'
 *                       message:
 *                         type: string
 *                         example: 'Your ride has been accepted by a driver'
 *                       type:
 *                         type: string
 *                         enum: [ride_update, payment, promotion, system]
 *                       read:
 *                         type: boolean
 *                       data:
 *                         type: object
 *                         description: Additional notification data
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
// Get user notifications
router.get('/',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { read, type, limit = '20', offset = '0' } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (read !== undefined) {
        query = query.eq('is_read', read === 'true');
      }

      if (type && ['ride_update', 'payment', 'promotion', 'system'].includes(type as string)) {
        query = query.eq('type', type);
      }

      const { data: notifications, error, count } = await query;

      if (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          notifications: notifications || [],
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
 * /api/v1/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
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
 *                     read:
 *                       type: boolean
 *                       example: true
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notification not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Mark notification as read
router.put('/:id/read',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      const { data: notification, error: fetchError } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !notification) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      // Check if notification belongs to user
      if (notification.user_id !== userId && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Unauthorized to update this notification' });
        return;
      }

      const { data: updatedNotification, error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({ error: 'Failed to update notification' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Notification marked as read',
        data: { notification: updatedNotification }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

export default router;
