import React, { useState, useEffect, useCallback, useRef } from 'react';
import { applyFrameSettings } from './FrameEditor';
import { ADMIN_GIZMO, ADMIN_GIZMO_PANEL, ADMIN_GIZMO_BUTTON } from '../constants/layers';
import HeroCodexTab from './HeroCodexTab';

const STORAGE_KEY = 'grudge-admin-layout';
const GIZMO_Z = ADMIN_GIZMO;

function loadSavedLayout() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch { return {}; }
}

function saveLayout(layout) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
}

function getElementPath(el) {
  const parts = [];
  let node = el;
  while (node && node !== document.body && parts.length < 6) {
    let selector = node.tagName.toLowerCase();
    if (node.id) { selector += '#' + node.id; parts.unshift(selector); break; }
    if (node.className && typeof node.className === 'string') {
      const cls = node.className.split(/\s+/).filter(c => c && !c.startsWith('_')).slice(0, 2).join('.');
      if (cls) selector += '.' + cls;
    }
    const parent = node.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === node.tagName);
      if (siblings.length > 1) selector += ':nth(' + siblings.indexOf(node) + ')';
    }
    parts.unshift(selector);
    node = node.parentElement;
  }
  return parts.join(' > ');
}

function AdminGizmo() {
  const [enabled, setEnabled] = useState(false);
  const [showHeroCodex, setShowHeroCodex] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selRect, setSelRect] = useState(null);
  const [props, setProps] = useState({});
  const [panelPos, setPanelPos] = useState({ x: 20, y: 60 });
  const [draggingPanel, setDraggingPanel] = useState(false);
  const [draggingElement, setDraggingElement] = useState(false);
  const [resizingElement, setResizingElement] = useState(null);
  const [saveFlash, setSaveFlash] = useState(false);
  const [log, setLog] = useState('');
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const layoutRef = useRef(loadSavedLayout());

  const updateSelRect = useCallback((el) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSelRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, []);

  const readProps = useCallback((el) => {
    const cs = window.getComputedStyle(el);
    const isImg = el.tagName === 'IMG';
    const isCanvas = el.tagName === 'CANVAS';
    const isText = !isImg && !isCanvas && el.childNodes.length > 0 &&
      Array.from(el.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    const hasBg = cs.backgroundImage && cs.backgroundImage !== 'none';
    const transform = el.style.transform || cs.transform;
    const scaleMatch = transform && transform.match(/scale\(([^)]+)\)/);
    const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
    return {
      tagName: el.tagName, isImg, isText, isCanvas, hasBg,
      text: isText ? el.textContent : '',
      src: isImg ? el.src : '',
      bgImage: hasBg ? cs.backgroundImage : '',
      width: Math.round(parseFloat(cs.width)),
      height: Math.round(parseFloat(cs.height)),
      fontSize: Math.round(parseFloat(cs.fontSize)),
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      opacity: parseFloat(cs.opacity),
      borderRadius: Math.round(parseFloat(cs.borderRadius) || 0),
      padding: cs.padding,
      margin: cs.margin,
      display: cs.display,
      position: cs.position,
      transform: transform || 'none',
      scale: currentScale,
      path: getElementPath(el),
    };
  }, []);

  const handleClick = useCallback((e) => {
    if (!enabled) return;
    const gizmoRoot = document.getElementById('admin-gizmo-root');
    if (gizmoRoot && gizmoRoot.contains(e.target)) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.target;
    setSelected(el);
    updateSelRect(el);
    setProps(readProps(el));
    setLog(`Selected: ${el.tagName} (${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)})`);
  }, [enabled, updateSelRect, readProps]);

  useEffect(() => {
    if (!enabled) {
      setSelected(null);
      setSelRect(null);
      setProps({});
      return;
    }
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [enabled, handleClick]);

  useEffect(() => {
    if (!selected || !enabled) return;
    const interval = setInterval(() => updateSelRect(selected), 200);
    return () => clearInterval(interval);
  }, [selected, enabled, updateSelRect]);

  const recordChange = useCallback((el) => {
    const path = getElementPath(el);
    const cs = window.getComputedStyle(el);
    if (!layoutRef.current[path]) layoutRef.current[path] = {};
    const saved = layoutRef.current[path];
    if (el.style.left) saved.left = el.style.left;
    if (el.style.top) saved.top = el.style.top;
    if (el.style.width) saved.width = el.style.width;
    if (el.style.height) saved.height = el.style.height;
    if (el.style.transform) saved.transform = el.style.transform;
    if (el.style.fontSize) saved.fontSize = el.style.fontSize;
    if (el.style.position) saved.position = el.style.position;
  }, []);

  const handleSave = useCallback(() => {
    if (selected) recordChange(selected);
    saveLayout(layoutRef.current);
    setSaveFlash(true);
    setLog('Layout saved to localStorage!');
    setTimeout(() => setSaveFlash(false), 600);
  }, [selected, recordChange]);

  const handleScaleChange = useCallback((delta) => {
    if (!selected) return;
    const cs = window.getComputedStyle(selected);
    const transform = selected.style.transform || cs.transform || '';
    const scaleMatch = transform.match(/scale\(([^)]+)\)/);
    let currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
    currentScale = Math.max(0.1, currentScale + delta);
    const newTransform = scaleMatch
      ? transform.replace(/scale\([^)]+\)/, `scale(${currentScale.toFixed(2)})`)
      : (transform === 'none' || !transform ? `scale(${currentScale.toFixed(2)})` : transform + ` scale(${currentScale.toFixed(2)})`);
    selected.style.transform = newTransform;
    updateSelRect(selected);
    setProps(readProps(selected));
    recordChange(selected);
    setLog(`Scale: ${currentScale.toFixed(2)}x`);
  }, [selected, updateSelRect, readProps, recordChange]);

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSave();
      } else if ((e.key === '+' || e.key === '=') && selected) {
        e.preventDefault();
        handleScaleChange(0.05);
      } else if ((e.key === '-' || e.key === '_') && selected) {
        e.preventDefault();
        handleScaleChange(-0.05);
      } else if (e.key === 'Escape') {
        setSelected(null);
        setSelRect(null);
        setProps({});
      } else if (e.key === 'Delete' && selected) {
        selected.style.display = selected.style.display === 'none' ? '' : 'none';
        setLog(selected.style.display === 'none' ? 'Hidden' : 'Visible');
      }
      if (selected && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const cs = window.getComputedStyle(selected);
        if (cs.position === 'static') selected.style.position = 'relative';
        const step = e.shiftKey ? 10 : 1;
        let left = parseInt(selected.style.left) || 0;
        let top = parseInt(selected.style.top) || 0;
        if (e.key === 'ArrowLeft') left -= step;
        if (e.key === 'ArrowRight') left += step;
        if (e.key === 'ArrowUp') top -= step;
        if (e.key === 'ArrowDown') top += step;
        selected.style.left = left + 'px';
        selected.style.top = top + 'px';
        updateSelRect(selected);
        setProps(readProps(selected));
        recordChange(selected);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled, selected, handleSave, handleScaleChange, updateSelRect, readProps, recordChange]);

  useEffect(() => {
    applyFrameSettings();
  }, []);

  useEffect(() => {
    const layout = loadSavedLayout();
    if (Object.keys(layout).length === 0) return;
    const timer = setTimeout(() => {
      Object.entries(layout).forEach(([path, styles]) => {
        try {
          const parts = path.split(' > ');
          let el = null;
          for (const part of parts) {
            const idMatch = part.match(/#([\w-]+)/);
            if (idMatch) { el = document.getElementById(idMatch[1]); continue; }
            const tagMatch = part.match(/^(\w+)/);
            const clsMatch = part.match(/\.([\w.-]+)/);
            const nthMatch = part.match(/:nth\((\d+)\)/);
            if (!el) el = document.body;
            const candidates = el.querySelectorAll(tagMatch ? tagMatch[1] : '*');
            if (clsMatch) {
              const classes = clsMatch[1].split('.');
              el = Array.from(candidates).find(c =>
                classes.every(cls => c.classList.contains(cls))
              ) || null;
            } else if (nthMatch) {
              el = candidates[parseInt(nthMatch[1])] || null;
            } else {
              el = candidates[0] || null;
            }
          }
          if (el) {
            Object.entries(styles).forEach(([prop, val]) => { el.style[prop] = val; });
          }
        } catch (e) {}
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const applyStyle = (prop, value) => {
    if (!selected) return;
    selected.style[prop] = value;
    updateSelRect(selected);
    setProps(readProps(selected));
    recordChange(selected);
  };

  const handlePanelMouseDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    setDraggingPanel(true);
    dragOffset.current = { x: e.clientX - panelPos.x, y: e.clientY - panelPos.y };
  };

  useEffect(() => {
    if (!draggingPanel) return;
    const onMove = (e) => setPanelPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
    const onUp = () => setDraggingPanel(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [draggingPanel]);

  const handleElementDragStart = (e) => {
    if (!selected) return;
    e.preventDefault();
    e.stopPropagation();
    const r = selected.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    setDraggingElement(true);
  };

  useEffect(() => {
    if (!draggingElement || !selected) return;
    const cs = window.getComputedStyle(selected);
    if (cs.position === 'static') selected.style.position = 'relative';
    const onMove = (e) => {
      const parent = selected.offsetParent || document.body;
      const pr = parent.getBoundingClientRect();
      const newLeft = e.clientX - dragOffset.current.x - pr.left;
      const newTop = e.clientY - dragOffset.current.y - pr.top;
      selected.style.left = newLeft + 'px';
      selected.style.top = newTop + 'px';
      updateSelRect(selected);
      setProps(readProps(selected));
    };
    const onUp = () => {
      setDraggingElement(false);
      recordChange(selected);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [draggingElement, selected]);

  const handleResizeStart = (corner, e) => {
    if (!selected) return;
    e.preventDefault();
    e.stopPropagation();
    const r = selected.getBoundingClientRect();
    resizeStart.current = { x: e.clientX, y: e.clientY, w: r.width, h: r.height };
    setResizingElement(corner);
  };

  useEffect(() => {
    if (!resizingElement || !selected) return;
    const onMove = (e) => {
      const dx = e.clientX - resizeStart.current.x;
      const dy = e.clientY - resizeStart.current.y;
      let newW = resizeStart.current.w;
      let newH = resizeStart.current.h;
      if (resizingElement.includes('r')) newW += dx;
      if (resizingElement.includes('l')) newW -= dx;
      if (resizingElement.includes('b')) newH += dy;
      if (resizingElement.includes('t')) newH -= dy;
      selected.style.width = Math.max(10, newW) + 'px';
      selected.style.height = Math.max(10, newH) + 'px';
      updateSelRect(selected);
      setProps(readProps(selected));
    };
    const onUp = () => {
      setResizingElement(null);
      recordChange(selected);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizingElement, selected]);

  const labelStyle = {
    fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 2, marginTop: 6,
  };
  const inputStyle = {
    background: '#1e293b', border: '1px solid #334155', borderRadius: 4,
    color: '#e2e8f0', padding: '4px 6px', fontSize: '0.75rem', width: '100%',
    outline: 'none', boxSizing: 'border-box',
  };
  const rowStyle = { display: 'flex', gap: 6, alignItems: 'center' };
  const smallInputStyle = { ...inputStyle, width: 60, textAlign: 'center' };
  const btnStyle = {
    background: '#1e293b', border: '1px solid #334155', borderRadius: 4,
    color: '#e2e8f0', padding: '3px 8px', fontSize: '0.65rem', cursor: 'pointer',
  };

  const [showGameRef, setShowGameRef] = useState(false);

  return (
    <div id="admin-gizmo-root">
      <div style={{
        position: 'fixed', top: '50%', right: 8, transform: 'translateY(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        zIndex: ADMIN_GIZMO_BUTTON,
      }}>
        <button
          onClick={() => setShowHeroCodex(h => !h)}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: showHeroCodex ? '#6ee7b7' : 'rgba(30,30,50,0.7)',
            border: `2px solid ${showHeroCodex ? '#6ee7b7' : 'rgba(255,255,255,0.15)'}`,
            color: showHeroCodex ? '#000' : '#666',
            fontSize: '0.75rem', fontWeight: 900,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: showHeroCodex ? '0 0 12px rgba(110,231,183,0.5)' : 'none',
            transition: 'all 0.2s',
          }}
          title="Hero Codex"
        >
          📖
        </button>
        <button
          onClick={() => setShowGameRef(r => !r)}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: showGameRef ? '#3b82f6' : 'rgba(30,30,50,0.7)',
            border: `2px solid ${showGameRef ? '#60a5fa' : 'rgba(255,255,255,0.15)'}`,
            color: showGameRef ? '#fff' : '#666',
            fontSize: '0.75rem', fontWeight: 900,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: showGameRef ? '0 0 12px rgba(59,130,246,0.5)' : 'none',
            transition: 'all 0.2s',
          }}
          title="Game Reference"
        >
          📋
        </button>
        <button
          onClick={() => setEnabled(e => !e)}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: enabled ? '#f59e0b' : 'rgba(30,30,50,0.7)',
            border: `2px solid ${enabled ? '#fbbf24' : 'rgba(255,255,255,0.15)'}`,
            color: enabled ? '#000' : '#666',
            fontSize: '0.85rem', fontWeight: 900,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: enabled ? '0 0 12px rgba(245,158,11,0.5)' : 'none',
            transition: 'all 0.2s',
          }}
          title={enabled ? 'Disable Admin Gizmo' : 'Enable Admin Gizmo'}
        >
          ⚙
        </button>
      </div>

      {showHeroCodex && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: ADMIN_GIZMO_BUTTON + 2,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={() => setShowHeroCodex(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '90vw', maxWidth: 1100, height: '85vh',
            background: 'linear-gradient(180deg, #141a2b 0%, #0a0e1e 100%)',
            border: '2px solid rgba(110,231,183,0.3)',
            borderRadius: 16, overflow: 'hidden', position: 'relative',
          }}>
            <button onClick={() => setShowHeroCodex(false)} style={{
              position: 'absolute', top: 12, right: 12, zIndex: 10,
              width: 32, height: 32, borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>×</button>
            <div style={{ height: '100%', overflow: 'auto', padding: 24 }}>
              <HeroCodexTab />
            </div>
          </div>
        </div>
      )}

      {showGameRef && <GameReferencePanel onClose={() => setShowGameRef(false)} />}

      {enabled && log && (
        <div style={{
          position: 'fixed', top: '50%', right: 50, transform: 'translateY(40px)',
          background: saveFlash ? 'rgba(34,197,94,0.9)' : 'rgba(15,23,42,0.9)',
          border: `1px solid ${saveFlash ? '#22c55e' : '#334155'}`,
          borderRadius: 6, padding: '4px 10px',
          color: saveFlash ? '#fff' : '#94a3b8',
          fontSize: '0.65rem', zIndex: ADMIN_GIZMO_BUTTON,
          transition: 'all 0.2s', maxWidth: 200,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {log}
        </div>
      )}

      {enabled && selRect && (
        <div style={{
          position: 'fixed',
          top: selRect.top - 2, left: selRect.left - 2,
          width: selRect.width + 4, height: selRect.height + 4,
          border: '2px solid #f59e0b',
          borderRadius: 2, pointerEvents: 'none',
          zIndex: GIZMO_Z,
          boxShadow: '0 0 0 1px rgba(245,158,11,0.3), 0 0 12px rgba(245,158,11,0.2)',
          transition: draggingElement || resizingElement ? 'none' : 'all 0.15s ease',
        }}>
          <div style={{
            position: 'absolute', top: -20, left: 0,
            background: '#f59e0b', color: '#000',
            fontSize: '0.55rem', fontWeight: 700, padding: '1px 6px', borderRadius: 3,
            whiteSpace: 'nowrap', pointerEvents: 'none',
          }}>
            {props.tagName} · {selRect.width.toFixed(0)}×{selRect.height.toFixed(0)} · {props.scale?.toFixed(2)}x
          </div>

          <div
            onMouseDown={handleElementDragStart}
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 20, height: 20, borderRadius: '50%',
              background: 'rgba(245,158,11,0.8)', border: '2px solid #fff',
              cursor: 'move', pointerEvents: 'auto',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.5rem', color: '#000', fontWeight: 900,
              boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
            }}
            title="Drag to move"
          >✥</div>

          {[
            { pos: { top: -5, left: -5 }, cursor: 'nw-resize', corner: 'tl' },
            { pos: { top: -5, right: -5 }, cursor: 'ne-resize', corner: 'tr' },
            { pos: { bottom: -5, left: -5 }, cursor: 'sw-resize', corner: 'bl' },
            { pos: { bottom: -5, right: -5 }, cursor: 'se-resize', corner: 'br' },
          ].map(({ pos, cursor, corner }) => (
            <div
              key={corner}
              onMouseDown={(e) => handleResizeStart(corner, e)}
              style={{
                position: 'absolute', ...pos,
                width: 10, height: 10, background: '#f59e0b',
                border: '1px solid #fff', borderRadius: 2,
                cursor, pointerEvents: 'auto',
                boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              }}
            />
          ))}
        </div>
      )}

      {enabled && selected && (
        <div
          onMouseDown={handlePanelMouseDown}
          style={{
            position: 'fixed', top: panelPos.y, left: panelPos.x,
            width: 260, maxHeight: '70vh', overflowY: 'auto',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            border: '1px solid #f59e0b55', borderRadius: 10,
            padding: 12, zIndex: GIZMO_Z + 5,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
            cursor: draggingPanel ? 'grabbing' : 'grab',
            userSelect: 'none',
          }}
        >
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 8, borderBottom: '1px solid #334155', paddingBottom: 6,
          }}>
            <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 1 }}>
              ADMIN GIZMO
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              <button onClick={handleSave} style={{ ...btnStyle, background: saveFlash ? '#22c55e' : '#1e293b', color: saveFlash ? '#fff' : '#e2e8f0' }} title="Save (S)">
                💾 Save
              </button>
              <button
                onClick={() => { setSelected(null); setSelRect(null); setProps({}); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', padding: '0 4px' }}
              >✕</button>
            </div>
          </div>

          <div style={{ fontSize: '0.6rem', color: '#64748b', marginBottom: 4, wordBreak: 'break-all' }}>
            {props.path}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 8 }}>
            {props.tagName} · {props.display} · {props.position}
          </div>

          <div style={labelStyle}>Scale (+/-)</div>
          <div style={rowStyle}>
            <button onClick={() => handleScaleChange(-0.1)} style={btnStyle}>−</button>
            <input
              type="number"
              step="0.05"
              value={props.scale?.toFixed(2) || '1.00'}
              onChange={e => {
                const val = parseFloat(e.target.value) || 1;
                const transform = selected.style.transform || '';
                const scaleMatch = transform.match(/scale\([^)]+\)/);
                selected.style.transform = scaleMatch
                  ? transform.replace(/scale\([^)]+\)/, `scale(${val})`)
                  : (transform ? transform + ` scale(${val})` : `scale(${val})`);
                updateSelRect(selected);
                setProps(readProps(selected));
                recordChange(selected);
              }}
              onMouseDown={e => e.stopPropagation()}
              style={{ ...smallInputStyle, flex: 1 }}
            />
            <button onClick={() => handleScaleChange(0.1)} style={btnStyle}>+</button>
          </div>

          <div style={labelStyle}>Size</div>
          <div style={rowStyle}>
            <span style={{ color: '#64748b', fontSize: '0.65rem', width: 14 }}>W</span>
            <input type="number" value={props.width || 0} onChange={e => applyStyle('width', e.target.value + 'px')} onMouseDown={e => e.stopPropagation()} style={smallInputStyle} />
            <span style={{ color: '#64748b', fontSize: '0.65rem', width: 14 }}>H</span>
            <input type="number" value={props.height || 0} onChange={e => applyStyle('height', e.target.value + 'px')} onMouseDown={e => e.stopPropagation()} style={smallInputStyle} />
          </div>

          {props.isText && (
            <>
              <div style={labelStyle}>Text</div>
              <textarea
                value={props.text}
                onChange={e => { selected.textContent = e.target.value; setProps(p => ({ ...p, text: e.target.value })); }}
                onMouseDown={e => e.stopPropagation()}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 40, fontFamily: 'inherit' }}
              />
              <div style={labelStyle}>Font Size</div>
              <div style={rowStyle}>
                <input type="range" min={6} max={72} value={props.fontSize || 16} onChange={e => applyStyle('fontSize', e.target.value + 'px')} onMouseDown={e => e.stopPropagation()} style={{ flex: 1, accentColor: '#f59e0b' }} />
                <span style={{ color: '#e2e8f0', fontSize: '0.7rem', width: 32, textAlign: 'right' }}>{props.fontSize}px</span>
              </div>
            </>
          )}

          {props.isImg && (
            <>
              <div style={labelStyle}>Image Src</div>
              <input value={props.src} onChange={e => { selected.src = e.target.value; setProps(p => ({ ...p, src: e.target.value })); }} onMouseDown={e => e.stopPropagation()} style={inputStyle} />
            </>
          )}

          <div style={labelStyle}>Colors</div>
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.55rem', color: '#64748b', marginBottom: 2 }}>Text</div>
              <input type="color" value={rgbToHex(props.color)} onChange={e => applyStyle('color', e.target.value)} onMouseDown={e => e.stopPropagation()} style={{ width: 28, height: 22, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.55rem', color: '#64748b', marginBottom: 2 }}>BG</div>
              <input type="color" value={rgbToHex(props.backgroundColor)} onChange={e => applyStyle('backgroundColor', e.target.value)} onMouseDown={e => e.stopPropagation()} style={{ width: 28, height: 22, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.55rem', color: '#64748b', marginBottom: 2 }}>Opacity</div>
              <input type="range" min={0} max={100} value={Math.round((props.opacity || 1) * 100)} onChange={e => applyStyle('opacity', (parseInt(e.target.value) / 100).toString())} onMouseDown={e => e.stopPropagation()} style={{ width: '100%', accentColor: '#f59e0b' }} />
            </div>
          </div>

          <div style={labelStyle}>Spacing</div>
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.55rem', color: '#64748b' }}>Pad</div>
              <input value={props.padding || '0px'} onChange={e => applyStyle('padding', e.target.value)} onMouseDown={e => e.stopPropagation()} style={{ ...inputStyle, fontSize: '0.6rem' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.55rem', color: '#64748b' }}>Margin</div>
              <input value={props.margin || '0px'} onChange={e => applyStyle('margin', e.target.value)} onMouseDown={e => e.stopPropagation()} style={{ ...inputStyle, fontSize: '0.6rem' }} />
            </div>
          </div>

          <div style={{ marginTop: 10, borderTop: '1px solid #334155', paddingTop: 6 }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <button onClick={() => { layoutRef.current = {}; saveLayout({}); setLog('Layout reset!'); }} style={{ ...btnStyle, color: '#ef4444' }}>Reset All</button>
              <button onClick={() => {
                const el = selected;
                if (el) { el.style.cssText = ''; updateSelRect(el); setProps(readProps(el)); setLog('Element styles cleared'); }
              }} style={btnStyle}>Clear Styles</button>
              <button onClick={() => {
                const json = JSON.stringify(layoutRef.current, null, 2);
                navigator.clipboard.writeText(json).then(() => setLog('Copied to clipboard!'));
              }} style={btnStyle}>Export</button>
            </div>
            <div style={{ fontSize: '0.5rem', color: '#475569', textAlign: 'center', marginTop: 6 }}>
              Click=select · Drag center=move · Corners=resize · +/-=scale · Arrows=nudge · S=save · Esc=deselect
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GameReferencePanel({ onClose }) {
  const [tab, setTab] = useState('zones');
  const tabs = [
    { id: 'zones', label: 'Zones' },
    { id: 'bosses', label: 'Bosses' },
    { id: 'dungeons', label: 'Dungeons' },
    { id: 'gods', label: 'Gods' },
    { id: 'flow', label: 'Flow' },
  ];

  const ZONES = [
    { name: 'Verdant Plains', lvl: '1-3', boss: null, unlock: 'Start', enemies: 'Goblin, Wolf, Mushroom, Imp, Shadow Bat', tier: 1 },
    { name: 'Dark Forest', lvl: '3-5', boss: null, unlock: 'Start', enemies: 'Wolf, Goblin, Skeleton, Mushroom, Flying Eye', tier: 1 },
    { name: 'Whispering Caverns', lvl: '3-5', boss: null, unlock: 'Lv3', enemies: 'Goblin, Skeleton, Flying Eye, Mimic', tier: 1 },
    { name: 'Mystic Grove', lvl: '4-6', boss: null, unlock: 'Lv3', enemies: 'Goblin, Wolf, Dark Mage, Mushroom', tier: 1 },
    { name: 'Haunted Marsh', lvl: '5-7', boss: null, unlock: 'Lv4', enemies: 'Skeleton, Dark Mage, Wolf, Mushroom', tier: 2 },
    { name: 'Cursed Ruins', lvl: '6-9', boss: null, unlock: 'Lv5', enemies: 'Skeleton Knight, Dark Knight, Shadow Warrior', tier: 2 },
    { name: 'Thornwood Pass', lvl: '6-8', boss: null, unlock: 'Lv5', enemies: 'Wolf, Goblin, Orc, Crow Knight', tier: 2 },
    { name: 'Sunken Temple', lvl: '7-9', boss: 'Grand Shaman', unlock: 'Lv6', enemies: 'Skeleton, Dark Mage, Stone Guardian', tier: 2 },
    { name: 'Crystal Caves', lvl: '7-9', boss: null, unlock: 'Lv6', enemies: 'Skeleton, Goblin, Orc, Ice Elemental', tier: 2 },
    { name: 'Iron Peaks', lvl: '8-11', boss: null, unlock: 'Lv7', enemies: 'Orc, Skeleton, Dark Mage, Fire Elemental', tier: 3 },
    { name: 'Blood Canyon', lvl: '9-12', boss: 'Canyon Warlord', unlock: 'Lv8', enemies: 'Orc, Dark Knight, Desert Snake/Scorpio', tier: 3 },
    { name: 'Frozen Tundra', lvl: '10-13', boss: 'Frost Wyrm', unlock: 'Lv9', enemies: 'Orc, Skeleton, Ice Elemental', tier: 3 },
    { name: 'Ashen Battlefield', lvl: '10-13', boss: null, unlock: 'Lv9', enemies: 'Orc, Skeleton, Desert Hyena/Vulture', tier: 3 },
    { name: 'Dragon Peaks', lvl: '11-14', boss: 'Water Elemental', unlock: 'Lv10', enemies: 'Dragon Whelp, Orc, Fire Elemental', tier: 3 },
    { name: 'Windswept Ridge', lvl: '11-14', boss: null, unlock: 'Lv10', enemies: 'Orc, Dragon Whelp, Dark Mage', tier: 3 },
    { name: 'Molten Core', lvl: '12-14', boss: null, unlock: 'Lv11', enemies: 'Dragon Whelp, Orc, Fire Elemental', tier: 3 },
    { name: 'Shadow Forest', lvl: '12-15', boss: 'Grove Keeper', unlock: 'Lv11', enemies: 'Dark Mage, Orc, Crow Knight', tier: 4 },
    { name: 'Obsidian Wastes', lvl: '13-15', boss: null, unlock: 'Lv12', enemies: 'Orc, Dark Mage, Desert Mummy', tier: 4 },
    { name: 'Ruins of Ashenmoor', lvl: '13-16', boss: null, unlock: 'Lv12', enemies: 'Skeleton, Dark Mage, Stone Guardian', tier: 4 },
    { name: 'Blight Hollow', lvl: '14-16', boss: null, unlock: 'Lv13', enemies: 'Dark Mage, Skeleton, Mushroom', tier: 4 },
    { name: 'Shadow Citadel', lvl: '14-17', boss: 'Lich Lord', unlock: 'Lv13', enemies: 'Dark Mage, Dragon Whelp, Orc', tier: 4 },
    { name: 'Stormspire Peak', lvl: '14-17', boss: null, unlock: 'Lv13', enemies: 'Dark Mage, Dragon Whelp, Crow Knight', tier: 4 },
    { name: 'Demon Gate', lvl: '15-18', boss: 'Fire Worm', unlock: 'Lv14', enemies: 'Dark Mage, Dragon Whelp, Imp', tier: 5 },
    { name: 'Abyssal Depths', lvl: '16-18', boss: null, unlock: 'Lv15', enemies: 'Dark Mage, Orc, Dragon Whelp', tier: 5 },
    { name: 'Infernal Forge', lvl: '16-18', boss: null, unlock: 'Lv15', enemies: 'Orc, Dark Mage, Fire Elemental', tier: 5 },
    { name: 'Dreadmaw Canyon', lvl: '17-19', boss: null, unlock: 'Lv16', enemies: 'Dark Mage, Orc, Dragon Whelp', tier: 5 },
    { name: 'Void Threshold', lvl: '17-19', boss: 'Void Sentinel', unlock: 'Lv16', enemies: 'Dark Mage, Dragon Whelp, Orc', tier: 5 },
    { name: 'Corrupted Spire', lvl: '18-20', boss: null, unlock: 'Lv17', enemies: 'Dark Mage, Dragon Whelp, Orc', tier: 5 },
    { name: 'Void Throne', lvl: '18-20', boss: 'VOID KING', unlock: 'Lv18', enemies: 'Dark Mage, Dragon Whelp, Orc', tier: 6 },
    { name: 'Hall of Odin', lvl: '20', boss: 'ODIN', unlock: 'Lv20+VK', enemies: 'Dark Mage, Orc', tier: 7 },
    { name: 'Maw of Madra', lvl: '20', boss: 'MADRA', unlock: 'Lv20+VK', enemies: 'Dark Mage, Skeleton', tier: 7 },
    { name: 'Sanctum of Omni', lvl: '20', boss: 'THE OMNI', unlock: 'Lv20+VK', enemies: 'Dark Mage, Dragon Whelp', tier: 7 },
  ];

  const BOSSES = [
    { name: 'Grand Shaman', zone: 'Sunken Temple', hp: 500, lvl: '7-9', type: 'Nature', abilities: 'Nature Bolt, Healing Rain (18%), Thorn Burst (AoE+DoT), Bark Shield (+30 def), Entangle (stun)' },
    { name: 'Canyon Warlord', zone: 'Blood Canyon', hp: 650, lvl: '9-12', type: 'Physical', abilities: 'Cleave, War Cry (1.6x dmg), Skull Crusher (2.8x), Iron Skin (+35 def), Bloodlust (30% drain)' },
    { name: 'Frost Wyrm', zone: 'Frozen Tundra', hp: 750, lvl: '10-13', type: 'Ice', abilities: 'Ice Fang, Blizzard Breath (2.5x+DoT), Ice Armor (+40 def), Glacial Slam (3x), Freeze (stun), Self-heal (12%)' },
    { name: 'Water Elemental', zone: 'Dragon Peaks', hp: 550, lvl: '11-14', type: 'Water', abilities: 'Tidal Strike, Torrent (2.5x+DoT), Frost Armor (+45 def), Tsunami (3.5x AoE), Healing Tide (18%), Frozen Prison (stun)' },
    { name: 'Corrupted Grove Keeper', zone: 'Shadow Forest', hp: 600, lvl: '12-15', type: 'Nature', abilities: 'Corrupted Bolt, Verdant Stun, Grove Fireball (2.4x), Resurrect Guardian, Dark Bloom (-15 def). +2 Guardian adds!' },
    { name: 'Lich Lord', zone: 'Shadow Citadel', hp: 700, lvl: '14-17', type: 'Necro', abilities: 'Soul Bolt, Death Coil (2.5x+drain), Bone Shield (+40 def), Soul Drain (heal 15%), Raise Dead (1.6x buff), Shadow Nova (3x)' },
    { name: 'Infernal Fire Worm', zone: 'Demon Gate', hp: 900, lvl: '15-18', type: 'Fire', abilities: 'Lava Spit, Savage Bite (3x), Heat Wave (2.2x+DoT), Volcanic Slam (3.5x). 2.5x scale' },
    { name: 'Void Sentinel', zone: 'Void Threshold', hp: 1000, lvl: '17-19', type: 'Void', abilities: 'Void Strike, Reality Rift (3x), Void Shield (+50 def), Entropy Pulse (AoE+DoT), Dim. Lock (2t stun), Null Burst (3.5x)' },
    { name: 'The Void King', zone: 'Void Throne', hp: 1200, lvl: '18-20', type: 'Void', abilities: 'Void Slash, Annihilate (3.5x), Void Barrier (+60 def), Reality Tear (4.5x), Time Stop (2t stun), Void Enrage (2x buff)' },
    { name: 'Malachar the Undying', zone: 'Lava Dungeon', hp: 1400, lvl: 'Dungeon', type: 'Arcane', abilities: 'Arcane Bolt, Chaos Storm (3.2x), Soul Siphon (60% drain), Hellfire Rain (4x AoE), Petrify (2t stun), Dark Empower (2x)' },
  ];

  const GODS = [
    { name: 'Odin, The Allfather', zone: 'Hall of Odin', hp: 1800, faction: 'Crusade', unlock: 'Lv20 + Void King + Grand Shaman + Frost Wyrm', abilities: 'Gungnir (2.2x), Thunderclap (3.8x), Divine Shield (+80 def), Wisdom (2.2x buff), Valkyrie Storm (4.5x), Ragnarok (5x), Divine Heal (15%), Temporal Halt (2t stun)', speed: 18 },
    { name: 'Madra, The Devourer', zone: 'Maw of Madra', hp: 2000, faction: 'Legion', unlock: 'Lv20 + Void King + Shadow Beast + Lich', abilities: 'Blood Rend (2x), Soul Devour (3.5x+drain), Corruption Aura (DoT 18%), Blood Frenzy (2.5x buff), Death Grip (stun), Apocalypse (5.5x), Vampiric Feast (18%), Plague Wave (2.8x)', speed: 17 },
    { name: 'The Omni, Weaver of Fate', zone: 'Sanctum of Omni', hp: 1600, faction: 'Fabled', unlock: 'Lv20 + Void King + Canyon Warlord + Water Elemental', abilities: 'Arcane Blast (2x), Fate Weave (3.2x), Cosmic Barrier (+70 def), Time Warp (stun), Stellar Rain (4.8x), Genesis (5.5x), Cosmic Heal (14%), Mind Shatter (DoT 20%)', speed: 20 },
  ];

  const DUNGEONS = [
    { theme: 'Default', nodes: '5', list: '1. Entrance Guard (2 mobs) → 2. Dungeon Patrol (3 mobs) → 3. Elite Sentry (2 elite) → 4. Inner Chamber (3 mobs) → 5. Dungeon Lord (boss)' },
    { theme: 'Void Rift', nodes: '6', list: '1. Void Sentinels (3) → 2. Reality Warden (2 elite) → 3. Chaos Swarm (4) → 4. Void Colossus (2 elite) → 5. Abyssal Court (3) → 6. Void Archon (boss)' },
    { theme: 'Infernal Depths', nodes: '6', list: '1. Flame Wardens (3) → 2. Molten Patrol (3) → 3. Infernal Knight (2 elite) → 4. Magma Chamber (4) → 5. Fire Titan (2 elite) → 6. Malachar the Undying (boss)' },
  ];

  const tierColors = { 1: '#4ade80', 2: '#22d3ee', 3: '#f59e0b', 4: '#a78bfa', 5: '#ef4444', 6: '#fbbf24', 7: '#ff6b6b' };

  return (
    <div style={{
      position: 'fixed', bottom: 48, right: 8,
      width: 520, maxHeight: '70vh',
      background: 'rgba(10,15,30,0.97)', border: '1px solid rgba(59,130,246,0.3)',
      borderRadius: 10, zIndex: ADMIN_GIZMO_BUTTON + 1,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid rgba(59,130,246,0.15)' }}>
        <span style={{ color: '#60a5fa', fontSize: '0.8rem', fontWeight: 700, fontFamily: "'Cinzel', serif" }}>Game Reference</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem' }}>X</button>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(59,130,246,0.1)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, padding: '5px 0', fontSize: '0.6rem', fontWeight: 600,
            background: tab === t.id ? 'rgba(59,130,246,0.15)' : 'transparent',
            border: 'none', borderBottom: tab === t.id ? '2px solid #3b82f6' : '2px solid transparent',
            color: tab === t.id ? '#60a5fa' : '#64748b', cursor: 'pointer',
          }}>{t.label}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 8, fontSize: '0.55rem' }}>
        {tab === 'zones' && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: '#64748b', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <th style={{ padding: '3px 4px' }}>#</th>
                <th style={{ padding: '3px 4px' }}>Zone</th>
                <th style={{ padding: '3px 4px' }}>Lvl</th>
                <th style={{ padding: '3px 4px' }}>Boss</th>
                <th style={{ padding: '3px 4px' }}>Unlock</th>
                <th style={{ padding: '3px 4px' }}>Enemies</th>
              </tr>
            </thead>
            <tbody>
              {ZONES.map((z, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#cbd5e1' }}>
                  <td style={{ padding: '2px 4px', color: '#64748b' }}>{i + 1}</td>
                  <td style={{ padding: '2px 4px', color: tierColors[z.tier] || '#cbd5e1', fontWeight: 600 }}>{z.name}</td>
                  <td style={{ padding: '2px 4px' }}>{z.lvl}</td>
                  <td style={{ padding: '2px 4px', color: z.boss ? '#ef4444' : '#334155', fontWeight: z.boss ? 700 : 400 }}>{z.boss || '-'}</td>
                  <td style={{ padding: '2px 4px', color: '#94a3b8' }}>{z.unlock}</td>
                  <td style={{ padding: '2px 4px', color: '#64748b', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.enemies}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'bosses' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {BOSSES.map((b, i) => (
              <div key={i} style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, padding: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.65rem' }}>{b.name}</span>
                  <span style={{ color: '#64748b' }}>{b.zone}</span>
                </div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 3, color: '#94a3b8' }}>
                  <span>HP: <span style={{ color: '#22c55e', fontWeight: 600 }}>{b.hp}</span></span>
                  <span>Lvl: {b.lvl}</span>
                  <span>Type: <span style={{ color: '#60a5fa' }}>{b.type}</span></span>
                </div>
                <div style={{ color: '#cbd5e1', lineHeight: 1.4 }}>{b.abilities}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'dungeons' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DUNGEONS.map((d, i) => (
              <div key={i} style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 6, padding: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ color: '#f97316', fontWeight: 700, fontSize: '0.65rem' }}>{d.theme}</span>
                  <span style={{ color: '#64748b' }}>{d.nodes} nodes</span>
                </div>
                <div style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{d.list}</div>
              </div>
            ))}
            <div style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)', borderRadius: 6, padding: 8, marginTop: 4 }}>
              <div style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.6rem', marginBottom: 4 }}>DUNGEON RULES</div>
              <div style={{ color: '#94a3b8', lineHeight: 1.5 }}>
                HP/MP/Stamina carry between fights. Defeat = kicked out (progress resets). Retreat portal currently available. No healing/trading between nodes.
              </div>
            </div>
          </div>
        )}

        {tab === 'gods' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {GODS.map((g, i) => (
              <div key={i} style={{ background: 'rgba(167,139,250,0.05)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 6, padding: 10 }}>
                <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: '0.7rem', marginBottom: 3 }}>{g.name}</div>
                <div style={{ display: 'flex', gap: 10, marginBottom: 4, color: '#94a3b8', fontSize: '0.55rem' }}>
                  <span>HP: <span style={{ color: '#ef4444', fontWeight: 700 }}>{g.hp}</span></span>
                  <span>Speed: {g.speed}</span>
                  <span>Faction: <span style={{ color: '#fbbf24' }}>{g.faction}</span></span>
                </div>
                <div style={{ color: '#64748b', fontSize: '0.5rem', marginBottom: 4 }}>Unlock: {g.unlock}</div>
                <div style={{ color: '#cbd5e1', lineHeight: 1.5 }}>{g.abilities}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'flow' && (
          <div style={{ color: '#cbd5e1', lineHeight: 1.8 }}>
            <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.65rem', marginBottom: 6 }}>GAME PROGRESSION</div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ color: '#4ade80' }}>Title</span> → <span style={{ color: '#22d3ee' }}>Intro</span> → <span style={{ color: '#f59e0b' }}>Lobby</span> → <span style={{ color: '#a78bfa' }}>Create Hero</span> → <span style={{ color: '#ef4444' }}>World Map</span> → <span style={{ color: '#fbbf24' }}>Battle/Boss</span> → <span style={{ color: '#ff6b6b' }}>Gods</span>
            </div>
            <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.65rem', marginBottom: 4 }}>SCENE TYPES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 8 }}>
              <div><span style={{ color: '#22c55e' }}>Camp</span> — Rest, heal, manage party</div>
              <div><span style={{ color: '#f59e0b' }}>Dungeon</span> — Multi-node gauntlet, no escape</div>
              <div><span style={{ color: '#3b82f6' }}>Trading Post</span> — Buy/sell equipment & resources</div>
              <div><span style={{ color: '#6ee7b7' }}>Open Field</span> — Free roam with WASD, interact with E</div>
              <div><span style={{ color: '#a78bfa' }}>Portal</span> — Fast travel between portal zones</div>
            </div>
            <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.65rem', marginBottom: 4 }}>PORTALS</div>
            <div style={{ marginBottom: 8 }}>Shadow Citadel, Demon Gate, Void Throne</div>
            <div style={{ color: '#60a5fa', fontWeight: 700, fontSize: '0.65rem', marginBottom: 4 }}>MAP REGIONS (5)</div>
            <div>Verdant Wilds, Shadow Realm, Volcanic Wastes, Frozen Peaks, Ashenmoor</div>
          </div>
        )}
      </div>
    </div>
  );
}

function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
  if (rgb.startsWith('#')) return rgb;
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return '#000000';
  return '#' + match.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

export default AdminGizmo;
