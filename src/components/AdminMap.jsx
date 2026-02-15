import React, { useState, useRef, useCallback, useEffect } from 'react';
import { locations } from '../data/enemies';

const defaultPositions = {
  verdant_plains:     { x: 10, y: 88 },
  dark_forest:        { x: 22, y: 78 },
  mystic_grove:       { x: 12, y: 68 },
  whispering_caverns: { x: 28, y: 88 },
  haunted_marsh:      { x: 38, y: 78 },
  cursed_ruins:       { x: 35, y: 65 },
  crystal_caves:      { x: 20, y: 55 },
  thornwood_pass:     { x: 48, y: 72 },
  sunken_temple:      { x: 50, y: 85 },
  iron_peaks:         { x: 30, y: 45 },
  blood_canyon:       { x: 60, y: 65 },
  frozen_tundra:      { x: 42, y: 38 },
  dragon_peaks:       { x: 55, y: 50 },
  ashen_battlefield:  { x: 68, y: 75 },
  windswept_ridge:    { x: 45, y: 28 },
  molten_core:        { x: 72, y: 58 },
  shadow_forest:      { x: 25, y: 35 },
  obsidian_wastes:    { x: 78, y: 68 },
  ruins_of_ashenmoor: { x: 58, y: 38 },
  blight_hollow:      { x: 35, y: 22 },
  shadow_citadel:     { x: 65, y: 28 },
  stormspire_peak:    { x: 50, y: 15 },
  demon_gate:         { x: 80, y: 42 },
  abyssal_depths:     { x: 75, y: 30 },
  infernal_forge:     { x: 88, y: 52 },
  dreadmaw_canyon:    { x: 85, y: 38 },
  void_threshold:     { x: 72, y: 18 },
  corrupted_spire:    { x: 88, y: 22 },
  void_throne:        { x: 82, y: 8 },
};

