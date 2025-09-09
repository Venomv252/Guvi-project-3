// frontend/src/components/__tests__/LoadingSpinner.test.js
import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('generic');
    expect(spinner).toBeInTheDocument();
  });

  it('should display message when provided', () => {
    const message = 'Loading videos...';
    render(<LoadingSpinner message={message} />);
    
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('should not display message when not provided', () => {
    render(<LoadingSpinner />);
    
    // Should not have any text content
    const container = screen.getByRole('generic');
    expect(container.textContent).toBe('');
  });

  it('should apply overlay styles when overlay prop is true', () => {
    render(<LoadingSpinner overlay={true} />);
    
    const container = screen.getByRole('generic');
    const styles = window.getComputedStyle(container);
    
    expect(styles.position).toBe('absolute');
    expect(styles.zIndex).toBe('1000');
  });

  it('should apply fullScreen styles when fullScreen prop is true', () => {
    render(<LoadingSpinner fullScreen={true} />);
    
    const container = screen.getByRole('generic');
    const styles = window.getComputedStyle(container);
    
    expect(styles.position).toBe('fixed');
    expect(styles.zIndex).toBe('9999');
  });

  it('should apply different sizes correctly', () => {
    const { rerender } = render(<LoadingSpinner size="small" />);
    let spinner = screen.getByRole('generic').firstChild;
    expect(window.getComputedStyle(spinner).width).toBe('20px');

    rerender(<LoadingSpinner size="large" />);
    spinner = screen.getByRole('generic').firstChild;
    expect(window.getComputedStyle(spinner).width).toBe('60px');
  });

  it('should apply custom color', () => {
    const customColor = '#ff0000';
    render(<LoadingSpinner color={customColor} />);
    
    const spinner = screen.getByRole('generic').firstChild;
    const styles = window.getComputedStyle(spinner);
    
    expect(styles.borderTopColor).toBe('rgb(255, 0, 0)'); // #ff0000 in rgb
  });
});