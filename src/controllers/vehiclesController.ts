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

export const createVehicle = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
    throw authError('User not authenticated');
  }

  // Check if user is a driver
  if (req.user?.role !== 'driver') {
    throw authError('Only drivers can add vehicles');
  }

  try {
    // Validate required fields
    if (!make || !model || !year || !license_plate || !category) {
      throw validationError('Make, model, year, license plate, and category are required');
    }

    if (!['classic_ev', 'comfort_ev', 'express_ev'].includes(category)) {
      throw validationError('Invalid vehicle category');
    }

    // Create vehicle
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
      logger.error('Failed to create vehicle:', error);
      throw serverError('Failed to create vehicle');
    }

    logger.info('Vehicle created', { vehicleId: vehicle.id, driverId: userId });

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: { vehicle }
    });
  } catch (error) {
    logger.error('Create vehicle failed:', error);
    throw error;
  }
};

export const getDriverVehicles = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { status } = req.query;

  if (!userId) {
    throw authError('User not authenticated');
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
      logger.error('Failed to fetch vehicles:', error);
      throw serverError('Failed to fetch vehicles');
    }

    res.status(200).json({
      success: true,
      data: { vehicles: vehicles || [] }
    });
  } catch (error) {
    logger.error('Get vehicles failed:', error);
    throw error;
  }
};

export const getVehicleDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { vehicleId } = req.params;

  if (!userId) {
    throw authError('User not authenticated');
  }

  try {
    const { data: vehicle, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (error || !vehicle) {
      throw notFoundError('Vehicle not found');
    }

    // Check authorization
    if (vehicle.driver_id !== userId && req.user?.role !== 'admin') {
      throw authError('Not authorized to view this vehicle');
    }

    res.status(200).json({
      success: true,
      data: { vehicle }
    });
  } catch (error) {
    logger.error('Get vehicle details failed:', error);
    throw error;
  }
};

export const updateVehicle = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { vehicleId } = req.params;
  const updateData = req.body;

  if (!userId) {
    throw authError('User not authenticated');
  }

  try {
    const { data: vehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (fetchError || !vehicle) {
      throw notFoundError('Vehicle not found');
    }

    // Check authorization
    if (vehicle.driver_id !== userId) {
      throw authError('Not authorized to update this vehicle');
    }

    // Update vehicle
    const { data: updatedVehicle, error: updateError } = await supabase
      .from('vehicles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', vehicleId)
      .select()
      .single();

    if (updateError) {
      logger.error('Failed to update vehicle:', updateError);
      throw serverError('Failed to update vehicle');
    }

    logger.info('Vehicle updated', { vehicleId });

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      data: { vehicle: updatedVehicle }
    });
  } catch (error) {
    logger.error('Update vehicle failed:', error);
    throw error;
  }
};

export const deleteVehicle = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { vehicleId } = req.params;

  if (!userId) {
    throw authError('User not authenticated');
  }

  try {
    const { data: vehicle, error: fetchError } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single();

    if (fetchError || !vehicle) {
      throw notFoundError('Vehicle not found');
    }

    // Check authorization
    if (vehicle.driver_id !== userId) {
      throw authError('Not authorized to delete this vehicle');
    }

    // Delete vehicle
    const { error: deleteError } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', vehicleId);

    if (deleteError) {
      logger.error('Failed to delete vehicle:', deleteError);
      throw serverError('Failed to delete vehicle');
    }

    logger.info('Vehicle deleted', { vehicleId });

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    logger.error('Delete vehicle failed:', error);
    throw error;
  }
};

