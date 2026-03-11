-- Endangered Wildlife Table
-- Stores information about endangered species uploaded by municipalities

CREATE TABLE endangered_wildlife (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  species_name varchar(255) NOT NULL,
  description text,
  conservation_status varchar(100), -- e.g., 'Critically Endangered', 'Endangered', 'Vulnerable'
  image_url text, -- Primary image URL
  image_urls text[] DEFAULT ARRAY[]::text[], -- Array of image URLs
  municipality_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  approval_status varchar(50) DEFAULT 'pending', -- 'pending', 'approved', 'declined'
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- Indexes for common queries
  CONSTRAINT status_check CHECK (approval_status IN ('pending', 'approved', 'declined'))
);

CREATE INDEX idx_endangered_wildlife_municipality_id ON endangered_wildlife(municipality_id);
CREATE INDEX idx_endangered_wildlife_approval_status ON endangered_wildlife(approval_status);
CREATE INDEX idx_endangered_wildlife_created_at ON endangered_wildlife(created_at DESC);

-- Wildlife Ratings Table
-- Stores user ratings for endangered wildlife species

CREATE TABLE wildlife_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wildlife_id uuid NOT NULL REFERENCES endangered_wildlife(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at timestamp with time zone DEFAULT now(),
  
  -- Prevent duplicate ratings from same user on same wildlife
  UNIQUE(wildlife_id, user_id)
);

CREATE INDEX idx_wildlife_ratings_wildlife_id ON wildlife_ratings(wildlife_id);
CREATE INDEX idx_wildlife_ratings_user_id ON wildlife_ratings(user_id);

-- RLS Policies for endangered_wildlife
ALTER TABLE endangered_wildlife ENABLE ROW LEVEL SECURITY;

-- Anyone can view approved wildlife
CREATE POLICY "Approved wildlife is viewable by everyone" 
ON endangered_wildlife FOR SELECT 
USING (approval_status = 'approved');

-- Municipalities and admins can view all wildlife
CREATE POLICY "Municipalities and admins can view all wildlife" 
ON endangered_wildlife FOR SELECT 
USING (
  auth.uid() IS NOT NULL AND (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer') OR
    municipality_id = auth.uid()
  )
);

-- Only municipalities can insert wildlife
CREATE POLICY "Only municipalities can insert wildlife" 
ON endangered_wildlife FOR INSERT 
WITH CHECK (
  auth.uid() = municipality_id AND
  (SELECT role FROM profiles WHERE id = auth.uid()) = 'municipality'
);

-- Only admins can update wildlife approval status
CREATE POLICY "Only admins can update approval status" 
ON endangered_wildlife FOR UPDATE 
USING (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
)
WITH CHECK (
  (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'developer')
);

-- RLS Policies for wildlife_ratings
ALTER TABLE wildlife_ratings ENABLE ROW LEVEL SECURITY;

-- Anyone can view ratings
CREATE POLICY "Ratings are viewable by everyone" 
ON wildlife_ratings FOR SELECT 
USING (true);

-- Authenticated users can insert their own ratings
CREATE POLICY "Users can insert their own ratings" 
ON wildlife_ratings FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own ratings
CREATE POLICY "Users can update their own ratings" 
ON wildlife_ratings FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own ratings
CREATE POLICY "Users can delete their own ratings" 
ON wildlife_ratings FOR DELETE 
USING (auth.uid() = user_id);
