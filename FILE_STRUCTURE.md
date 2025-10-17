# Rentauras X Backend - File Structure & Documentation

## Project Root Files

### Documentation Files
- **`README.md`** - Main project documentation
- **`BACKEND_SETUP.md`** - Comprehensive backend setup guide
- **`QUICK_START.md`** - Quick start guide for developers
- **`BACKEND_IMPLEMENTATION_COMPLETE.md`** - Phase 1 implementation details
- **`IMPLEMENTATION_PROGRESS.md`** - Current implementation status
- **`PHASE_1_SUMMARY.md`** - Executive summary of Phase 1
- **`FILE_STRUCTURE.md`** - This file
- **`plan.md`** - Development plan with task tracking

### Configuration Files
- **`.env.example`** - Environment variables template
- **`package.json`** - NPM dependencies and scripts
- **`package-lock.json`** - Locked dependency versions
- **`tsconfig.json`** - TypeScript configuration
- **`nodemon.json`** - Development server configuration

### Build Output
- **`dist/`** - Compiled JavaScript (generated)

---

## Source Code Structure (`src/`)

### Configuration (`src/config/`)
- **`supabase.ts`** - Supabase client initialization
  - Service role and anon key clients
  - Database type definitions
  - Connection configuration

- **`redis.ts`** - Redis client initialization
  - Connection pooling
  - Reconnection strategy
  - Configuration options

- **`swagger-simple.ts`** - Swagger/OpenAPI configuration
  - API documentation setup
  - Swagger UI options
  - OpenAPI specification

### Controllers (`src/controllers/`)
- **`authController.ts`** - Authentication logic
  - OTP generation and verification
  - JWT token management
  - User registration and login
  - Profile management

- **`ridesController.ts`** - Ride management logic
  - Create ride requests
  - Get user rides
  - Update ride status
  - Cancel rides
  - Price calculation

- **`vehiclesController.ts`** - Vehicle management logic
  - Add/update/delete vehicles
  - Get driver vehicles
  - Vehicle details retrieval
  - Status management

- **`paymentsController.ts`** - Payment processing logic
  - Payment history
  - Wallet management
  - Transaction processing
  - Balance tracking

### Middleware (`src/middleware/`)
- **`auth.ts`** - Authentication middleware
  - JWT token verification
  - User extraction from token
  - Role-based authorization
  - Admin and driver role checks

- **`errorHandler.ts`** - Error handling middleware
  - Custom error classes
  - Error response formatting
  - Async error wrapper
  - HTTP status mapping

- **`rateLimiter.ts`** - Rate limiting middleware
  - OTP rate limiting (5 requests/minute)
  - General rate limiting (100 requests/15 minutes)
  - IP-based tracking

### Routes (`src/routes/`)
- **`auth.ts`** - Authentication endpoints
  - POST /send-otp
  - POST /verify-otp
  - POST /refresh-token
  - POST /logout
  - GET /me
  - PUT /me
  - POST /change-password
  - POST /forgot-password
  - POST /reset-password
  - DELETE /delete-account

- **`rides.ts`** - Ride endpoints (stubbed, ready for implementation)
  - GET /rides
  - POST /rides
  - GET /rides/:id
  - PUT /rides/:id/status
  - POST /rides/:id/cancel

- **`vehicles.ts`** - Vehicle endpoints (stubbed, ready for implementation)
  - GET /vehicles
  - POST /vehicles
  - GET /vehicles/:id
  - PUT /vehicles/:id
  - DELETE /vehicles/:id

- **`payments.ts`** - Payment endpoints (stubbed, ready for implementation)
  - GET /payments
  - GET /payments/wallet/balance
  - POST /payments/wallet/add-funds
  - POST /payments/ride/:id
  - GET /payments/wallet/transactions

- **`users.ts`** - User management endpoints (stubbed)
  - GET /users (admin only)

- **`notifications.ts`** - Notification endpoints (stubbed)

### Services (`src/services/`)
- **`twilioService.ts`** - Twilio integration
  - SMS sending
  - WhatsApp messaging
  - Error handling

