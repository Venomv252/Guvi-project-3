// frontend/src/components/__tests__/SubscriptionPlans.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SubscriptionPlans from '../SubscriptionPlans';

describe('SubscriptionPlans', () => {
  const mockOnSelectPlan = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all three subscription plans', () => {
    render(<SubscriptionPlans onSelectPlan={mockOnSelectPlan} />);
    
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Premium')).toBeInTheDocument();
    expect(screen.getByText('Family')).toBeInTheDocument();
  });

  it('should display plan prices correctly', () => {
    render(<SubscriptionPlans onSelectPlan={mockOnSelectPlan} />);
    
    expect(screen.getByText('$8.99')).toBeInTheDocument();
    expect(screen.getByText('$13.99')).toBeInTheDocument();
    expect(screen.getByText('$17.99')).toBeInTheDocument();
  });

  it('should show "Most Popular" badge on Premium plan', () => {
    render(<SubscriptionPlans onSelectPlan={mockOnSelectPlan} />);
    
    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('should call onSelectPlan when a plan is selected', () => {
    render(<SubscriptionPlans onSelectPlan={mockOnSelectPlan} />);
    
    const basicPlanButton = screen.getByText('Select Basic');
    fireEvent.click(basicPlanButton);
    
    expect(mockOnSelectPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'basic',
        name: 'Basic',
        price: 8.99
      })
    );
  });

  it('should show "Current Plan" for active subscription', () => {
    const currentPlan = { plan_type: 'premium' };
    
    render(
      <SubscriptionPlans 
        currentPlan={currentPlan}
        onSelectPlan={mockOnSelectPlan} 
      />
    );
    
    expect(screen.getByText('Current Plan')).toBeInTheDocument();
    expect(screen.queryByText('Select Premium')).not.toBeInTheDocument();
  });

  it('should display plan features correctly', () => {
    render(<SubscriptionPlans onSelectPlan={mockOnSelectPlan} />);
    
    // Check for some key features
    expect(screen.getByText('Watch on 1 screen at a time')).toBeInTheDocument();
    expect(screen.getByText('Watch on 2 screens at the same time')).toBeInTheDocument();
    expect(screen.getByText('Watch on 4 screens at the same time')).toBeInTheDocument();
    expect(screen.getByText('Ultra High Definition (4K) quality')).toBeInTheDocument();
  });

  it('should display plan limitations', () => {
    render(<SubscriptionPlans onSelectPlan={mockOnSelectPlan} />);
    
    expect(screen.getByText('No HD or Ultra HD')).toBeInTheDocument();
    expect(screen.getByText('Limited to 1 device')).toBeInTheDocument();
    expect(screen.getByText('No Ultra HD')).toBeInTheDocument();
  });

  it('should render comparison table', () => {
    render(<SubscriptionPlans onSelectPlan={mockOnSelectPlan} />);
    
    expect(screen.getByText('Compare Plans')).toBeInTheDocument();
    expect(screen.getByText('Monthly price')).toBeInTheDocument();
    expect(screen.getByText('Video quality')).toBeInTheDocument();
    expect(screen.getByText('Resolution')).toBeInTheDocument();
  });

  it('should show loading state when processing', () => {
    render(
      <SubscriptionPlans 
        onSelectPlan={mockOnSelectPlan}
        loading={true}
      />
    );
    
    const buttons = screen.getAllByText('Processing...');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should handle plan card hover effects', () => {
    render(<SubscriptionPlans onSelectPlan={mockOnSelectPlan} />);
    
    const basicCard = screen.getByText('Basic').closest('div');
    
    fireEvent.mouseEnter(basicCard);
    // Card should have hover effects applied
    expect(basicCard.style.transform).toBe('scale(1.02)');
    
    fireEvent.mouseLeave(basicCard);
    expect(basicCard.style.transform).toBe('scale(1)');
  });

  it('should highlight selected plan', () => {
    render(<SubscriptionPlans onSelectPlan={mockOnSelectPlan} />);
    
    const basicCard = screen.getByText('Basic').closest('div');
    fireEvent.click(basicCard);
    
    // Selected card should have different styling
    expect(basicCard.style.transform).toBe('scale(1.05)');
    expect(basicCard.style.borderColor).toBe('#666');
  });

  it('should display correct comparison table data', () => {
    render(<SubscriptionPlans onSelectPlan={mockOnSelectPlan} />);
    
    // Check specific comparison data
    expect(screen.getByText('Good (SD)')).toBeInTheDocument();
    expect(screen.getByText('Better (HD)')).toBeInTheDocument();
    expect(screen.getByText('Best (4K+HDR)')).toBeInTheDocument();
    expect(screen.getByText('480p')).toBeInTheDocument();
    expect(screen.getByText('1080p')).toBeInTheDocument();
    expect(screen.getByText('4K+HDR')).toBeInTheDocument();
  });
});