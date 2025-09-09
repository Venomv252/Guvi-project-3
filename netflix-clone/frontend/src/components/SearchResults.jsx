// frontend/src/components/SearchResults.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { NoSearchResults } from './EmptyState';
import ComponentErrorBoundary from './ComponentErrorBoundary';

const SearchResults = ({ 
  results = [], 
  query = '', 
  loading = false,
  onClearSearch,
  totalResults = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange
}) => {
  const containerStyle = {
    padding: '1rem 0'
  };

  const headerStyle = {
    marginBottom: '1.5rem',
    paddingBottom: '1rem',
    borderBottom: '1px solid #333'
  };

  const titleStyle = {
    color: '#fff',
    fontSize: '1.5rem',
    marginBottom: '0.5rem'
  };

  const subtitleStyle = {
    color: '#ccc',
    fontSize: '0.9rem'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem'
  };

  const cardStyle = {
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
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: '#fff'
  };

  const descStyle = {
    color: '#ccc',
    fontSize: '0.9rem',
    marginBottom: '0.5rem',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  };

  const metaStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: '#666'
  };

  const paginationStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '1rem',
    marginTop: '2rem'
  };

  const pageButtonStyle = {
    backgroundColor: '#333',
    border: '1px solid #555',
    color: '#ccc',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s'
  };

  const activePageButtonStyle = {
    ...pageButtonStyle,
    backgroundColor: '#e50914',
    borderColor: '#e50914',
    color: '#fff'
  };

  const pageInfoStyle = {
    color: '#ccc',
    fontSize: '0.9rem'
  };

  const highlightText = (text, searchQuery) => {
    if (!searchQuery || !text) return text;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} style={{ backgroundColor: '#e50914', color: '#fff', padding: '0 2px' }}>
          {part}
        </mark>
      ) : part
    );
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>Searching...</h2>
          <p style={subtitleStyle}>Finding videos for "{query}"</p>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.3)',
            borderTop: '3px solid #e50914',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div style={containerStyle}>
        <NoSearchResults searchTerm={query} onClearSearch={onClearSearch} />
      </div>
    );
  }

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          style={pageButtonStyle}
          onClick={() => onPageChange(currentPage - 1)}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#444';
            e.target.style.borderColor = '#666';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#333';
            e.target.style.borderColor = '#555';
          }}
        >
          ← Previous
        </button>
      );
    }

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          style={i === currentPage ? activePageButtonStyle : pageButtonStyle}
          onClick={() => onPageChange(i)}
          onMouseEnter={(e) => {
            if (i !== currentPage) {
              e.target.style.backgroundColor = '#444';
              e.target.style.borderColor = '#666';
            }
          }}
          onMouseLeave={(e) => {
            if (i !== currentPage) {
              e.target.style.backgroundColor = '#333';
              e.target.style.borderColor = '#555';
            }
          }}
        >
          {i}
        </button>
      );
    }

    // Next button
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          style={pageButtonStyle}
          onClick={() => onPageChange(currentPage + 1)}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = '#444';
            e.target.style.borderColor = '#666';
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = '#333';
            e.target.style.borderColor = '#555';
          }}
        >
          Next →
        </button>
      );
    }

    return (
      <div style={paginationStyle}>
        {pages}
        <div style={pageInfoStyle}>
          Page {currentPage} of {totalPages}
        </div>
      </div>
    );
  };

  return (
    <ComponentErrorBoundary componentName="SearchResults">
      <div style={containerStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>
            Search Results for "{query}"
          </h2>
          <p style={subtitleStyle}>
            {totalResults} {totalResults === 1 ? 'video' : 'videos'} found
          </p>
        </div>

        <div style={gridStyle}>
          {results.map(video => (
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
                  <h3 style={videoTitleStyle}>
                    {highlightText(video.title, query)}
                  </h3>
                  <p style={descStyle}>
                    {highlightText(video.description, query)}
                  </p>
                  <div style={metaStyle}>
                    <span>{video.category}</span>
                    <span>{video.duration || 'Unknown'}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {renderPagination()}

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </ComponentErrorBoundary>
  );
};

export default SearchResults;