import React, { useState, useEffect, useCallback } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import { raceDefinitions } from '../data/races';
import { classDefinitions } from '../data/classes';

const ARENA_BGS = [
  { id: 'arena', src: '/backgrounds/Battlebackgrounds/arena.png', label: 'Arena' },
  { id: 'colosseum', src: '/backgrounds/Battlebackgrounds/colosseum_arena.jpg', label: 'Colosseum' },
  { id: 'winter', src: '/backgrounds/Battlebackgrounds/winter_arena.png', label: 'Winter' },
  { id: 'castle', src: '/backgrounds/Battlebackgrounds/castle_arena.jpg', label: 'Castle' },
  { id: 'default', src: '/backgrounds/Battlebackgrounds/battle_arena_default.png', label: 'Default' },
];

const RACES = Object.keys(raceDefinitions);
const CLASSES = Object.keys(classDefinitions);
const RACE_NAMES = { human: 'Human', orc: 'Orc', elf: 'Elf', undead: 'Undead', barbarian: 'Barbarian', dwarf: 'Dwarf' };
const CLASS_NAMES = { warrior: 'Warrior', mage: 'Mage Priest', worge: 'Worge', ranger: 'Ranger' };

const STORAGE_KEY = 'grudge-admin-pvp-placements';

function loadPlacements() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return {}; }
}
function savePlacements(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getZoneGrid() {
  const zones = [];
  const fwdCols = 3;
  const fwdRows = 3;
  for (let row = 0; row < fwdRows; row++) {
    for (let col = 0; col < fwdCols; col++) {
      const pX = 14 + col * 10;
      const eX = 56 + col * 10;
      const y = 72 + row * 9;
      zones.push({ x: pX, y, side: 'player', label: `F${row * fwdCols + col + 1}`, type: 'forward' });
      zones.push({ x: eX, y, side: 'enemy', label: `F${row * fwdCols + col + 1}`, type: 'forward' });
    }
  }
  const pocketCols = 5;
  const pocketRows = 2;
  for (let row = 0; row < pocketRows; row++) {
    for (let col = 0; col < pocketCols; col++) {
      const pX = 4 + col * 8;
      const eX = 56 + col * 8;
      const y = 58 + row * 8;
      const idx = row * pocketCols + col + 1;
      zones.push({ x: pX, y, side: 'player', label: `B${idx}`, type: 'pocket' });
      zones.push({ x: eX, y, side: 'enemy', label: `B${idx}`, type: 'pocket' });
    }
  }
  return zones;
}

let unitIdSeq = 0;

export default function AdminPvP() {
  const setScreen = useGameStore(s => s.setScreen);
  const [bg, setBg] = useState(ARENA_BGS[0]);
  const [units, setUnits] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [showZones, setShowZones] = useState(true);
  const [paused, setPaused] = useState(true);
  const [spawnRace, setSpawnRace] = useState('human');
  const [spawnClass, setSpawnClass] = useState('warrior');
  const [spawnTeam, setSpawnTeam] = useState('player');
  const [savedMsg, setSavedMsg] = useState(false);
  const zones = getZoneGrid();

  const selected = units.find(u => u.id === selectedId);

  const spawnUnit = useCallback(() => {
    const id = `pvp_unit_${++unitIdSeq}`;
    const isPlayer = spawnTeam === 'player';
    const baseX = isPlayer ? 30 : 65;
    const baseY = 85 + Math.random() * 10;
    const sprite = getPlayerSprite(spawnClass, spawnRace);
    setUnits(prev => [...prev, {
      id,
      raceId: spawnRace,
      classId: spawnClass,
      team: spawnTeam,
      x: baseX + (Math.random() - 0.5) * 10,
      y: baseY,
      scale: 1,
      sprite,
      label: `${RACE_NAMES[spawnRace]} ${CLASS_NAMES[spawnClass]}`,
    }]);
    setSelectedId(id);
  }, [spawnRace, spawnClass, spawnTeam]);

  const removeUnit = useCallback((id) => {
    setUnits(prev => prev.filter(u => u.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [selectedId]);

  const updateUnit = useCallback((id, updates) => {
    setUnits(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!selectedId) return;
      const step = e.shiftKey ? 10 : 1;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updateUnit(selectedId, { x: (units.find(u => u.id === selectedId)?.x || 50) - step });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        updateUnit(selectedId, { x: (units.find(u => u.id === selectedId)?.x || 50) + step });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        updateUnit(selectedId, { y: (units.find(u => u.id === selectedId)?.y || 85) - step });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        updateUnit(selectedId, { y: (units.find(u => u.id === selectedId)?.y || 85) + step });
      } else if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        e.preventDefault();
        updateUnit(selectedId, { scale: Math.round(((units.find(u => u.id === selectedId)?.scale || 1) + 0.05) * 100) / 100 });
      } else if (e.key === '-' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        updateUnit(selectedId, { scale: Math.max(0.1, Math.round(((units.find(u => u.id === selectedId)?.scale || 1) - 0.05) * 100) / 100) });
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeUnit(selectedId);
      } else if (e.key === 'Escape') {
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, units, updateUnit, removeUnit]);

  const handleSave = () => {
    const placement = {
      bg: bg.id,
      units: units.map(u => ({
        raceId: u.raceId,
        classId: u.classId,
        team: u.team,
        x: Math.round(u.x * 10) / 10,
        y: Math.round(u.y * 10) / 10,
        scale: u.scale,
        label: u.label,
      })),
      savedAt: new Date().toISOString(),
    };
    const all = loadPlacements();
    const slotName = `arena_${bg.id}_${Date.now()}`;
    all[slotName] = placement;
    savePlacements(all);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  const handleLoad = () => {
    const all = loadPlacements();
    const keys = Object.keys(all);
    if (keys.length === 0) { alert('No saved placements found.'); return; }
    const latest = all[keys[keys.length - 1]];
    const loadedBg = ARENA_BGS.find(b => b.id === latest.bg) || ARENA_BGS[0];
    setBg(loadedBg);
    setUnits(latest.units.map((u, i) => ({
      ...u,
      id: `pvp_loaded_${++unitIdSeq}`,
      sprite: getPlayerSprite(u.classId, u.raceId),
    })));
    setSelectedId(null);
  };

  const handleBgClick = (e) => {
    if (e.target !== e.currentTarget && !e.target.closest('[data-zone]')) return;
    setSelectedId(null);
  };

  const handleUnitClick = (e, unitId) => {
    e.stopPropagation();
    setSelectedId(unitId);
  };

  const copyJSON = () => {
    const data = {
      bg: bg.id,
      units: units.map(u => ({
        raceId: u.raceId, classId: u.classId, team: u.team,
        x: Math.round(u.x * 10) / 10, y: Math.round(u.y * 10) / 10, scale: u.scale,
      })),
    };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0a0e19' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 16px', background: 'rgba(0,0,0,0.8)',
        borderBottom: '2px solid #f59e0b',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="font-cinzel" style={{ color: '#f59e0b', fontSize: '1rem', fontWeight: 800, letterSpacing: 2 }}>
            ADMIN PvP EDITOR
          </span>
          <button onClick={() => setPaused(p => !p)} style={{
            background: paused ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)',
            border: `1px solid ${paused ? '#ef4444' : '#22c55e'}`,
            color: paused ? '#ef4444' : '#22c55e',
            borderRadius: 4, padding: '3px 10px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer',
          }}>{paused ? '⏸ PAUSED' : '▶ PLAYING'}</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleSave} style={toolBtnStyle('#f59e0b')}>💾 Save (S)</button>
          <button onClick={handleLoad} style={toolBtnStyle('#3b82f6')}>📂 Load</button>
          <button onClick={copyJSON} style={toolBtnStyle('#a78bfa')}>📋 Copy JSON</button>
          <button onClick={() => { setUnits([]); setSelectedId(null); }} style={toolBtnStyle('#ef4444')}>🗑 Clear</button>
          <button onClick={() => setScreen('world')} style={toolBtnStyle('#888')}>✕ Exit</button>
        </div>
      </div>

      {savedMsg && (
        <div style={{
          position: 'absolute', top: 50, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(34,197,94,0.9)', color: '#fff', padding: '6px 20px',
          borderRadius: 6, fontWeight: 700, fontSize: '0.8rem', zIndex: 999,
          animation: 'fadeIn 0.2s ease',
        }}>Saved!</div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <div style={{
          width: 200, background: 'rgba(0,0,0,0.6)', borderRight: '1px solid rgba(245,158,11,0.2)',
          padding: 10, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ color: '#f59e0b', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 2, marginBottom: 4 }}>BACKGROUNDS</div>
          {ARENA_BGS.map(b => (
            <button key={b.id} onClick={() => setBg(b)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
              background: bg.id === b.id ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.03)',
              border: bg.id === b.id ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 6, cursor: 'pointer', color: bg.id === b.id ? '#f59e0b' : '#aaa',
              fontSize: '0.65rem', fontWeight: 600, width: '100%', textAlign: 'left',
            }}>
              <div style={{ width: 36, height: 20, borderRadius: 3, backgroundImage: `url(${b.src})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid rgba(255,255,255,0.1)' }} />
              {b.label}
            </button>
          ))}

          <div style={{ borderTop: '1px solid rgba(245,158,11,0.2)', paddingTop: 8, marginTop: 4 }}>
            <div style={{ color: '#f59e0b', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>SPAWN UNIT</div>

            <div style={{ marginBottom: 6 }}>
              <div style={{ color: '#888', fontSize: '0.5rem', marginBottom: 2 }}>TEAM</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['player', 'enemy'].map(t => (
                  <button key={t} onClick={() => setSpawnTeam(t)} style={{
                    flex: 1, padding: '3px 0', borderRadius: 4, cursor: 'pointer',
                    background: spawnTeam === t ? (t === 'player' ? 'rgba(110,231,183,0.2)' : 'rgba(239,68,68,0.2)') : 'rgba(255,255,255,0.03)',
                    border: spawnTeam === t ? `1px solid ${t === 'player' ? '#6ee7b7' : '#ef4444'}` : '1px solid rgba(255,255,255,0.08)',
                    color: spawnTeam === t ? (t === 'player' ? '#6ee7b7' : '#ef4444') : '#888',
                    fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase',
                  }}>{t}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 6 }}>
              <div style={{ color: '#888', fontSize: '0.5rem', marginBottom: 2 }}>RACE</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {RACES.map(r => (
                  <button key={r} onClick={() => setSpawnRace(r)} style={{
                    padding: '2px 6px', borderRadius: 3, cursor: 'pointer',
                    background: spawnRace === r ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.03)',
                    border: spawnRace === r ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.06)',
                    color: spawnRace === r ? '#f59e0b' : '#888', fontSize: '0.5rem', fontWeight: 600,
                  }}>{RACE_NAMES[r]?.slice(0, 3).toUpperCase()}</button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 6 }}>
              <div style={{ color: '#888', fontSize: '0.5rem', marginBottom: 2 }}>CLASS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {CLASSES.map(c => (
                  <button key={c} onClick={() => setSpawnClass(c)} style={{
                    padding: '2px 6px', borderRadius: 3, cursor: 'pointer',
                    background: spawnClass === c ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.03)',
                    border: spawnClass === c ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.06)',
                    color: spawnClass === c ? '#f59e0b' : '#888', fontSize: '0.5rem', fontWeight: 600,
                  }}>{CLASS_NAMES[c]?.slice(0, 3).toUpperCase()}</button>
                ))}
              </div>
            </div>

            <button onClick={spawnUnit} style={{
              width: '100%', padding: '6px 0', borderRadius: 6, cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(219,99,49,0.15))',
              border: '1px solid #f59e0b', color: '#f59e0b',
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: 1,
            }}>+ SPAWN</button>
          </div>

          <div style={{ borderTop: '1px solid rgba(245,158,11,0.2)', paddingTop: 8, marginTop: 4 }}>
            <div style={{ color: '#f59e0b', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>TOOLS</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#aaa', fontSize: '0.55rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={showZones} onChange={() => setShowZones(p => !p)} style={{ accentColor: '#f59e0b' }} />
              Show Zone Grid
            </label>
          </div>

          {selected && (
            <div style={{ borderTop: '1px solid rgba(245,158,11,0.2)', paddingTop: 8, marginTop: 4 }}>
              <div style={{ color: '#f59e0b', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>SELECTED</div>
              <div style={{ color: '#ddd', fontSize: '0.6rem', fontWeight: 600, marginBottom: 4 }}>{selected.label}</div>
              <div style={{ color: '#888', fontSize: '0.5rem' }}>Team: <span style={{ color: selected.team === 'player' ? '#6ee7b7' : '#ef4444' }}>{selected.team}</span></div>
              <div style={{ color: '#888', fontSize: '0.5rem' }}>X: {Math.round(selected.x * 10) / 10} Y: {Math.round(selected.y * 10) / 10}</div>
              <div style={{ color: '#888', fontSize: '0.5rem' }}>Scale: {selected.scale}x</div>
              <div style={{ color: '#666', fontSize: '0.45rem', marginTop: 4 }}>
                Arrows: Move (Shift=10) | +/- : Scale | S: Save | Del: Remove
              </div>
              <button onClick={() => removeUnit(selected.id)} style={{
                width: '100%', padding: '4px 0', borderRadius: 4, cursor: 'pointer', marginTop: 6,
                background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444',
                fontSize: '0.55rem', fontWeight: 600,
              }}>Delete Unit</button>
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(245,158,11,0.2)', paddingTop: 8, marginTop: 4 }}>
            <div style={{ color: '#f59e0b', fontSize: '0.65rem', fontWeight: 700, letterSpacing: 2, marginBottom: 6 }}>UNITS ({units.length})</div>
            {units.map(u => (
              <button key={u.id} onClick={() => setSelectedId(u.id)} style={{
                display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '4px 6px',
                background: selectedId === u.id ? 'rgba(245,158,11,0.15)' : 'transparent',
                border: selectedId === u.id ? '1px solid rgba(245,158,11,0.4)' : '1px solid transparent',
                borderRadius: 4, cursor: 'pointer', marginBottom: 2,
                color: u.team === 'player' ? '#6ee7b7' : '#ef4444', fontSize: '0.5rem', fontWeight: 600,
                textAlign: 'left',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: u.team === 'player' ? '#6ee7b7' : '#ef4444', flexShrink: 0 }} />
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <div
          onClick={handleBgClick}
          style={{
            flex: 1, position: 'relative', overflow: 'hidden',
            backgroundImage: `url(${bg.src})`,
            backgroundSize: 'cover', backgroundPosition: 'center bottom',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%)', pointerEvents: 'none' }} />

          {showZones && zones.map((z, i) => {
            const isPocket = z.type === 'pocket';
            const pColor = isPocket ? 'rgba(110,231,183,0.15)' : 'rgba(110,231,183,0.25)';
            const eColor = isPocket ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.25)';
            return (
              <div key={i} data-zone style={{
                position: 'absolute',
                left: `${z.x}%`, top: `${z.y}%`,
                width: isPocket ? '6.5%' : '8%',
                height: isPocket ? '7%' : '8.5%',
                border: `1px ${isPocket ? 'dotted' : 'dashed'} ${z.side === 'player' ? pColor : eColor}`,
                borderRadius: isPocket ? 3 : 4,
                background: z.side === 'player' ? 'rgba(110,231,183,0.03)' : 'rgba(239,68,68,0.03)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                pointerEvents: 'none',
              }}>
                <span style={{
                  color: z.side === 'player' ? 'rgba(110,231,183,0.3)' : 'rgba(239,68,68,0.3)',
                  fontSize: isPocket ? '0.35rem' : '0.4rem', fontWeight: 700, letterSpacing: 1,
                }}>{z.label}</span>
              </div>
            );
          })}

          <div style={{
            position: 'absolute', left: '50%', top: '70%', bottom: 0,
            width: 2, background: 'rgba(245,158,11,0.15)',
            transform: 'translateX(-50%)', pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', left: '50%', top: '68%', transform: 'translateX(-50%)',
            color: 'rgba(245,158,11,0.3)', fontSize: '0.45rem', fontWeight: 700, letterSpacing: 2,
            pointerEvents: 'none',
          }}>MIDLINE</div>

          {units.map(unit => {
            const isSelected = selectedId === unit.id;
            const spriteScale = 2.5 * unit.scale;
            const flipSprite = unit.team === 'enemy';

            return (
              <div
                key={unit.id}
                onClick={(e) => handleUnitClick(e, unit.id)}
                style={{
                  position: 'absolute',
                  left: `${unit.x}%`, top: `${unit.y}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor: 'pointer',
                  zIndex: Math.floor(unit.y),
                  filter: isSelected
                    ? `drop-shadow(0 0 8px ${unit.team === 'player' ? 'rgba(110,231,183,0.8)' : 'rgba(239,68,68,0.8)'})`
                    : 'none',
                  transition: 'filter 0.15s',
                }}
              >
                <div style={{
                  position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
                  width: spriteScale * 20, height: spriteScale * 5,
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
                  borderRadius: '50%',
                }} />

                <SpriteAnimation
                  spriteData={unit.sprite}
                  animation="idle"
                  scale={spriteScale}
                  flip={flipSprite}
                  loop={!paused}
                  speed={150}
                  containerless={false}
                />

                {isSelected && (
                  <div style={{
                    position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.9)', border: '1px solid #f59e0b',
                    borderRadius: 4, padding: '2px 8px', whiteSpace: 'nowrap',
                    color: '#f59e0b', fontSize: '0.45rem', fontWeight: 700,
                  }}>
                    {unit.label} | {Math.round(unit.x)},{Math.round(unit.y)} | {unit.scale}x
                  </div>
                )}

                <div style={{
                  position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
                  fontSize: '0.4rem', fontWeight: 600, whiteSpace: 'nowrap',
                  color: unit.team === 'player' ? 'rgba(110,231,183,0.6)' : 'rgba(239,68,68,0.6)',
                  textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                }}>
                  {RACE_NAMES[unit.raceId]?.slice(0, 3)} {CLASS_NAMES[unit.classId]?.slice(0, 3)}
                </div>
              </div>
            );
          })}

          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 8, alignItems: 'center',
            background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 8, padding: '6px 16px',
          }}>
            <span style={{ color: '#888', fontSize: '0.5rem' }}>
              Click unit to select | Arrows: Move (Shift=10) | +/- : Scale | S: Save | Del: Remove | Esc: Deselect
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function toolBtnStyle(color) {
  return {
    background: `${color}18`,
    border: `1px solid ${color}`,
    color,
    borderRadius: 4,
    padding: '3px 10px',
    fontSize: '0.6rem',
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: 0.5,
  };
}
