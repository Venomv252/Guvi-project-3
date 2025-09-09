-- Add security fields to users table (safe version)
USE netflix_streaming;

-- Check and add last_login column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'netflix_streaming' 
AND table_name = 'users' 
AND column_name = 'last_login';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL AFTER refresh_token', 
    'SELECT "last_login column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add failed_login_attempts column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'netflix_streaming' 
AND table_name = 'users' 
AND column_name = 'failed_login_attempts';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0 AFTER last_login', 
    'SELECT "failed_login_attempts column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add account_locked_until column
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.columns 
WHERE table_schema = 'netflix_streaming' 
AND table_name = 'users' 
AND column_name = 'account_locked_until';

SET @sql = IF(@col_exists = 0, 
    'ALTER TABLE users ADD COLUMN account_locked_until TIMESTAMP NULL AFTER failed_login_attempts', 
    'SELECT "account_locked_until column already exists" as message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create indexes (these will fail silently if they already exist)
CREATE INDEX idx_users_account_locked ON users(account_locked_until);
CREATE INDEX idx_users_failed_attempts ON users(failed_login_attempts);