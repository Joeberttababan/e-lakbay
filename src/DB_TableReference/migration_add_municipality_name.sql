-- Migration: Add municipality_name field to profiles table
-- This allows municipality users to have their municipality pre-populated in forms

ALTER TABLE public.profiles 
ADD COLUMN municipality_name text null;

-- Update the profile type if needed
CREATE OR REPLACE FUNCTION get_user_municipality(user_id uuid)
RETURNS text AS $$
  SELECT municipality_name 
  FROM profiles 
  WHERE id = user_id AND role = 'municipality'
$$ LANGUAGE SQL;
