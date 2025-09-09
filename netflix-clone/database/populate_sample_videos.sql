-- Populate database with more sample videos for testing
USE netflix_streaming;

-- Clear existing sample data and start fresh
DELETE FROM videos WHERE id <= 50;

-- Insert a variety of sample videos with different categories and genres
INSERT INTO videos (title, description, category, genre, rating, release_year, view_count, duration, thumbnail) VALUES

-- Action Movies
('The Last Stand', 'An action-packed thriller about a sheriff defending his town from a drug cartel.', 'Action', 'Action', 4.2, 2023, 15420, '2h 15m', NULL),
('Speed Force', 'High-octane car chases and explosive action sequences.', 'Action', 'Action', 4.5, 2022, 28350, '1h 58m', NULL),
('Night Warrior', 'A martial arts expert fights to save his city from corruption.', 'Action', 'Martial Arts', 4.1, 2023, 12890, '2h 5m', NULL),
('Urban Justice', 'Street-level action with intense fight choreography.', 'Action', 'Crime', 4.3, 2022, 19750, '1h 52m', NULL),
('Cyber Strike', 'Futuristic action in a digital world.', 'Action', 'Sci-Fi', 4.4, 2023, 22100, '2h 12m', NULL),

-- Comedy Movies
('Laugh Out Loud', 'A hilarious comedy about mistaken identities and chaos.', 'Comedy', 'Comedy', 4.6, 2023, 31200, '1h 42m', NULL),
('The Funny Side', 'Romantic comedy with witty dialogue and charming characters.', 'Comedy', 'Romantic Comedy', 4.4, 2022, 25800, '1h 38m', NULL),
('Office Shenanigans', 'Workplace comedy with absurd situations.', 'Comedy', 'Comedy', 4.2, 2023, 18900, '1h 35m', NULL),
('Family Chaos', 'A family comedy about a disastrous vacation.', 'Comedy', 'Family', 4.3, 2022, 27600, '1h 45m', NULL),
('Stand-Up Stories', 'Comedy special featuring multiple comedians.', 'Comedy', 'Stand-Up', 4.5, 2023, 14500, '1h 25m', NULL),

-- Drama Movies
('Emotional Journey', 'A powerful drama about overcoming life challenges.', 'Drama', 'Drama', 4.7, 2023, 35600, '2h 18m', NULL),
('The Human Condition', 'Deep exploration of relationships and personal growth.', 'Drama', 'Drama', 4.8, 2022, 29400, '2h 25m', NULL),
('Breaking Point', 'Intense psychological drama with stellar performances.', 'Drama', 'Psychological', 4.6, 2023, 21800, '2h 8m', NULL),
('Life Stories', 'Biographical drama based on true events.', 'Drama', 'Biography', 4.5, 2022, 26300, '2h 15m', NULL),
('Silent Tears', 'Emotional drama about loss and healing.', 'Drama', 'Drama', 4.4, 2023, 18700, '1h 58m', NULL),

-- Horror Movies
('Midnight Terror', 'Spine-chilling horror with supernatural elements.', 'Horror', 'Supernatural', 4.1, 2023, 22500, '1h 48m', NULL),
('The Haunting', 'Classic ghost story with modern twists.', 'Horror', 'Ghost', 4.2, 2022, 19800, '1h 52m', NULL),
('Zombie Apocalypse', 'Survival horror in a post-apocalyptic world.', 'Horror', 'Zombie', 4.0, 2023, 31200, '2h 2m', NULL),
('Psychological Fear', 'Mind-bending horror that plays with reality.', 'Horror', 'Psychological', 4.3, 2022, 17600, '1h 45m', NULL),
('Slasher Night', 'Classic slasher film with intense suspense.', 'Horror', 'Slasher', 3.9, 2023, 24800, '1h 38m', NULL),

