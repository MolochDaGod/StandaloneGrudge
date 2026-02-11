import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QUICK_RESPONSES } from '../data/dialogue';

const BUBBLE_W = 180;
const BUBBLE_H = 70;
const BOUNCE_DAMPING = 0.7;
const FRICTION = 0.96;
const SEPARATION_FORCE = 2.5;

function useBubblePhysics(bubbles, containerSize) {
  const posRef = useRef([]);
  const velRef = useRef([]);
  const rafRef = useRef(null);
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    if (!bubbles.length || !containerSize.w) return;

    if (posRef.current.length !== bubbles.length) {
      posRef.current = bubbles.map((b, i) => ({
        x: b.startX ?? (containerSize.w * 0.15 + i * (BUBBLE_W + 20)),
        y: b.startY ?? (containerSize.h * 0.1),
      }));
      velRef.current = bubbles.map((b) => ({
        x: (b.dirX ?? (Math.random() - 0.5)) * 1.5,
        y: (b.dirY ?? -0.5) * 0.8,
      }));
    }

    const tick = () => {
      const pos = posRef.current;
      const vel = velRef.current;
      const maxX = containerSize.w - BUBBLE_W - 10;
      const maxY = containerSize.h - BUBBLE_H - 10;

      for (let i = 0; i < pos.length; i++) {
        vel[i].x *= FRICTION;
        vel[i].y *= FRICTION;

        pos[i].x += vel[i].x;
        pos[i].y += vel[i].y;

        if (pos[i].x < 10) { pos[i].x = 10; vel[i].x = Math.abs(vel[i].x) * BOUNCE_DAMPING; }
        if (pos[i].x > maxX) { pos[i].x = maxX; vel[i].x = -Math.abs(vel[i].x) * BOUNCE_DAMPING; }
        if (pos[i].y < 10) { pos[i].y = 10; vel[i].y = Math.abs(vel[i].y) * BOUNCE_DAMPING; }
        if (pos[i].y > maxY) { pos[i].y = maxY; vel[i].y = -Math.abs(vel[i].y) * BOUNCE_DAMPING; }
      }

      for (let i = 0; i < pos.length; i++) {
        for (let j = i + 1; j < pos.length; j++) {
          const dx = pos[j].x - pos[i].x;
          const dy = pos[j].y - pos[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = BUBBLE_W * 0.85;
          if (dist < minDist && dist > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = (minDist - dist) * 0.5;
            pos[i].x -= nx * overlap;
            pos[i].y -= ny * overlap;
            pos[j].x += nx * overlap;
            pos[j].y += ny * overlap;
            vel[i].x -= nx * SEPARATION_FORCE;
            vel[i].y -= ny * SEPARATION_FORCE;
            vel[j].x += nx * SEPARATION_FORCE;
            vel[j].y += ny * SEPARATION_FORCE;
          }
        }
      }

      setPositions(pos.map(p => ({ ...p })));
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [bubbles.length, containerSize.w, containerSize.h]);

  return positions;
}

function SpriteFace({ spriteData, size = 48 }) {
  const [frame, setFrame] = useState(0);
  const intervalRef = useRef(null);
  const idleAnim = spriteData?.idle;

  useEffect(() => {
    if (!idleAnim) return;
    let f = 0;
    intervalRef.current = setInterval(() => {
      f = (f + 1) % (idleAnim.frames || 1);
      setFrame(f);
    }, 150);
    return () => clearInterval(intervalRef.current);
  }, [idleAnim]);

  if (!idleAnim) return null;

  const frameWidth = spriteData?.frameWidth || 100;
  const frameHeight = spriteData?.frameHeight || 100;
  const scale = size / Math.min(frameWidth, frameHeight) * 2.2;

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      position: 'relative', flexShrink: 0,
    }}>
      <div style={{
        width: frameWidth * scale,
        height: frameHeight * scale,
        backgroundImage: `url(${idleAnim.src})`,
        backgroundSize: `${frameWidth * (idleAnim.frames || 1) * scale}px ${frameHeight * scale}px`,
        backgroundPosition: `-${frame * frameWidth * scale}px -${frameHeight * scale * 0.05}px`,
        imageRendering: 'pixelated',
        transform: 'translate(-30%, -15%)',
        filter: spriteData?.filter || 'none',
      }} />
    </div>
  );
}