export default function AdminMap() {
  const [positions, setPositions] = useState(() => {
    const saved = localStorage.getItem('adminMapPositions');
    return saved ? JSON.parse(saved) : { ...defaultPositions };
  });
  const [dragging, setDragging] = useState(null);
  const [selected, setSelected] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [copied, setCopied] = useState(false);
  const mapRef = useRef(null);

  const handleMouseDown = useCallback((e, locId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(locId);
    setSelected(locId);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPositions(prev => ({
      ...prev,
      [dragging]: {
        x: Math.round(Math.max(0, Math.min(100, x))),
        y: Math.round(Math.max(0, Math.min(100, y))),
      }
    }));
  }, [dragging]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleTouchStart = useCallback((e, locId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(locId);
    setSelected(locId);
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (!dragging || !mapRef.current) return;
    const touch = e.touches[0];
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    setPositions(prev => ({
      ...prev,
      [dragging]: {
        x: Math.round(Math.max(0, Math.min(100, x))),
        y: Math.round(Math.max(0, Math.min(100, y))),
      }
    }));
  }, [dragging]);

  const handleTouchEnd = useCallback(() => {
    setDragging(null);
  }, []);

  const savePositions = () => {
    localStorage.setItem('adminMapPositions', JSON.stringify(positions));
  };

  const exportCode = () => {
    const lines = Object.entries(positions)
      .map(([k, v]) => `  ${k}: ${' '.repeat(Math.max(0, 20 - k.length))}{ x: ${v.x}, y: ${v.y} },`)
      .join('\n');
    const code = `const locationPositions = {\n${lines}\n};`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetPositions = () => {
    setPositions({ ...defaultPositions });
    localStorage.removeItem('adminMapPositions');
  };

  const locationList = locations || [];
  const allNodeIds = Object.keys(positions);

  return (
    <div style={{
      width: '100%', height: '100%', background: '#0a0e1a',
      display: 'flex', flexDirection: 'column', fontFamily: 'Jost, sans-serif',
      color: '#e2e8f0', overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/world_map.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.08, pointerEvents: 'none',
      }} />
      <div style={{
        padding: '8px 16px', background: 'rgba(20,26,43,0.9)',
        borderBottom: '2px solid rgba(180,150,90,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 8, position: 'relative', zIndex: 10,
        backgroundImage: 'url(/ui/bar-background.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/admin" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 600, fontSize: '0.75rem', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4 }}>
            Admin Hub
          </a>
          <a href="/" style={{ color: '#ffd700', textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem' }}>
            Back to Game
          </a>
          <span style={{ fontFamily: "'Cinzel', serif", fontWeight: 800, color: '#ffd700', fontSize: '1.1rem', textShadow: '0 0 12px rgba(255,215,0,0.3)' }}>
            Admin Map Editor
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} />
            Grid
          </label>
          <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}>
            Zoom:
            <input type="range" min="0.5" max="2" step="0.1" value={zoom}
              onChange={e => setZoom(parseFloat(e.target.value))}
              style={{ width: 80 }}
            />
            {(zoom * 100).toFixed(0)}%
          </label>
          <button onClick={savePositions} style={btnStyle('#22c55e')}>Save</button>
          <button onClick={exportCode} style={btnStyle('#3b82f6')}>
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <button onClick={resetPositions} style={btnStyle('#ef4444')}>Reset</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative', zIndex: 10 }}>
        <div style={{
          width: 200, background: 'rgba(20,26,43,0.92)', borderRight: '1px solid rgba(180,150,90,0.15)',
          overflowY: 'auto', padding: 8,
          backgroundImage: 'url(/ui/chat-background.png)', backgroundSize: 'cover',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' }}>
            Nodes ({allNodeIds.length})
          </div>
          {allNodeIds.map(id => {
            const loc = locationList.find(l => l.id === id);
            const pos = positions[id];
            return (
              <div
                key={id}
                onClick={() => setSelected(id)}
                style={{
                  padding: '4px 6px', marginBottom: 2, borderRadius: 4, cursor: 'pointer',
                  fontSize: '0.65rem',
                  background: selected === id ? 'rgba(245,158,11,0.2)' : 'transparent',
                  border: selected === id ? '1px solid #f59e0b' : '1px solid transparent',
                }}
              >
                <div style={{ fontWeight: 600, color: selected === id ? '#f59e0b' : '#e2e8f0' }}>
                  {loc?.name || id}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.55rem' }}>
                  x: {pos.x}, y: {pos.y}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div
            ref={mapRef}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              position: 'relative',
              width: `${900 * zoom}px`,
              height: `${600 * zoom}px`,
              background: '#1a2636',
              backgroundImage: 'url(/images/world_map.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: 8,
              border: '2px solid #2a3040',
              overflow: 'hidden',
              userSelect: 'none',
            }}
          >
            {showGrid && (
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.15 }}>
                {Array.from({ length: 10 }, (_, i) => (
                  <React.Fragment key={i}>
                    <line x1={`${(i + 1) * 10}%`} y1="0" x2={`${(i + 1) * 10}%`} y2="100%" stroke="#f59e0b" strokeWidth="0.5" />
                    <line x1="0" y1={`${(i + 1) * 10}%`} x2="100%" y2={`${(i + 1) * 10}%`} stroke="#f59e0b" strokeWidth="0.5" />
                    <text x={`${(i + 1) * 10}%`} y="12" fill="#f59e0b" fontSize="8" textAnchor="middle">{(i + 1) * 10}</text>
                    <text x="4" y={`${(i + 1) * 10}%`} fill="#f59e0b" fontSize="8" dominantBaseline="middle">{(i + 1) * 10}</text>
                  </React.Fragment>
                ))}
              </svg>
            )}

            {allNodeIds.map(id => {
              const pos = positions[id];
              const loc = locationList.find(l => l.id === id);
              const isSelected = selected === id;
              const isDragging = dragging === id;
              return (
                <div
                  key={id}
                  onMouseDown={(e) => handleMouseDown(e, id)}
                  onTouchStart={(e) => handleTouchStart(e, id)}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -50%)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    zIndex: isDragging ? 100 : (isSelected ? 50 : 10),
                    transition: isDragging ? 'none' : 'box-shadow 0.2s',
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%',
                    overflow: 'hidden',
                    border: isSelected ? '3px solid #f59e0b' : (isDragging ? '3px solid #22c55e' : '2px solid rgba(255,255,255,0.4)'),
                    boxShadow: isSelected ? '0 0 12px rgba(245,158,11,0.6)' : (isDragging ? '0 0 12px rgba(34,197,94,0.6)' : '0 2px 8px rgba(0,0,0,0.5)'),
                    background: '#1a1a2e',
                  }}>
                    <img
                      src={`/map_nodes/${id}.png`}
                      alt={id}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { e.target.style.display = 'none'; }}
                      draggable={false}
                    />
                  </div>
                  <div style={{
                    position: 'absolute', top: 38, left: '50%', transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap', fontSize: '0.5rem', fontWeight: 600,
                    color: isSelected ? '#f59e0b' : '#e2e8f0',
                    background: 'rgba(0,0,0,0.75)', padding: '1px 4px', borderRadius: 3,
                    textAlign: 'center',
                  }}>
                    {loc?.name || id}
                    <div style={{ fontSize: '0.4rem', color: '#6b7280' }}>
                      ({pos.x}, {pos.y})
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selected && (
          <div style={{
            width: 220, background: 'rgba(20,26,43,0.92)', borderLeft: '1px solid rgba(180,150,90,0.15)',
            padding: 12, overflowY: 'auto',
            backgroundImage: 'url(/ui/bar-background.png)', backgroundSize: 'cover',
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f59e0b', marginBottom: 8 }}>
              {locationList.find(l => l.id === selected)?.name || selected}
            </div>
            <div style={{ marginBottom: 8 }}>
              <img
                src={`/map_nodes/${selected}.png`}
                alt={selected}
                style={{ width: '100%', borderRadius: 6, border: '1px solid #2a3040' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
            <div style={{ fontSize: '0.7rem', marginBottom: 6 }}>
              <label style={{ display: 'block', marginBottom: 4 }}>
                X: {positions[selected]?.x}
                <input type="range" min="0" max="100" value={positions[selected]?.x || 0}
                  onChange={e => setPositions(prev => ({ ...prev, [selected]: { ...prev[selected], x: parseInt(e.target.value) } }))}
                  style={{ width: '100%' }}
                />
              </label>
              <label style={{ display: 'block', marginBottom: 4 }}>
                Y: {positions[selected]?.y}
                <input type="range" min="0" max="100" value={positions[selected]?.y || 0}
                  onChange={e => setPositions(prev => ({ ...prev, [selected]: { ...prev[selected], y: parseInt(e.target.value) } }))}
                  style={{ width: '100%' }}
                />
              </label>
            </div>
            <div style={{ fontSize: '0.6rem', color: '#6b7280' }}>
              ID: {selected}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    background: `${color}22`, border: `1px solid ${color}`,
    borderRadius: 6, padding: '4px 12px', color,
    cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
  };
}
