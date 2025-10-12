# Rentauras X Backend API

Backend API server for Rentauras X - Morocco's premier electric vehicle ride-sharing platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (for local Supabase)
- Redis server

### Installation

1. **Clone and navigate to backend directory**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your actual values
```

4. **Start Supabase (if not already running)**
```bash
cd ../
supabase start
```

5. **Start Redis (if not already running)**
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or using local Redis installation
redis-server
```

6. **Start the development server**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── index.ts         # Main application entry
├── dist/                # Compiled JavaScript (generated)
├── logs/                # Log files (generated)
└── package.json
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/send-otp` - Send OTP via SMS/WhatsApp/Email
- `POST /api/v1/auth/verify-otp` - Verify OTP and login/register
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user profile
- `PUT /api/v1/auth/me` - Update user profile

### Users
- `GET /api/v1/users` - Get all users (admin only)
- `GET /api/v1/users/:id` - Get user by ID

### Rides
- `GET /api/v1/rides` - Get user's rides
- `POST /api/v1/rides` - Create ride request

### Vehicles
- `GET /api/v1/vehicles` - Get driver's vehicles
- `POST /api/v1/vehicles` - Add new vehicle

### Payments
- `GET /api/v1/payments` - Get payment history
- `POST /api/v1/payments` - Process payment

### Notifications
- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/:id/read` - Mark notification as read

## 🔐 Authentication

The API uses JWT tokens for authentication:

1. **Send OTP**: Request OTP via SMS, WhatsApp, or Email
2. **Verify OTP**: Submit OTP to receive access and refresh tokens
3. **Use Access Token**: Include in Authorization header: `Bearer <token>`
4. **Refresh Token**: Use refresh token to get new access token when expired

## 🔌 WebSocket Events

### Driver Events
- `driver:location_update` - Update driver location
- `driver:status_update` - Update driver status (online/offline/busy)
- `driver:accept_ride` - Accept ride request

### Passenger Events  
- `passenger:request_ride` - Request new ride
- `passenger:cancel_ride` - Cancel ride request

### Admin Events
- `admin:get_stats` - Get real-time statistics

## 🛠️ Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Server
NODE_ENV=development
PORT=3000

# Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-key

# JWT
JWT_SECRET=your-jwt-secret

# External Services
TWILIO_ACCOUNT_SID=your-twilio-sid
GOOGLE_MAPS_API_KEY=your-maps-key

# Redis
REDIS_URL=redis://localhost:6379
```

## 🔍 Logging

Logs are written to:
- Console (development)
- `logs/combined.log` (production)
- `logs/error.log` (errors only)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

1. **Build the application**
```bash
npm run build
```

2. **Set production environment variables**

3. **Start the production server**
```bash
npm start
```

## 📊 Health Check

Check server health at: `GET /health`

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

## 🤝 Contributing

1. Follow TypeScript best practices
2. Use ESLint configuration
3. Write tests for new features
4. Update documentation

## 📝 License

MIT License - see LICENSE file for details
