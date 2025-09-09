// frontend/src/components/ProgressBar.jsx
import React from 'react';

const ProgressBar = ({ 
  progress = 0, 
  max = 100, 
  color = '#e50914',
  backgroundColor = '#333',
  height = '8px',
  borderRadius = '4px',
  showPercentage = false,
  animated = false,
  striped = false,
  className = '',
  style = {}
}) => {
  const percentage = Math.min(Math.max((progress / max) * 100, 0), 100);

  const containerStyle = {
    width: '100%',
    height,
    backgroundColor,
    borderRadius,
    overflow: 'hidden',
    position: 'relative',
    ...style
  };

  const progressStyle = {
    width: `${percentage}%`,
    height: '100%',
    backgroundColor: color,
    borderRadius,
    transition: animated ? 'width 0.3s ease-in-out' : 'none',
    background: striped 
      ? `repeating-linear-gradient(
          45deg,
          ${color},
          ${color} 10px,
          rgba(255,255,255,0.1) 10px,
          rgba(255,255,255,0.1) 20px
        )`
      : color,
    ...(striped && animated && {
      backgroundSize: '20px 20px',
      animation: 'progress-bar-stripes 1s linear infinite'
    })
  };

  const percentageStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#fff',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
  };

  return (
    <>
      {striped && animated && (
        <style>
          {`
            @keyframes progress-bar-stripes {
              0% {
                background-position: 0 0;
              }
              100% {
                background-position: 20px 0;
              }
            }
          `}
        </style>
      )}
      <div style={containerStyle} className={className}>
        <div style={progressStyle}></div>
        {showPercentage && (
          <div style={percentageStyle}>
            {Math.round(percentage)}%
          </div>
        )}
      </div>
    </>
  );
};

// Specialized progress bars
export const UploadProgress = ({ progress, fileName }) => (
  <div style={{ padding: '1rem', backgroundColor: '#111', borderRadius: '8px', margin: '1rem 0' }}>
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '0.5rem'
    }}>
      <span style={{ color: '#ccc', fontSize: '0.9rem' }}>
        Uploading: {fileName}
      </span>
      <span style={{ color: '#ccc', fontSize: '0.9rem' }}>
        {Math.round(progress)}%
      </span>
    </div>
    <ProgressBar 
      progress={progress} 
      animated={true}
      striped={true}
      height="12px"
    />
  </div>
);

export const VideoProgress = ({ currentTime, duration, onSeek }) => {
  const handleClick = (e) => {
    if (onSeek && duration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      onSeek(newTime);
    }
  };

  return (
    <div 
      style={{ cursor: onSeek ? 'pointer' : 'default' }}
      onClick={handleClick}
    >
      <ProgressBar 
        progress={currentTime} 
        max={duration}
        height="6px"
        color="#e50914"
        backgroundColor="rgba(255,255,255,0.3)"
      />
    </div>
  );
};

export default ProgressBar;