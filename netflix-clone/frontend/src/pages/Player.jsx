// frontend/src/pages/Player.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoPlayer from '../components/VideoPlayer';
import LoadingSpinner from '../components/LoadingSpinner';
import { VideoPlayerSkeleton } from '../components/SkeletonLoader';
import { SubscriptionRequired, NetworkError } from '../components/EmptyState';
import ComponentErrorBoundary from '../components/ComponentErrorBoundary';
import { useNotification } from '../components/NotificationSystem';
import apiService from '../services/apiService';

const Player = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchProgress, setWatchProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchVideo();
  }, [id, retryCount]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await apiService.get(`/videos/${id}`, {
        errorHandling: {
          showNotification: false // We'll handle errors in the component
        }
      });
      
      setVideo(data);
      
      // Load saved watch progress if available
      const savedProgress = localStorage.getItem(`video_progress_${id}`);
      if (savedProgress) {
        setWatchProgress(parseFloat(savedProgress));
      }
      
    } catch (err) {
      console.error('Failed to fetch video:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleTimeUpdate = (currentTime, duration) => {
    if (duration > 0) {
      const progress = (currentTime / duration) * 100;
      setWatchProgress(progress);
      
      // Save progress every 10 seconds
      if (Math.floor(currentTime) % 10 === 0) {
        localStorage.setItem(`video_progress_${id}`, currentTime.toString());
      }
    }
  };

  const handleVideoEnded = () => {
    showSuccess('Video completed! Thanks for watching.');
    localStorage.removeItem(`video_progress_${id}`);
    
    // Auto-navigate back to home after 3 seconds
    setTimeout(() => {
      navigate('/');
    }, 3000);
  };

  const handleVideoError = (error) => {
    showError('Video playback failed. Please try refreshing the page.');
    console.error('Video playback error:', error);
  };

  const containerStyle = {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const backButtonStyle = {
    backgroundColor: '#333',
    color: '#fff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    marginBottom: '1rem'
  };

  const playerStyle = {
    width: '100%',
    height: '500px',
    marginBottom: '2rem'
  };

  const videoInfoStyle = {
    backgroundColor: '#111',
    padding: '1.5rem',
    borderRadius: '8px'
  };

  const titleStyle = {
    fontSize: '2rem',
    marginBottom: '1rem',
    color: '#fff'
  };

  const descriptionStyle = {
    color: '#ccc',
    lineHeight: '1.6',
    marginBottom: '1rem'
  };

  const metaStyle = {
    display: 'flex',
    gap: '2rem',
    fontSize: '0.9rem',
    color: '#666'
  };

  // Show skeleton loading state
  if (loading) {
    return (
      <div style={containerStyle}>
        <VideoPlayerSkeleton />
      </div>
    );
  }

  // Handle different error types
  if (error) {
    if (error.type === 'authorization' && error.code === 'SUBSCRIPTION_REQUIRED') {
      return (
        <div style={containerStyle}>
          <button onClick={() => navigate('/')} style={backButtonStyle}>
            ← Back to Home
          </button>
          <SubscriptionRequired onSubscribe={() => navigate('/subscription')} />
        </div>
      );
    }

    if (error.type === 'network') {
      return (
        <div style={containerStyle}>
          <button onClick={() => navigate('/')} style={backButtonStyle}>
            ← Back to Home
          </button>
          <NetworkError onRetry={handleRetry} />
        </div>
      );
    }

    // Generic error fallback
    return (
      <div style={containerStyle}>
        <button onClick={() => navigate('/')} style={backButtonStyle}>
          ← Back to Home
        </button>
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          backgroundColor: '#111', 
          borderRadius: '8px',
          color: '#ccc'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ color: '#fff', marginBottom: '1rem' }}>Video Not Available</h3>
          <p style={{ marginBottom: '1rem' }}>{error.message || 'Failed to load video'}</p>
          <button 
            onClick={handleRetry}
            style={{
              backgroundColor: '#e50914',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ComponentErrorBoundary componentName="Player">
      <div style={containerStyle}>
        <button onClick={() => navigate('/')} style={backButtonStyle}>
          ← Back to Home
        </button>

        <div style={playerStyle}>
          {video?.video_url ? (
            <VideoPlayer
              src={video.video_url}
              poster={video.thumbnail}
              title={video.title}
              onTimeUpdate={handleTimeUpdate}
              onEnded={handleVideoEnded}
              onError={handleVideoError}
              autoPlay={false}
            />
          ) : (
            <div style={{ 
              width: '100%',
              height: '500px',
              backgroundColor: '#000',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #333'
            }}>
              <div style={{ textAlign: 'center', color: '#666' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>▶</div>
                <div>Video Player Placeholder</div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                  Video streaming will be implemented with Cloudflare Stream
                </div>
              </div>
            </div>
          )}
        </div>

        {video && (
          <div style={videoInfoStyle}>
            <h1 style={titleStyle}>{video.title}</h1>
            <p style={descriptionStyle}>{video.description}</p>
            <div style={metaStyle}>
              <span>Category: {video.category}</span>
              <span>Duration: {video.duration || 'Unknown'}</span>
              <span>Added: {new Date(video.created_at).toLocaleDateString()}</span>
              {watchProgress > 0 && (
                <span>Progress: {Math.round(watchProgress)}%</span>
              )}
            </div>
          </div>
        )}
      </div>
    </ComponentErrorBoundary>
  );
};

export default Player;