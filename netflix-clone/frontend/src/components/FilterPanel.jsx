// frontend/src/components/FilterPanel.jsx
import React, { useState } from 'react';

const FilterPanel = ({ 
  filters,
  onFiltersChange,
  categories = [],
  genres = [],
  isOpen = false,
  onToggle,
  className = '',
  style = {}
}) => {
  const [localFilters, setLocalFilters] = useState({
    category: '',
    genre: '',
    rating: '',
    year: '',
    duration: '',
    sortBy: 'newest',
    ...filters
  });

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      category: '',
      genre: '',
      rating: '',
      year: '',
      duration: '',
      sortBy: 'newest'
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value && value !== 'newest'
  );

  const panelStyle = {
    position: 'relative',
    backgroundColor: '#111',
    borderRadius: '8px',
    padding: isOpen ? '1.5rem' : '0',
    marginBottom: '1rem',
    overflow: 'hidden',
    transition: 'all 0.3s ease-in-out',
    maxHeight: isOpen ? '500px' : '0',
    opacity: isOpen ? 1 : 0,
    ...style
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #333'
  };

  const titleStyle = {
    color: '#fff',
    fontSize: '1.1rem',
    fontWeight: 'bold'
  };

  const clearButtonStyle = {
    backgroundColor: 'transparent',
    border: '1px solid #666',
    color: '#ccc',
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s'
  };

  const filtersGridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem'
  };

  const filterGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  };

  const labelStyle = {
    color: '#ccc',
    fontSize: '0.9rem',
    fontWeight: '500'
  };

  const selectStyle = {
    backgroundColor: '#333',
    border: '1px solid #555',
    borderRadius: '4px',
    color: '#fff',
    padding: '0.5rem',
    fontSize: '0.9rem',
    cursor: 'pointer',
    outline: 'none',
    transition: 'border-color 0.2s'
  };

  const toggleButtonStyle = {
    backgroundColor: '#333',
    border: '1px solid #555',
    color: '#ccc',
    padding: '0.75rem 1rem',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem'
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const ratingOptions = [
    { value: '', label: 'All Ratings' },
    { value: '9+', label: '9.0+ Stars' },
    { value: '8+', label: '8.0+ Stars' },
    { value: '7+', label: '7.0+ Stars' },
    { value: '6+', label: '6.0+ Stars' }
  ];

  const durationOptions = [
    { value: '', label: 'Any Duration' },
    { value: 'short', label: 'Under 1 hour' },
    { value: 'medium', label: '1-2 hours' },
    { value: 'long', label: '2+ hours' }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popular', label: 'Most Popular' }
  ];

  return (
    <div className={className}>
      <button
        style={{
          ...toggleButtonStyle,
          backgroundColor: isOpen ? '#e50914' : '#333',
          borderColor: isOpen ? '#e50914' : '#555',
          color: isOpen ? '#fff' : '#ccc'
        }}
        onClick={onToggle}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.target.style.backgroundColor = '#444';
            e.target.style.borderColor = '#666';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.target.style.backgroundColor = '#333';
            e.target.style.borderColor = '#555';
          }
        }}
      >
        <span>🔧</span>
        <span>Filters</span>
        {hasActiveFilters && (
          <span style={{
            backgroundColor: '#e50914',
            color: '#fff',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.7rem',
            fontWeight: 'bold'
          }}>
            {Object.values(localFilters).filter(value => value && value !== 'newest').length}
          </span>
        )}
        <span style={{ marginLeft: 'auto' }}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      <div style={panelStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>Filter Videos</h3>
          {hasActiveFilters && (
            <button
              style={clearButtonStyle}
              onClick={handleClearFilters}
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
          )}
        </div>

        <div style={filtersGridStyle}>
          {/* Category Filter */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Category</label>
            <select
              style={selectStyle}
              value={localFilters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#e50914'}
              onBlur={(e) => e.target.style.borderColor = '#555'}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Genre Filter */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Genre</label>
            <select
              style={selectStyle}
              value={localFilters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#e50914'}
              onBlur={(e) => e.target.style.borderColor = '#555'}
            >
              <option value="">All Genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Rating</label>
            <select
              style={selectStyle}
              value={localFilters.rating}
              onChange={(e) => handleFilterChange('rating', e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#e50914'}
              onBlur={(e) => e.target.style.borderColor = '#555'}
            >
              {ratingOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Release Year</label>
            <select
              style={selectStyle}
              value={localFilters.year}
              onChange={(e) => handleFilterChange('year', e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#e50914'}
              onBlur={(e) => e.target.style.borderColor = '#555'}
            >
              <option value="">Any Year</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Duration Filter */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Duration</label>
            <select
              style={selectStyle}
              value={localFilters.duration}
              onChange={(e) => handleFilterChange('duration', e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#e50914'}
              onBlur={(e) => e.target.style.borderColor = '#555'}
            >
              {durationOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div style={filterGroupStyle}>
            <label style={labelStyle}>Sort By</label>
            <select
              style={selectStyle}
              value={localFilters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              onFocus={(e) => e.target.style.borderColor = '#e50914'}
              onBlur={(e) => e.target.style.borderColor = '#555'}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;