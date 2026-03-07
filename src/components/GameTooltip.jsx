import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { TOOLTIP } from '../constants/layers';

let tooltipState = {
  content: null,
  x: 0,
  y: 0,
  anchor: null,
  listeners: new Set(),
};

function notify() {
  tooltipState.listeners.forEach(fn => fn({ ...tooltipState }));
}

export function showTooltip(content, e) {
  tooltipState.content = content;
  if (e) {
    tooltipState.x = e.clientX;
    tooltipState.y = e.clientY;
  }
  notify();
}

export function hideTooltip() {
  tooltipState.content = null;
  tooltipState.anchor = null;
  notify();
}

export function updateTooltipPosition(e) {
  tooltipState.x = e.clientX;
  tooltipState.y = e.clientY;
  tooltipState.lastActivity = Date.now();
  notify();
}

export function useTooltip(content, deps = []) {
  const contentRef = useRef(content);
  contentRef.current = content;

  const onMouseEnter = useCallback((e) => {
    showTooltip(contentRef.current, e);
  }, []);

  const onMouseMove = useCallback((e) => {
    updateTooltipPosition(e);
  }, []);

  const onMouseLeave = useCallback(() => {
    hideTooltip();
  }, []);

  return { onMouseEnter, onMouseMove, onMouseLeave };
}

export function Tip({ content, children, style, ...rest }) {
  const handlers = useTooltip(content);
  return (
    <div {...handlers} style={{ ...style }} {...rest}>
      {children}
    </div>
  );
}

const PADDING = 12;
const CURSOR_OFFSET = 14;

function getResponsiveFontScale() {
  const w = window.innerWidth;
  if (w < 480) return 0.85;
  if (w < 768) return 0.92;
  return 1;
}

export default function GameTooltipRenderer() {
  const [state, setState] = useState({ content: null, x: 0, y: 0 });
  const tipRef = useRef(null);
  const [pos, setPos] = useState({ left: 0, top: 0, opacity: 0 });
  const lastMouseMove = useRef(Date.now());

  useEffect(() => {
    const handler = (s) => {
      if (s.content) lastMouseMove.current = Date.now();
      setState(s);
    };
    tooltipState.listeners.add(handler);

    const staleCheck = setInterval(() => {
      if (tooltipState.content) {
        const lastAct = Math.max(lastMouseMove.current, tooltipState.lastActivity || 0);
        if (Date.now() - lastAct > 1500) {
          hideTooltip();
        }
      }
    }, 500);

    return () => {
      tooltipState.listeners.delete(handler);
      clearInterval(staleCheck);
    };
  }, []);

  useEffect(() => {
    if (!state.content || !tipRef.current) {
      setPos(p => ({ ...p, opacity: 0 }));
      return;
    }

    const el = tipRef.current;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let left = state.x + CURSOR_OFFSET;
    let top = state.y + CURSOR_OFFSET;

    if (left + rect.width + PADDING > vw) {
      left = state.x - rect.width - CURSOR_OFFSET;
    }
    if (left < PADDING) {
      left = PADDING;
    }

    if (top + rect.height + PADDING > vh) {
      top = state.y - rect.height - CURSOR_OFFSET;
    }
    if (top < PADDING) {
      top = PADDING;
    }

    const maxW = Math.min(vw - PADDING * 2, 380);
    const maxH = vh - PADDING * 2;

    setPos({
      left,
      top,
      opacity: 1,
      maxWidth: maxW,
      maxHeight: maxH,
    });
  }, [state]);

  if (!state.content) return null;

  const isString = typeof state.content === 'string';
  const isComplex = React.isValidElement(state.content);
  const scale = getResponsiveFontScale();

  return createPortal(
    <div
      ref={tipRef}
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        opacity: pos.opacity,
        maxWidth: pos.maxWidth || 380,
        maxHeight: pos.maxHeight || 500,
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: TOOLTIP,
        pointerEvents: 'none',
        transition: 'opacity 0.12s ease-out',
        background: 'linear-gradient(160deg, rgba(18,14,10,0.98) 0%, rgba(28,22,16,0.98) 40%, rgba(20,16,12,0.98) 100%)',
        border: '1px solid rgba(180,150,90,0.5)',
        borderRadius: 6,
        padding: isString ? `${6 * scale}px ${10 * scale}px` : `${8 * scale}px ${12 * scale}px`,
        boxShadow: '0 6px 32px rgba(0,0,0,0.85), 0 0 1px rgba(180,150,90,0.4), inset 0 1px 0 rgba(255,215,0,0.06)',
        fontFamily: "'Jost', sans-serif",
        fontSize: `${0.72 * scale}rem`,
        lineHeight: 1.5,
        color: '#d4cfc4',
        wordWrap: 'break-word',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 5%, rgba(255,215,0,0.25) 50%, transparent 95%)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent 10%, rgba(180,150,90,0.15) 50%, transparent 90%)',
      }} />
      {isString ? (
        state.content.split('\n').map((line, i) => (
          <div key={i} style={{
            color: i === 0 ? '#f0e4c8' : '#b0a890',
            fontWeight: i === 0 ? 700 : 400,
            fontSize: i === 0 ? `${0.78 * scale}rem` : `${0.68 * scale}rem`,
            fontFamily: i === 0 ? "'Cinzel', serif" : "'Jost', sans-serif",
            marginBottom: i < state.content.split('\n').length - 1 ? 3 : 0,
            letterSpacing: i === 0 ? '0.02em' : 'normal',
          }}>{line}</div>
        ))
      ) : isComplex ? (
        state.content
      ) : null}
    </div>,
    document.body
  );
}
