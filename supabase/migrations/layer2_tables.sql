-- Layer 2: Add Stripe columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_price_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_current_period_end timestamp;

-- Layer 2: Create engines table
CREATE TABLE IF NOT EXISTS engines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  aircraft_id uuid NOT NULL,
  position text DEFAULT 'single' NOT NULL,
  make_model text,
  serial_number text,
  tbo_hours integer,
  tsmoh numeric(10, 1),
  overhaul_cost_estimate numeric(10, 2),
  last_oil_change_tach numeric(10, 1),
  oil_change_interval_hours integer,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT engines_aircraft_id_aircraft_id_fk FOREIGN KEY (aircraft_id) REFERENCES public.aircraft(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Layer 2: Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  aircraft_id uuid NOT NULL,
  recorded_by uuid NOT NULL,
  category text NOT NULL,
  description text,
  amount numeric(10, 2) NOT NULL,
  date date NOT NULL,
  is_recurring boolean DEFAULT false NOT NULL,
  recurrence_interval text,
  receipt_url text,
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT expenses_aircraft_id_aircraft_id_fk FOREIGN KEY (aircraft_id) REFERENCES public.aircraft(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT expenses_recorded_by_profiles_id_fk FOREIGN KEY (recorded_by) REFERENCES public.profiles(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- Layer 2: Create cost_profiles table
CREATE TABLE IF NOT EXISTS cost_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  aircraft_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  hangar_monthly numeric(10, 2) DEFAULT '0',
  insurance_monthly numeric(10, 2) DEFAULT '0',
  annual_estimate numeric(10, 2) DEFAULT '0',
  loan_monthly numeric(10, 2) DEFAULT '0',
  subscriptions_monthly numeric(10, 2) DEFAULT '0',
  engine_reserve_per_hour numeric(10, 2) DEFAULT '0',
  created_at timestamp DEFAULT now() NOT NULL,
  updated_at timestamp DEFAULT now() NOT NULL,
  CONSTRAINT cost_profiles_aircraft_id_aircraft_id_fk FOREIGN KEY (aircraft_id) REFERENCES public.aircraft(id) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT cost_profiles_owner_id_profiles_id_fk FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE NO ACTION ON UPDATE NO ACTION
);
