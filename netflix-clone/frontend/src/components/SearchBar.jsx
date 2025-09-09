// frontend/src/components/SearchBar.jsx
import React, { useState, useEffect, useRef } from 'react';

const SearchBar = ({ 
  onSearch, 
  onClear,
  placeholder = 'Search videos...',
  debounceMs = 300,
  showSuggestions = true,
  suggestions = [],
  className = '',
  style = {}
}) => {
  const [query, setQuery] = useState('');
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (query.trim()) {
        onSearch(query.trim());
      } else if (onClear) {
        onClear();
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, debounceMs, onSearch, onClear]);

  // Filter suggestions based on query
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // Limit to 5 suggestions

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedSuggestionIndex(-1);
    
    if (showSuggestions && value.trim()) {
      setShowSuggestionsList(true);
    } else {
      setShowSuggestionsList(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showSuggestionsList || filteredSuggestions.length === 0) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (query.trim()) {
          onSearch(query.trim());
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          const selectedSuggestion = filteredSuggestions[selectedSuggestionIndex];
          setQuery(selectedSuggestion);
          onSearch(selectedSuggestion);
          setShowSuggestionsList(false);
        } else if (query.trim()) {
          onSearch(query.trim());
          setShowSuggestionsList(false);
        }
        break;
      
      case 'Escape':
        setShowSuggestionsList(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
      
      default:
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    onSearch(suggestion);
    setShowSuggestionsList(false);
    inputRef.current?.focus();
  };

  const handleClear = () => {
    setQuery('');
    setShowSuggestionsList(false);
    setSelectedSuggestionIndex(-1);
    if (onClear) {
      onClear();
    }
    inputRef.current?.focus();
  };

  const handleFocus = () => {
    if (showSuggestions && query.trim() && filteredSuggestions.length > 0) {
      setShowSuggestionsList(true);
    }
  };

  const handleBlur = (e) => {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget)) {
        setShowSuggestionsList(false);
        setSelectedSuggestionIndex(-1);
      }
    }, 150);
  };

  const containerStyle = {
    position: 'relative',
    width: '100%',
    maxWidth: '500px',
    ...style
  };

  const inputContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: '25px',
    border: '2px solid transparent',
    transition: 'border-color 0.2s',
    overflow: 'hidden'
  };

  const inputStyle = {
    flex: 1,
    padding: '12px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '16px',
    outline: 'none',
    '::placeholder': {
      color: '#999'
    }
  };

  const searchIconStyle = {
    padding: '12px 15px',
    color: '#999',
    fontSize: '18px',
    cursor: 'pointer'
  };

  const clearButtonStyle = {
    padding: '12px 15px',
    color: '#999',
    fontSize: '18px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    border: 'none',
    display: query ? 'block' : 'none'
  };

  const suggestionsStyle = {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#222',
    borderRadius: '8px',
    marginTop: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    zIndex: 1000,
    maxHeight: '200px',
    overflowY: 'auto',
    display: showSuggestionsList && filteredSuggestions.length > 0 ? 'block' : 'none'
  };

  const suggestionItemStyle = {
    padding: '12px 20px',
    color: '#ccc',
    cursor: 'pointer',
    borderBottom: '1px solid #333',
    transition: 'background-color 0.2s'
  };

  const selectedSuggestionStyle = {
    ...suggestionItemStyle,
    backgroundColor: '#444',
    color: '#fff'
  };

  return (
    <div style={containerStyle} className={className}>
      <div 
        style={{
          ...inputContainerStyle,
          borderColor: showSuggestionsList ? '#e50914' : 'transparent'
        }}
      >
        <div style={searchIconStyle}>
          🔍
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          style={inputStyle}
          autoComplete="off"
          spellCheck="false"
        />
        
        <button
          style={clearButtonStyle}
          onClick={handleClear}
          onMouseEnter={(e) => e.target.style.color = '#fff'}
          onMouseLeave={(e) => e.target.style.color = '#999'}
        >
          ✕
        </button>
      </div>

      <div ref={suggestionsRef} style={suggestionsStyle}>
        {filteredSuggestions.map((suggestion, index) => (
          <div
            key={suggestion}
            style={index === selectedSuggestionIndex ? selectedSuggestionStyle : suggestionItemStyle}
            onClick={() => handleSuggestionClick(suggestion)}
            onMouseEnter={(e) => {
              if (index !== selectedSuggestionIndex) {
                e.target.style.backgroundColor = '#333';
              }
            }}
            onMouseLeave={(e) => {
              if (index !== selectedSuggestionIndex) {
                e.target.style.backgroundColor = 'transparent';
              }
            }}
          >
            {suggestion}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SearchBar;