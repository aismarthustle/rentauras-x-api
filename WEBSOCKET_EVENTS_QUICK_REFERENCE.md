# WebSocket Events - Quick Reference

## 🚗 Ride Events

### Driver: Start Ride
```javascript
socket.emit('driver:start_ride', {
  rideId: 'ride-123'
});

// Listen for confirmation
socket.on('ride:started', (data) => {
  console.log('Ride started:', data.rideId);
});
```

### Driver: Complete Ride
```javascript
socket.emit('driver:complete_ride', {
  rideId: 'ride-123'
});

// Listen for confirmation
socket.on('ride:completed', (data) => {
  console.log('Ride completed:', data.rideId);
});
```

### Passenger: Listen for Ride Started
```javascript
socket.on('ride:started', (data) => {
  console.log('Driver started your ride:', data.driverId);
  console.log('Started at:', data.startedAt);
});
```

### Passenger: Listen for Ride Completed
```javascript
socket.on('ride:completed', (data) => {
  console.log('Your ride is complete!');
  console.log('Completed at:', data.completedAt);
});
```

### Admin: Listen for All Ride Events
```javascript
socket.on('ride:started', (data) => {
  console.log('Ride started:', data.rideId, 'Driver:', data.driverId);
});

socket.on('ride:completed', (data) => {
  console.log('Ride completed:', data.rideId);
});

socket.on('ride:new_request', (data) => {
  console.log('New ride request:', data.rideId);
});

socket.on('ride:cancelled', (data) => {
  console.log('Ride cancelled:', data.rideId);
});
```

---

## 💰 Bid Events

### Driver: Place Bid
```javascript
socket.emit('bid:place', {
  rideId: 'ride-123',
  amount: 50.00
});

// Listen for confirmation
socket.on('bid:placed', (data) => {
  console.log('Bid placed:', data.bidId);
});
```

### Passenger: Listen for New Bids
```javascript
socket.on('bid:new', (data) => {
  console.log('New bid from driver:', data.driverId);
  console.log('Amount:', data.amount);
  console.log('Bid ID:', data.bidId);
});
```

### Passenger: Accept Bid
```javascript
socket.emit('bid:accept', {
  bidId: 'bid-123',
  rideId: 'ride-123'
});

// Listen for confirmation
socket.on('bid:accepted', (data) => {
  console.log('Bid accepted:', data.bidId);
});
```

### Driver: Listen for Bid Acceptance
```javascript
socket.on('bid:accepted', (data) => {
  console.log('Your bid was accepted!');
  console.log('Ride ID:', data.rideId);
});
```

### Admin: Listen for All Bid Events
```javascript
socket.on('bid:new', (data) => {
  console.log('New bid:', data.bidId, 'Amount:', data.amount);
});

socket.on('bid:accepted', (data) => {
  console.log('Bid accepted:', data.bidId);
});
```

---

## 🚙 Driver Events

### Driver: Update Location
```javascript
socket.emit('driver:location_update', {
  lat: 33.5731,
  lng: -7.5898
});
```

### Driver: Update Status
```javascript
socket.emit('driver:status_update', {
  status: 'online' // 'online', 'offline', or 'busy'
});

// Listen for confirmation
socket.on('driver:status_updated', (data) => {
  console.log('Status updated:', data.status);
});
```

### Admin: Listen for Driver Updates
```javascript
socket.on('driver:location_updated', (data) => {
  console.log('Driver location:', data.driverId);
  console.log('Coordinates:', data.location);
});

socket.on('driver:status_updated', (data) => {
  console.log('Driver status:', data.driverId, data.status);
});
```

---

## 📊 Event Broadcasting Summary

| Event | Emitted By | Broadcast To | Use Case |
|-------|-----------|--------------|----------|
| `ride:new_request` | Passenger | Drivers, Admin | Notify drivers of new ride |
| `ride:accepted` | Driver | Passenger, Admin | Confirm ride acceptance |
| `ride:started` | Driver | Passenger, Admin | Notify ride has started |
| `ride:completed` | Driver | Passenger, Admin | Notify ride is complete |
| `ride:cancelled` | Passenger | Driver, Admin | Notify ride cancellation |
| `bid:new` | Driver | Passenger, Admin | Notify of new bid |
| `bid:accepted` | Passenger | Driver, Admin | Confirm bid acceptance |
| `driver:location_updated` | Driver | Admin | Track driver location |
| `driver:status_updated` | Driver | Admin, Driver | Track driver availability |

---

## Error Handling

All events include error handling. Listen for errors:

```javascript
socket.on('error', (data) => {
  console.error('Socket error:', data.message);
});
```

Common errors:
- "Invalid location data" - lat/lng not numbers
- "Invalid bid amount" - amount <= 0
- "Failed to accept ride" - ride not found or already accepted
- "Failed to place bid" - database error
- "Authentication token required" - no JWT provided
- "Invalid token or inactive user" - token invalid or user inactive

---

## Connection Example

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: jwtToken // Your JWT from login
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

