import React, { useState, useMemo, useCallback } from 'react';
import SpriteAnimation from './SpriteAnimation';
import { raceClassSpriteMap, enemySpriteMap, spriteSheets, racalvinSprite, namedHeroes } from '../data/spriteMap';

const CONTEXTS = [
  { key: 'map', label: 'Map', storageKey: 'adminSize_map' },
  { key: 'battle', label: 'Battle', storageKey: 'adminSize_battle' },
  { key: 'scenes', label: 'Scenes', storageKey: 'adminSize_scenes' },
];

const BOSS_KEYS = ['abyssal_demon', 'eldritch_horror', 'frost_titan', 'evil_wizard', 'ogre_boss', 'stormhead_boss', 'gunslinger_boss'];

const RACES = ['human', 'orc', 'elf', 'undead', 'barbarian', 'dwarf'];
const CLASSES = ['warrior', 'mage', 'worge', 'ranger'];

const CATEGORY_COLORS = {
  Heroes: '#3b82f6',
  Enemies: '#ef4444',
  Neutral: '#94a3b8',
  Bosses: '#a855f7',
  Secret: '#f59e0b',
};

const META_KEYS = new Set([
  'frameWidth', 'frameHeight', 'filter', 'facesLeft', 'showGuideGrid',
  'tint', 'blendMode', 'dwarfScale', 'name', 'src', 'category',
]);

function getAnimationKeys(spriteData) {
  if (!spriteData) return [];
  return Object.keys(spriteData).filter(k => !META_KEYS.has(k) && spriteData[k]?.frames != null);
}

const ANIM_COLORS = {
  idle: '#22c55e',
  walk: '#3b82f6',
  run: '#06b6d4',
  attack1: '#ef4444',
  attack2: '#f97316',
  attack3: '#f59e0b',
  attack: '#ef4444',
  hurt: '#ec4899',
  death: '#6b7280',
  jump: '#8b5cf6',
  fall: '#a855f7',
  roll: '#14b8a6',
  doublejump: '#7c3aed',
  land: '#64748b',
  wallslide: '#475569',
  attack1_effect: '#fbbf24',
  attack2_effect: '#fb923c',
  attack3_effect: '#f87171',
};

