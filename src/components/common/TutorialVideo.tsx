import { useCallback, useEffect, useRef, useState } from 'react';
import TutorialVideoLoading from './TutorialVideoLoading';
import styles from './TutorialGuide.module.css';

interface TutorialVideoProps {
  src: string;
  title: string;
  onError: () => void;
}

const TutorialVideo = ({ src, title, onError }: TutorialVideoProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bufferingTimerRef = useRef<number | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);

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
      const shouldPlay = !document.hidden && inView;
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
    <>
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
        onCanPlay={markReady}
        onPlaying={markReady}
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
    </>
  );
};

export default TutorialVideo;
