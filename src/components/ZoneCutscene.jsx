import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ZONE_CUTSCENES, markCutsceneSeen } from '../data/zoneCutscenes';

const CHAR_SPEED = 30;
const LINE_DELAY = 800;

export default function ZoneCutscene({ zoneId, onComplete }) {
  const cutscene = ZONE_CUTSCENES[zoneId];
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState([]);
  const [typing, setTyping] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [titleVisible, setTitleVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const lineAppendedRef = useRef(-1);

  useEffect(() => {
    if (!cutscene) return;
    requestAnimationFrame(() => setFadeIn(true));
    const t1 = setTimeout(() => setTitleVisible(true), 600);
    const t2 = setTimeout(() => setTextVisible(true), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [cutscene]);

  useEffect(() => {
    if (!textVisible || !cutscene) return;
    if (lineIndex >= cutscene.lines.length) {
      setTyping(false);
      return;
    }

    const currentLine = cutscene.lines[lineIndex];
    if (charIndex < currentLine.length) {
      const timer = setTimeout(() => setCharIndex(c => c + 1), CHAR_SPEED);
      return () => clearTimeout(timer);
    }

    if (lineAppendedRef.current === lineIndex) return;
    lineAppendedRef.current = lineIndex;

    setDisplayedLines(prev => [...prev, currentLine]);
    if (lineIndex < cutscene.lines.length - 1) {
      const timer = setTimeout(() => {
        setLineIndex(i => i + 1);
        setCharIndex(0);
      }, LINE_DELAY);
      return () => clearTimeout(timer);
    } else {
      setTyping(false);
    }
  }, [textVisible, lineIndex, charIndex, cutscene]);

  const handleSkip = useCallback(() => {
    if (!cutscene) return;
    if (typing) {
      lineAppendedRef.current = cutscene.lines.length;
      setDisplayedLines([...cutscene.lines]);
      setLineIndex(cutscene.lines.length);
      setCharIndex(0);
      setTyping(false);
      setTextVisible(true);
      setTitleVisible(true);
      return;
    }
    markCutsceneSeen(zoneId);
    setFadeOut(true);
    setTimeout(() => onComplete(), 600);
  }, [typing, zoneId, onComplete, cutscene]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleSkip();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSkip]);

  useEffect(() => {
    if (!cutscene) {
      onComplete();
    }
  }, [cutscene, onComplete]);

  if (!cutscene) return null;

  const currentLine = cutscene.lines[lineIndex];
  const partialText = currentLine ? currentLine.substring(0, charIndex) : '';

  return (
    <div onClick={handleSkip} style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#000',
      cursor: 'pointer',
      opacity: fadeOut ? 0 : (fadeIn ? 1 : 0),
      transition: 'opacity 0.6s ease',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${cutscene.bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: fadeIn ? 0.45 : 0,
        transition: 'opacity 2s ease',
        filter: 'blur(2px) brightness(0.6)',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 30%, rgba(0,0,0,0.3) 60%, rgba(0,0,0,0.8) 100%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 60px',
      }}>
        <div style={{
          opacity: titleVisible ? 1 : 0,
          transform: titleVisible ? 'translateY(0)' : 'translateY(-30px)',
          transition: 'all 1.2s ease',
          textAlign: 'center',
          marginBottom: 8,
        }}>
          <h1 className="font-warcraft" style={{
            fontSize: 'clamp(2rem, 5vw, 3.5rem)',
            letterSpacing: 6,
            lineHeight: 1.1,
            margin: 0,
            background: 'linear-gradient(90deg, #8B372E 0%, #DB6331 20%, #FAAC47 40%, #FFE0A0 50%, #FAAC47 60%, #DB6331 80%, #8B372E 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            WebkitTextStroke: '2px #000',
            paintOrder: 'stroke fill',
            animation: 'titleShimmer 6s linear infinite',
            filter: 'drop-shadow(0 0 20px rgba(250,172,71,0.3)) drop-shadow(0 4px 8px rgba(0,0,0,0.8))',
          }}>
            {cutscene.title}
          </h1>
          <p style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 'clamp(0.8rem, 2vw, 1.1rem)',
            color: 'rgba(200,180,140,0.8)',
            letterSpacing: 4,
            textTransform: 'uppercase',
            margin: '8px 0 0',
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}>
            {cutscene.subtitle}
          </p>
        </div>

        <div style={{
          width: '100%',
          maxWidth: 700,
          marginTop: 32,
          opacity: textVisible ? 1 : 0,
          transform: textVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s ease',
        }}>
          <div style={{
            background: 'rgba(0,0,0,0.5)',
            border: '1px solid rgba(200,160,80,0.2)',
            borderRadius: 8,
            padding: '28px 32px',
            backdropFilter: 'blur(8px)',
          }}>
            {displayedLines.map((line, i) => (
              <p key={i} style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)',
                color: 'rgba(220,210,190,0.9)',
                lineHeight: 1.7,
                margin: '0 0 14px',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              }}>
                {line}
              </p>
            ))}
            {typing && lineIndex < cutscene.lines.length && (
              <p style={{
                fontFamily: "'Jost', sans-serif",
                fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)',
                color: 'rgba(220,210,190,0.9)',
                lineHeight: 1.7,
                margin: 0,
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
              }}>
                {partialText}
                <span style={{
                  display: 'inline-block',
                  width: 2,
                  height: '1em',
                  background: 'rgba(250,172,71,0.8)',
                  marginLeft: 2,
                  animation: 'blink 0.8s infinite',
                  verticalAlign: 'text-bottom',
                }} />
              </p>
            )}
          </div>
        </div>

        <p style={{
          position: 'absolute',
          bottom: 24,
          fontFamily: "'Jost', sans-serif",
          fontSize: '0.8rem',
          color: 'rgba(200,180,140,0.4)',
          letterSpacing: 2,
          textTransform: 'uppercase',
          opacity: textVisible ? 1 : 0,
          transition: 'opacity 1s ease 1s',
        }}>
          {typing ? 'Click or press Space to skip' : 'Click or press Space to continue'}
        </p>
      </div>

      <style>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
