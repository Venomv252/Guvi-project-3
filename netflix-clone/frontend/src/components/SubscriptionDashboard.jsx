// frontend/src/components/SubscriptionDashboard.jsx
import React, { useState, useEffect } from 'react';
import ComponentErrorBoundary from './ComponentErrorBoundary';
import LoadingSpinner from './LoadingSpinner';
import { useNotification } from './NotificationSystem';
import apiService from '../services/apiService';

const SubscriptionDashboard = ({ subscription, onSubscriptionUpdate }) => {
  const { showSuccess, showError } = useNotification();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (activeTab === 'payments') {
      fetchPaymentHistory();
    } else if (activeTab === 'history') {
      fetchSubscriptionHistory();
    }
  }, [activeTab]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/payments/history', {
        errorHandling: { showNotification: false }
      });
      setPaymentHistory(data.payments || []);
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
      showError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionHistory = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/subscriptions/history', {
        errorHandling: { showNotification: false }
      });
      setSubscriptionHistory(data.subscriptions || []);
    } catch (err) {
      console.error('Failed to fetch subscription history:', err);
      showError('Failed to load subscription history');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium content at the end of your billing period.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.post('/subscriptions/cancel');
      showSuccess(response.message || 'Subscription cancelled successfully');
      onSubscriptionUpdate();
    } catch (err) {
      console.error('Cancellation error:', err);
      showError(err.message || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    try {
      setLoading(true);
      const response = await apiService.post('/subscriptions/reactivate');
      showSuccess(response.message || 'Subscription reactivated successfully');
      onSubscriptionUpdate();
    } catch (err) {
      console.error('Reactivation error:', err);
      showError(err.message || 'Failed to reactivate subscription');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#4ade80';
      case 'cancelled': return '#f59e0b';
      case 'past_due': return '#ef4444';
      case 'expired': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Active';
      case 'cancelled': return 'Cancelled';
      case 'past_due': return 'Past Due';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const containerStyle = {
    backgroundColor: '#111',
    borderRadius: '12px',
    padding: '2rem',
    margin: '2rem 0'
  };

  const headerStyle = {
    marginBottom: '2rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #333'
  };

  const titleStyle = {
    color: '#fff',
    fontSize: '1.8rem',
    marginBottom: '0.5rem'
  };

  const subtitleStyle = {
    color: '#ccc',
    fontSize: '1rem'
  };

  const tabsStyle = {
    display: 'flex',
    marginBottom: '2rem',
    borderBottom: '1px solid #333'
  };

  const tabStyle = {
    padding: '1rem 1.5rem',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#ccc',
    cursor: 'pointer',
    fontSize: '1rem',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s'
  };

  const activeTabStyle = {
    ...tabStyle,
    color: '#fff',
    borderBottomColor: '#e50914'
  };

  const overviewGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  };

  const cardStyle = {
    backgroundColor: '#222',
    borderRadius: '8px',
    padding: '1.5rem'
  };

  const cardTitleStyle = {
    color: '#ccc',
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const cardValueStyle = {
    color: '#fff',
    fontSize: '1.2rem',
    fontWeight: 'bold'
  };

  const statusBadgeStyle = {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  };

  const buttonStyle = {
    padding: '0.75rem 1.5rem',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s',
    marginRight: '1rem'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#e50914',
    color: '#fff'
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#333',
    color: '#fff'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc2626',
    color: '#fff'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#222',
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const tableHeaderStyle = {
    backgroundColor: '#333',
    color: '#fff',
    fontWeight: 'bold',
    padding: '1rem',
    textAlign: 'left'
  };

  const tableCellStyle = {
    padding: '1rem',
    borderBottom: '1px solid #333',
    color: '#ccc'
  };

  const renderOverview = () => (
    <div>
      <div style={overviewGridStyle}>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Current Plan</div>
          <div style={cardValueStyle}>
            {subscription.plan_type?.charAt(0).toUpperCase() + subscription.plan_type?.slice(1) || 'None'}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>Status</div>
          <div style={cardValueStyle}>
            <span 
              style={{
                ...statusBadgeStyle,
                backgroundColor: getStatusColor(subscription.status),
                color: '#000'
              }}
            >
              {getStatusText(subscription.status)}
            </span>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>Next Billing Date</div>
          <div style={cardValueStyle}>
            {subscription.next_billing_date ? formatDate(subscription.next_billing_date) : 'N/A'}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>Member Since</div>
          <div style={cardValueStyle}>
            {subscription.created_at ? formatDate(subscription.created_at) : 'N/A'}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Manage Subscription</h3>
        
        {subscription.status === 'active' && !subscription.cancel_at_period_end && (
          <button
            style={dangerButtonStyle}
            onClick={handleCancelSubscription}
            disabled={loading}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
          >
            {loading ? 'Processing...' : 'Cancel Subscription'}
          </button>
        )}

        {subscription.cancel_at_period_end && (
          <div>
            <p style={{ color: '#f59e0b', marginBottom: '1rem' }}>
              Your subscription will be cancelled on {formatDate(subscription.next_billing_date)}
            </p>
            <button
              style={primaryButtonStyle}
              onClick={handleReactivateSubscription}
              disabled={loading}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#c41e3a'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#e50914'}
            >
              {loading ? 'Processing...' : 'Reactivate Subscription'}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderPaymentHistory = () => (
    <div>
      {loading ? (
        <LoadingSpinner message="Loading payment history..." />
      ) : paymentHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <p>No payment history available</p>
        </div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Date</th>
              <th style={tableHeaderStyle}>Amount</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={tableHeaderStyle}>Payment ID</th>
            </tr>
          </thead>
          <tbody>
            {paymentHistory.map((payment) => (
              <tr key={payment.id}>
                <td style={tableCellStyle}>{formatDate(payment.created_at)}</td>
                <td style={tableCellStyle}>{formatCurrency(payment.amount, payment.currency)}</td>
                <td style={tableCellStyle}>
                  <span 
                    style={{
                      ...statusBadgeStyle,
                      backgroundColor: payment.status === 'completed' ? '#4ade80' : '#ef4444',
                      color: '#000'
                    }}
                  >
                    {payment.status}
                  </span>
                </td>
                <td style={tableCellStyle}>
                  <code style={{ fontSize: '0.8rem' }}>
                    {payment.stripe_payment_id?.substring(0, 20)}...
                  </code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderSubscriptionHistory = () => (
    <div>
      {loading ? (
        <LoadingSpinner message="Loading subscription history..." />
      ) : subscriptionHistory.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <p>No subscription history available</p>
        </div>
      ) : (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Plan</th>
              <th style={tableHeaderStyle}>Status</th>
              <th style={tableHeaderStyle}>Start Date</th>
              <th style={tableHeaderStyle}>End Date</th>
            </tr>
          </thead>
          <tbody>
            {subscriptionHistory.map((sub, index) => (
              <tr key={index}>
                <td style={tableCellStyle}>
                  {sub.plan_type?.charAt(0).toUpperCase() + sub.plan_type?.slice(1)}
                </td>
                <td style={tableCellStyle}>
                  <span 
                    style={{
                      ...statusBadgeStyle,
                      backgroundColor: getStatusColor(sub.status),
                      color: '#000'
                    }}
                  >
                    {getStatusText(sub.status)}
                  </span>
                </td>
                <td style={tableCellStyle}>{formatDate(sub.created_at)}</td>
                <td style={tableCellStyle}>
                  {sub.current_period_end ? formatDate(sub.current_period_end) : 'N/A'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <ComponentErrorBoundary componentName="SubscriptionDashboard">
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Subscription Dashboard</h2>
          <p style={subtitleStyle}>Manage your subscription and view billing history</p>
        </div>

        <div style={tabsStyle}>
          {['overview', 'payments', 'history'].map((tab) => (
            <button
              key={tab}
              style={activeTab === tab ? activeTabStyle : tabStyle}
              onClick={() => setActiveTab(tab)}
              onMouseEnter={(e) => {
                if (activeTab !== tab) {
                  e.target.style.color = '#fff';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab) {
                  e.target.style.color = '#ccc';
                }
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'payments' && renderPaymentHistory()}
        {activeTab === 'history' && renderSubscriptionHistory()}
      </div>
    </ComponentErrorBoundary>
  );
};

export default SubscriptionDashboard;