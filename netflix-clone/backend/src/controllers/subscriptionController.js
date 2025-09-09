// Initialize Stripe only if a secret key is configured
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  }
} catch (e) {
  console.warn('Stripe is not configured. Subscription features depending on Stripe will be limited.');
  stripe = null;
}
const db = require('../config/db');

const getSubscriptionStatus = async (req, res) => {
  try {
    let rows;
    try {
      [rows] = await db.execute(
        `SELECT plan_type, status, stripe_subscription_id, current_period_start, current_period_end, created_at, updated_at
         FROM subscriptions 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [req.user.id]
      );
    } catch (dbError) {
      if (dbError.code === 'ER_BAD_FIELD_ERROR') {
        // Fallback if enhanced columns don't exist yet
        [rows] = await db.execute(
          `SELECT plan_type, status, stripe_subscription_id, created_at, updated_at
           FROM subscriptions 
           WHERE user_id = ? 
           ORDER BY created_at DESC 
           LIMIT 1`,
          [req.user.id]
        );
        // Normalize shape
        rows = rows.map(r => ({
          ...r,
          current_period_start: null,
          current_period_end: null
        }));
      } else {
        throw dbError;
      }
    }

    if (!rows.length) {
      // Fallback to user record if no subscription rows exist yet
      try {
        const [users] = await db.execute(
          'SELECT subscription_status, subscription_plan_type, subscription_started_at, created_at, updated_at FROM users WHERE id = ?',
          [req.user.id]
        );
        if (users.length > 0 && users[0].subscription_status) {
          return res.json({
            plan_type: users[0].subscription_plan_type || null,
            status: users[0].subscription_status || 'none',
            expires_at: null,
            next_billing_date: null,
            cancel_at_period_end: false,
            canceled_at: null,
            created_at: users[0].subscription_started_at || users[0].created_at,
            updated_at: users[0].updated_at
          });
        }
      } catch (fallbackErr) {
        // ignore and return default
      }
      return res.json({ 
        status: 'none',
        message: 'No subscription found'
      });
    }

    const subscription = rows[0];
    
    // If we have a Stripe subscription ID, get the latest status from Stripe
    if (subscription.stripe_subscription_id && stripe) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        
        // Update local database if status differs
        if (stripeSubscription.status !== subscription.status) {
          await db.execute(
            'UPDATE subscriptions SET status = ?, updated_at = NOW() WHERE stripe_subscription_id = ?',
            [stripeSubscription.status, subscription.stripe_subscription_id]
          );
          
          // Update user status
          const userStatus = stripeSubscription.status === 'active' ? 'active' : 'inactive';
          await db.execute(
            'UPDATE users SET subscription_status = ?, subscription_plan_type = COALESCE(subscription_plan_type, ?), subscription_started_at = COALESCE(subscription_started_at, NOW()) WHERE id = ?',
            [userStatus, subscription.plan_type || 'unknown', req.user.id]
          );
          
          subscription.status = stripeSubscription.status;
        }
        
        // Add Stripe-specific information
        subscription.next_billing_date = new Date(stripeSubscription.current_period_end * 1000);
        subscription.cancel_at_period_end = stripeSubscription.cancel_at_period_end;
        subscription.canceled_at = stripeSubscription.canceled_at ? new Date(stripeSubscription.canceled_at * 1000) : null;
        
      } catch (stripeError) {
        console.error('Error fetching Stripe subscription:', stripeError);
        // Continue with database data if Stripe call fails
      }
    }

    res.json({
      plan_type: subscription.plan_type,
      status: subscription.status,
      expires_at: subscription.current_period_end || null,
      next_billing_date: subscription.next_billing_date,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at
    });
  } catch (error) {
    console.error('Get subscription status error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

const cancelSubscription = async (req, res) => {
  try {
    // Get current subscription
    const [subscriptions] = await db.execute(
      'SELECT stripe_subscription_id, status FROM subscriptions WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ 
        message: 'No active subscription found',
        code: 'NO_ACTIVE_SUBSCRIPTION'
      });
    }

    const subscription = subscriptions[0];

    // Cancel subscription in Stripe (at period end)
    if (subscription.stripe_subscription_id && stripe) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true
        });
        
        console.log(`Stripe subscription ${subscription.stripe_subscription_id} set to cancel at period end`);
      } catch (stripeError) {
        console.error('Error cancelling Stripe subscription:', stripeError);
        return res.status(500).json({ 
          message: 'Failed to cancel subscription with payment provider',
          code: 'STRIPE_CANCELLATION_ERROR'
        });
      }
    }

    // Update subscription in database (don't change status yet, let it expire naturally)
    await db.execute(
      'UPDATE subscriptions SET updated_at = NOW() WHERE user_id = ? AND status = "active"',
      [req.user.id]
    );

    res.json({ 
      message: 'Subscription will be cancelled at the end of the current billing period',
      cancellation_effective_date: subscription.current_period_end
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

const reactivateSubscription = async (req, res) => {
  try {
    // Get current subscription
    const [subscriptions] = await db.execute(
      'SELECT stripe_subscription_id, status FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ 
        message: 'No subscription found',
        code: 'NO_SUBSCRIPTION'
      });
    }

    const subscription = subscriptions[0];

    if (subscription.status === 'active') {
      return res.status(400).json({ 
        message: 'Subscription is already active',
        code: 'ALREADY_ACTIVE'
      });
    }

    // Reactivate subscription in Stripe
    if (subscription.stripe_subscription_id && stripe) {
      try {
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: false
        });
        
        console.log(`Stripe subscription ${subscription.stripe_subscription_id} reactivated`);
      } catch (stripeError) {
        console.error('Error reactivating Stripe subscription:', stripeError);
        return res.status(500).json({ 
          message: 'Failed to reactivate subscription with payment provider',
          code: 'STRIPE_REACTIVATION_ERROR'
        });
      }
    }

    res.json({ 
      message: 'Subscription reactivated successfully'
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

const updateSubscriptionPlan = async (req, res) => {
  try {
    const { newPlanId } = req.body;

    if (!newPlanId || !['basic', 'premium', 'family'].includes(newPlanId)) {
      return res.status(400).json({ 
        message: 'Invalid plan ID. Must be one of: basic, premium, family',
        code: 'INVALID_PLAN_ID'
      });
    }

    // Get current subscription
    const [subscriptions] = await db.execute(
      'SELECT stripe_subscription_id, plan_type, status FROM subscriptions WHERE user_id = ? AND status = "active" ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );

    if (subscriptions.length === 0) {
      return res.status(404).json({ 
        message: 'No active subscription found',
        code: 'NO_ACTIVE_SUBSCRIPTION'
      });
    }

    const subscription = subscriptions[0];

    if (subscription.plan_type === newPlanId) {
      return res.status(400).json({ 
        message: 'You are already subscribed to this plan',
        code: 'SAME_PLAN'
      });
    }

    // Plan prices (in cents)
    const planPrices = {
      basic: 899,
      premium: 1399,
      family: 1799
    };

    // Update subscription in Stripe
    if (subscription.stripe_subscription_id && stripe) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
        
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${newPlanId.charAt(0).toUpperCase() + newPlanId.slice(1)} Plan`
              },
              unit_amount: planPrices[newPlanId],
              recurring: {
                interval: 'month'
              }
            }
          }],
          proration_behavior: 'create_prorations'
        });
        
        console.log(`Stripe subscription ${subscription.stripe_subscription_id} updated to ${newPlanId} plan`);
      } catch (stripeError) {
        console.error('Error updating Stripe subscription:', stripeError);
        return res.status(500).json({ 
          message: 'Failed to update subscription with payment provider',
          code: 'STRIPE_UPDATE_ERROR'
        });
      }
    }

    // Update subscription in database
    await db.execute(
      'UPDATE subscriptions SET plan_type = ?, updated_at = NOW() WHERE user_id = ? AND status = "active"',
      [newPlanId, req.user.id]
    );

    res.json({ 
      message: `Subscription updated to ${newPlanId} plan successfully`,
      new_plan: newPlanId
    });
  } catch (error) {
    console.error('Update subscription plan error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

const getSubscriptionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const limitInt = Number.isFinite(parseInt(limit)) ? parseInt(limit) : 10;
    const pageInt = Number.isFinite(parseInt(page)) ? parseInt(page) : 1;
    const offset = (pageInt - 1) * limitInt;

    const historyQuery = `
      SELECT plan_type, status, stripe_subscription_id, current_period_start, current_period_end, created_at, updated_at
      FROM subscriptions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ${limitInt} OFFSET ${offset}`;
    const [subscriptions] = await db.execute(historyQuery, [req.user.id]);

    // Get total count for pagination
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM subscriptions WHERE user_id = ?',
      [req.user.id]
    );

    const totalSubscriptions = countResult[0].total;
    const totalPages = Math.ceil(totalSubscriptions / limitInt);

    res.json({
      subscriptions,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalSubscriptions,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Get subscription history error:', error);
    res.status(500).json({ message: 'Internal server error. Please try again later.' });
  }
};

// Dev utility: mark subscription active without Stripe webhook (for local testing)
const activateSubscriptionDev = async (req, res) => {
  try {
    const { plan = 'basic' } = req.body || {};
    // Upsert subscription row
    await db.execute(
      `INSERT INTO subscriptions (user_id, plan_type, status, created_at, updated_at)
       VALUES (?, ?, 'active', NOW(), NOW())
       ON DUPLICATE KEY UPDATE plan_type = VALUES(plan_type), status = 'active', updated_at = NOW()`,
      [req.user.id, plan]
    );

    // Update user flags
    await db.execute(
      'UPDATE users SET subscription_status = ?, subscription_plan_type = ?, subscription_started_at = COALESCE(subscription_started_at, NOW()) WHERE id = ?',
      ['active', plan, req.user.id]
    );

    res.json({ message: 'Subscription activated for development', plan });
  } catch (error) {
    console.error('Dev activate subscription error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { 
  getSubscriptionStatus, 
  cancelSubscription, 
  reactivateSubscription, 
  updateSubscriptionPlan, 
  getSubscriptionHistory,
  activateSubscriptionDev
};
