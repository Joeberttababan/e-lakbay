-- First, remove duplicate destination ratings, keeping only the most recent one per user-destination pair
DELETE FROM destination_ratings
WHERE id NOT IN (
  SELECT DISTINCT ON (destination_id, user_id) id
  FROM destination_ratings
  ORDER BY destination_id, user_id, created_at DESC
);

-- Then, remove duplicate product ratings, keeping only the most recent one per user-product pair
DELETE FROM product_ratings
WHERE id NOT IN (
  SELECT DISTINCT ON (product_id, user_id) id
  FROM product_ratings
  ORDER BY product_id, user_id, created_at DESC
);

-- Add unique constraints to prevent duplicate ratings per user per item
-- Destination ratings: one rating per user per destination
ALTER TABLE destination_ratings ADD CONSTRAINT unique_destination_ratings_per_user 
  UNIQUE (destination_id, user_id);

-- Product ratings: one rating per user per product
ALTER TABLE product_ratings ADD CONSTRAINT unique_product_ratings_per_user 
  UNIQUE (product_id, user_id);
