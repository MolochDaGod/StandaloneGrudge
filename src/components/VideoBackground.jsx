import React, { useRef, useEffect } from 'react';
import { createVideoElement } from '../utils/assetManager';

export default function VideoBackground({ blurred = false, visible = true }) {
  const clearHolderRef = useRef(null);
  const blurHolderRef = useRef(null);
  const videosRef = useRef({ clear: null, blur: null });

  useEffect(() => {
    const clearHolder = clearHolderRef.current;
    const blurHolder = blurHolderRef.current;

    const videoStyle = {
      position: 'absolute', top: '50%', left: '50%',
      transform: 'translate(-50%, -50%)',
      minWidth: '100%', minHeight: '100%',
      width: 'auto', height: 'auto',
      objectFit: 'cover',
    };

    const clearVideo = createVideoElement('/videos/bg-clear.mp4');
    const blurVideo = createVideoElement('/videos/bg-blur.mp4');

    videosRef.current = { clear: clearVideo, blur: blurVideo };

    if (clearVideo && clearHolder) {
      Object.assign(clearVideo.style, videoStyle);
      clearHolder.appendChild(clearVideo);
    }

    if (blurVideo && blurHolder) {
      Object.assign(blurVideo.style, videoStyle);
      blurHolder.appendChild(blurVideo);
    }

    return () => {
      if (clearVideo && clearHolder && clearHolder.contains(clearVideo)) {
        clearVideo.pause();
        clearHolder.removeChild(clearVideo);
      }
      if (blurVideo && blurHolder && blurHolder.contains(blurVideo)) {
        blurVideo.pause();
        blurHolder.removeChild(blurVideo);
      }
      videosRef.current = { clear: null, blur: null };
    };
  }, []);

  useEffect(() => {
    const { clear, blur } = videosRef.current;
    if (visible) {
      if (clear) clear.play().catch(() => {});
      if (blur) blur.play().catch(() => {});
    } else {
      if (clear) clear.pause();
      if (blur) blur.pause();
    }
  }, [visible]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      zIndex: 0, overflow: 'hidden', background: '#050a15',
      visibility: visible ? 'visible' : 'hidden'
    }}>
      <div ref={clearHolderRef} style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        overflow: 'hidden',
        opacity: blurred ? 0 : 1,
        transition: 'opacity 0.8s ease'
      }} />
      <div ref={blurHolderRef} style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        overflow: 'hidden',
        opacity: blurred ? 1 : 0,
        transition: 'opacity 0.8s ease'
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        background: 'rgba(5,10,21,0.55)',
        pointerEvents: 'none'
      }} />
    </div>
  );
}
