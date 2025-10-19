# 🚀 Rentauras X Backend Setup Guide

This guide will help you set up the Express.js backend server for Rentauras X.

## ✅ What We've Built

The backend includes:

- **Express.js + TypeScript** server with comprehensive middleware
- **Authentication system** with OTP (SMS/WhatsApp/Email) 
- **JWT token management** with refresh tokens
- **Socket.IO** for real-time features
- **Rate limiting** and security middleware
- **Supabase integration** for database operations
- **Redis integration** for caching and sessions
- **Twilio integration** for SMS/WhatsApp
- **Email service** with nodemailer
- **Comprehensive error handling** and logging
- **Role-based authorization** (passenger/driver/admin)
- **Swagger OpenAPI documentation** with interactive UI

## 🏗️ Architecture Overview

```
Backend Structure:
├── src/
│   ├── config/          # Supabase, Redis configuration
│   ├── controllers/     # Route controllers (auth implemented)
│   ├── middleware/      # Auth, rate limiting, error handling
│   ├── routes/          # API routes (auth complete, others stubbed)
│   ├── services/        # External services (Twilio, Email, Socket.IO)
│   ├── utils/           # Logger and utilities
│   └── index.ts         # Main application entry
```

## 🚀 Quick Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```bash
# Essential for basic functionality
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=your-service-key
SUPABASE_ANON_KEY=your-anon-key
JWT_SECRET=your-super-secret-jwt-key
REDIS_URL=redis://localhost:6379

# Optional for full functionality
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Start Prerequisites

**Start Supabase:**
```bash
cd ..
supabase start
```

**Start Redis:**
```bash
# Option 1: Docker
docker run -d -p 6379:6379 redis:alpine

# Option 2: Local Redis
redis-server
```

### 4. Setup API Documentation (Optional)

```bash
# Install Swagger dependencies
npm install swagger-ui-express swagger-jsdoc
npm install --save-dev @types/swagger-ui-express @types/swagger-jsdoc

# Follow integration instructions in swagger-integration.md
```

### 5. Start Development Server

```bash
# Automated setup (checks prerequisites)
npm run dev:setup

# OR manual start
npm run dev
```

## 🔧 Available Endpoints

### ✅ Authentication (Fully Implemented)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|---------|
| POST | `/api/v1/auth/send-otp` | Send OTP via SMS/WhatsApp/Email | ✅ Complete |
| POST | `/api/v1/auth/verify-otp` | Verify OTP and login/register | ✅ Complete |
| POST | `/api/v1/auth/refresh-token` | Refresh access token | ✅ Complete |
| POST | `/api/v1/auth/logout` | Logout user | ✅ Complete |
| GET | `/api/v1/auth/me` | Get current user profile | ✅ Complete |
| PUT | `/api/v1/auth/me` | Update user profile | ✅ Complete |

### 🔄 Other Endpoints (Stubbed)

| Method | Endpoint | Description | Status |
|--------|----------|-------------|---------|
| GET | `/api/v1/users` | Get all users (admin) | 🔄 Stubbed |
| GET | `/api/v1/rides` | Get user's rides | 🔄 Stubbed |
| POST | `/api/v1/rides` | Create ride request | 🔄 Stubbed |
| GET | `/api/v1/vehicles` | Get driver's vehicles | 🔄 Stubbed |
| POST | `/api/v1/vehicles` | Add new vehicle | 🔄 Stubbed |
| GET | `/api/v1/payments` | Get payment history | 🔄 Stubbed |
| POST | `/api/v1/payments` | Process payment | 🔄 Stubbed |

## 🧪 Testing the Authentication

### 1. Health Check
```bash
curl http://localhost:3000/health
```

### 2. Send OTP
```bash
curl -X POST http://localhost:3000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+212612345678",
    "method": "sms",
    "type": "register"
  }'
```

### 3. Verify OTP (Register)
```bash
curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+212612345678",
    "otp": "123456",
    "type": "register",
    "full_name": "Test User",
    "role": "passenger"
  }'
```

### 4. Use Access Token
```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🔌 WebSocket Testing

Connect to `ws://localhost:3000` with authentication:

```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'YOUR_ACCESS_TOKEN'
  }
});

// Driver location update
socket.emit('driver:location_update', {
  lat: 33.5731,
  lng: -7.5898
});

// Request ride (passenger)
socket.emit('passenger:request_ride', {
  pickup_latitude: 33.5731,
  pickup_longitude: -7.5898,
  dropoff_latitude: 33.5831,
  dropoff_longitude: -7.5998,
  category: 'classic_ev'
});
```

## 🔐 Security Features

- **Rate limiting** on all endpoints
- **Strict rate limiting** on auth endpoints
- **JWT token validation** with user status checks
- **Role-based authorization** middleware
- **Input validation** with express-validator
- **CORS protection** with configurable origins
- **Helmet.js** for security headers
- **Redis-based** session management

## 📊 Monitoring

- **Winston logging** with different levels
- **Health check** endpoint at `/health`
- **Error tracking** with detailed logging
- **Request logging** with Morgan

## 🔄 Next Steps

1. **Implement remaining controllers:**
   - Users management
   - Ride booking system
   - Vehicle management
   - Payment processing
   - Notifications

2. **Add external integrations:**
   - Google Maps API
   - CMI Payment Gateway
   - Firebase Cloud Messaging

3. **Enhance real-time features:**
   - Live ride tracking
   - Driver matching algorithm
   - Bid system for rides

4. **Add testing:**
   - Unit tests for controllers
   - Integration tests for APIs
   - Socket.IO event testing

## 🐛 Troubleshooting

### Common Issues

**1. Supabase Connection Failed**
```bash
# Check if Supabase is running
supabase status

# Restart if needed
supabase stop && supabase start
```

**2. Redis Connection Failed**
```bash
# Check Redis status
redis-cli ping

# Start Redis if not running
redis-server
```

**3. JWT Secret Missing**
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**4. OTP Not Sending**
- Check Twilio credentials in `.env`
- Verify phone number format (+212...)
- Check SMTP settings for email

## 📚 Documentation

- **API Documentation**: Interactive Swagger UI at `/api-docs`
- **OpenAPI Specification**: Complete API schema with examples
- **Socket.IO Events**: Real-time communication docs
- **Database Schema**: See `supabase/migrations/`
- **Environment Variables**: See `.env.example`

### 🔗 API Documentation Access

Once your server is running, access the interactive API documentation at:
- **Development**: `http://localhost:3000/api-docs`
- **Production**: `https://rentauras-x-api.vercel.app/api-docs`

The Swagger UI provides:
- ✅ Interactive API testing
- ✅ Complete request/response schemas
- ✅ Authentication testing with JWT tokens
- ✅ Real-time API validation
- ✅ Code examples in multiple languages

## 🎯 Current Status

✅ **Completed:**
- Express.js server setup with TypeScript
- Authentication system (OTP-based)
- JWT token management
- Socket.IO real-time communication
- Rate limiting and security
- Supabase integration
- Redis caching
- External service integrations (Twilio, Email)
- Comprehensive error handling
- Logging system
- Swagger OpenAPI documentation with interactive UI

🔄 **Next Phase:**
- Implement remaining business logic controllers
- Add Google Maps integration
- Implement payment processing
- Add comprehensive testing
- Deploy to production

The backend foundation is solid and ready for the next phase of development!
