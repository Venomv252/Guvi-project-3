import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SubscriptionPlans from '../components/SubscriptionPlans';
import SubscriptionDashboard from '../components/SubscriptionDashboard';
import LoadingSpinner from '../components/LoadingSpinner';
import ComponentErrorBoundary from '../components/ComponentErrorBoundary';
import { useNotification } from '../components/NotificationSystem';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const Subscription = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [error, setError] = useState(null);
  const [devPlan, setDevPlan] = useState('basic');

  useEffect(() => {
    fetchSubscriptionStatus();
    handleSuccessCallback();
  }, []);

  const handleSuccessCallback = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      const plan = params.get('plan');
      showSuccess(`Successfully subscribed to ${plan} plan!`, {
        duration: 5000
      });
      window.history.replaceState({}, document.title, '/subscription');
      // Dev: call backend to mark subscription active (no Stripe webhooks locally)
      (async () => {
        try {
          await apiService.post('/subscriptions/dev/activate', { plan });
        } catch (e) {
          // ignore in case endpoint disabled
        } finally {
          setTimeout(() => {
            fetchSubscriptionStatus();
          }, 1000);
        }
      })();
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.get('/subscriptions/status', {
        errorHandling: { showNotification: false }
      });
      
      setCurrentSubscription(data);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = async (plan) => {
    try {
      setProcessingPayment(true);
      
      // Create Stripe checkout session
      const response = await apiService.post('/payments/create-checkout-session', {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        currency: plan.currency,
        interval: plan.interval
      });
      
      // Redirect to Stripe Checkout
      if (response.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL received');
      }
      
    } catch (err) {
      console.error('Payment processing error:', err);
      showError(err.message || 'Failed to process payment. Please try again.');
      setProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium content.')) {
      return;
    }

    try {
      setProcessingPayment(true);
      
      await apiService.post('/subscriptions/cancel');
      
      showSuccess('Subscription cancelled successfully');
      
      // Update user state
      setUser(prev => ({ ...prev, subscription_status: 'inactive' }));
      
      // Refresh subscription status
      await fetchSubscriptionStatus();
      
    } catch (err) {
      console.error('Cancellation error:', err);
      showError(err.message || 'Failed to cancel subscription. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const containerStyle = {
    minHeight: '100vh',
    backgroundColor: '#000',
    paddingTop: '2rem'
  };

  const currentPlanSectionStyle = {
    backgroundColor: '#111',
    borderRadius: '12px',
    padding: '2rem',
    margin: '2rem auto',
    maxWidth: '800px',
    textAlign: 'center'
  };

  const currentPlanTitleStyle = {
    color: '#fff',
    fontSize: '1.5rem',
    marginBottom: '1rem'
  };

  const currentPlanInfoStyle = {
    color: '#ccc',
    fontSize: '1rem',
    marginBottom: '1.5rem'
  };

  const cancelButtonStyle = {
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background-color 0.2s'
  };

  const manageButtonStyle = {
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginRight: '1rem',
    transition: 'background-color 0.2s'
  };

  const errorStyle = {
    textAlign: 'center',
    padding: '3rem 2rem',
    color: '#ccc'
  };

  const retryButtonStyle = {
    backgroundColor: '#e50914',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '1rem'
  };

  const devBoxStyle = {
    backgroundColor: '#111',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    margin: '1rem auto',
    maxWidth: '800px',
    color: '#fff',
    border: '1px dashed #333'
  };

  const isDev = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const handleDevActivate = async () => {
    try {
      setProcessingPayment(true);
      await apiService.post('/subscriptions/dev/activate', { plan: devPlan });
      showSuccess(`Dev: activated ${devPlan} plan`);
      await fetchSubscriptionStatus();
    } catch (err) {
      showError(err.message || 'Dev activation failed');
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <LoadingSpinner 
          size="large" 
          message="Loading subscription information..." 
          fullScreen={true}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={errorStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ color: '#fff', marginBottom: '1rem' }}>
            Failed to Load Subscription
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            {error.message || 'Unable to load subscription information'}
          </p>
          <button 
            onClick={fetchSubscriptionStatus}
            style={retryButtonStyle}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#c41e3a'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#e50914'}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ComponentErrorBoundary componentName="Subscription">
      <div style={containerStyle}>
        {/* Subscription Dashboard */}
        {currentSubscription && currentSubscription.status !== 'none' && (
          <SubscriptionDashboard 
            subscription={currentSubscription}
            onSubscriptionUpdate={fetchSubscriptionStatus}
          />
        )}

        {/* Dev-only plan activation helper */}
        {isDev && (
          <div style={devBoxStyle}>
            <h3 style={{ marginTop: 0, marginBottom: '0.75rem' }}>Dev: Activate Plan (no Stripe)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <select
                value={devPlan}
                onChange={(e) => setDevPlan(e.target.value)}
                style={{ background: '#000', color: '#fff', border: '1px solid #333', borderRadius: '6px', padding: '0.5rem' }}
              >
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="family">Family</option>
              </select>
              <button
                onClick={handleDevActivate}
                style={manageButtonStyle}
                disabled={processingPayment}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#444'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#333'}
              >
                {processingPayment ? 'Activating...' : 'Activate Plan'}
              </button>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <SubscriptionPlans
          currentPlan={currentSubscription}
          onSelectPlan={handlePlanSelect}
          loading={processingPayment}
        />
      </div>
    </ComponentErrorBoundary>
  );
};

export default Subscription;
