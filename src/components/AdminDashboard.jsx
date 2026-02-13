import React, { useState } from 'react';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import { locations } from '../data/enemies';

const ADMIN_TOOLS = [
  { id: 'map', label: 'Map Editor', path: '/adminmap', desc: 'Position world map nodes with drag-and-drop', color: '#f59e0b', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z', bg: '/backgrounds/world_map.png' },
  { id: 'battle', label: 'Battle Editor', path: '/adminbattle', desc: 'Configure formations, sprites, and action bar layout', color: '#ef4444', icon: 'M6.92 5H5l3.5 10 1.42-4.09L6.92 5zM11.5 1l-1 3h3l-1-3h-1zM17.08 5h-1.92l-3 5.91L13.5 15 17.08 5zM7 21h2v-4H7v4zm4 0h2v-6h-2v6zm4 0h2v-3h-2v3z', bg: '/backgrounds/scene_field.png' },
  { id: 'sprite', label: 'Sprite Editor', path: '/adminsprite', desc: 'Preview and configure character sprites, effects, projectiles', color: '#a855f7', icon: 'M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 17l3.5-4.5 2.5 3.01L14.5 11l4.5 6H5z', bg: '/backgrounds/wc_purple.png' },
  { id: 'ui', label: 'UI Layout Editor', path: '/adminui', desc: 'Drag-and-drop positioning of HUD elements across screens', color: '#3b82f6', icon: 'M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z', bg: '/backgrounds/wc_blue.png' },
  { id: 'icons', label: 'Icon Manager', path: '/adminicons', desc: 'Browse, replace, and manage all game icons, skills, and materials', color: '#06b6d4', icon: 'M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4z', bg: '/backgrounds/wc_gold.png' },
];

const GAME_SYSTEMS = [
  { label: 'Races', value: '6', detail: 'Human, Orc, Elf, Undead, Barbarian, Dwarf' },
  { label: 'Classes', value: '4', detail: 'Warrior, Mage, Worge, Ranger' },
  { label: 'Combinations', value: '24', detail: '6 races x 4 classes' },
  { label: 'Equipment Slots', value: '7', detail: 'Weapon, Helmet, Armor, Boots, Ring, Shield, Accessory' },
  { label: 'Tiers', value: '8', detail: 'Equipment upgrade tiers' },
  { label: 'Max Level', value: '20', detail: 'Hero level cap' },
  { label: 'Attributes', value: '8', detail: 'STR, VIT, END, DEX, AGI, INT, WIS, TAC' },
  { label: 'Party Size', value: '3', detail: 'Max active heroes in battle' },
];

function StatCard({ label, value, color = '#ffd700', sub }) {
  return (
    <div style={{
      background: 'rgba(20,15,30,0.6)', border: '1px solid rgba(255,215,0,0.15)',
      borderRadius: 8, padding: '12px 16px', flex: '1 1 140px', minWidth: 120,
    }}>
      <div style={{ fontSize: '0.6rem', color: '#8a7d65', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color, fontFamily: "'Cinzel', serif" }}>{value}</div>
      {sub && <div style={{ fontSize: '0.55rem', color: '#6b7280', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function HeroCard({ hero, expanded, onToggle }) {
  const cls = classDefinitions[hero.classId];
  const race = raceDefinitions[hero.raceId];
  const stats = cls ? getHeroStatsWithBonuses(hero) : null;
  const spriteData = getPlayerSprite(hero.classId, hero.raceId, hero.namedHeroId);
  const record = hero.battleRecord || { wins: 0, losses: 0, kills: 0, bossKills: 0, damageDealt: 0, healingDone: 0 };

  return (
    <div style={{
      background: expanded ? 'rgba(255,215,0,0.04)' : 'rgba(20,15,30,0.4)',
      border: `1px solid ${expanded ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 8, overflow: 'hidden', transition: 'all 0.2s',
    }}>
      <div onClick={onToggle} style={{
        padding: '10px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%', overflow: 'hidden',
          border: '2px solid rgba(255,215,0,0.3)', background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <SpriteAnimation spriteData={spriteData} animation="idle" scale={0.5} speed={180} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Cinzel', serif", color: '#ffd700', fontWeight: 700, fontSize: '0.85rem' }}>{hero.name}</span>
            <span style={{ fontSize: '0.55rem', color: '#6ee7b7', background: 'rgba(110,231,183,0.1)', padding: '1px 6px', borderRadius: 4, border: '1px solid rgba(110,231,183,0.2)' }}>
              Lv.{hero.level}
            </span>
          </div>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>
            {race?.name || hero.raceId} {cls?.name || hero.classId}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: '0.6rem', color: '#94a3b8' }}>
          <span>W:{record.wins}</span>
          <span>L:{record.losses}</span>
          <span>K:{record.kills}</span>
        </div>
        <span style={{ color: '#6b7280', fontSize: '1rem', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
          &#9660;
        </span>
      </div>

      {expanded && stats && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 10 }}>
            {['strength', 'agility', 'intellect', 'vitality', 'luck', 'defense', 'speed', 'charisma'].map(k => (
              <div key={k} style={{ background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: 4, textAlign: 'center' }}>
                <div style={{ fontSize: '0.45rem', color: '#8a7d65', textTransform: 'uppercase' }}>{k.slice(0, 3)}</div>
                <div style={{ fontSize: '0.8rem', color: '#ffd700', fontWeight: 700 }}>{stats[k] || 0}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10, fontSize: '0.6rem' }}>
            <div>
              <span style={{ color: '#8a7d65' }}>HP: </span>
              <span style={{ color: '#22c55e' }}>{Math.floor(hero.currentHealth || 0)} / {Math.floor(stats.health)}</span>
            </div>
            <div>
              <span style={{ color: '#8a7d65' }}>MP: </span>
              <span style={{ color: '#3b82f6' }}>{Math.floor(hero.currentMana || 0)} / {Math.floor(stats.mana)}</span>
            </div>
            <div>
              <span style={{ color: '#8a7d65' }}>SP: </span>
              <span style={{ color: '#f59e0b' }}>{Math.floor(hero.currentStamina || 0)} / {Math.floor(stats.stamina)}</span>
            </div>
            <div>
              <span style={{ color: '#8a7d65' }}>Grudge: </span>
              <span style={{ color: '#dc2626' }}>{hero.grudge || 0} / 100</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10, fontSize: '0.6rem' }}>
            <div>
              <span style={{ color: '#8a7d65' }}>Boss Kills: </span>
              <span style={{ color: '#c084fc' }}>{record.bossKills}</span>
            </div>
            <div>
              <span style={{ color: '#8a7d65' }}>Damage Dealt: </span>
              <span style={{ color: '#ef4444' }}>{Math.floor(record.damageDealt)}</span>
            </div>
            <div>
              <span style={{ color: '#8a7d65' }}>Healing Done: </span>
              <span style={{ color: '#22c55e' }}>{Math.floor(record.healingDone)}</span>
            </div>
            <div>
              <span style={{ color: '#8a7d65' }}>Unspent Points: </span>
              <span style={{ color: '#ffd700' }}>{hero.unspentPoints || 0}</span>
            </div>
          </div>

          {hero.equipment && Object.keys(hero.equipment).length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: '0.55rem', color: '#8a7d65', textTransform: 'uppercase', marginBottom: 4 }}>Equipment</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {Object.entries(hero.equipment).filter(([, eq]) => eq).map(([slot, eq]) => (
                  <div key={slot} style={{
                    background: 'rgba(110,231,183,0.04)', border: '1px solid rgba(110,231,183,0.12)',
                    borderRadius: 4, padding: '3px 6px', fontSize: '0.55rem',
                  }}>
                    <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>{slot}: </span>
                    <span style={{ color: '#6ee7b7' }}>{eq.name || `T${eq.tier}`}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const state = useGameStore();
  const [expandedHero, setExpandedHero] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    heroRoster, activeHeroIds, level, gold, xp, xpToNext,
    victories, losses, bossesDefeated, locationsCleared,
    zoneConquer, completedQuests, inventory,
    harvestResources, activeHarvests, screen,
    playerName, playerRace, playerClass,
    unspentPoints, skillPoints,
  } = state;

  const locationCount = locations ? locations.length : 0;
  const clearedCount = Array.isArray(locationsCleared) ? locationsCleared.length : (locationsCleared ? Object.keys(locationsCleared).length : 0);
  const conqueredZones = zoneConquer ? Object.values(zoneConquer).filter(v => v >= 100).length : 0;
  const questCount = completedQuests ? Object.values(completedQuests).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0) : 0;
  const harvestingCount = activeHarvests ? Object.keys(activeHarvests).length : 0;
  const totalResources = harvestResources ? Object.values(harvestResources).reduce((s, v) => s + Math.floor(v), 0) : 0;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'heroes', label: `Heroes (${heroRoster?.length || 0})` },
    { id: 'world', label: 'World Progress' },
    { id: 'systems', label: 'Game Systems' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: 'linear-gradient(180deg, #0a0a14 0%, #141428 50%, #0a0e1a 100%)',
      color: '#e2e8f0', fontFamily: "'Jost', sans-serif", position: 'relative',
    }}>
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'url(/backgrounds/world_map.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.06, pointerEvents: 'none',
      }} />
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'url(/ui/game-border-frame.png)',
        backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
        pointerEvents: 'none', zIndex: 100, opacity: 0.35,
      }} />
      <div style={{
        background: 'rgba(20,15,30,0.85)', borderBottom: '2px solid rgba(180,150,90,0.4)',
        padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, position: 'relative', zIndex: 10,
        backgroundImage: 'url(/ui/bar-background.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{
            fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '1.5rem', margin: 0,
            textShadow: '0 0 12px rgba(255,215,0,0.3)',
          }}>
            Admin Hub
          </h1>
          <span style={{ fontSize: '0.65rem', color: '#6b7280', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
            Grudge Warlords
          </span>
        </div>
        <a href="/" style={{
          color: '#ffd700', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem',
          padding: '6px 16px', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: 6,
        }}>
          Back to Game
        </a>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px', position: 'relative', zIndex: 10 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 12, marginBottom: 24,
        }}>
          {ADMIN_TOOLS.map(tool => (
            <a key={tool.id} href={tool.path} style={{
              background: 'rgba(20,15,30,0.6)', border: `1px solid ${tool.color}33`,
              borderRadius: 10, padding: 16, textDecoration: 'none',
              transition: 'all 0.2s', cursor: 'pointer', display: 'block',
              position: 'relative', overflow: 'hidden',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = tool.color; e.currentTarget.style.background = `${tool.color}11`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${tool.color}33`; e.currentTarget.style.background = 'rgba(20,15,30,0.6)'; }}
            >
              <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${tool.bg})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: 0.12, pointerEvents: 'none',
              }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill={tool.color}><path d={tool.icon} /></svg>
                  <span style={{ fontFamily: "'Cinzel', serif", color: tool.color, fontWeight: 700, fontSize: '0.9rem' }}>
                    {tool.label}
                  </span>
                </div>
                <div style={{ fontSize: '0.6rem', color: '#94a3b8', lineHeight: 1.4 }}>{tool.desc}</div>
              </div>
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              background: activeTab === t.id ? 'rgba(255,215,0,0.15)' : 'rgba(20,15,30,0.5)',
              border: `1px solid ${activeTab === t.id ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: activeTab === t.id ? '#ffd700' : '#94a3b8',
              borderRadius: 6, padding: '8px 16px', fontSize: '0.75rem', cursor: 'pointer',
              fontWeight: activeTab === t.id ? 700 : 400,
              fontFamily: "'Cinzel', serif",
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div>
            <div style={{
              background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(255,215,0,0.12)',
              borderRadius: 10, padding: 16, marginBottom: 20,
            }}>
              <div style={{ fontSize: '0.65rem', color: '#8a7d65', textTransform: 'uppercase', marginBottom: 8 }}>Player Info</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '1.1rem', fontWeight: 700 }}>{playerName || 'Hero'}</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: '#6ee7b7', background: 'rgba(110,231,183,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                  Level {level}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                  {raceDefinitions[playerRace]?.name || playerRace || '---'} {classDefinitions[playerClass]?.name || playerClass || '---'}
                </span>
                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                  Screen: <span style={{ color: '#c084fc' }}>{screen}</span>
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              <StatCard label="Gold" value={Math.floor(gold || 0)} color="#ffd700" />
              <StatCard label="XP" value={`${Math.floor(xp || 0)}`} color="#6ee7b7" sub={`Next: ${xpToNext}`} />
              <StatCard label="Victories" value={victories || 0} color="#22c55e" />
              <StatCard label="Losses" value={losses || 0} color="#ef4444" />
              <StatCard label="Heroes" value={heroRoster?.length || 0} color="#3b82f6" sub={`${activeHeroIds?.length || 0} active`} />
              <StatCard label="Bosses Killed" value={Array.isArray(bossesDefeated) ? bossesDefeated.length : (bossesDefeated || 0)} color="#a855f7" />
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              <StatCard label="Zones Cleared" value={clearedCount} color="#f59e0b" sub={`of ${locationCount}`} />
              <StatCard label="Zones Conquered" value={conqueredZones} color="#ef4444" />
              <StatCard label="Quests Done" value={questCount} color="#8b5cf6" />
              <StatCard label="Harvesting" value={harvestingCount} color="#06b6d4" sub={`${totalResources} resources`} />
              <StatCard label="Inventory" value={inventory?.length || 0} color="#94a3b8" />
              <StatCard label="Unspent Points" value={(unspentPoints || 0) + (skillPoints || 0)} color="#fbbf24" />
            </div>

            {harvestResources && Object.values(harvestResources).some(v => v > 0) && (
              <div style={{
                background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(255,215,0,0.12)',
                borderRadius: 10, padding: 16,
              }}>
                <div style={{ fontSize: '0.65rem', color: '#8a7d65', textTransform: 'uppercase', marginBottom: 8 }}>Harvest Resources</div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {Object.entries(harvestResources).filter(([, v]) => v > 0).map(([k, v]) => (
                    <div key={k} style={{
                      background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: 6,
                      border: '1px solid rgba(255,215,0,0.1)',
                    }}>
                      <div style={{ fontSize: '0.5rem', color: '#8a7d65', textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontSize: '1rem', color: '#ffd700', fontWeight: 700 }}>{Math.floor(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'heroes' && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16, fontSize: '0.65rem', color: '#94a3b8' }}>
              <span>Total: {heroRoster?.length || 0}</span>
              <span>Active: {activeHeroIds?.length || 0}</span>
              <span>Active IDs: {activeHeroIds?.join(', ') || 'none'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(heroRoster || []).map(hero => (
                <HeroCard
                  key={hero.id}
                  hero={hero}
                  expanded={expandedHero === hero.id}
                  onToggle={() => setExpandedHero(expandedHero === hero.id ? null : hero.id)}
                />
              ))}
              {(!heroRoster || heroRoster.length === 0) && (
                <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', fontSize: '0.8rem' }}>
                  No heroes created yet. Start a new game to create heroes.
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'world' && (
          <div>
            <div style={{ fontSize: '0.65rem', color: '#8a7d65', textTransform: 'uppercase', marginBottom: 12 }}>
              Zone Progress ({clearedCount} / {locationCount} cleared)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              {(locations || []).map(loc => {
                const cleared = Array.isArray(locationsCleared) ? locationsCleared.includes(loc.id) : locationsCleared?.[loc.id];
                const conquer = zoneConquer?.[loc.id] || 0;
                const quests = completedQuests?.[loc.id] || [];
                return (
                  <div key={loc.id} style={{
                    background: cleared ? 'rgba(34,197,94,0.04)' : 'rgba(20,15,30,0.4)',
                    border: `1px solid ${cleared ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 8, padding: '10px 12px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 600, color: cleared ? '#6ee7b7' : '#e2e8f0' }}>
                        {loc.name}
                      </span>
                      {cleared && <span style={{ fontSize: '0.5rem', color: '#22c55e' }}>CLEARED</span>}
                    </div>
                    <div style={{ fontSize: '0.55rem', color: '#6b7280' }}>
                      Lv.{loc.level || '?'} | Conquer: {Math.floor(conquer)}%
                    </div>
                    {conquer > 0 && (
                      <div style={{
                        height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 4, overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', width: `${Math.min(100, conquer)}%`,
                          background: conquer >= 100 ? '#22c55e' : '#f59e0b',
                          borderRadius: 2, transition: 'width 0.3s',
                        }} />
                      </div>
                    )}
                    {quests.length > 0 && (
                      <div style={{ fontSize: '0.5rem', color: '#8b5cf6', marginTop: 4 }}>
                        {quests.length} quest{quests.length > 1 ? 's' : ''} done
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'systems' && (
          <div>
            <div style={{ fontSize: '0.65rem', color: '#8a7d65', textTransform: 'uppercase', marginBottom: 12 }}>
              Game Systems Reference
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 10 }}>
              {GAME_SYSTEMS.map(sys => (
                <div key={sys.label} style={{
                  background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(255,215,0,0.1)',
                  borderRadius: 8, padding: '12px 16px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.75rem', color: '#e2e8f0', fontWeight: 600 }}>{sys.label}</span>
                    <span style={{ fontFamily: "'Cinzel', serif", fontSize: '1.1rem', color: '#ffd700', fontWeight: 800 }}>{sys.value}</span>
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#6b7280', lineHeight: 1.4 }}>{sys.detail}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: '0.65rem', color: '#8a7d65', textTransform: 'uppercase', marginBottom: 12 }}>
                Factions
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { name: 'Crusade', races: 'Humans, Barbarians', god: 'God of Light', color: '#ffd700', bg: '/backgrounds/card_divine.png' },
                  { name: 'Legion', races: 'Orcs, Undead', god: 'God of Death', color: '#ef4444', bg: '/backgrounds/card_dark.png' },
                  { name: 'Fabled', races: 'Elves, Dwarves', god: 'God of Nature', color: '#22c55e', bg: '/backgrounds/card_green_hills.png' },
                ].map(f => (
                  <div key={f.name} style={{
                    background: 'rgba(20,15,30,0.5)', border: `1px solid ${f.color}33`,
                    borderRadius: 8, padding: 14, position: 'relative', overflow: 'hidden',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: `url(${f.bg})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      opacity: 0.15, pointerEvents: 'none',
                    }} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ fontFamily: "'Cinzel', serif", color: f.color, fontSize: '0.9rem', fontWeight: 700, marginBottom: 4 }}>{f.name}</div>
                      <div style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{f.races}</div>
                      <div style={{ fontSize: '0.55rem', color: '#6b7280', marginTop: 4 }}>Worships: {f.god}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: '0.65rem', color: '#8a7d65', textTransform: 'uppercase', marginBottom: 12 }}>
                Scene Types
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { name: 'Camp', bg: '/backgrounds/scene_camp.png' },
                  { name: 'Dungeon', bg: '/backgrounds/scene_dungeon.png' },
                  { name: 'Trading Post', bg: '/backgrounds/scene_trading.png' },
                  { name: 'Open Field', bg: '/backgrounds/scene_field.png' },
                ].map(s => (
                  <div key={s.name} style={{
                    background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6, padding: '8px 16px', fontSize: '0.7rem', color: '#e2e8f0',
                    position: 'relative', overflow: 'hidden', minWidth: 100,
                  }}>
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: `url(${s.bg})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      opacity: 0.2, pointerEvents: 'none',
                    }} />
                    <span style={{ position: 'relative', zIndex: 1 }}>{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