- **`emailService.ts`** - Email service
  - Email sending via SMTP
  - HTML templates
  - Error handling

- **`socketService.ts`** - Socket.IO real-time events
  - Driver location updates
  - Ride request notifications
  - Real-time status updates

### Types (`src/types/`)
- **`auth.ts`** - Authentication type definitions
  - User interface
  - Auth state interface
  - Login credentials interface

### Utilities (`src/utils/`)
- **`logger.ts`** - Winston logging configuration
  - Console logging (development)
  - File logging (production)
  - Error logging
  - Log levels

### Main Entry Point
- **`index.ts`** - Application entry point
  - Express app initialization
  - Middleware setup
  - Route registration
  - Socket.IO initialization
  - Server startup

---

## Database Structure (`supabase/`)

### Migrations
- **`001_create_users_table.sql`** - Users table with RLS
  - User profiles
  - Role management
  - Verification tracking
  - Indexes and triggers

- **`002_create_vehicles_table.sql`** - Vehicles table with RLS
  - Vehicle details
  - Driver association
  - Category classification
  - Amenities tracking

- **`003_create_rides_table.sql`** - Rides table with RLS
  - Ride requests
  - Passenger/driver association
  - Location data
  - Status tracking

- **`004_create_payments_and_wallet_tables.sql`** - Payment system
  - Wallets table
  - Payments table
  - Wallet transactions table
  - RLS policies

- **`005_create_ratings_and_feedback_tables.sql`** - Reviews and feedback
  - Ratings table
  - Feedback table
  - Driver documents table
  - RLS policies

### Documentation
- **`README.md`** - Database setup and usage guide

---

## Scripts (`scripts/`)
- **`start-dev.js`** - Development startup script
  - Prerequisite checking
  - Supabase verification
  - Redis verification
  - Server startup

---

## Key Features by File

### Authentication Flow
1. `routes/auth.ts` - Defines endpoints
2. `controllers/authController.ts` - Implements logic
3. `middleware/auth.ts` - Validates tokens
4. `services/twilioService.ts` - Sends OTP
5. `services/emailService.ts` - Sends emails

### Ride Management Flow
1. `routes/rides.ts` - Defines endpoints
2. `controllers/ridesController.ts` - Implements logic
3. `supabase/migrations/003_*.sql` - Database schema
4. `middleware/auth.ts` - Validates user

### Payment Processing Flow
1. `routes/payments.ts` - Defines endpoints
2. `controllers/paymentsController.ts` - Implements logic
3. `supabase/migrations/004_*.sql` - Database schema
4. `middleware/auth.ts` - Validates user

---

## Environment Variables

See `.env.example` for complete list. Key variables:

```
NODE_ENV=development
PORT=3000
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
REDIS_URL=redis://localhost:6379
TWILIO_ACCOUNT_SID=...
```

---

## Dependencies

### Core
- `express` - Web framework
- `typescript` - Type safety
- `cors` - CORS middleware
- `helmet` - Security headers

### Database
- `@supabase/supabase-js` - Supabase client
- `redis` - Redis client

### Authentication
- `jsonwebtoken` - JWT tokens
- `bcryptjs` - Password hashing

### Real-time
- `socket.io` - WebSocket server

### External Services
- `twilio` - SMS/WhatsApp
- `nodemailer` - Email

### Utilities
- `morgan` - HTTP logging
- `compression` - Response compression
- `express-validator` - Input validation
- `winston` - Application logging

---

## Development Commands

```bash
npm run dev              # Start development server
npm run build           # Compile TypeScript
npm start               # Start production server
npm test                # Run tests
npm run lint            # Check code style
npm run db:migrate      # Apply migrations
```

---

## API Documentation

Interactive Swagger UI available at:
```
http://localhost:3000/api-docs
```

---

## Next Steps

1. Review `QUICK_START.md` to get started
2. Check `BACKEND_SETUP.md` for detailed setup
3. Explore `supabase/README.md` for database info
4. Read `PHASE_1_SUMMARY.md` for overview
5. Access `/api-docs` for API documentation

---

*Last Updated: October 17, 2025*

