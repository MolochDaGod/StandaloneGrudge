import React, { useState, useEffect, useRef } from 'react';
import { ICON_REGISTRY, UI_ICONS, getIconSrc } from '../data/uiSprites';
import { OrnatePanel } from './OrnatePanel';

export function getIconOverride(key) {
  try {
    const overrides = JSON.parse(localStorage.getItem('iconOverrides') || '{}');
    return overrides[key] || null;
  } catch { return null; }
}

const EQUIPMENT_KEYS = ['weapon', 'offhand', 'helmet', 'armor', 'ring', 'feet', 'relic'];
const ACTION_KEYS = ['attack', 'defend', 'magic', 'heal', 'buff', 'debuff', 'flee', 'item'];
const WEAPON_KEYS = ['sword', 'axe', 'bow', 'dagger', 'staff', 'mace', 'greatsword', 'greataxe', 'crossbow', 'gun', 'lance', 'tome', 'hammer', 'wand', 'shield'];
const RESOURCE_KEYS = ['ore', 'wood', 'herb', 'diamond', 'gold', 'coin', 'barrel', 'chest', 'meat', 'bearSkin', 'cobblestone', 'flint', 'rope', 'coinsHandful', 'fishBones', 'giantBone', 'stoneOrb', 'cobweb', 'pollen', 'seeds', 'wheat', 'mushroom', 'berry', 'flower', 'root', 'corn', 'apple'];

function categorizeKey(key) {
  if (key.startsWith('ability_')) return 'Abilities';
  if (key.startsWith('skill_')) return 'Skills';
  if (key.startsWith('potion_')) return 'Potions';
  if (EQUIPMENT_KEYS.includes(key)) return 'Equipment';
  if (ACTION_KEYS.includes(key)) return 'Actions';
  if (WEAPON_KEYS.includes(key)) return 'Weapons';
  if (RESOURCE_KEYS.includes(key)) return 'Resources';
  return 'Misc';
}

const CATEGORY_ORDER = ['Actions', 'Abilities', 'Skills', 'Equipment', 'Potions', 'Weapons', 'Resources', 'Misc'];
const CATEGORY_COLORS = {
  Actions: '#ef4444', Abilities: '#c084fc', Skills: '#3b82f6', Equipment: '#f59e0b',
  Potions: '#22c55e', Weapons: '#fb923c', Resources: '#06b6d4', Misc: '#94a3b8',
};

const PACK_CATEGORY_COLORS = {
  armor: '#f59e0b', weapons: '#ef4444', resources: '#06b6d4', potions: '#22c55e',
  entities: '#c084fc', factions: '#fb923c', misc: '#94a3b8',
};

const ICONS_PER_PAGE = 60;

const RPG16_SHEETS = [
  { name: 'armours', file: '/icons/rpg16/armours.png', cols: 10, rows: 10 },
  { name: 'books', file: '/icons/rpg16/books.png', cols: 10, rows: 10 },
  { name: 'chests', file: '/icons/rpg16/chests.png', cols: 10, rows: 10 },
  { name: 'consumables', file: '/icons/rpg16/consumables.png', cols: 10, rows: 10 },
  { name: 'potions', file: '/icons/rpg16/potions.png', cols: 10, rows: 10 },
  { name: 'weapons', file: '/icons/rpg16/weapons.png', cols: 10, rows: 10 },
];

