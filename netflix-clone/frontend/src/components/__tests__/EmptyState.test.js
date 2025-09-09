// frontend/src/components/__tests__/EmptyState.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState, { NoVideosFound, NoSearchResults, SubscriptionRequired, NetworkError } from '../EmptyState';

describe('EmptyState', () => {
  it('should render with default props', () => {
    render(<EmptyState />);
    
    expect(screen.getByText('No content available')).toBeInTheDocument();
    expect(screen.getByText('There\'s nothing to show here right now.')).toBeInTheDocument();
    expect(screen.getByText('📭')).toBeInTheDocument();
  });

  it('should render with custom props', () => {
    const customProps = {
      icon: '🎬',
      title: 'Custom Title',
      message: 'Custom message',
      size: 'large'
    };

    render(<EmptyState {...customProps} />);
    
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom message')).toBeInTheDocument();
    expect(screen.getByText('🎬')).toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    const actionButton = <button>Custom Action</button>;
    
    render(<EmptyState actionButton={actionButton} />);
    
    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });

  it('should apply different sizes correctly', () => {
    const { rerender } = render(<EmptyState size="small" />);
    let container = screen.getByText('No content available').closest('div');
    expect(window.getComputedStyle(container).padding).toBe('2rem');

    rerender(<EmptyState size="large" />);
    container = screen.getByText('No content available').closest('div');
    expect(window.getComputedStyle(container).padding).toBe('6rem 2rem');
  });
});

describe('NoVideosFound', () => {
  it('should render with refresh button', () => {
    const mockRefresh = jest.fn();
    render(<NoVideosFound onRefresh={mockRefresh} />);
    
    expect(screen.getByText('No videos found')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
  });

  it('should call onRefresh when refresh button is clicked', () => {
    const mockRefresh = jest.fn();
    render(<NoVideosFound onRefresh={mockRefresh} />);
    
    fireEvent.click(screen.getByText('Refresh'));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('should not render refresh button when onRefresh is not provided', () => {
    render(<NoVideosFound />);
    
    expect(screen.queryByText('Refresh')).not.toBeInTheDocument();
  });
});

describe('NoSearchResults', () => {
  it('should render with search term in message', () => {
    const searchTerm = 'action movies';
    render(<NoSearchResults searchTerm={searchTerm} />);
    
    expect(screen.getByText(`We couldn't find any videos for "${searchTerm}". Try different keywords or browse our categories.`)).toBeInTheDocument();
  });

  it('should call onClearSearch when clear button is clicked', () => {
    const mockClearSearch = jest.fn();
    render(<NoSearchResults searchTerm="test" onClearSearch={mockClearSearch} />);
    
    fireEvent.click(screen.getByText('Clear Search'));
    expect(mockClearSearch).toHaveBeenCalledTimes(1);
  });
});

describe('SubscriptionRequired', () => {
  it('should render subscription message', () => {
    render(<SubscriptionRequired />);
    
    expect(screen.getByText('Subscription Required')).toBeInTheDocument();
    expect(screen.getByText(/You need an active subscription/)).toBeInTheDocument();
  });

  it('should call onSubscribe when view plans button is clicked', () => {
    const mockSubscribe = jest.fn();
    render(<SubscriptionRequired onSubscribe={mockSubscribe} />);
    
    fireEvent.click(screen.getByText('View Plans'));
    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });
});

describe('NetworkError', () => {
  it('should render network error message', () => {
    render(<NetworkError />);
    
    expect(screen.getByText('Connection Problem')).toBeInTheDocument();
    expect(screen.getByText(/We're having trouble connecting/)).toBeInTheDocument();
  });

  it('should call onRetry when try again button is clicked', () => {
    const mockRetry = jest.fn();
    render(<NetworkError onRetry={mockRetry} />);
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});