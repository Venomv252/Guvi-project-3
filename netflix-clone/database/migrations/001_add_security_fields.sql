-- Add security fields to users table
USE netflix_streaming;

-- Add new security fields if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP NULL AFTER refresh_token,
ADD COLUMN IF NOT EXISTS failed_login_attempts INT DEFAULT 0 AFTER last_login,
ADD COLUMN IF NOT EXISTS account_locked_until TIMESTAMP NULL AFTER failed_login_attempts;

-- Create indexes for performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_users_account_locked ON users(account_locked_until);
CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON users(failed_login_attempts);