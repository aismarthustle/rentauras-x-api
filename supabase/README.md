# Rentauras X - Supabase Database Setup

This directory contains all database migrations and configuration for the Rentauras X backend.

## Database Schema Overview

### Tables

1. **users** - User profiles (passengers, drivers, admins)
   - Stores user information, roles, and verification status
   - RLS policies for privacy and admin access

2. **vehicles** - Driver vehicles
   - Vehicle details, category, and status
   - Photos and amenities information
   - Insurance and inspection tracking

3. **rides** - Ride requests and bookings
   - Pickup/dropoff locations and addresses
   - Pricing and duration information
   - Status tracking (pending, accepted, in_progress, completed, cancelled)

4. **wallets** - User wallet balances
   - Current balance for each user
   - Currency support

5. **payments** - Payment transactions
   - Ride payments and wallet transactions
   - Multiple payment methods support
   - Transaction tracking

6. **wallet_transactions** - Wallet transaction history
   - Credit/debit transactions
   - Audit trail for wallet operations

7. **ratings** - Ride ratings and reviews
   - Bidirectional ratings (passenger ↔ driver)
   - Comments and category ratings

8. **feedback** - User feedback and bug reports
   - Feature requests, complaints, compliments
   - Status and priority tracking

9. **driver_documents** - Driver verification documents
   - License, ID, registration, insurance, inspection
   - Verification status and expiry tracking

## Migration Order

Migrations should be applied in order:

1. `001_create_users_table.sql` - Base user table
2. `002_create_vehicles_table.sql` - Vehicles (depends on users)
3. `003_create_rides_table.sql` - Rides (depends on users, vehicles)
4. `004_create_payments_and_wallet_tables.sql` - Payments (depends on users, rides)
5. `005_create_ratings_and_feedback_tables.sql` - Ratings (depends on users, rides)

## Applying Migrations

### Using Supabase CLI

```bash
# Start Supabase locally
supabase start

# Apply migrations
supabase db push

# Reset database (development only)
supabase db reset
```

### Manual Application

1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file in order
4. Execute each migration

## Row Level Security (RLS)

All tables have RLS enabled with policies for:
- **Users**: Can view/update their own data
- **Admins**: Can view/update all data
- **Drivers**: Can manage their own vehicles and documents
- **Passengers**: Can create and view their own rides

## Key Features

### Automatic Timestamps
- `created_at` - Set on record creation
- `updated_at` - Automatically updated on any change

### Indexes
- Optimized for common queries
- Foreign key indexes for relationships
- Status and date indexes for filtering

### Constraints
- Unique constraints on email, phone, license plate
- Check constraints for valid enum values
- Foreign key constraints for referential integrity

## Environment Setup

### Local Development

```bash
# Start Supabase
supabase start

# Get connection details
supabase status

# Connect to database
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Production

Use Supabase hosted database with:
- Automatic backups
- Point-in-time recovery
- SSL connections
- Connection pooling

## Backup & Recovery

### Backup
```bash
# Automatic daily backups in Supabase
# Manual backup via CLI
supabase db pull
```

### Recovery
```bash
# Restore from backup
supabase db push
```

## Monitoring

Monitor database health:
- Query performance
- Connection count
- Storage usage
- Replication lag

## Support

For issues or questions about the database schema, refer to:
- Supabase Documentation: https://supabase.com/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/

