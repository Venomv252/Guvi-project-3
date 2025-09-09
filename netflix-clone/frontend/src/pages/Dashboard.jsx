import React, { useEffect, useState } from 'react';
import ComponentErrorBoundary from '../components/ComponentErrorBoundary';
import LoadingSpinner from '../components/LoadingSpinner';
import { useNotification } from '../components/NotificationSystem';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import authService from '../services/authService';

const Dashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/subscriptions/status', { errorHandling: { showNotification: false } });
      setSubscription(data);
    } catch (err) {
      showError(err.message || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      showError('Please fill in all fields');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      showError('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await authService.changePassword(form.currentPassword, form.newPassword);
      showSuccess('Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      showError(err.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const containerStyle = { padding: '2rem', maxWidth: '800px', margin: '0 auto', color: '#fff' };
  const cardStyle = { backgroundColor: '#111', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' };
  const labelStyle = { display: 'block', marginBottom: '0.5rem', color: '#ccc' };
  const inputStyle = { width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #333', background: '#000', color: '#fff', marginBottom: '1rem' };
  const buttonStyle = { background: '#e50914', color: '#fff', border: 'none', borderRadius: '6px', padding: '0.75rem 1.25rem', cursor: 'pointer' };

  if (loading) {
    return (
      <div style={containerStyle}>
        <LoadingSpinner message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <ComponentErrorBoundary componentName="Dashboard">
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Subscription Status</h2>
          <p><strong>Plan:</strong> {subscription?.plan_type || 'None'}</p>
          <p><strong>Status:</strong> {subscription?.status || 'none'}</p>
          {subscription?.next_billing_date && (
            <p><strong>Next Billing:</strong> {new Date(subscription.next_billing_date).toLocaleString()}</p>
          )}
        </div>

        <div style={cardStyle}>
          <h2 style={{ marginTop: 0 }}>Change Password</h2>
          <form onSubmit={onSubmit}>
            <label style={labelStyle} htmlFor="currentPassword">Current Password</label>
            <input id="currentPassword" name="currentPassword" type="password" value={form.currentPassword} onChange={onChange} style={inputStyle} placeholder="Enter current password" />

            <label style={labelStyle} htmlFor="newPassword">New Password</label>
            <input id="newPassword" name="newPassword" type="password" value={form.newPassword} onChange={onChange} style={inputStyle} placeholder="Enter new password" />

            <label style={labelStyle} htmlFor="confirmPassword">Confirm New Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={onChange} style={inputStyle} placeholder="Re-enter new password" />

            <button type="submit" style={buttonStyle} disabled={saving}>{saving ? 'Saving...' : 'Update Password'}</button>
          </form>
        </div>
      </div>
    </ComponentErrorBoundary>
  );
};

export default Dashboard;


