import React, { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'grudge_frame_settings';

const DEFAULT_SETTINGS = {
  cropTop: 0,
  cropBottom: 0,
  cropLeft: 0,
  cropRight: 0,
  maskRegions: [],
  opacity: 100,
  visible: true,
};

export function loadFrameSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULT_SETTINGS };
}

function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

export function applyFrameSettings() {
  const settings = loadFrameSettings();
  const frame = document.querySelector('.game-frame');
  if (!frame) return;

  frame.style.setProperty('--frame-crop-top', `${settings.cropTop}%`);
  frame.style.setProperty('--frame-crop-right', `${settings.cropRight}%`);
  frame.style.setProperty('--frame-crop-bottom', `${settings.cropBottom}%`);
  frame.style.setProperty('--frame-crop-left', `${settings.cropLeft}%`);
  frame.style.setProperty('--frame-opacity', `${settings.opacity / 100}`);

  if (!settings.visible) {
    frame.style.setProperty('--frame-display', 'none');
  } else {
    frame.style.setProperty('--frame-display', 'block');
  }
}

export function useFrameSettings() {
  const [settings, setSettings] = useState(loadFrameSettings);

  const update = useCallback((key, value) => {
    setSettings(prev => {
      const next = { ...prev, [key]: value };
      saveSettings(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const def = { ...DEFAULT_SETTINGS };
    setSettings(def);
    saveSettings(def);
  }, []);

  const addMaskRegion = useCallback(() => {
    setSettings(prev => {
      const next = {
        ...prev,
        maskRegions: [...prev.maskRegions, {
          id: Date.now(),
          x: 10, y: 10, w: 10, h: 10,
          label: `Region ${prev.maskRegions.length + 1}`,
        }],
      };
      saveSettings(next);
      return next;
    });
  }, []);

  const updateMaskRegion = useCallback((id, updates) => {
    setSettings(prev => {
      const next = {
        ...prev,
        maskRegions: prev.maskRegions.map(r => r.id === id ? { ...r, ...updates } : r),
      };
      saveSettings(next);
      return next;
    });
  }, []);

  const removeMaskRegion = useCallback((id) => {
    setSettings(prev => {
      const next = {
        ...prev,
        maskRegions: prev.maskRegions.filter(r => r.id !== id),
      };
      saveSettings(next);
      return next;
    });
  }, []);

  useEffect(() => {
    applyFrameSettings();
  }, [settings]);

  return { settings, update, reset, addMaskRegion, updateMaskRegion, removeMaskRegion };
}

export function FrameMaskLayer() {
  const [masks, setMasks] = useState([]);

  useEffect(() => {
    const load = () => {
      const s = loadFrameSettings();
      setMasks(s.maskRegions || []);
    };
    load();
    const interval = setInterval(load, 500);
    return () => clearInterval(interval);
  }, []);

  if (masks.length === 0) return null;

  return (
    <>
      {masks.map(region => (
        <div key={region.id} style={{
          position: 'absolute',
          left: `${region.x}%`, top: `${region.y}%`,
          width: `${region.w}%`, height: `${region.h}%`,
          background: '#050810',
          zIndex: 10501,
          pointerEvents: 'none',
        }} />
      ))}
    </>
  );
}

const Z = 99995;

export default function FrameEditor({ onClose }) {
  const { settings, update, reset, addMaskRegion, updateMaskRegion, removeMaskRegion } = useFrameSettings();
  const [showOverlay, setShowOverlay] = useState(false);
  const [editingMasks, setEditingMasks] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 60, y: 60 });
  const dragRef = React.useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;
    setDragging(true);
    dragRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };

  useEffect(() => {
    if (!dragging) return;
    const move = (e) => setPos({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y });
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up); };
  }, [dragging]);

  const labelStyle = {
    fontSize: '0.58rem', color: '#94a3b8', textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: 2, marginTop: 8,
  };

  const sliderRow = {
    display: 'flex', gap: 6, alignItems: 'center',
  };

  const inputStyle = {
    background: '#1e293b', border: '1px solid #334155', borderRadius: 4,
    color: '#e2e8f0', padding: '3px 6px', fontSize: '0.7rem', width: 48,
    textAlign: 'center', outline: 'none',
  };

  const btnStyle = {
    background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
    borderRadius: 6, padding: '4px 10px', color: '#fbbf24', fontSize: '0.65rem',
    fontWeight: 700, cursor: 'pointer', fontFamily: "'Cinzel', serif",
  };

  const dangerBtnStyle = {
    ...btnStyle,
    background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
    color: '#ef4444',
  };

  const gameFrame = document.querySelector('.game-frame');
  const frameRect = gameFrame?.getBoundingClientRect();

  return (
    <>
      {showOverlay && frameRect && (
        <div style={{
          position: 'fixed',
          top: frameRect.top, left: frameRect.left,
          width: frameRect.width, height: frameRect.height,
          pointerEvents: 'none', zIndex: Z - 1,
        }}>
          <div style={{
            position: 'absolute', top: '5%', left: '2%', right: '2%', bottom: '26%',
            border: '2px dashed rgba(110,231,183,0.4)',
            background: 'rgba(110,231,183,0.03)',
          }}>
            <div style={{ position: 'absolute', top: 2, left: 4, fontSize: '0.5rem', color: 'rgba(110,231,183,0.6)', fontFamily: "'Cinzel', serif" }}>
              CONTENT AREA
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: 0, left: 0, width: '28%', height: '26%',
            border: '2px dashed rgba(251,191,36,0.4)',
            background: 'rgba(251,191,36,0.03)',
          }}>
            <div style={{ position: 'absolute', top: 2, left: 4, fontSize: '0.5rem', color: 'rgba(251,191,36,0.6)', fontFamily: "'Cinzel', serif" }}>
              LEFT PANEL (Chat)
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: 0, left: '28%', right: '20%', height: '26%',
            border: '2px dashed rgba(168,85,247,0.4)',
            background: 'rgba(168,85,247,0.03)',
          }}>
            <div style={{ position: 'absolute', top: 2, left: 4, fontSize: '0.5rem', color: 'rgba(168,85,247,0.6)', fontFamily: "'Cinzel', serif" }}>
              CENTER SLOTS (Buttons)
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: 0, right: 0, width: '20%', height: '26%',
            border: '2px dashed rgba(239,68,68,0.4)',
            background: 'rgba(239,68,68,0.03)',
          }}>
            <div style={{ position: 'absolute', top: 2, left: 4, fontSize: '0.5rem', color: 'rgba(239,68,68,0.6)', fontFamily: "'Cinzel', serif" }}>
              RIGHT PANEL (Party)
            </div>
          </div>

          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: '5%',
            border: '2px dashed rgba(110,231,183,0.3)',
            background: 'rgba(110,231,183,0.02)',
          }}>
            <div style={{ position: 'absolute', top: 2, left: 4, fontSize: '0.45rem', color: 'rgba(110,231,183,0.5)', fontFamily: "'Cinzel', serif" }}>
              TOP BAR
            </div>
          </div>
        </div>
      )}

      {editingMasks && frameRect && settings.maskRegions.map(region => (
        <div key={region.id} style={{
          position: 'fixed',
          left: frameRect.left + (region.x / 100) * frameRect.width,
          top: frameRect.top + (region.y / 100) * frameRect.height,
          width: (region.w / 100) * frameRect.width,
          height: (region.h / 100) * frameRect.height,
          border: '1px dashed rgba(239,68,68,0.5)',
          zIndex: 10502,
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: -14, left: 0,
            fontSize: '0.45rem', color: '#ef4444', background: 'rgba(0,0,0,0.7)',
            padding: '1px 4px', borderRadius: 2, whiteSpace: 'nowrap',
          }}>
            Mask {settings.maskRegions.indexOf(region) + 1}
          </div>
        </div>
      ))}

      <div
        onMouseDown={handleMouseDown}
        style={{
          position: 'fixed', top: pos.y, left: pos.x,
          width: 300, maxHeight: '80vh', overflowY: 'auto',
          background: 'linear-gradient(135deg, #0f172a, #1e293b)',
          border: '1px solid rgba(245,158,11,0.4)', borderRadius: 12,
          padding: 14, zIndex: Z,
          boxShadow: '0 12px 40px rgba(0,0,0,0.7), 0 0 20px rgba(245,158,11,0.1)',
          cursor: dragging ? 'grabbing' : 'default',
          userSelect: 'none',
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 8, borderBottom: '1px solid #334155', paddingBottom: 6,
          cursor: 'grab',
        }}>
          <span style={{ color: '#f59e0b', fontSize: '0.75rem', fontWeight: 700, letterSpacing: 1, fontFamily: "'Cinzel', serif" }}>
            FRAME EDITOR
          </span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: '#64748b',
            cursor: 'pointer', fontSize: '1rem', padding: '0 4px',
          }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
          <button onClick={() => update('visible', !settings.visible)} style={{
            ...btnStyle,
            background: settings.visible ? 'rgba(110,231,183,0.15)' : 'rgba(239,68,68,0.15)',
            borderColor: settings.visible ? 'rgba(110,231,183,0.3)' : 'rgba(239,68,68,0.3)',
            color: settings.visible ? '#6ee7b7' : '#ef4444',
          }}>
            {settings.visible ? 'Frame ON' : 'Frame OFF'}
          </button>
          <button onClick={() => setShowOverlay(!showOverlay)} style={{
            ...btnStyle,
            background: showOverlay ? 'rgba(168,85,247,0.15)' : btnStyle.background,
            borderColor: showOverlay ? 'rgba(168,85,247,0.3)' : btnStyle.borderColor,
            color: showOverlay ? '#c084fc' : btnStyle.color,
          }}>
            {showOverlay ? 'Hide Slots' : 'Show Slots'}
          </button>
          <button onClick={reset} style={dangerBtnStyle}>Reset</button>
        </div>

        <div style={labelStyle}>Frame Opacity</div>
        <div style={sliderRow}>
          <input type="range" min={0} max={100} value={settings.opacity}
            onChange={e => update('opacity', parseInt(e.target.value))}
            onMouseDown={e => e.stopPropagation()}
            style={{ flex: 1, accentColor: '#f59e0b' }}
          />
          <input type="number" value={settings.opacity}
            onChange={e => update('opacity', Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
            onMouseDown={e => e.stopPropagation()}
            style={inputStyle}
          />
        </div>

        <div style={labelStyle}>Crop Edges (% inset)</div>
        {[
          { key: 'cropTop', label: 'Top' },
          { key: 'cropBottom', label: 'Bottom' },
          { key: 'cropLeft', label: 'Left' },
          { key: 'cropRight', label: 'Right' },
        ].map(({ key, label }) => (
          <div key={key} style={{ ...sliderRow, marginBottom: 2 }}>
            <span style={{ width: 44, fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>{label}</span>
            <input type="range" min={0} max={50} step={0.5}
              value={settings[key]}
              onChange={e => update(key, parseFloat(e.target.value))}
              onMouseDown={e => e.stopPropagation()}
              style={{ flex: 1, accentColor: '#f59e0b' }}
            />
            <input type="number" value={settings[key]} step={0.5}
              onChange={e => update(key, Math.max(0, Math.min(50, parseFloat(e.target.value) || 0)))}
              onMouseDown={e => e.stopPropagation()}
              style={inputStyle}
            />
          </div>
        ))}

        <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Mask Regions</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button onClick={() => setEditingMasks(!editingMasks)} style={{
              ...btnStyle, fontSize: '0.55rem', padding: '2px 6px',
              color: editingMasks ? '#6ee7b7' : '#64748b',
            }}>
              {editingMasks ? 'Outlines ON' : 'Outlines OFF'}
            </button>
            <button onClick={addMaskRegion} style={{ ...btnStyle, fontSize: '0.55rem', padding: '2px 6px' }}>
              + Add
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.5rem', color: '#64748b', marginBottom: 4 }}>
          Masks hide frame areas permanently (% of game frame). Saved automatically.
        </div>

        {settings.maskRegions.map((region, idx) => (
          <div key={region.id} style={{
            background: 'rgba(0,0,0,0.3)', border: '1px solid #334155',
            borderRadius: 6, padding: 8, marginBottom: 4,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 600 }}>
                Mask {idx + 1}
              </span>
              <button onClick={() => removeMaskRegion(region.id)} style={{
                background: 'none', border: 'none', color: '#ef4444',
                cursor: 'pointer', fontSize: '0.7rem',
              }}>✕</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {[
                { key: 'x', label: 'X%' },
                { key: 'y', label: 'Y%' },
                { key: 'w', label: 'W%' },
                { key: 'h', label: 'H%' },
              ].map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: '0.5rem', color: '#64748b', width: 20 }}>{label}</span>
                  <input type="number" value={region[key]} step={0.5}
                    onChange={e => updateMaskRegion(region.id, { [key]: parseFloat(e.target.value) || 0 })}
                    onMouseDown={e => e.stopPropagation()}
                    style={{ ...inputStyle, width: '100%', fontSize: '0.6rem' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ marginTop: 10, borderTop: '1px solid #334155', paddingTop: 8 }}>
          <div style={{ fontSize: '0.5rem', color: '#475569', textAlign: 'center' }}>
            Drag to move · Settings auto-save · Masks persist when editor is closed
          </div>
        </div>
      </div>
    </>
  );
}
