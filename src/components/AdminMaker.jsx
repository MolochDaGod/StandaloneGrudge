import React, { useState, useMemo, useEffect, useCallback } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { spriteSheets, raceClassSpriteMap, namedHeroes, effectSprites } from '../data/spriteMap';

const TABS = [
  { id: 'scanner', label: 'Scanner', color: '#22c55e' },
  { id: 'sprites', label: 'Sprites', color: '#a855f7' },
  { id: 'effects', label: 'Effects', color: '#ef4444' },
  { id: 'pins', label: 'Pins', color: '#f59e0b' },
  { id: 'knowledge', label: 'Knowledge', color: '#3b82f6' },
  { id: 'usage', label: 'Usage', color: '#06b6d4' },
];

const PIN_COLORS = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'];
const RACES = ['human', 'orc', 'elf', 'undead', 'barbarian', 'dwarf'];
const CLASSES = ['warrior', 'mage', 'worge', 'ranger'];
const CAT_COLORS = { sprites: '#a855f7', effects: '#ef4444', icons: '#f59e0b', backgrounds: '#3b82f6', ui: '#22c55e', images: '#ec4899', map_nodes: '#06b6d4', attached: '#6b7280' };

function fmt(bytes) {
  if (bytes < 1024) return bytes + 'B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + 'KB';
  return (bytes / 1048576).toFixed(1) + 'MB';
}

