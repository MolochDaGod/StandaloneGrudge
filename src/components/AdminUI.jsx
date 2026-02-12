import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getElementRegistry, getAllScreens, loadLayout, saveLayout,
  resetLayout, exportLayouts, importLayouts
} from '../utils/uiLayoutConfig';

const CANVAS_W = 1280;
const CANVAS_H = 720;

const SCREEN_COLORS = {
  world: '#2563eb',
  battle: '#dc2626',
  scene: '#16a34a',
};

const SCREEN_LABELS = {
  world: 'World Map',
  battle: 'Battle Screen',
  scene: 'Scene Views',
};

const SCREEN_BGS = {
  world: 'linear-gradient(180deg, #0a1628 0%, #162a4a 40%, #1a3a2a 100%)',
  battle: 'linear-gradient(180deg, #1a0a0a 0%, #2a1414 40%, #1a0a1a 100%)',
  scene: 'linear-gradient(180deg, #0a1a0a 0%, #1a2a1a 40%, #0a1a28 100%)',
};

function getElementBox(config, el) {
  const def = el.defaultRect;
  const x = config.customX !== null ? config.customX : def.x;
  const y = config.customY !== null ? config.customY : def.y;
  const w = config.customWidth !== null ? config.customWidth : def.w;
  const h = config.customHeight !== null ? config.customHeight : def.h;
  return { x: Math.round(x), y: Math.round(y), w: Math.max(40, Math.round(w)), h: Math.max(20, Math.round(h)) };
}

