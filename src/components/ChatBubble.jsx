import React, { useState, useEffect, useRef } from 'react';
import { CHAT_BUBBLES } from '../constants/layers';

function SpriteFace({ spriteData, size = 32 }) {
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

function ComicBubble({ bubble, speakerPos, onDismiss, camZoom, index, isLeft }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 250 + 80);
    return () => clearTimeout(t);
  }, [index]);

  const bubbleScale = Math.max(0.44, 1.1 / camZoom);
  const tailH = 36;
  const bubbleW = 400;

  const anchorX = speakerPos ? speakerPos.x : (isLeft ? 20 : 100);
  const anchorY = speakerPos?.y ?? 0;

  return (
    <div style={{
      position: 'absolute',
      left: anchorX,
      bottom: -anchorY,
      transform: `translateX(-50%)`,
      zIndex: CHAT_BUBBLES + index,
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'relative',
        transformOrigin: 'bottom center',
        transform: visible ? `scale(${bubbleScale})` : `scale(${bubbleScale * 0.2})`,
        opacity: visible ? 1 : 0,
        transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        pointerEvents: 'auto',
        cursor: 'pointer',
        marginBottom: tailH * bubbleScale + 4,
      }}
        onClick={(e) => { e.stopPropagation(); if (onDismiss) onDismiss(); }}
      >
        <div style={{
          position: 'relative',
          width: bubbleW,
          filter: `drop-shadow(3px 4px 0px rgba(0,0,0,0.55))`,
        }}>
          <div style={{
            background: '#fffef5',
            border: '4px solid #111',
            borderRadius: 26,
            padding: '14px 18px 14px 16px',
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: 4, right: 10,
              fontSize: '1rem', color: '#999', lineHeight: 1,
              fontWeight: 700, fontFamily: 'sans-serif',
              pointerEvents: 'auto',
            }}>
              x
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 6,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                border: `3px solid ${bubble.colorHex}`,
                overflow: 'hidden', flexShrink: 0,
                background: '#2a2a4a',
                boxShadow: `inset 0 0 6px rgba(0,0,0,0.6), 0 0 8px ${bubble.colorHex}44`,
              }}>
                {bubble.spriteData && <SpriteFace spriteData={bubble.spriteData} size={56} />}
              </div>
              <div style={{
                fontFamily: "'Cinzel', serif", fontWeight: 800,
                fontSize: '1.1rem', color: '#1a1a2e',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}>
                {bubble.speaker?.name}
              </div>
            </div>

            <div style={{
              fontSize: '1.1rem',
              color: '#222',
              lineHeight: 1.5,
              fontWeight: 500,
              fontFamily: "'Jost', sans-serif",
              wordBreak: 'break-word',
            }}>
              {bubble.text?.replace(`${bubble.speaker?.name}: `, '')}
            </div>
          </div>

          <svg
            width="56"
            height={tailH}
            viewBox={`0 0 56 ${tailH}`}
            style={{
              position: 'absolute',
              top: '100%',
              marginTop: -4,
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'block',
              overflow: 'visible',
            }}
          >
            <path
              d={`M 12 0 C 17 ${tailH * 0.5}, 22 ${tailH * 0.85}, 28 ${tailH} C 34 ${tailH * 0.85}, 39 ${tailH * 0.5}, 44 0`}
              fill="#fffef5"
              stroke="#111"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <line x1="14" y1="0" x2="42" y2="0" stroke="#fffef5" strokeWidth="6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function ChatBubbleSystem({ dialogue, phase, heroSprites, speakerPositions, onDismiss, camZoom = 3 }) {
  if (!dialogue || phase === 0) return null;

  const bubbleData = [];
  if (phase >= 1) {
    bubbleData.push({
      id: 'speaker1',
      speakerId: dialogue.speaker1?.id,
      speaker: dialogue.speaker1,
      text: dialogue.line1,
      colorHex: '#6ee7b7',
      spriteData: heroSprites?.[dialogue.speaker1?.id],
    });
  }
  if (phase >= 2) {
    bubbleData.push({
      id: 'speaker2',
      speakerId: dialogue.speaker2?.id,
      speaker: dialogue.speaker2,
      text: dialogue.line2,
      colorHex: '#fbbf24',
      spriteData: heroSprites?.[dialogue.speaker2?.id],
    });
  }

  return (
    <>
      {bubbleData.map((bubble, i) => (
        <ComicBubble
          key={bubble.id}
          bubble={bubble}
          speakerPos={speakerPositions?.[bubble.speakerId]}
          isLeft={i === 0}
          onDismiss={onDismiss}
          camZoom={camZoom}
          index={i}
        />
      ))}
    </>
  );
}
