// frontend/src/components/SkeletonLoader.jsx
import React from 'react';

const SkeletonLoader = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  count = 1,
  className = '',
  style = {}
}) => {
  const skeletonStyle = {
    width,
    height,
    borderRadius,
    backgroundColor: '#333',
    background: 'linear-gradient(90deg, #333 25%, #444 50%, #333 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-loading 1.5s infinite',
    marginBottom: count > 1 ? '0.5rem' : '0',
    ...style
  };

  const skeletons = Array.from({ length: count }, (_, index) => (
    <div key={index} style={skeletonStyle} className={className}></div>
  ));

  return (
    <>
      <style>
        {`
          @keyframes skeleton-loading {
            0% {
              background-position: -200% 0;
            }
            100% {
              background-position: 200% 0;
            }
          }
        `}
      </style>
      <div>
        {skeletons}
      </div>
    </>
  );
};

// Pre-built skeleton components for common use cases
export const VideoCardSkeleton = () => (
  <div style={{ 
    backgroundColor: '#111', 
    borderRadius: '8px', 
    overflow: 'hidden',
    width: '300px'
  }}>
    <SkeletonLoader height="180px" borderRadius="0" />
    <div style={{ padding: '1rem' }}>
      <SkeletonLoader height="24px" width="80%" style={{ marginBottom: '0.5rem' }} />
      <SkeletonLoader height="16px" width="100%" count={2} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
        <SkeletonLoader height="14px" width="60px" />
        <SkeletonLoader height="14px" width="80px" />
      </div>
    </div>
  </div>
);

export const VideoGridSkeleton = ({ count = 6 }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1rem',
    padding: '2rem'
  }}>
    {Array.from({ length: count }, (_, index) => (
      <VideoCardSkeleton key={index} />
    ))}
  </div>
);

export const VideoPlayerSkeleton = () => (
  <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
    <SkeletonLoader height="40px" width="120px" style={{ marginBottom: '1rem' }} />
    <SkeletonLoader height="500px" borderRadius="8px" style={{ marginBottom: '2rem' }} />
    <div style={{ backgroundColor: '#111', padding: '1.5rem', borderRadius: '8px' }}>
      <SkeletonLoader height="32px" width="70%" style={{ marginBottom: '1rem' }} />
      <SkeletonLoader height="16px" width="100%" count={3} />
      <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
        <SkeletonLoader height="14px" width="100px" />
        <SkeletonLoader height="14px" width="80px" />
        <SkeletonLoader height="14px" width="120px" />
      </div>
    </div>
  </div>
);

export default SkeletonLoader;