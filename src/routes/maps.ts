import express from 'express';
import { Response } from 'express';
import { authenticateToken } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/v1/maps/directions:
 *   get:
 *     summary: Get directions between two points
 *     description: Get route directions from pickup to dropoff location
 *     tags: [Maps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pickup_lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: pickup_lng
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: dropoff_lat
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: dropoff_lng
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Directions retrieved successfully
 *       400:
 *         description: Invalid coordinates
 *       401:
 *         description: Unauthorized
 */
router.get('/directions',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { pickup_lat, pickup_lng, dropoff_lat, dropoff_lng } = req.query;

    if (!pickup_lat || !pickup_lng || !dropoff_lat || !dropoff_lng) {
      res.status(400).json({ error: 'All coordinates are required' });
      return;
    }

    try {
      // Mock response - in production, integrate with Google Maps API
      const distance = Math.sqrt(
        Math.pow(parseFloat(dropoff_lat as string) - parseFloat(pickup_lat as string), 2) +
        Math.pow(parseFloat(dropoff_lng as string) - parseFloat(pickup_lng as string), 2)
      ) * 111; // Rough conversion to km

      const duration = Math.ceil(distance * 2); // Rough estimate: 2 min per km

      res.status(200).json({
        success: true,
        data: {
          distance_km: distance.toFixed(2),
          duration_minutes: duration,
          polyline: 'encoded_polyline_here',
          steps: [
            {
              instruction: 'Head north',
              distance: distance.toFixed(2),
              duration: duration
            }
          ]
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/maps/geocode:
 *   get:
 *     summary: Geocode address
 *     description: Convert address to coordinates
 *     tags: [Maps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Geocoding successful
 *       400:
 *         description: Invalid address
 *       401:
 *         description: Unauthorized
 */
router.get('/geocode',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { address } = req.query;

    if (!address) {
      res.status(400).json({ error: 'Address is required' });
      return;
    }

    try {
      // Mock response - in production, integrate with Google Maps API
      res.status(200).json({
        success: true,
        data: {
          address: address,
          latitude: 33.9716,
          longitude: -6.8498,
          formatted_address: `${address}, Casablanca, Morocco`,
          place_id: 'mock_place_id'
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/maps/reverse-geocode:
 *   get:
 *     summary: Reverse geocode coordinates
 *     description: Convert coordinates to address
 *     tags: [Maps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Reverse geocoding successful
 *       400:
 *         description: Invalid coordinates
 *       401:
 *         description: Unauthorized
 */
router.get('/reverse-geocode',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      res.status(400).json({ error: 'Latitude and longitude are required' });
      return;
    }

    try {
      // Mock response - in production, integrate with Google Maps API
      res.status(200).json({
        success: true,
        data: {
          latitude,
          longitude,
          address: 'Boulevard de la Corniche, Casablanca, Morocco',
          formatted_address: 'Boulevard de la Corniche, 20000 Casablanca, Morocco',
          place_id: 'mock_place_id'
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

/**
 * @swagger
 * /api/v1/maps/estimate-price:
 *   get:
 *     summary: Estimate ride price
 *     description: Get estimated price for a ride based on distance and category
 *     tags: [Maps]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: distance_km
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *           enum: [classic_ev, comfort_ev, express_ev]
 *     responses:
 *       200:
 *         description: Price estimation successful
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 */
router.get('/estimate-price',
  authenticateToken,
  asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { distance_km, category } = req.query;

    if (!distance_km || !category) {
      res.status(400).json({ error: 'Distance and category are required' });
      return;
    }

    if (!['classic_ev', 'comfort_ev', 'express_ev'].includes(category as string)) {
      res.status(400).json({ error: 'Invalid category' });
      return;
    }

    try {
      const distance = parseFloat(distance_km as string);

      // Pricing formula based on category
      const basePrices: { [key: string]: number } = {
        classic_ev: 10,
        comfort_ev: 15,
        express_ev: 20
      };

      const pricePerKm: { [key: string]: number } = {
        classic_ev: 2,
        comfort_ev: 2.5,
        express_ev: 3
      };

      const basePrice = basePrices[category as string] || 10;
      const perKmPrice = pricePerKm[category as string] || 2;
      const estimatedPrice = basePrice + (distance * perKmPrice);

      res.status(200).json({
        success: true,
        data: {
          distance_km: distance,
          category,
          base_price: basePrice,
          price_per_km: perKmPrice,
          estimated_price: estimatedPrice.toFixed(2),
          currency: 'MAD'
        }
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  })
);

export default router;