function QuickResponseMenu({ trigger, onAction, bubbleColor }) {
  const responses = QUICK_RESPONSES[trigger];
  if (!responses) return null;

  return (
    <div style={{
      position: 'absolute', bottom: -36, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 4,
      animation: 'bubblePopIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      zIndex: 10,
    }}>
      {responses.map((resp, i) => (
        <button key={i} onClick={(e) => { e.stopPropagation(); onAction(resp.action); }} style={{
          padding: '3px 8px', borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(20,15,40,0.95), rgba(30,25,55,0.95))',
          border: `1.5px solid ${bubbleColor}66`,
          color: '#fff', fontSize: '0.55rem', fontWeight: 600,
          cursor: 'pointer', whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 3,
          transition: 'all 0.15s',
          boxShadow: `0 2px 8px rgba(0,0,0,0.5), 0 0 6px ${bubbleColor}20`,
          fontFamily: "'Cinzel', serif",
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = bubbleColor; e.currentTarget.style.background = `linear-gradient(135deg, ${bubbleColor}25, ${bubbleColor}15)`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = `${bubbleColor}66`; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(20,15,40,0.95), rgba(30,25,55,0.95))'; }}
        >
          <span style={{ fontSize: '0.65rem' }}>{resp.icon}</span>
          {resp.label}
        </button>
      ))}
    </div>
  );
}

