// frontend/src/components/__tests__/CategorySection.test.js
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CategorySection from '../CategorySection';

// Mock videos data
const mockVideos = [
  {
    id: 1,
    title: 'Test Video 1',
    description: 'Description for test video 1',
    category: 'Action',
    duration: '2h 15m',
    thumbnail: null
  },
  {
    id: 2,
    title: 'Test Video 2',
    description: 'Description for test video 2',
    category: 'Comedy',
    duration: '1h 45m',
    thumbnail: 'test-thumbnail.jpg'
  }
];

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CategorySection', () => {
  it('should render section title', () => {
    renderWithRouter(
      <CategorySection title="Action Movies" videos={mockVideos} />
    );
    
    expect(screen.getByText('Action Movies')).toBeInTheDocument();
  });

  it('should render video cards', () => {
    renderWithRouter(
      <CategorySection title="Action Movies" videos={mockVideos} />
    );
    
    expect(screen.getByText('Test Video 1')).toBeInTheDocument();
    expect(screen.getByText('Test Video 2')).toBeInTheDocument();
    expect(screen.getByText('Description for test video 1')).toBeInTheDocument();
    expect(screen.getByText('Description for test video 2')).toBeInTheDocument();
  });

  it('should show View All button when showViewAll is true', () => {
    const mockViewAll = jest.fn();
    renderWithRouter(
      <CategorySection 
        title="Action Movies" 
        videos={mockVideos} 
        onViewAll={mockViewAll}
        showViewAll={true}
      />
    );
    
    const viewAllButton = screen.getByText('View All');
    expect(viewAllButton).toBeInTheDocument();
    
    fireEvent.click(viewAllButton);
    expect(mockViewAll).toHaveBeenCalled();
  });

  it('should not show View All button when showViewAll is false', () => {
    renderWithRouter(
      <CategorySection 
        title="Action Movies" 
        videos={mockVideos} 
        showViewAll={false}
      />
    );
    
    expect(screen.queryByText('View All')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    renderWithRouter(
      <CategorySection title="Action Movies" videos={[]} loading={true} />
    );
    
    // Should show skeleton cards
    const skeletonCards = document.querySelectorAll('[style*="skeleton-loading"]');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('should show error state', () => {
    const mockRetry = jest.fn();
    const mockError = new Error('Failed to load');
    
    renderWithRouter(
      <CategorySection 
        title="Action Movies" 
        videos={[]} 
        error={mockError}
        onRetry={mockRetry}
      />
    );
    
    expect(screen.getByText('Failed to load action movies')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });

  it('should show empty state when no videos', () => {
    renderWithRouter(
      <CategorySection title="Action Movies" videos={[]} />
    );
    
    expect(screen.getByText('No videos available in this category')).toBeInTheDocument();
  });

  it('should handle scroll buttons', () => {
    // Mock scrollTo method
    const mockScrollTo = jest.fn();
    Object.defineProperty(Element.prototype, 'scrollTo', {
      writable: true,
      value: mockScrollTo,
    });

    // Mock scroll properties
    Object.defineProperty(Element.prototype, 'scrollWidth', {
      writable: true,
      value: 1000,
    });
    Object.defineProperty(Element.prototype, 'clientWidth', {
      writable: true,
      value: 500,
    });

    renderWithRouter(
      <CategorySection title="Action Movies" videos={mockVideos} />
    );
    
    const rightScrollButton = screen.getByText('→');
    fireEvent.click(rightScrollButton);
    
    expect(mockScrollTo).toHaveBeenCalledWith({
      left: 960, // 3 cards * 320px width
      behavior: 'smooth'
    });
  });

  it('should create links to video player', () => {
    renderWithRouter(
      <CategorySection title="Action Movies" videos={mockVideos} />
    );
    
    const videoLinks = screen.getAllByRole('link');
    expect(videoLinks[0]).toHaveAttribute('href', '/player/1');
    expect(videoLinks[1]).toHaveAttribute('href', '/player/2');
  });

  it('should handle image load errors', () => {
    renderWithRouter(
      <CategorySection title="Action Movies" videos={mockVideos} />
    );
    
    const images = screen.getAllByRole('img');
    const imageWithSrc = images.find(img => img.src.includes('test-thumbnail.jpg'));
    
    if (imageWithSrc) {
      fireEvent.error(imageWithSrc);
      // After error, the image should be hidden and replaced with placeholder
      expect(imageWithSrc.style.display).toBe('none');
    }
  });

  it('should show placeholder for videos without thumbnails', () => {
    renderWithRouter(
      <CategorySection title="Action Movies" videos={mockVideos} />
    );
    
    expect(screen.getByText('No thumbnail')).toBeInTheDocument();
  });

  it('should apply hover effects on video cards', () => {
    renderWithRouter(
      <CategorySection title="Action Movies" videos={mockVideos} />
    );
    
    const videoCard = screen.getByText('Test Video 1').closest('div');
    
    fireEvent.mouseEnter(videoCard);
    expect(videoCard.style.transform).toBe('scale(1.05)');
    
    fireEvent.mouseLeave(videoCard);
    expect(videoCard.style.transform).toBe('scale(1)');
  });
});