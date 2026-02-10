import React, { useState, useMemo } from 'react';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { attributeDefinitions, calculateCombatPower, getBuildClassification, getRadarData } from '../data/attributes';
import { skillTrees } from '../data/skillTrees';
import { TIERS, EQUIPMENT_SLOTS, canClassEquip, WEAPON_TYPES, ARMOR_TYPES, HELMET_TYPES, FEET_TYPES } from '../data/equipment';
import { getAbilitiesForSlot, getDefaultLoadout, isSlotLocked, getAllAbilityMap } from '../utils/abilityLoadout';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import { UI_PANELS, UI_SLOTS, SLOT_ICON_MAP, SpriteIcon } from '../data/uiSprites.jsx';
import RadarChart from './RadarChart';

const ATTRIBUTES = Object.keys(attributeDefinitions);

function MiniBar({ current, max, color, height = 6, label }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  return (
    <div style={{ marginBottom: 4 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: 1 }}>
          <span>{label}</span>
          <span>{Math.floor(current)}/{Math.floor(max)}</span>
        </div>
      )}
      <div style={{ height, background: 'rgba(0,0,0,0.4)', borderRadius: height / 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)`, borderRadius: height / 2, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

function HeroCard({ hero, isSelected, onClick, isActive }) {
  const cls = classDefinitions[hero.classId];
  const race = hero.raceId ? raceDefinitions[hero.raceId] : null;
  const stats = getHeroStatsWithBonuses(hero);
  const cp = calculateCombatPower(stats);
  const hasPoints = (hero.unspentPoints || 0) > 0 || (hero.skillPoints || 0) > 0;

  return (
    <div onClick={onClick} style={{
      background: isSelected
        ? 'linear-gradient(135deg, rgba(110,231,183,0.2), rgba(110,231,183,0.05))'
        : 'linear-gradient(135deg, rgba(20,26,43,0.9), rgba(42,49,80,0.5))',
      border: `2px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
      borderRadius: 14, padding: 16, cursor: 'pointer',
      transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
      minWidth: 170,
    }}
    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = 'rgba(110,231,183,0.5)'; }}
    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = 'var(--border)'; }}
    >
      {hasPoints && (
        <div style={{
          position: 'absolute', top: 6, right: 6, width: 10, height: 10,
          borderRadius: '50%', background: 'var(--danger)',
          animation: 'pulse 1.5s infinite',
          boxShadow: '0 0 8px rgba(239,68,68,0.6)',
        }} />
      )}

      {isActive && (
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: 'rgba(110,231,183,0.2)', border: '1px solid var(--accent)',
          borderRadius: 4, padding: '1px 6px', fontSize: '0.5rem',
          color: 'var(--accent)', fontWeight: 700, letterSpacing: 1,
        }}>ACTIVE</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginTop: isActive ? 12 : 0 }}>
        <div style={{
          filter: isSelected ? `drop-shadow(0 0 8px ${cls?.color || 'var(--accent)'}40)` : 'none',
          transition: 'filter 0.3s',
        }}>
          <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={2.8} speed={150} />
        </div>

        <div style={{ textAlign: 'center' }}>
          <div className="font-cinzel" style={{
            color: isSelected ? 'var(--gold)' : 'var(--text)',
            fontSize: '0.85rem', fontWeight: 700,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 140,
          }}>
            {hero.name}
          </div>
          <div style={{ color: cls?.color || 'var(--muted)', fontSize: '0.7rem', fontWeight: 600 }}>
            Lv.{hero.level} {race?.name || ''} {cls?.name || ''}
          </div>
        </div>

        <MiniBar current={hero.currentHealth} max={stats.health} color="#22c55e" height={4} />
        <MiniBar current={hero.currentMana} max={stats.mana} color="#3b82f6" height={3} />

        <div style={{
          fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 600,
          background: 'rgba(255,215,0,0.1)', padding: '2px 8px', borderRadius: 4,
        }}>
          CP: {cp.toLocaleString()}
        </div>
      </div>
    </div>
  );
}

