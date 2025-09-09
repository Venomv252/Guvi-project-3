const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { createCheckoutSession, handleWebhook, getPaymentHistory } = require('../controllers/paymentController');

const router = express.Router();

// Protected routes (require authentication)
router.post('/create-checkout-session', authMiddleware, createCheckoutSession);
router.get('/history', authMiddleware, getPaymentHistory);

// Webhook route (no auth required - Stripe will send the webhook)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

module.exports = router;
