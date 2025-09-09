// frontend/src/components/VideoPlayer.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VideoProgress } from './ProgressBar';
import ComponentErrorBoundary from './ComponentErrorBoundary';

const VideoPlayer = ({ 
  src, 
  poster, 
  title,
  onTimeUpdate,
  onEnded,
  onError,
  autoPlay = false,
  controls = true,
  className = '',
  style = {}
}) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);
  const volumeRef = useRef(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  // Hide controls after inactivity
  const controlsTimeoutRef = useRef(null);

  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime, video.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (onEnded) {
        onEnded();
      }
    };

    const handleError = (e) => {
      setError('Failed to load video');
      setIsLoading(false);
      if (onError) {
        onError(e);
      }
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);
    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('playing', handlePlaying);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('playing', handlePlaying);
    };
  }, [onTimeUpdate, onEnded, onError]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, volume]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play();
      setIsPlaying(true);
    }
  };

  const seek = (time) => {
    const video = videoRef.current;
    if (!video) return;

    const clampedTime = Math.max(0, Math.min(duration, time));
    video.currentTime = clampedTime;
    setCurrentTime(clampedTime);
  };

  const handleVolumeChange = (newVolume) => {
    const video = videoRef.current;
    if (!video) return;

    setVolume(newVolume);
    video.volume = newVolume;
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (isFullscreen) {
        await document.exitFullscreen();
      } else {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const changePlaybackRate = (rate) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const formatTime = (time) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const containerStyle = {
    position: 'relative',
    width: '100%',
    backgroundColor: '#000',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: showControls ? 'default' : 'none',
    ...style
  };

  const videoStyle = {
    width: '100%',
    height: '100%',
    display: 'block'
  };

  const controlsStyle = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
    padding: '2rem 1rem 1rem',
    transform: showControls ? 'translateY(0)' : 'translateY(100%)',
    transition: 'transform 0.3s ease-in-out',
    zIndex: 10
  };

  const progressContainerStyle = {
    marginBottom: '1rem',
    cursor: 'pointer'
  };

  const controlsRowStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem'
  };

  const controlsLeftStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  };

  const controlsRightStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  };

  const buttonStyle = {
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    padding: '0.5rem',
    borderRadius: '4px',
    transition: 'background-color 0.2s',
    fontSize: '1.2rem'
  };

  const timeStyle = {
    color: '#fff',
    fontSize: '0.9rem',
    fontFamily: 'monospace'
  };

  const volumeContainerStyle = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center'
  };

  const volumeSliderStyle = {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.8)',
    padding: '1rem 0.5rem',
    borderRadius: '4px',
    marginBottom: '0.5rem',
    display: showVolumeSlider ? 'block' : 'none'
  };

  const speedMenuStyle = {
    position: 'absolute',
    bottom: '100%',
    right: 0,
    background: 'rgba(0,0,0,0.9)',
    borderRadius: '4px',
    padding: '0.5rem',
    marginBottom: '0.5rem',
    display: showSpeedMenu ? 'block' : 'none',
    minWidth: '80px'
  };

  const speedOptionStyle = {
    background: 'none',
    border: 'none',
    color: '#fff',
    padding: '0.5rem',
    cursor: 'pointer',
    width: '100%',
    textAlign: 'left',
    borderRadius: '2px'
  };

  const loadingOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 20
  };

  const errorOverlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: '#fff',
    textAlign: 'center',
    padding: '2rem',
    zIndex: 20
  };

  if (error) {
    return (
      <div style={containerStyle} className={className}>
        <div style={errorOverlayStyle}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
          <h3 style={{ marginBottom: '1rem' }}>Video Error</h3>
          <p style={{ marginBottom: '1rem', color: '#ccc' }}>{error}</p>
          <button 
            style={{
              backgroundColor: '#e50914',
              color: '#fff',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => {
              setError(null);
              if (videoRef.current) {
                videoRef.current.load();
              }
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ComponentErrorBoundary componentName="VideoPlayer">
      <div 
        ref={containerRef}
        style={containerStyle}
        className={className}
        onMouseMove={resetControlsTimeout}
        onMouseLeave={() => {
          if (isPlaying) {
            setShowControls(false);
          }
        }}
        tabIndex={0}
      >
        <video
          ref={videoRef}
          style={videoStyle}
          src={src}
          poster={poster}
          autoPlay={autoPlay}
          controls={false}
          onClick={togglePlay}
        />

        {isLoading && (
          <div style={loadingOverlayStyle}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255,255,255,0.3)',
              borderTop: '3px solid #fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
          </div>
        )}

        {controls && (
          <div style={controlsStyle}>
            <div style={progressContainerStyle}>
              <VideoProgress
                currentTime={currentTime}
                duration={duration}
                onSeek={seek}
              />
            </div>

            <div style={controlsRowStyle}>
              <div style={controlsLeftStyle}>
                <button
                  style={buttonStyle}
                  onClick={togglePlay}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>

                <div style={volumeContainerStyle}>
                  <button
                    style={buttonStyle}
                    onClick={toggleMute}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                  </button>
                  
                  <div 
                    style={volumeSliderStyle}
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      style={{
                        writingMode: 'bt-lr',
                        WebkitAppearance: 'slider-vertical',
                        width: '20px',
                        height: '80px'
                      }}
                    />
                  </div>
                </div>

                <div style={timeStyle}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div style={controlsRightStyle}>
                <div style={{ position: 'relative' }}>
                  <button
                    style={buttonStyle}
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  >
                    {playbackRate}x
                  </button>
                  
                  <div style={speedMenuStyle}>
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                      <button
                        key={rate}
                        style={{
                          ...speedOptionStyle,
                          backgroundColor: rate === playbackRate ? 'rgba(255,255,255,0.2)' : 'transparent'
                        }}
                        onClick={() => changePlaybackRate(rate)}
                        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = rate === playbackRate ? 'rgba(255,255,255,0.2)' : 'transparent'}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  style={buttonStyle}
                  onClick={toggleFullscreen}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  {isFullscreen ? '⛶' : '⛶'}
                </button>
              </div>
            </div>
          </div>
        )}

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

export default VideoPlayer;