function IconCard({ iconKey, onUpload, onReset, override }) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);
  const src = override || getIconSrc(iconKey);

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onUpload(iconKey, e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileRef.current?.click()}
      style={{
        background: dragOver ? 'rgba(255,215,0,0.1)' : 'rgba(15,12,25,0.7)',
        border: `1px solid ${dragOver ? 'rgba(255,215,0,0.5)' : override ? 'rgba(110,231,183,0.3)' : 'rgba(255,215,0,0.12)'}`,
        borderRadius: 6, padding: 6, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4, cursor: 'pointer', transition: 'all 0.15s',
        width: 80, minHeight: 90, position: 'relative',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,215,0,0.4)'; e.currentTarget.style.background = 'rgba(255,215,0,0.05)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = override ? 'rgba(110,231,183,0.3)' : 'rgba(255,215,0,0.12)'; e.currentTarget.style.background = 'rgba(15,12,25,0.7)'; }}
    >
      <input ref={fileRef} type="file" accept="image/png" style={{ display: 'none' }} onChange={(e) => handleFile(e.target.files[0])} />
      {src ? (
        <img src={src} alt={iconKey} style={{ width: 40, height: 40, imageRendering: 'pixelated', objectFit: 'contain' }} />
      ) : (
        <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.03)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', color: '#6b7280' }}>?</div>
      )}
      <div style={{ fontSize: '0.45rem', color: '#94a3b8', textAlign: 'center', wordBreak: 'break-all', lineHeight: 1.2, maxWidth: 74 }}>{iconKey}</div>
      {override && (
        <div style={{ fontSize: '0.4rem', color: '#6ee7b7', marginTop: -2 }}>overridden</div>
      )}
      {override && (
        <button
          onClick={(e) => { e.stopPropagation(); onReset(iconKey); }}
          style={{
            position: 'absolute', top: 2, right: 2, width: 14, height: 14,
            background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: 3, color: '#ef4444', fontSize: '0.5rem', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1,
          }}
        >✕</button>
      )}
    </div>
  );
}

function PackIconCard({ icon, onCopyPath }) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    navigator.clipboard.writeText(icon.path).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
    if (onCopyPath) onCopyPath(icon);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        background: copied ? 'rgba(110,231,183,0.08)' : 'rgba(15,12,25,0.7)',
        border: `1px solid ${copied ? 'rgba(110,231,183,0.4)' : 'rgba(255,215,0,0.08)'}`,
        borderRadius: 6, padding: 6, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 3, cursor: 'pointer', transition: 'all 0.15s',
        width: 80, minHeight: 90, position: 'relative',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)'; e.currentTarget.style.background = 'rgba(255,215,0,0.04)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = copied ? 'rgba(110,231,183,0.4)' : 'rgba(255,215,0,0.08)'; e.currentTarget.style.background = copied ? 'rgba(110,231,183,0.08)' : 'rgba(15,12,25,0.7)'; }}
      title={`Click to copy path: ${icon.path}`}
    >
      <img src={icon.path} alt={icon.file} style={{ width: 48, height: 48, objectFit: 'contain', imageRendering: 'auto' }} loading="lazy" />
      <div style={{ fontSize: '0.4rem', color: '#94a3b8', textAlign: 'center', wordBreak: 'break-all', lineHeight: 1.1, maxWidth: 76 }}>
        {icon.file.replace(/\.[^.]+$/, '')}
      </div>
      {copied && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(110,231,183,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 6, fontSize: '0.5rem', color: '#6ee7b7', fontWeight: 700,
        }}>Copied!</div>
      )}
    </div>
  );
}

function SpriteCell({ sheetUrl, col, row, srcSize, renderSize, totalCols, totalRows }) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    const coords = `${col * srcSize}, ${row * srcSize}`;
    navigator.clipboard.writeText(coords).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    });
  };

  return (
    <div
      onClick={handleClick}
      style={{
        width: renderSize, height: renderSize, cursor: 'pointer',
        border: `1px solid ${copied ? 'rgba(110,231,183,0.5)' : 'rgba(255,215,0,0.08)'}`,
        borderRadius: 3, overflow: 'hidden', position: 'relative',
        background: 'rgba(0,0,0,0.3)', transition: 'border-color 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = copied ? 'rgba(110,231,183,0.5)' : 'rgba(255,215,0,0.08)'; }}
      title={`Click to copy: ${col * srcSize}, ${row * srcSize}`}
    >
      <div style={{
        width: renderSize, height: renderSize,
        backgroundImage: `url(${sheetUrl})`,
        backgroundPosition: `-${col * renderSize}px -${row * renderSize}px`,
        backgroundSize: `${totalCols * renderSize}px ${totalRows * renderSize}px`,
        imageRendering: 'pixelated',
        backgroundRepeat: 'no-repeat',
      }} />
      {copied && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(110,231,183,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.45rem', color: '#6ee7b7', fontWeight: 700,
        }}>Copied!</div>
      )}
    </div>
  );
}

