import React, { useState } from 'react';
import useGameStore from '../stores/gameStore';

const BUILDING_DEFS = {
  camp:     { emoji: '⛺', label: 'Camp',        cost: { gold: 500, wood: 300, stone: 200 }, profession: null,       desc: 'Claims island ownership' },
  mine:     { emoji: '⛏️', label: 'Mine',        cost: { gold: 200, ore: 50 },              profession: 'Miner',    desc: 'Produces ore & stone' },
  lumber:   { emoji: '🪓', label: 'Lumber Mill', cost: { gold: 200, wood: 100 },            profession: 'Forester', desc: 'Produces wood' },
  herb:     { emoji: '🌿', label: 'Herb Garden', cost: { gold: 150, herbs: 30 },            profession: 'Mystic',   desc: 'Produces herbs' },
  kitchen:  { emoji: '🍳', label: 'Kitchen',     cost: { gold: 150, food: 50 },             profession: 'Chef',     desc: 'Produces food' },
  workshop: { emoji: '🔧', label: 'Workshop',    cost: { gold: 300, ore: 50, crystals: 20 },profession: 'Engineer', desc: 'Produces crystals' },
  farm:     { emoji: '🌾', label: 'Farm',        cost: { gold: 150 },                       profession: null,       desc: 'Produces food' },
};

const PROFESSION_COLORS = {
  Miner: '#94a3b8',
  Forester: '#4ade80',
  Mystic: '#a78bfa',
  Chef: '#f59e0b',
  Engineer: '#06b6d4',
};

