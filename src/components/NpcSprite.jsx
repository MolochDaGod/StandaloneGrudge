import React, { useRef, useEffect, useState } from 'react';
import { npcSpriteMap } from '../data/spriteMap';

export default function NpcSprite({ npcId, scale = 3, flip = false, name }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  const npcData = npcSpriteMap[npcId];
  if (!npcData) return null;

  const { src, frameWidth, frameHeight, frames } = npcData;
  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      imgRef.current = img;
      setLoaded(true);
    };
  }, [src]);

  useEffect(() => {
    if (!loaded || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const fps = 6;

    const animate = () => {
      ctx.clearRect(0, 0, displayWidth, displayHeight);
      ctx.save();
      if (flip) {
        ctx.translate(displayWidth, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(
        imgRef.current,
        frameRef.current * frameWidth, 0,
        frameWidth, frameHeight,
        0, 0,
        displayWidth, displayHeight
      );
      ctx.restore();
      frameRef.current = (frameRef.current + 1) % frames;
    };

    animate();
    const interval = setInterval(animate, 1000 / fps);
    return () => clearInterval(interval);
  }, [loaded, displayWidth, displayHeight, frames, frameWidth, frameHeight, flip]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <canvas
        ref={canvasRef}
        width={displayWidth}
        height={displayHeight}
        style={{ width: displayWidth, height: displayHeight, imageRendering: 'pixelated' }}
      />
      {name && (
        <div style={{
          color: '#e2e8f0', fontSize: '0.4rem', fontWeight: 600,
          textShadow: '0 1px 3px rgba(0,0,0,0.9)', whiteSpace: 'nowrap', marginTop: -2,
        }}>{name}</div>
      )}
    </div>
  );
}
