-- Create database
CREATE DATABASE IF NOT EXISTS netflix_streaming;
USE netflix_streaming;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    subscription_status ENUM('active', 'inactive', 'cancelled') DEFAULT 'inactive',
    refresh_token TEXT,
    last_login TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    account_locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Videos table
CREATE TABLE videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url VARCHAR(500),
    thumbnail VARCHAR(500),
    duration VARCHAR(50),
    category VARCHAR(100),
    genre VARCHAR(100),
    rating DECIMAL(2,1) DEFAULT 0.0,
    release_year INT,
    view_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    plan_type ENUM('basic', 'premium', 'family') NOT NULL,
    status ENUM('active', 'cancelled', 'expired', 'past_due') DEFAULT 'active',
    stripe_subscription_id VARCHAR(255),
    current_period_start TIMESTAMP NULL,
    current_period_end TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE payments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    stripe_payment_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    amount INT NOT NULL, -- Amount in cents
    currency VARCHAR(3) DEFAULT 'usd',
    status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert sample videos
INSERT INTO videos (title, description, category, duration, thumbnail) VALUES
('Sample Movie 1', 'A great action movie with amazing stunts and storyline.', 'Action', '2h 15m', NULL),
('Sample Movie 2', 'A romantic comedy that will make you laugh and cry.', 'Comedy', '1h 45m', NULL),
('Sample Movie 3', 'A thrilling documentary about nature and wildlife.', 'Documentary', '1h 30m', NULL),
('Sample Movie 4', 'An epic fantasy adventure with magical creatures.', 'Fantasy', '2h 45m', NULL),
('Sample Movie 5', 'A mind-bending sci-fi thriller set in the future.', 'Sci-Fi', '2h 5m', NULL);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_account_locked ON users(account_locked_until);
CREATE INDEX idx_users_failed_attempts ON users(failed_login_attempts);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_videos_category ON videos(category);