function SpriteSheetGrid({ sheet, srcSize, renderSize, maxCols, maxRows }) {
  const [expanded, setExpanded] = useState(false);
  const [imgSize, setImgSize] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgSize({ width: img.width, height: img.height });
    img.src = sheet.file;
  }, [sheet.file]);

  const cols = imgSize ? Math.floor(imgSize.width / srcSize) : (maxCols || sheet.cols || 10);
  const rows = imgSize ? Math.floor(imgSize.height / srcSize) : (maxRows || sheet.rows || 10);

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          padding: '6px 10px', background: 'rgba(20,15,30,0.5)',
          border: '1px solid rgba(255,215,0,0.1)', borderRadius: 6, marginBottom: 8,
        }}
      >
        <span style={{ color: '#6b7280', fontSize: '1rem', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)', display: 'inline-block' }}>▼</span>
        <span style={{ fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '0.75rem', fontWeight: 600 }}>{sheet.name || 'Sheet'}</span>
        <span style={{ fontSize: '0.55rem', color: '#6b7280' }}>{cols}x{rows} ({cols * rows} icons)</span>
      </div>
      {expanded && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, padding: '4px 0' }}>
          {Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) => (
              <SpriteCell key={`${r}-${c}`} sheetUrl={sheet.file} col={c} row={r} srcSize={srcSize} renderSize={renderSize} totalCols={cols} totalRows={rows} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center', marginTop: 12 }}>
      <button disabled={page <= 0} onClick={() => onPageChange(page - 1)} style={{
        background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
        color: page <= 0 ? '#4b5563' : '#ffd700', padding: '4px 10px', borderRadius: 4,
        cursor: page <= 0 ? 'default' : 'pointer', fontSize: '0.7rem',
      }}>Prev</button>
      <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{page + 1} / {totalPages}</span>
      <button disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)} style={{
        background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
        color: page >= totalPages - 1 ? '#4b5563' : '#ffd700', padding: '4px 10px', borderRadius: 4,
        cursor: page >= totalPages - 1 ? 'default' : 'pointer', fontSize: '0.7rem',
      }}>Next</button>
    </div>
  );
}

