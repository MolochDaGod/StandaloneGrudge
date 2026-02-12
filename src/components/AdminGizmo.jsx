import React, { useState, useEffect, useCallback, useRef } from 'react';
import FrameEditor, { applyFrameSettings } from './FrameEditor';
import { ADMIN_GIZMO, ADMIN_GIZMO_PANEL, ADMIN_GIZMO_BUTTON } from '../constants/layers';

const GIZMO_Z = ADMIN_GIZMO;

function AdminGizmo() {
  const [enabled, setEnabled] = useState(false);
  const [showFrameEditor, setShowFrameEditor] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selRect, setSelRect] = useState(null);
  const [props, setProps] = useState({});
  const [panelPos, setPanelPos] = useState({ x: 20, y: 60 });
  const [draggingPanel, setDraggingPanel] = useState(false);
  const [draggingElement, setDraggingElement] = useState(false);
  const [resizingElement, setResizingElement] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const overlayRef = useRef(null);

  const updateSelRect = useCallback((el) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    setSelRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, []);

  const readProps = useCallback((el) => {
    const cs = window.getComputedStyle(el);
    const isImg = el.tagName === 'IMG';
    const isText = !isImg && el.childNodes.length > 0 &&
      Array.from(el.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim());
    const hasBg = cs.backgroundImage && cs.backgroundImage !== 'none';

    return {
      tagName: el.tagName,
      isImg,
      isText,
      hasBg,
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

  const applyStyle = (prop, value) => {
    if (!selected) return;
    selected.style[prop] = value;
    updateSelRect(selected);
    setProps(readProps(selected));
  };

  const applyText = (value) => {
    if (!selected) return;
    const textNode = Array.from(selected.childNodes).find(
      n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()
    );
    if (textNode) {
      textNode.textContent = value;
    } else {
      selected.textContent = value;
    }
    setProps(p => ({ ...p, text: value }));
  };

  const applySrc = (value) => {
    if (!selected) return;
    selected.src = value;
    setProps(p => ({ ...p, src: value }));
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
    const onUp = () => setDraggingElement(false);
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
      selected.style.width = Math.max(20, newW) + 'px';
      selected.style.height = Math.max(20, newH) + 'px';
      updateSelRect(selected);
      setProps(readProps(selected));
    };
    const onUp = () => setResizingElement(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizingElement, selected]);

  useEffect(() => {
    applyFrameSettings();
  }, []);

  const labelStyle = {
    fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 2, marginTop: 6,
  };

  const inputStyle = {
    background: '#1e293b', border: '1px solid #334155', borderRadius: 4,
    color: '#e2e8f0', padding: '4px 6px', fontSize: '0.75rem', width: '100%',
    outline: 'none', boxSizing: 'border-box',
  };

  const rowStyle = {
    display: 'flex', gap: 6, alignItems: 'center',
  };

  const smallInputStyle = { ...inputStyle, width: 60, textAlign: 'center' };

  return (
    <div id="admin-gizmo-root">
      <div style={{
        position: 'fixed', top: 56, left: 56, zIndex: GIZMO_Z + 10,
        display: 'flex', flexDirection: 'row', gap: 8, alignItems: 'center',
      }}>
        <button
          onClick={() => setShowFrameEditor(f => !f)}
          style={{
            width: 38, height: 38, borderRadius: '50%',
            background: showFrameEditor
              ? 'linear-gradient(135deg, #7c3aed, #6d28d9)'
              : 'linear-gradient(135deg, #334155, #1e293b)',
            border: `2px solid ${showFrameEditor ? '#a78bfa' : '#475569'}`,
            color: showFrameEditor ? '#fff' : '#94a3b8',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', fontWeight: 700,
            boxShadow: showFrameEditor ? '0 0 16px rgba(124,58,237,0.5)' : '0 2px 6px rgba(0,0,0,0.3)',
            transition: 'all 0.3s',
          }}
          title={showFrameEditor ? 'Close Frame Editor' : 'Frame Editor'}
        >
          F
        </button>
        <button
          onClick={() => setEnabled(e => !e)}
          style={{
            width: 44, height: 44, borderRadius: '50%',
            background: enabled
              ? 'linear-gradient(135deg, #f59e0b, #d97706)'
              : 'linear-gradient(135deg, #334155, #1e293b)',
            border: `2px solid ${enabled ? '#fbbf24' : '#475569'}`,
            color: enabled ? '#000' : '#94a3b8',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: 700,
            boxShadow: enabled ? '0 0 20px rgba(245,158,11,0.5)' : '0 2px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.3s',
          }}
          title={enabled ? 'Disable Admin Gizmo' : 'Enable Admin Gizmo'}
        >
          {enabled ? '⚙' : '⚙'}
        </button>
      </div>

      {showFrameEditor && <FrameEditor onClose={() => setShowFrameEditor(false)} />}

      {enabled && selRect && (
        <div style={{
          position: 'fixed',
          top: selRect.top - 2,
          left: selRect.left - 2,
          width: selRect.width + 4,
          height: selRect.height + 4,
          border: '2px solid #f59e0b',
          borderRadius: 2,
          pointerEvents: 'none',
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
            {props.tagName} · {selRect.width.toFixed(0)}×{selRect.height.toFixed(0)}
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
          ref={overlayRef}
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
              GIZMO EDITOR
            </span>
            <button
              onClick={() => { setSelected(null); setSelRect(null); setProps({}); }}
              style={{
                background: 'none', border: 'none', color: '#64748b',
                cursor: 'pointer', fontSize: '0.9rem', padding: '0 4px',
              }}
            >✕</button>
          </div>

          <div style={{ fontSize: '0.65rem', color: '#64748b', marginBottom: 8 }}>
            {props.tagName} · {props.display} · {props.position}
          </div>

          {props.isText && (
            <>
              <div style={labelStyle}>Text Content</div>
              <textarea
                value={props.text}
                onChange={e => applyText(e.target.value)}
                onMouseDown={e => e.stopPropagation()}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 40, fontFamily: 'inherit' }}
              />
            </>
          )}

          {props.isImg && (
            <>
              <div style={labelStyle}>Image Source</div>
              <input
                value={props.src}
                onChange={e => applySrc(e.target.value)}
                onMouseDown={e => e.stopPropagation()}
                style={inputStyle}
              />
            </>
          )}

          <div style={labelStyle}>Size</div>
          <div style={rowStyle}>
            <span style={{ color: '#64748b', fontSize: '0.65rem', width: 14 }}>W</span>
            <input
              type="number"
              value={props.width || 0}
              onChange={e => applyStyle('width', e.target.value + 'px')}
              onMouseDown={e => e.stopPropagation()}
              style={smallInputStyle}
            />
            <span style={{ color: '#64748b', fontSize: '0.65rem', width: 14 }}>H</span>
            <input
              type="number"
              value={props.height || 0}
              onChange={e => applyStyle('height', e.target.value + 'px')}
              onMouseDown={e => e.stopPropagation()}
              style={smallInputStyle}
            />
          </div>

          {props.isText && (
            <>
              <div style={labelStyle}>Font Size</div>
              <div style={rowStyle}>
                <input
                  type="range"
                  min={6}
                  max={72}
                  value={props.fontSize || 16}
                  onChange={e => applyStyle('fontSize', e.target.value + 'px')}
                  onMouseDown={e => e.stopPropagation()}
                  style={{ flex: 1, accentColor: '#f59e0b' }}
                />
                <span style={{ color: '#e2e8f0', fontSize: '0.7rem', width: 32, textAlign: 'right' }}>
                  {props.fontSize}px
                </span>
              </div>
            </>
          )}

          <div style={labelStyle}>Colors</div>
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.55rem', color: '#64748b', marginBottom: 2 }}>Text</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="color"
                  value={rgbToHex(props.color)}
                  onChange={e => applyStyle('color', e.target.value)}
                  onMouseDown={e => e.stopPropagation()}
                  style={{ width: 28, height: 22, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                />
                <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{rgbToHex(props.color)}</span>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.55rem', color: '#64748b', marginBottom: 2 }}>Background</div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input
                  type="color"
                  value={rgbToHex(props.backgroundColor)}
                  onChange={e => applyStyle('backgroundColor', e.target.value)}
                  onMouseDown={e => e.stopPropagation()}
                  style={{ width: 28, height: 22, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                />
              </div>
            </div>
          </div>

          <div style={labelStyle}>Opacity</div>
          <div style={rowStyle}>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round((props.opacity || 1) * 100)}
              onChange={e => applyStyle('opacity', (parseInt(e.target.value) / 100).toString())}
              onMouseDown={e => e.stopPropagation()}
              style={{ flex: 1, accentColor: '#f59e0b' }}
            />
            <span style={{ color: '#e2e8f0', fontSize: '0.7rem', width: 32, textAlign: 'right' }}>
              {Math.round((props.opacity || 1) * 100)}%
            </span>
          </div>

          <div style={labelStyle}>Border Radius</div>
          <div style={rowStyle}>
            <input
              type="range"
              min={0}
              max={50}
              value={props.borderRadius || 0}
              onChange={e => applyStyle('borderRadius', e.target.value + 'px')}
              onMouseDown={e => e.stopPropagation()}
              style={{ flex: 1, accentColor: '#f59e0b' }}
            />
            <span style={{ color: '#e2e8f0', fontSize: '0.7rem', width: 32, textAlign: 'right' }}>
              {props.borderRadius}px
            </span>
          </div>

          <div style={labelStyle}>Spacing</div>
          <div style={rowStyle}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.55rem', color: '#64748b', marginBottom: 2 }}>Padding</div>
              <input
                value={props.padding || '0px'}
                onChange={e => applyStyle('padding', e.target.value)}
                onMouseDown={e => e.stopPropagation()}
                style={{ ...inputStyle, fontSize: '0.65rem' }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.55rem', color: '#64748b', marginBottom: 2 }}>Margin</div>
              <input
                value={props.margin || '0px'}
                onChange={e => applyStyle('margin', e.target.value)}
                onMouseDown={e => e.stopPropagation()}
                style={{ ...inputStyle, fontSize: '0.65rem' }}
              />
            </div>
          </div>

          {props.hasBg && (
            <>
              <div style={labelStyle}>Background Image</div>
              <input
                value={props.bgImage}
                onChange={e => applyStyle('backgroundImage', e.target.value)}
                onMouseDown={e => e.stopPropagation()}
                style={{ ...inputStyle, fontSize: '0.6rem' }}
              />
            </>
          )}

          <div style={{ marginTop: 10, borderTop: '1px solid #334155', paddingTop: 8 }}>
            <div style={{ fontSize: '0.55rem', color: '#475569', textAlign: 'center' }}>
              Click to select · Center handle to move · Corner handles to resize
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