function capitalize(str) {
  return str.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getAllSprites() {
  const sprites = [];

  for (const race of RACES) {
    for (const cls of CLASSES) {
      const spriteData = raceClassSpriteMap[race]?.[cls];
      if (spriteData) {
        sprites.push({
          id: `${race}_${cls}`,
          label: `${capitalize(race)} ${capitalize(cls)}`,
          spriteData,
          category: 'Heroes',
        });
      }
    }
  }

  for (const [key, spriteData] of Object.entries(enemySpriteMap)) {
    if (BOSS_KEYS.includes(key)) continue;
    sprites.push({
      id: `enemy_${key}`,
      label: capitalize(key),
      spriteData,
      category: 'Enemies',
    });
  }

  const dummy = spriteSheets['training-dummy'];
  if (dummy) {
    sprites.push({
      id: 'neutral_training_dummy',
      label: 'Training Dummy',
      spriteData: dummy,
      category: 'Neutral',
    });
  }

  for (const key of BOSS_KEYS) {
    const spriteData = enemySpriteMap[key];
    if (spriteData) {
      sprites.push({
        id: `boss_${key}`,
        label: capitalize(key),
        spriteData,
        category: 'Bosses',
      });
    }
  }

  sprites.push({
    id: 'secret_racalvin',
    label: 'Racalvin',
    spriteData: racalvinSprite,
    category: 'Secret',
  });

  return sprites;
}

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
  const hueMatch = filterStr.match(/hue-rotate\(([\d.]+)deg\)/);
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
  } catch {
    return {};
  }
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
  const [selectedId, setSelectedId] = useState(null);
  const [selectedAnim, setSelectedAnim] = useState('idle');
  const [editScale, setEditScale] = useState(1.0);
  const [editHue, setEditHue] = useState(0);
  const [editSat, setEditSat] = useState(1);
  const [editBright, setEditBright] = useState(1);
  const [editContrast, setEditContrast] = useState(1);
  const [editSepia, setEditSepia] = useState(0);

  const allSprites = useMemo(() => getAllSprites(), []);

  const currentData = contextData[activeContext] || {};

  const getSpriteOverride = useCallback((spriteId) => {
    return currentData[spriteId] || { scale: 1.0, filter: '' };
  }, [currentData]);

  const selectSprite = useCallback((id) => {
    setSelectedId(id);
    setSelectedAnim('idle');
    const override = currentData[id] || { scale: 1.0, filter: '' };
    setEditScale(override.scale);
    const parsed = parseFilter(override.filter);
    setEditHue(parsed.hue);
    setEditSat(parsed.sat);
    setEditBright(parsed.bright);
    setEditContrast(parsed.contrast);
    setEditSepia(parsed.sepia);
  }, [currentData]);

  const handleSave = useCallback(() => {
    if (!selectedId) return;
    const filter = buildFilterString(editHue, editSat, editBright, editContrast, editSepia);
    const newData = {
      ...contextData,
      [activeContext]: {
        ...contextData[activeContext],
        [selectedId]: { scale: editScale, filter },
      },
    };
    setContextData(newData);
    const ctx = CONTEXTS.find(c => c.key === activeContext);
    if (ctx) saveContext(ctx.storageKey, newData[activeContext]);
  }, [selectedId, editScale, editHue, editSat, editBright, editContrast, editSepia, activeContext, contextData]);

  const handleReset = useCallback(() => {
    if (!selectedId) return;
    const newCtxData = { ...contextData[activeContext] };
    delete newCtxData[selectedId];
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
  }, [selectedId, activeContext, contextData]);

  const selectedSprite = allSprites.find(s => s.id === selectedId);
  const editFilter = buildFilterString(editHue, editSat, editBright, editContrast, editSepia);

  const categories = ['Heroes', 'Enemies', 'Neutral', 'Bosses', 'Secret'];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(15,10,25,0.95)',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Jost', sans-serif", color: '#e2e8f0',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 20px',
        borderBottom: '1px solid rgba(255,215,0,0.2)',
        background: 'rgba(10,8,20,0.9)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '1.1rem', fontWeight: 800,
            textShadow: '0 0 12px rgba(255,215,0,0.3)',
          }}>
            Sprite Size, Color & Animations
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            {CONTEXTS.map(ctx => (
              <button
                key={ctx.key}
                onClick={() => setActiveContext(ctx.key)}
                style={{
                  padding: '6px 18px',
                  borderRadius: 20,
                  border: activeContext === ctx.key ? '1px solid #ffd700' : '1px solid rgba(255,215,0,0.2)',
                  background: activeContext === ctx.key ? '#ffd700' : 'rgba(20,15,30,0.8)',
                  color: activeContext === ctx.key ? '#0a0a14' : '#8a7d65',
                  fontWeight: 700, fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: "'Cinzel', serif",
                }}
              >
                {ctx.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '1px solid rgba(255,215,0,0.3)',
            background: 'rgba(20,15,30,0.8)',
            color: '#ffd700', fontSize: '1.2rem', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          ✕
        </button>
      </div>

      <div style={{
        flex: 1, overflowY: 'auto', padding: '12px 16px',
      }}>
        {categories.map(cat => {
          const catSprites = allSprites.filter(s => s.category === cat);
          if (catSprites.length === 0) return null;
          return (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
              }}>
                <div style={{
                  width: 4, height: 18, borderRadius: 2,
                  background: CATEGORY_COLORS[cat] || '#ffd700',
                }} />
                <span style={{
                  fontSize: '0.8rem', fontWeight: 700, color: CATEGORY_COLORS[cat] || '#ffd700',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontFamily: "'Cinzel', serif",
                }}>
                  {cat} ({catSprites.length})
                </span>
              </div>
              <div style={{
                display: 'flex', gap: 8, overflowX: 'auto',
                paddingBottom: 8,
              }}>
                {catSprites.map(sprite => {
                  const override = getSpriteOverride(sprite.id);
                  const isSelected = selectedId === sprite.id;
                  const baseScale = (80 / (sprite.spriteData.frameHeight || sprite.spriteData.frameWidth || 100)) * override.scale;
                  const spriteDataWithFilter = override.filter
                    ? { ...sprite.spriteData, filter: override.filter }
                    : sprite.spriteData;
                  const animKeys = getAnimationKeys(sprite.spriteData);
                  return (
                    <div
                      key={sprite.id}
                      onClick={() => selectSprite(sprite.id)}
                      style={{
                        width: 120, minWidth: 120,
                        background: 'rgba(20,15,30,0.7)',
                        border: isSelected ? '2px solid #ffd700' : '1px solid rgba(255,215,0,0.1)',
                        borderRadius: 8,
                        padding: 8,
                        cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        boxShadow: isSelected ? '0 0 12px rgba(255,215,0,0.3)' : 'none',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        height: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
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
                        fontSize: '0.55rem', color: '#94a3b8', textAlign: 'center',
                        marginTop: 4, lineHeight: 1.2,
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', width: '100%',
                      }}>
                        {sprite.label}
                      </div>
                      <div style={{
                        fontSize: '0.45rem', color: '#6b7280', marginTop: 2,
                      }}>
                        {animKeys.length} anims
                      </div>
                      {override.scale !== 1.0 && (
                        <div style={{
                          fontSize: '0.5rem', color: '#ffd700', marginTop: 1,
                        }}>
                          {override.scale.toFixed(2)}x
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {selectedSprite && (() => {
          const animKeys = getAnimationKeys(selectedSprite.spriteData);
          const previewAnim = animKeys.includes(selectedAnim) ? selectedAnim : 'idle';
          const loopAnims = ['idle', 'walk', 'run', 'wallslide'];
          return (
          <div style={{
            marginTop: 8,
            background: 'rgba(20,15,30,0.8)',
            border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 10,
            padding: 16,
          }}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap',
            }}>
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                minWidth: 180,
              }}>
                <div style={{
                  fontSize: '0.7rem', color: '#ffd700', fontWeight: 700, marginBottom: 4,
                  fontFamily: "'Cinzel', serif",
                }}>
                  {selectedSprite.label}
                </div>
                <div style={{
                  fontSize: '0.55rem', color: ANIM_COLORS[previewAnim] || '#94a3b8', fontWeight: 600, marginBottom: 8,
                }}>
                  {previewAnim} ({selectedSprite.spriteData[previewAnim]?.frames || '?'}f)
                </div>
                <div style={{
                  background: 'rgba(10,8,20,0.8)',
                  border: '1px solid rgba(255,215,0,0.15)',
                  borderRadius: 8,
                  width: 200, height: 200,
                  position: 'relative', overflow: 'hidden',
                }}>
                  {(() => {
                    const fw = selectedSprite.spriteData.frameWidth || 100;
                    const fh = selectedSprite.spriteData.frameHeight || 100;
                    const baseScale = (150 / (fh || fw)) * editScale;
                    const dw = fw * baseScale;
                    const dh = fh * baseScale;
                    return (
                      <div style={{
                        position: 'absolute',
                        left: 100 - dw / 2,
                        top: 100 - dh / 2,
                        width: dw, height: dh,
                        pointerEvents: 'none',
                      }}>
                        <SpriteAnimation
                          key={`${selectedId}-${previewAnim}`}
                          spriteData={editFilter ? { ...selectedSprite.spriteData, filter: editFilter } : selectedSprite.spriteData}
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
                </div>
                <div style={{
                  fontSize: '0.5rem', color: '#6b7280', marginTop: 6,
                }}>
                  Frame: {selectedSprite.spriteData.frameWidth || '?'}x{selectedSprite.spriteData.frameHeight || '?'}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 280 }}>
                <div style={{
                  fontSize: '0.65rem', color: '#8a7d65', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6,
                }}>
                  Animations ({animKeys.length})
                </div>
                <div style={{
                  display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 14,
                }}>
                  {animKeys.map(aKey => {
                    const animData = selectedSprite.spriteData[aKey];
                    const isActive = previewAnim === aKey;
                    const color = ANIM_COLORS[aKey] || '#94a3b8';
                    return (
                      <button
                        key={aKey}
                        onClick={() => setSelectedAnim(aKey)}
                        style={{
                          padding: '3px 8px',
                          borderRadius: 4,
                          border: isActive ? `1px solid ${color}` : '1px solid rgba(255,255,255,0.08)',
                          background: isActive ? `${color}22` : 'rgba(20,15,30,0.6)',
                          color: isActive ? color : '#6b7280',
                          fontSize: '0.55rem', fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.12s',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}
                      >
                        <span>{aKey}</span>
                        <span style={{
                          fontSize: '0.45rem', opacity: 0.7,
                          background: 'rgba(0,0,0,0.3)', borderRadius: 3, padding: '0 3px',
                        }}>
                          {animData?.frames || '?'}f
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
                }}>
                  <span style={{ fontSize: '0.7rem', color: '#8a7d65', fontWeight: 600, textTransform: 'uppercase' }}>Scale</span>
                  <button
                    onClick={() => setEditScale(s => Math.max(0.1, parseFloat((s - 0.05).toFixed(2))))}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: '1px solid rgba(255,215,0,0.3)',
                      background: 'rgba(20,15,30,0.8)',
                      color: '#ffd700', fontSize: '1rem', fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >−</button>
                  <span style={{
                    fontSize: '1rem', color: '#ffd700', fontWeight: 800,
                    fontFamily: "'Cinzel', serif", minWidth: 60, textAlign: 'center',
                  }}>
                    {editScale.toFixed(2)}x
                  </span>
                  <button
                    onClick={() => setEditScale(s => parseFloat((s + 0.05).toFixed(2)))}
                    style={{
                      width: 28, height: 28, borderRadius: 6,
                      border: '1px solid rgba(255,215,0,0.3)',
                      background: 'rgba(20,15,30,0.8)',
                      color: '#ffd700', fontSize: '1rem', fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >+</button>
                  <button
                    onClick={() => setEditScale(1.0)}
                    style={{
                      padding: '4px 10px', borderRadius: 6,
                      border: '1px solid rgba(255,215,0,0.2)',
                      background: 'rgba(20,15,30,0.6)',
                      color: '#94a3b8', fontSize: '0.6rem', fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >Reset</button>
                </div>

                <div style={{ fontSize: '0.65rem', color: '#8a7d65', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
                  Color Tools
                </div>

                {[
                  { label: 'Hue Rotate', value: editHue, set: setEditHue, min: 0, max: 360, step: 1, unit: '°', def: 0 },
                  { label: 'Saturate', value: editSat, set: setEditSat, min: 0, max: 3, step: 0.05, unit: '', def: 1 },
                  { label: 'Brightness', value: editBright, set: setEditBright, min: 0.2, max: 2, step: 0.05, unit: '', def: 1 },
                  { label: 'Contrast', value: editContrast, set: setEditContrast, min: 0.5, max: 2, step: 0.05, unit: '', def: 1 },
                  { label: 'Sepia', value: editSepia, set: setEditSepia, min: 0, max: 1, step: 0.05, unit: '', def: 0 },
                ].map(slider => (
                  <div key={slider.label} style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6,
                  }}>
                    <span style={{
                      fontSize: '0.6rem', color: '#6b7280', width: 75, flexShrink: 0,
                    }}>
                      {slider.label}
                    </span>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      step={slider.step}
                      value={slider.value}
                      onChange={e => slider.set(parseFloat(e.target.value))}
                      style={{
                        flex: 1, accentColor: '#ffd700', height: 4,
                      }}
                    />
                    <span style={{
                      fontSize: '0.6rem', color: '#ffd700', fontWeight: 600,
                      minWidth: 40, textAlign: 'right',
                    }}>
                      {slider.value.toFixed(slider.step < 1 ? 2 : 0)}{slider.unit}
                    </span>
                  </div>
                ))}

                <div style={{
                  display: 'flex', gap: 8, marginTop: 14,
                }}>
                  <button
                    onClick={handleSave}
                    style={{
                      padding: '8px 24px', borderRadius: 6,
                      border: '1px solid #ffd700',
                      background: 'rgba(255,215,0,0.15)',
                      color: '#ffd700', fontSize: '0.75rem', fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Cinzel', serif",
                    }}
                  >
                    Save
                  </button>
                  <button
                    onClick={handleReset}
                    style={{
                      padding: '8px 24px', borderRadius: 6,
                      border: '1px solid rgba(239,68,68,0.3)',
                      background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444', fontSize: '0.75rem', fontWeight: 700,
                      cursor: 'pointer',
                      fontFamily: "'Cinzel', serif",
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}