function Badge({ text, color, onClick, active }) {
  return (
    <button onClick={onClick} style={{
      background: active ? `${color}33` : 'rgba(255,255,255,0.05)', border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`,
      color: active ? color : '#8a8d94', borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem',
      cursor: 'pointer', fontWeight: active ? 700 : 400, transition: 'all 0.15s',
    }}>{text}</button>
  );
}

function Hdr({ title, color, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.1rem', fontWeight: 700, color, margin: 0, textShadow: `0 0 15px ${color}40` }}>{title}</h2>
      {sub && <p style={{ color: '#8a8d94', fontSize: '0.65rem', marginTop: 2 }}>{sub}</p>}
      <div style={{ height: 2, background: `linear-gradient(90deg, ${color}, transparent)`, marginTop: 6 }} />
    </div>
  );
}

function loadPins() {
  try { return JSON.parse(localStorage.getItem('grudge_sprite_pins') || '[]'); } catch { return []; }
}
function savePins(p) { localStorage.setItem('grudge_sprite_pins', JSON.stringify(p)); }

export default function AdminMaker() {
  const [tab, setTab] = useState('scanner');
  const [assets, setAssets] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanSearch, setScanSearch] = useState('');
  const [scanCat, setScanCat] = useState('');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [selSprite, setSelSprite] = useState('knight');
  const [selAnim, setSelAnim] = useState('idle');
  const [speed, setSpeed] = useState(120);
  const [pins, setPins] = useState(loadPins);
  const [pinNote, setPinNote] = useState('');
  const [pinColor, setPinColor] = useState('#f59e0b');
  const [effectSearch, setEffectSearch] = useState('');

  const doScan = useCallback(() => {
    setScanLoading(true);
    fetch('/api/assets/scan')
      .then(r => r.json())
      .then(d => { setAssets(d); setScanLoading(false); })
      .catch(() => setScanLoading(false));
  }, []);

  useEffect(() => { if (tab === 'scanner' && !assets) doScan(); }, [tab, assets, doScan]);

  const spriteKeys = useMemo(() => Object.keys(spriteSheets), []);
  const curSprite = spriteSheets[selSprite];
  const anims = curSprite ? Object.keys(curSprite).filter(k => typeof curSprite[k] === 'object' && curSprite[k]?.src) : [];

  useEffect(() => { if (anims.length && !anims.includes(selAnim)) setSelAnim(anims[0] || 'idle'); }, [selSprite]);

  const filteredAssets = useMemo(() => {
    if (!assets?.assets) return [];
    let list = assets.assets;
    if (scanCat) list = list.filter(a => a.category === scanCat);
    if (scanSearch) { const s = scanSearch.toLowerCase(); list = list.filter(a => a.name.toLowerCase().includes(s) || a.path.toLowerCase().includes(s)); }
    return list.slice(0, 200);
  }, [assets, scanCat, scanSearch]);

  const addPin = useCallback((path) => {
    const np = [...pins, { path, color: pinColor, note: pinNote, ts: Date.now() }];
    setPins(np); savePins(np); setPinNote('');
  }, [pins, pinColor, pinNote]);

  const removePin = useCallback((idx) => {
    const np = pins.filter((_, i) => i !== idx);
    setPins(np); savePins(np);
  }, [pins]);

  const spriteStats = useMemo(() => {
    let totalAnims = 0, totalFrames = 0;
    const sizes = new Set();
    Object.values(spriteSheets).forEach(s => {
      Object.values(s).forEach(v => { if (v?.src) { totalAnims++; totalFrames += v.frames || 0; } });
      sizes.add(`${s.frameWidth || 100}x${s.frameHeight || 100}`);
    });
    return { sheets: spriteKeys.length, totalAnims, totalFrames, sizes: [...sizes] };
  }, [spriteKeys]);

  const spriteFolders = useMemo(() => {
    const folders = new Set();
    Object.values(spriteSheets).forEach(s => { if (s.folder) folders.add(s.folder); });
    return folders;
  }, []);

  const effectKeys = useMemo(() => Object.keys(effectSprites || {}), []);
  const filteredEffects = useMemo(() => {
    if (!effectSearch) return effectKeys;
    const s = effectSearch.toLowerCase();
    return effectKeys.filter(k => k.toLowerCase().includes(s));
  }, [effectKeys, effectSearch]);

  const renderScanner = () => (
    <div>
      <Hdr title="Asset Scanner" color="#22c55e" sub={assets ? `${assets.total} assets found` : 'Scan filesystem for all game assets'} />
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={doScan} style={{
          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e',
          borderRadius: 6, padding: '4px 14px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600,
        }}>{scanLoading ? 'Scanning...' : '⟳ Scan'}</button>
        <input value={scanSearch} onChange={e => setScanSearch(e.target.value)} placeholder="Search assets..."
          style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 6, padding: '4px 10px', color: '#e2e8f0', fontSize: '0.65rem', flex: 1, minWidth: 140 }} />
      </div>
      {assets?.summary && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <Badge text={`All (${assets.total})`} color="#ffd700" onClick={() => setScanCat('')} active={!scanCat} />
          {Object.entries(assets.summary).map(([cat, n]) => (
            <Badge key={cat} text={`${cat} (${n})`} color={CAT_COLORS[cat] || '#888'} onClick={() => setScanCat(scanCat === cat ? '' : cat)} active={scanCat === cat} />
          ))}
        </div>
      )}
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1, maxHeight: 520, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 6 }}>
            {filteredAssets.map((a, i) => (
              <div key={i} onClick={() => setSelectedAsset(a)} style={{
                background: selectedAsset?.path === a.path ? 'rgba(255,215,0,0.1)' : 'rgba(20,15,30,0.5)',
                border: `1px solid ${selectedAsset?.path === a.path ? 'rgba(255,215,0,0.4)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 6, padding: 6, cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <div style={{ width: '100%', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', borderRadius: 4, marginBottom: 4 }}>
                  <img src={a.path} alt="" style={{ maxWidth: '100%', maxHeight: 64, imageRendering: 'pixelated', objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
                </div>
                <div style={{ fontSize: '0.55rem', color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name}</div>
                <div style={{ fontSize: '0.5rem', color: '#6b7280' }}>{fmt(a.size)}</div>
              </div>
            ))}
          </div>
          {filteredAssets.length >= 200 && <div style={{ fontSize: '0.6rem', color: '#6b7280', textAlign: 'center', marginTop: 8 }}>Showing first 200 results...</div>}
        </div>
        {selectedAsset && (
          <div style={{ width: 240, background: 'rgba(20,15,30,0.6)', border: '1px solid rgba(255,215,0,0.15)', borderRadius: 8, padding: 12, flexShrink: 0 }}>
            <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
              <img src={selectedAsset.path} alt="" style={{ maxWidth: '100%', maxHeight: 160, imageRendering: 'pixelated' }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: '#ffd700', fontWeight: 600, marginBottom: 4, wordBreak: 'break-all' }}>{selectedAsset.name}</div>
            <div style={{ fontSize: '0.6rem', color: '#8a8d94', marginBottom: 2 }}>{selectedAsset.dir}</div>
            <div style={{ fontSize: '0.6rem', color: '#8a8d94', marginBottom: 2 }}>Size: {fmt(selectedAsset.size)}</div>
            <div style={{ fontSize: '0.6rem', color: CAT_COLORS[selectedAsset.category] || '#888', marginBottom: 8 }}>Category: {selectedAsset.category}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {PIN_COLORS.map(c => (
                <button key={c} onClick={() => setPinColor(c)} style={{
                  width: 16, height: 16, borderRadius: '50%', background: c, border: pinColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer',
                }} />
              ))}
            </div>
            <input value={pinNote} onChange={e => setPinNote(e.target.value)} placeholder="Pin note..." style={{
              width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,215,0,0.1)', borderRadius: 4, padding: '3px 6px', color: '#e2e8f0', fontSize: '0.6rem', marginTop: 6,
            }} />
            <button onClick={() => addPin(selectedAsset.path)} style={{
              width: '100%', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.3)', color: '#ffd700',
              borderRadius: 4, padding: '4px 0', fontSize: '0.6rem', cursor: 'pointer', fontWeight: 600, marginTop: 6,
            }}>📌 Pin Asset</button>
          </div>
        )}
      </div>
    </div>
  );

  const renderSprites = () => (
    <div>
      <Hdr title="Sprite Browser" color="#a855f7" sub={`${spriteStats.sheets} sheets · ${spriteStats.totalAnims} animations · ${spriteStats.totalFrames} frames`} />
      <div style={{ display: 'flex', gap: 12, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={selSprite} onChange={e => setSelSprite(e.target.value)} style={{
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 6, padding: '4px 8px',
          color: '#c4b5fd', fontSize: '0.65rem', minWidth: 160,
        }}>
          {spriteKeys.map(k => <option key={k} value={k}>{k}</option>)}
        </select>
        <select value={selAnim} onChange={e => setSelAnim(e.target.value)} style={{
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 6, padding: '4px 8px',
          color: '#c4b5fd', fontSize: '0.65rem',
        }}>
          {anims.map(a => <option key={a} value={a}>{a} ({curSprite[a]?.frames}f)</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.6rem', color: '#8a8d94' }}>Speed:</span>
          <input type="range" min={40} max={300} value={speed} onChange={e => setSpeed(+e.target.value)} style={{ width: 80 }} />
          <span style={{ fontSize: '0.6rem', color: '#c4b5fd' }}>{speed}ms</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 200, minHeight: 200, border: '1px solid rgba(168,85,247,0.15)' }}>
          {curSprite && <SpriteAnimation spriteData={curSprite} animation={selAnim} scale={3} speed={speed} containerless={false} />}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: '0.7rem', color: '#ffd700', fontWeight: 600, marginBottom: 8 }}>Sheet Metadata</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: '0.6rem' }}>
            {curSprite && [
              ['Folder', curSprite.folder || '—'],
              ['Frame Size', `${curSprite.frameWidth || 100}×${curSprite.frameHeight || 100}`],
              ['Faces Left', curSprite.facesLeft ? '✓ Yes' : 'No'],
              ['Filter', curSprite.filter || 'none'],
              ['Scale', curSprite.scale || 1],
              ['Dwarf Transform', curSprite.dwarfTransform || 'none'],
              ['Animations', anims.length],
              ['Total Frames', anims.reduce((s, a) => s + (curSprite[a]?.frames || 0), 0)],
            ].map(([k, v]) => (
              <React.Fragment key={k}>
                <span style={{ color: '#8a8d94' }}>{k}:</span>
                <span style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{String(v)}</span>
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: '0.6rem', color: '#8a8d94' }}>
            <div style={{ color: '#c4b5fd', fontWeight: 600, marginBottom: 4 }}>Animation Strips:</div>
            {anims.map(a => (
              <div key={a} onClick={() => setSelAnim(a)} style={{
                padding: '2px 6px', cursor: 'pointer', borderRadius: 3,
                background: selAnim === a ? 'rgba(168,85,247,0.15)' : 'transparent',
                color: selAnim === a ? '#c4b5fd' : '#8a8d94',
              }}>{a}: {curSprite[a]?.frames}f — {curSprite[a]?.src}</div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: '0.7rem', color: '#ffd700', fontWeight: 600, marginBottom: 8 }}>Race/Class Sprite Map</div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', fontSize: '0.6rem', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '4px 8px', color: '#8a8d94', textAlign: 'left', borderBottom: '1px solid rgba(255,215,0,0.1)' }}>Race</th>
                {CLASSES.map(c => <th key={c} style={{ padding: '4px 8px', color: '#c4b5fd', borderBottom: '1px solid rgba(255,215,0,0.1)' }}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {RACES.map(r => (
                <tr key={r}>
                  <td style={{ padding: '4px 8px', color: '#ffd700', fontWeight: 600 }}>{r}</td>
                  {CLASSES.map(c => {
                    const sprite = raceClassSpriteMap[r]?.[c];
                    const folder = sprite?.folder || '—';
                    const hasFilter = !!sprite?.filter;
                    return (
                      <td key={c} style={{ padding: '4px 8px', color: hasFilter ? '#f59e0b' : '#e2e8f0', cursor: sprite ? 'pointer' : 'default' }}
                        onClick={() => { if (sprite?.folder) { const k = spriteKeys.find(sk => spriteSheets[sk].folder === sprite.folder); if (k) setSelSprite(k); } }}>
                        {folder}{hasFilter && ' 🎨'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderEffects = () => (
    <div>
      <Hdr title="Effects Browser" color="#ef4444" sub={`${effectKeys.length} effect sprites defined in spriteMap`} />
      <input value={effectSearch} onChange={e => setEffectSearch(e.target.value)} placeholder="Search effects..."
        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '4px 10px', color: '#e2e8f0', fontSize: '0.65rem', marginBottom: 12, width: 220 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, maxHeight: 500, overflow: 'auto' }}>
        {filteredEffects.map(k => {
          const e = effectSprites[k];
          return (
            <div key={k} style={{ background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 6, padding: 8 }}>
              <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'rgba(0,0,0,0.3)', borderRadius: 4, marginBottom: 4 }}>
                <img src={e.src} alt="" style={{ maxHeight: 56, maxWidth: '100%', imageRendering: 'pixelated', objectFit: 'contain' }} onError={ev => { ev.target.style.display = 'none'; }} />
              </div>
              <div style={{ fontSize: '0.6rem', color: '#fca5a5', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k}</div>
              <div style={{ fontSize: '0.5rem', color: '#6b7280' }}>
                {e.frames}f {e.frameW ? `${e.frameW}×${e.frameH}` : e.size ? `grid ${Math.sqrt(e.frames)|0}×${Math.sqrt(e.frames)|0}` : ''}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPins = () => (
    <div>
      <Hdr title="Pins & Annotations" color="#f59e0b" sub={`${pins.length} pinned assets`} />
      {pins.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', fontSize: '0.7rem' }}>
          No pinned assets yet. Use the Scanner to browse and pin assets.
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {pins.map((p, i) => (
          <div key={i} style={{
            display: 'flex', gap: 10, alignItems: 'center', background: 'rgba(20,15,30,0.5)',
            border: `1px solid ${p.color}33`, borderLeft: `3px solid ${p.color}`, borderRadius: 6, padding: 8,
          }}>
            <div style={{ width: 56, height: 56, background: 'rgba(0,0,0,0.3)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <img src={p.path} alt="" style={{ maxWidth: 52, maxHeight: 52, imageRendering: 'pixelated' }} onError={e => { e.target.style.display = 'none'; }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.65rem', color: '#e2e8f0', fontWeight: 600, wordBreak: 'break-all' }}>{p.path}</div>
              {p.note && <div style={{ fontSize: '0.6rem', color: '#8a8d94', marginTop: 2 }}>{p.note}</div>}
              <div style={{ fontSize: '0.5rem', color: '#6b7280', marginTop: 2 }}>{new Date(p.ts).toLocaleDateString()}</div>
            </div>
            <button onClick={() => removePin(i)} style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444',
              borderRadius: 4, padding: '2px 8px', fontSize: '0.6rem', cursor: 'pointer', flexShrink: 0,
            }}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderKnowledge = () => (
    <div style={{ maxHeight: 560, overflow: 'auto' }}>
      <Hdr title="Knowledge Base" color="#3b82f6" sub="Architecture, golden rules, AI prompts, filters" />
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 700, marginBottom: 6 }}>🏗 Architecture</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.6rem' }}>
          {[
            ['Data Flow', 'spriteMap.js → raceClassSpriteMap → getPlayerSprite() → SpriteAnimation → Equipment Overlays'],
            ['Rendering', 'Containerless: width:0, height:0, overflow:visible. Bottom-center anchor. Never pushes UI.'],
            ['Z-Index', 'BG 1-49 → Map 50-99 → Chars 100-199 → VFX 200-300 → UI 10500 → Modals 10501+'],
            ['Scaling', 'All sprites scale to 200px display height via frameHeight. No per-combo overrides.'],
          ].map(([t, d]) => (
            <div key={t} style={{ background: 'rgba(59,130,246,0.08)', borderRadius: 6, padding: 8, border: '1px solid rgba(59,130,246,0.12)' }}>
              <div style={{ color: '#93c5fd', fontWeight: 600, marginBottom: 2 }}>{t}</div>
              <div style={{ color: '#9ca3af', lineHeight: 1.4 }}>{d}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', color: '#ffd700', fontWeight: 700, marginBottom: 6 }}>⚔ Golden Rules</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4, fontSize: '0.6rem' }}>
          {[
            ['Containerless Default', 'Sprites render w:0 h:0 overflow:visible. Never push UI. Admin panels use containerless={false}.'],
            ['Bottom-Center Anchor', 'All sprites anchor bottom-center via transform: translate(-50%, -100%).'],
            ['Horizontal Strip Format', 'Each anim = single horizontal PNG strip. Frame 0 left, animate via backgroundPosition.'],
            ['Frame Math', 'imageWidth / frameWidth = frames. Mismatch = visual glitch. Always verify with identify.'],
            ['200px Target Height', 'All battle sprites scale to 200px: displayScale = 200 / frameHeight. No per-combo overrides.'],
            ['Flip Logic', 'facesLeft ? team===player : team===enemy. Ensures all units face opponents.'],
            ['Min 80px', 'All sprites must be minimum 80px display height anywhere in the game.'],
            ['Projectile Direction', 'All projectile shapes face RIGHT. atan2(dy,dx) handles rotation for both directions. Never add +180.'],
            ['Race Recoloring', 'CSS filter chains (hue-rotate, saturate, brightness) recolor base sprites for races.'],
            ['Effects Separate', 'VFX are separate sheets in dist/effects/. Overlay above chars via z-index. Never bake into char sheets.'],
          ].map(([t, d]) => (
            <div key={t} style={{ padding: '4px 8px', borderLeft: '2px solid #ffd700', background: 'rgba(255,215,0,0.04)' }}>
              <span style={{ color: '#ffd700', fontWeight: 600 }}>{t}: </span>
              <span style={{ color: '#9ca3af' }}>{d}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700, marginBottom: 6 }}>⚔ Melee Hit Effects (dist/effects/slash/)</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6, fontSize: '0.55rem' }}>
          {[
            ['Slash SM', '256x32 (8×32x32)', 'blue, green, orange, purple, red', '5 colors'],
            ['Slash MD', '512x64 (8×64x64)', 'blue, green, orange, purple, red', '5 colors'],
            ['Slash LG', '768x96 (8×96x96)', 'blue, green, orange, purple, red', '5 colors'],
            ['Demon Slash', '336x48 (7×48x48)', 'demon_slash_1/2/3', '3 dark variants'],
          ].map(([name, dims, colors, note]) => (
            <div key={name} style={{ background: 'rgba(239,68,68,0.06)', borderRadius: 4, padding: 6, border: '1px solid rgba(239,68,68,0.1)' }}>
              <div style={{ color: '#f87171', fontWeight: 600 }}>{name}</div>
              <div style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: '0.5rem' }}>{dims}</div>
              <div style={{ color: '#6b7280', fontSize: '0.48rem' }}>{colors} ({note})</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 700, marginBottom: 6 }}>✦ Effect Asset Map</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: '0.55rem' }}>
          {[
            ['Beams (5)', 'dist/effects/beams/', '1024x128 each', 'blue, green, orange, purple, red'],
            ['Retro Impacts (30+)', 'dist/effects/retro_impact/', '576x384 (6×4 grid, 96×96)', '14 colors × 2 variants + 6 retro'],
            ['Bullet Impacts (5)', 'dist/effects/bullet_impact/', 'Various sizes', 'blue, green, purple, red, yellow'],
            ['Custom Effects (14)', 'dist/effects/custom/', 'Various sizes', 'arcanebolt, flamestrike, frostbolt, frozen, etc.'],
            ['Pixel Sheets (20)', 'dist/effects/pixel/', '600-1100px square grids', 'weaponhit, fire, nebula, vortex, phantom, etc.'],
            ['Root Effects (20+)', 'dist/effects/', 'Various sizes', 'fire_explosion, heal, hit_effect, holy, thunder, wind, tornado'],
          ].map(([name, path, dims, desc]) => (
            <div key={name} style={{ background: 'rgba(59,130,246,0.06)', borderRadius: 4, padding: 6, border: '1px solid rgba(59,130,246,0.1)' }}>
              <div style={{ color: '#60a5fa', fontWeight: 600 }}>{name}</div>
              <div style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: '0.48rem' }}>{path}</div>
              <div style={{ color: '#6b7280', fontSize: '0.48rem' }}>{dims} — {desc}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', color: '#ec4899', fontWeight: 700, marginBottom: 6 }}>🤖 AI Sprite Generation Prompt</div>
        <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 6, padding: 10, fontSize: '0.58rem', color: '#a0e8b0', fontFamily: "'Fira Code', monospace", lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
{`Create pixel art sprite sheet for [RACE] [CLASS] dark fantasy RPG.
- Single horizontal PNG strip per animation
- Frame size: [W]x[H]px, transparent BG, character faces RIGHT
- Bottom-aligned, consistent silhouette
Animations: idle (4-6f), run (6-8f), attack1 (6-9f), attack2 (8-12f), hurt (2-4f), death (4-7f)
Style: Dark fantasy, ornate armor, glowing runes, clear silhouette at 50-100px
Color palette must support CSS filter recoloring for racial variants`}
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 700, marginBottom: 6 }}>🦴 Skeleton Bones (16-joint rig)</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, fontSize: '0.55rem' }}>
          {[
            { name: 'spine', color: '#00CCFF' }, { name: 'neck', color: '#FF4444' },
            { name: 'shoulderL/R', color: '#FF8800' }, { name: 'upperArmL/R', color: '#FFCC00' },
            { name: 'forearmL/R', color: '#88FF00' }, { name: 'thighL/R', color: '#8844FF' },
            { name: 'shinL/R', color: '#FF44CC' }, { name: 'weapon', color: '#FF0000' },
          ].map(b => (
            <span key={b.name} style={{ background: `${b.color}20`, border: `1px solid ${b.color}40`, color: b.color, padding: '2px 6px', borderRadius: 3 }}>{b.name}</span>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, marginBottom: 6 }}>🎨 Filter Recipes</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6, fontSize: '0.55rem' }}>
          {[
            ['Orc Green', 'hue-rotate(90deg) saturate(1.4) brightness(1.05)'],
            ['Elf Mystical', 'hue-rotate(90deg) saturate(1.3) brightness(1.1)'],
            ['Undead Ghastly', 'hue-rotate(180deg) saturate(0.6) brightness(0.7)'],
            ['Barbarian Weathered', 'sepia(0.5) saturate(1.5) brightness(0.9)'],
            ['Undead Inverted', 'invert(0.85) hue-rotate(180deg) saturate(1.4)'],
            ['Grayscale', 'saturate(0) brightness(0.7) contrast(1.2)'],
          ].map(([label, filter]) => (
            <div key={label} style={{ background: 'rgba(245,158,11,0.06)', borderRadius: 4, padding: 6, border: '1px solid rgba(245,158,11,0.1)' }}>
              <div style={{ color: '#fbbf24', fontWeight: 600 }}>{label}</div>
              <div style={{ color: '#9ca3af', fontFamily: 'monospace', fontSize: '0.5rem' }}>{filter}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderUsage = () => {
    const diskFolders = assets?.assets ? [...new Set(assets.assets.filter(a => a.category === 'sprites').map(a => {
      const parts = a.dir.replace(/^\/sprites\//, '').split('/');
      return parts[0];
    }).filter(Boolean))] : [];
    const activeFolders = [...spriteFolders];
    const orphaned = diskFolders.filter(f => !activeFolders.some(af => af === f || af.startsWith(f + '/') || f.startsWith(af)));
    const active = diskFolders.filter(f => activeFolders.some(af => af === f || af.startsWith(f + '/') || f.startsWith(af)));

    return (
      <div>
        <Hdr title="Usage Tracker" color="#06b6d4" sub={`${active.length} active · ${orphaned.length} orphaned sprite folders`} />
        {!assets && <div style={{ fontSize: '0.65rem', color: '#6b7280', padding: 20 }}>Run the Scanner first to populate filesystem data.</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: '0.6rem' }}>
          <div>
            <div style={{ color: '#22c55e', fontWeight: 700, marginBottom: 6 }}>✓ Active ({active.length})</div>
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {active.sort().map(f => (
                <div key={f} style={{ padding: '2px 6px', borderLeft: '2px solid #22c55e', marginBottom: 2, color: '#9ca3af' }}>{f}</div>
              ))}
            </div>
          </div>
          <div>
            <div style={{ color: '#ef4444', fontWeight: 700, marginBottom: 6 }}>✗ Orphaned ({orphaned.length})</div>
            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {orphaned.sort().map(f => (
                <div key={f} style={{ padding: '2px 6px', borderLeft: '2px solid #ef4444', marginBottom: 2, color: '#9ca3af' }}>{f}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ padding: 16, fontFamily: "'Jost', sans-serif", color: '#e2e8f0', minHeight: 'calc(100vh - 60px)', background: 'rgba(10,10,20,0.3)' }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, flexWrap: 'wrap', background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 4 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? `${t.color}22` : 'transparent',
            border: tab === t.id ? `1px solid ${t.color}55` : '1px solid transparent',
            borderBottom: tab === t.id ? `2px solid ${t.color}` : '2px solid transparent',
            color: tab === t.id ? t.color : '#6b7280', borderRadius: 6, padding: '6px 14px',
            fontSize: '0.7rem', cursor: 'pointer', fontWeight: tab === t.id ? 700 : 400,
            fontFamily: "'Cinzel', serif", transition: 'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>
      {tab === 'scanner' && renderScanner()}
      {tab === 'sprites' && renderSprites()}
      {tab === 'effects' && renderEffects()}
      {tab === 'pins' && renderPins()}
      {tab === 'knowledge' && renderKnowledge()}
      {tab === 'usage' && renderUsage()}
    </div>
  );
}
