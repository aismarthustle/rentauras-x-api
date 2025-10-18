import express from 'express';
import { authenticateToken, requireDriver } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';
import { Response } from 'express';
import { supabase } from '@/config/supabase';

const router = express.Router();

/**
 * @swagger
 * /api/v1/vehicles:
 *   get:
 *     summary: Get driver's vehicles
 *     description: Retrieve all vehicles registered by the authenticated driver
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vehicles retrieved successfully
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
 *                       make:
 *                         type: string
 *                         example: 'Tesla'
 *                       model:
 *                         type: string
 *                         example: 'Model 3'
 *                       year:
 *                         type: integer
 *                         example: 2023
 *                       license_plate:
 *                         type: string
 *                         example: 'ABC-1234'
 *                       color:
 *                         type: string
 *                         example: 'White'
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, maintenance]
 *                       battery_level:
 *                         type: number
 *                         description: Battery percentage (0-100)
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Driver role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get driver's vehicles
router.get('/',
  authenticateToken,
  requireDriver,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const { status } = req.query;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      let query = supabase
        .from('vehicles')
        .select('*')
        .eq('driver_id', userId)
        .order('created_at', { ascending: false });

      if (status && ['active', 'inactive', 'maintenance'].includes(status as string)) {
        query = query.eq('status', status);
      }

      const { data: vehicles, error } = await query;

      if (error) {
        res.status(500).json({ error: 'Failed to fetch vehicles' });
        return;
      }

      res.status(200).json({
        success: true,
        data: { vehicles: vehicles || [] }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/vehicles:
 *   post:
 *     summary: Add new vehicle
 *     description: Register a new electric vehicle for the authenticated driver
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - make
 *               - model
 *               - year
 *               - license_plate
 *               - color
 *             properties:
 *               make:
 *                 type: string
 *                 description: Vehicle manufacturer
 *                 example: 'Tesla'
 *               model:
 *                 type: string
 *                 description: Vehicle model
 *                 example: 'Model 3'
 *               year:
 *                 type: integer
 *                 description: Manufacturing year
 *                 example: 2023
 *               license_plate:
 *                 type: string
 *                 description: Vehicle license plate
 *                 example: 'ABC-1234'
 *               color:
 *                 type: string
 *                 description: Vehicle color
 *                 example: 'White'
 *               vin:
 *                 type: string
 *                 description: Vehicle Identification Number
 *               battery_capacity:
 *                 type: number
 *                 description: Battery capacity in kWh
 *                 example: 75
 *     responses:
 *       201:
 *         description: Vehicle registered successfully
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
 *                     make:
 *                       type: string
 *                     model:
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
 *       403:
 *         description: Forbidden - Driver role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Add new vehicle
router.post('/',
  authenticateToken,
  requireDriver,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const userId = req.user?.id;
    const {
      make,
      model,
      year,
      color,
      license_plate,
      category,
      is_electric,
      is_hybrid,
      registration_number,
      insurance_expiry,
      inspection_expiry,
      seats,
      ac_available,
      wifi_available,
      usb_charging
    } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!make || !model || !year || !license_plate || !category) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    try {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .insert({
          driver_id: userId,
          make,
          model,
          year,
          color: color || null,
          license_plate,
          category,
          is_electric: is_electric !== undefined ? is_electric : true,
          is_hybrid: is_hybrid !== undefined ? is_hybrid : false,
          registration_number: registration_number || null,
          insurance_expiry: insurance_expiry || null,
          inspection_expiry: inspection_expiry || null,
          seats: seats || 4,
          ac_available: ac_available !== undefined ? ac_available : true,
          wifi_available: wifi_available !== undefined ? wifi_available : false,
          usb_charging: usb_charging !== undefined ? usb_charging : false,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        res.status(500).json({ error: 'Failed to create vehicle' });
        return;
      }

      res.status(201).json({
        success: true,
        message: 'Vehicle created successfully',
        data: { vehicle }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/vehicles/{vehicleId}:
 *   get:
 *     summary: Get vehicle details
 *     description: Retrieve details of a specific vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vehicle details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 */
router.get('/:vehicleId',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { vehicleId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      const { data: vehicle, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (error || !vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Check if user is the driver or admin
      if (vehicle.driver_id !== userId && req.user?.role !== 'admin') {
        res.status(403).json({ error: 'Unauthorized to view this vehicle' });
        return;
      }

      res.status(200).json({
        success: true,
        data: { vehicle }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/vehicles/{vehicleId}:
 *   put:
 *     summary: Update vehicle
 *     description: Update vehicle details
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
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
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, maintenance]
 *               color:
 *                 type: string
 *               insurance_expiry:
 *                 type: string
 *                 format: date
 *               inspection_expiry:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Vehicle updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 */
router.put('/:vehicleId',
  authenticateToken,
  requireDriver,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { vehicleId } = req.params;
    const userId = req.user?.id;
    const updateData = req.body;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      const { data: vehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (fetchError || !vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Check if user is the driver
      if (vehicle.driver_id !== userId) {
        res.status(403).json({ error: 'Unauthorized to update this vehicle' });
        return;
      }

      const { data: updatedVehicle, error: updateError } = await supabase
        .from('vehicles')
        .update(updateData)
        .eq('id', vehicleId)
        .select()
        .single();

      if (updateError) {
        res.status(500).json({ error: 'Failed to update vehicle' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Vehicle updated successfully',
        data: { vehicle: updatedVehicle }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/vehicles/{vehicleId}:
 *   delete:
 *     summary: Delete vehicle
 *     description: Delete a vehicle
 *     tags: [Vehicles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Vehicle deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vehicle not found
 */
router.delete('/:vehicleId',
  authenticateToken,
  requireDriver,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { vehicleId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    try {
      const { data: vehicle, error: fetchError } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single();

      if (fetchError || !vehicle) {
        res.status(404).json({ error: 'Vehicle not found' });
        return;
      }

      // Check if user is the driver
      if (vehicle.driver_id !== userId) {
        res.status(403).json({ error: 'Unauthorized to delete this vehicle' });
        return;
      }

      const { error: deleteError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (deleteError) {
        res.status(500).json({ error: 'Failed to delete vehicle' });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Vehicle deleted successfully'
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

export default router;
