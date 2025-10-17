# Rentauras X Backend - Quick Start Guide

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Docker (for Supabase and Redis)
- Git

## Installation & Setup

### 1. Clone and Install Dependencies

```bash
# Navigate to the project directory
cd c:\Users\User\rentauras-x-api

# Install dependencies
npm install
```

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your actual values
# Key variables to set:
# - SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
# - SUPABASE_ANON_KEY
# - JWT_SECRET
# - REDIS_URL
# - TWILIO_ACCOUNT_SID (optional)
# - TWILIO_AUTH_TOKEN (optional)
```

### 3. Start Prerequisites

#### Start Supabase (Local Development)

```bash
# Start Supabase
supabase start

# Get connection details
supabase status

# Apply database migrations
supabase db push
```

#### Start Redis

```bash
# Option 1: Using Docker
docker run -d -p 6379:6379 --name redis redis:alpine

# Option 2: Using local Redis installation
redis-server
```

### 4. Start Development Server

```bash
# Option 1: Automated setup (checks prerequisites)
npm run dev:setup

# Option 2: Manual start
npm run dev
```

The server will start on `http://localhost:3000`

## Verify Installation

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2025-10-17T...",
  "version": "1.0.0",
  "environment": "development"
}
```

### Access API Documentation

Open your browser and navigate to:
```
http://localhost:3000/api-docs
```

You'll see the interactive Swagger UI with all available endpoints.

## Testing Authentication

### 1. Send OTP

```bash
curl -X POST http://localhost:3000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+212612345678",
    "method": "sms",
    "type": "register"
  }'
```

### 2. Verify OTP (Register)

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

### 3. Get Current User

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Available Commands

```bash
# Development
npm run dev              # Start development server with hot reload
npm run dev:setup       # Start with prerequisite checks

# Build & Production
npm run build           # Compile TypeScript to JavaScript
npm start               # Start production server

# Database
npm run db:migrate      # Apply database migrations
npm run db:seed         # Seed database with sample data
npm run db:check        # Check database connection

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
npm test                # Run tests
npm run test:watch      # Run tests in watch mode
```

## Project Structure

```
rentauras-x-api/
├── src/
│   ├── config/              # Configuration files
│   │   ├── supabase.ts      # Supabase client
│   │   ├── redis.ts         # Redis client
│   │   └── swagger-simple.ts # Swagger configuration
│   ├── controllers/         # Route controllers
│   │   ├── authController.ts
│   │   ├── ridesController.ts
│   │   ├── vehiclesController.ts
│   │   └── paymentsController.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.ts          # Authentication
│   │   ├── errorHandler.ts  # Error handling
│   │   └── rateLimiter.ts   # Rate limiting
│   ├── routes/              # API routes
│   │   ├── auth.ts
│   │   ├── rides.ts
│   │   ├── vehicles.ts
│   │   ├── payments.ts
│   │   ├── users.ts
│   │   └── notifications.ts
│   ├── services/            # External services
│   │   ├── twilioService.ts
│   │   ├── emailService.ts
│   │   └── socketService.ts
│   ├── types/               # TypeScript types
│   ├── utils/               # Utilities
│   │   └── logger.ts
│   └── index.ts             # Main application entry
├── supabase/
│   ├── migrations/          # Database migrations
│   └── README.md            # Database documentation
├── dist/                    # Compiled JavaScript
├── .env.example             # Environment variables template
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
└── README.md                # Project documentation
```

## Troubleshooting

### Supabase Connection Failed

```bash
# Check if Supabase is running
supabase status

# Restart Supabase
supabase stop && supabase start
```

### Redis Connection Failed

```bash
# Check Redis status
redis-cli ping

# Start Redis if not running
redis-server
```

### Port Already in Use

```bash
# Change port in .env
PORT=3001

# Or kill the process using port 3000
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### JWT Secret Missing

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to .env
JWT_SECRET=<generated_secret>
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| NODE_ENV | Environment | development |
| PORT | Server port | 3000 |
| SUPABASE_URL | Supabase URL | http://127.0.0.1:54321 |
| SUPABASE_SERVICE_ROLE_KEY | Service role key | eyJ... |
| SUPABASE_ANON_KEY | Anon key | eyJ... |
| JWT_SECRET | JWT signing secret | random_secret_key |
| REDIS_URL | Redis connection | redis://localhost:6379 |
| TWILIO_ACCOUNT_SID | Twilio account | AC... |
| TWILIO_AUTH_TOKEN | Twilio token | auth_token |

## Next Steps

1. **Explore API Documentation**: Visit `/api-docs` to see all available endpoints
2. **Test Endpoints**: Use Swagger UI to test API endpoints
3. **Read Documentation**: Check `BACKEND_SETUP.md` for detailed setup
4. **Implement Features**: Follow the development plan in `plan.md`

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `BACKEND_SETUP.md` for detailed information
3. Check logs in the console output
4. Review Supabase documentation: https://supabase.com/docs

---

**Happy coding! 🚀**

