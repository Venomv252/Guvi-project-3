// frontend/src/components/CategorySection.jsx
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ComponentErrorBoundary from './ComponentErrorBoundary';

const CategorySection = ({ 
  title, 
  videos = [], 
  onViewAll,
  showViewAll = true,
  loading = false,
  error = null,
  onRetry
}) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef(null);

  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 320; // Card width + gap
    const scrollAmount = cardWidth * 3; // Scroll 3 cards at a time
    
    let newPosition;
    if (direction === 'left') {
      newPosition = Math.max(0, scrollPosition - scrollAmount);
    } else {
      const maxScroll = container.scrollWidth - container.clientWidth;
      newPosition = Math.min(maxScroll, scrollPosition + scrollAmount);
    }
    
    container.scrollTo({
      left: newPosition,
      behavior: 'smooth'
    });
    
    setScrollPosition(newPosition);
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

  const viewAllButtonStyle = {
    backgroundColor: 'transparent',
    border: '1px solid #666',
    color: '#ccc',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s'
  };

  const scrollContainerWrapperStyle = {
    position: 'relative',
    paddingLeft: '2rem',
    paddingRight: '2rem'
  };

  const scrollContainerStyle = {
    display: 'flex',
    gap: '1rem',
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    paddingBottom: '1rem'
  };

  const scrollButtonStyle = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(0,0,0,0.8)',
    border: 'none',
    color: '#fff',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '1.2rem',
    zIndex: 10,
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const leftScrollButtonStyle = {
    ...scrollButtonStyle,
    left: '0.5rem',
    opacity: scrollPosition > 0 ? 1 : 0.3
  };

  const rightScrollButtonStyle = {
    ...scrollButtonStyle,
    right: '0.5rem'
  };

  const cardStyle = {
    minWidth: '300px',
    backgroundColor: '#111',
    borderRadius: '8px',
    overflow: 'hidden',
    transition: 'transform 0.2s',
    cursor: 'pointer'
  };

  const imageStyle = {
    width: '100%',
    height: '180px',
    backgroundColor: '#333',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
    fontSize: '14px'
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
    fontSize: '0.7rem',
    color: '#666'
  };

  const loadingStyle = {
    display: 'flex',
    gap: '1rem',
    paddingLeft: '2rem',
    paddingRight: '2rem'
  };

  const skeletonCardStyle = {
    minWidth: '300px',
    backgroundColor: '#111',
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const skeletonImageStyle = {
    width: '100%',
    height: '180px',
    backgroundColor: '#333',
    background: 'linear-gradient(90deg, #333 25%, #444 50%, #333 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-loading 1.5s infinite'
  };

  const skeletonContentStyle = {
    padding: '1rem'
  };

  const skeletonTextStyle = {
    height: '16px',
    backgroundColor: '#333',
    borderRadius: '4px',
    marginBottom: '0.5rem',
    background: 'linear-gradient(90deg, #333 25%, #444 50%, #333 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-loading 1.5s infinite'
  };

  const errorStyle = {
    textAlign: 'center',
    padding: '2rem',
    color: '#ccc'
  };

  const retryButtonStyle = {
    backgroundColor: '#e50914',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
    marginTop: '1rem'
  };

  if (error) {
    return (
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
        </div>
        <div style={errorStyle}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <p>Failed to load {title.toLowerCase()}</p>
          {onRetry && (
            <button onClick={onRetry} style={retryButtonStyle}>
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
        </div>
        <div style={loadingStyle}>
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} style={skeletonCardStyle}>
              <div style={skeletonImageStyle}></div>
              <div style={skeletonContentStyle}>
                <div style={{ ...skeletonTextStyle, width: '80%' }}></div>
                <div style={{ ...skeletonTextStyle, width: '100%' }}></div>
                <div style={{ ...skeletonTextStyle, width: '60%' }}></div>
              </div>
            </div>
          ))}
        </div>
        <style>
          {`
            @keyframes skeleton-loading {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
          `}
        </style>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
        </div>
        <div style={errorStyle}>
          <p>No videos available in this category</p>
        </div>
      </div>
    );
  }

  return (
    <ComponentErrorBoundary componentName="CategorySection">
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
          {showViewAll && onViewAll && (
            <button
              style={viewAllButtonStyle}
              onClick={onViewAll}
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
              View All
            </button>
          )}
        </div>

        <div style={scrollContainerWrapperStyle}>
          <button
            style={leftScrollButtonStyle}
            onClick={() => handleScroll('left')}
            disabled={scrollPosition === 0}
            onMouseEnter={(e) => {
              if (scrollPosition > 0) {
                e.target.style.backgroundColor = 'rgba(0,0,0,0.9)';
                e.target.style.transform = 'translateY(-50%) scale(1.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(0,0,0,0.8)';
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            ←
          </button>

          <div 
            ref={scrollContainerRef}
            style={scrollContainerStyle}
            onScroll={(e) => setScrollPosition(e.target.scrollLeft)}
          >
            {videos.map(video => (
              <Link to={`/player/${video.id}`} key={video.id} style={{ textDecoration: 'none' }}>
                <div 
                  style={cardStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
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
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #666; font-size: 14px;">No thumbnail</div>';
                        }}
                      />
                    ) : (
                      'No thumbnail'
                    )}
                  </div>
                  <div style={contentStyle}>
                    <h3 style={videoTitleStyle}>{video.title}</h3>
                    <p style={descStyle}>{video.description}</p>
                    <div style={metaStyle}>
                      <span>{video.category}</span>
                      <span>{video.duration || 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <button
            style={rightScrollButtonStyle}
            onClick={() => handleScroll('right')}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(0,0,0,0.9)';
              e.target.style.transform = 'translateY(-50%) scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(0,0,0,0.8)';
              e.target.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            →
          </button>
        </div>

        <style>
          {`
            ${scrollContainerStyle}::-webkit-scrollbar {
              display: none;
            }
          `}
        </style>
      </div>
    </ComponentErrorBoundary>
  );
};

export default CategorySection;