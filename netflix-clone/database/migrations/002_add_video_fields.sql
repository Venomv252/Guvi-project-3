-- Add enhanced fields to videos table
USE netflix_streaming;

-- Check and add genre column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'netflix_streaming' 
AND table_name = 'videos' 
AND column_name = 'genre';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE videos ADD COLUMN genre VARCHAR(100) AFTER category', 
    'SELECT "genre column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add rating column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'netflix_streaming' 
AND table_name = 'videos' 
AND column_name = 'rating';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE videos ADD COLUMN rating DECIMAL(2,1) DEFAULT 0.0 AFTER genre', 
    'SELECT "rating column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add release_year column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'netflix_streaming' 
AND table_name = 'videos' 
AND column_name = 'release_year';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE videos ADD COLUMN release_year INT AFTER rating', 
    'SELECT "release_year column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add view_count column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'netflix_streaming' 
AND table_name = 'videos' 
AND column_name = 'view_count';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE videos ADD COLUMN view_count INT DEFAULT 0 AFTER release_year', 
    'SELECT "view_count column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update existing videos with default values
UPDATE videos SET 
    genre = category,
    rating = 4.0 + (RAND() * 1.5),  -- Random rating between 4.0 and 5.5
    release_year = 2020 + FLOOR(RAND() * 4),  -- Random year between 2020-2023
    view_count = FLOOR(RAND() * 10000)  -- Random view count
WHERE genre IS NULL OR rating IS NULL OR release_year IS NULL;