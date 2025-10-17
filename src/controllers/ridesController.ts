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

// Calculate ride price based on distance and category
const calculatePrice = (distanceKm: number, category: string): number => {
  const basePrice = parseFloat(process.env['BASE_PRICE_MAD'] || '10');
  const minimumPrice = parseFloat(process.env['MINIMUM_RIDE_PRICE'] || '15');
  
  let pricePerKm = 3.50; // Classic EV default
  
  switch (category) {
    case 'comfort_ev':
      pricePerKm = parseFloat(process.env['COMFORT_EV_PRICE_PER_KM'] || '5.00');
      break;
    case 'express_ev':
      pricePerKm = parseFloat(process.env['EXPRESS_EV_PRICE_PER_KM'] || '4.00');
      break;
    default:
      pricePerKm = parseFloat(process.env['CLASSIC_EV_PRICE_PER_KM'] || '3.50');
  }
  
  const calculatedPrice = basePrice + (distanceKm * pricePerKm);
  return Math.max(calculatedPrice, minimumPrice);
};

export const createRide = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    throw authError('User not authenticated');
  }

  try {
    // Validate required fields
    if (!pickup_latitude || !pickup_longitude || !dropoff_latitude || !dropoff_longitude) {
      throw validationError('Pickup and dropoff coordinates are required');
    }

    if (!category || !['classic_ev', 'comfort_ev', 'express_ev'].includes(category)) {
      throw validationError('Valid category is required');
    }

    if (!distance_km || distance_km <= 0) {
      throw validationError('Valid distance is required');
    }

    // Calculate estimated price
    const estimatedPrice = calculatePrice(distance_km, category);

    // Create ride
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
      logger.error('Failed to create ride:', error);
      throw serverError('Failed to create ride');
    }

    logger.info('Ride created', { rideId: ride.id, passengerId: userId });

    res.status(201).json({
      success: true,
      message: 'Ride created successfully',
      data: { ride }
    });
  } catch (error) {
    logger.error('Create ride failed:', error);
    throw error;
  }
};

export const getUserRides = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { status, limit = 20, offset = 0 } = req.query;

  if (!userId) {
    throw authError('User not authenticated');
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
      logger.error('Failed to fetch rides:', error);
      throw serverError('Failed to fetch rides');
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
    logger.error('Get rides failed:', error);
    throw error;
  }
};

export const getRideDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { rideId } = req.params;

  if (!userId) {
    throw authError('User not authenticated');
  }

  try {
    const { data: ride, error } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (error || !ride) {
      throw notFoundError('Ride not found');
    }

    // Check if user is authorized to view this ride
    if (ride.passenger_id !== userId && ride.driver_id !== userId && req.user?.role !== 'admin') {
      throw authError('Not authorized to view this ride');
    }

    res.status(200).json({
      success: true,
      data: { ride }
    });
  } catch (error) {
    logger.error('Get ride details failed:', error);
    throw error;
  }
};

export const updateRideStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { rideId } = req.params;
  const { status } = req.body;

  if (!userId) {
    throw authError('User not authenticated');
  }

  try {
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (fetchError || !ride) {
      throw notFoundError('Ride not found');
    }

    // Validate status
    if (!['pending', 'accepted', 'in_progress', 'completed', 'cancelled'].includes(status)) {
      throw validationError('Invalid status');
    }

    // Check authorization
    if (ride.driver_id !== userId && ride.passenger_id !== userId) {
      throw authError('Not authorized to update this ride');
    }

    // Update ride
    const { data: updatedRide, error: updateError } = await supabase
      .from('rides')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update ride:', updateError);
      throw serverError('Failed to update ride');
    }

    logger.info('Ride status updated', { rideId, newStatus: status });

    res.status(200).json({
      success: true,
      message: 'Ride status updated successfully',
      data: { ride: updatedRide }
    });
  } catch (error) {
    logger.error('Update ride status failed:', error);
    throw error;
  }
};

export const cancelRide = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { rideId } = req.params;
  const { reason } = req.body;

  if (!userId) {
    throw authError('User not authenticated');
  }

  try {
    const { data: ride, error: fetchError } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .single();

    if (fetchError || !ride) {
      throw notFoundError('Ride not found');
    }

    // Check authorization
    if (ride.passenger_id !== userId && ride.driver_id !== userId) {
      throw authError('Not authorized to cancel this ride');
    }

    // Can only cancel pending or accepted rides
    if (!['pending', 'accepted'].includes(ride.status)) {
      throw validationError('Cannot cancel a ride that is already in progress or completed');
    }

    // Update ride status to cancelled
    const { data: updatedRide, error: updateError } = await supabase
      .from('rides')
      .update({ 
        status: 'cancelled',
        notes: reason || 'Cancelled by user',
        updated_at: new Date().toISOString()
      })
      .eq('id', rideId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to cancel ride:', updateError);
      throw serverError('Failed to cancel ride');
    }

    logger.info('Ride cancelled', { rideId, cancelledBy: userId });

    res.status(200).json({
      success: true,
      message: 'Ride cancelled successfully',
      data: { ride: updatedRide }
    });
  } catch (error) {
    logger.error('Cancel ride failed:', error);
    throw error;
  }
};

