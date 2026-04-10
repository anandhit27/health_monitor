-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('asha_worker', 'health_official')),
  phone TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create health reports table
CREATE TABLE public.health_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_name TEXT NOT NULL,
  patient_age INTEGER NOT NULL CHECK (patient_age > 0 AND patient_age <= 150),
  patient_gender TEXT NOT NULL CHECK (patient_gender IN ('male', 'female', 'other')),
  symptoms TEXT[] NOT NULL,
  vitals JSONB NOT NULL, -- Store blood pressure, temperature, pulse, etc.
  patient_location TEXT NOT NULL,
  submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  risk_level TEXT NOT NULL DEFAULT 'pending' CHECK (risk_level IN ('low', 'medium', 'high', 'pending')),
  ml_prediction JSONB, -- Store ML model output
  notes TEXT,
  language TEXT NOT NULL DEFAULT 'english' CHECK (language IN ('english', 'hindi')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Health reports policies
CREATE POLICY "ASHA workers can view their own reports" 
  ON public.health_reports 
  FOR SELECT 
  USING (
    auth.uid() = submitted_by 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'health_official'
    )
  );

CREATE POLICY "ASHA workers can create reports" 
  ON public.health_reports 
  FOR INSERT 
  WITH CHECK (
    auth.uid() = submitted_by 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'asha_worker'
    )
  );

CREATE POLICY "Health officials can update risk levels" 
  ON public.health_reports 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() 
      AND role = 'health_official'
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_reports_updated_at
  BEFORE UPDATE ON public.health_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_health_reports_submitted_by ON public.health_reports(submitted_by);
CREATE INDEX idx_health_reports_risk_level ON public.health_reports(risk_level);
CREATE INDEX idx_health_reports_created_at ON public.health_reports(created_at);
CREATE INDEX idx_health_reports_location ON public.health_reports(patient_location);
CREATE INDEX idx_profiles_role ON public.profiles(role);