export default function AdminIcons() {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('registry');
  const [packCategory, setPackCategory] = useState('armor');
  const [packPage, setPackPage] = useState(0);
  const [packManifest, setPackManifest] = useState(null);
  const [packSearch, setPackSearch] = useState('');
  const [overrides, setOverrides] = useState(() => {
    try { return JSON.parse(localStorage.getItem('iconOverrides') || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    fetch('/icons/pack/manifest.json')
      .then(r => r.json())
      .then(data => setPackManifest(data))
      .catch(() => setPackManifest({}));
  }, []);

  const saveOverrides = (newOverrides) => {
    setOverrides(newOverrides);
    localStorage.setItem('iconOverrides', JSON.stringify(newOverrides));
  };

  const handleUpload = (key, dataUrl) => {
    saveOverrides({ ...overrides, [key]: dataUrl });
  };

  const handleReset = (key) => {
    const next = { ...overrides };
    delete next[key];
    saveOverrides(next);
  };

  const handleResetAll = () => {
    saveOverrides({});
  };

  const allKeys = Object.keys(ICON_REGISTRY);
  const filteredKeys = search ? allKeys.filter(k => k.toLowerCase().includes(search.toLowerCase())) : allKeys;

  const categorized = {};
  filteredKeys.forEach(key => {
    const cat = categorizeKey(key);
    if (!categorized[cat]) categorized[cat] = [];
    categorized[cat].push(key);
  });

  const overrideCount = Object.keys(overrides).length;

  const packCategoryIcons = packManifest && packManifest[packCategory]
    ? (packSearch
      ? packManifest[packCategory].filter(i => i.file.toLowerCase().includes(packSearch.toLowerCase()))
      : packManifest[packCategory])
    : [];
  const packTotalPages = Math.ceil(packCategoryIcons.length / ICONS_PER_PAGE);
  const packPageIcons = packCategoryIcons.slice(packPage * ICONS_PER_PAGE, (packPage + 1) * ICONS_PER_PAGE);

  const totalPackIcons = packManifest ? Object.values(packManifest).reduce((s, a) => s + a.length, 0) : 0;

  const tabs = [
    { id: 'registry', label: 'Game Icons', count: allKeys.length },
    { id: 'pack', label: 'Icon Pack', count: totalPackIcons },
    { id: 'sheets', label: 'Sprite Sheets', count: null },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a14 0%, #141428 50%, #0a0e1a 100%)',
      color: '#e2e8f0', fontFamily: "'Jost', sans-serif",
    }}>
      <div style={{
        background: 'rgba(20,15,30,0.85)', borderBottom: '2px solid rgba(180,150,90,0.4)',
        padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{
            fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '1.5rem', margin: 0,
            textShadow: '0 0 12px rgba(255,215,0,0.3)',
          }}>Icon Manager</h1>
          {overrideCount > 0 && (
            <span style={{ fontSize: '0.6rem', color: '#6ee7b7', padding: '2px 8px', background: 'rgba(110,231,183,0.1)', borderRadius: 4, border: '1px solid rgba(110,231,183,0.2)' }}>
              {overrideCount} override{overrideCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {overrideCount > 0 && (
            <button onClick={handleResetAll} style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              color: '#ef4444', padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
              fontSize: '0.75rem', fontWeight: 600,
            }}>Reset All</button>
          )}
          <a href="/admin" style={{
            color: '#ffd700', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem',
            padding: '6px 16px', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
            borderRadius: 6,
          }}>Back to Admin</a>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,215,0,0.1)',
        background: 'rgba(15,12,25,0.6)', padding: '0 24px',
      }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => { setActiveTab(tab.id); setPackPage(0); }} style={{
            background: activeTab === tab.id ? 'rgba(255,215,0,0.1)' : 'transparent',
            border: 'none', borderBottom: activeTab === tab.id ? '2px solid #ffd700' : '2px solid transparent',
            color: activeTab === tab.id ? '#ffd700' : '#6b7280',
            padding: '10px 20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
            fontFamily: "'Cinzel', serif", transition: 'all 0.15s',
          }}>
            {tab.label}
            {tab.count != null && <span style={{ marginLeft: 6, fontSize: '0.6rem', opacity: 0.6 }}>({tab.count})</span>}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '20px 24px' }}>

        {activeTab === 'registry' && (
          <>
            <div style={{ marginBottom: 20 }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search game icons by name..."
                style={{
                  width: '100%', maxWidth: 400, padding: '8px 14px',
                  background: 'rgba(20,15,30,0.6)', border: '1px solid rgba(255,215,0,0.15)',
                  borderRadius: 6, color: '#e2e8f0', fontSize: '0.8rem', outline: 'none',
                  fontFamily: "'Jost', sans-serif",
                }}
                onFocus={(e) => { e.target.style.borderColor = 'rgba(255,215,0,0.4)'; }}
                onBlur={(e) => { e.target.style.borderColor = 'rgba(255,215,0,0.15)'; }}
              />
            </div>

            {CATEGORY_ORDER.map(cat => {
              const keys = categorized[cat];
              if (!keys || keys.length === 0) return null;
              const color = CATEGORY_COLORS[cat] || '#94a3b8';

              return (
                <div key={cat} style={{ marginBottom: 24 }}>
                  <OrnatePanel style={{ borderRadius: 8, padding: '10px 16px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 3 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <h2 style={{
                        fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '0.95rem',
                        margin: 0, fontWeight: 700,
                      }}>{cat}</h2>
                      <span style={{ fontSize: '0.6rem', color: '#6b7280' }}>({keys.length})</span>
                    </div>
                  </OrnatePanel>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {keys.map(key => (
                      <IconCard
                        key={key}
                        iconKey={key}
                        override={overrides[key]}
                        onUpload={handleUpload}
                        onReset={handleReset}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {activeTab === 'pack' && (
          <>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
              {packManifest && Object.keys(packManifest).map(cat => {
                const count = packManifest[cat]?.length || 0;
                const isActive = packCategory === cat;
                const color = PACK_CATEGORY_COLORS[cat] || '#94a3b8';
                return (
                  <button key={cat} onClick={() => { setPackCategory(cat); setPackPage(0); setPackSearch(''); }} style={{
                    background: isActive ? `${color}20` : 'rgba(20,15,30,0.5)',
                    border: `1px solid ${isActive ? color : 'rgba(255,215,0,0.12)'}`,
                    color: isActive ? color : '#94a3b8',
                    padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                    fontSize: '0.75rem', fontWeight: 600, fontFamily: "'Cinzel', serif",
                    textTransform: 'capitalize', transition: 'all 0.15s',
                  }}>
                    {cat} <span style={{ opacity: 0.5, fontSize: '0.6rem' }}>({count})</span>
                  </button>
                );
              })}
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={packSearch}
                onChange={(e) => { setPackSearch(e.target.value); setPackPage(0); }}
                placeholder={`Search ${packCategory} icons...`}
                style={{
                  width: '100%', maxWidth: 400, padding: '8px 14px',
                  background: 'rgba(20,15,30,0.6)', border: '1px solid rgba(255,215,0,0.15)',
                  borderRadius: 6, color: '#e2e8f0', fontSize: '0.8rem', outline: 'none',
                  fontFamily: "'Jost', sans-serif",
                }}
              />
              <span style={{ fontSize: '0.6rem', color: '#6b7280', marginLeft: 12 }}>
                {packCategoryIcons.length} icons {packSearch && `matching "${packSearch}"`}
              </span>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {packPageIcons.map(icon => (
                <PackIconCard key={icon.key} icon={icon} />
              ))}
            </div>

            <Pagination page={packPage} totalPages={packTotalPages} onPageChange={setPackPage} />

            {packPageIcons.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: '#4b5563', fontSize: '0.8rem' }}>
                {packSearch ? `No icons matching "${packSearch}"` : 'No icons in this category'}
              </div>
            )}
          </>
        )}

        {activeTab === 'sheets' && (
          <>
            <div style={{ marginBottom: 24 }}>
              <OrnatePanel style={{ borderRadius: 8, padding: '10px 16px', marginBottom: 16 }}>
                <h2 style={{
                  fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '1rem',
                  margin: 0, fontWeight: 700, position: 'relative', zIndex: 3,
                }}>RPG 16x16 Icons</h2>
              </OrnatePanel>
              {RPG16_SHEETS.map(sheet => (
                <SpriteSheetGrid key={sheet.name} sheet={sheet} srcSize={16} renderSize={48} />
              ))}
            </div>

            <div>
              <OrnatePanel style={{ borderRadius: 8, padding: '10px 16px', marginBottom: 16 }}>
                <h2 style={{
                  fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '1rem',
                  margin: 0, fontWeight: 700, position: 'relative', zIndex: 3,
                }}>Crafting Materials</h2>
              </OrnatePanel>
              <SpriteSheetGrid
                sheet={{ name: 'resources_basic', file: '/icons/materials/resources_basic.png' }}
                srcSize={24}
                renderSize={48}
                maxCols={11}
                maxRows={11}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
