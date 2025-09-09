// frontend/src/components/__tests__/ComponentErrorBoundary.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ComponentErrorBoundary from '../ComponentErrorBoundary';

// Mock console.error to avoid noise in tests
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('Test component error');
  }
  return <div>Component working</div>;
};

describe('ComponentErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ComponentErrorBoundary componentName="TestComponent">
        <ThrowError shouldThrow={false} />
      </ComponentErrorBoundary>
    );

    expect(screen.getByText('Component working')).toBeInTheDocument();
  });

  it('should render default error UI when there is an error', () => {
    render(
      <ComponentErrorBoundary componentName="TestComponent">
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    );

    expect(screen.getByText('TestComponent Error')).toBeInTheDocument();
    expect(screen.getByText(/This component encountered an error/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('should render custom fallback UI when provided', () => {
    const customFallback = <div>Custom error message</div>;

    render(
      <ComponentErrorBoundary 
        componentName="TestComponent" 
        fallback={customFallback}
      >
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('TestComponent Error')).not.toBeInTheDocument();
  });

  it('should use generic component name when not provided', () => {
    render(
      <ComponentErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    );

    expect(screen.getByText('Component Error')).toBeInTheDocument();
  });

  it('should handle retry button click', () => {
    const { rerender } = render(
      <ComponentErrorBoundary componentName="TestComponent">
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    );

    expect(screen.getByText('TestComponent Error')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Try Again'));

    // After retry, the error boundary should reset
    rerender(
      <ComponentErrorBoundary componentName="TestComponent">
        <ThrowError shouldThrow={false} />
      </ComponentErrorBoundary>
    );

    expect(screen.getByText('Component working')).toBeInTheDocument();
  });

  it('should log error with component name', () => {
    render(
      <ComponentErrorBoundary componentName="TestComponent">
        <ThrowError shouldThrow={true} />
      </ComponentErrorBoundary>
    );

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Component Error in TestComponent:'),
      expect.any(Error),
      expect.any(Object)
    );
  });
});