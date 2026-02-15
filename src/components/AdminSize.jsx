import React, { useState, useMemo, useCallback } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { SPRITE_REGISTRY, CATEGORY_META, getAnimationKeys, searchRegistry, getRegistryStats } from '../data/spriteRegistry';

const CONTEXTS = [
  { key: 'map', label: 'Map', storageKey: 'adminSize_map' },
  { key: 'battle', label: 'Battle', storageKey: 'adminSize_battle' },
  { key: 'scenes', label: 'Scenes', storageKey: 'adminSize_scenes' },
];

export function getSpriteOverrides(context) {
  try {
    const ctx = CONTEXTS.find(c => c.key === context);
    if (!ctx) return {};
    const raw = localStorage.getItem(ctx.storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

const ANIM_COLORS = {
  idle: '#22c55e', walk: '#3b82f6', run: '#06b6d4',
  attack1: '#ef4444', attack2: '#f97316', attack3: '#f59e0b', attack: '#ef4444',
  hurt: '#ec4899', death: '#6b7280', jump: '#8b5cf6', fall: '#a855f7',
  roll: '#14b8a6', doublejump: '#7c3aed', land: '#64748b', wallslide: '#475569',
  attack1_effect: '#fbbf24', attack2_effect: '#fb923c', attack3_effect: '#f87171',
  cast: '#06b6d4', heal: '#22c55e', block: '#94a3b8', charge: '#eab308',
  surf: '#38bdf8', slide: '#7dd3fc', special: '#d946ef',
};

function buildFilterString(hue, sat, bright, contrast, sepia) {
  const parts = [];
  if (hue !== 0) parts.push(`hue-rotate(${hue}deg)`);
  if (sat !== 1) parts.push(`saturate(${sat})`);
  if (bright !== 1) parts.push(`brightness(${bright})`);
  if (contrast !== 1) parts.push(`contrast(${contrast})`);
  if (sepia !== 0) parts.push(`sepia(${sepia})`);
  return parts.join(' ');
}

function parseFilter(filterStr) {
  const result = { hue: 0, sat: 1, bright: 1, contrast: 1, sepia: 0 };
  if (!filterStr) return result;
  const hueMatch = filterStr.match(/hue-rotate\(([\d.-]+)deg\)/);
  const satMatch = filterStr.match(/saturate\(([\d.]+)\)/);
  const brightMatch = filterStr.match(/brightness\(([\d.]+)\)/);
  const contrastMatch = filterStr.match(/contrast\(([\d.]+)\)/);
  const sepiaMatch = filterStr.match(/sepia\(([\d.]+)\)/);
  if (hueMatch) result.hue = parseFloat(hueMatch[1]);
  if (satMatch) result.sat = parseFloat(satMatch[1]);
  if (brightMatch) result.bright = parseFloat(brightMatch[1]);
  if (contrastMatch) result.contrast = parseFloat(contrastMatch[1]);
  if (sepiaMatch) result.sepia = parseFloat(sepiaMatch[1]);
  return result;
}

function loadContext(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveContext(storageKey, data) {
  localStorage.setItem(storageKey, JSON.stringify(data));
}

export default function AdminSize({ onClose }) {
  const [activeContext, setActiveContext] = useState('map');
  const [contextData, setContextData] = useState(() => {
    const data = {};
    for (const ctx of CONTEXTS) {
      data[ctx.key] = loadContext(ctx.storageKey);
    }
    return data;
  });
  const [selectedUid, setSelectedUid] = useState(null);
  const [selectedAnim, setSelectedAnim] = useState('idle');
  const [editScale, setEditScale] = useState(1.0);
  const [editHue, setEditHue] = useState(0);
  const [editSat, setEditSat] = useState(1);
  const [editBright, setEditBright] = useState(1);
  const [editContrast, setEditContrast] = useState(1);
  const [editSepia, setEditSepia] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showModifiedOnly, setShowModifiedOnly] = useState(false);
  const [copiedUid, setCopiedUid] = useState('');

  const stats = useMemo(() => getRegistryStats(), []);
  const currentData = contextData[activeContext] || {};

  const filteredSprites = useMemo(() => {
    let results = searchQuery ? searchRegistry(searchQuery) : [...SPRITE_REGISTRY];
    if (filterCategory !== 'all') {
      results = results.filter(e => e.category === filterCategory);
    }
    if (showModifiedOnly) {
      results = results.filter(e => currentData[e.uid]);
    }
    return results;
  }, [searchQuery, filterCategory, showModifiedOnly, currentData]);

  const groupedSprites = useMemo(() => {
    const groups = {};
    for (const sprite of filteredSprites) {
      const cat = sprite.category;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(sprite);
    }
    return groups;
  }, [filteredSprites]);

  const getSpriteOverride = useCallback((uid) => {
    return currentData[uid] || { scale: 1.0, filter: '' };
  }, [currentData]);

  const selectSprite = useCallback((uid) => {
    setSelectedUid(uid);
    setSelectedAnim('idle');
    const override = currentData[uid] || { scale: 1.0, filter: '' };
    setEditScale(override.scale);
    const parsed = parseFilter(override.filter);
    setEditHue(parsed.hue);
    setEditSat(parsed.sat);
    setEditBright(parsed.bright);
    setEditContrast(parsed.contrast);
    setEditSepia(parsed.sepia);
  }, [currentData]);

  const handleSave = useCallback(() => {
    if (!selectedUid) return;
    const filter = buildFilterString(editHue, editSat, editBright, editContrast, editSepia);
    const newData = {
      ...contextData,
      [activeContext]: {
        ...contextData[activeContext],
        [selectedUid]: { scale: editScale, filter },
      },
    };
    setContextData(newData);
    const ctx = CONTEXTS.find(c => c.key === activeContext);
    if (ctx) saveContext(ctx.storageKey, newData[activeContext]);
  }, [selectedUid, editScale, editHue, editSat, editBright, editContrast, editSepia, activeContext, contextData]);

  const handleReset = useCallback(() => {
    if (!selectedUid) return;
    const newCtxData = { ...contextData[activeContext] };
    delete newCtxData[selectedUid];
    const newData = { ...contextData, [activeContext]: newCtxData };
    setContextData(newData);
    const ctx = CONTEXTS.find(c => c.key === activeContext);
    if (ctx) saveContext(ctx.storageKey, newCtxData);
    setEditScale(1.0);
    setEditHue(0);
    setEditSat(1);
    setEditBright(1);
    setEditContrast(1);
    setEditSepia(0);
  }, [selectedUid, activeContext, contextData]);

  const copyUid = useCallback((uid) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(''), 1500);
  }, []);

  const selectedEntry = SPRITE_REGISTRY.find(s => s.uid === selectedUid);
  const editFilter = buildFilterString(editHue, editSat, editBright, editContrast, editSepia);
  const modifiedCount = Object.keys(currentData).length;
  const categoryOrder = ['hero', 'enemy', 'boss', 'transform', 'npc', 'sheet', 'secret', 'effect'];

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'rgba(15,10,25,0.95)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Jost', sans-serif", color: '#e2e8f0',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid rgba(255,215,0,0.2)',
        background: 'rgba(10,8,20,0.9)',
        flexShrink: 0, flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '1rem', fontWeight: 800,
            textShadow: '0 0 12px rgba(255,215,0,0.3)',
          }}>
            Sprite Registry
          </span>
          <div style={{
            display: 'flex', gap: 4, fontSize: '0.6rem', color: '#6b7280',
            background: 'rgba(20,15,30,0.8)', padding: '3px 8px', borderRadius: 12,
          }}>
            <span style={{ color: '#ffd700' }}>{stats.total}</span> sprites
            <span style={{ color: '#94a3b8' }}>|</span>
            <span style={{ color: '#3b82f6' }}>{stats.totalAnimations}</span> anims
            <span style={{ color: '#94a3b8' }}>|</span>
            <span style={{ color: '#22c55e' }}>{stats.totalFrames}</span> frames
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {CONTEXTS.map(ctx => (
              <button
                key={ctx.key}
                onClick={() => setActiveContext(ctx.key)}
                style={{
                  padding: '4px 14px', borderRadius: 16,
                  border: activeContext === ctx.key ? '1px solid #ffd700' : '1px solid rgba(255,215,0,0.15)',
                  background: activeContext === ctx.key ? '#ffd700' : 'rgba(20,15,30,0.8)',
                  color: activeContext === ctx.key ? '#0a0a14' : '#6b7280',
                  fontWeight: 700, fontSize: '0.65rem', cursor: 'pointer',
                  fontFamily: "'Cinzel', serif",
                }}
              >
                {ctx.label}
              </button>
            ))}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%',
            border: '1px solid rgba(255,215,0,0.3)',
            background: 'rgba(20,15,30,0.8)',
            color: '#ffd700', fontSize: '1rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>X</button>
        )}
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
        borderBottom: '1px solid rgba(255,215,0,0.1)',
        background: 'rgba(10,8,20,0.6)', flexShrink: 0, flexWrap: 'wrap',
      }}>
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by name, UID, tag..."
            style={{
              width: '100%', padding: '6px 10px 6px 28px', borderRadius: 6,
              border: '1px solid rgba(255,215,0,0.15)', background: 'rgba(20,15,30,0.8)',
              color: '#e2e8f0', fontSize: '0.7rem', outline: 'none',
              fontFamily: "'Jost', sans-serif",
            }}
          />
          <span style={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.7rem', color: '#6b7280', pointerEvents: 'none',
          }}>Q</span>
        </div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterCategory('all')}
            style={{
              padding: '3px 10px', borderRadius: 12, fontSize: '0.6rem', fontWeight: 600,
              border: filterCategory === 'all' ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.08)',
              background: filterCategory === 'all' ? 'rgba(255,215,0,0.15)' : 'rgba(20,15,30,0.6)',
              color: filterCategory === 'all' ? '#ffd700' : '#6b7280', cursor: 'pointer',
            }}
          >All ({stats.total})</button>
          {categoryOrder.map(cat => {
            const meta = CATEGORY_META[cat];
            if (!meta) return null;
            const count = stats.categories[cat] || 0;
            if (count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: '3px 10px', borderRadius: 12, fontSize: '0.6rem', fontWeight: 600,
                  border: filterCategory === cat ? `1px solid ${meta.color}` : '1px solid rgba(255,255,255,0.08)',
                  background: filterCategory === cat ? `${meta.color}22` : 'rgba(20,15,30,0.6)',
                  color: filterCategory === cat ? meta.color : '#6b7280', cursor: 'pointer',
                }}
              >{meta.label} ({count})</button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            onClick={() => setShowModifiedOnly(!showModifiedOnly)}
            style={{
              padding: '3px 10px', borderRadius: 12, fontSize: '0.6rem', fontWeight: 600,
              border: showModifiedOnly ? '1px solid #f59e0b' : '1px solid rgba(255,255,255,0.08)',
              background: showModifiedOnly ? 'rgba(245,158,11,0.15)' : 'rgba(20,15,30,0.6)',
              color: showModifiedOnly ? '#f59e0b' : '#6b7280', cursor: 'pointer',
            }}
          >Modified ({modifiedCount})</button>
          <button
            onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
            style={{
              padding: '3px 10px', borderRadius: 12, fontSize: '0.6rem', fontWeight: 600,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(20,15,30,0.6)',
              color: '#94a3b8', cursor: 'pointer',
            }}
          >{viewMode === 'grid' ? 'List' : 'Grid'}</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{
          flex: selectedEntry ? '0 0 55%' : '1 1 100%',
          overflowY: 'auto', padding: '10px 14px',
          transition: 'flex 0.2s',
        }}>
          {filteredSprites.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', fontSize: '0.8rem' }}>
              No sprites match your search
            </div>
          )}
          {categoryOrder.map(cat => {
            const sprites = groupedSprites[cat];
            if (!sprites || sprites.length === 0) return null;
            const meta = CATEGORY_META[cat] || { label: cat, color: '#94a3b8' };
            return (
              <div key={cat} style={{ marginBottom: 14 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
                }}>
                  <div style={{
                    width: 3, height: 16, borderRadius: 2, background: meta.color,
                  }} />
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 700, color: meta.color,
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    fontFamily: "'Cinzel', serif",
                  }}>{meta.label} ({sprites.length})</span>
                </div>
                {viewMode === 'grid' ? (
                  <div style={{
                    display: 'flex', flexWrap: 'wrap', gap: 6,
                  }}>
                    {sprites.map(entry => {
                      const override = getSpriteOverride(entry.uid);
                      const isSelected = selectedUid === entry.uid;
                      const isModified = !!currentData[entry.uid];
                      const baseScale = (70 / (entry.frameHeight || 100)) * (override.scale || 1);
                      const spriteDataWithFilter = override.filter
                        ? { ...entry.spriteData, filter: override.filter }
                        : entry.spriteData;
                      return (
                        <div
                          key={entry.uid}
                          onClick={() => selectSprite(entry.uid)}
                          style={{
                            width: 105, minWidth: 105,
                            background: isSelected ? 'rgba(255,215,0,0.08)' : 'rgba(20,15,30,0.7)',
                            border: isSelected ? '2px solid #ffd700' : isModified ? `1px solid ${meta.color}55` : '1px solid rgba(255,215,0,0.06)',
                            borderRadius: 6, padding: 6,
                            cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            boxShadow: isSelected ? '0 0 10px rgba(255,215,0,0.2)' : 'none',
                            transition: 'all 0.12s',
                            position: 'relative',
                          }}
                        >
                          {isModified && (
                            <div style={{
                              position: 'absolute', top: 3, right: 3,
                              width: 6, height: 6, borderRadius: '50%',
                              background: '#f59e0b',
                            }} />
                          )}
                          <div style={{
                            height: 65, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                            overflow: 'hidden',
                          }}>
                            <SpriteAnimation
                              spriteData={spriteDataWithFilter}
                              animation={isSelected ? selectedAnim : 'idle'}
                              scale={baseScale}
                              loop={true}
                              speed={150}
                              containerless={false}
                            />
                          </div>
                          <div style={{
                            fontSize: '0.5rem', color: '#c4b998', textAlign: 'center',
                            marginTop: 3, lineHeight: 1.2,
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', width: '100%', fontWeight: 600,
                          }}>{entry.name}</div>
                          <div style={{
                            fontSize: '0.4rem', color: '#4a5568', marginTop: 1,
                            fontFamily: 'monospace',
                            overflow: 'hidden', textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap', width: '100%', textAlign: 'center',
                          }}>{entry.uid}</div>
                          <div style={{
                            display: 'flex', gap: 4, marginTop: 2, alignItems: 'center',
                          }}>
                            <span style={{ fontSize: '0.4rem', color: '#6b7280' }}>
                              {entry.animationCount}a {entry.frameWidth}x{entry.frameHeight}
                            </span>
                            {override.scale !== 1.0 && (
                              <span style={{ fontSize: '0.42rem', color: '#ffd700', fontWeight: 700 }}>
                                {override.scale.toFixed(2)}x
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {sprites.map(entry => {
                      const override = getSpriteOverride(entry.uid);
                      const isSelected = selectedUid === entry.uid;
                      const isModified = !!currentData[entry.uid];
                      return (
                        <div
                          key={entry.uid}
                          onClick={() => selectSprite(entry.uid)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10, padding: '4px 8px',
                            background: isSelected ? 'rgba(255,215,0,0.08)' : 'transparent',
                            border: isSelected ? '1px solid rgba(255,215,0,0.3)' : '1px solid transparent',
                            borderRadius: 4, cursor: 'pointer',
                          }}
                        >
                          {isModified && <div style={{
                            width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', flexShrink: 0,
                          }} />}
                          <span style={{
                            fontSize: '0.6rem', color: '#c4b998', fontWeight: 600, minWidth: 140,
                          }}>{entry.name}</span>
                          <span style={{
                            fontSize: '0.5rem', color: '#4a5568', fontFamily: 'monospace', minWidth: 160,
                          }}>{entry.uid}</span>
                          <span style={{ fontSize: '0.5rem', color: '#6b7280' }}>
                            {entry.animationCount} anims | {entry.frameWidth}x{entry.frameHeight}
                          </span>
                          <span style={{ fontSize: '0.45rem', color: '#4a5568' }}>
                            {entry.tags.slice(0, 3).join(', ')}
                          </span>
                          {override.scale !== 1.0 && (
                            <span style={{ fontSize: '0.5rem', color: '#ffd700', fontWeight: 700, marginLeft: 'auto' }}>
                              {override.scale.toFixed(2)}x
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedEntry && (() => {
          const animKeys = selectedEntry.animations;
          const previewAnim = animKeys.includes(selectedAnim) ? selectedAnim : 'idle';
          const loopAnims = ['idle', 'walk', 'run', 'wallslide', 'surf', 'slide'];
          return (
            <div style={{
              flex: '0 0 45%', borderLeft: '1px solid rgba(255,215,0,0.15)',
              background: 'rgba(10,8,20,0.6)', overflowY: 'auto', padding: 14,
            }}>
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10,
              }}>
                <div>
                  <div style={{
                    fontSize: '0.85rem', color: '#ffd700', fontWeight: 700,
                    fontFamily: "'Cinzel', serif",
                  }}>{selectedEntry.name}</div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, marginTop: 3,
                  }}>
                    <span
                      onClick={() => copyUid(selectedEntry.uid)}
                      style={{
                        fontSize: '0.55rem', color: copiedUid === selectedEntry.uid ? '#22c55e' : '#6b7280',
                        fontFamily: 'monospace', cursor: 'pointer',
                        background: 'rgba(0,0,0,0.3)', padding: '1px 6px', borderRadius: 3,
                      }}
                      title="Click to copy UID"
                    >
                      {copiedUid === selectedEntry.uid ? 'Copied!' : selectedEntry.uid}
                    </span>
                    <span style={{
                      fontSize: '0.5rem', padding: '1px 6px', borderRadius: 8,
                      background: `${(CATEGORY_META[selectedEntry.category]?.color || '#94a3b8')}22`,
                      color: CATEGORY_META[selectedEntry.category]?.color || '#94a3b8',
                      fontWeight: 600,
                    }}>{CATEGORY_META[selectedEntry.category]?.label || selectedEntry.category}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedUid(null)} style={{
                  width: 24, height: 24, borderRadius: '50%',
                  border: '1px solid rgba(255,215,0,0.2)', background: 'rgba(20,15,30,0.8)',
                  color: '#6b7280', fontSize: '0.7rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>X</button>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12,
                fontSize: '0.55rem',
              }}>
                <div style={{ background: 'rgba(20,15,30,0.8)', borderRadius: 4, padding: '4px 6px' }}>
                  <div style={{ color: '#6b7280' }}>Frame Size</div>
                  <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{selectedEntry.frameWidth}x{selectedEntry.frameHeight}</div>
                </div>
                <div style={{ background: 'rgba(20,15,30,0.8)', borderRadius: 4, padding: '4px 6px' }}>
                  <div style={{ color: '#6b7280' }}>Animations</div>
                  <div style={{ color: '#3b82f6', fontWeight: 600 }}>{selectedEntry.animationCount}</div>
                </div>
                <div style={{ background: 'rgba(20,15,30,0.8)', borderRadius: 4, padding: '4px 6px' }}>
                  <div style={{ color: '#6b7280' }}>Total Frames</div>
                  <div style={{ color: '#22c55e', fontWeight: 600 }}>{selectedEntry.totalFrames}</div>
                </div>
                <div style={{ background: 'rgba(20,15,30,0.8)', borderRadius: 4, padding: '4px 6px' }}>
                  <div style={{ color: '#6b7280' }}>Folder</div>
                  <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.5rem' }}>{selectedEntry.folder}</div>
                </div>
                <div style={{ background: 'rgba(20,15,30,0.8)', borderRadius: 4, padding: '4px 6px' }}>
                  <div style={{ color: '#6b7280' }}>Faces Left</div>
                  <div style={{ color: selectedEntry.facesLeft ? '#f59e0b' : '#4a5568', fontWeight: 600 }}>
                    {selectedEntry.facesLeft ? 'Yes' : 'No'}
                  </div>
                </div>
                <div style={{ background: 'rgba(20,15,30,0.8)', borderRadius: 4, padding: '4px 6px' }}>
                  <div style={{ color: '#6b7280' }}>Has Filter</div>
                  <div style={{ color: selectedEntry.hasFilter ? '#a855f7' : '#4a5568', fontWeight: 600 }}>
                    {selectedEntry.hasFilter ? 'Yes' : 'No'}
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6,
              }}>
                {selectedEntry.tags.map(tag => (
                  <span key={tag} style={{
                    fontSize: '0.45rem', color: '#8a7d65', padding: '1px 5px',
                    border: '1px solid rgba(138,125,101,0.2)', borderRadius: 6,
                    background: 'rgba(20,15,30,0.6)',
                  }}>{tag}</span>
                ))}
              </div>

              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12,
              }}>
                <div style={{
                  background: 'rgba(10,8,20,0.8)', border: '1px solid rgba(255,215,0,0.12)',
                  borderRadius: 8, width: 160, height: 160,
                  position: 'relative', overflow: 'hidden', flexShrink: 0,
                }}>
                  {(() => {
                    const fw = selectedEntry.frameWidth || 100;
                    const fh = selectedEntry.frameHeight || 100;
                    const baseScale = (120 / (fh || fw)) * editScale;
                    const dw = fw * baseScale;
                    const dh = fh * baseScale;
                    return (
                      <div style={{
                        position: 'absolute',
                        left: 80 - dw / 2, top: 80 - dh / 2,
                        width: dw, height: dh, pointerEvents: 'none',
                      }}>
                        <SpriteAnimation
                          key={`${selectedUid}-${previewAnim}`}
                          spriteData={editFilter ? { ...selectedEntry.spriteData, filter: editFilter } : selectedEntry.spriteData}
                          animation={previewAnim}
                          scale={baseScale}
                          loop={loopAnims.includes(previewAnim)}
                          speed={150}
                          onAnimationEnd={!loopAnims.includes(previewAnim) ? () => {} : null}
                          containerless={false}
                        />
                      </div>
                    );
                  })()}
                  <div style={{
                    position: 'absolute', bottom: 3, left: 0, right: 0,
                    textAlign: 'center', fontSize: '0.5rem',
                    color: ANIM_COLORS[previewAnim] || '#94a3b8', fontWeight: 600,
                  }}>
                    {previewAnim} ({selectedEntry.spriteData[previewAnim]?.frames || '?'}f)
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.6rem', color: '#8a7d65', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>
                    Animations ({animKeys.length})
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 10 }}>
                    {animKeys.map(aKey => {
                      const animData = selectedEntry.spriteData[aKey];
                      const isActive = previewAnim === aKey;
                      const color = ANIM_COLORS[aKey] || '#94a3b8';
                      return (
                        <button
                          key={aKey}
                          onClick={() => setSelectedAnim(aKey)}
                          style={{
                            padding: '2px 6px', borderRadius: 3,
                            border: isActive ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.06)',
                            background: isActive ? `${color}22` : 'rgba(20,15,30,0.6)',
                            color: isActive ? color : '#4a5568',
                            fontSize: '0.5rem', fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          {aKey} <span style={{ opacity: 0.6, fontSize: '0.42rem' }}>{animData?.frames}f</span>
                        </button>
                      );
                    })}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: '0.6rem', color: '#8a7d65', fontWeight: 600, textTransform: 'uppercase' }}>Scale</span>
                    <button onClick={() => setEditScale(s => Math.max(0.1, parseFloat((s - 0.05).toFixed(2))))}
                      style={{
                        width: 24, height: 24, borderRadius: 4,
                        border: '1px solid rgba(255,215,0,0.2)', background: 'rgba(20,15,30,0.8)',
                        color: '#ffd700', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>-</button>
                    <span style={{
                      fontSize: '0.9rem', color: '#ffd700', fontWeight: 800,
                      fontFamily: "'Cinzel', serif", minWidth: 50, textAlign: 'center',
                    }}>{editScale.toFixed(2)}x</span>
                    <button onClick={() => setEditScale(s => parseFloat((s + 0.05).toFixed(2)))}
                      style={{
                        width: 24, height: 24, borderRadius: 4,
                        border: '1px solid rgba(255,215,0,0.2)', background: 'rgba(20,15,30,0.8)',
                        color: '#ffd700', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>+</button>
                    <button onClick={() => setEditScale(1.0)}
                      style={{
                        padding: '3px 8px', borderRadius: 4,
                        border: '1px solid rgba(255,215,0,0.15)', background: 'rgba(20,15,30,0.6)',
                        color: '#6b7280', fontSize: '0.5rem', fontWeight: 600, cursor: 'pointer',
                      }}>1.0</button>
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.6rem', color: '#8a7d65', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                Color Tools
              </div>
              {[
                { label: 'Hue', value: editHue, set: setEditHue, min: 0, max: 360, step: 1, unit: 'deg', def: 0 },
                { label: 'Saturate', value: editSat, set: setEditSat, min: 0, max: 3, step: 0.05, unit: '', def: 1 },
                { label: 'Bright', value: editBright, set: setEditBright, min: 0.2, max: 2, step: 0.05, unit: '', def: 1 },
                { label: 'Contrast', value: editContrast, set: setEditContrast, min: 0.5, max: 2, step: 0.05, unit: '', def: 1 },
                { label: 'Sepia', value: editSepia, set: setEditSepia, min: 0, max: 1, step: 0.05, unit: '', def: 0 },
              ].map(slider => (
                <div key={slider.label} style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4,
                }}>
                  <span style={{ fontSize: '0.55rem', color: '#6b7280', width: 55, flexShrink: 0 }}>
                    {slider.label}
                  </span>
                  <input type="range" min={slider.min} max={slider.max} step={slider.step}
                    value={slider.value} onChange={e => slider.set(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: '#ffd700', height: 3 }}
                  />
                  <span style={{ fontSize: '0.55rem', color: '#ffd700', fontWeight: 600, minWidth: 36, textAlign: 'right' }}>
                    {slider.value.toFixed(slider.step < 1 ? 2 : 0)}{slider.unit}
                  </span>
                </div>
              ))}

              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                <button onClick={handleSave} style={{
                  padding: '6px 18px', borderRadius: 4,
                  border: '1px solid #ffd700', background: 'rgba(255,215,0,0.15)',
                  color: '#ffd700', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Cinzel', serif",
                }}>Save</button>
                <button onClick={handleReset} style={{
                  padding: '6px 18px', borderRadius: 4,
                  border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)',
                  color: '#ef4444', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Cinzel', serif",
                }}>Reset</button>
                <button onClick={() => copyUid(selectedEntry.uid)} style={{
                  padding: '6px 18px', borderRadius: 4,
                  border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)',
                  color: '#3b82f6', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Cinzel', serif",
                }}>Copy UID</button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
