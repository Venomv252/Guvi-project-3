import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoPlayer from '../VideoPlayer';

// Mock HTMLMediaElement methods
Object.defineProperty(HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: jest.fn(),
});

Object.defineProperty(HTMLMediaElement.prototype, 'load', {
  writable: true,
  value: jest.fn(),
});

// Mock fullscreen API
Object.defineProperty(document, 'fullscreenElement', {
  writable: true,
  value: null,
});

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
});

Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
  writable: true,
  value: jest.fn().mockImplementation(() => Promise.resolve()),
});

describe('VideoPlayer', () => {
  const defaultProps = {
    src: 'test-video.mp4',
    title: 'Test Video',
    poster: 'test-poster.jpg'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders video player with basic elements', () => {
    render(<VideoPlayer {...defaultProps} />);
    
    const video = screen.getByRole('application'); // video element
    expect(video).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    render(<VideoPlayer {...defaultProps} />);
    
    // Loading spinner should be visible
    const loadingSpinner = document.querySelector('[style*="animation: spin"]');
    expect(loadingSpinner).toBeInTheDocument();
  });

  it('shows play button when video is paused', async () => {
    render(<VideoPlayer {...defaultProps} />);
    
    // Wait for component to initialize
    await waitFor(() => {
      const playButton = screen.getByText('▶️');
      expect(playButton).toBeInTheDocument();
    });
  });

  it('toggles play/pause when play button is clicked', async () => {
    const user = userEvent.setup();
    render(<VideoPlayer {...defaultProps} />);
    
    await waitFor(() => {
      const playButton = screen.getByText('▶️');
      expect(playButton).toBeInTheDocument();
    });

    const playButton = screen.getByText('▶️');
    await user.click(playButton);

    // Should show pause button after clicking play
    await waitFor(() => {
      expect(screen.getByText('⏸️')).toBeInTheDocument();
    });
  });

  it('toggles play/pause when video is clicked', async () => {
    const user = userEvent.setup();
    render(<VideoPlayer {...defaultProps} />);
    
    const videoElement = document.querySelector('video');
    await user.click(videoElement);

    // Should trigger play
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
  });

  it('handles volume control', async () => {
    const user = userEvent.setup();
    render(<VideoPlayer {...defaultProps} />);
    
    // Find volume button
    await waitFor(() => {
      const volumeButton = screen.getByText('🔊');
      expect(volumeButton).toBeInTheDocument();
    });

    const volumeButton = screen.getByText('🔊');
    await user.click(volumeButton);

    // Should mute the video
    await waitFor(() => {
      expect(screen.getByText('🔇')).toBeInTheDocument();
    });
  });

  it('handles fullscreen toggle', async () => {
    const user = userEvent.setup();
    render(<VideoPlayer {...defaultProps} />);
    
    await waitFor(() => {
      const fullscreenButton = screen.getByText('⛶');
      expect(fullscreenButton).toBeInTheDocument();
    });

    const fullscreenButton = screen.getByText('⛶');
    await user.click(fullscreenButton);

    expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalled();
  });

  it('displays time information', async () => {
    render(<VideoPlayer {...defaultProps} />);
    
    // Mock video duration and current time
    const videoElement = document.querySelector('video');
    Object.defineProperty(videoElement, 'duration', { value: 120, writable: true });
    Object.defineProperty(videoElement, 'currentTime', { value: 30, writable: true });

    // Trigger loadedmetadata event
    fireEvent.loadedMetadata(videoElement);
    fireEvent.timeUpdate(videoElement);

    await waitFor(() => {
      expect(screen.getByText('0:30 / 2:00')).toBeInTheDocument();
    });
  });

  it('handles keyboard shortcuts', async () => {
    const user = userEvent.setup();
    render(<VideoPlayer {...defaultProps} />);
    
    const container = document.querySelector('[tabindex="0"]');
    container.focus();

    // Test spacebar for play/pause
    await user.keyboard(' ');
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();

    // Test 'M' for mute
    await user.keyboard('m');
    const videoElement = document.querySelector('video');
    expect(videoElement.volume).toBe(0);

    // Test 'F' for fullscreen
    await user.keyboard('f');
    expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalled();
  });

  it('handles arrow key navigation', async () => {
    const user = userEvent.setup();
    render(<VideoPlayer {...defaultProps} />);
    
    const container = document.querySelector('[tabindex="0"]');
    container.focus();

    const videoElement = document.querySelector('video');
    Object.defineProperty(videoElement, 'duration', { value: 120, writable: true });
    Object.defineProperty(videoElement, 'currentTime', { value: 30, writable: true });

    // Test right arrow (seek forward)
    await user.keyboard('{ArrowRight}');
    expect(videoElement.currentTime).toBe(40);

    // Test left arrow (seek backward)
    await user.keyboard('{ArrowLeft}');
    expect(videoElement.currentTime).toBe(20);
  });

  it('shows playback speed menu', async () => {
    const user = userEvent.setup();
    render(<VideoPlayer {...defaultProps} />);
    
    await waitFor(() => {
      const speedButton = screen.getByText('1x');
      expect(speedButton).toBeInTheDocument();
    });

    const speedButton = screen.getByText('1x');
    await user.click(speedButton);

    // Should show speed options
    await waitFor(() => {
      expect(screen.getByText('0.5x')).toBeInTheDocument();
      expect(screen.getByText('1.25x')).toBeInTheDocument();
      expect(screen.getByText('2x')).toBeInTheDocument();
    });
  });

  it('changes playback speed', async () => {
    const user = userEvent.setup();
    render(<VideoPlayer {...defaultProps} />);
    
    const speedButton = screen.getByText('1x');
    await user.click(speedButton);

    const speed2x = screen.getByText('2x');
    await user.click(speed2x);

    const videoElement = document.querySelector('video');
    expect(videoElement.playbackRate).toBe(2);
  });

  it('handles video errors', async () => {
    render(<VideoPlayer {...defaultProps} />);
    
    const videoElement = document.querySelector('video');
    
    // Simulate video error
    fireEvent.error(videoElement);

    await waitFor(() => {
      expect(screen.getByText('Video Error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load video')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('retries loading video after error', async () => {
    const user = userEvent.setup();
    render(<VideoPlayer {...defaultProps} />);
    
    const videoElement = document.querySelector('video');
    
    // Simulate video error
    fireEvent.error(videoElement);

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    await user.click(retryButton);

    expect(HTMLMediaElement.prototype.load).toHaveBeenCalled();
  });

  it('calls onTimeUpdate callback', async () => {
    const onTimeUpdate = jest.fn();
    render(<VideoPlayer {...defaultProps} onTimeUpdate={onTimeUpdate} />);
    
    const videoElement = document.querySelector('video');
    Object.defineProperty(videoElement, 'duration', { value: 120, writable: true });
    Object.defineProperty(videoElement, 'currentTime', { value: 30, writable: true });

    fireEvent.timeUpdate(videoElement);

    expect(onTimeUpdate).toHaveBeenCalledWith(30, 120);
  });

  it('calls onEnded callback', async () => {
    const onEnded = jest.fn();
    render(<VideoPlayer {...defaultProps} onEnded={onEnded} />);
    
    const videoElement = document.querySelector('video');
    fireEvent.ended(videoElement);

    expect(onEnded).toHaveBeenCalled();
  });

  it('calls onError callback', async () => {
    const onError = jest.fn();
    render(<VideoPlayer {...defaultProps} onError={onError} />);
    
    const videoElement = document.querySelector('video');
    const errorEvent = new Event('error');
    fireEvent(videoElement, errorEvent);

    expect(onError).toHaveBeenCalledWith(errorEvent);
  });

  it('hides controls after inactivity when playing', async () => {
    jest.useFakeTimers();
    render(<VideoPlayer {...defaultProps} />);
    
    const container = document.querySelector('[tabindex="0"]');
    const playButton = screen.getByText('▶️');
    
    // Start playing
    fireEvent.click(playButton);
    
    // Fast-forward time to trigger controls hiding
    jest.advanceTimersByTime(4000);

    // Controls should be hidden (transform: translateY(100%))
    const controls = document.querySelector('[style*="translateY(100%)"]');
    expect(controls).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('shows controls on mouse movement', async () => {
    const user = userEvent.setup();
    render(<VideoPlayer {...defaultProps} />);
    
    const container = document.querySelector('[tabindex="0"]');
    await user.hover(container);

    // Controls should be visible
    const controls = document.querySelector('[style*="translateY(0)"]');
    expect(controls).toBeInTheDocument();
  });
});