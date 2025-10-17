-- Create ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  rater_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ratee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  categories JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ride_id, rater_id)
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES public.rides(id) ON DELETE SET NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('bug', 'feature_request', 'complaint', 'compliment')),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create driver documents table
CREATE TABLE IF NOT EXISTS public.driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('license', 'id_card', 'registration', 'insurance', 'inspection')),
  document_url TEXT NOT NULL,
  expiry_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  rejection_reason TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ratings_ride_id ON public.ratings(ride_id);
CREATE INDEX idx_ratings_rater_id ON public.ratings(rater_id);
CREATE INDEX idx_ratings_ratee_id ON public.ratings(ratee_id);
CREATE INDEX idx_ratings_created_at ON public.ratings(created_at);
CREATE INDEX idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX idx_feedback_status ON public.feedback(status);
CREATE INDEX idx_feedback_type ON public.feedback(type);
CREATE INDEX idx_driver_documents_driver_id ON public.driver_documents(driver_id);
CREATE INDEX idx_driver_documents_status ON public.driver_documents(status);
CREATE INDEX idx_driver_documents_document_type ON public.driver_documents(document_type);

-- Enable Row Level Security
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ratings
CREATE POLICY "Users can view ratings for their rides"
  ON public.ratings FOR SELECT
  USING ((SELECT passenger_id FROM public.rides WHERE id = ride_id) = auth.uid()::uuid OR
         (SELECT driver_id FROM public.rides WHERE id = ride_id) = auth.uid()::uuid OR
         (SELECT role FROM public.users WHERE id = auth.uid()::uuid) = 'admin');

CREATE POLICY "Users can create ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (rater_id = auth.uid()::uuid);

-- RLS Policies for feedback
CREATE POLICY "Users can view their own feedback"
  ON public.feedback FOR SELECT
  USING (user_id = auth.uid()::uuid OR
         (SELECT role FROM public.users WHERE id = auth.uid()::uuid) = 'admin');

CREATE POLICY "Users can create feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (user_id = auth.uid()::uuid);

-- RLS Policies for driver documents
CREATE POLICY "Drivers can view their own documents"
  ON public.driver_documents FOR SELECT
  USING (driver_id = auth.uid()::uuid OR
         (SELECT role FROM public.users WHERE id = auth.uid()::uuid) = 'admin');

CREATE POLICY "Drivers can upload documents"
  ON public.driver_documents FOR INSERT
  WITH CHECK (driver_id = auth.uid()::uuid);

-- Create triggers
CREATE TRIGGER update_ratings_updated_at
  BEFORE UPDATE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON public.feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_driver_documents_updated_at
  BEFORE UPDATE ON public.driver_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