export default function AdminUI() {
  const [activeScreen, setActiveScreen] = useState('world');
  const [layout, setLayout] = useState(() => loadLayout('world'));
  const [selectedId, setSelectedId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [importText, setImportText] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const canvasRef = useRef(null);
  const dragStart = useRef({ mx: 0, my: 0, ex: 0, ey: 0 });
  const resizeStart = useRef({ mx: 0, my: 0, ew: 0, eh: 0, ex: 0, ey: 0 });

  const elements = getElementRegistry(activeScreen);

  const switchScreen = (screen) => {
    setActiveScreen(screen);
    setLayout(loadLayout(screen));
    setSelectedId(null);
    setDragging(null);
    setResizing(null);
  };

  const updateElement = (id, updates) => {
    setLayout(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  };

  const handleSave = () => {
    saveLayout(activeScreen, layout);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const handleReset = () => {
    const def = resetLayout(activeScreen);
    setLayout(def);
    setSelectedId(null);
  };

  const handleExport = () => {
    setImportText(exportLayouts());
    setShowExport(true);
  };

  const handleImport = () => {
    if (importLayouts(importText)) {
      setLayout(loadLayout(activeScreen));
      setShowExport(false);
    }
  };

  const getCanvasScale = useCallback(() => {
    if (!canvasRef.current) return 1;
    const rect = canvasRef.current.getBoundingClientRect();
    return rect.width / CANVAS_W;
  }, []);

  const handleMouseDown = (e, elId, type) => {
    const config = layout[elId];
    if (config?.locked) return;
    e.preventDefault();
    e.stopPropagation();

    const el = elements.find(el => el.id === elId);
    const box = getElementBox(config, el);
    const scale = getCanvasScale();

    if (type === 'move') {
      dragStart.current = { mx: e.clientX, my: e.clientY, ex: box.x, ey: box.y };
      setDragging(elId);
    } else {
      resizeStart.current = { mx: e.clientX, my: e.clientY, ew: box.w, eh: box.h, ex: box.x, ey: box.y, corner: type };
      setResizing(elId);
    }
    setSelectedId(elId);
  };

  useEffect(() => {
    if (!dragging) return;
    const scale = getCanvasScale();
    const onMove = (e) => {
      const dx = (e.clientX - dragStart.current.mx) / scale;
      const dy = (e.clientY - dragStart.current.my) / scale;
      updateElement(dragging, {
        customX: Math.round(Math.max(0, Math.min(CANVAS_W - 40, dragStart.current.ex + dx))),
        customY: Math.round(Math.max(0, Math.min(CANVAS_H - 20, dragStart.current.ey + dy))),
      });
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, getCanvasScale]);

  useEffect(() => {
    if (!resizing) return;
    const scale = getCanvasScale();
    const onMove = (e) => {
      const dx = (e.clientX - resizeStart.current.mx) / scale;
      const dy = (e.clientY - resizeStart.current.my) / scale;
      const c = resizeStart.current.corner;
      let nw = resizeStart.current.ew;
      let nh = resizeStart.current.eh;
      let nx = resizeStart.current.ex;
      let ny = resizeStart.current.ey;

      if (c.includes('r')) nw += dx;
      if (c.includes('b')) nh += dy;
      if (c.includes('l')) { nw -= dx; nx += dx; }
      if (c.includes('t')) { nh -= dy; ny += dy; }

      updateElement(resizing, {
        customWidth: Math.round(Math.max(40, nw)),
        customHeight: Math.round(Math.max(20, nh)),
        customX: Math.round(nx),
        customY: Math.round(ny),
      });
    };
    const onUp = () => setResizing(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizing, getCanvasScale]);

  const selectedConfig = selectedId ? layout[selectedId] : null;
  const selectedElement = selectedId ? elements.find(e => e.id === selectedId) : null;
  const selectedBox = selectedId && selectedConfig && selectedElement
    ? getElementBox(selectedConfig, selectedElement)
    : null;

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0a0e17',
      display: 'flex', fontFamily: "'Jost', sans-serif", color: '#e2e8f0',
      overflow: 'hidden', userSelect: 'none',
    }}>
      <div style={{
        width: 280, flexShrink: 0, background: 'linear-gradient(180deg, #0f1629, #141d33)',
        borderRight: '1px solid rgba(180,150,90,0.2)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 16px 12px', borderBottom: '1px solid rgba(180,150,90,0.15)',
        }}>
          <h1 style={{
            margin: 0, fontSize: '1.1rem', fontFamily: "'Cinzel', serif",
            color: '#ffd700', letterSpacing: '0.08em', fontWeight: 700,
          }}>UI Layout Editor</h1>
          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 4 }}>
            Move, resize, and lock UI elements
          </div>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(180,150,90,0.1)' }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>
            Screen Context
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {getAllScreens().map(s => (
              <button
                key={s}
                onClick={() => switchScreen(s)}
                style={{
                  background: activeScreen === s
                    ? `linear-gradient(135deg, ${SCREEN_COLORS[s]}33, ${SCREEN_COLORS[s]}11)`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeScreen === s ? SCREEN_COLORS[s] + '66' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 6, padding: '8px 12px', cursor: 'pointer',
                  color: activeScreen === s ? '#fff' : '#94a3b8',
                  fontSize: '0.75rem', fontWeight: activeScreen === s ? 700 : 400,
                  textAlign: 'left', transition: 'all 0.2s',
                  fontFamily: "'Cinzel', serif",
                }}
              >
                <span style={{
                  display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                  background: SCREEN_COLORS[s], marginRight: 8, verticalAlign: 'middle',
                }} />
                {SCREEN_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          flex: 1, overflowY: 'auto', padding: '8px 16px',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,215,0,0.15) transparent',
        }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>
            Elements ({elements.length})
          </div>
          {elements.map((el, idx) => {
            const config = layout[el.id] || {};
            const isSelected = selectedId === el.id;
            return (
              <div
                key={el.id}
                onClick={() => setSelectedId(el.id)}
                style={{
                  padding: '8px 10px', marginBottom: 4, borderRadius: 6, cursor: 'pointer',
                  background: isSelected ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.04)'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: isSelected ? 700 : 400, color: isSelected ? '#ffd700' : '#cbd5e1' }}>
                    {el.label}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !config.visible }); }}
                      style={{
                        width: 22, height: 22, borderRadius: 4, border: 'none', cursor: 'pointer',
                        background: config.visible !== false ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                        color: config.visible !== false ? '#22c55e' : '#475569',
                        fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      title={config.visible !== false ? 'Visible' : 'Hidden'}
                    >
                      {config.visible !== false ? '\u25C9' : '\u25CE'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateElement(el.id, { locked: !config.locked }); }}
                      style={{
                        width: 22, height: 22, borderRadius: 4, border: 'none', cursor: 'pointer',
                        background: config.locked ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                        color: config.locked ? '#f59e0b' : '#475569',
                        fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      title={config.locked ? 'Locked' : 'Unlocked'}
                    >
                      {config.locked ? '\u{1F512}' : '\u{1F513}'}
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '0.55rem', color: '#475569', marginTop: 2 }}>
                  {el.id}
                </div>
              </div>
            );
          })}
        </div>

        {selectedId && selectedBox && (
          <div style={{
            padding: '12px 16px', borderTop: '1px solid rgba(180,150,90,0.15)',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: '0.6rem', color: '#ffd700', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Properties
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { label: 'X', key: 'customX', val: selectedBox.x },
                { label: 'Y', key: 'customY', val: selectedBox.y },
                { label: 'W', key: 'customWidth', val: selectedBox.w },
                { label: 'H', key: 'customHeight', val: selectedBox.h },
              ].map(p => (
                <div key={p.label}>
                  <div style={{ fontSize: '0.5rem', color: '#64748b', marginBottom: 2 }}>{p.label}</div>
                  <input
                    type="number"
                    value={p.val}
                    onChange={e => updateElement(selectedId, { [p.key]: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%', background: '#1e293b', border: '1px solid #334155',
                      borderRadius: 4, color: '#e2e8f0', padding: '4px 6px', fontSize: '0.7rem',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{
          padding: '12px 16px', borderTop: '1px solid rgba(180,150,90,0.15)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleSave} style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid rgba(34,197,94,0.4)',
              background: savedFlash ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.1)',
              color: '#22c55e', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
              transition: 'all 0.3s', fontFamily: "'Cinzel', serif",
            }}>
              {savedFlash ? 'Saved!' : 'Save Layout'}
            </button>
            <button onClick={handleReset} style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid rgba(220,38,38,0.3)',
              background: 'rgba(220,38,38,0.08)', color: '#f87171', cursor: 'pointer',
              fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Cinzel', serif",
            }}>
              Reset
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleExport} style={{
              flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)', color: '#94a3b8', cursor: 'pointer',
              fontSize: '0.65rem',
            }}>
              Export / Import
            </button>
            <a href="/" style={{
              flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid rgba(255,215,0,0.2)',
              background: 'rgba(255,215,0,0.05)', color: '#ffd700', cursor: 'pointer',
              fontSize: '0.65rem', textDecoration: 'none', textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              Back to Game
            </a>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '8px 20px', background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(180,150,90,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            <span style={{ color: SCREEN_COLORS[activeScreen], fontWeight: 700 }}>{SCREEN_LABELS[activeScreen]}</span>
            <span style={{ margin: '0 8px', color: '#334155' }}>|</span>
            Canvas {CANVAS_W}x{CANVAS_H}
          </div>
          <div style={{ fontSize: '0.6rem', color: '#475569' }}>
            Click to select, drag to move, corner handles to resize
          </div>
        </div>

        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, overflow: 'hidden',
        }}>
          <div
            ref={canvasRef}
            onClick={() => setSelectedId(null)}
            style={{
              width: '100%', maxWidth: CANVAS_W, aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
              background: SCREEN_BGS[activeScreen],
              border: '2px solid rgba(180,150,90,0.25)',
              borderRadius: 8, position: 'relative', overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 0 80px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              pointerEvents: 'none',
            }} />

            <div style={{
              position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
              fontSize: '0.7rem', color: 'rgba(255,255,255,0.08)', fontFamily: "'Cinzel', serif",
              letterSpacing: 2, pointerEvents: 'none',
            }}>
              {SCREEN_LABELS[activeScreen].toUpperCase()} LAYOUT
            </div>

            {elements.map((el, idx) => {
              const config = layout[el.id] || {};
              if (config.visible === false) return null;
              const box = getElementBox(config, el);
              const isSelected = selectedId === el.id;
              const isLocked = config.locked;
              const scale = canvasRef.current ? canvasRef.current.getBoundingClientRect().width / CANVAS_W : 1;

              const elColor = isLocked ? '#f59e0b' : isSelected ? '#ffd700' : SCREEN_COLORS[activeScreen];

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleMouseDown(e, el.id, 'move')}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                  style={{
                    position: 'absolute',
                    left: `${(box.x / CANVAS_W) * 100}%`,
                    top: `${(box.y / CANVAS_H) * 100}%`,
                    width: `${(box.w / CANVAS_W) * 100}%`,
                    height: `${(box.h / CANVAS_H) * 100}%`,
                    border: `2px solid ${elColor}${isSelected ? 'cc' : '55'}`,
                    borderRadius: 4,
                    background: `${elColor}${isSelected ? '18' : '0a'}`,
                    cursor: isLocked ? 'not-allowed' : dragging === el.id ? 'grabbing' : 'grab',
                    transition: dragging === el.id || resizing === el.id ? 'none' : 'all 0.1s',
                    boxShadow: isSelected ? `0 0 16px ${elColor}33, inset 0 0 20px ${elColor}08` : 'none',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: -1, left: 4,
                    transform: 'translateY(-100%)',
                    fontSize: 10 / scale, fontWeight: 700,
                    color: elColor, whiteSpace: 'nowrap',
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    pointerEvents: 'none',
                  }}>
                    {isLocked && '\u{1F512} '}{el.label}
                  </div>

                  <div style={{
                    position: 'absolute', bottom: 2 / scale, right: 4 / scale,
                    fontSize: 9 / scale, color: 'rgba(255,255,255,0.3)',
                    pointerEvents: 'none',
                  }}>
                    {box.w}x{box.h}
                  </div>

                  {isSelected && !isLocked && (
                    <>
                      {[
                        { pos: { top: -4, left: -4 }, cursor: 'nw-resize', corner: 'tl' },
                        { pos: { top: -4, right: -4 }, cursor: 'ne-resize', corner: 'tr' },
                        { pos: { bottom: -4, left: -4 }, cursor: 'sw-resize', corner: 'bl' },
                        { pos: { bottom: -4, right: -4 }, cursor: 'se-resize', corner: 'br' },
                      ].map(({ pos, cursor, corner }) => (
                        <div
                          key={corner}
                          onMouseDown={(e) => handleMouseDown(e, el.id, corner)}
                          style={{
                            position: 'absolute', ...pos,
                            width: 8, height: 8, background: elColor,
                            border: '1px solid rgba(255,255,255,0.6)', borderRadius: 2,
                            cursor, zIndex: 2,
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showExport && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
        }} onClick={() => setShowExport(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 500, maxHeight: '70vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            border: '1px solid rgba(180,150,90,0.3)', borderRadius: 12, padding: 24,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <h3 style={{ margin: 0, fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '1rem' }}>
              Export / Import Layouts
            </h3>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              style={{
                flex: 1, minHeight: 200, background: '#0a0e17', border: '1px solid #334155',
                borderRadius: 6, color: '#e2e8f0', padding: 12, fontSize: '0.7rem',
                fontFamily: 'monospace', resize: 'vertical', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleImport} style={{
                flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid rgba(34,197,94,0.4)',
                background: 'rgba(34,197,94,0.1)', color: '#22c55e', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 700,
              }}>
                Import
              </button>
              <button onClick={() => { navigator.clipboard.writeText(importText); }} style={{
                flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid rgba(59,130,246,0.4)',
                background: 'rgba(59,130,246,0.1)', color: '#60a5fa', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 700,
              }}>
                Copy to Clipboard
              </button>
              <button onClick={() => setShowExport(false)} style={{
                flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)', color: '#94a3b8', cursor: 'pointer',
                fontSize: '0.75rem',
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
