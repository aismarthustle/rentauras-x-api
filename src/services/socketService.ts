import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { supabase } from '@/config/supabase';
import { logger } from '@/utils/logger';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

interface SocketUser {
  id: string;
  role: 'passenger' | 'driver' | 'admin';
  socketId: string;
}

// Store active users and their socket connections
const activeUsers = new Map<string, SocketUser>();
const driverLocations = new Map<string, { lat: number; lng: number; timestamp: number }>();

export const initializeSocketHandlers = (io: SocketIOServer): void => {
  // Authentication middleware for Socket.IO
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return next(new Error('Server configuration error'));
      }

      const decoded = jwt.verify(token, jwtSecret) as any;
      
      // Verify user exists and is active
      const { data: user, error } = await supabase
        .from('users')
        .select('id, role, status')
        .eq('id', decoded.userId)
        .single();

      if (error || !user || user.status !== 'active') {
        return next(new Error('Invalid token or inactive user'));
      }

      socket.userId = user.id;
      socket.userRole = user.role;
      next();
    } catch (error) {
      logger.error('Socket authentication failed:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId!;
    const userRole = socket.userRole!;

    logger.info('User connected via Socket.IO', { userId, userRole, socketId: socket.id });

    // Store user connection
    activeUsers.set(userId, {
      id: userId,
      role: userRole as 'passenger' | 'driver' | 'admin',
      socketId: socket.id
    });

    // Join user to their personal room
    socket.join(`user:${userId}`);
    
    // Join role-based rooms
    socket.join(`role:${userRole}`);

    // Driver-specific handlers
    if (userRole === 'driver') {
      handleDriverEvents(socket, userId);
      handleBidEvents(socket, userId);
    }

    // Passenger-specific handlers
    if (userRole === 'passenger') {
      handlePassengerEvents(socket, userId);
      handleBidEvents(socket, userId);
    }

    // Admin-specific handlers
    if (userRole === 'admin') {
      handleAdminEvents(socket, userId);
    }

    // Common event handlers
    handleCommonEvents(socket, userId);

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info('User disconnected', { userId, socketId: socket.id });
      activeUsers.delete(userId);
      driverLocations.delete(userId);
    });
  });
};