-- Sci-Fi Movies
('Space Odyssey 2024', 'Epic space adventure with stunning visuals.', 'Sci-Fi', 'Space Opera', 4.6, 2023, 42300, '2h 35m', NULL),
('Time Paradox', 'Mind-bending time travel story.', 'Sci-Fi', 'Time Travel', 4.5, 2022, 28900, '2h 8m', NULL),
('AI Revolution', 'Artificial intelligence thriller set in the near future.', 'Sci-Fi', 'AI', 4.4, 2023, 33700, '2h 12m', NULL),
('Alien Contact', 'First contact with extraterrestrial life.', 'Sci-Fi', 'Alien', 4.3, 2022, 26500, '2h 18m', NULL),
('Cyberpunk City', 'Dystopian future with high-tech, low-life themes.', 'Sci-Fi', 'Cyberpunk', 4.2, 2023, 21400, '2h 5m', NULL),

-- Fantasy Movies
('Magic Realm', 'Epic fantasy adventure in a magical world.', 'Fantasy', 'High Fantasy', 4.7, 2023, 38900, '2h 42m', NULL),
('Dragon Quest', 'Heroes embark on a quest to defeat an ancient dragon.', 'Fantasy', 'Adventure', 4.5, 2022, 31800, '2h 28m', NULL),
('Wizard Academy', 'Young wizards learn magic and face dark forces.', 'Fantasy', 'Magic', 4.4, 2023, 27600, '2h 15m', NULL),
('Mythical Creatures', 'A world where mythical beings coexist with humans.', 'Fantasy', 'Mythology', 4.3, 2022, 23400, '2h 8m', NULL),
('Enchanted Forest', 'Magical adventure in an enchanted woodland.', 'Fantasy', 'Fairy Tale', 4.2, 2023, 19800, '1h 58m', NULL),

-- Documentary
('Nature\'s Wonders', 'Breathtaking documentary about wildlife and ecosystems.', 'Documentary', 'Nature', 4.8, 2023, 25600, '1h 32m', NULL),
('Tech Revolution', 'Documentary exploring the impact of technology on society.', 'Documentary', 'Technology', 4.6, 2022, 18900, '1h 28m', NULL),
('Historical Mysteries', 'Uncovering secrets from the past.', 'Documentary', 'History', 4.5, 2023, 21300, '1h 45m', NULL),
('Space Exploration', 'The journey of human space exploration.', 'Documentary', 'Science', 4.7, 2022, 23800, '1h 38m', NULL),
('Ocean Depths', 'Exploring the mysteries of the deep ocean.', 'Documentary', 'Marine', 4.4, 2023, 17500, '1h 42m', NULL),

-- Thriller Movies
('Edge of Danger', 'High-stakes thriller with non-stop suspense.', 'Thriller', 'Suspense', 4.3, 2023, 29400, '2h 5m', NULL),
('The Chase', 'Cat and mouse game between detective and criminal.', 'Thriller', 'Crime', 4.4, 2022, 26700, '1h 58m', NULL),
('Mind Games', 'Psychological thriller that keeps you guessing.', 'Thriller', 'Psychological', 4.5, 2023, 24800, '2h 12m', NULL),
('Conspiracy Theory', 'Political thriller uncovering government secrets.', 'Thriller', 'Political', 4.2, 2022, 22100, '2h 8m', NULL),
('Deadly Pursuit', 'Action thriller with intense chase sequences.', 'Thriller', 'Action', 4.1, 2023, 27300, '1h 52m', NULL),

-- Romance Movies
('Love in Paris', 'Romantic drama set in the city of love.', 'Romance', 'Romance', 4.5, 2023, 32100, '1h 48m', NULL),
('Second Chances', 'Heartwarming story about finding love again.', 'Romance', 'Drama', 4.4, 2022, 28600, '2h 2m', NULL),
('Summer Romance', 'Light-hearted romantic comedy set during summer.', 'Romance', 'Comedy', 4.3, 2023, 25400, '1h 42m', NULL),
('Eternal Love', 'Epic romance spanning multiple decades.', 'Romance', 'Epic', 4.6, 2022, 31800, '2h 25m', NULL),
('Wedding Bells', 'Romantic comedy about wedding planning chaos.', 'Romance', 'Comedy', 4.2, 2023, 23700, '1h 38m', NULL);

-- Update some random view counts to make it more realistic
UPDATE videos SET view_count = FLOOR(RAND() * 50000) + 5000 WHERE view_count < 5000;