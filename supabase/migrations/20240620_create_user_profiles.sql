-- Create user_profiles table to store additional sign up information
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  country TEXT NOT NULL,
  reason_for_use TEXT NOT NULL,
  referral_source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create a policy to enable insert for authenticated users
CREATE POLICY "Enable all users to insert their own profile"
  ON public.user_profiles
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
  
-- Create a policy to enable users to read their own profile
CREATE POLICY "Enable users to read their own profile"
  ON public.user_profiles
  FOR SELECT
  TO authenticated
  USING (email = auth.email());

-- Create a policy to enable users to update their own profile
CREATE POLICY "Enable users to update their own profile"
  ON public.user_profiles
  FOR UPDATE
  TO authenticated
  USING (email = auth.email())
  WITH CHECK (email = auth.email());

-- Enable RLS on the table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY; 