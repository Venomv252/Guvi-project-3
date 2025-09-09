// database/setup-database.js
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../backend/.env' });

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔄 Connecting to MySQL...');
    
    // Connect to MySQL server (without specifying database)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    console.log('🔄 Creating database if not exists...');
    await connection.query('CREATE DATABASE IF NOT EXISTS netflix_streaming');
    // Select database (avoid prepared statements for USE)
    await connection.changeUser({ database: 'netflix_streaming' });
    console.log('✅ Database netflix_streaming ready');

    // Check if users table exists and has the required fields
    console.log('🔄 Checking users table...');
    try {
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'netflix_streaming' 
        AND TABLE_NAME = 'users'
      `);
      
      const columnNames = columns.map(col => col.COLUMN_NAME);
      const requiredFields = ['last_login', 'failed_login_attempts', 'account_locked_until', 'subscription_plan_type', 'subscription_started_at'];
      const missingFields = requiredFields.filter(field => !columnNames.includes(field));
      
      if (missingFields.length > 0) {
        console.log(`🔄 Adding missing security fields: ${missingFields.join(', ')}`);
        
        if (missingFields.includes('last_login')) {
          await connection.execute('ALTER TABLE users ADD COLUMN last_login TIMESTAMP NULL AFTER refresh_token');
        }
        if (missingFields.includes('failed_login_attempts')) {
          await connection.execute('ALTER TABLE users ADD COLUMN failed_login_attempts INT DEFAULT 0 AFTER last_login');
        }
        if (missingFields.includes('account_locked_until')) {
          await connection.execute('ALTER TABLE users ADD COLUMN account_locked_until TIMESTAMP NULL AFTER failed_login_attempts');
        }
        if (missingFields.includes('subscription_plan_type')) {
          await connection.execute("ALTER TABLE users ADD COLUMN subscription_plan_type VARCHAR(50) NULL AFTER subscription_status");
        }
        if (missingFields.includes('subscription_started_at')) {
          await connection.execute('ALTER TABLE users ADD COLUMN subscription_started_at TIMESTAMP NULL AFTER subscription_plan_type');
        }
        
        console.log('✅ Security fields added to users table');
      } else {
        console.log('✅ Users table already has all required fields');
      }
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log('🔄 Users table does not exist, creating from schema...');
        // Run the full schema creation
        await runSchemaFile(connection);
      } else {
        throw error;
      }
    }

    // Check if videos table has enhanced fields
    console.log('🔄 Checking videos table...');
    try {
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'netflix_streaming' 
        AND TABLE_NAME = 'videos'
      `);
      
      const columnNames = columns.map(col => col.COLUMN_NAME);
      const enhancedFields = ['genre', 'rating', 'release_year', 'view_count'];
      const missingFields = enhancedFields.filter(field => !columnNames.includes(field));
      
      if (missingFields.length > 0) {
        console.log(`🔄 Adding missing video fields: ${missingFields.join(', ')}`);
        
        if (missingFields.includes('genre')) {
          await connection.execute('ALTER TABLE videos ADD COLUMN genre VARCHAR(100) AFTER category');
        }
        if (missingFields.includes('rating')) {
          await connection.execute('ALTER TABLE videos ADD COLUMN rating DECIMAL(2,1) DEFAULT 0.0 AFTER genre');
        }
        if (missingFields.includes('release_year')) {
          await connection.execute('ALTER TABLE videos ADD COLUMN release_year INT AFTER rating');
        }
        if (missingFields.includes('view_count')) {
          await connection.execute('ALTER TABLE videos ADD COLUMN view_count INT DEFAULT 0 AFTER release_year');
        }
        
        console.log('✅ Enhanced fields added to videos table');
        
        // Update existing videos with sample data
        console.log('🔄 Updating existing videos with sample data...');
        await connection.execute(`
          UPDATE videos SET 
            genre = COALESCE(genre, category, 'Unknown'),
            rating = COALESCE(rating, ROUND(5 + RAND() * 4, 1)),
            release_year = COALESCE(release_year, YEAR(CURDATE()) - FLOOR(RAND() * 5)),
            view_count = COALESCE(view_count, FLOOR(RAND() * 10000) + 1000)
          WHERE genre IS NULL OR rating = 0.0 OR release_year IS NULL OR view_count = 0
        `);
        console.log('✅ Sample data added to existing videos');
      } else {
        console.log('✅ Videos table already has all enhanced fields');
      }
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log('🔄 Videos table does not exist, will be created by schema');
      } else {
        throw error;
      }
    }

    // Check if subscriptions table has enhanced fields
    console.log('🔄 Checking subscriptions table...');
    try {
      const [columns] = await connection.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'netflix_streaming' 
        AND TABLE_NAME = 'subscriptions'
      `);
      
      const columnNames = columns.map(col => col.COLUMN_NAME);
      const enhancedFields = ['current_period_start', 'current_period_end'];
      const missingFields = enhancedFields.filter(field => !columnNames.includes(field));
      
      if (missingFields.length > 0) {
        console.log(`🔄 Adding missing subscription fields: ${missingFields.join(', ')}`);
        
        if (missingFields.includes('current_period_start')) {
          await connection.execute('ALTER TABLE subscriptions ADD COLUMN current_period_start TIMESTAMP NULL AFTER stripe_subscription_id');
        }
        if (missingFields.includes('current_period_end')) {
          await connection.execute('ALTER TABLE subscriptions ADD COLUMN current_period_end TIMESTAMP NULL AFTER current_period_start');
        }
        
        // Update status enum to include 'past_due'
        await connection.execute(`
          ALTER TABLE subscriptions 
          MODIFY COLUMN status ENUM('active', 'cancelled', 'expired', 'past_due') DEFAULT 'active'
        `);
        
        console.log('✅ Enhanced fields added to subscriptions table');
      } else {
        console.log('✅ Subscriptions table already has all enhanced fields');
      }
    } catch (error) {
      if (error.code === 'ER_NO_SUCH_TABLE') {
        console.log('🔄 Subscriptions table does not exist, will be created by schema');
      } else {
        throw error;
      }
    }

    // Create indexes if they don't exist
    console.log('🔄 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_account_locked ON users(account_locked_until)',
      'CREATE INDEX IF NOT EXISTS idx_users_failed_attempts ON users(failed_login_attempts)',
      'CREATE INDEX IF NOT EXISTS idx_videos_genre ON videos(genre)',
      'CREATE INDEX IF NOT EXISTS idx_videos_rating ON videos(rating)',
      'CREATE INDEX IF NOT EXISTS idx_videos_release_year ON videos(release_year)',
      'CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id)'
    ];

    for (const indexQuery of indexes) {
      try {
        await connection.execute(indexQuery);
      } catch (error) {
        if (error.code !== 'ER_BAD_FIELD_ERROR') {
          console.log(`Index creation skipped: ${error.message}`);
        }
      }
    }
    console.log('✅ Indexes created');

    console.log('🎉 Database setup completed successfully!');
    console.log('');
    console.log('Your Netflix clone database is now ready with all enhancements:');
    console.log('- Enhanced user security fields');
    console.log('- Advanced video metadata');
    console.log('- Improved subscription management');
    console.log('- Performance indexes');
    console.log('');
    console.log('You can now start the backend server with: npm start');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    console.log('');
    console.log('Please check:');
    console.log('1. MySQL server is running');
    console.log('2. Database credentials in backend/.env are correct');
    console.log('3. User has proper database permissions');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function runSchemaFile(connection) {
  console.log('🔄 Running schema creation...');
  
  // Read and execute the schema file
  const fs = require('fs');
  const path = require('path');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  // Split by semicolon and execute each statement
  const statements = schema.split(';').filter(stmt => stmt.trim().length > 0);
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        await connection.execute(statement);
      } catch (error) {
        // Skip errors for statements that might already exist
        if (!error.message.includes('already exists')) {
          console.log(`Schema statement skipped: ${error.message}`);
        }
      }
    }
  }
  
  console.log('✅ Schema creation completed');
}

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };