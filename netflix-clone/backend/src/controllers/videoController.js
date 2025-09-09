// backend/src/controllers/videoController.js
const db = require('../config/db');

const getVideos = async (req, res) => {
  try {
    const {
      search = '',
      category = '',
      genre = '',
      rating = '',
      year = '',
      duration = '',
      sortBy = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    // Build WHERE clause
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }

    if (genre) {
      conditions.push('genre = ?');
      params.push(genre);
    }

    if (rating) {
      const ratingValue = parseFloat(rating.replace('+', ''));
      conditions.push('rating >= ?');
      params.push(ratingValue);
    }

    if (year) {
      conditions.push('release_year = ?');
      params.push(parseInt(year));
    }

    if (duration) {
      switch (duration) {
        case 'short':
          conditions.push('CAST(SUBSTRING_INDEX(duration, "h", 1) AS UNSIGNED) < 1');
          break;
        case 'medium':
          conditions.push('CAST(SUBSTRING_INDEX(duration, "h", 1) AS UNSIGNED) BETWEEN 1 AND 2');
          break;
        case 'long':
          conditions.push('CAST(SUBSTRING_INDEX(duration, "h", 1) AS UNSIGNED) > 2');
          break;
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    let orderBy = 'ORDER BY created_at DESC';
    switch (sortBy) {
      case 'oldest':
        orderBy = 'ORDER BY created_at ASC';
        break;
      case 'title':
        orderBy = 'ORDER BY title ASC';
        break;
      case 'rating':
        orderBy = 'ORDER BY rating DESC, created_at DESC';
        break;
      case 'popular':
        orderBy = 'ORDER BY view_count DESC, created_at DESC';
        break;
      default:
        orderBy = 'ORDER BY created_at DESC';
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitClause = `LIMIT ${parseInt(limit)} OFFSET ${offset}`;

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM videos 
      ${whereClause}
    `;
    const [countResult] = await db.execute(countQuery, params);
    const totalResults = countResult[0].total;
    const totalPages = Math.ceil(totalResults / parseInt(limit));

    // Get videos (handle missing columns gracefully)
    let videos;
    try {
      const videosQuery = `
        SELECT id, title, description, thumbnail, duration, category, genre, rating, release_year, view_count, created_at 
        FROM videos 
        ${whereClause}
        ${orderBy}
        ${limitClause}
      `;
      [videos] = await db.execute(videosQuery, params);
    } catch (dbError) {
      // If enhanced columns don't exist, fall back to basic query
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        console.log('Enhanced video fields not found, using basic video query');
        const basicVideosQuery = `
          SELECT id, title, description, thumbnail, duration, category, created_at 
          FROM videos 
          ${whereClause}
          ORDER BY created_at DESC
          ${limitClause}
        `;
        [videos] = await db.execute(basicVideosQuery, params);
        // Add default values for missing fields
        videos = videos.map(video => ({
          ...video,
          genre: video.category || 'Unknown',
          rating: 0.0,
          release_year: new Date().getFullYear(),
          view_count: 0
        }));
      } else {
        throw dbError;
      }
    }

    res.json({
      videos,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalResults,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      filters: {
        search,
        category,
        genre,
        rating,
        year,
        duration,
        sortBy
      }
    });
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

const getVideoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [videos] = await db.execute(
      'SELECT * FROM videos WHERE id = ?',
      [id]
    );
    
    if (videos.length === 0) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if user has active subscription
    if (req.user.subscription_status !== 'active') {
      return res.status(403).json({ message: 'Active subscription required' });
    }
    
    res.json(videos[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getVideosByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 12, page = 1 } = req.query;
    
    const limitInt = Number.isFinite(parseInt(limit)) ? parseInt(limit) : 12;
    const pageInt = Number.isFinite(parseInt(page)) ? parseInt(page) : 1;
    const offset = (pageInt - 1) * limitInt;
    
    // Get videos by category (handle missing columns gracefully)
    let videos;
    try {
      const query = `
        SELECT id, title, description, thumbnail, duration, category, genre, rating, release_year 
        FROM videos 
        WHERE category = ? 
        ORDER BY created_at DESC 
        LIMIT ${limitInt} OFFSET ${offset}`;
      [videos] = await db.execute(query, [category]);
    } catch (dbError) {
      // If enhanced columns don't exist, fall back to basic query
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        console.log('Enhanced video fields not found, using basic video query for category');
        const fallbackQuery = `
          SELECT id, title, description, thumbnail, duration, category, created_at 
          FROM videos 
          WHERE category = ? 
          ORDER BY created_at DESC 
          LIMIT ${limitInt} OFFSET ${offset}`;
        [videos] = await db.execute(fallbackQuery, [category]);
        // Add default values for missing fields
        videos = videos.map(video => ({
          ...video,
          genre: video.category || 'Unknown',
          rating: 0.0,
          release_year: new Date().getFullYear()
        }));
      } else {
        throw dbError;
      }
    }
    
    res.json(videos);
  } catch (error) {
    console.error('Get videos by category error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

const getCategories = async (req, res) => {
  try {
    const [categories] = await db.execute(`
      SELECT DISTINCT category 
      FROM videos 
      WHERE category IS NOT NULL AND category != '' 
      ORDER BY category ASC
    `);
    
    res.json(categories.map(row => row.category));
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

const getGenres = async (req, res) => {
  try {
    let genres;
    try {
      [genres] = await db.execute(`
        SELECT DISTINCT genre 
        FROM videos 
        WHERE genre IS NOT NULL AND genre != '' 
        ORDER BY genre ASC
      `);
    } catch (dbError) {
      // If genre column doesn't exist, fall back to categories
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        console.log('Genre field not found, using categories as genres');
        [genres] = await db.execute(`
          SELECT DISTINCT category as genre 
          FROM videos 
          WHERE category IS NOT NULL AND category != '' 
          ORDER BY category ASC
        `);
      } else {
        throw dbError;
      }
    }
    
    res.json(genres.map(row => row.genre));
  } catch (error) {
    console.error('Get genres error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

const getSearchSuggestions = async (req, res) => {
  try {
    const { query = '' } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    const [suggestions] = await db.execute(`
      SELECT DISTINCT title 
      FROM videos 
      WHERE title LIKE ? 
      ORDER BY title ASC 
      LIMIT 10
    `, [`%${query}%`]);
    
    res.json(suggestions.map(row => row.title));
  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

module.exports = { 
  getVideos, 
  getVideoById, 
  getVideosByCategory, 
  getCategories, 
  getGenres, 
  getSearchSuggestions 
};