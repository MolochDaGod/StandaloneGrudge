import React, { useRef, useState, useEffect, useCallback } from 'react';
import { REF_W, REF_H, REF_ASPECT, getContainerVars, clampGameDimensions, getGameScale } from '../utils/viewport';

export const GameViewportContext = React.createContext({
  width: REF_W,
  height: REF_H,
  scale: 1,
  ready: false,
});

export function useGameViewport() {
  return React.useContext(GameViewportContext);
}

export default function GameContainer({ children }) {
  const containerRef = useRef(null);
  const viewportRef = useRef(null);
  const [dims, setDims] = useState({ width: REF_W, height: REF_H, scale: 1, ready: false });

  const measure = useCallback(() => {
    const outer = containerRef.current;
    const inner = viewportRef.current;
    if (!outer || !inner) return;
    const parentW = outer.clientWidth;
    const parentH = outer.clientHeight;
    if (parentW === 0 || parentH === 0) return;

    const clamped = clampGameDimensions(parentW, parentH);
    const gameW = clamped.w;
    const gameH = clamped.h;
    const scale = getGameScale(gameW, gameH);

    inner.style.width = `${gameW}px`;
    inner.style.height = `${gameH}px`;

    const vars = getContainerVars(gameW, gameH);
    Object.entries(vars).forEach(([k, v]) => {
      inner.style.setProperty(k, v);
    });

    inner.style.setProperty('--container-w', `${gameW}px`);
    inner.style.setProperty('--container-h', `${gameH}px`);

    setDims({ width: gameW, height: gameH, scale, ready: true });
  }, []);

  useEffect(() => {
    measure();
    const el = containerRef.current;
    if (!el) return;

    if (typeof ResizeObserver !== 'undefined') {
      const obs = new ResizeObserver(measure);
      obs.observe(el);
      return () => obs.disconnect();
    } else {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
  }, [measure]);

  return (
    <div
      ref={containerRef}
      className="game-container"
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
      }}
    >
      <div
        ref={viewportRef}
        className="game-viewport"
        style={{
          position: 'relative',
          overflow: 'hidden',
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        <GameViewportContext.Provider value={dims}>
          {children}
        </GameViewportContext.Provider>
      </div>
    </div>
  );
}
