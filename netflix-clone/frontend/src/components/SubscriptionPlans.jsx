// frontend/src/components/SubscriptionPlans.jsx
import React, { useState } from 'react';
import ComponentErrorBoundary from './ComponentErrorBoundary';

const SubscriptionPlans = ({ 
  currentPlan = null,
  onSelectPlan,
  loading = false,
  className = '',
  style = {}
}) => {
  const [selectedPlan, setSelectedPlan] = useState(currentPlan?.plan_type || '');

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 8.99,
      currency: 'USD',
      interval: 'month',
      features: [
        'Watch on 1 screen at a time',
        'Watch on your laptop, TV, phone and tablet',
        'Unlimited movies and TV shows',
        'Standard Definition (SD) quality',
        'Cancel anytime'
      ],
      limitations: [
        'No HD or Ultra HD',
        'Limited to 1 device'
      ],
      popular: false,
      color: '#666'
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 13.99,
      currency: 'USD',
      interval: 'month',
      features: [
        'Watch on 2 screens at the same time',
        'Watch on your laptop, TV, phone and tablet',
        'Unlimited movies and TV shows',
        'High Definition (HD) quality',
        'Download on 2 devices for offline viewing',
        'Cancel anytime'
      ],
      limitations: [
        'No Ultra HD'
      ],
      popular: true,
      color: '#e50914'
    },
    {
      id: 'family',
      name: 'Family',
      price: 17.99,
      currency: 'USD',
      interval: 'month',
      features: [
        'Watch on 4 screens at the same time',
        'Watch on your laptop, TV, phone and tablet',
        'Unlimited movies and TV shows',
        'Ultra High Definition (4K) quality',
        'Download on 4 devices for offline viewing',
        'Create up to 5 profiles',
        'Parental controls',
        'Cancel anytime'
      ],
      limitations: [],
      popular: false,
      color: '#f59e0b'
    }
  ];

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan.id);
    if (onSelectPlan) {
      onSelectPlan(plan);
    }
  };

  const containerStyle = {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
    ...style
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '3rem'
  };

  const titleStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '1rem'
  };

  const subtitleStyle = {
    fontSize: '1.1rem',
    color: '#ccc',
    lineHeight: '1.6',
    maxWidth: '600px',
    margin: '0 auto'
  };

  const plansGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    marginBottom: '3rem'
  };

  const planCardStyle = {
    backgroundColor: '#111',
    borderRadius: '12px',
    padding: '2rem',
    position: 'relative',
    transition: 'all 0.3s ease',
    border: '2px solid transparent',
    cursor: 'pointer'
  };

  const popularBadgeStyle = {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#e50914',
    color: '#fff',
    padding: '0.5rem 1.5rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  };

  const planHeaderStyle = {
    textAlign: 'center',
    marginBottom: '2rem'
  };

  const planNameStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '0.5rem'
  };

  const planPriceStyle = {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: '0.5rem'
  };

  const planIntervalStyle = {
    fontSize: '1rem',
    color: '#ccc'
  };

  const featuresListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 2rem 0'
  };

  const featureItemStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
    color: '#ccc',
    fontSize: '0.9rem',
    lineHeight: '1.4'
  };

  const checkIconStyle = {
    color: '#4ade80',
    marginRight: '0.75rem',
    marginTop: '0.1rem',
    fontSize: '1rem'
  };

  const limitationsStyle = {
    marginBottom: '2rem'
  };

  const limitationsTitleStyle = {
    fontSize: '0.9rem',
    color: '#999',
    marginBottom: '0.5rem',
    fontWeight: '500'
  };

  const limitationItemStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '0.5rem',
    color: '#999',
    fontSize: '0.8rem',
    lineHeight: '1.4'
  };

  const crossIconStyle = {
    color: '#ef4444',
    marginRight: '0.75rem',
    marginTop: '0.1rem',
    fontSize: '0.8rem'
  };

  const selectButtonStyle = {
    width: '100%',
    padding: '1rem',
    borderRadius: '8px',
    border: 'none',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textTransform: 'uppercase'
  };

  const currentPlanBadgeStyle = {
    backgroundColor: '#4ade80',
    color: '#fff',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    width: '100%',
    textAlign: 'center'
  };

  const comparisonTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#111',
    borderRadius: '12px',
    overflow: 'hidden',
    marginTop: '3rem'
  };

  const tableHeaderStyle = {
    backgroundColor: '#222',
    color: '#fff',
    fontWeight: 'bold',
    padding: '1rem',
    textAlign: 'left',
    borderBottom: '1px solid #333'
  };

  const tableCellStyle = {
    padding: '1rem',
    borderBottom: '1px solid #333',
    color: '#ccc'
  };

  const comparisonFeatures = [
    { feature: 'Monthly price', basic: '$8.99', premium: '$13.99', family: '$17.99' },
    { feature: 'Video quality', basic: 'Good (SD)', premium: 'Better (HD)', family: 'Best (4K+HDR)' },
    { feature: 'Resolution', basic: '480p', premium: '1080p', family: '4K+HDR' },
    { feature: 'Screens you can watch on at the same time', basic: '1', premium: '2', family: '4' },
    { feature: 'Download devices', basic: '1', premium: '2', family: '4' },
    { feature: 'Profiles', basic: '1', premium: '2', family: '5' },
    { feature: 'Parental controls', basic: '✗', premium: '✗', family: '✓' }
  ];

  return (
    <ComponentErrorBoundary componentName="SubscriptionPlans">
      <div style={containerStyle} className={className}>
        <div style={headerStyle}>
          <h1 style={titleStyle}>Choose the plan that's right for you</h1>
          <p style={subtitleStyle}>
            Join millions of people who enjoy unlimited movies and TV shows. 
            Cancel anytime. Ready to watch? Enter your email to create or restart your membership.
          </p>
        </div>

        <div style={plansGridStyle}>
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            const isCurrent = currentPlan?.plan_type === plan.id;
            
            return (
              <div
                key={plan.id}
                style={{
                  ...planCardStyle,
                  borderColor: isSelected ? plan.color : 'transparent',
                  transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isSelected ? `0 8px 32px ${plan.color}40` : 'none'
                }}
                onClick={() => handlePlanSelect(plan)}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.borderColor = plan.color + '80';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }
                }}
              >
                {plan.popular && (
                  <div style={popularBadgeStyle}>Most Popular</div>
                )}

                <div style={planHeaderStyle}>
                  <h3 style={planNameStyle}>{plan.name}</h3>
                  <div style={planPriceStyle}>
                    ${plan.price}
                    <span style={planIntervalStyle}>/{plan.interval}</span>
                  </div>
                </div>

                <ul style={featuresListStyle}>
                  {plan.features.map((feature, index) => (
                    <li key={index} style={featureItemStyle}>
                      <span style={checkIconStyle}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {plan.limitations.length > 0 && (
                  <div style={limitationsStyle}>
                    <div style={limitationsTitleStyle}>Limitations:</div>
                    {plan.limitations.map((limitation, index) => (
                      <div key={index} style={limitationItemStyle}>
                        <span style={crossIconStyle}>✗</span>
                        {limitation}
                      </div>
                    ))}
                  </div>
                )}

                {isCurrent ? (
                  <div style={currentPlanBadgeStyle}>
                    Current Plan
                  </div>
                ) : (
                  <button
                    style={{
                      ...selectButtonStyle,
                      backgroundColor: isSelected ? plan.color : '#333',
                      color: '#fff'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = plan.color;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.target.style.backgroundColor = '#333';
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : `Select ${plan.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Comparison Table */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: '#fff', fontSize: '1.8rem', marginBottom: '1rem' }}>
            Compare Plans
          </h2>
          <p style={{ color: '#ccc', fontSize: '1rem' }}>
            See what's included with each plan
          </p>
        </div>

        <table style={comparisonTableStyle}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Features</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Basic</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'center', backgroundColor: '#e50914' }}>Premium</th>
              <th style={{ ...tableHeaderStyle, textAlign: 'center' }}>Family</th>
            </tr>
          </thead>
          <tbody>
            {comparisonFeatures.map((row, index) => (
              <tr key={index}>
                <td style={{ ...tableCellStyle, fontWeight: '500', color: '#fff' }}>
                  {row.feature}
                </td>
                <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                  {row.basic}
                </td>
                <td style={{ ...tableCellStyle, textAlign: 'center', backgroundColor: '#1a0a0a' }}>
                  {row.premium}
                </td>
                <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                  {row.family}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ComponentErrorBoundary>
  );
};

export default SubscriptionPlans;