import React, { useState, useRef, useCallback, useEffect } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, getEnemySprite } from '../data/spriteMap';
import { locations } from '../data/enemies';
import { InlineIcon } from '../data/uiSprites';

const allBackgrounds = {
  verdant_plains: '/backgrounds/verdant_plains.png',
  dark_forest: '/backgrounds/dark_forest.png',
  cursed_ruins: '/backgrounds/cursed_ruins.png',
  blood_canyon: '/backgrounds/blood_canyon.png',
  dragon_peaks: '/backgrounds/dragon_peaks.png',
  shadow_citadel: '/backgrounds/shadow_citadel.png',
  demon_gate: '/backgrounds/demon_gate.png',
  void_throne: '/backgrounds/void_throne.png',
  molten_core: '/backgrounds/volcanic_field.png',
  infernal_forge: '/backgrounds/infernal_arena.png',
  mystic_grove: '/map_nodes/mystic_grove.png',
  whispering_caverns: '/map_nodes/whispering_caverns.png',
  haunted_marsh: '/map_nodes/haunted_marsh.png',
  crystal_caves: '/map_nodes/crystal_caves.png',
  thornwood_pass: '/map_nodes/thornwood_pass.png',
  sunken_temple: '/map_nodes/sunken_temple.png',
  iron_peaks: '/backgrounds/boss_mountain.png',
  shadow_forest: '/map_nodes/shadow_forest.png',
  frozen_tundra: '/backgrounds/winter_arena.png',
  blight_hollow: '/map_nodes/blight_hollow.png',
  stormspire_peak: '/backgrounds/storm_ruins.png',
  corrupted_spire: '/map_nodes/corrupted_spire.png',
  abyssal_depths: '/map_nodes/abyssal_depths.png',
  ashen_battlefield: '/backgrounds/storm_ruins.png',
  windswept_ridge: '/backgrounds/boss_mountain.png',
  void_threshold: '/map_nodes/void_threshold.png',
  obsidian_wastes: '/map_nodes/obsidian_wastes.png',
  ruins_of_ashenmoor: '/map_nodes/ruins_of_ashenmoor.png',
  dreadmaw_canyon: '/map_nodes/dreadmaw_canyon.png',
  crystal_lake: '/backgrounds/winter_arena.png',
  storm_ruins: '/backgrounds/storm_ruins.png',
  winter_arena: '/backgrounds/winter_arena.png',
  boss_mountain: '/backgrounds/boss_mountain.png',
};

const defaultFormations = {
  player: {
    1: [{x:35,y:82}],
    2: [{x:32,y:78},{x:38,y:86}],
    3: [{x:30,y:74},{x:36,y:82},{x:32,y:90}],
  },
  enemy: {
    1: [{x:65,y:82}],
    2: [{x:62,y:78},{x:68,y:86}],
    3: [{x:60,y:74},{x:66,y:82},{x:62,y:90}],
    4: [{x:58,y:70},{x:64,y:78},{x:60,y:86},{x:66,y:92}],
  }
};

const raceOptions = ['human', 'elf', 'orc', 'demon', 'worge', 'undead'];
const classOptions = ['warrior', 'mage', 'rogue', 'cleric'];

const defaultSpriteLayout = {
  shadow: { offsetY: 0, width: 40, height: 8 },
  nameplate: { offsetY: 0 },
  healthBar: { width: 50, height: 4 },
  manaBar: { width: 23, height: 2 },
  staminaBar: { width: 23, height: 2 },
  grudgeBar: { width: 50, height: 3 },
};

const defaultActionBar = {
  leftPanelWidth: 140,
  rightPanelWidth: 140,
  playerBarWidth: 128,
  playerBarHeight: 5,
  playerManaWidth: 62,
  playerManaHeight: 3,
  playerStaminaWidth: 62,
  playerStaminaHeight: 3,
  playerGrudgeWidth: 128,
  playerGrudgeHeight: 3,
  enemyBarWidth: 128,
  enemyBarHeight: 5,
  enemyManaWidth: 62,
  enemyManaHeight: 3,
  enemyStaminaWidth: 62,
  enemyStaminaHeight: 3,
  enemyGrudgeWidth: 128,
  enemyGrudgeHeight: 3,
};

