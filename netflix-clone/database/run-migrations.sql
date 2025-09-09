-- Run all database migrations
-- Execute this file to update your database with all enhancements

-- Migration 1: Add security fields
SOURCE migrations/001_add_security_fields.sql;

-- Migration 2: Update schema enhancements
SOURCE migrations/002_update_schema_enhancements.sql;

-- Show completion message
SELECT 'Database migrations completed successfully!' as message;