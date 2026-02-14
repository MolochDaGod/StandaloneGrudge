import React, { useState, useEffect } from 'react';

const BATTLE_BACKGROUNDS = {
  verdant_plains: { path: '/backgrounds/verdant_plains.png', zones: ['verdant_plains'] },
  dark_forest: { path: '/backgrounds/dark_forest.png', zones: ['dark_forest'] },
  cursed_ruins: { path: '/backgrounds/cursed_ruins.png', zones: ['cursed_ruins'] },
  blood_canyon: { path: '/backgrounds/blood_canyon.png', zones: ['blood_canyon'] },
  dragon_peaks: { path: '/backgrounds/dragon_peaks.png', zones: ['dragon_peaks'] },
  shadow_citadel: { path: '/backgrounds/shadow_citadel.png', zones: ['shadow_citadel'] },
  demon_gate: { path: '/backgrounds/demon_gate.png', zones: ['demon_gate'] },
  void_throne: { path: '/backgrounds/void_throne.png', zones: ['void_throne'] },
  volcanic_field: { path: '/backgrounds/volcanic_field.png', zones: ['molten_core', 'obsidian_wastes', 'ruins_of_ashenmoor'] },
  infernal_arena: { path: '/backgrounds/infernal_arena.png', zones: ['infernal_forge', 'dreadmaw_canyon'] },
  mystic_grove: { path: '/backgrounds/mystic_grove.png', zones: ['mystic_grove'] },
  whispering_caverns: { path: '/backgrounds/whispering_caverns.png', zones: ['whispering_caverns'] },
  haunted_marsh: { path: '/backgrounds/haunted_marsh.png', zones: ['haunted_marsh'] },
  crystal_caves: { path: '/backgrounds/crystal_caves.png', zones: ['crystal_caves'] },
  thornwood_pass: { path: '/backgrounds/thornwood_pass.png', zones: ['thornwood_pass'] },
  sunken_temple: { path: '/backgrounds/sunken_temple.png', zones: ['sunken_temple'] },
  boss_mountain: { path: '/backgrounds/boss_mountain.png', zones: ['iron_peaks', 'windswept_ridge'] },
  shadow_forest: { path: '/backgrounds/shadow_forest.png', zones: ['shadow_forest'] },
  winter_arena: { path: '/backgrounds/winter_arena.png', zones: ['frozen_tundra', 'crystal_lake'] },
  blight_hollow: { path: '/backgrounds/blight_hollow.png', zones: ['blight_hollow'] },
  storm_ruins: { path: '/backgrounds/storm_ruins.png', zones: ['stormspire_peak', 'ashen_battlefield'] },
  corrupted_spire: { path: '/backgrounds/corrupted_spire.png', zones: ['corrupted_spire'] },
  abyssal_depths: { path: '/backgrounds/abyssal_depths.png', zones: ['abyssal_depths'] },
  void_threshold: { path: '/backgrounds/void_threshold.png', zones: ['void_threshold'] },
  hall_of_odin: { path: '/backgrounds/hall_of_odin.png', zones: ['hall_of_odin'] },
  maw_of_madra: { path: '/backgrounds/maw_of_madra.png', zones: ['maw_of_madra'] },
  sanctum_of_omni: { path: '/backgrounds/sanctum_of_omni.png', zones: ['sanctum_of_omni'] },
  arena: { path: '/backgrounds/arena.png', zones: ['arena'] },
  battle_arena_default: { path: '/backgrounds/battle_arena_default.png', zones: ['default_fallback'] },
  portal_arena: { path: '/backgrounds/portal_arena.png', zones: ['void_dungeon_boss'] },
  purple_dungeon: { path: '/backgrounds/purple_dungeon.png', zones: ['void_dungeon'] },
  lava_boss_walkup: { path: '/backgrounds/lava_boss_walkup.png', zones: ['lava_dungeon_boss'] },
  lava_dungeon_path: { path: '/backgrounds/lava_dungeon_path.png', zones: ['lava_dungeon'] },
  scene_dungeon: { path: '/backgrounds/scene_dungeon.png', zones: ['default_dungeon_boss'] },
  scene_field: { path: '/backgrounds/scene_field.png', zones: ['default_dungeon'] },
};

const STORAGE_KEY = 'grudge_bg_settings';

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { removed: [], zoom: {} };
}

function saveSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function BackgroundCard({ id, data, settings, onToggleRemove, onZoomChange }) {
  const [expanded, setExpanded] = useState(false);
  const isRemoved = settings.removed.includes(id);
  const zoom = settings.zoom[id] || 100;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '16/9',
      borderRadius: 8,
      overflow: 'hidden',
      border: isRemoved ? '2px solid #ef4444' : '2px solid rgba(255,215,0,0.2)',
      opacity: isRemoved ? 0.4 : 1,
      transition: 'opacity 0.3s, border-color 0.3s',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `url(${data.path})`,
        backgroundSize: `${zoom}%`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-size 0.3s',
      }} />

      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '8px 12px',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, transparent 100%)',
      }}>
        <div style={{
          fontFamily: "'Cinzel', serif",
          fontWeight: 700,
          fontSize: '0.85rem',
          color: isRemoved ? '#ef4444' : '#ffd700',
          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
        }}>
          {id.replace(/_/g, ' ')}
          {isRemoved && <span style={{ color: '#ef4444', fontSize: '0.65rem', marginLeft: 8 }}>REMOVED</span>}
        </div>
        <div style={{
          fontSize: '0.6rem',
          color: '#94a3b8',
          marginTop: 2,
        }}>
          {data.zones.map(z => z.replace(/_/g, ' ')).join(', ')}
        </div>
      </div>

      <div style={{
        position: 'absolute',
        bottom: 10,
        right: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        {expanded && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleRemove(id); }}
              title={isRemoved ? 'Restore to battles' : 'Remove from battles'}
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                border: `2px solid ${isRemoved ? '#22c55e' : '#ef4444'}`,
                background: isRemoved ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)',
                color: isRemoved ? '#22c55e' : '#ef4444',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.1rem',
                fontWeight: 700,
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s',
              }}
            >
              {isRemoved ? '+' : '×'}
            </button>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              borderRadius: 20,
              padding: '6px 4px',
              border: '1px solid rgba(255,215,0,0.2)',
            }}>
              <button
                onClick={(e) => { e.stopPropagation(); onZoomChange(id, Math.min(200, zoom + 10)); }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,215,0,0.3)',
                  background: 'rgba(255,215,0,0.1)',
                  color: '#ffd700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                +
              </button>
              <div style={{
                textAlign: 'center',
                fontSize: '0.55rem',
                color: '#ffd700',
                fontWeight: 600,
              }}>
                {zoom}%
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onZoomChange(id, Math.max(50, zoom - 10)); }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '1px solid rgba(255,215,0,0.3)',
                  background: 'rgba(255,215,0,0.1)',
                  color: '#ffd700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  fontWeight: 700,
                }}
              >
                -
              </button>
            </div>
          </>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          title="Adjust background"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '2px solid rgba(255,215,0,0.4)',
            background: expanded ? 'rgba(255,215,0,0.25)' : 'rgba(0,0,0,0.5)',
            color: '#ffd700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.2s',
            fontSize: '1.2rem',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {expanded ? (
              <path d="M18 6L6 18M6 6l12 12" />
            ) : (
              <>
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </>
            )}
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function AdminBackgrounds() {
  const [settings, setSettings] = useState(loadSettings);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const handleToggleRemove = (id) => {
    setSettings(prev => {
      const removed = prev.removed.includes(id)
        ? prev.removed.filter(r => r !== id)
        : [...prev.removed, id];
      return { ...prev, removed };
    });
  };

  const handleZoomChange = (id, newZoom) => {
    setSettings(prev => ({
      ...prev,
      zoom: { ...prev.zoom, [id]: newZoom },
    }));
  };

  const entries = Object.entries(BATTLE_BACKGROUNDS);
  const filtered = filter === 'all'
    ? entries
    : filter === 'active'
      ? entries.filter(([id]) => !settings.removed.includes(id))
      : entries.filter(([id]) => settings.removed.includes(id));

  const activeCount = entries.length - settings.removed.length;
  const removedCount = settings.removed.length;

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: '#0a0e1a',
      padding: '20px',
      fontFamily: 'Jost, sans-serif',
      color: '#e2e8f0',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
        flexWrap: 'wrap',
        gap: 12,
      }}>
        <div>
          <h2 style={{
            fontFamily: "'Cinzel', serif",
            fontSize: '1.3rem',
            fontWeight: 800,
            color: '#ffd700',
            margin: 0,
          }}>
            BATTLE BACKGROUNDS
          </h2>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 4 }}>
            {activeCount} active / {removedCount} removed / {entries.length} total
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'active', 'removed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '5px 14px',
                borderRadius: 6,
                border: filter === f ? '1px solid #ffd700' : '1px solid rgba(255,255,255,0.1)',
                background: filter === f ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.03)',
                color: filter === f ? '#ffd700' : '#94a3b8',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            >
              {f} {f === 'active' ? `(${activeCount})` : f === 'removed' ? `(${removedCount})` : `(${entries.length})`}
            </button>
          ))}
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}>
        {filtered.map(([id, data]) => (
          <BackgroundCard
            key={id}
            id={id}
            data={data}
            settings={settings}
            onToggleRemove={handleToggleRemove}
            onZoomChange={handleZoomChange}
          />
        ))}
        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 40,
            color: '#6b7280',
            fontSize: '0.85rem',
          }}>
            No backgrounds match the current filter.
          </div>
        )}
      </div>
    </div>
  );
}

export { BATTLE_BACKGROUNDS, STORAGE_KEY };