export default function ChatBubbleSystem({ dialogue, phase, containerRef, heroSprites, onAction, onDismiss }) {
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [hoveredBubble, setHoveredBubble] = useState(null);
  const hoverTimerRef = useRef(null);
  const [showQuickResponse, setShowQuickResponse] = useState(null);

  useEffect(() => {
    if (!containerRef?.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setContainerSize({ w: rect.width, h: rect.height });
    if (typeof ResizeObserver === 'undefined') return;
    const obs = new ResizeObserver(entries => {
      const r = entries[0]?.contentRect;
      if (r) setContainerSize({ w: r.width, h: r.height });
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [containerRef]);

  const bubbleData = [];
  if (dialogue && phase >= 1) {
    bubbleData.push({
      id: 'speaker1',
      speaker: dialogue.speaker1,
      text: dialogue.line1,
      color: 'var(--accent)',
      colorHex: '#6ee7b7',
      spriteData: heroSprites?.[dialogue.speaker1?.id],
      startX: containerSize.w * 0.08,
      startY: containerSize.h * 0.15,
      dirX: 0.8,
      dirY: -0.3,
    });
  }
  if (dialogue && phase >= 2) {
    bubbleData.push({
      id: 'speaker2',
      speaker: dialogue.speaker2,
      text: dialogue.line2,
      color: 'var(--gold)',
      colorHex: '#fbbf24',
      spriteData: heroSprites?.[dialogue.speaker2?.id],
      startX: containerSize.w * 0.5,
      startY: containerSize.h * 0.08,
      dirX: -0.6,
      dirY: -0.5,
    });
  }

  const positions = useBubblePhysics(bubbleData, containerSize);

  const handleHoverStart = useCallback((bubbleId) => {
    setHoveredBubble(bubbleId);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setShowQuickResponse(bubbleId);
    }, 800);
  }, []);

  const handleHoverEnd = useCallback(() => {
    setHoveredBubble(null);
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  }, []);

  const handleAction = useCallback((action) => {
    setShowQuickResponse(null);
    setHoveredBubble(null);
    if (onAction) onAction(action);
    if (onDismiss) onDismiss();
  }, [onAction, onDismiss]);

  if (!dialogue || phase === 0 || !containerSize.w) return null;

  return (
    <>
      <style>{`
        @keyframes bubblePopIn {
          0% { transform: translateX(-50%) scale(0.3); opacity: 0; }
          60% { transform: translateX(-50%) scale(1.08); opacity: 1; }
          100% { transform: translateX(-50%) scale(1); opacity: 1; }
        }
        @keyframes bubbleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
        @keyframes bubblePulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 0 0 var(--bubble-glow); }
          50% { box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 12px 2px var(--bubble-glow); }
        }
      `}</style>
      {bubbleData.map((bubble, i) => {
        const pos = positions[i];
        if (!pos) return null;
        const isHovered = hoveredBubble === bubble.id;
        const showQR = showQuickResponse === bubble.id && dialogue.trigger;

        return (
          <div key={bubble.id} style={{
            position: 'absolute',
            left: pos.x,
            top: pos.y,
            width: BUBBLE_W,
            zIndex: 9000 + i,
            pointerEvents: 'auto',
            animation: `bubbleFloat 3s ease-in-out infinite ${i * 0.5}s`,
            transition: 'opacity 0.5s',
            opacity: phase > 0 ? 1 : 0,
          }}
            onMouseEnter={() => handleHoverStart(bubble.id)}
            onMouseLeave={handleHoverEnd}
          >
            <div style={{
              '--bubble-glow': `${bubble.colorHex}40`,
              background: 'linear-gradient(145deg, rgba(10,8,28,0.93), rgba(18,14,38,0.95))',
              border: `1.5px solid ${isHovered ? bubble.colorHex : `${bubble.colorHex}55`}`,
              borderRadius: 14,
              padding: 0,
              overflow: 'hidden',
              boxShadow: isHovered
                ? `0 6px 24px rgba(0,0,0,0.6), 0 0 16px ${bubble.colorHex}30`
                : `0 4px 16px rgba(0,0,0,0.5), 0 0 6px ${bubble.colorHex}15`,
              transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
              transform: isHovered ? 'scale(1.05)' : 'scale(1)',
              cursor: 'pointer',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 8px 5px',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  border: `2px solid ${bubble.colorHex}88`,
                  overflow: 'hidden', flexShrink: 0,
                  background: 'rgba(0,0,0,0.4)',
                  boxShadow: `0 0 8px ${bubble.colorHex}25, inset 0 0 8px rgba(0,0,0,0.6)`,
                }}>
                  {bubble.spriteData && <SpriteFace spriteData={bubble.spriteData} size={36} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontWeight: 700,
                    fontSize: '0.5rem', color: bubble.colorHex,
                    marginBottom: 1, letterSpacing: '0.04em',
                    textShadow: `0 0 6px ${bubble.colorHex}50`,
                  }}>
                    {bubble.speaker?.name}
                  </div>
                  <div style={{
                    fontSize: '0.52rem', color: '#d4d4e8', lineHeight: 1.35,
                    fontWeight: 400, overflow: 'hidden',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {bubble.text?.replace(`${bubble.speaker?.name}: `, '')}
                  </div>
                </div>
              </div>

              {dialogue.trigger && dialogue.trigger !== 'generic' && (
                <div style={{
                  height: 2,
                  background: `linear-gradient(90deg, transparent, ${bubble.colorHex}40, transparent)`,
                }} />
              )}

              {isHovered && dialogue.trigger && dialogue.trigger !== 'generic' && (
                <div style={{
                  padding: '2px 8px 3px',
                  textAlign: 'center',
                  fontSize: '0.4rem',
                  color: `${bubble.colorHex}88`,
                  fontFamily: "'Cinzel', serif",
                  letterSpacing: '0.1em',
                  animation: 'fadeIn 0.3s',
                }}>
                  HOLD TO RESPOND
                </div>
              )}
            </div>

            <div style={{
              width: 0, height: 0,
              borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
              borderTop: `6px solid ${isHovered ? bubble.colorHex : `${bubble.colorHex}55`}`,
              marginLeft: i === 0 ? 16 : 'auto',
              marginRight: i === 0 ? 'auto' : 16,
              transition: 'border-top-color 0.2s',
            }} />

            {showQR && (
              <QuickResponseMenu
                trigger={dialogue.trigger}
                onAction={handleAction}
                bubbleColor={bubble.colorHex}
              />
            )}
          </div>
        );
      })}
    </>
  );
}