const handleDriverEvents = (socket: AuthenticatedSocket, userId: string): void => {
  // Driver location updates
  socket.on('driver:location_update', (data: { lat: number; lng: number }) => {
    const { lat, lng } = data;
    
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      socket.emit('error', { message: 'Invalid location data' });
      return;
    }

    driverLocations.set(userId, {
      lat,
      lng,
      timestamp: Date.now()
    });

    // Broadcast to admin dashboard
    socket.to('role:admin').emit('driver:location_updated', {
      driverId: userId,
      location: { lat, lng },
      timestamp: Date.now()
    });

    logger.debug('Driver location updated', { userId, lat, lng });
  });

  // Driver status updates
  socket.on('driver:status_update', async (data: { status: 'online' | 'offline' | 'busy' }) => {
    try {
      const { status } = data;
      
      // Update driver status in database
      await supabase
        .from('driver_profiles')
        .update({ 
          status,
          last_seen: new Date().toISOString()
        })
        .eq('user_id', userId);

      // Broadcast to admin
      socket.to('role:admin').emit('driver:status_updated', {
        driverId: userId,
        status,
        timestamp: Date.now()
      });

      socket.emit('driver:status_updated', { status });
      logger.info('Driver status updated', { userId, status });
    } catch (error) {
      logger.error('Failed to update driver status:', error);
      socket.emit('error', { message: 'Failed to update status' });
    }
  });

  // Accept ride request
  socket.on('driver:accept_ride', async (data: { rideId: string }) => {
    try {
      const { rideId } = data;

      // Update ride status
      const { data: ride, error } = await supabase
        .from('rides')
        .update({
          driver_id: userId,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', rideId)
        .eq('status', 'pending')
        .select('*, passenger:users!rides_passenger_id_fkey(id)')
        .single();

      if (error || !ride) {
        socket.emit('error', { message: 'Failed to accept ride or ride no longer available' });
        return;
      }

      // Notify passenger
      socket.to(`user:${ride.passenger_id}`).emit('ride:accepted', {
        rideId,
        driverId: userId,
        ride
      });

      // Notify admin
      socket.to('role:admin').emit('ride:accepted', {
        rideId,
        driverId: userId,
        passengerId: ride.passenger_id
      });

      socket.emit('ride:accepted', { rideId, ride });
      logger.info('Ride accepted by driver', { userId, rideId });
    } catch (error) {
      logger.error('Failed to accept ride:', error);
      socket.emit('error', { message: 'Failed to accept ride' });
    }
  });

  // Start ride
  socket.on('driver:start_ride', async (data: { rideId: string }) => {
    try {
      const { rideId } = data;

      // Update ride status to started
      const { data: ride, error } = await supabase
        .from('rides')
        .update({
          status: 'started',
          started_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', rideId)
        .eq('driver_id', userId)
        .eq('status', 'accepted')
        .select('*, passenger:users!rides_passenger_id_fkey(id)')
        .single();

      if (error || !ride) {
        socket.emit('error', { message: 'Failed to start ride or ride not found' });
        return;
      }

      // Notify passenger
      socket.to(`user:${ride.passenger_id}`).emit('ride:started', {
        rideId,
        driverId: userId,
        startedAt: ride.started_at
      });

      // Notify admin
      socket.to('role:admin').emit('ride:started', {
        rideId,
        driverId: userId,
        passengerId: ride.passenger_id
      });

      socket.emit('ride:started', { rideId });
      logger.info('Ride started by driver', { userId, rideId });
    } catch (error) {
      logger.error('Failed to start ride:', error);
      socket.emit('error', { message: 'Failed to start ride' });
    }
  });

  // Complete ride
  socket.on('driver:complete_ride', async (data: { rideId: string }) => {
    try {
      const { rideId } = data;

      // Update ride status to completed
      const { data: ride, error } = await supabase
        .from('rides')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', rideId)
        .eq('driver_id', userId)
        .eq('status', 'started')
        .select('*, passenger:users!rides_passenger_id_fkey(id)')
        .single();

      if (error || !ride) {
        socket.emit('error', { message: 'Failed to complete ride or ride not found' });
        return;
      }

      // Notify passenger
      socket.to(`user:${ride.passenger_id}`).emit('ride:completed', {
        rideId,
        driverId: userId,
        completedAt: ride.completed_at
      });

      // Notify admin
      socket.to('role:admin').emit('ride:completed', {
        rideId,
        driverId: userId,
        passengerId: ride.passenger_id
      });

      socket.emit('ride:completed', { rideId });
      logger.info('Ride completed by driver', { userId, rideId });
    } catch (error) {
      logger.error('Failed to complete ride:', error);
      socket.emit('error', { message: 'Failed to complete ride' });
    }
  });
};

const handlePassengerEvents = (socket: AuthenticatedSocket, userId: string): void => {
  // Request ride
  socket.on('passenger:request_ride', async (data: any) => {
    try {
      // Create ride request in database
      const { data: ride, error } = await supabase
        .from('rides')
        .insert({
          passenger_id: userId,
          ...data,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        socket.emit('error', { message: 'Failed to create ride request' });
        return;
      }

      // Broadcast to nearby drivers
      socket.to('role:driver').emit('ride:new_request', ride);

      // Notify admin
      socket.to('role:admin').emit('ride:new_request', ride);

      socket.emit('ride:requested', { ride });
      logger.info('Ride requested by passenger', { userId, rideId: ride.id });
    } catch (error) {
      logger.error('Failed to request ride:', error);
      socket.emit('error', { message: 'Failed to request ride' });
    }
  });

  // Cancel ride
  socket.on('passenger:cancel_ride', async (data: { rideId: string }) => {
    try {
      const { rideId } = data;
      
      const { data: ride, error } = await supabase
        .from('rides')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', rideId)
        .eq('passenger_id', userId)
        .select()
        .single();

      if (error || !ride) {
        socket.emit('error', { message: 'Failed to cancel ride' });
        return;
      }

      // Notify driver if assigned
      if (ride.driver_id) {
        socket.to(`user:${ride.driver_id}`).emit('ride:cancelled', { rideId });
      }

      // Notify admin
      socket.to('role:admin').emit('ride:cancelled', { rideId, passengerId: userId });

      socket.emit('ride:cancelled', { rideId });
      logger.info('Ride cancelled by passenger', { userId, rideId });
    } catch (error) {
      logger.error('Failed to cancel ride:', error);
      socket.emit('error', { message: 'Failed to cancel ride' });
    }
  });
};

const handleBidEvents = (socket: AuthenticatedSocket, userId: string): void => {
  // Place new bid
  socket.on('bid:place', async (data: { rideId: string; amount: number }) => {
    try {
      const { rideId, amount } = data;

      if (typeof amount !== 'number' || amount <= 0) {
        socket.emit('error', { message: 'Invalid bid amount' });
        return;
      }

      // Create bid in database
      const { data: bid, error } = await supabase
        .from('bids')
        .insert({
          ride_id: rideId,
          driver_id: userId,
          amount,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        socket.emit('error', { message: 'Failed to place bid' });
        return;
      }

      // Notify passenger of new bid
      const { data: ride } = await supabase
        .from('rides')
        .select('passenger_id')
        .eq('id', rideId)
        .single();

      if (ride) {
        socket.to(`user:${ride.passenger_id}`).emit('bid:new', {
          bidId: bid.id,
          rideId,
          driverId: userId,
          amount,
          createdAt: bid.created_at
        });
      }

      // Notify admin
      socket.to('role:admin').emit('bid:new', {
        bidId: bid.id,
        rideId,
        driverId: userId,
        amount
      });

      socket.emit('bid:placed', { bidId: bid.id, bid });
      logger.info('Bid placed by driver', { userId, rideId, amount });
    } catch (error) {
      logger.error('Failed to place bid:', error);
      socket.emit('error', { message: 'Failed to place bid' });
    }
  });

  // Accept bid (passenger)
  socket.on('bid:accept', async (data: { bidId: string; rideId: string }) => {
    try {
      const { bidId, rideId } = data;

      // Update bid status
      const { data: bid, error: bidError } = await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', bidId)
        .select()
        .single();

      if (bidError || !bid) {
        socket.emit('error', { message: 'Failed to accept bid' });
        return;
      }

      // Update ride with accepted driver
      await supabase
        .from('rides')
        .update({
          driver_id: bid.driver_id,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', rideId);

      // Notify driver of accepted bid
      socket.to(`user:${bid.driver_id}`).emit('bid:accepted', {
        bidId,
        rideId,
        status: 'accepted'
      });

      // Notify admin
      socket.to('role:admin').emit('bid:accepted', {
        bidId,
        rideId,
        driverId: bid.driver_id
      });

      socket.emit('bid:accepted', { bidId, rideId });
      logger.info('Bid accepted by passenger', { passengerId: userId, bidId, rideId });
    } catch (error) {
      logger.error('Failed to accept bid:', error);
      socket.emit('error', { message: 'Failed to accept bid' });
    }
  });
};

const handleAdminEvents = (socket: AuthenticatedSocket, _userId: string): void => {
  // Get real-time statistics
  socket.on('admin:get_stats', async () => {
    try {
      const stats = {
        activeDrivers: Array.from(activeUsers.values()).filter(u => u.role === 'driver').length,
        activePassengers: Array.from(activeUsers.values()).filter(u => u.role === 'passenger').length,
        driverLocations: Array.from(driverLocations.entries()).map(([id, location]) => ({
          driverId: id,
          ...location
        }))
      };

      socket.emit('admin:stats', stats);
    } catch (error) {
      logger.error('Failed to get admin stats:', error);
      socket.emit('error', { message: 'Failed to get statistics' });
    }
  });
};

const handleCommonEvents = (socket: AuthenticatedSocket, _userId: string): void => {
  // Ping/pong for connection health
  socket.on('ping', () => {
    socket.emit('pong');
  });

  // Join specific rooms
  socket.on('join_room', (room: string) => {
    socket.join(room);
    socket.emit('joined_room', room);
  });

  // Leave specific rooms
  socket.on('leave_room', (room: string) => {
    socket.leave(room);
    socket.emit('left_room', room);
  });
};

// Utility functions to send messages to specific users
export const sendToUser = (io: SocketIOServer, userId: string, event: string, data: any): void => {
  io.to(`user:${userId}`).emit(event, data);
};

export const sendToRole = (io: SocketIOServer, role: string, event: string, data: any): void => {
  io.to(`role:${role}`).emit(event, data);
};

export const getActiveUsers = (): SocketUser[] => {
  return Array.from(activeUsers.values());
};

export const getDriverLocations = (): Map<string, { lat: number; lng: number; timestamp: number }> => {
  return driverLocations;
};
