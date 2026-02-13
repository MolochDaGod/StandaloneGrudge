import React, { useState, useEffect, useCallback, useRef } from 'react';
import { applyFrameSettings } from './FrameEditor';
import { ADMIN_GIZMO, ADMIN_GIZMO_PANEL, ADMIN_GIZMO_BUTTON } from '../constants/layers';

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

  return (
    <div id="admin-gizmo-root">
      <button
        onClick={() => setEnabled(e => !e)}
        style={{
          position: 'fixed', bottom: 8, right: 8,
          width: 32, height: 32, borderRadius: '50%',
          background: enabled ? '#f59e0b' : 'rgba(30,30,50,0.7)',
          border: `2px solid ${enabled ? '#fbbf24' : 'rgba(255,255,255,0.15)'}`,
          color: enabled ? '#000' : '#666',
          fontSize: '0.85rem', fontWeight: 900,
          cursor: 'pointer', zIndex: ADMIN_GIZMO_BUTTON,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: enabled ? '0 0 12px rgba(245,158,11,0.5)' : 'none',
          transition: 'all 0.2s',
        }}
        title={enabled ? 'Disable Admin Gizmo' : 'Enable Admin Gizmo'}
      >
        ⚙
      </button>

      {enabled && log && (
        <div style={{
          position: 'fixed', bottom: 44, right: 8,
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

function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#000000';
  if (rgb.startsWith('#')) return rgb;
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return '#000000';
  return '#' + match.slice(0, 3).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
}

export default AdminGizmo;
