const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { 
  getSubscriptionStatus, 
  cancelSubscription, 
  reactivateSubscription, 
  updateSubscriptionPlan, 
  getSubscriptionHistory,
  activateSubscriptionDev
} = require('../controllers/subscriptionController');

const router = express.Router();

// Subscription management routes
router.get('/status', authMiddleware, getSubscriptionStatus);
router.get('/history', authMiddleware, getSubscriptionHistory);
router.post('/cancel', authMiddleware, cancelSubscription);
router.post('/reactivate', authMiddleware, reactivateSubscription);
router.put('/plan', authMiddleware, updateSubscriptionPlan);

// Dev-only: activate subscription without Stripe (guarded by env flag)
router.post('/dev/activate', authMiddleware, async (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return activateSubscriptionDev(req, res);
  }
  return res.status(403).json({ message: 'Not allowed in production' });
});

module.exports = router;