export default function IslandSidebar({ selectedBuildingType, onSelectBuilding, onCollect }) {
  const islandResources = useGameStore(s => s.islandResources);
  const islandBuildings = useGameStore(s => s.islandBuildings);
  const islandHeroes = useGameStore(s => s.islandHeroes);
  const heroRoster = useGameStore(s => s.heroRoster);
  const activeHeroIds = useGameStore(s => s.activeHeroIds);
  const activeHarvests = useGameStore(s => s.activeHarvests);
  const gold = useGameStore(s => s.gold);
  const harvestResources = useGameStore(s => s.harvestResources);
  const suiteProfessions = useGameStore(s => s.suiteProfessions);
  const deployHeroToIsland = useGameStore(s => s.deployHeroToIsland);
  const recallHeroFromIsland = useGameStore(s => s.recallHeroFromIsland);
  const assignHeroToBuilding = useGameStore(s => s.assignHeroToBuilding);
  const removeIslandBuilding = useGameStore(s => s.removeIslandBuilding);

  const [expandedSection, setExpandedSection] = useState('buildings');
  const [assigningHeroFor, setAssigningHeroFor] = useState(null); // buildingId

  // Heroes available to deploy (not in party, not camp-harvesting, not already on island)
  const deployableHeroes = heroRoster.filter(h => {
    if (activeHeroIds.includes(h.id)) return false;
    if (Object.values(activeHarvests).includes(h.id)) return false;
    if (islandHeroes.some(ih => ih.heroId === h.id)) return false;
    return true;
  });

  // Heroes currently on the island
  const onIslandHeroes = islandHeroes.map(ih => {
    const hero = heroRoster.find(h => h.id === ih.heroId);
    const building = ih.buildingId ? islandBuildings.find(b => b.id === ih.buildingId) : null;
    return { ...ih, hero, building };
  }).filter(h => h.hero);

  // Unassigned heroes on island
  const unassignedIslandHeroes = onIslandHeroes.filter(h => !h.buildingId);

  const costStr = (cost) => Object.entries(cost).map(([k, v]) => `${v} ${k}`).join(', ');

  return (
    <div style={{
      width: 320, background: 'linear-gradient(180deg, #1a1a2e, #16213e)',
      borderLeft: '3px solid #ff6b35', display: 'flex', flexDirection: 'column',
      overflowY: 'auto', flexShrink: 0, boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
    }}>
      {/* Resources */}
      <div style={{ padding: 12, borderBottom: '2px solid rgba(255,107,53,0.2)' }}>
        <div style={{ color: '#ff6b35', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          🏝️ Island Resources
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {Object.entries(islandResources).map(([res, amt]) => (
            <div key={res} style={{
              background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.2)',
              borderRadius: 4, padding: '4px 6px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 9, color: '#a0a0c0', textTransform: 'uppercase' }}>{res}</div>
              <div style={{ fontSize: 13, color: '#00ff88', fontWeight: 700 }}>{Math.floor(amt)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Buildings */}
      <div style={{ padding: 12, borderBottom: '2px solid rgba(255,107,53,0.2)' }}>
        <div style={{ color: '#ff6b35', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          🏗️ Place Building
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {Object.entries(BUILDING_DEFS).map(([type, def]) => (
            <button
              key={type}
              onClick={() => onSelectBuilding(selectedBuildingType === type ? null : type)}
              style={{
                background: selectedBuildingType === type
                  ? 'linear-gradient(135deg, #ff6b35, #f7931e)'
                  : 'linear-gradient(135deg, rgba(255,107,53,0.15), rgba(247,147,30,0.15))',
                border: selectedBuildingType === type ? '2px solid #ff6b35' : '2px solid rgba(255,107,53,0.4)',
                color: selectedBuildingType === type ? '#fff' : '#ff6b35',
                padding: '8px 6px', borderRadius: 6, fontSize: 10, fontWeight: 600,
                cursor: 'pointer', textAlign: 'center', textTransform: 'uppercase',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: 18 }}>{def.emoji}</span>
              <span>{def.label}</span>
              <span style={{ fontSize: 8, color: selectedBuildingType === type ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)' }}>
                {costStr(def.cost)}
              </span>
            </button>
          ))}
        </div>
        {selectedBuildingType && (
          <div style={{
            marginTop: 6, fontSize: 10, color: '#a0a0c0', textAlign: 'center',
            background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: 4,
          }}>
            Click on island terrain to place • ESC to cancel
          </div>
        )}
      </div>

      {/* Placed Buildings */}
      {islandBuildings.length > 0 && (
        <div style={{ padding: 12, borderBottom: '2px solid rgba(255,107,53,0.2)' }}>
          <div style={{ color: '#ff6b35', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            ⚙️ Buildings ({islandBuildings.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {islandBuildings.map(b => {
              const def = BUILDING_DEFS[b.type];
              const assignedHero = islandHeroes.find(h => h.buildingId === b.id);
              const hero = assignedHero ? heroRoster.find(h => h.id === assignedHero.heroId) : null;
              return (
                <div key={b.id} style={{
                  background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '6px 8px',
                  borderLeft: `3px solid ${def?.profession ? (PROFESSION_COLORS[def.profession] || '#ff6b35') : '#ff6b35'}`,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>
                      {def?.emoji} {def?.label || b.type}
                    </div>
                    {hero ? (
                      <div style={{ fontSize: 9, color: '#6ee7b3' }}>{hero.name} (Lv{hero.level})</div>
                    ) : def?.profession ? (
                      <button
                        onClick={() => setAssigningHeroFor(assigningHeroFor === b.id ? null : b.id)}
                        style={{
                          fontSize: 9, color: '#fbbf24', background: 'none', border: 'none',
                          cursor: 'pointer', padding: 0, textDecoration: 'underline',
                        }}
                      >Assign Hero</button>
                    ) : null}
                    {/* Hero assignment dropdown */}
                    {assigningHeroFor === b.id && (
                      <div style={{ marginTop: 4 }}>
                        {unassignedIslandHeroes.length === 0 ? (
                          <div style={{ fontSize: 9, color: '#666' }}>No heroes on island to assign</div>
                        ) : (
                          unassignedIslandHeroes.map(h => (
                            <button key={h.heroId} onClick={() => { assignHeroToBuilding(h.heroId, b.id); setAssigningHeroFor(null); }} style={{
                              display: 'block', width: '100%', fontSize: 9, color: '#6ee7b3', background: 'rgba(110,231,183,0.1)',
                              border: '1px solid rgba(110,231,183,0.3)', borderRadius: 3, padding: '2px 4px', cursor: 'pointer',
                              marginBottom: 2, textAlign: 'left',
                            }}>{h.hero.name} (Lv{h.hero.level})</button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <button onClick={() => removeIslandBuilding(b.id)} style={{
                    background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12,
                  }} title="Remove building">✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Heroes on Island */}
      <div style={{ padding: 12, borderBottom: '2px solid rgba(255,107,53,0.2)' }}>
        <div style={{ color: '#ff6b35', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
          ⚔️ Island Heroes ({onIslandHeroes.length})
        </div>
        {onIslandHeroes.map(h => (
          <div key={h.heroId} style={{
            background: 'rgba(0,0,0,0.2)', borderRadius: 4, padding: '6px 8px', marginBottom: 4,
            borderLeft: '3px solid #6ee7b3', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 11, color: '#e2e8f0', fontWeight: 600 }}>{h.hero.name}</div>
              <div style={{ fontSize: 9, color: '#94a3b8' }}>
                Lv{h.hero.level} • {h.building ? `At ${BUILDING_DEFS[h.building.type]?.label}` : 'Idle'}
              </div>
            </div>
            <button onClick={() => recallHeroFromIsland(h.heroId)} style={{
              background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: 4,
              padding: '2px 6px', color: '#ef4444', cursor: 'pointer', fontSize: 9, fontWeight: 700,
            }}>Recall</button>
          </div>
        ))}

        {/* Deploy new heroes */}
        {deployableHeroes.length > 0 && (
          <div style={{ marginTop: 6 }}>
            <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 4 }}>Deploy to Island:</div>
            {deployableHeroes.slice(0, 5).map(h => (
              <button key={h.id} onClick={() => deployHeroToIsland(h.id)} style={{
                display: 'block', width: '100%', fontSize: 10, color: '#00ff88',
                background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)',
                borderRadius: 4, padding: '3px 6px', cursor: 'pointer', marginBottom: 2,
                textAlign: 'left', fontWeight: 600,
              }}>
                + {h.name} (Lv{h.level})
              </button>
            ))}
          </div>
        )}
        {onIslandHeroes.length === 0 && deployableHeroes.length === 0 && (
          <div style={{ fontSize: 10, color: '#555', textAlign: 'center' }}>
            No heroes available. Recruit more from camp!
          </div>
        )}
      </div>

      {/* Profession Progress (from suite) */}
      {Object.keys(suiteProfessions).length > 0 && (
        <div style={{ padding: 12 }}>
          <div style={{ color: '#ff6b35', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
            📊 Professions
          </div>
          {Object.entries(suiteProfessions).slice(0, 3).map(([charId, profs]) => (
            <div key={charId} style={{ marginBottom: 8 }}>
              {Object.entries(profs).map(([name, data]) => (
                <div key={name} style={{ marginBottom: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10 }}>
                    <span style={{ color: PROFESSION_COLORS[name] || '#ccc', fontWeight: 600 }}>{name}</span>
                    <span style={{ color: '#a0a0c0' }}>Lv{data.level || 1}</span>
                  </div>
                  <div style={{
                    width: '100%', height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 2, transition: 'width 0.3s',
                      width: `${Math.min(100, ((data.xp || 0) % 100))}%`,
                      background: PROFESSION_COLORS[name] || '#ff6b35',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Controls hint */}
      <div style={{
        padding: '8px 12px', marginTop: 'auto', background: 'rgba(0,0,0,0.3)',
        fontSize: 9, color: '#555', textAlign: 'center', lineHeight: 1.6,
      }}>
        🖱️ Drag to pan • 🔍 Scroll to zoom<br />
        Click building button → click terrain to place
      </div>
    </div>
  );
}
