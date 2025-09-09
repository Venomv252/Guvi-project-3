const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { 
  getSubscriptionStatus, 
  cancelSubscription, 
  reactivateSubscription, 
  updateSubscriptionPlan, 
  getSubscriptionHistory 
} = require('../controllers/subscriptionController');

const router = express.Router();

// Subscription management routes
router.get('/status', authMiddleware, getSubscriptionStatus);
router.get('/history', authMiddleware, getSubscriptionHistory);
router.post('/cancel', authMiddleware, cancelSubscription);
router.post('/reactivate', authMiddleware, reactivateSubscription);
router.put('/plan', authMiddleware, updateSubscriptionPlan);

module.exports = router;
