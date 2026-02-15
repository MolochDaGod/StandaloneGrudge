import React, { useState, lazy, Suspense } from 'react';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, namedHeroes } from '../data/spriteMap';
import { locations } from '../data/enemies';
import AdminMap from './AdminMap';
import AdminBattle from './AdminBattle';
import AdminSprite from './AdminSprite';
import AdminUI from './AdminUI';
import AdminIcons from './AdminIcons';
import AdminPvP from './AdminPvP';
import AdminSize from './AdminSize';
import AdminMaker from './AdminMaker';
import AdminBackgrounds from './AdminBackgrounds';

const ADMIN_TOOLS = [
  { id: 'map', label: 'Map Editor', desc: 'Position world map nodes with drag-and-drop', color: '#f59e0b', icon: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z', bg: '/backgrounds/world_map.png' },
  { id: 'battle', label: 'Battle Editor', desc: 'Configure formations, sprites, and action bar layout', color: '#ef4444', icon: 'M6.92 5H5l3.5 10 1.42-4.09L6.92 5zM11.5 1l-1 3h3l-1-3h-1zM17.08 5h-1.92l-3 5.91L13.5 15 17.08 5zM7 21h2v-4H7v4zm4 0h2v-6h-2v6zm4 0h2v-3h-2v3z', bg: '/backgrounds/scene_field.png' },
  { id: 'sprite', label: 'Sprite Editor', desc: 'Preview and configure character sprites, effects, projectiles', color: '#a855f7', icon: 'M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM5 17l3.5-4.5 2.5 3.01L14.5 11l4.5 6H5z', bg: '/backgrounds/wc_purple.png' },
  { id: 'ui', label: 'UI Layout', desc: 'Drag-and-drop positioning of HUD elements across screens', color: '#3b82f6', icon: 'M3 3h8v8H3V3zm0 10h8v8H3v-8zm10-10h8v8h-8V3zm0 10h8v8h-8v-8z', bg: '/backgrounds/wc_blue.png' },
  { id: 'icons', label: 'Icon Manager', desc: 'Browse, replace, and manage all game icons', color: '#06b6d4', icon: 'M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4z', bg: '/backgrounds/wc_gold.png' },
  { id: 'pvp', label: 'PvP Placement', desc: 'Place and position units on arena backgrounds', color: '#ec4899', icon: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z', bg: '/backgrounds/arena.png' },
  { id: 'size', label: 'Size & Color', desc: 'Adjust sprite scale and coloration for Map, Battle, Scenes', color: '#10b981', icon: 'M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z', bg: '/backgrounds/wc_green.png' },
  { id: 'maker', label: 'Sprite Forge', desc: 'Sprite creation knowledge base, AI prompts, animation gallery', color: '#fbbf24', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', bg: '/backgrounds/wc_gold.png' },
  { id: 'backgrounds', label: 'Backgrounds', desc: 'Manage battle backgrounds, zoom, and toggle availability', color: '#14b8a6', icon: 'M4 4h16v12H4V4zm2 14h12v2H6v-2z', bg: '/backgrounds/dark_forest.png' },
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

const FACTION_MAP = {
  human: { name: 'Crusade', color: '#fbbf24', icon: '/icons/pack/factions/crusade-emblem.png' },
  barbarian: { name: 'Crusade', color: '#fbbf24', icon: '/icons/pack/factions/crusade-emblem.png' },
  orc: { name: 'Legion', color: '#ef4444', icon: '/icons/pack/factions/legion-emblem.png' },
  undead: { name: 'Legion', color: '#ef4444', icon: '/icons/pack/factions/legion-emblem.png' },
  elf: { name: 'Fabled', color: '#22d3ee', icon: '/icons/pack/factions/fabled-emblem.png' },
  dwarf: { name: 'Fabled', color: '#22d3ee', icon: '/icons/pack/factions/fabled-emblem.png' },
  pirates: { name: 'Pirates', color: '#d4a017', icon: '/factions/faction_pirates.png' },
};

const CLASS_ICON_MAP = {
  warrior: '/sprites/ui/icons/icon_crossed_swords.png',
  mage: '/sprites/ui/icons/icon_mage.png',
  worge: '/sprites/ui/icons/icon_worge.png',
  ranger: '/sprites/ui/icons/icon_ranger.png',
};

const STAT_COLORS = {
  strength: '#ef4444', agility: '#22c55e', intellect: '#8b5cf6', vitality: '#f59e0b',
  luck: '#fbbf24', defense: '#6b7280', speed: '#3b82f6', charisma: '#ec4899',
};

function HeroCard({ hero, expanded, onToggle }) {
  const cls = classDefinitions[hero.classId];
  const race = raceDefinitions[hero.raceId];
  const stats = cls ? getHeroStatsWithBonuses(hero) : null;
  const spriteData = getPlayerSprite(hero.classId, hero.raceId, hero.namedHeroId);
  const record = hero.battleRecord || { wins: 0, losses: 0, kills: 0, bossKills: 0, damageDealt: 0, healingDone: 0 };
  const namedHeroData = hero.namedHeroId ? namedHeroes[hero.namedHeroId] : null;
  const faction = (namedHeroData?.faction ? FACTION_MAP[namedHeroData.faction] : null) || FACTION_MAP[hero.raceId] || FACTION_MAP.human;
  const classIcon = CLASS_ICON_MAP[hero.classId];

  return (
    <div onClick={onToggle} style={{
      position: 'relative', overflow: 'hidden', cursor: 'pointer',
      borderRadius: 12, minHeight: expanded ? 340 : 200,
      border: `1px solid ${faction.color}33`,
      transition: 'all 0.3s ease',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at center, ${faction.color}15 0%, rgba(10,10,20,0.95) 70%)`,
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${faction.icon})`,
        backgroundSize: '160%', backgroundPosition: 'center 30%', backgroundRepeat: 'no-repeat',
        opacity: 0.06,
        filter: 'blur(1px)',
      }} />

      {classIcon && (
        <div style={{
          position: 'absolute', top: 10, right: 10, zIndex: 3,
          width: 36, height: 36, opacity: 0.5,
          backgroundImage: `url(${classIcon})`,
          backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
          filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.8))',
        }} />
      )}

      <div style={{
        position: 'absolute', left: '50%', top: expanded ? '22%' : '28%',
        transform: 'translateX(-50%)',
        zIndex: 1, opacity: 0.9,
        filter: `drop-shadow(0 4px 20px ${faction.color}40)`,
        transition: 'top 0.3s ease',
      }}>
        <SpriteAnimation spriteData={spriteData} animation="idle" scale={4} speed={180} />
      </div>

      <div style={{
        position: 'absolute', left: '50%', top: expanded ? '22%' : '28%',
        transform: 'translateX(-50%)',
        width: 120, height: 120, borderRadius: '50%',
        background: `radial-gradient(circle, ${faction.color}18 0%, transparent 70%)`,
        zIndex: 0,
        transition: 'top 0.3s ease',
      }} />

      <div style={{
        position: 'relative', zIndex: 2, padding: '16px 20px 0',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: "'Cinzel', serif", color: '#ffd700', fontWeight: 800,
            fontSize: '1.4rem', lineHeight: 1.1,
            textShadow: `0 0 20px ${faction.color}60, 0 2px 8px rgba(0,0,0,0.8)`,
          }}>
            {hero.name}
          </div>
          <div style={{
            fontSize: '0.85rem', color: faction.color, fontWeight: 600,
            marginTop: 4, letterSpacing: '0.05em',
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>
            {race?.name || hero.raceId} {cls?.name || hero.classId}
          </div>
          <div style={{
            display: 'flex', gap: 8, marginTop: 6, alignItems: 'center',
          }}>
            <span style={{
              fontSize: '0.75rem', color: '#6ee7b7', fontWeight: 700,
              background: 'rgba(110,231,183,0.12)', padding: '2px 10px', borderRadius: 10,
              border: '1px solid rgba(110,231,183,0.25)',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}>
              Lv.{hero.level}
            </span>
            <span style={{
              fontSize: '0.65rem', color: faction.color, opacity: 0.7,
              fontStyle: 'italic',
            }}>
              {faction.name}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex', gap: 10, fontSize: '0.75rem', fontWeight: 600,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>
          <span style={{ color: '#22c55e' }}>{record.wins}W</span>
          <span style={{ color: '#ef4444' }}>{record.losses}L</span>
          <span style={{ color: '#fbbf24' }}>{record.kills}K</span>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {stats && (
        <div style={{
          position: 'relative', zIndex: 2,
          background: 'linear-gradient(180deg, transparent 0%, rgba(5,5,15,0.85) 30%, rgba(5,5,15,0.95) 100%)',
          padding: expanded ? '28px 16px 14px' : '20px 16px 12px',
          transition: 'padding 0.3s ease',
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4,
          }}>
            {['strength', 'agility', 'intellect', 'vitality', 'luck', 'defense', 'speed', 'charisma'].map(k => (
              <div key={k} style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '0.5rem', color: STAT_COLORS[k], textTransform: 'uppercase',
                  fontWeight: 700, letterSpacing: '0.05em', opacity: 0.8,
                }}>{k.slice(0, 3)}</div>
                <div style={{
                  fontSize: '1rem', color: '#e2e8f0', fontWeight: 800,
                  fontFamily: "'Cinzel', serif",
                  textShadow: `0 0 8px ${STAT_COLORS[k]}40`,
                }}>{stats[k] || 0}</div>
              </div>
            ))}
          </div>

          {expanded && (
            <div style={{ marginTop: 12 }}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
                fontSize: '0.75rem',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.5rem', color: '#22c55e', textTransform: 'uppercase', fontWeight: 600, opacity: 0.7 }}>HP</div>
                  <div style={{ color: '#22c55e', fontWeight: 700 }}>{Math.floor(hero.currentHealth || 0)}<span style={{ opacity: 0.5 }}>/{Math.floor(stats.health)}</span></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.5rem', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 600, opacity: 0.7 }}>MP</div>
                  <div style={{ color: '#3b82f6', fontWeight: 700 }}>{Math.floor(hero.currentMana || 0)}<span style={{ opacity: 0.5 }}>/{Math.floor(stats.mana)}</span></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.5rem', color: '#f59e0b', textTransform: 'uppercase', fontWeight: 600, opacity: 0.7 }}>SP</div>
                  <div style={{ color: '#f59e0b', fontWeight: 700 }}>{Math.floor(hero.currentStamina || 0)}<span style={{ opacity: 0.5 }}>/{Math.floor(stats.stamina)}</span></div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.5rem', color: '#dc2626', textTransform: 'uppercase', fontWeight: 600, opacity: 0.7 }}>Grudge</div>
                  <div style={{ color: '#dc2626', fontWeight: 700 }}>{hero.grudge || 0}<span style={{ opacity: 0.5 }}>/100</span></div>
                </div>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6,
                fontSize: '0.7rem', marginTop: 10,
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.45rem', color: '#8a7d65', textTransform: 'uppercase', fontWeight: 600 }}>Boss Kills</div>
                  <div style={{ color: '#c084fc', fontWeight: 700 }}>{record.bossKills}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.45rem', color: '#8a7d65', textTransform: 'uppercase', fontWeight: 600 }}>Damage</div>
                  <div style={{ color: '#ef4444', fontWeight: 700 }}>{Math.floor(record.damageDealt).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.45rem', color: '#8a7d65', textTransform: 'uppercase', fontWeight: 600 }}>Healing</div>
                  <div style={{ color: '#22c55e', fontWeight: 700 }}>{Math.floor(record.healingDone).toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.45rem', color: '#8a7d65', textTransform: 'uppercase', fontWeight: 600 }}>Unspent</div>
                  <div style={{ color: '#ffd700', fontWeight: 700 }}>{hero.unspentPoints || 0}</div>
                </div>
              </div>

              {hero.equipment && Object.keys(hero.equipment).filter(s => hero.equipment[s]).length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div style={{
                    display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
                  }}>
                    {Object.entries(hero.equipment).filter(([, eq]) => eq).map(([slot, eq]) => (
                      <span key={slot} style={{
                        background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.15)',
                        borderRadius: 6, padding: '2px 8px', fontSize: '0.6rem',
                        color: '#6ee7b7',
                      }}>
                        {eq.name || `T${eq.tier} ${slot}`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 8, right: 12, zIndex: 3,
        color: '#6b7280', fontSize: '0.7rem', opacity: 0.5,
        transition: 'transform 0.3s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
      }}>&#9660;</div>
    </div>
  );
}

function EditorWrapper({ children }) {
  return (
    <div style={{
      position: 'relative', width: '100%', height: 'calc(100vh - 60px)',
      borderRadius: 8, overflow: 'hidden',
      border: '1px solid rgba(255,215,0,0.15)',
    }}>
      {children}
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

  const infoTabs = [
    { id: 'overview', label: 'Overview', color: '#ffd700' },
    { id: 'heroes', label: 'Characters (24)', color: '#3b82f6' },
    { id: 'world', label: 'World', color: '#22c55e' },
    { id: 'systems', label: 'Systems', color: '#8b5cf6' },
  ];

  const editorTabs = ADMIN_TOOLS.map(t => ({
    id: `editor_${t.id}`,
    label: t.label,
    color: t.color,
    icon: t.icon,
  }));

  const allTabs = [...infoTabs, ...editorTabs];
  const isEditorTab = activeTab.startsWith('editor_');

  const renderEditorContent = () => {
    const editorId = activeTab.replace('editor_', '');
    switch (editorId) {
      case 'map': return <EditorWrapper><AdminMap /></EditorWrapper>;
      case 'battle': return <EditorWrapper><AdminBattle /></EditorWrapper>;
      case 'sprite': return <EditorWrapper><AdminSprite /></EditorWrapper>;
      case 'ui': return <EditorWrapper><AdminUI /></EditorWrapper>;
      case 'icons': return <EditorWrapper><AdminIcons /></EditorWrapper>;
      case 'pvp': return <EditorWrapper><AdminPvP /></EditorWrapper>;
      case 'size': return <AdminSize onClose={() => setActiveTab('overview')} />;
      case 'maker': return <AdminMaker />;
      case 'backgrounds': return <AdminBackgrounds />;
      default: return null;
    }
  };

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
        background: 'rgba(20,15,30,0.92)', borderBottom: '2px solid rgba(180,150,90,0.4)',
        padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', zIndex: 10,
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{
            fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '1.2rem', margin: 0,
            textShadow: '0 0 12px rgba(255,215,0,0.3)',
          }}>
            Admin Hub
          </h1>
          <span style={{ fontSize: '0.6rem', color: '#6b7280', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: 4 }}>
            Grudge Warlords
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 2 }}>
            {infoTabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                background: activeTab === t.id ? `${t.color}22` : 'transparent',
                border: activeTab === t.id ? `1px solid ${t.color}55` : '1px solid transparent',
                color: activeTab === t.id ? t.color : '#6b7280',
                borderRadius: 4, padding: '4px 10px', fontSize: '0.6rem', cursor: 'pointer',
                fontWeight: activeTab === t.id ? 700 : 400,
                fontFamily: "'Cinzel', serif",
                transition: 'all 0.15s',
              }}>
                {t.label}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 20, background: 'rgba(255,215,0,0.2)' }} />

          <div style={{ display: 'flex', gap: 2, background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: 2 }}>
            {editorTabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                background: activeTab === t.id ? `${t.color}22` : 'transparent',
                border: activeTab === t.id ? `1px solid ${t.color}55` : '1px solid transparent',
                color: activeTab === t.id ? t.color : '#6b7280',
                borderRadius: 4, padding: '4px 8px', fontSize: '0.55rem', cursor: 'pointer',
                fontWeight: activeTab === t.id ? 700 : 400,
                display: 'flex', alignItems: 'center', gap: 4,
                transition: 'all 0.15s',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill={activeTab === t.id ? t.color : '#6b7280'}><path d={t.icon} /></svg>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <a href="/" style={{
          color: '#ffd700', textDecoration: 'none', fontWeight: 600, fontSize: '0.7rem',
          padding: '4px 12px', background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.2)',
          borderRadius: 6, flexShrink: 0,
        }}>
          Back to Game
        </a>
      </div>

      {isEditorTab ? (
        <div style={{ position: 'relative', zIndex: 10 }}>
          {renderEditorContent()}
        </div>
      ) : (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px', position: 'relative', zIndex: 10 }}>

          {activeTab === 'overview' && (
            <div>
              <div style={{
                background: 'rgba(20,15,30,0.5)', border: '1px solid rgba(255,215,0,0.12)',
                borderRadius: 10, padding: 16, marginBottom: 20,
              }}>
                <div style={{ fontSize: '0.65rem', color: '#8a7d65', textTransform: 'uppercase', marginBottom: 8 }}>Player Info</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '1.1rem', fontWeight: 700 }}>{playerName || 'Hero'}</span>
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
              <div style={{ fontSize: '0.65rem', color: '#8a7d65', textTransform: 'uppercase', marginBottom: 12 }}>
                Choosable Characters — 6 Races × 4 Classes = 24 Warlord Combinations
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {Object.values(raceDefinitions).map(race =>
                  Object.entries(classDefinitions).map(([clsId, cls]) => {
                    const faction = FACTION_MAP[race.id] || FACTION_MAP.human;
                    const classIcon = CLASS_ICON_MAP[clsId];
                    const spriteData = getPlayerSprite(clsId, race.id);
                    const baseStats = cls.baseStats || {};
                    return (
                      <div key={`${race.id}_${clsId}`} style={{
                        position: 'relative', overflow: 'hidden',
                        borderRadius: 10, height: 200,
                        border: `1px solid ${faction.color}33`,
                        display: 'flex', flexDirection: 'column',
                      }}>
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: `radial-gradient(ellipse at center, ${faction.color}15 0%, rgba(10,10,20,0.95) 70%)`,
                        }} />
                        {classIcon && (
                          <div style={{
                            position: 'absolute', top: 8, right: 8, zIndex: 3,
                            width: 28, height: 28, opacity: 0.4,
                            backgroundImage: `url(${classIcon})`,
                            backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                            filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.8))',
                          }} />
                        )}
                        <div style={{
                          position: 'absolute', left: '50%', top: '30%',
                          transform: 'translateX(-50%)',
                          zIndex: 1, opacity: 0.85,
                          filter: `drop-shadow(0 4px 16px ${faction.color}40)`,
                        }}>
                          <SpriteAnimation spriteData={spriteData} animation="idle" scale={3.2} speed={180} />
                        </div>
                        <div style={{
                          position: 'relative', zIndex: 2, padding: '10px 14px 0',
                        }}>
                          <div style={{
                            fontFamily: "'Cinzel', serif", color: '#ffd700', fontWeight: 700,
                            fontSize: '0.95rem', lineHeight: 1.1,
                            textShadow: `0 0 12px ${faction.color}60, 0 2px 6px rgba(0,0,0,0.8)`,
                          }}>
                            {race.name} {cls.name}
                          </div>
                          <div style={{
                            fontSize: '0.6rem', color: faction.color, opacity: 0.7,
                            marginTop: 2, fontStyle: 'italic',
                          }}>
                            {faction.name}
                          </div>
                        </div>
                        <div style={{ flex: 1 }} />
                        <div style={{
                          position: 'relative', zIndex: 2,
                          background: 'linear-gradient(180deg, transparent 0%, rgba(5,5,15,0.9) 40%)',
                          padding: '16px 10px 8px',
                        }}>
                          <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2,
                          }}>
                            {['strength', 'agility', 'intellect', 'vitality'].map(k => (
                              <div key={k} style={{ textAlign: 'center' }}>
                                <div style={{
                                  fontSize: '0.4rem', color: STAT_COLORS[k], textTransform: 'uppercase',
                                  fontWeight: 700, opacity: 0.8,
                                }}>{k.slice(0, 3)}</div>
                                <div style={{
                                  fontSize: '0.75rem', color: '#e2e8f0', fontWeight: 700,
                                  fontFamily: "'Cinzel', serif",
                                }}>{baseStats[k] || 0}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })
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
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: cleared ? '#6ee7b7' : '#e2e8f0' }}>{loc.name}</span>
                        {cleared && <span style={{ fontSize: '0.5rem', color: '#22c55e' }}>CLEARED</span>}
                      </div>
                      <div style={{ fontSize: '0.55rem', color: '#6b7280' }}>Lv.{loc.level || '?'} | Conquer: {Math.floor(conquer)}%</div>
                      {conquer > 0 && (
                        <div style={{ height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
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
              <div style={{ fontSize: '0.65rem', color: '#8a7d65', textTransform: 'uppercase', marginBottom: 12 }}>Game Systems Reference</div>
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
                <div style={{ fontSize: '0.65rem', color: '#8a7d65', textTransform: 'uppercase', marginBottom: 12 }}>Factions</div>
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
                <div style={{ fontSize: '0.65rem', color: '#8a7d65', textTransform: 'uppercase', marginBottom: 12 }}>Scene Types</div>
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
      )}
    </div>
  );
}
