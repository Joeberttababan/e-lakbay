-- Wildlife Comments Table
-- Stores user comments for endangered wildlife species

CREATE TABLE wildlife_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wildlife_id uuid NOT NULL REFERENCES endangered_wildlife(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  comment_text text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE INDEX idx_wildlife_comments_wildlife_id ON wildlife_comments(wildlife_id);
CREATE INDEX idx_wildlife_comments_user_id ON wildlife_comments(user_id);
CREATE INDEX idx_wildlife_comments_created_at ON wildlife_comments(created_at DESC);

-- RLS Policies for wildlife_comments
ALTER TABLE wildlife_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view comments
CREATE POLICY "Comments are viewable by everyone" 
ON wildlife_comments FOR SELECT 
USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "Users can insert their own comments" 
ON wildlife_comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" 
ON wildlife_comments FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" 
ON wildlife_comments FOR DELETE 
USING (auth.uid() = user_id);
