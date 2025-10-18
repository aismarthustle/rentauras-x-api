# Socket.IO Usage Guide

## Quick Start

### 1. Server-Side (Already Configured)

Your backend is already set up with Socket.IO. The server:
- Listens on port 3000
- Requires JWT authentication
- Manages real-time events for drivers, passengers, and admins
- Broadcasts location updates and ride status changes

### 2. Client-Side Setup

#### For React Native (Mobile Apps)

```javascript
import io from 'socket.io-client';

// Initialize Socket.IO connection
const socket = io('http://localhost:3000', {
  auth: {
    token: jwtToken // Your JWT token from login
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

#### For Web (React/Next.js)

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useSocket(token) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const newSocket = io('http://localhost:3000', {
      auth: { token },
      transports: ['websocket']
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [token]);

  return socket;
}
```

---

## Event Reference

### Driver Events

#### Send Location Update
```javascript
socket.emit('driver:location_update', {
  lat: 33.5731,
  lng: -7.5898
});
```

#### Update Driver Status
```javascript
socket.emit('driver:status_update', {
  status: 'online' // 'online', 'offline', or 'busy'
});
```

#### Accept a Ride
```javascript
socket.emit('driver:accept_ride', {
  rideId: 'ride-123'
});

// Listen for confirmation
socket.on('ride:accepted', (data) => {
  console.log('Ride accepted:', data);
});
```

#### Listen for New Ride Requests
```javascript
socket.on('ride:new_request', (ride) => {
  console.log('New ride request:', ride);
  // Show notification to driver
});
```

---

### Passenger Events

#### Request a Ride
```javascript
socket.emit('passenger:request_ride', {
  pickupLat: 33.5731,
  pickupLng: -7.5898,
  dropoffLat: 33.5800,
  dropoffLng: -7.5900,
  vehicleType: 'classic_ev', // 'classic_ev', 'comfort_ev', 'express_ev'
  passengers: 1,
  womenOnly: false
});

// Listen for ride confirmation
socket.on('ride:requested', (data) => {
  console.log('Ride requested:', data);
});
```

#### Cancel a Ride
```javascript
socket.emit('passenger:cancel_ride', {
  rideId: 'ride-123'
});

// Listen for cancellation confirmation
socket.on('ride:cancelled', (data) => {
  console.log('Ride cancelled:', data);
});
```

#### Listen for Ride Acceptance
```javascript
socket.on('ride:accepted', (data) => {
  console.log('Driver accepted:', data);
  // Show driver info and location
});
```

---

### Admin Events

#### Get Real-time Statistics
```javascript
socket.emit('admin:get_stats');

// Listen for stats
socket.on('admin:stats', (stats) => {
  console.log('Active drivers:', stats.activeDrivers);
  console.log('Active passengers:', stats.activePassengers);
  console.log('Driver locations:', stats.driverLocations);
});
```

#### Listen for Driver Location Updates
```javascript
socket.on('driver:location_updated', (data) => {
  console.log('Driver location:', data);
  // Update map with driver location
});
```

#### Listen for Driver Status Changes
```javascript
socket.on('driver:status_updated', (data) => {
  console.log('Driver status:', data);
});
```

---

### Common Events

#### Health Check (Ping/Pong)
```javascript
socket.emit('ping');

socket.on('pong', () => {
  console.log('Connection is healthy');
});
```

#### Join a Custom Room
```javascript
socket.emit('join_room', 'ride-123');

socket.on('joined_room', (room) => {
  console.log('Joined room:', room);
});
```

#### Leave a Custom Room
```javascript
socket.emit('leave_room', 'ride-123');

socket.on('left_room', (room) => {
  console.log('Left room:', room);
});
```

---

## Real-World Example: Ride Booking Flow

### Passenger Side
```javascript
// 1. Request a ride
socket.emit('passenger:request_ride', {
  pickupLat: 33.5731,
  pickupLng: -7.5898,
  dropoffLat: 33.5800,
  dropoffLng: -7.5900,
  vehicleType: 'classic_ev'
});

// 2. Wait for driver acceptance
socket.on('ride:accepted', (data) => {
  console.log('Driver found:', data.driverId);
  
  // 3. Join ride-specific room for updates
  socket.emit('join_room', `ride:${data.rideId}`);
  
  // 4. Listen for driver location updates
  socket.on('driver:location_updated', (update) => {
    if (update.driverId === data.driverId) {
      updateMapWithDriverLocation(update.location);
    }
  });
});

// 5. Handle cancellation
socket.on('ride:cancelled', () => {
  console.log('Ride was cancelled');
});
```

### Driver Side
```javascript
// 1. Go online
socket.emit('driver:status_update', { status: 'online' });

// 2. Send location updates periodically
setInterval(() => {
  socket.emit('driver:location_update', {
    lat: currentLat,
    lng: currentLng
  });
}, 5000); // Every 5 seconds

// 3. Listen for ride requests
socket.on('ride:new_request', (ride) => {
  // Show ride details to driver
  showRideNotification(ride);
});

// 4. Accept a ride
socket.emit('driver:accept_ride', {
  rideId: ride.id
});

// 5. Listen for passenger cancellation
socket.on('ride:cancelled', (data) => {
  console.log('Passenger cancelled ride:', data.rideId);
});
```

---

## Error Handling

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Handle error appropriately
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Attempt to reconnect
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
  // Handle disconnection
});
```

---

## Best Practices

### 1. **Always Clean Up**
```javascript
useEffect(() => {
  return () => {
    socket?.disconnect();
  };
}, []);
```

### 2. **Handle Reconnection**
```javascript
socket.on('reconnect', () => {
  console.log('Reconnected to server');
  // Re-sync state if needed
});
```

### 3. **Debounce Location Updates**
```javascript
let lastUpdate = 0;
const DEBOUNCE_MS = 5000;

function sendLocationUpdate(lat, lng) {
  const now = Date.now();
  if (now - lastUpdate > DEBOUNCE_MS) {
    socket.emit('driver:location_update', { lat, lng });
    lastUpdate = now;
  }
}
```

### 4. **Validate Data**
```javascript
socket.on('ride:accepted', (data) => {
  if (!data.rideId || !data.driverId) {
    console.error('Invalid ride data');
    return;
  }
  // Process valid data
});
```

### 5. **Use TypeScript**
```typescript
interface LocationUpdate {
  lat: number;
  lng: number;
}

socket.emit('driver:location_update', {
  lat: 33.5731,
  lng: -7.5898
} as LocationUpdate);
```

---

## Troubleshooting

### Connection Issues
- Check if server is running on port 3000
- Verify JWT token is valid
- Check CORS configuration
- Ensure firewall allows WebSocket connections

### Event Not Received
- Verify event name is correct
- Check if user has permission for that event
- Ensure socket is connected before emitting

### Performance Issues
- Reduce location update frequency
- Use room-based broadcasting instead of global
- Implement event debouncing
- Monitor connection quality

---

## Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [Socket.IO Client API](https://socket.io/docs/client-api/)
- [Socket.IO Server API](https://socket.io/docs/server-api/)
- [WebSocket Best Practices](https://www.ably.io/topic/websockets)