function AbilityCard({ ability, idx, cls, isCurrent, isAlt, altBadge }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: isAlt
        ? 'linear-gradient(135deg, rgba(217,119,6,0.08), rgba(42,49,80,0.4))'
        : 'rgba(42,49,80,0.4)',
      border: `1px solid ${isAlt ? 'rgba(217,119,6,0.25)' : 'var(--border)'}`,
      borderRadius: 12, padding: 12, display: 'flex', gap: 10, alignItems: 'flex-start',
    }}>
      <div style={{
        fontSize: '1.5rem', width: 42, height: 42, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)', borderRadius: 8,
        border: `1px solid ${isAlt ? '#d97706' : cls?.color || 'var(--border)'}`,
        position: 'relative',
      }}>
        {ability.icon}
        {isCurrent && (
          <div style={{
            position: 'absolute', top: -4, left: -4, width: 16, height: 16,
            background: cls?.color || 'var(--accent)', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.55rem', fontWeight: 700, color: '#0b1020',
          }}>{idx + 1}</div>
        )}
        {altBadge && (
          <div style={{
            position: 'absolute', top: -4, right: -4, width: 16, height: 16,
            background: '#d97706', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.5rem', fontWeight: 700, color: '#0b1020',
          }}>{altBadge}</div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: '0.8rem', color: isAlt ? '#d97706' : 'var(--text)', marginBottom: 2 }}>
          {ability.name}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginBottom: 4, lineHeight: 1.3 }}>
          {ability.description}
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {ability.damage > 0 && (
            <span style={{ fontSize: '0.55rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
              {(ability.damage * 100).toFixed(0)}% DMG
            </span>
          )}
          {ability.type === 'heal' && ability.healPercent && (
            <span style={{ fontSize: '0.55rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
              {(ability.healPercent * 100)}% Heal
            </span>
          )}
          {ability.type === 'heal_over_time' && (
            <span style={{ fontSize: '0.55rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
              HoT {ability.duration}T
            </span>
          )}
          {(ability.type === 'buff' || ability.type === 'revert_form') && ability.damage === 0 && (
            <span style={{ fontSize: '0.55rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(110,231,183,0.15)', color: 'var(--accent)' }}>
              {ability.type === 'revert_form' ? 'Revert' : 'Buff'}
            </span>
          )}
          {ability.manaCost > 0 && (
            <span style={{ fontSize: '0.55rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
              {ability.manaCost} MP
            </span>
          )}
          {ability.staminaCost > 0 && (
            <span style={{ fontSize: '0.55rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
              {ability.staminaCost} SP
            </span>
          )}
          {ability.cooldown > 0 && (
            <span style={{ fontSize: '0.55rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(107,114,128,0.15)', color: '#9ca3af' }}>
              {ability.cooldown}T CD
            </span>
          )}
        </div>
        {ability.effect && (
          <div style={{ fontSize: '0.55rem', color: 'var(--gold)', marginTop: 3 }}>
            {ability.effect.type === 'stun' ? 'Stun' : ability.effect.type === 'dot' ? 'DoT' : ability.effect.stat}{' '}
            {ability.effect.duration && `(${ability.effect.duration}T)`}
          </div>
        )}
      </div>
    </div>
  );
}

function LoadoutEditor({ hero, cls, selectingSlot, setSelectingSlot, setHeroLoadout }) {
  const weaponType = hero.equipment?.weapon?.weaponType || null;
  const loadout = hero.abilityLoadout || getDefaultLoadout(hero.classId, weaponType);
  const abilityMap = useMemo(() => getAllAbilityMap(hero.classId, weaponType, hero.unlockedSkills || {}), [hero.classId, weaponType, hero.unlockedSkills]);
  const slotAbilities = useMemo(() => {
    const result = {};
    for (let i = 0; i < 5; i++) {
      result[i] = getAbilitiesForSlot(i, hero.classId, weaponType, hero.unlockedSkills || {});
    }
    return result;
  }, [hero.classId, weaponType, hero.unlockedSkills]);

  const isWorge = hero.classId === 'worge';
  const slotCount = 5;

  const handleSlotSelect = (abilityId) => {
    if (selectingSlot === null) return;
    const newLoadout = [...loadout];
    const existingIdx = newLoadout.indexOf(abilityId);
    if (existingIdx !== -1 && existingIdx !== selectingSlot) {
      newLoadout[existingIdx] = newLoadout[selectingSlot];
    }
    newLoadout[selectingSlot] = abilityId;
    setHeroLoadout(hero.id, newLoadout);
    setSelectingSlot(null);
  };

  const resetLoadout = () => {
    setHeroLoadout(hero.id, getDefaultLoadout(hero.classId, weaponType));
    setSelectingSlot(null);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>
          Ability Loadout
        </h4>
        <button onClick={resetLoadout} style={{
          background: 'rgba(100,100,120,0.2)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '3px 10px', fontSize: '0.65rem',
          color: 'var(--muted)', cursor: 'pointer',
        }}>Reset Default</button>
      </div>

      <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginBottom: 10, lineHeight: 1.4 }}>
        Tap a slot to change its ability. Slot 5 is locked to your class signature ability.{weaponType ? ` Weapon skills from: ${weaponType}.` : ''}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {Array.from({ length: slotCount }).map((_, idx) => {
          const abilityId = loadout[idx];
          const ability = abilityMap[abilityId];
          const locked = isSlotLocked(hero.classId, idx);
          const isSelected = selectingSlot === idx;
          const altAbility = isWorge && cls?.bearFormAbilities?.[abilityId] ? cls.bearFormAbilities[abilityId] : null;

          return (
            <div key={idx}>
              <div
                onClick={() => !locked && setSelectingSlot(isSelected ? null : idx)}
                style={{
                  display: 'flex', gap: 10, alignItems: 'center',
                  background: isSelected ? 'rgba(110,231,183,0.08)' : 'rgba(42,49,80,0.4)',
                  border: `2px solid ${isSelected ? 'var(--accent)' : locked ? 'rgba(100,100,120,0.3)' : 'var(--border)'}`,
                  borderRadius: 10, padding: '8px 12px',
                  cursor: locked ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  opacity: locked ? 0.7 : 1,
                }}
              >
                <div style={{
                  width: 24, height: 24, flexShrink: 0,
                  background: cls?.color || 'var(--accent)', borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 700, color: '#0b1020',
                }}>{idx + 1}</div>
                {ability ? (
                  <>
                    <div style={{
                      fontSize: '1.3rem', width: 36, height: 36, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(0,0,0,0.3)', borderRadius: 8,
                      border: `1px solid ${cls?.color || 'var(--border)'}`,
                    }}>{ability.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--text)' }}>{ability.name}</div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--muted)', lineHeight: 1.3 }}>{ability.description}</div>
                      <div style={{ display: 'flex', gap: 3, marginTop: 2, flexWrap: 'wrap' }}>
                        {ability.manaCost > 0 && <span style={{ fontSize: '0.5rem', padding: '1px 4px', borderRadius: 3, background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>{ability.manaCost} MP</span>}
                        {ability.staminaCost > 0 && <span style={{ fontSize: '0.5rem', padding: '1px 4px', borderRadius: 3, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>{ability.staminaCost} SP</span>}
                        {ability.cooldown > 0 && <span style={{ fontSize: '0.5rem', padding: '1px 4px', borderRadius: 3, background: 'rgba(100,100,120,0.2)', color: 'var(--muted)' }}>{ability.cooldown}T CD</span>}
                      </div>
                    </div>
                  </>
                ) : (
                  <div style={{ flex: 1, color: 'var(--muted)', fontSize: '0.7rem', fontStyle: 'italic' }}>Empty Slot</div>
                )}
                {locked && <div style={{ fontSize: '0.6rem', color: '#d97706', fontWeight: 600 }}>Locked</div>}
                {!locked && <div style={{ fontSize: '0.8rem', color: isSelected ? 'var(--accent)' : 'var(--muted)' }}>{isSelected ? '...' : '>'}</div>}
              </div>
              {altAbility && (
                <div style={{
                  marginLeft: 34, marginTop: 2, padding: '4px 10px',
                  background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)',
                  borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: '0.6rem', color: '#d97706',
                }}>
                  <span>🐻</span>
                  <span style={{ fontWeight: 600 }}>{altAbility.name}</span>
                  <span style={{ color: 'var(--muted)' }}>in Bear Form</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {selectingSlot !== null && (
        <div>
          <div style={{
            fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)',
            marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            Choose ability for Slot {selectingSlot + 1}
            <button onClick={() => setSelectingSlot(null)} style={{
              background: 'none', border: '1px solid var(--border)',
              borderRadius: 4, padding: '1px 8px', fontSize: '0.6rem',
              color: 'var(--muted)', cursor: 'pointer',
            }}>Cancel</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {(slotAbilities[selectingSlot] || []).map(ability => {
              const alreadySlotted = loadout.includes(ability.id);
              const isCurrentSlot = loadout[selectingSlot] === ability.id;
              return (
                <div key={ability.id}
                  onClick={() => handleSlotSelect(ability.id)}
                  style={{
                    display: 'flex', gap: 8, alignItems: 'center',
                    background: isCurrentSlot ? 'rgba(110,231,183,0.1)' : 'rgba(30,35,55,0.5)',
                    border: `1px solid ${isCurrentSlot ? 'var(--accent)' : alreadySlotted ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                    borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  <div style={{
                    fontSize: '1.1rem', width: 30, height: 30, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.3)', borderRadius: 6,
                  }}>{ability.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.7rem', color: 'var(--text)' }}>{ability.name}</div>
                    <div style={{ fontSize: '0.55rem', color: 'var(--muted)' }}>{ability.description}</div>
                  </div>
                  {alreadySlotted && !isCurrentSlot && (
                    <div style={{ fontSize: '0.5rem', color: '#f59e0b', fontWeight: 600 }}>
                      Slot {loadout.indexOf(ability.id) + 1}
                    </div>
                  )}
                  {isCurrentSlot && <div style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 600 }}>Current</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function HeroDetailPanel({ hero, onClose }) {
  const { unlockHeroSkill, allocateHeroPoint, deallocateHeroPoint, activeHeroIds, setActiveHeroes, equipItem, unequipItem, inventory, setHeroLoadout } = useGameStore();
  const [tab, setTab] = useState('stats');
  const [selectingSlot, setSelectingSlot] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const cls = classDefinitions[hero.classId];
  const race = hero.raceId ? raceDefinitions[hero.raceId] : null;
  const stats = getHeroStatsWithBonuses(hero);
  const cp = calculateCombatPower(stats);
  const tree = skillTrees[hero.classId];
  const heroSkills = hero.unlockedSkills || {};
  const isActive = activeHeroIds.includes(hero.id);

  const mainStats = [
    { key: 'health', label: 'Health', icon: '❤️', color: '#22c55e' },
    { key: 'mana', label: 'Mana', icon: '💧', color: '#3b82f6' },
    { key: 'stamina', label: 'Stamina', icon: '⚡', color: '#f59e0b' },
    { key: 'physicalDamage', label: 'Phys DMG', icon: '⚔️', color: '#ef4444' },
    { key: 'magicDamage', label: 'Magic DMG', icon: '🔮', color: '#8b5cf6' },
    { key: 'defense', label: 'Defense', icon: '🛡️', color: '#6b7280' },
  ];

  const combatStats = [
    { key: 'criticalChance', label: 'Crit %', format: v => (v || 0).toFixed(1) + '%' },
    { key: 'criticalDamage', label: 'Crit DMG', format: v => (v || 0).toFixed(0) + '%' },
    { key: 'block', label: 'Block %', format: v => (v || 0).toFixed(1) + '%' },
    { key: 'evasion', label: 'Evasion', format: v => (v || 0).toFixed(1) + '%' },
    { key: 'drainHealth', label: 'Lifesteal', format: v => (v || 0).toFixed(1) + '%' },
    { key: 'damageReduction', label: 'DMG Redux', format: v => (v || 0).toFixed(1) + '%' },
    { key: 'healthRegen', label: 'HP Regen', format: v => (v || 0).toFixed(1) + '/s' },
    { key: 'manaRegen', label: 'MP Regen', format: v => (v || 0).toFixed(1) + '/s' },
    { key: 'cooldownReduction', label: 'CDR', format: v => (v || 0).toFixed(1) + '%' },
  ];

  const isSkillAvailable = (skill, tier) => {
    if (hero.level < tier.requiredLevel) return false;
    if (skill.requires && !(heroSkills[skill.requires] > 0)) return false;
    const current = heroSkills[skill.id] || 0;
    if (current >= skill.maxPoints) return false;
    if ((hero.skillPoints || 0) <= 0) return false;
    return true;
  };

  const toggleActive = () => {
    if (isActive) {
      if (activeHeroIds.length <= 1) return;
      setActiveHeroes(activeHeroIds.filter(id => id !== hero.id));
    } else {
      if (activeHeroIds.length >= 3) return;
      setActiveHeroes([...activeHeroIds, hero.id]);
    }
  };

  const tabs = [
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'equipment', label: 'Gear', icon: '🛡️' },
    { id: 'abilities', label: 'Abilities', icon: '⚔️' },
    { id: 'skills', label: 'Skills', icon: '🌳' },
    { id: 'attributes', label: 'Attributes', icon: '📈' },
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(14,22,48,0.98), rgba(20,26,43,0.95))',
      border: '1px solid var(--border)', borderRadius: 16,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{
        background: `linear-gradient(135deg, ${cls?.color || 'var(--accent)'}15, transparent)`,
        borderBottom: `2px solid ${cls?.color || 'var(--border)'}`,
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <div style={{ filter: `drop-shadow(0 0 12px ${cls?.color || 'var(--accent)'}50)` }}>
          <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={4} speed={150} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.3rem' }}>{hero.name}</div>
          <div style={{ color: cls?.color, fontSize: '0.85rem', fontWeight: 600 }}>
            Level {hero.level} {race?.name || ''} {cls?.name || ''}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(255,215,0,0.15)', border: '1px solid var(--gold)',
              padding: '2px 10px', borderRadius: 6, fontSize: '0.75rem',
              color: 'var(--gold)', fontWeight: 700,
            }}>CP: {cp.toLocaleString()}</span>
            <button onClick={toggleActive} style={{
              background: isActive ? 'rgba(110,231,183,0.2)' : 'rgba(42,49,80,0.5)',
              border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
              padding: '2px 10px', borderRadius: 6, fontSize: '0.7rem',
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer', fontWeight: 600,
            }}>
              {isActive ? '✓ In Party' : '+ Add to Party'}
            </button>
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)', background: 'rgba(0,0,0,0.2)',
      }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSelectedItemId(null); }} style={{
            flex: 1, padding: '10px 8px', border: 'none',
            background: tab === t.id ? 'rgba(110,231,183,0.1)' : 'transparent',
            borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            <span style={{ marginRight: 4 }}>{t.icon}</span>{t.label}
            {t.id === 'attributes' && (hero.unspentPoints || 0) > 0 && (
              <span style={{ color: 'var(--danger)', marginLeft: 4, fontSize: '0.65rem' }}>({hero.unspentPoints})</span>
            )}
            {t.id === 'skills' && (hero.skillPoints || 0) > 0 && (
              <span style={{ color: 'var(--danger)', marginLeft: 4, fontSize: '0.65rem' }}>({hero.skillPoints})</span>
            )}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {tab === 'stats' && (() => {
          const build = getBuildClassification(stats, hero.attributePoints || {});
          const radar = getRadarData(stats);
          return (
          <div>
            <div style={{ marginBottom: 12 }}>
              <MiniBar current={hero.currentHealth} max={stats.health} color="#22c55e" height={8} label="HP" />
              <MiniBar current={hero.currentMana} max={stats.mana} color="#3b82f6" height={6} label="MP" />
              <MiniBar current={hero.currentStamina} max={stats.stamina} color="#f59e0b" height={6} label="SP" />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ color: 'var(--accent)', fontSize: '0.8rem', marginBottom: 6, borderBottom: '1px solid var(--border)', paddingBottom: 3 }}>
                  Core Stats
                </h4>
                {mainStats.map(s => (
                  <div key={s.key} style={{
                    display: 'flex', justifyContent: 'space-between', padding: '4px 0',
                    borderBottom: '1px solid rgba(255,255,255,0.03)',
                  }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{s.icon} {s.label}</span>
                    <span style={{ color: s.color, fontWeight: 700, fontFamily: 'monospace', fontSize: '0.8rem' }}>{Math.floor(stats[s.key])}</span>
                  </div>
                ))}

                <h4 style={{ color: 'var(--accent)', fontSize: '0.8rem', marginTop: 12, marginBottom: 6, borderBottom: '1px solid var(--border)', paddingBottom: 3 }}>
                  Combat Stats
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 8px' }}>
                  {combatStats.map(s => (
                    <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: '0.7rem' }}>
                      <span style={{ color: 'var(--muted)' }}>{s.label}</span>
                      <span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{s.format(stats[s.key])}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                width: 200, flexShrink: 0,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
              }}>
                <div style={{
                  textAlign: 'center', padding: '8px 12px', borderRadius: 8,
                  border: `2px solid ${build.tierColor}`,
                  boxShadow: `0 0 16px ${build.tierColor}25`,
                  background: `linear-gradient(135deg, ${build.tierColor}10, transparent)`,
                  width: '100%',
                }}>
                  <div style={{ fontSize: '0.65rem', color: build.tierColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {build.tier} (Rank {build.rank})
                  </div>
                  <div className="font-cinzel" style={{
                    fontSize: '0.95rem', fontWeight: 700, color: build.tierColor,
                    marginTop: 2, lineHeight: 1.2,
                    textShadow: `0 0 8px ${build.tierColor}40`,
                  }}>
                    {build.name}
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--muted)', marginTop: 3, fontStyle: 'italic' }}>
                    {build.desc}
                  </div>
                </div>

                <RadarChart
                  labels={radar.labels}
                  values={radar.values}
                  size={190}
                  color={build.tierColor}
                />

                <div style={{
                  display: 'flex', gap: 12, justifyContent: 'center', width: '100%',
                  background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '6px 10px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>Power</div>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#fbbf24', fontFamily: 'monospace' }}>{cp.toLocaleString()}</div>
                  </div>
                  <div style={{ width: 1, background: 'var(--border)' }} />
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>Rating</div>
                    <div style={{
                      fontSize: '1rem', fontWeight: 700, fontFamily: 'monospace',
                      color: build.rating.startsWith('S') ? '#fbbf24' : build.rating === 'A' ? '#a855f7' : 'var(--text)',
                    }}>{build.rating}</div>
                  </div>
                </div>
              </div>
            </div>

            {race && (
              <div style={{
                marginTop: 12, padding: 10, background: 'rgba(42,49,80,0.3)',
                borderRadius: 8, border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--gold)', fontWeight: 600, marginBottom: 2 }}>
                  <img src={race.icon} alt={race.name} style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', marginRight: 4 }} />{race.name} — {race.trait}
                </div>
                <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>{race.traitDescription}</div>
              </div>
            )}
          </div>
          );
        })()}

        {tab === 'equipment' && (() => {
          const eq = hero.equipment || {};
          const is2H = eq.weapon?.weaponType && WEAPON_TYPES[eq.weapon.weaponType]?.hand === '2h';
          const SLOT_LABELS = { weapon: 'Main Hand', offhand: 'Off-Hand', helmet: 'Helmet', armor: 'Chest', feet: 'Feet', ring: 'Ring', relic: 'Relic' };
          const SLOT_EMOJIS = { weapon: '⚔️', offhand: '🛡️', helmet: '⛑️', armor: '🛡️', feet: '🥾', ring: '💍', relic: '🔮' };

          const selectedItem = selectedItemId ? inventory.find(i => i.id === selectedItemId) : null;
          const slotCanReceiveSelected = (slot) => selectedItem && selectedItem.slot === slot && canClassEquip(hero.classId, selectedItem);

          const renderSlot = (slot, size = 52, disabled = false) => {
            const equipped = eq[slot];
            const tierDef = equipped ? TIERS[equipped.tier] || TIERS[1] : null;
            const canReceive = !disabled && slotCanReceiveSelected(slot);
            return (
              <div
                title={equipped ? `${equipped.name} [T${equipped.tier}]\n${Object.entries(equipped.stats).map(([k,v]) => `+${v} ${k}`).join(', ')}\nClick to unequip` : disabled ? 'Locked (2H weapon)' : `${SLOT_LABELS[slot]} - Empty`}
                onClick={() => {
                  if (canReceive) {
                    equipItem(hero.id, selectedItem);
                    setSelectedItemId(null);
                  } else if (equipped && !disabled) {
                    unequipItem(hero.id, slot);
                  }
                }}
                onDragOver={e => { if (!disabled) { e.preventDefault(); e.currentTarget.style.borderColor = '#f59e0b'; } }}
                onDragLeave={e => { e.currentTarget.style.borderColor = canReceive ? '#22c55e' : (tierDef ? tierDef.color + '80' : '#5c4a32'); }}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.style.borderColor = tierDef ? tierDef.color + '80' : '#5c4a32';
                  if (disabled) return;
                  try {
                    const itemData = JSON.parse(e.dataTransfer.getData('text/plain'));
                    if (itemData.slot === slot) {
                      const item = inventory.find(i => i.id === itemData.id);
                      if (item && canClassEquip(hero.classId, item)) {
                        equipItem(hero.id, item);
                        setSelectedItemId(null);
                      }
                    }
                  } catch {}
                }}
                style={{
                  width: size, height: size, borderRadius: 6,
                  backgroundImage: `url(${UI_SLOTS.empty})`,
                  backgroundSize: `${size}px ${size}px`, imageRendering: 'pixelated',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column',
                  border: `2px solid ${canReceive ? '#22c55e' : (tierDef ? tierDef.color + '80' : '#5c4a32')}`,
                  cursor: canReceive ? 'pointer' : (equipped ? 'pointer' : 'default'),
                  position: 'relative',
                  opacity: disabled ? 0.3 : 1,
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  boxShadow: canReceive ? '0 0 8px rgba(34,197,94,0.4), inset 0 0 6px rgba(34,197,94,0.15)' : 'none',
                }}
              >
                {equipped ? (
                  <span style={{ fontSize: size > 48 ? '1.5rem' : '1.2rem', filter: 'drop-shadow(0 0 3px rgba(0,0,0,0.9))' }}>{equipped.icon}</span>
                ) : (
                  <span style={{ fontSize: size > 48 ? '1.2rem' : '1rem', opacity: canReceive ? 0.7 : 0.3 }}>{SLOT_EMOJIS[slot]}</span>
                )}
                {tierDef && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: tierDef.color, borderRadius: '0 0 4px 4px' }} />}
                <div style={{ position: 'absolute', top: -14, fontSize: '0.5rem', color: canReceive ? '#22c55e' : '#a08b6d', textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>
                  {SLOT_LABELS[slot]}
                </div>
                {canReceive && (
                  <div style={{
                    position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)',
                    width: 0, height: 0,
                    borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                    borderBottom: '6px solid #22c55e',
                    filter: 'drop-shadow(0 0 3px rgba(34,197,94,0.6))',
                  }} />
                )}
              </div>
            );
          };

          return (
            <div>
              <div style={{
                background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 16, marginBottom: 12,
                border: '2px solid #8b7355',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 14,
                  background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '4px 12px',
                }}>
                  <span className="font-cinzel" style={{ color: '#d4a96a', fontSize: '0.85rem', letterSpacing: 2 }}>EQUIPMENT</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ filter: `drop-shadow(0 0 8px ${cls?.color || 'var(--accent)'}50)` }}>
                      <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={3.5} speed={150} />
                    </div>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.95rem' }}>{hero.name}</div>
                    <div style={{ color: cls?.color, fontSize: '0.7rem', fontWeight: 600 }}>
                      Lv.{hero.level} {race?.name || ''} {cls?.name || ''}
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--gold)', marginTop: 4 }}>CP: {cp.toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                    <div>❤️ {Math.floor(stats.health)}</div>
                    <div>⚔️ {Math.floor(stats.physicalDamage)}</div>
                    <div>🔮 {Math.floor(stats.magicDamage)}</div>
                    <div>🛡️ {Math.floor(stats.defense)}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <div style={{ paddingTop: 14 }}>
                    {renderSlot('helmet', 50)}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 14 }}>
                    {renderSlot('offhand', 50, is2H)}
                    {renderSlot('armor', 56)}
                    {renderSlot('weapon', 50)}
                  </div>

                  <div style={{ paddingTop: 14 }}>
                    {renderSlot('feet', 50)}
                  </div>

                  <div style={{ display: 'flex', gap: 16, paddingTop: 14 }}>
                    {renderSlot('ring', 46)}
                    {renderSlot('relic', 46)}
                  </div>
                </div>

                {is2H && (
                  <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.6rem', color: '#f59e0b', fontStyle: 'italic' }}>
                    2H weapon equipped — off-hand locked
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8,
                background: 'rgba(0,0,0,0.3)', borderRadius: 4, padding: '4px 12px',
                border: '2px solid #8b7355',
              }}>
                <span className="font-cinzel" style={{ color: '#d4a96a', fontSize: '0.85rem', letterSpacing: 2 }}>INVENTORY</span>
                <span style={{ color: '#a08b6d', fontSize: '0.7rem', marginLeft: 6 }}>({inventory.length})</span>
              </div>
              {inventory.length === 0 ? (
                <div style={{ color: '#6b5c47', fontSize: '0.8rem', fontStyle: 'italic', padding: '12px 0', textAlign: 'center' }}>
                  No items. Defeat enemies to find loot!
                </div>
              ) : (
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 4,
                  maxHeight: 220, overflowY: 'auto', padding: 8,
                  background: 'rgba(0,0,0,0.2)', borderRadius: 4, border: '2px solid #5c4a32',
                }}>
                  {inventory.map(item => {
                    const r = TIERS[item.tier] || TIERS[1];
                    const itemCanEquip = canClassEquip(hero.classId, item);
                    const isSelected = selectedItemId === item.id;
                    return (
                      <div key={item.id}
                        draggable={itemCanEquip}
                        onDragStart={e => {
                          e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, slot: item.slot }));
                          e.dataTransfer.effectAllowed = 'move';
                          setSelectedItemId(null);
                        }}
                        onClick={() => {
                          if (!itemCanEquip) return;
                          if (isSelected) {
                            setSelectedItemId(null);
                          } else {
                            setSelectedItemId(item.id);
                          }
                        }}
                        title={`${item.name} [T${item.tier} ${r.name}]\n${item.slot}${item.weaponType ? ' - ' + (WEAPON_TYPES[item.weaponType]?.name || item.weaponType) : ''}${item.armorType ? ' - ' + (ARMOR_TYPES[item.armorType]?.name || item.armorType) : ''}${item.helmetType ? ' - ' + (HELMET_TYPES[item.helmetType]?.name || item.helmetType) : ''}${item.feetType ? ' - ' + (FEET_TYPES[item.feetType]?.name || item.feetType) : ''}\n${Object.entries(item.stats).map(([k, v]) => `+${v} ${k}`).join(', ')}${!itemCanEquip ? '\n(Cannot equip)' : isSelected ? '\nClick slot to equip · Click again to deselect' : '\nClick to select · Drag to equip'}`}
                        style={{
                          width: 56, height: 56,
                          backgroundImage: `url(${UI_SLOTS.empty})`,
                          backgroundSize: '56px 56px', imageRendering: 'pixelated',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `2px solid ${isSelected ? '#22c55e' : r.color + '80'}`,
                          borderRadius: 4, cursor: itemCanEquip ? 'pointer' : 'not-allowed',
                          position: 'relative',
                          opacity: itemCanEquip ? 1 : 0.5,
                          transition: 'transform 0.1s, border-color 0.15s, box-shadow 0.15s',
                          boxShadow: isSelected ? '0 0 10px rgba(34,197,94,0.5), inset 0 0 8px rgba(34,197,94,0.15)' : 'none',
                        }}
                        onMouseEnter={e => { if (itemCanEquip) e.currentTarget.style.transform = 'scale(1.1)'; }}
                        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <span style={{ fontSize: '1.4rem', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }}>{item.icon}</span>
                        <div style={{
                          position: 'absolute', bottom: 0, left: 0, right: 0,
                          height: 3, background: isSelected ? '#22c55e' : r.color, borderRadius: '0 0 2px 2px',
                        }} />
                        {isSelected && (
                          <div style={{
                            position: 'absolute', top: -8, right: -8,
                            width: 0, height: 0,
                            borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
                            borderBottom: '7px solid #22c55e',
                            filter: 'drop-shadow(0 0 3px rgba(34,197,94,0.8))',
                            transform: 'rotate(180deg)',
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

        {tab === 'abilities' && (
          <LoadoutEditor hero={hero} cls={cls} selectingSlot={selectingSlot} setSelectingSlot={setSelectingSlot} setHeroLoadout={setHeroLoadout} />
        )}

        {tab === 'skills' && tree && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ color: tree.color, fontSize: '0.85rem' }}>
                {tree.className} Skill Tree
              </h4>
              <div style={{
                background: 'rgba(110,231,183,0.1)', border: '1px solid var(--accent)',
                borderRadius: 6, padding: '3px 10px', fontSize: '0.8rem',
                color: 'var(--accent)', fontWeight: 700,
              }}>
                {hero.skillPoints || 0} pts
              </div>
            </div>

            {tree.tiers.map((tier, tierIdx) => {
              const tierLocked = hero.level < tier.requiredLevel;
              return (
                <div key={tierIdx} style={{ marginBottom: 20 }}>
                  <div style={{
                    fontSize: '0.7rem', color: tierLocked ? 'var(--muted)' : 'var(--gold)',
                    fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1,
                  }}>
                    {tier.name}
                    {tierLocked && <span style={{ color: 'var(--danger)', marginLeft: 6, fontSize: '0.65rem' }}>(Lv.{tier.requiredLevel})</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {tier.skills.map(skill => {
                      const available = isSkillAvailable(skill, tier);
                      const unlocked = (heroSkills[skill.id] || 0) > 0;
                      const maxed = (heroSkills[skill.id] || 0) >= skill.maxPoints;
                      const current = heroSkills[skill.id] || 0;
                      const locked = tierLocked || (skill.requires && !(heroSkills[skill.requires] > 0));

                      return (
                        <div key={skill.id}
                          onClick={() => available && unlockHeroSkill(hero.id, skill.id)}
                          style={{
                            background: maxed
                              ? `linear-gradient(135deg, ${tree.color}25, ${tree.color}10)`
                              : unlocked ? 'rgba(42,49,80,0.6)' : 'rgba(20,26,43,0.5)',
                            border: `2px solid ${maxed ? tree.color : unlocked ? 'var(--gold)' : available ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: 10, padding: 12, flex: '1 1 140px', maxWidth: 180,
                            cursor: available ? 'pointer' : 'default',
                            opacity: locked ? 0.4 : 1, transition: 'all 0.2s',
                            textAlign: 'center', position: 'relative',
                          }}
                        >
                          <div style={{ fontSize: '1.3rem', marginBottom: 4 }}>{skill.icon}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.75rem', color: unlocked ? 'var(--gold)' : 'var(--text)', marginBottom: 2 }}>
                            {skill.name}
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.6rem', marginBottom: 4 }}>{skill.description}</div>
                          <div style={{ color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 600, marginBottom: 4 }}>{skill.effect}</div>
                          <div style={{
                            background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '2px 8px',
                            display: 'inline-block', fontSize: '0.7rem',
                            color: maxed ? tree.color : 'var(--gold)', fontWeight: 700,
                          }}>
                            {current}/{skill.maxPoints}
                          </div>
                          {maxed && (
                            <div style={{
                              position: 'absolute', top: -6, right: -6,
                              background: tree.color, borderRadius: '50%',
                              width: 18, height: 18, display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '0.65rem',
                            }}>✓</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'attributes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ color: 'var(--gold)', fontSize: '0.85rem' }}>Attributes</h4>
              <div style={{
                background: (hero.unspentPoints || 0) > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
                border: `1px solid ${(hero.unspentPoints || 0) > 0 ? 'var(--danger)' : 'var(--success)'}`,
                borderRadius: 6, padding: '3px 10px', fontSize: '0.8rem',
                color: (hero.unspentPoints || 0) > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 700,
              }}>
                {hero.unspentPoints || 0} pts
              </div>
            </div>

            {ATTRIBUTES.map(attr => {
              const def = attributeDefinitions[attr];
              const val = hero.attributePoints[attr] || 0;
              return (
                <div key={attr} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.8rem', color: def.color }}>
                      {def.icon} {attr}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => deallocateHeroPoint(hero.id, attr)} disabled={val <= 0} style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: val > 0 ? 'var(--danger)' : 'var(--border)',
                        border: 'none', color: 'white', fontWeight: 700, fontSize: '0.8rem',
                        cursor: val > 0 ? 'pointer' : 'not-allowed',
                      }}>-</button>
                      <span style={{
                        color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace',
                        fontSize: '0.95rem', minWidth: 28, textAlign: 'center',
                      }}>{val}</span>
                      <button onClick={() => allocateHeroPoint(hero.id, attr)} disabled={(hero.unspentPoints || 0) <= 0} style={{
                        width: 22, height: 22, borderRadius: '50%',
                        background: (hero.unspentPoints || 0) > 0 ? 'var(--success)' : 'var(--border)',
                        border: 'none', color: 'white', fontWeight: 700, fontSize: '0.8rem',
                        cursor: (hero.unspentPoints || 0) > 0 ? 'pointer' : 'not-allowed',
                      }}>+</button>
                    </div>
                  </div>
                  <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, (val / 50) * 100)}%`,
                      height: '100%', background: def.color, borderRadius: 3, transition: 'width 0.2s',
                    }} />
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.6rem', marginTop: 2 }}>{def.description}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { setScreen, heroRoster, activeHeroIds, maxHeroSlots, level } = useGameStore();
  const [selectedHeroId, setSelectedHeroId] = useState(heroRoster[0]?.id || null);

  const selectedHero = heroRoster.find(h => h.id === selectedHeroId);
  const canRecruit = heroRoster.length < maxHeroSlots;

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'radial-gradient(circle at 30% 20%, rgba(110,231,183,0.04), transparent 50%), rgba(11,16,32,0.85)',
      overflow: 'hidden',
    }}>
      <header style={{
        background: 'linear-gradient(135deg, rgba(14,22,48,0.95), rgba(20,26,43,0.8))',
        borderBottom: '2px solid var(--border)', padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flex: '0 0 auto',
      }}>
        <button onClick={() => setScreen('world')} style={{
          background: 'var(--border)', border: 'none', borderRadius: 8,
          padding: '8px 16px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem',
        }}>← Back</button>
        <h1 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.2rem' }}>
          War Council
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
            Party: {activeHeroIds.length}/3
          </span>
          <span style={{ color: 'var(--accent)', fontSize: '0.75rem' }}>
            Roster: {heroRoster.length}/{maxHeroSlots}
          </span>
        </div>
      </header>

      <div style={{
        flex: 1, display: 'flex', gap: 16, padding: 16, overflow: 'hidden', minHeight: 0,
      }}>
        <div style={{
          flex: '0 0 auto', width: 200, display: 'flex', flexDirection: 'column', gap: 10,
          overflow: 'auto', paddingRight: 4,
        }}>
          {heroRoster.map(hero => (
            <HeroCard
              key={hero.id}
              hero={hero}
              isSelected={selectedHeroId === hero.id}
              isActive={activeHeroIds.includes(hero.id)}
              onClick={() => setSelectedHeroId(hero.id)}
            />
          ))}

          {canRecruit && (
            <div onClick={() => setScreen('heroCreate')} style={{
              background: 'rgba(255,215,0,0.05)', border: '2px dashed var(--gold)',
              borderRadius: 14, padding: 20, cursor: 'pointer', textAlign: 'center',
              transition: 'all 0.2s', minHeight: 80,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,215,0,0.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,215,0,0.05)'; }}
            >
              <div style={{ fontSize: '1.5rem', color: 'var(--gold)', marginBottom: 4 }}>+</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600 }}>Recruit Hero</div>
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {selectedHero ? (
            <HeroDetailPanel hero={selectedHero} />
          ) : (
            <div style={{
              height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)', fontSize: '0.9rem',
            }}>
              Select a hero to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