function MiniBar({ current, max, color, height = 4, width = 50 }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (current / max) * 100)) : 0;
  const barHeight = Math.max(height, 6);
  const fillColors = {
    '#22c55e': { top: '#78e08f', mid: '#38b764', bot: '#1e6f3e', glow: 'rgba(34,197,94,0.4)' },
    '#ef4444': { top: '#ff8a8a', mid: '#ef4444', bot: '#a22', glow: 'rgba(239,68,68,0.5)' },
    '#3b82f6': { top: '#7db8ff', mid: '#3b82f6', bot: '#1d4ed8', glow: 'rgba(59,130,246,0.4)' },
    '#f59e0b': { top: '#fcd34d', mid: '#f59e0b', bot: '#b45309', glow: 'rgba(245,158,11,0.4)' },
    '#dc2626': { top: '#f87171', mid: '#dc2626', bot: '#7f1d1d', glow: 'rgba(220,38,38,0.6)' },
    '#a855f7': { top: '#c084fc', mid: '#a855f7', bot: '#6b21a8', glow: 'rgba(168,85,247,0.4)' },
    '#06b6d4': { top: '#67e8f9', mid: '#06b6d4', bot: '#0e7490', glow: 'rgba(6,182,212,0.4)' },
  };
  const fc = fillColors[color] || { top: color + '99', mid: color, bot: color + 'aa', glow: color + '44' };
  const isCrit = pct < 10 && pct > 0;
  return (
    <div style={{
      width, height: barHeight,
      background: 'linear-gradient(180deg, #1a1a2e 0%, #0d0d1a 100%)',
      overflow: 'hidden',
      border: '1px solid #2a2a3e',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: `${pct}%`,
        background: `linear-gradient(180deg, ${fc.top} 0%, ${fc.mid} 40%, ${fc.bot} 100%)`,
        transition: 'width 0.3s',
        boxShadow: pct > 0 ? `0 0 ${barHeight}px ${fc.glow}` : 'none',
      }} />
      {pct > 0 && barHeight >= 5 && (
        <div style={{
          position: 'absolute', top: 1, left: 1,
          width: `calc(${pct}% - 2px)`, height: '40%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 100%)',
          transition: 'width 0.3s',
        }} />
      )}
      {isCrit && (
        <div style={{
          position: 'absolute', inset: 0,
          animation: 'pulse 0.8s infinite',
          border: '1px solid rgba(239,68,68,0.6)',
        }} />
      )}
    </div>
  );
}

