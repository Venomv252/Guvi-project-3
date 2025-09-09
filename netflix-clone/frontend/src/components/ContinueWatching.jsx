// frontend/src/components/ContinueWatching.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { VideoProgress } from './ProgressBar';
import ComponentErrorBoundary from './ComponentErrorBoundary';

const ContinueWatching = ({ userId }) => {
  const [watchingVideos, setWatchingVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContinueWatching();
  }, [userId]);

  const loadContinueWatching = () => {
    try {
      setLoading(true);
      
      // Get all video progress from localStorage
      const progressData = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('video_progress_')) {
          const videoId = key.replace('video_progress_', '');
          const progress = parseFloat(localStorage.getItem(key));
          
          // Only include videos with significant progress (more than 5% but less than 95%)
          if (progress > 5 && progress < 95) {
            progressData.push({
              videoId,
              progress,
              lastWatched: Date.now() // We don't have actual timestamp, so use current time
            });
          }
        }
      }
      
      // Sort by last watched (most recent first)
      progressData.sort((a, b) => b.lastWatched - a.lastWatched);
      
      // For demo purposes, create mock video data
      // In a real app, you'd fetch video details from the API
      const mockVideos = progressData.slice(0, 6).map((item, index) => ({
        id: item.videoId,
        title: `Video ${item.videoId}`,
        description: 'Continue watching where you left off...',
        thumbnail: null,
        category: 'Mixed',
        duration: '2h 15m',
        progress: item.progress,
        lastWatched: item.lastWatched
      }));
      
      setWatchingVideos(mockVideos);
    } catch (error) {
      console.error('Error loading continue watching:', error);
      setWatchingVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromContinueWatching = (videoId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove from localStorage
    localStorage.removeItem(`video_progress_${videoId}`);
    
    // Update state
    setWatchingVideos(prev => prev.filter(video => video.id !== videoId));
  };

  const formatTimeAgo = (timestamp) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const sectionStyle = {
    marginBottom: '3rem'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingLeft: '2rem',
    paddingRight: '2rem'
  };

  const titleStyle = {
    color: '#fff',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0
  };

  const clearAllButtonStyle = {
    backgroundColor: 'transparent',
    border: '1px solid #666',
    color: '#ccc',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
    paddingLeft: '2rem',
    paddingRight: '2rem'
  };

  const cardStyle = {
    backgroundColor: '#111',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'transform 0.2s',
    cursor: 'pointer',
    position: 'relative'
  };

  const imageStyle = {
    width: '100%',
    height: '180px',
    backgroundColor: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    fontSize: '14px',
    position: 'relative'
  };

  const progressOverlayStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: '0.5rem',
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
  };

  const contentStyle = {
    padding: '1rem'
  };

  const videoTitleStyle = {
    fontSize: '1rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: '#fff',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  };

  const descStyle = {
    color: '#ccc',
    fontSize: '0.8rem',
    marginBottom: '0.5rem',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  };

  const metaStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.7rem',
    color: '#666'
  };

  const removeButtonStyle = {
    position: 'absolute',
    top: '0.5rem',
    right: '0.5rem',
    backgroundColor: 'rgba(0,0,0,0.8)',
    border: 'none',
    color: '#fff',
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s'
  };

  const emptyStateStyle = {
    textAlign: 'center',
    padding: '3rem 2rem',
    color: '#666'
  };

  const handleClearAll = () => {
    // Remove all video progress from localStorage
    watchingVideos.forEach(video => {
      localStorage.removeItem(`video_progress_${video.id}`);
    });
    
    setWatchingVideos([]);
  };

  if (loading) {
    return (
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Continue Watching</h2>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Loading your progress...
        </div>
      </div>
    );
  }

  if (watchingVideos.length === 0) {
    return (
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Continue Watching</h2>
        </div>
        <div style={emptyStateStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📺</div>
          <p>No videos in progress</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Start watching a video to see it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <ComponentErrorBoundary componentName="ContinueWatching">
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Continue Watching</h2>
          <button
            style={clearAllButtonStyle}
            onClick={handleClearAll}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#e50914';
              e.target.style.borderColor = '#e50914';
              e.target.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.borderColor = '#666';
              e.target.style.color = '#ccc';
            }}
          >
            Clear All
          </button>
        </div>

        <div style={gridStyle}>
          {watchingVideos.map(video => (
            <Link to={`/player/${video.id}`} key={video.id} style={{ textDecoration: 'none' }}>
              <div 
                style={cardStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  const removeBtn = e.currentTarget.querySelector('[data-remove-btn]');
                  if (removeBtn) removeBtn.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  const removeBtn = e.currentTarget.querySelector('[data-remove-btn]');
                  if (removeBtn) removeBtn.style.opacity = '0';
                }}
              >
                <div style={imageStyle}>
                  {video.thumbnail ? (
                    <img 
                      src={video.thumbnail} 
                      alt={video.title} 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        objectFit: 'cover' 
                      }}
                    />
                  ) : (
                    'No thumbnail'
                  )}
                  
                  <div style={progressOverlayStyle}>
                    <VideoProgress
                      currentTime={video.progress}
                      duration={100}
                      onSeek={null}
                    />
                  </div>
                </div>

                <button
                  data-remove-btn
                  style={removeButtonStyle}
                  onClick={(e) => handleRemoveFromContinueWatching(video.id, e)}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#e50914';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'rgba(0,0,0,0.8)';
                  }}
                >
                  ×
                </button>

                <div style={contentStyle}>
                  <h3 style={videoTitleStyle}>{video.title}</h3>
                  <p style={descStyle}>{video.description}</p>
                  <div style={metaStyle}>
                    <span>{Math.round(video.progress)}% watched</span>
                    <span>{formatTimeAgo(video.lastWatched)}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </ComponentErrorBoundary>
  );
};

export default ContinueWatching;