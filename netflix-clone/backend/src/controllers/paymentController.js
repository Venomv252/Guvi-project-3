const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../config/db');

const createCheckoutSession = async (req, res) => {
  try {
    const { planId, planName, price, currency = 'usd', interval = 'month' } = req.body;

    // Validate required fields
    if (!planId || !planName || !price) {
      return res.status(400).json({ 
        message: 'Missing required fields: planId, planName, and price are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate plan ID
    const validPlans = ['basic', 'premium', 'family'];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({ 
        message: 'Invalid plan ID. Must be one of: basic, premium, family',
        code: 'INVALID_PLAN_ID'
      });
    }

    // Check if user already has an active subscription
    const [existingSubscriptions] = await db.execute(
      'SELECT id, status FROM subscriptions WHERE user_id = ? AND status = "active"',
      [req.user.id]
    );

    if (existingSubscriptions.length > 0) {
      return res.status(400).json({ 
        message: 'User already has an active subscription',
        code: 'EXISTING_SUBSCRIPTION'
      });
    }

    // Convert price to cents for Stripe
    const priceInCents = Math.round(price * 100);

    // Create or retrieve Stripe customer
    let customer;
    try {
      const customers = await stripe.customers.list({
        email: req.user.email,
        limit: 1
      });

      if (customers.data.length > 0) {
        customer = customers.data[0];
      } else {
        customer = await stripe.customers.create({
          email: req.user.email,
          name: req.user.name,
          metadata: {
            userId: req.user.id.toString()
          }
        });
      }
    } catch (stripeError) {
      console.error('Stripe customer error:', stripeError);
      return res.status(500).json({ 
        message: 'Failed to create customer',
        code: 'STRIPE_CUSTOMER_ERROR'
      });
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: { 
              name: planName,
              description: `${planName} subscription plan`,
              metadata: {
                planId: planId
              }
            },
            unit_amount: priceInCents,
            recurring: { 
              interval: interval,
              interval_count: 1
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/subscription?success=true&plan=${planName}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription?cancelled=true`,
      metadata: { 
        userId: req.user.id.toString(), 
        planId: planId,
        planName: planName
      },
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto'
      },
      payment_intent_data: {
        metadata: {
          userId: req.user.id.toString(),
          planId: planId
        }
      }
    });

    console.log(`Checkout session created for user ${req.user.id}: ${session.id}`);

    res.json({ 
      url: session.url,
      sessionId: session.id 
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    
    if (error.type === 'StripeCardError') {
      return res.status(400).json({ 
        message: 'Payment failed. Please check your card details.',
        code: 'PAYMENT_FAILED'
      });
    }
    
    res.status(500).json({ 
      message: 'Internal server error. Please try again later.',
      code: 'INTERNAL_ERROR'
    });
  }
};

const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook error' });
  }
};

const handleCheckoutCompleted = async (session) => {
  const { userId, planId, planName } = session.metadata;
  
  console.log(`Checkout completed for user ${userId}, plan ${planId}`);

  try {
    // Get subscription details from Stripe
    const subscription = await stripe.subscriptions.retrieve(session.subscription);
    
    // Calculate period dates
    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

    // Insert or update subscription
    await db.execute(
      `INSERT INTO subscriptions (user_id, plan_type, status, stripe_subscription_id, current_period_start, current_period_end, created_at, updated_at)
       VALUES (?, ?, 'active', ?, ?, ?, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
       plan_type = VALUES(plan_type),
       status = VALUES(status),
       stripe_subscription_id = VALUES(stripe_subscription_id),
       current_period_start = VALUES(current_period_start),
       current_period_end = VALUES(current_period_end),
       updated_at = NOW()`,
      [userId, planId, session.subscription, currentPeriodStart, currentPeriodEnd]
    );

    // Insert payment record
    await db.execute(
      `INSERT INTO payments (user_id, stripe_payment_id, stripe_subscription_id, amount, currency, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'completed', NOW())`,
      [userId, session.payment_intent, session.subscription, session.amount_total, session.currency]
    );

    // Update user subscription status
    await db.execute('UPDATE users SET subscription_status = ? WHERE id = ?', ['active', userId]);

    console.log(`Subscription activated for user ${userId}`);
  } catch (error) {
    console.error('Error handling checkout completion:', error);
    throw error;
  }
};

const handleSubscriptionCreated = async (subscription) => {
  console.log(`Subscription created: ${subscription.id}`);
  // Additional logic for subscription creation if needed
};

const handleSubscriptionUpdated = async (subscription) => {
  console.log(`Subscription updated: ${subscription.id}`);
  
  try {
    const currentPeriodStart = new Date(subscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
    
    // Update subscription in database
    await db.execute(
      `UPDATE subscriptions 
       SET status = ?, current_period_start = ?, current_period_end = ?, updated_at = NOW()
       WHERE stripe_subscription_id = ?`,
      [subscription.status, currentPeriodStart, currentPeriodEnd, subscription.id]
    );

    // Update user status based on subscription status
    const userStatus = subscription.status === 'active' ? 'active' : 'inactive';
    await db.execute(
      'UPDATE users SET subscription_status = ? WHERE id IN (SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?)',
      [userStatus, subscription.id]
    );

    console.log(`Subscription ${subscription.id} updated to status: ${subscription.status}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
    throw error;
  }
};

const handleSubscriptionDeleted = async (subscription) => {
  console.log(`Subscription deleted: ${subscription.id}`);
  
  try {
    // Update subscription status to cancelled
    await db.execute(
      'UPDATE subscriptions SET status = ?, updated_at = NOW() WHERE stripe_subscription_id = ?',
      ['cancelled', subscription.id]
    );

    // Update user subscription status
    await db.execute(
      'UPDATE users SET subscription_status = ? WHERE id IN (SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?)',
      ['inactive', subscription.id]
    );

    console.log(`Subscription ${subscription.id} cancelled`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
    throw error;
  }
};

const handlePaymentSucceeded = async (invoice) => {
  console.log(`Payment succeeded for invoice: ${invoice.id}`);
  
  try {
    // Find user by subscription
    const [subscriptions] = await db.execute(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
      [invoice.subscription]
    );

    if (subscriptions.length > 0) {
      const userId = subscriptions[0].user_id;
      
      // Insert payment record
      await db.execute(
        `INSERT INTO payments (user_id, stripe_payment_id, stripe_subscription_id, amount, currency, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'completed', NOW())`,
        [userId, invoice.payment_intent, invoice.subscription, invoice.amount_paid, invoice.currency]
      );

      console.log(`Payment recorded for user ${userId}`);
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
    throw error;
  }
};

const handlePaymentFailed = async (invoice) => {
  console.log(`Payment failed for invoice: ${invoice.id}`);
  
  try {
    // Find user by subscription
    const [subscriptions] = await db.execute(
      'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = ?',
      [invoice.subscription]
    );

    if (subscriptions.length > 0) {
      const userId = subscriptions[0].user_id;
      
      // Insert failed payment record
      await db.execute(
        `INSERT INTO payments (user_id, stripe_payment_id, stripe_subscription_id, amount, currency, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'failed', NOW())`,
        [userId, invoice.payment_intent, invoice.subscription, invoice.amount_due, invoice.currency]
      );

      // Update subscription status to past_due
      await db.execute(
        'UPDATE subscriptions SET status = ?, updated_at = NOW() WHERE stripe_subscription_id = ?',
        ['past_due', invoice.subscription]
      );

      console.log(`Payment failure recorded for user ${userId}`);
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);
    throw error;
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [payments] = await db.execute(
      `SELECT id, stripe_payment_id, amount, currency, status, created_at
       FROM payments 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(limit), offset]
    );

    // Get total count for pagination
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM payments WHERE user_id = ?',
      [req.user.id]
    );

    const totalPayments = countResult[0].total;
    const totalPages = Math.ceil(totalPayments / parseInt(limit));

    res.json({
      payments: payments.map(payment => ({
        ...payment,
        amount: payment.amount / 100 // Convert from cents to dollars
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalPayments,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

module.exports = { 
  createCheckoutSession, 
  handleWebhook, 
  getPaymentHistory 
};
