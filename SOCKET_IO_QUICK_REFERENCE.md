# Socket.IO Quick Reference Card

## 🚀 Quick Start

### Start Server
```bash
npm run dev
```

### Test Connection
```bash
node test-socket-io-simple.js
```

---

## 📡 Connection

### JavaScript/React
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: jwtToken },
  transports: ['websocket']
});
```

### React Native
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: { token: jwtToken },
  transports: ['websocket'],
  reconnection: true
});
```

---

## 🚗 Driver Events

| Event | Emit | Listen |
|-------|------|--------|
| **Location Update** | `driver:location_update` | - |
| **Status Update** | `driver:status_update` | `driver:status_updated` |
| **Accept Ride** | `driver:accept_ride` | `ride:accepted` |
| **New Request** | - | `ride:new_request` |

### Examples
```javascript
// Send location
socket.emit('driver:location_update', { lat: 33.57, lng: -7.59 });

// Update status
socket.emit('driver:status_update', { status: 'online' });

// Accept ride
socket.emit('driver:accept_ride', { rideId: 'ride-123' });

// Listen for new requests
socket.on('ride:new_request', (ride) => {
  console.log('New ride:', ride);
});
```

---

## 👤 Passenger Events

| Event | Emit | Listen |
|-------|------|--------|
| **Request Ride** | `passenger:request_ride` | `ride:requested` |
| **Cancel Ride** | `passenger:cancel_ride` | `ride:cancelled` |
| **Ride Accepted** | - | `ride:accepted` |

### Examples
```javascript
// Request ride
socket.emit('passenger:request_ride', {
  pickupLat: 33.57,
  pickupLng: -7.59,
  dropoffLat: 33.58,
  dropoffLng: -7.60,
  vehicleType: 'classic_ev'
});

// Cancel ride
socket.emit('passenger:cancel_ride', { rideId: 'ride-123' });

// Listen for acceptance
socket.on('ride:accepted', (data) => {
  console.log('Driver:', data.driverId);
});
```

---

## 👨‍💼 Admin Events

| Event | Emit | Listen |
|-------|------|--------|
| **Get Stats** | `admin:get_stats` | `admin:stats` |
| **Driver Location** | - | `driver:location_updated` |
| **Driver Status** | - | `driver:status_updated` |

### Examples
```javascript
// Get statistics
socket.emit('admin:get_stats');

socket.on('admin:stats', (stats) => {
  console.log('Active drivers:', stats.activeDrivers);
  console.log('Locations:', stats.driverLocations);
});

// Listen for updates
socket.on('driver:location_updated', (data) => {
  console.log('Driver location:', data.location);
});
```

---

## 🔧 Common Events

```javascript
// Health check
socket.emit('ping');
socket.on('pong', () => console.log('OK'));

// Join room
socket.emit('join_room', 'ride-123');
socket.on('joined_room', (room) => console.log('Joined:', room));

// Leave room
socket.emit('leave_room', 'ride-123');
socket.on('left_room', (room) => console.log('Left:', room));
```

---

## 🔐 Connection Events

```javascript
// Connected
socket.on('connect', () => {
  console.log('Connected');
});

// Disconnected
socket.on('disconnect', () => {
  console.log('Disconnected');
});

// Error
socket.on('error', (error) => {
  console.error('Error:', error);
});

// Connection error
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

---

## 📊 Server Info

| Property | Value |
|----------|-------|
| **URL** | http://localhost:3000 |
| **Port** | 3000 |
| **Protocol** | WebSocket |
| **Auth** | JWT Token |
| **CORS** | Enabled |

---

## 🔑 Environment Variables

```env
SOCKET_CORS_ORIGIN=*
SOCKET_CORS_METHODS=GET,POST
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
PORT=3000
```

---

## 📚 Documentation Files

- `SOCKET_IO_TEST_REPORT.md` - Detailed test results
- `SOCKET_IO_USAGE_GUIDE.md` - Complete usage guide
- `SOCKET_IO_SETUP_SUMMARY.md` - Setup overview
- `SOCKET_IO_TEST_RESULTS.md` - Test execution details
- `SOCKET_IO_QUICK_REFERENCE.md` - This file

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check if server is running on port 3000 |
| Auth token required | Pass JWT token in auth object |
| Invalid token | Verify token is signed with correct secret |
| User not found | Create user in database first |
| Event not received | Check event name and permissions |

---

## 💡 Tips

1. **Always pass JWT token** when connecting
2. **Handle reconnection** in production
3. **Debounce location updates** to reduce traffic
4. **Validate data** before processing
5. **Clean up listeners** when component unmounts
6. **Use TypeScript** for type safety
7. **Monitor connection quality** in production

---

## 🔗 Resources

- [Socket.IO Docs](https://socket.io/docs/)
- [Socket.IO Client API](https://socket.io/docs/client-api/)
- [WebSocket Best Practices](https://www.ably.io/topic/websockets)

---

## ✅ Status

**Socket.IO:** ✅ Operational  
**Server:** ✅ Running  
**Authentication:** ✅ Enabled  
**All Features:** ✅ Ready

---

**Last Updated:** October 18, 2025  
**Version:** 1.0.0

