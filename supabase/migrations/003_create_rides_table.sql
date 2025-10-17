-- Create rides table
CREATE TABLE IF NOT EXISTS public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passenger_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')),
  category VARCHAR(50) NOT NULL CHECK (category IN ('classic_ev', 'comfort_ev', 'express_ev')),
  pickup_latitude DECIMAL(10, 8) NOT NULL,
  pickup_longitude DECIMAL(11, 8) NOT NULL,
  pickup_address TEXT NOT NULL,
  dropoff_latitude DECIMAL(10, 8) NOT NULL,
  dropoff_longitude DECIMAL(11, 8) NOT NULL,
  dropoff_address TEXT NOT NULL,
  estimated_price DECIMAL(10, 2) NOT NULL,
  final_price DECIMAL(10, 2),
  distance_km DECIMAL(10, 2) NOT NULL,
  duration_minutes INTEGER,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  women_only BOOLEAN DEFAULT FALSE,
  passenger_count INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_rides_passenger_id ON public.rides(passenger_id);
CREATE INDEX idx_rides_driver_id ON public.rides(driver_id);
CREATE INDEX idx_rides_vehicle_id ON public.rides(vehicle_id);
CREATE INDEX idx_rides_status ON public.rides(status);
CREATE INDEX idx_rides_category ON public.rides(category);
CREATE INDEX idx_rides_created_at ON public.rides(created_at);
CREATE INDEX idx_rides_scheduled_at ON public.rides(scheduled_at);

-- Enable Row Level Security
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own rides
CREATE POLICY "Users can view their own rides"
  ON public.rides FOR SELECT
  USING (passenger_id = auth.uid()::uuid OR 
         driver_id = auth.uid()::uuid OR
         (SELECT role FROM public.users WHERE id = auth.uid()::uuid) = 'admin');

-- RLS Policy: Passengers can create rides
CREATE POLICY "Passengers can create rides"
  ON public.rides FOR INSERT
  WITH CHECK (passenger_id = auth.uid()::uuid);

-- RLS Policy: Drivers can update ride status
CREATE POLICY "Drivers can update ride status"
  ON public.rides FOR UPDATE
  USING (driver_id = auth.uid()::uuid OR passenger_id = auth.uid()::uuid)
  WITH CHECK (driver_id = auth.uid()::uuid OR passenger_id = auth.uid()::uuid);

-- Create trigger for updated_at
CREATE TRIGGER update_rides_updated_at
  BEFORE UPDATE ON public.rides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

