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

export default function GameTooltipRenderer() {
  const [state, setState] = useState({ content: null, x: 0, y: 0 });
  const tipRef = useRef(null);
  const [pos, setPos] = useState({ left: 0, top: 0, opacity: 0 });

  useEffect(() => {
    const handler = (s) => setState(s);
    tooltipState.listeners.add(handler);
    return () => tooltipState.listeners.delete(handler);
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

    const maxW = vw - PADDING * 2;
    const maxH = vh - PADDING * 2;

    setPos({
      left,
      top,
      opacity: 1,
      maxWidth: Math.min(360, maxW),
      maxHeight: maxH,
    });
  }, [state]);

  if (!state.content) return null;

  const isString = typeof state.content === 'string';
  const isComplex = React.isValidElement(state.content);

  return createPortal(
    <div
      ref={tipRef}
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        opacity: pos.opacity,
        maxWidth: pos.maxWidth || 360,
        maxHeight: pos.maxHeight || 500,
        overflowY: 'auto',
        overflowX: 'hidden',
        zIndex: TOOLTIP,
        pointerEvents: 'none',
        transition: 'opacity 0.1s ease',
        background: 'linear-gradient(135deg, rgba(14,12,10,0.97), rgba(22,18,14,0.97))',
        border: '2px solid rgba(180,150,90,0.6)',
        borderRadius: 8,
        padding: isString ? '6px 10px' : '8px 12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.8), 0 0 12px rgba(180,150,90,0.15), inset 0 1px 0 rgba(255,215,0,0.08)',
        fontFamily: "'Jost', sans-serif",
        fontSize: '0.72rem',
        lineHeight: 1.45,
        color: '#d4cfc4',
        wordWrap: 'break-word',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(255,215,0,0.3), transparent)',
      }} />
      {isString ? (
        state.content.split('\n').map((line, i) => (
          <div key={i} style={{
            color: i === 0 ? '#e8d5a3' : '#a09888',
            fontWeight: i === 0 ? 700 : 400,
            fontSize: i === 0 ? '0.78rem' : '0.68rem',
            fontFamily: i === 0 ? "'Cinzel', serif" : "'Jost', sans-serif",
            marginBottom: i < state.content.split('\n').length - 1 ? 2 : 0,
          }}>{line}</div>
        ))
      ) : isComplex ? (
        state.content
      ) : null}
    </div>,
    document.body
  );
}
