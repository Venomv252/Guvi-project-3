// backend/src/routes/videos.js
const express = require('express');
const { authMiddleware, requireActiveSubscription } = require('../middleware/authMiddleware');
const { 
  getVideos, 
  getVideoById, 
  getVideosByCategory, 
  getCategories, 
  getGenres, 
  getSearchSuggestions 
} = require('../controllers/videoController');

const router = express.Router();

// Public routes to browse videos (requires auth but not subscription)
router.get('/', authMiddleware, getVideos);
router.get('/categories', authMiddleware, getCategories);
router.get('/genres', authMiddleware, getGenres);
router.get('/search/suggestions', authMiddleware, getSearchSuggestions);

// Public route to browse by category (requires auth but not subscription)
router.get('/category/:category', authMiddleware, getVideosByCategory);

// Protected route to watch specific video (requires active subscription)
router.get('/:id', authMiddleware, requireActiveSubscription, getVideoById);

module.exports = router;