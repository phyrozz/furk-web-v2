import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Maximize, Minimize, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import TutorialVideoLoading from './TutorialVideoLoading';
import styles from './TutorialGuide.module.css';
import playerStyles from './TutorialVideo.module.css';

const formatTime = (seconds: number) => {
  const time = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  return `${Math.floor(time / 60)}:${String(time % 60).padStart(2, '0')}`;
};

interface TutorialVideoProps {
  src: string;
  title: string;
  onError: () => void;
  onAspectRatioChange?: (aspectRatio: number) => void;
}

const TutorialVideo = ({ src, title, onError, onAspectRatioChange }: TutorialVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const manuallyPaused = useRef(false);
  const bufferingTimerRef = useRef<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackMessage, setPlaybackMessage] = useState('');
  const [videoDimensions, setVideoDimensions] = useState({ src, aspectRatio: 9 / 16 });
  const aspectRatio = videoDimensions.src === src ? videoDimensions.aspectRatio : 9 / 16;

  const updateDimensions = (video: HTMLVideoElement) => {
    if (video.videoWidth <= 0 || video.videoHeight <= 0) return;
    const nextRatio = video.videoWidth / video.videoHeight;
    if (!Number.isFinite(nextRatio) || nextRatio <= 0) return;
    setVideoDimensions({ src, aspectRatio: nextRatio });
    onAspectRatioChange?.(nextRatio);
  };

  const play = () => {
    const video = videoRef.current;
    if (!video) return;
    setPlaybackMessage('');
    void video.play().catch(() => {
      setPlaybackMessage('Playback could not start. Please try again.');
    });
  };

  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video) return;
    manuallyPaused.current = !video.paused;
    setIsPlaybackActive(video.paused);
    if (video.paused) play();
    else video.pause();
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement === playerRef.current) await document.exitFullscreen();
      else await playerRef.current?.requestFullscreen();
    } catch {
      setPlaybackMessage('Fullscreen is unavailable. You can keep watching here.');
    }
  };

  useEffect(() => {
    const updateFullscreen = () => setIsFullscreen(document.fullscreenElement === playerRef.current);
    document.addEventListener('fullscreenchange', updateFullscreen);
    return () => document.removeEventListener('fullscreenchange', updateFullscreen);
  }, []);

  const clearBufferingTimer = useCallback(() => {
    if (bufferingTimerRef.current !== undefined) {
      window.clearTimeout(bufferingTimerRef.current);
      bufferingTimerRef.current = undefined;
    }
  }, []);

  const resetLoading = () => {
    clearBufferingTimer();
    setIsLoading(true);
  };

  const markReady = () => {
    clearBufferingTimer();
    setIsLoading(false);
  };

  const queueBuffering = () => {
    if (bufferingTimerRef.current !== undefined) return;

    // Avoid flashing the loader for short buffering gaps.
    bufferingTimerRef.current = window.setTimeout(() => {
      bufferingTimerRef.current = undefined;
      const video = videoRef.current;
      if (video && !video.paused && video.readyState < video.HAVE_FUTURE_DATA) {
        setIsLoading(true);
      }
    }, 200);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let active = true;
    let inView = typeof IntersectionObserver === 'undefined';
    const updatePlayback = () => {
      if (!active) return;
      const shouldPlay = !document.hidden && inView && !manuallyPaused.current;
      setIsPlaybackActive(shouldPlay);
      if (!shouldPlay) {
        clearBufferingTimer();
        video.pause();
      } else if (video.paused) {
        // A visibility change can pause the video while play() is pending.
        void video.play().catch(() => {});
      }
    };

    const observer = typeof IntersectionObserver === 'undefined'
      ? undefined
      : new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.1;
        updatePlayback();
      }, { threshold: 0.1 });

    observer?.observe(video);
    document.addEventListener('visibilitychange', updatePlayback);
    updatePlayback();

    return () => {
      active = false;
      clearBufferingTimer();
      observer?.disconnect();
      document.removeEventListener('visibilitychange', updatePlayback);
      video.pause();
    };
  }, [src, clearBufferingTimer]);

  return (
    <div
      ref={playerRef}
      className={playerStyles.player}
      style={{ '--tutorial-video-ratio': aspectRatio } as CSSProperties}
    >
      <div className={playerStyles.viewport}>
        <video
          ref={videoRef}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-label={`${title} video tutorial`}
          aria-busy={isLoading}
          onLoadStart={resetLoading}
          onEmptied={resetLoading}
          onLoadedMetadata={(event) => updateDimensions(event.currentTarget)}
          onResize={(event) => updateDimensions(event.currentTarget)}
          onCanPlay={markReady}
          onPlaying={() => {
            markReady();
            setIsPlaying(true);
            setPlaybackMessage('');
          }}
          onPause={() => {
            clearBufferingTimer();
            setIsPlaying(false);
          }}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onDurationChange={(event) => {
            const value = event.currentTarget.duration;
            setDuration(Number.isFinite(value) ? value : 0);
          }}
          onVolumeChange={(event) => setIsMuted(event.currentTarget.muted || event.currentTarget.volume === 0)}
          onRateChange={(event) => setPlaybackRate(event.currentTarget.playbackRate)}
          onWaiting={queueBuffering}
          onStalled={(event) => {
            const video = event.currentTarget;
            if (!video.paused && video.readyState < video.HAVE_FUTURE_DATA) {
              queueBuffering();
            }
          }}
          onError={() => {
            markReady();
            onError();
          }}
          className={styles.video}
        >
          Your browser does not support video playback. Follow the quick how-to guide.
        </video>
        <TutorialVideoLoading visible={isLoading} active={isPlaybackActive} />
      </div>
      <div className={playerStyles.controls} role="group" aria-label={`${title} playback controls`}>
        <div className={playerStyles.timeline}>
          <input
            className={playerStyles.seek}
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={Math.min(currentTime, duration)}
            disabled={!duration}
            aria-label="Seek video"
            aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
            onChange={(event) => {
              if (videoRef.current) {
                videoRef.current.currentTime = Number(event.target.value);
                setCurrentTime(Number(event.target.value));
              }
            }}
          />
          <span className={playerStyles.time}>{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>
        <div className={playerStyles.actions}>
          <button type="button" className={`${playerStyles.iconButton} ${playerStyles.playButton}`} onClick={togglePlayback} aria-label={isPlaying ? 'Pause video' : 'Play video'} title={isPlaying ? 'Pause' : 'Play'}>
            {isPlaying ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
          </button>
          <button type="button" className={playerStyles.iconButton} aria-label="Restart video" title="Restart" disabled={!duration} onClick={() => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              setCurrentTime(0);
              manuallyPaused.current = false;
              setIsPlaybackActive(true);
              play();
            }
          }}>
            <RotateCcw size={17} aria-hidden="true" />
          </button>
          <button type="button" className={playerStyles.iconButton} aria-label={isMuted ? 'Unmute video' : 'Mute video'} title={isMuted ? 'Unmute' : 'Mute'} onClick={() => {
            if (videoRef.current) {
              videoRef.current.muted = !isMuted;
              if (isMuted && videoRef.current.volume === 0) videoRef.current.volume = 1;
            }
          }}>
            {isMuted ? <VolumeX size={17} aria-hidden="true" /> : <Volume2 size={17} aria-hidden="true" />}
          </button>
          <select className={playerStyles.speed} aria-label="Playback speed" value={playbackRate} onChange={(event) => {
            if (videoRef.current) videoRef.current.playbackRate = Number(event.target.value);
          }}>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => <option key={rate} value={rate}>{rate}×</option>)}
          </select>
          {typeof document !== 'undefined' && document.fullscreenEnabled && (
            <button type="button" className={playerStyles.iconButton} onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'} title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {isFullscreen ? <Minimize size={17} aria-hidden="true" /> : <Maximize size={17} aria-hidden="true" />}
            </button>
          )}
        </div>
        {playbackMessage && <p className={playerStyles.message} role="status">{playbackMessage}</p>}
      </div>
    </div>
  );
};

export default TutorialVideo;