export default function AdminBattle() {
  const [selectedBg, setSelectedBg] = useState('verdant_plains');
  const [playerCount, setPlayerCount] = useState(3);
  const [enemyCount, setEnemyCount] = useState(3);
  const [formations, setFormations] = useState(() => {
    const saved = localStorage.getItem('adminBattleFormations');
    return saved ? JSON.parse(saved) : JSON.parse(JSON.stringify(defaultFormations));
  });
  const [spriteLayout, setSpriteLayout] = useState(() => {
    const saved = localStorage.getItem('adminBattleSpriteLayout');
    return saved ? JSON.parse(saved) : { ...defaultSpriteLayout };
  });
  const [actionBar, setActionBar] = useState(() => {
    const saved = localStorage.getItem('adminBattleActionBar');
    return saved ? JSON.parse(saved) : { ...defaultActionBar };
  });
  const [dragging, setDragging] = useState(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [tab, setTab] = useState('formations');
  const [copied, setCopied] = useState('');
  const [playerRace, setPlayerRace] = useState('human');
  const [playerClass, setPlayerClass] = useState('warrior');
  const [enemyRace, setEnemyRace] = useState('orc');
  const [enemyClass, setEnemyClass] = useState('warrior');
  const [spriteSize, setSpriteSize] = useState(200);
  const [bossScale, setBossScale] = useState(1.6);
  const arenaRef = useRef(null);

  const playerUnits = (formations.player[playerCount] || formations.player[1]).map((pos, i) => ({
    id: `p${i}`, team: 'player', name: `Hero ${i + 1}`, position: pos,
    health: 80 + i * 10, maxHealth: 120, mana: 30, maxMana: 50,
    stamina: 25, maxStamina: 40, grudge: i === 0 ? 100 : 30 + i * 20,
    alive: true, isBoss: false, classId: playerClass, raceId: playerRace,
  }));

  const enemyUnits = (formations.enemy[enemyCount] || formations.enemy[1]).map((pos, i) => ({
    id: `e${i}`, team: 'enemy', name: `Enemy ${i + 1}`, position: pos,
    health: 60 + i * 15, maxHealth: 100, mana: 20, maxMana: 40,
    stamina: 15, maxStamina: 30, grudge: i === 0 ? 80 : 20,
    alive: true, isBoss: i === 0, classId: enemyClass, raceId: enemyRace,
  }));

  const allUnits = [...playerUnits, ...enemyUnits];

  const handleMouseDown = useCallback((e, unitId) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(unitId);
    setSelectedUnit(unitId);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!dragging || !arenaRef.current) return;
    const rect = arenaRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    const clampX = Math.max(0, Math.min(100, x));
    const clampY = Math.max(0, Math.min(100, y));

    setFormations(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const isPlayer = dragging.startsWith('p');
      const idx = parseInt(dragging.slice(1));
      const side = isPlayer ? 'player' : 'enemy';
      const count = isPlayer ? playerCount : enemyCount;
      if (next[side][count] && next[side][count][idx]) {
        next[side][count][idx] = { x: clampX, y: clampY };
      }
      return next;
    });
  }, [dragging, playerCount, enemyCount]);

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

  const save = () => {
    localStorage.setItem('adminBattleFormations', JSON.stringify(formations));
    localStorage.setItem('adminBattleSpriteLayout', JSON.stringify(spriteLayout));
    localStorage.setItem('adminBattleActionBar', JSON.stringify(actionBar));
  };

  const copyFormations = () => {
    const code = `function getFormationPositions(count, side) {\n  const p = ${JSON.stringify(formations, null, 4)};\n  const maxCount = side === 'player' ? 3 : 4;\n  return p[side][Math.min(count, maxCount)] || p[side][1];\n}`;
    navigator.clipboard.writeText(code);
    setCopied('formations');
    setTimeout(() => setCopied(''), 2000);
  };

  const copySpriteLayout = () => {
    const code = JSON.stringify({ spriteLayout, actionBar, spriteSize, bossScale }, null, 2);
    navigator.clipboard.writeText(code);
    setCopied('layout');
    setTimeout(() => setCopied(''), 2000);
  };

  const reset = () => {
    setFormations(JSON.parse(JSON.stringify(defaultFormations)));
    setSpriteLayout({ ...defaultSpriteLayout });
    setActionBar({ ...defaultActionBar });
    setSpriteSize(200);
    setBossScale(1.6);
    localStorage.removeItem('adminBattleFormations');
    localStorage.removeItem('adminBattleSpriteLayout');
    localStorage.removeItem('adminBattleActionBar');
  };

  const getUnitSprite = (unit) => {
    if (unit.team === 'player') {
      return getPlayerSprite(unit.classId, unit.raceId);
    }
    return getEnemySprite(unit.raceId, unit.classId);
  };

  return (
    <div style={{
      width: '100vw', height: '100vh', background: '#0a0e1a',
      display: 'flex', flexDirection: 'column', fontFamily: 'Jost, sans-serif',
      color: '#e2e8f0', overflow: 'hidden',
    }}>
      <div style={{
        padding: '6px 16px', background: '#141a2b',
        borderBottom: '2px solid #f59e0b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 700, fontSize: '0.8rem' }}>
            Back to Game
          </a>
          <span style={{ fontFamily: 'Cinzel, serif', fontWeight: 800, color: '#f59e0b', fontSize: '1rem' }}>
            ADMIN BATTLE EDITOR
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={selectedBg} onChange={e => setSelectedBg(e.target.value)}
            style={{ background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', borderRadius: 4, padding: '3px 8px', fontSize: '0.7rem' }}>
            {Object.keys(allBackgrounds).map(k => (
              <option key={k} value={k}>{k.replace(/_/g, ' ')}</option>
            ))}
          </select>
          <button onClick={save} style={btnStyle('#22c55e')}>Save</button>
          <button onClick={copyFormations} style={btnStyle('#3b82f6')}>
            {copied === 'formations' ? 'Copied!' : 'Copy Formations'}
          </button>
          <button onClick={copySpriteLayout} style={btnStyle('#a78bfa')}>
            {copied === 'layout' ? 'Copied!' : 'Copy Layout'}
          </button>
          <button onClick={reset} style={btnStyle('#ef4444')}>Reset</button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div style={{
          width: 240, background: '#141a2b', borderRight: '1px solid #2a3040',
          overflowY: 'auto', padding: 8,
        }}>
          <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
            {['formations', 'sprites', 'actionbar'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '4px 0', borderRadius: 4, cursor: 'pointer',
                fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
                background: tab === t ? 'rgba(245,158,11,0.2)' : 'transparent',
                border: tab === t ? '1px solid #f59e0b' : '1px solid #2a3040',
                color: tab === t ? '#f59e0b' : '#6b7280',
              }}>{t}</button>
            ))}
          </div>

          {tab === 'formations' && (
            <>
              <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>PLAYER TEAM</div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
                  Count: {playerCount}
                </label>
                <input type="range" min="1" max="3" value={playerCount}
                  onChange={e => setPlayerCount(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#f59e0b' }}
                />
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <select value={playerRace} onChange={e => setPlayerRace(e.target.value)}
                    style={selectStyle}>
                    {raceOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select value={playerClass} onChange={e => setPlayerClass(e.target.value)}
                    style={selectStyle}>
                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {(formations.player[playerCount] || []).map((pos, i) => (
                <div key={i} onClick={() => setSelectedUnit(`p${i}`)} style={{
                  padding: '4px 6px', marginBottom: 2, borderRadius: 4, cursor: 'pointer',
                  fontSize: '0.6rem',
                  background: selectedUnit === `p${i}` ? 'rgba(110,231,183,0.15)' : 'transparent',
                  border: selectedUnit === `p${i}` ? '1px solid var(--accent)' : '1px solid transparent',
                }}>
                  <div style={{ fontWeight: 600, color: '#93c5fd' }}>Player {i + 1}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.5rem' }}>x: {pos.x}, y: {pos.y}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    <label style={{ fontSize: '0.5rem', flex: 1 }}>
                      X: <input type="number" value={pos.x} min={0} max={100}
                        onChange={e => {
                          const next = JSON.parse(JSON.stringify(formations));
                          next.player[playerCount][i].x = parseInt(e.target.value) || 0;
                          setFormations(next);
                        }}
                        style={numInputStyle} />
                    </label>
                    <label style={{ fontSize: '0.5rem', flex: 1 }}>
                      Y: <input type="number" value={pos.y} min={0} max={100}
                        onChange={e => {
                          const next = JSON.parse(JSON.stringify(formations));
                          next.player[playerCount][i].y = parseInt(e.target.value) || 0;
                          setFormations(next);
                        }}
                        style={numInputStyle} />
                    </label>
                  </div>
                </div>
              ))}

              <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, marginTop: 12, marginBottom: 6 }}>ENEMY TEAM</div>
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block', marginBottom: 2 }}>
                  Count: {enemyCount}
                </label>
                <input type="range" min="1" max="4" value={enemyCount}
                  onChange={e => setEnemyCount(parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#ef4444' }}
                />
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  <select value={enemyRace} onChange={e => setEnemyRace(e.target.value)}
                    style={selectStyle}>
                    {raceOptions.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <select value={enemyClass} onChange={e => setEnemyClass(e.target.value)}
                    style={selectStyle}>
                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              {(formations.enemy[enemyCount] || []).map((pos, i) => (
                <div key={i} onClick={() => setSelectedUnit(`e${i}`)} style={{
                  padding: '4px 6px', marginBottom: 2, borderRadius: 4, cursor: 'pointer',
                  fontSize: '0.6rem',
                  background: selectedUnit === `e${i}` ? 'rgba(239,68,68,0.15)' : 'transparent',
                  border: selectedUnit === `e${i}` ? '1px solid var(--danger)' : '1px solid transparent',
                }}>
                  <div style={{ fontWeight: 600, color: '#fca5a5' }}>Enemy {i + 1} {i === 0 ? '(Boss)' : ''}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.5rem' }}>x: {pos.x}, y: {pos.y}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    <label style={{ fontSize: '0.5rem', flex: 1 }}>
                      X: <input type="number" value={pos.x} min={0} max={100}
                        onChange={e => {
                          const next = JSON.parse(JSON.stringify(formations));
                          next.enemy[enemyCount][i].x = parseInt(e.target.value) || 0;
                          setFormations(next);
                        }}
                        style={numInputStyle} />
                    </label>
                    <label style={{ fontSize: '0.5rem', flex: 1 }}>
                      Y: <input type="number" value={pos.y} min={0} max={100}
                        onChange={e => {
                          const next = JSON.parse(JSON.stringify(formations));
                          next.enemy[enemyCount][i].y = parseInt(e.target.value) || 0;
                          setFormations(next);
                        }}
                        style={numInputStyle} />
                    </label>
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === 'sprites' && (
            <>
              <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>SPRITE SETTINGS</div>
              <SliderRow label="Sprite Size" value={spriteSize} min={80} max={400} onChange={setSpriteSize} />
              <SliderRow label="Boss Scale" value={bossScale} min={0.5} max={3} step={0.1} onChange={setBossScale} suffix="x" />

              <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, marginTop: 10, marginBottom: 4 }}>SHADOW</div>
              <SliderRow label="Offset Y" value={spriteLayout.shadow.offsetY} min={-20} max={40}
                onChange={v => setSpriteLayout(p => ({ ...p, shadow: { ...p.shadow, offsetY: v } }))} />
              <SliderRow label="Width" value={spriteLayout.shadow.width} min={10} max={100}
                onChange={v => setSpriteLayout(p => ({ ...p, shadow: { ...p.shadow, width: v } }))} />
              <SliderRow label="Height" value={spriteLayout.shadow.height} min={2} max={30}
                onChange={v => setSpriteLayout(p => ({ ...p, shadow: { ...p.shadow, height: v } }))} />

              <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, marginTop: 10, marginBottom: 4 }}>NAMEPLATE</div>
              <SliderRow label="Offset Y" value={spriteLayout.nameplate.offsetY} min={-30} max={50}
                onChange={v => setSpriteLayout(p => ({ ...p, nameplate: { ...p.nameplate, offsetY: v } }))} />

              <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, marginTop: 10, marginBottom: 4 }}>HEALTH BAR</div>
              <SliderRow label="Width" value={spriteLayout.healthBar.width} min={20} max={100}
                onChange={v => setSpriteLayout(p => ({ ...p, healthBar: { ...p.healthBar, width: v } }))} />
              <SliderRow label="Height" value={spriteLayout.healthBar.height} min={2} max={12}
                onChange={v => setSpriteLayout(p => ({ ...p, healthBar: { ...p.healthBar, height: v } }))} />

              <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, marginTop: 10, marginBottom: 4 }}>MANA BAR</div>
              <SliderRow label="Width" value={spriteLayout.manaBar.width} min={10} max={60}
                onChange={v => setSpriteLayout(p => ({ ...p, manaBar: { ...p.manaBar, width: v } }))} />
              <SliderRow label="Height" value={spriteLayout.manaBar.height} min={1} max={8}
                onChange={v => setSpriteLayout(p => ({ ...p, manaBar: { ...p.manaBar, height: v } }))} />

              <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, marginTop: 10, marginBottom: 4 }}>STAMINA BAR</div>
              <SliderRow label="Width" value={spriteLayout.staminaBar.width} min={10} max={60}
                onChange={v => setSpriteLayout(p => ({ ...p, staminaBar: { ...p.staminaBar, width: v } }))} />
              <SliderRow label="Height" value={spriteLayout.staminaBar.height} min={1} max={8}
                onChange={v => setSpriteLayout(p => ({ ...p, staminaBar: { ...p.staminaBar, height: v } }))} />

              <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, marginTop: 10, marginBottom: 4 }}>GRUDGE BAR</div>
              <SliderRow label="Width" value={spriteLayout.grudgeBar.width} min={20} max={100}
                onChange={v => setSpriteLayout(p => ({ ...p, grudgeBar: { ...p.grudgeBar, width: v } }))} />
              <SliderRow label="Height" value={spriteLayout.grudgeBar.height} min={1} max={8}
                onChange={v => setSpriteLayout(p => ({ ...p, grudgeBar: { ...p.grudgeBar, height: v } }))} />
            </>
          )}

          {tab === 'actionbar' && (
            <>
              <div style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>ACTION BAR LAYOUT</div>
              <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, marginTop: 4, marginBottom: 4 }}>PANEL WIDTHS</div>
              <SliderRow label="Left Panel" value={actionBar.leftPanelWidth} min={80} max={250}
                onChange={v => setActionBar(p => ({ ...p, leftPanelWidth: v }))} suffix="px" />
              <SliderRow label="Right Panel" value={actionBar.rightPanelWidth} min={80} max={250}
                onChange={v => setActionBar(p => ({ ...p, rightPanelWidth: v }))} suffix="px" />

              <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, marginTop: 10, marginBottom: 4 }}>PLAYER BARS (LEFT)</div>
              <SliderRow label="HP Width" value={actionBar.playerBarWidth} min={40} max={240}
                onChange={v => setActionBar(p => ({ ...p, playerBarWidth: v }))} />
              <SliderRow label="HP Height" value={actionBar.playerBarHeight} min={2} max={12}
                onChange={v => setActionBar(p => ({ ...p, playerBarHeight: v }))} />
              <SliderRow label="Mana Width" value={actionBar.playerManaWidth} min={20} max={120}
                onChange={v => setActionBar(p => ({ ...p, playerManaWidth: v }))} />
              <SliderRow label="Stamina Width" value={actionBar.playerStaminaWidth} min={20} max={120}
                onChange={v => setActionBar(p => ({ ...p, playerStaminaWidth: v }))} />
              <SliderRow label="Grudge Width" value={actionBar.playerGrudgeWidth} min={40} max={240}
                onChange={v => setActionBar(p => ({ ...p, playerGrudgeWidth: v }))} />

              <div style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, marginTop: 10, marginBottom: 4 }}>ENEMY BARS (RIGHT)</div>
              <SliderRow label="HP Width" value={actionBar.enemyBarWidth} min={40} max={240}
                onChange={v => setActionBar(p => ({ ...p, enemyBarWidth: v }))} />
              <SliderRow label="HP Height" value={actionBar.enemyBarHeight} min={2} max={12}
                onChange={v => setActionBar(p => ({ ...p, enemyBarHeight: v }))} />
              <SliderRow label="Mana Width" value={actionBar.enemyManaWidth} min={20} max={120}
                onChange={v => setActionBar(p => ({ ...p, enemyManaWidth: v }))} />
              <SliderRow label="Stamina Width" value={actionBar.enemyStaminaWidth} min={20} max={120}
                onChange={v => setActionBar(p => ({ ...p, enemyStaminaWidth: v }))} />
              <SliderRow label="Grudge Width" value={actionBar.enemyGrudgeWidth} min={40} max={240}
                onChange={v => setActionBar(p => ({ ...p, enemyGrudgeWidth: v }))} />
            </>
          )}
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          <div
            ref={arenaRef}
            style={{
              flex: 1, position: 'relative', overflow: 'hidden',
              background: '#0b1020',
            }}
          >
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${allBackgrounds[selectedBg]})`,
              backgroundSize: 'cover', backgroundPosition: 'center bottom',
              opacity: 0.7,
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(180deg, rgba(11,16,32,0.3) 0%, rgba(11,16,32,0.15) 40%, rgba(11,16,32,0.4) 100%)',
            }} />

            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.1, zIndex: 1 }}>
              {Array.from({ length: 9 }, (_, i) => (
                <React.Fragment key={i}>
                  <line x1={`${(i + 1) * 10}%`} y1="0" x2={`${(i + 1) * 10}%`} y2="100%" stroke="#f59e0b" strokeWidth="0.5" />
                  <line x1="0" y1={`${(i + 1) * 10}%`} x2="100%" y2={`${(i + 1) * 10}%`} stroke="#f59e0b" strokeWidth="0.5" />
                  <text x={`${(i + 1) * 10}%`} y="10" fill="#f59e0b" fontSize="7" textAnchor="middle">{(i + 1) * 10}%</text>
                  <text x="2" y={`${(i + 1) * 10}%`} fill="#f59e0b" fontSize="7" dominantBaseline="middle">{(i + 1) * 10}%</text>
                </React.Fragment>
              ))}
            </svg>

            {allUnits.map((unit) => {
              const pos = unit.position;
              const spriteData = getUnitSprite(unit);
              const flipSprite = unit.team === 'enemy';
              const baseFrameSize = spriteData?.frameWidth || spriteData?.frameHeight || 100;
              const isBossUnit = unit.isBoss;
              const scale = (spriteSize / baseFrameSize) * (isBossUnit ? bossScale : 1);
              const unitSpriteSize = Math.round(baseFrameSize * scale);
              const isSelected = selectedUnit === unit.id;
              const isDragging = dragging === unit.id;

              return (
                <div
                  key={unit.id}
                  onMouseDown={(e) => handleMouseDown(e, unit.id)}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: 'translate(-50%, -100%)',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    zIndex: isDragging ? 100 : Math.floor(pos.y),
                    width: unitSpriteSize,
                    height: unitSpriteSize,
                    overflow: 'visible',
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 0, left: 0,
                    width: unitSpriteSize, height: unitSpriteSize,
                    filter: isSelected
                      ? `drop-shadow(0 0 8px ${unit.team === 'player' ? 'rgba(110,231,183,0.8)' : 'rgba(239,68,68,0.8)'})`
                      : undefined,
                  }}>
                    {spriteData?.idle && (
                      <SpriteAnimation
                        src={spriteData.idle.src}
                        frameWidth={spriteData.frameWidth || 100}
                        frameHeight={spriteData.frameHeight || 100}
                        totalFrames={spriteData.idle.frames || 6}
                        fps={spriteData.idle.fps || 8}
                        scale={scale}
                        flip={flipSprite}
                        filter={spriteData.filter}
                      />
                    )}
                  </div>

                  <div style={{
                    position: 'absolute',
                    top: unitSpriteSize - 4 + spriteLayout.shadow.offsetY,
                    left: '50%', transform: 'translateX(-50%)',
                    width: spriteLayout.shadow.width,
                    height: spriteLayout.shadow.height,
                    borderRadius: '50%',
                    background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)',
                    zIndex: 1,
                  }} />

                  <div style={{
                    position: 'absolute',
                    top: unitSpriteSize + spriteLayout.nameplate.offsetY,
                    left: '50%', transform: 'translateX(-50%)',
                    textAlign: 'center',
                    background: 'rgba(0,0,0,0.65)', borderRadius: 4, padding: '2px 5px',
                    minWidth: 55, zIndex: 20,
                  }}>
                    <div style={{
                      fontSize: '0.5rem', fontWeight: 600,
                      color: unit.team === 'player' ? '#93c5fd' : '#fca5a5',
                      whiteSpace: 'nowrap', marginBottom: 1,
                    }}>{unit.name}</div>
                    <MiniBar current={unit.health} max={unit.maxHealth}
                      color={unit.team === 'player' ? '#22c55e' : '#ef4444'}
                      height={spriteLayout.healthBar.height} width={spriteLayout.healthBar.width} />
                    <div style={{ display: 'flex', gap: 2, marginTop: 1, justifyContent: 'center' }}>
                      <MiniBar current={unit.mana} max={unit.maxMana} color="#3b82f6"
                        height={spriteLayout.manaBar.height} width={spriteLayout.manaBar.width} />
                      <MiniBar current={unit.stamina} max={unit.maxStamina} color="#f59e0b"
                        height={spriteLayout.staminaBar.height} width={spriteLayout.staminaBar.width} />
                    </div>
                    {unit.team === 'player' && (
                      <div style={{ marginTop: 1 }}>
                        <MiniBar current={unit.grudge} max={100} color="#dc2626"
                          height={spriteLayout.grudgeBar.height} width={spriteLayout.grudgeBar.width} />
                      </div>
                    )}
                  </div>

                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)',
                      fontSize: '0.5rem', fontWeight: 700, whiteSpace: 'nowrap',
                      background: 'rgba(245,158,11,0.9)', color: '#0a0e1a',
                      padding: '1px 6px', borderRadius: 3,
                    }}>
                      {pos.x}, {pos.y}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div style={{
            flex: '0 0 auto',
            borderTop: '2px solid #8b7355',
            display: 'flex', flexDirection: 'row',
            background: 'rgba(8,12,24,0.95)',
            position: 'relative',
          }}>
            <div style={{
              flex: `0 0 ${actionBar.leftPanelWidth}px`,
              width: actionBar.leftPanelWidth,
              padding: '6px 6px',
              display: 'flex', flexDirection: 'column', gap: 3,
              justifyContent: 'center',
              borderRight: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              {playerUnits.map(unit => {
                const hpPct = Math.round((unit.health / unit.maxHealth) * 100);
                const hpColor = hpPct > 60 ? '#22c55e' : hpPct > 30 ? '#f59e0b' : '#ef4444';
                const grudgePct = Math.min(100, unit.grudge || 0);
                return (
                  <div key={unit.id}>
                    <div style={{
                      fontSize: '0.5rem', fontWeight: 700, color: '#93c5fd',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 1,
                    }}>{unit.name}</div>
                    <MiniBar current={unit.health} max={unit.maxHealth} color={hpColor}
                      height={actionBar.playerBarHeight} width={actionBar.playerBarWidth} />
                    <div style={{ display: 'flex', gap: 2, marginTop: 1 }}>
                      <MiniBar current={unit.mana} max={unit.maxMana} color="#3b82f6"
                        height={actionBar.playerManaHeight} width={actionBar.playerManaWidth} />
                      <MiniBar current={unit.stamina} max={unit.maxStamina} color="#f59e0b"
                        height={actionBar.playerStaminaHeight} width={actionBar.playerStaminaWidth} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 1 }}>
                      <MiniBar current={grudgePct} max={100} color="#dc2626"
                        height={actionBar.playerGrudgeHeight} width={actionBar.playerGrudgeWidth} />
                      {grudgePct >= 100 && (
                        <span style={{ fontSize: '0.4rem', color: '#ef4444', fontWeight: 800, whiteSpace: 'nowrap' }}>MAX</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              flex: 1, minWidth: 0, padding: '6px 8px',
              display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['Attack', 'Defend', 'Skip', 'Items', 'REVENGE'].map((label, i) => (
                  <div key={label} style={{
                    background: i === 4 ? 'linear-gradient(135deg, rgba(220,38,38,0.5), rgba(239,68,68,0.3))' : 'rgba(0,0,0,0.4)',
                    border: `2px solid ${i === 0 ? '#8b4444' : i === 1 ? '#445a8b' : i === 3 ? '#4a7a5a' : i === 4 ? '#ef4444' : '#5c5c6a'}`,
                    borderRadius: 4, padding: '4px 12px',
                    color: i === 0 ? '#ef4444' : i === 1 ? '#60a5fa' : i === 3 ? '#86efac' : i === 4 ? '#fca5a5' : 'rgba(180,180,200,0.8)',
                    fontSize: '0.7rem', fontWeight: 700,
                  }}>{label}</div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
                {['Slash', 'Shield Bash', 'War Cry', 'Whirlwind', 'Execute'].map((label, i) => (
                  <div key={label} style={{
                    background: 'rgba(60,45,25,0.6)',
                    border: '2px solid #8b7355',
                    borderRadius: 4, padding: '5px 10px', minWidth: 80,
                    textAlign: 'center', position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', top: -5, left: -5,
                      background: '#d4a96a', borderRadius: '50%',
                      width: 16, height: 16, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700,
                      color: '#2a1a0a',
                    }}>{i + 1}</div>
                    <div style={{ fontSize: '0.9rem' }}><InlineIcon name={['crossed_swords', 'shield', 'battle', 'portal', 'skull'][i]} size={14} /></div>
                    <div style={{ fontWeight: 600, fontSize: '0.6rem', color: '#e8dcc8' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{
              flex: `0 0 ${actionBar.rightPanelWidth}px`,
              width: actionBar.rightPanelWidth,
              padding: '6px 6px',
              display: 'flex', flexDirection: 'column', gap: 3,
              justifyContent: 'center',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              overflow: 'hidden',
            }}>
              {enemyUnits.map(unit => {
                const hpPct = Math.round((unit.health / unit.maxHealth) * 100);
                const hpColor = hpPct > 60 ? '#ef4444' : hpPct > 30 ? '#f59e0b' : '#22c55e';
                return (
                  <div key={unit.id}>
                    <div style={{
                      fontSize: '0.5rem', fontWeight: 700, color: '#fca5a5',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      marginBottom: 1, textAlign: 'right',
                    }}>{unit.name} {unit.isBoss ? '(Boss)' : ''}</div>
                    <MiniBar current={unit.health} max={unit.maxHealth} color={hpColor}
                      height={actionBar.enemyBarHeight} width={actionBar.enemyBarWidth} />
                    <div style={{ display: 'flex', gap: 2, marginTop: 1 }}>
                      <MiniBar current={unit.mana} max={unit.maxMana} color="#3b82f6"
                        height={actionBar.enemyManaHeight} width={actionBar.enemyManaWidth} />
                      <MiniBar current={unit.stamina} max={unit.maxStamina} color="#f59e0b"
                        height={actionBar.enemyStaminaHeight} width={actionBar.enemyStaminaWidth} />
                    </div>
                    {unit.isBoss && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 1 }}>
                        <MiniBar current={unit.grudge} max={100} color="#dc2626"
                          height={actionBar.enemyGrudgeHeight} width={actionBar.enemyGrudgeWidth} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderRow({ label, value, min, max, step = 1, onChange, suffix = '' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
      <span style={{ fontSize: '0.55rem', color: '#94a3b8', width: 65, flexShrink: 0 }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(step < 1 ? parseFloat(e.target.value) : parseInt(e.target.value))}
        style={{ flex: 1, height: 6, accentColor: '#f59e0b' }}
      />
      <span style={{ fontSize: '0.5rem', color: '#e2e8f0', width: 32, textAlign: 'right' }}>
        {step < 1 ? value.toFixed(1) : value}{suffix}
      </span>
    </div>
  );
}

function btnStyle(color) {
  return {
    background: `${color}22`, border: `1px solid ${color}`,
    borderRadius: 6, padding: '3px 10px', color,
    cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
  };
}

const selectStyle = {
  background: '#1e293b', border: '1px solid #334155',
  color: '#e2e8f0', borderRadius: 4, padding: '2px 4px',
  fontSize: '0.6rem', flex: 1,
};

const numInputStyle = {
  background: '#1e293b', border: '1px solid #334155',
  color: '#e2e8f0', borderRadius: 3, padding: '2px 4px',
  fontSize: '0.55rem', width: 40,
};
