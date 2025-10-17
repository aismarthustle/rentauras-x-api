-- Create vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  color VARCHAR(50),
  license_plate VARCHAR(20) UNIQUE NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('classic_ev', 'comfort_ev', 'express_ev')),
  is_electric BOOLEAN DEFAULT TRUE,
  is_hybrid BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
  photos TEXT[] DEFAULT ARRAY[]::TEXT[],
  registration_number VARCHAR(50),
  insurance_expiry DATE,
  inspection_expiry DATE,
  seats INTEGER DEFAULT 4,
  ac_available BOOLEAN DEFAULT TRUE,
  wifi_available BOOLEAN DEFAULT FALSE,
  usb_charging BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_vehicles_driver_id ON public.vehicles(driver_id);
CREATE INDEX idx_vehicles_category ON public.vehicles(category);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_license_plate ON public.vehicles(license_plate);

-- Enable Row Level Security
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Drivers can view their own vehicles
CREATE POLICY "Drivers can view their own vehicles"
  ON public.vehicles FOR SELECT
  USING (driver_id = auth.uid()::uuid OR 
         (SELECT role FROM public.users WHERE id = auth.uid()::uuid) = 'admin');

-- RLS Policy: Drivers can insert their own vehicles
CREATE POLICY "Drivers can insert their own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (driver_id = auth.uid()::uuid);

-- RLS Policy: Drivers can update their own vehicles
CREATE POLICY "Drivers can update their own vehicles"
  ON public.vehicles FOR UPDATE
  USING (driver_id = auth.uid()::uuid)
  WITH CHECK (driver_id = auth.uid()::uuid);

-- RLS Policy: Drivers can delete their own vehicles
CREATE POLICY "Drivers can delete their own vehicles"
  ON public.vehicles FOR DELETE
  USING (driver_id = auth.uid()::uuid);

-- Create trigger for updated_at
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

