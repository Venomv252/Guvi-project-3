-- Update database schema with all enhancements
USE netflix_streaming;

-- Update videos table with new fields
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS genre VARCHAR(100) AFTER category,
ADD COLUMN IF NOT EXISTS rating DECIMAL(2,1) DEFAULT 0.0 AFTER genre,
ADD COLUMN IF NOT EXISTS release_year INT AFTER rating,
ADD COLUMN IF NOT EXISTS view_count INT DEFAULT 0 AFTER release_year;

-- Update subscriptions table with new fields
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMP NULL AFTER stripe_subscription_id,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP NULL AFTER current_period_start;

-- Update subscription status enum to include 'past_due'
ALTER TABLE subscriptions 
MODIFY COLUMN status ENUM('active', 'cancelled', 'expired', 'past_due') DEFAULT 'active';

-- Remove the old expires_at column if it exists (replaced by current_period_end)
ALTER TABLE subscriptions DROP COLUMN IF EXISTS expires_at;

-- Update payments table with additional fields
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'usd' AFTER amount;

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_genre ON videos(genre);
CREATE INDEX IF NOT EXISTS idx_videos_rating ON videos(rating);
CREATE INDEX IF NOT EXISTS idx_videos_release_year ON videos(release_year);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Update sample videos with new fields
UPDATE videos SET 
    genre = CASE 
        WHEN category = 'Action' THEN 'Action'
        WHEN category = 'Comedy' THEN 'Comedy'
        WHEN category = 'Documentary' THEN 'Documentary'
        WHEN category = 'Fantasy' THEN 'Fantasy'
        WHEN category = 'Sci-Fi' THEN 'Science Fiction'
        ELSE 'Drama'
    END,
    rating = CASE 
        WHEN id = 1 THEN 8.5
        WHEN id = 2 THEN 7.2
        WHEN id = 3 THEN 9.1
        WHEN id = 4 THEN 8.8
        WHEN id = 5 THEN 8.3
        ELSE 7.0
    END,
    release_year = CASE 
        WHEN id = 1 THEN 2023
        WHEN id = 2 THEN 2022
        WHEN id = 3 THEN 2024
        WHEN id = 4 THEN 2023
        WHEN id = 5 THEN 2024
        ELSE 2023
    END,
    view_count = FLOOR(RAND() * 10000) + 1000
WHERE genre IS NULL OR rating = 0.0 OR release_year IS NULL OR view_count = 0;