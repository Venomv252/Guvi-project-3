// frontend/src/components/__tests__/SearchBar.test.js
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SearchBar from '../SearchBar';

// Mock timers for debounce testing
jest.useFakeTimers();

describe('SearchBar', () => {
  const mockOnSearch = jest.fn();
  const mockOnClear = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('should render with default placeholder', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    expect(screen.getByPlaceholderText('Search videos...')).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    render(<SearchBar onSearch={mockOnSearch} placeholder="Custom placeholder" />);
    
    expect(screen.getByPlaceholderText('Custom placeholder')).toBeInTheDocument();
  });

  it('should call onSearch after debounce delay', async () => {
    render(<SearchBar onSearch={mockOnSearch} debounceMs={300} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test query' } });
    
    // Should not call immediately
    expect(mockOnSearch).not.toHaveBeenCalled();
    
    // Fast-forward time
    jest.advanceTimersByTime(300);
    
    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('should show clear button when there is text', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    
    const clearButton = screen.getByText('✕');
    expect(clearButton).toBeVisible();
  });

  it('should clear input when clear button is clicked', () => {
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    
    const clearButton = screen.getByText('✕');
    fireEvent.click(clearButton);
    
    expect(input.value).toBe('');
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('should show suggestions when available', () => {
    const suggestions = ['Action Movies', 'Adventure Films', 'Animated Shows'];
    render(
      <SearchBar 
        onSearch={mockOnSearch} 
        suggestions={suggestions}
        showSuggestions={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.focus(input);
    
    suggestions.forEach(suggestion => {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    });
  });

  it('should filter suggestions based on query', () => {
    const suggestions = ['Action Movies', 'Comedy Shows', 'Drama Films'];
    render(
      <SearchBar 
        onSearch={mockOnSearch} 
        suggestions={suggestions}
        showSuggestions={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'action' } });
    fireEvent.focus(input);
    
    expect(screen.getByText('Action Movies')).toBeInTheDocument();
    expect(screen.queryByText('Comedy Shows')).not.toBeInTheDocument();
    expect(screen.queryByText('Drama Films')).not.toBeInTheDocument();
  });

  it('should handle keyboard navigation in suggestions', () => {
    const suggestions = ['Action Movies', 'Adventure Films'];
    render(
      <SearchBar 
        onSearch={mockOnSearch} 
        suggestions={suggestions}
        showSuggestions={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.focus(input);
    
    // Arrow down to select first suggestion
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    
    // Enter to select
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockOnSearch).toHaveBeenCalledWith('Action Movies');
  });

  it('should handle Enter key to search', () => {
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test query' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    
    // Should call immediately on Enter, not wait for debounce
    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('should handle Escape key to close suggestions', () => {
    const suggestions = ['Action Movies'];
    render(
      <SearchBar 
        onSearch={mockOnSearch} 
        suggestions={suggestions}
        showSuggestions={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.focus(input);
    
    // Suggestions should be visible
    expect(screen.getByText('Action Movies')).toBeInTheDocument();
    
    // Press Escape
    fireEvent.keyDown(input, { key: 'Escape' });
    
    // Suggestions should be hidden
    expect(screen.queryByText('Action Movies')).not.toBeInTheDocument();
  });

  it('should call onClear when input is empty after having text', async () => {
    render(<SearchBar onSearch={mockOnSearch} onClear={mockOnClear} />);
    
    const input = screen.getByRole('textbox');
    
    // Type something
    fireEvent.change(input, { target: { value: 'test' } });
    jest.advanceTimersByTime(300);
    
    // Clear it
    fireEvent.change(input, { target: { value: '' } });
    jest.advanceTimersByTime(300);
    
    expect(mockOnClear).toHaveBeenCalled();
  });

  it('should handle suggestion click', () => {
    const suggestions = ['Action Movies'];
    render(
      <SearchBar 
        onSearch={mockOnSearch} 
        suggestions={suggestions}
        showSuggestions={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.focus(input);
    
    const suggestion = screen.getByText('Action Movies');
    fireEvent.click(suggestion);
    
    expect(mockOnSearch).toHaveBeenCalledWith('Action Movies');
    expect(input.value).toBe('Action Movies');
  });

  it('should limit suggestions to 5 items', () => {
    const suggestions = Array.from({ length: 10 }, (_, i) => `Suggestion ${i + 1}`);
    render(
      <SearchBar 
        onSearch={mockOnSearch} 
        suggestions={suggestions}
        showSuggestions={true}
      />
    );
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'suggestion' } });
    fireEvent.focus(input);
    
    // Should only show first 5 suggestions
    expect(screen.getByText('Suggestion 1')).toBeInTheDocument();
    expect(screen.getByText('Suggestion 5')).toBeInTheDocument();
    expect(screen.queryByText('Suggestion 6')).not.toBeInTheDocument();
  });
});