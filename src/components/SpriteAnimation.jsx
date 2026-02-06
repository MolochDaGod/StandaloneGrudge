import React, { useEffect, useRef, useState, useCallback } from 'react';

export default function SpriteAnimation({
  spriteData,
  animation = 'idle',
  scale = 2,
  flip = false,
  onAnimationEnd = null,
  loop = true,
  speed = 120,
}) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef(null);
  const prevAnimRef = useRef(animation);
  const onEndRef = useRef(onAnimationEnd);
  onEndRef.current = onAnimationEnd;

  const anim = spriteData?.[animation] || spriteData?.idle;
  const totalFrames = anim?.frames || 1;

  useEffect(() => {
    if (prevAnimRef.current !== animation) {
      prevAnimRef.current = animation;
      setFrame(0);
    }
  }, [animation]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    let f = 0;
    setFrame(0);
    intervalRef.current = setInterval(() => {
      f++;
      if (f >= totalFrames) {
        if (loop) {
          f = 0;
        } else {
          f = totalFrames - 1;
          clearInterval(intervalRef.current);
          if (onEndRef.current) onEndRef.current();
        }
      }
      setFrame(f);
    }, speed);
    return () => clearInterval(intervalRef.current);
  }, [animation, totalFrames, loop, speed]);

  if (!anim) return null;

  const frameWidth = 100;
  const frameHeight = 100;
  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;

  return (
    <div style={{
      width: displayWidth,
      height: displayHeight,
      overflow: 'hidden',
      imageRendering: 'pixelated',
      transform: flip ? 'scaleX(-1)' : 'none',
    }}>
      <div style={{
        width: totalFrames * displayWidth,
        height: displayHeight,
        backgroundImage: `url(${anim.src})`,
        backgroundSize: `${totalFrames * displayWidth}px ${displayHeight}px`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: `-${frame * displayWidth}px 0`,
        imageRendering: 'pixelated',
        width: displayWidth,
      }} />
    </div>
  );
}
