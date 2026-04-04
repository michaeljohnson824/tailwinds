-- ============================================
-- 1. Create tables
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  display_name text,
  default_aircraft_id uuid,
  medical_class integer,
  medical_expiration date,
  flight_review_date date,
  subscription_tier text NOT NULL DEFAULT 'free',
  preferences jsonb DEFAULT '{}',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.aircraft (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id),
  tail_number text NOT NULL,
  make_model text NOT NULL,
  year integer,
  home_airport text,
  hobbs_current numeric(10,1),
  tach_current numeric(10,1),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  aircraft_id uuid NOT NULL REFERENCES public.aircraft(id),
  pilot_id uuid NOT NULL REFERENCES public.profiles(id),
  date date NOT NULL,
  route_from text,
  route_to text,
  route_via text,
  hobbs_start numeric(10,1),
  hobbs_end numeric(10,1),
  tach_start numeric(10,1),
  tach_end numeric(10,1),
  total_time numeric(10,1),
  landings_day integer NOT NULL DEFAULT 0,
  landings_night integer NOT NULL DEFAULT 0,
  conditions text NOT NULL DEFAULT 'VFR',
  night_time numeric(10,1) DEFAULT 0,
  instrument_time numeric(10,1) DEFAULT 0,
  instrument_approaches integer NOT NULL DEFAULT 0,
  cross_country boolean NOT NULL DEFAULT false,
  pic_time numeric(10,1) DEFAULT 0,
  sic_time numeric(10,1) DEFAULT 0,
  dual_given numeric(10,1) DEFAULT 0,
  dual_received numeric(10,1) DEFAULT 0,
  fuel_gallons numeric(10,1),
  fuel_price_per_gallon numeric(10,2),
  fuel_total_cost numeric(10,2),
  remarks text,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

-- Add foreign key for default_aircraft_id after aircraft table exists
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_default_aircraft_id_fkey
  FOREIGN KEY (default_aircraft_id) REFERENCES public.aircraft(id)
  ON DELETE SET NULL;

-- ============================================
-- 2. Enable Row Level Security
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aircraft ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS Policies — profiles
-- ============================================

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- 4. RLS Policies — aircraft
-- ============================================

CREATE POLICY "Users can view own aircraft"
  ON public.aircraft FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own aircraft"
  ON public.aircraft FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own aircraft"
  ON public.aircraft FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own aircraft"
  ON public.aircraft FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================
-- 5. RLS Policies — flights
-- ============================================

CREATE POLICY "Users can view own flights"
  ON public.flights FOR SELECT
  USING (auth.uid() = pilot_id);

CREATE POLICY "Users can insert own flights"
  ON public.flights FOR INSERT
  WITH CHECK (auth.uid() = pilot_id);

CREATE POLICY "Users can update own flights"
  ON public.flights FOR UPDATE
  USING (auth.uid() = pilot_id);

CREATE POLICY "Users can delete own flights"
  ON public.flights FOR DELETE
  USING (auth.uid() = pilot_id);

-- ============================================
-- 6. Profile sync trigger
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
