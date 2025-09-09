// frontend/src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ComponentErrorBoundary from '../components/ComponentErrorBoundary';
import { VideoGridSkeleton } from '../components/SkeletonLoader';
import { NoVideosFound, NetworkError } from '../components/EmptyState';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import SearchResults from '../components/SearchResults';
import CategorySection from '../components/CategorySection';
import ContinueWatching from '../components/ContinueWatching';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';

const Home = () => {
  const { user } = useAuth();
  
  // Main state
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchSuggestions, setSuggestions] = useState([]);
  const [filters, setFilters] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [genres, setGenres] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalResults: 0
  });

  // Category sections state
  const [categoryVideos, setCategoryVideos] = useState({});
  const [categoryLoading, setCategoryLoading] = useState({});
  const [categoryErrors, setCategoryErrors] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, [retryCount]);

  useEffect(() => {
    if (searchQuery || Object.keys(filters).length > 0) {
      fetchVideosWithFilters();
    } else {
      fetchVideos();
    }
  }, [filters, retryCount]);

  const fetchInitialData = async () => {
    try {
      // Fetch categories and genres for filters
      const [categoriesData, genresData] = await Promise.all([
        apiService.get('/videos/categories', { errorHandling: { showNotification: false } }),
        apiService.get('/videos/genres', { errorHandling: { showNotification: false } })
      ]);

      setCategories(categoriesData);
      setGenres(genresData);

      // Fetch videos for each category
      await fetchCategoryVideos(categoriesData);

      // Fetch initial videos for search/filter view
      await fetchVideos();
    } catch (err) {
      console.error('Failed to fetch initial data:', err);
      setError(err);
      setLoading(false);
    }
  };

  const fetchCategoryVideos = async (categoryList) => {
    const categoryPromises = categoryList.slice(0, 5).map(async (category) => {
      try {
        setCategoryLoading(prev => ({ ...prev, [category]: true }));
        setCategoryErrors(prev => ({ ...prev, [category]: null }));

        const data = await apiService.get(`/videos/category/${encodeURIComponent(category)}?limit=10`, {
          errorHandling: { showNotification: false }
        });

        setCategoryVideos(prev => ({ ...prev, [category]: data }));
      } catch (err) {
        console.error(`Failed to fetch ${category} videos:`, err);
        setCategoryErrors(prev => ({ ...prev, [category]: err }));
      } finally {
        setCategoryLoading(prev => ({ ...prev, [category]: false }));
      }
    });

    await Promise.all(categoryPromises);
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await apiService.get('/videos', {
        errorHandling: {
          showNotification: false // We'll handle errors in the component
        }
      });

      setVideos(data.videos || data);
      setPagination(data.pagination || { currentPage: 1, totalPages: 1, totalResults: data.videos?.length || data.length || 0 });
      setIsSearching(false);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVideosWithFilters = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        ...filters
      });

      if (searchQuery) {
        params.set('search', searchQuery);
      }

      const data = await apiService.get(`/videos?${params.toString()}`, {
        errorHandling: {
          showNotification: false
        }
      });

      if (searchQuery) {
        setSearchResults(data.videos || []);
        setIsSearching(true);
      } else {
        setVideos(data.videos || []);
        setIsSearching(false);
      }

      setPagination(data.pagination || { currentPage: page, totalPages: 1, totalResults: data.videos?.length || 0 });
    } catch (err) {
      console.error('Failed to fetch filtered videos:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSearchSuggestions = async (query) => {
    try {
      const suggestions = await apiService.get(`/videos/search/suggestions?query=${encodeURIComponent(query)}`, {
        errorHandling: { showNotification: false }
      });
      setSuggestions(suggestions);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      setSuggestions([]);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setFilters(prev => ({ ...prev })); // Trigger useEffect
    fetchVideosWithFilters(1);

    // Fetch suggestions for future searches
    if (query.length >= 2) {
      fetchSearchSuggestions(query);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    fetchVideos();
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handlePageChange = (page) => {
    fetchVideosWithFilters(page);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const handleViewAllCategory = (category) => {
    setSearchQuery('');
    setFilters({ category });
    setIsSearching(false);
    fetchVideosWithFilters(1);
  };

  const handleRetryCategorySection = (category) => {
    fetchCategoryVideos([category]);
  };

  const containerStyle = {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const headerStyle = {
    fontSize: '2rem',
    marginBottom: '2rem',
    color: '#fff'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem'
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

  const titleStyle = {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: '#fff'
  };

  const descStyle = {
    color: '#ccc',
    fontSize: '0.9rem',
    marginBottom: '0.5rem'
  };

  const metaStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    color: '#666'
  };

  // Show skeleton loading state
  if (loading) {
    return (
      <div style={containerStyle}>
        <h1 style={headerStyle}>Latest Videos</h1>
        <VideoGridSkeleton count={6} />
      </div>
    );
  }

  // Show error state
  if (error) {
    // Handle different types of errors
    if (error.type === 'network') {
      return (
        <div style={containerStyle}>
          <NetworkError onRetry={handleRetry} />
        </div>
      );
    }

    // Generic error fallback
    return (
      <div style={containerStyle}>
        <NoVideosFound onRefresh={handleRetry} />
      </div>
    );
  }

  const renderVideoGrid = (videoList) => (
    <div style={gridStyle}>
      {videoList.map(video => (
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
              <h3 style={titleStyle}>{video.title}</h3>
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
  );

  return (
    <ComponentErrorBoundary componentName="Home">
      <div style={containerStyle}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={headerStyle}>
            {isSearching ? 'Search Results' : 'Latest Videos'}
          </h1>

          <div style={{ marginBottom: '1rem' }}>
            <SearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              suggestions={searchSuggestions}
              placeholder="Search for movies, shows, documentaries..."
            />
          </div>

          <FilterPanel
            filters={filters}
            onFiltersChange={handleFiltersChange}
            categories={categories}
            genres={genres}
            isOpen={showFilters}
            onToggle={() => setShowFilters(!showFilters)}
          />
        </div>

        {isSearching ? (
          <SearchResults
            results={searchResults}
            query={searchQuery}
            loading={loading}
            onClearSearch={handleClearSearch}
            totalResults={pagination.totalResults}
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={handlePageChange}
          />
        ) : (
          <div>
            {/* Continue Watching Section */}
            <ContinueWatching userId={user?.id} />

            {/* Recently Added Section */}
            <CategorySection
              title="Recently Added"
              videos={videos.slice(0, 10)}
              loading={loading}
              error={error}
              onRetry={handleRetry}
              onViewAll={() => handleViewAllCategory('')}
              showViewAll={false}
            />

            {/* Category Sections */}
            {categories.slice(0, 5).map(category => (
              <CategorySection
                key={category}
                title={category}
                videos={categoryVideos[category] || []}
                loading={categoryLoading[category]}
                error={categoryErrors[category]}
                onRetry={() => handleRetryCategorySection(category)}
                onViewAll={() => handleViewAllCategory(category)}
              />
            ))}

            {/* Fallback for when no categories are available */}
            {categories.length === 0 && !loading && (
              <>
                {videos.length === 0 ? (
                  <NoVideosFound onRefresh={handleRetry} />
                ) : (
                  <div style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                    <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '1rem' }}>
                      All Videos
                    </h2>
                    {renderVideoGrid(videos)}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </ComponentErrorBoundary>
  );
};

export default Home;