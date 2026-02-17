import React, { useState, useMemo } from 'react';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { attributeDefinitions, calculateCombatPower, getBuildClassification, getRadarData } from '../data/attributes';
import { getZoneTerrain } from '../data/enemies';
import { skillTrees } from '../data/skillTrees';
import { TIERS, EQUIPMENT_SLOTS, canClassEquip, WEAPON_TYPES, ARMOR_TYPES, HELMET_TYPES, FEET_TYPES } from '../data/equipment';
import { getAbilitiesForSlot, getDefaultLoadout, isSlotLocked, getAllAbilityMap } from '../utils/abilityLoadout';
import SpriteAnimation, { buildEquipmentOverlays } from './SpriteAnimation';
import { getPlayerSprite, namedHeroes, getRaceHeightScale } from '../data/spriteMap';
import { UI_PANELS, UI_SLOTS, UI_ICONS, SLOT_ICON_MAP, SpriteIcon, getItemSpriteIcon, InlineIcon } from '../data/uiSprites.jsx';
import RadarChart from './RadarChart';
import AbilityIcon from './AbilityIcon';
import { useTooltip, showTooltip, hideTooltip, updateTooltipPosition } from './GameTooltip';

const ATTRIBUTES = Object.keys(attributeDefinitions);

const TAB_BG = {
  stats: '/backgrounds/tab_stats.png',
  equipment: '/backgrounds/tab_gear.png',
  abilities: '/backgrounds/tab_abilities.png',
  skills: '/backgrounds/tab_skills.png',
  attributes: '/backgrounds/tab_attributes.png',
};

const CLASS_BG = {
  warrior: '/backgrounds/wc_red.png',
  mage: '/backgrounds/wc_purple.png',
  ranger: '/backgrounds/wc_green.png',
  worge: '/backgrounds/wc_gold.png',
};

const RACE_BG = {
  human: '/backgrounds/card_divine.png',
  elf: '/backgrounds/card_beach.png',
  dwarf: '/backgrounds/card_green_hills.png',
  undead: '/backgrounds/card_dark.png',
  orc: '/backgrounds/blood_canyon.png',
  barbarian: '/backgrounds/volcanic_field.png',
};

function MiniBar({ current, max, color, height = 6, label }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
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
  return (
    <div style={{ marginBottom: 4 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: 1 }}>
          <span>{label}</span>
          <span>{Math.floor(current)}/{Math.floor(max)}</span>
        </div>
      )}
      <div style={{
        height: barHeight,
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
      </div>
    </div>
  );
}

function getCardScale(spriteData, raceId) {
  const fw = spriteData?.frameWidth || 100;
  const fh = spriteData?.frameHeight || 100;
  const maxDim = Math.max(fw, fh);
  const targetPx = 160;
  const base = targetPx / maxDim;
  const raceScale = raceId ? getRaceHeightScale(raceId) : 1;
  return Math.min(Math.max(base * raceScale, 0.7), 2.6);
}

function HeroCard({ hero, isSelected, onClick, isActive }) {
  const cls = classDefinitions[hero.classId];
  const race = hero.raceId ? raceDefinitions[hero.raceId] : null;
  const stats = getHeroStatsWithBonuses(hero);
  const cp = calculateCombatPower(stats);
  const hasPoints = (hero.unspentPoints || 0) > 0 || (hero.skillPoints || 0) > 0;

  const namedHero = hero.namedHeroId ? namedHeroes[hero.namedHeroId] : null;
  const raceBg = namedHero?.cardBg || RACE_BG[hero.raceId] || RACE_BG.human;
  const spriteData = getPlayerSprite(hero.classId, hero.raceId, hero.namedHeroId);
  const cardScale = getCardScale(spriteData, hero.raceId);

  return (
    <div onClick={onClick} style={{
      backgroundImage: `linear-gradient(135deg, ${isSelected ? 'rgba(110,231,183,0.25)' : 'rgba(14,22,48,0.70)'}, rgba(11,16,32,0.80)), url(${raceBg})`,
      backgroundSize: 'cover', backgroundPosition: 'center',
      border: `2px solid ${isSelected ? 'var(--accent)' : namedHero ? `${namedHero.color || '#d4a017'}55` : 'var(--border)'}`,
      borderRadius: 14, padding: 16, cursor: 'pointer',
      transition: 'all 0.3s', position: 'relative', overflow: 'hidden',
      minWidth: 170,
      boxShadow: namedHero ? `inset 0 0 30px ${namedHero.color || '#d4a017'}15, 0 0 12px ${namedHero.color || '#d4a017'}20` : undefined,
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

      {namedHero && (
        <div style={{
          position: 'absolute', top: 6, right: hasPoints ? 22 : 6,
          background: `rgba(212,160,23,0.25)`, border: `1px solid ${namedHero.color || '#d4a017'}`,
          borderRadius: 4, padding: '1px 6px', fontSize: '0.45rem',
          color: namedHero.color || '#d4a017', fontWeight: 700, letterSpacing: 1,
          textTransform: 'uppercase',
        }}>{namedHero.title}</div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, marginTop: isActive ? 12 : 0, position: 'relative', minHeight: 260 }}>
        <div style={{
          width: '100%', height: 220, position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 80,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            filter: isSelected ? `drop-shadow(0 0 8px ${cls?.color || 'var(--accent)'}40)` : 'none',
            transition: 'filter 0.3s',
          }}>
            <SpriteAnimation spriteData={spriteData} animation="idle" scale={cardScale} speed={150} equipmentOverlays={buildEquipmentOverlays(hero, TIERS)} containerless={false} />
          </div>

          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '16px 6px 6px',
            textAlign: 'center',
          }}>
            <div className="font-cinzel" style={{
              color: isSelected ? 'var(--gold)' : 'var(--text)',
              fontSize: '0.85rem', fontWeight: 700,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170, margin: '0 auto',
            }}>
              {hero.name}
            </div>
            <div style={{ color: cls?.color || 'var(--muted)', fontSize: '0.7rem', fontWeight: 600 }}>
              Lv.{hero.level} {race?.name || ''} {cls?.name || ''}
            </div>
            <div style={{ width: '100%', marginTop: 4 }}>
              <MiniBar current={hero.currentHealth} max={stats.health} color="#22c55e" height={4} />
              <MiniBar current={hero.currentMana} max={stats.mana} color="#3b82f6" height={3} />
            </div>
            <div style={{
              fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 600,
              background: 'rgba(255,215,0,0.1)', padding: '2px 8px', borderRadius: 4, marginTop: 4, display: 'inline-block',
            }}>
              CP: {cp.toLocaleString()}
            </div>
          </div>
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
        <AbilityIcon ability={ability} size={28} />
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
          {ability.type === 'buff' && ability.damage === 0 && (
            <span style={{ fontSize: '0.55rem', padding: '1px 5px', borderRadius: 3, background: 'rgba(110,231,183,0.15)', color: 'var(--accent)' }}>
              Buff
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

function LoadoutSlotRow({ idx, loadout, abilityMap, cls, slotOptions, onSelect, isSelected, onToggle, accentColor }) {
  const abilityId = loadout[idx];
  const ability = abilityMap[abilityId];
  const options = slotOptions;

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
      <div
        onClick={() => onToggle(idx)}
        style={{
          width: 160, flexShrink: 0,
          display: 'flex', gap: 6, alignItems: 'center',
          background: isSelected ? `${accentColor}18` : 'rgba(42,49,80,0.4)',
          border: `2px solid ${isSelected ? accentColor : 'var(--border)'}`,
          borderRadius: 8, padding: '6px 8px',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <div style={{
          width: 20, height: 20, flexShrink: 0,
          background: accentColor, borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.6rem', fontWeight: 700, color: '#0b1020',
        }}>{idx + 1}</div>
        {ability ? (
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ flexShrink: 0 }}><AbilityIcon ability={ability} size={22} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '0.65rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ability.name}</div>
              <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {ability.manaCost > 0 && <span style={{ fontSize: '0.45rem', padding: '0px 3px', borderRadius: 2, background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>{ability.manaCost}MP</span>}
                {ability.staminaCost > 0 && <span style={{ fontSize: '0.45rem', padding: '0px 3px', borderRadius: 2, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>{ability.staminaCost}SP</span>}
                {ability.cooldown > 0 && <span style={{ fontSize: '0.45rem', padding: '0px 3px', borderRadius: 2, background: 'rgba(100,100,120,0.2)', color: 'var(--muted)' }}>{ability.cooldown}T</span>}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, color: 'var(--muted)', fontSize: '0.6rem', fontStyle: 'italic' }}>Empty</div>
        )}
      </div>

      <div style={{
        flex: 1, minWidth: 0,
        display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-start', alignContent: 'flex-start',
        background: isSelected ? 'rgba(30,35,55,0.5)' : 'rgba(20,24,40,0.3)',
        borderRadius: 6, padding: 3,
        border: isSelected ? `1px solid ${accentColor}28` : '1px solid transparent',
        transition: 'all 0.15s',
        maxHeight: 80, overflowY: 'auto',
      }}>
        {options.length === 0 ? (
          <div style={{ padding: '6px', fontSize: '0.5rem', color: 'rgba(100,100,120,0.5)', fontStyle: 'italic', width: '100%', textAlign: 'center' }}>No options</div>
        ) : (
          options.map(ab => {
            const isCurrent = loadout[idx] === ab.id;
            return (
              <div key={ab.id}
                onClick={() => !isCurrent && onSelect(idx, ab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  background: isCurrent ? `${accentColor}1e` : 'rgba(42,49,80,0.3)',
                  border: `1px solid ${isCurrent ? accentColor : 'rgba(60,65,90,0.4)'}`,
                  borderRadius: 5, padding: '2px 5px',
                  cursor: isCurrent ? 'default' : 'pointer',
                  transition: 'all 0.1s',
                  opacity: isCurrent ? 1 : 0.8,
                }}
                onMouseEnter={e => { showTooltip(`${ab.name}\n${ab.description}`, e); if (!isCurrent) { e.currentTarget.style.opacity = '1'; e.currentTarget.style.borderColor = accentColor; } }}
                onMouseMove={e => updateTooltipPosition(e)}
                onMouseLeave={e => { hideTooltip(); if (!isCurrent) { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.borderColor = 'rgba(60,65,90,0.4)'; } }}
              >
                <InlineIcon name={ab.icon} size={14} style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.55rem', fontWeight: 600, color: isCurrent ? accentColor : 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ab.name}</div>
                {isCurrent && <span style={{ fontSize: '0.5rem', color: accentColor, flexShrink: 0 }}>✓</span>}
              </div>
            );
          })
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

  const handleSlotSelect = (slotIdx, abilityId) => {
    const newLoadout = [...loadout];
    newLoadout[slotIdx] = abilityId;
    setHeroLoadout(hero.id, newLoadout);
  };

  const resetLoadout = () => {
    setHeroLoadout(hero.id, getDefaultLoadout(hero.classId, weaponType));
    setSelectingSlot(null);
  };

  const getSlotOptions = (slotIdx) => {
    const locked = isSlotLocked(hero.classId, slotIdx);
    if (locked) return [];
    return (slotAbilities[slotIdx] || []).filter(ability => {
      if (loadout[slotIdx] === ability.id) return true;
      return !loadout.includes(ability.id);
    });
  };

  const normalColor = cls?.color || 'var(--accent)';

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <h4 style={{ color: normalColor, fontSize: '0.85rem', margin: 0 }}>
          Ability Loadout
        </h4>
        <button onClick={resetLoadout} style={{
          background: 'rgba(100,100,120,0.2)', border: '1px solid var(--border)',
          borderRadius: 6, padding: '3px 10px', fontSize: '0.65rem',
          color: 'var(--muted)', cursor: 'pointer',
        }}>Reset</button>
      </div>

      <div style={{ fontSize: '0.55rem', color: 'var(--muted)', marginBottom: 10, lineHeight: 1.3 }}>
        Click an option on the right to assign it to that slot.{weaponType ? ` Weapon: ${weaponType}.` : ''}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {Array.from({ length: 5 }).map((_, idx) => {
          const locked = isSlotLocked(hero.classId, idx);
          if (locked) {
            const sigAbility = abilityMap[loadout[idx]];
            return (
              <div key={idx} style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
                <div style={{
                  width: 160, flexShrink: 0,
                  display: 'flex', gap: 6, alignItems: 'center',
                  background: 'rgba(42,49,80,0.4)',
                  border: '2px solid rgba(100,100,120,0.3)',
                  borderRadius: 8, padding: '6px 8px',
                  cursor: 'not-allowed', opacity: 0.6,
                }}>
                  <div style={{ width: 20, height: 20, flexShrink: 0, background: normalColor, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700, color: '#0b1020' }}>{idx + 1}</div>
                  {sigAbility ? (
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ flexShrink: 0 }}><AbilityIcon ability={sigAbility} size={22} /></span>
                      <div style={{ fontWeight: 700, fontSize: '0.65rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sigAbility.name}</div>
                    </div>
                  ) : <div style={{ flex: 1, color: 'var(--muted)', fontSize: '0.6rem', fontStyle: 'italic' }}>Signature</div>}
                  <InlineIcon name="lock" size={10} />
                </div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(20,24,40,0.3)', borderRadius: 6, border: '1px solid transparent' }}>
                  <span style={{ fontSize: '0.5rem', color: 'rgba(100,100,120,0.4)', fontStyle: 'italic' }}>Signature</span>
                </div>
              </div>
            );
          }
          return (
            <LoadoutSlotRow
              key={idx}
              idx={idx}
              loadout={loadout}
              abilityMap={abilityMap}
              cls={cls}
              slotOptions={getSlotOptions(idx)}
              onSelect={handleSlotSelect}
              isSelected={selectingSlot === idx}
              onToggle={(i) => { setSelectingSlot(selectingSlot === i ? null : i); }}
              accentColor={normalColor}
            />
          );
        })}
      </div>

    </div>
  );
}

function HeroDetailPanel({ hero, onClose }) {
  const { unlockHeroSkill, allocateHeroPoint, deallocateHeroPoint, activeHeroIds, setActiveHeroes, equipItem, unequipItem, inventory, setHeroLoadout } = useGameStore();
  const [tab, setTab] = useState('stats');
  const [selectingSlot, setSelectingSlot] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [hoveredSkill, setHoveredSkill] = useState(null);

  const cls = classDefinitions[hero.classId];
  const race = hero.raceId ? raceDefinitions[hero.raceId] : null;
  const stats = getHeroStatsWithBonuses(hero);
  const cp = calculateCombatPower(stats);
  const tree = skillTrees[hero.classId];
  const heroSkills = hero.unlockedSkills || {};
  const isActive = activeHeroIds.includes(hero.id);

  const mainStats = [
    { key: 'health', label: 'Health', icon: 'heart', color: '#22c55e' },
    { key: 'mana', label: 'Mana', icon: 'mana', color: '#3b82f6' },
    { key: 'stamina', label: 'Stamina', icon: 'lightning', color: '#f59e0b' },
    { key: 'physicalDamage', label: 'Phys DMG', icon: 'crossed_swords', color: '#ef4444' },
    { key: 'magicDamage', label: 'Magic DMG', icon: 'crystal', color: '#8b5cf6' },
    { key: 'defense', label: 'Defense', icon: 'shield', color: '#6b7280' },
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
    { id: 'stats', label: 'Stats', icon: 'chart' },
    { id: 'equipment', label: 'Gear', icon: 'shield' },
    { id: 'abilities', label: 'Abilities', icon: 'crossed_swords' },
    { id: 'skills', label: 'Skills', icon: 'nature' },
    { id: 'attributes', label: 'Attributes', icon: 'chart' },
  ];

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(14,22,48,0.98), rgba(20,26,43,0.95))',
      border: '1px solid var(--border)', borderRadius: 16,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{
        backgroundImage: `linear-gradient(135deg, ${cls?.color || 'var(--accent)'}40, rgba(14,22,48,0.8)), url(${RACE_BG[hero.raceId] || RACE_BG.human})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        borderBottom: `2px solid ${cls?.color || 'var(--border)'}`,
        padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <div style={{ filter: `drop-shadow(0 0 10px ${cls?.color || 'var(--accent)'}50)` }}>
          <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId, hero.namedHeroId)} animation="idle" scale={getCardScale(getPlayerSprite(hero.classId, hero.raceId, hero.namedHeroId), hero.raceId) * 0.9} speed={150} equipmentOverlays={buildEquipmentOverlays(hero, TIERS)} containerless={false} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>{hero.name}</span>
            <span style={{ color: cls?.color, fontSize: '0.75rem', fontWeight: 600 }}>
              Lv.{hero.level} {race?.name || ''} {cls?.name || ''}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              background: 'rgba(255,215,0,0.15)', border: '1px solid var(--gold)',
              padding: '1px 8px', borderRadius: 4, fontSize: '0.65rem',
              color: 'var(--gold)', fontWeight: 700,
            }}>CP: {cp.toLocaleString()}</span>
            <button onClick={toggleActive} style={{
              background: isActive ? 'rgba(110,231,183,0.2)' : 'rgba(42,49,80,0.5)',
              border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
              padding: '1px 8px', borderRadius: 4, fontSize: '0.65rem',
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
            flex: 1, padding: '6px 4px', border: 'none',
            background: tab === t.id ? 'rgba(110,231,183,0.1)' : 'transparent',
            borderBottom: tab === t.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
            transition: 'all 0.2s',
          }}>
            <span style={{ marginRight: 3 }}><InlineIcon name={t.icon} size={12} /></span>{t.label}
            {t.id === 'attributes' && (hero.unspentPoints || 0) > 0 && (
              <span style={{ color: 'var(--danger)', marginLeft: 4, fontSize: '0.65rem' }}>({hero.unspentPoints})</span>
            )}
            {t.id === 'skills' && (hero.skillPoints || 0) > 0 && (
              <span style={{ color: 'var(--danger)', marginLeft: 4, fontSize: '0.65rem' }}>({hero.skillPoints})</span>
            )}
          </button>
        ))}
      </div>

      <div style={{
        flex: 1, overflow: 'auto', padding: 12,
        backgroundImage: `linear-gradient(135deg, rgba(14,22,48,0.92), rgba(20,26,43,0.88)), url(${TAB_BG[tab] || ''})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transition: 'background-image 0.3s',
      }}>
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
                    <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}><InlineIcon name={s.icon} size={12} /> {s.label}</span>
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
          const selectedItem = selectedItemId ? inventory.find(i => i.id === selectedItemId) : null;
          const hoveredItem = hoveredItemId ? (inventory.find(i => i.id === hoveredItemId) || (() => { for (const s of Object.keys(eq)) { if (eq[s]?.id === hoveredItemId) return eq[s]; } return null; })()) : null;
          const slotCanReceiveSelected = (slot) => selectedItem && selectedItem.slot === slot && canClassEquip(hero.classId, selectedItem);

          const SLOT_LABELS = { weapon: 'Wpn', offhand: 'Off', helmet: 'Helm', armor: 'Body', feet: 'Feet', ring: 'Ring', relic: 'Relic' };

          const renderEquipSlot = (slot, disabled = false) => {
            const equipped = eq[slot];
            const tierDef = equipped ? TIERS[equipped.tier] || TIERS[1] : null;
            const canReceive = !disabled && slotCanReceiveSelected(slot);
            return (
              <div
                key={slot}
                onMouseEnter={() => { if (equipped) setHoveredItemId(equipped.id); }}
                onMouseLeave={() => setHoveredItemId(null)}
                onClick={() => {
                  if (canReceive) {
                    equipItem(hero.id, selectedItem);
                    setSelectedItemId(null);
                  } else if (equipped && !disabled) {
                    unequipItem(hero.id, slot);
                  }
                }}
                onDragOver={e => { if (!disabled) { e.preventDefault(); e.currentTarget.style.boxShadow = '0 0 8px #f59e0b'; } }}
                onDragLeave={e => { if (!disabled) e.currentTarget.style.boxShadow = canReceive ? '0 0 6px rgba(34,197,94,0.5)' : 'none'; }}
                onDrop={e => {
                  e.preventDefault();
                  e.currentTarget.style.boxShadow = 'none';
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
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: canReceive ? 'pointer' : (equipped ? 'pointer' : 'default'),
                  opacity: disabled ? 0.3 : 1,
                  transition: 'box-shadow 0.15s',
                  boxShadow: canReceive ? '0 0 6px rgba(34,197,94,0.5)' : 'none',
                  position: 'relative',
                }}
              >
                {equipped ? (() => {
                  const eqSprite = getItemSpriteIcon(equipped);
                  return eqSprite ? (
                    <img src={eqSprite} alt={equipped.name} style={{
                      width: '75%', height: '75%', objectFit: 'contain',
                      imageRendering: 'pixelated',
                      filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9))',
                    }} />
                  ) : (
                    <span style={{ fontSize: '1.3rem', filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.9))' }}>{equipped.icon}</span>
                  );
                })() : null}
                {tierDef && <div style={{ position: 'absolute', bottom: 1, left: 2, right: 2, height: 2, background: tierDef.color, borderRadius: 1, boxShadow: `0 0 4px ${tierDef.color}` }} />}
              </div>
            );
          };

          const displayItem = hoveredItem || selectedItem;
          const displayTier = displayItem ? (TIERS[displayItem.tier] || TIERS[1]) : null;

          const build = getBuildClassification(stats, hero.attributePoints || {});
          const rec = hero.battleRecord || { wins: 0, losses: 0, kills: 0, bossKills: 0, damageDealt: 0, healingDone: 0 };
          const totalBattles = rec.wins + rec.losses;
          const winRate = totalBattles > 0 ? Math.round((rec.wins / totalBattles) * 100) : 0;

          const equippedCount = Object.values(eq).filter(Boolean).length;
          const heroWeaponType = eq.weapon?.weaponType || null;
          const loadout = hero.abilityLoadout || getDefaultLoadout(hero.classId, heroWeaponType);
          const abilityMap = getAllAbilityMap(hero.classId, heroWeaponType, heroSkills);

          const totalSkillPoints = Object.values(heroSkills).reduce((a, b) => a + b, 0);
          const maxSkillPoints = tree ? tree.tiers.reduce((sum, t) => sum + t.skills.reduce((s, sk) => s + sk.maxPoints, 0), 0) : 0;

          const sectionStyle = {
            background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '8px 10px',
            border: '1px solid rgba(139,115,85,0.3)', marginBottom: 6,
          };
          const sectionTitle = (icon, text) => (
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#d4a96a', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1, borderBottom: '1px solid rgba(139,115,85,0.2)', paddingBottom: 3 }}>
              <span style={{ marginRight: 4 }}>{icon ? <InlineIcon name={icon} size={12} /> : null}</span>{text}
            </div>
          );

          const FULL_SLOT_LABELS = { weapon: 'Weapon', offhand: 'Off-Hand', helmet: 'Helmet', armor: 'Chest', feet: 'Feet', ring: 'Ring', relic: 'Relic' };

          const panelScale = 2.5;
          const panelW = 96 * panelScale;
          const panelH = 128 * panelScale;
          const slotPx = 20 * panelScale;

          const slotPositions = {
            helmet:  { left: 35 * panelScale, top: 8 * panelScale },
            weapon:  { left: 11 * panelScale, top: 32 * panelScale },
            armor:   { left: 35 * panelScale, top: 32 * panelScale },
            offhand: { left: 59 * panelScale, top: 32 * panelScale },
            feet:    { left: 35 * panelScale, top: 56 * panelScale },
            ring:    { left: 17 * panelScale, top: 85 * panelScale },
            relic:   { left: 52 * panelScale, top: 85 * panelScale },
          };

          return (
            <div>
              <div style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                <div style={{
                  flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0,
                }}>
                  <div style={{
                    background: 'linear-gradient(180deg, rgba(45,35,20,0.95) 0%, rgba(30,22,14,0.98) 100%)',
                    border: '2px solid #8b7355',
                    borderRadius: 8,
                    padding: 8,
                    boxShadow: 'inset 0 0 12px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.6), 0 0 1px 1px rgba(139,115,85,0.2)',
                    position: 'relative',
                  }}>
                    <div style={{
                      position: 'absolute', inset: 3,
                      border: '1px solid rgba(212,169,106,0.15)',
                      borderRadius: 6,
                      pointerEvents: 'none',
                    }} />

                    <div className="font-cinzel" style={{
                      textAlign: 'center', fontSize: '0.55rem', color: '#d4a96a',
                      letterSpacing: 2, marginBottom: 6, textTransform: 'uppercase',
                      textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    }}>EQUIPMENT</div>

                    <div style={{
                      width: panelW, height: panelH,
                      backgroundImage: `url(${UI_PANELS.equipPanelSmall})`,
                      backgroundSize: `${panelW}px ${panelH}px`,
                      imageRendering: 'pixelated',
                      position: 'relative',
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}>
                      {Object.entries(slotPositions).map(([slot, pos]) => (
                        <div key={slot} style={{
                          position: 'absolute',
                          left: pos.left, top: pos.top,
                          width: slotPx, height: slotPx,
                        }}>
                          {renderEquipSlot(slot, slot === 'offhand' && is2H)}
                        </div>
                      ))}
                      {is2H && (
                        <div style={{
                          position: 'absolute', bottom: 6, left: 0, right: 0,
                          textAlign: 'center', fontSize: '0.45rem', color: '#f59e0b', fontWeight: 600,
                          textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                        }}>
                          2H — off-hand locked
                        </div>
                      )}
                    </div>

                    <div style={{
                      marginTop: 8,
                      width: panelW,
                      background: 'rgba(15,12,8,0.7)',
                      border: '1px solid rgba(139,115,85,0.3)',
                      borderRadius: 5,
                      padding: '8px 10px',
                      minHeight: 54,
                      boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.4)',
                    }}>
                      {displayItem ? (
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                            {(() => {
                              const tipSprite = getItemSpriteIcon(displayItem);
                              return tipSprite ? (
                                <img src={tipSprite} alt="" style={{ width: 20, height: 20, imageRendering: 'pixelated', flexShrink: 0 }} />
                              ) : (
                                <span style={{ fontSize: '1rem', flexShrink: 0 }}>{displayItem.icon}</span>
                              );
                            })()}
                            <span style={{
                              fontSize: '0.7rem', fontWeight: 700, color: displayTier.color,
                              fontFamily: 'var(--font-heading)', lineHeight: 1.2,
                              wordBreak: 'break-word', textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                            }}>
                              {displayItem.name}
                            </span>
                          </div>
                          <div style={{
                            fontSize: '0.55rem', color: '#a08b6d', marginBottom: 4,
                            lineHeight: 1.3, whiteSpace: 'normal', wordBreak: 'break-word',
                          }}>
                            T{displayItem.tier} {displayTier.name} · {FULL_SLOT_LABELS[displayItem.slot] || displayItem.slot}
                            {displayItem.weaponType ? ` · ${WEAPON_TYPES[displayItem.weaponType]?.name || displayItem.weaponType}` : ''}
                          </div>
                          <div style={{
                            display: 'flex', flexWrap: 'wrap', gap: '3px 8px',
                            borderTop: '1px solid rgba(139,115,85,0.15)', paddingTop: 4,
                          }}>
                            {Object.entries(displayItem.stats).map(([k, v]) => (
                              <span key={k} style={{ fontSize: '0.6rem', color: '#7ec87e', whiteSpace: 'nowrap' }}>+{v} {k}</span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          fontSize: '0.55rem', color: '#6b5c47', fontStyle: 'italic',
                          textAlign: 'center', paddingTop: 8,
                        }}>
                          Hover item for details
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <div style={{
                    height: 22,
                    background: 'linear-gradient(180deg, rgba(50,40,25,0.8), rgba(30,22,14,0.6))',
                    border: '1px solid rgba(139,115,85,0.3)',
                    borderBottom: 'none',
                    borderRadius: '6px 6px 0 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="font-cinzel" style={{ fontSize: '0.55rem', color: '#d4a96a', letterSpacing: 2 }}>INVENTORY</span>
                    <span style={{ fontSize: '0.5rem', color: '#8a7a5a', marginLeft: 4 }}>({inventory.length})</span>
                  </div>

                  <div style={{
                    flex: 1,
                    background: 'rgba(30,24,16,0.9)',
                    border: '2px solid rgba(139,115,85,0.5)',
                    borderTop: 'none',
                    borderRadius: '0 0 6px 6px',
                    padding: 6,
                    maxHeight: 340,
                    overflowY: 'auto',
                  }}>
                    {(() => {
                      const sorted = [...inventory].sort((a, b) => {
                        const aEquip = canClassEquip(hero.classId, a) ? 0 : 1;
                        const bEquip = canClassEquip(hero.classId, b) ? 0 : 1;
                        if (aEquip !== bEquip) return aEquip - bEquip;
                        const slotOrder = { weapon: 0, offhand: 1, helmet: 2, armor: 3, feet: 4, ring: 5, relic: 6, consumable: 7 };
                        const aSlot = slotOrder[a.slot] ?? 8;
                        const bSlot = slotOrder[b.slot] ?? 8;
                        if (aSlot !== bSlot) return aSlot - bSlot;
                        return (b.tier || 1) - (a.tier || 1);
                      });
                      const slotsPerPage = 16;
                      const totalSlots = Math.max(slotsPerPage, Math.ceil(sorted.length / slotsPerPage) * slotsPerPage);
                      const slots = Array.from({ length: totalSlots }, (_, i) => sorted[i] || null);
                      return (
                        <div style={{
                          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3,
                        }}>
                          {slots.map((item, i) => {
                            const r = item ? (TIERS[item.tier] || TIERS[1]) : null;
                            const itemCanEquip = item ? (item.slot === 'consumable' || canClassEquip(hero.classId, item)) : false;
                            const isSelected = item && selectedItemId === item.id;
                            const isHovered = item && hoveredItemId === item.id;
                            const spriteIcon = item ? getItemSpriteIcon(item) : null;
                            return (
                              <div key={item ? item.id : `empty_${i}`}
                                draggable={item && itemCanEquip}
                                onDragStart={e => {
                                  if (!item) return;
                                  e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, slot: item.slot }));
                                  e.dataTransfer.effectAllowed = 'move';
                                  setSelectedItemId(null);
                                }}
                                onClick={() => {
                                  if (!item || !itemCanEquip) return;
                                  if (isSelected) {
                                    const slotKey = item.slot;
                                    if (slotKey && slotKey !== 'consumable' && !(slotKey === 'offhand' && is2H)) {
                                      equipItem(hero.id, item);
                                    }
                                    setSelectedItemId(null);
                                  } else {
                                    setSelectedItemId(item.id);
                                  }
                                }}
                                onMouseEnter={e => { if (item) { setHoveredItemId(item.id); showTooltip(`${item.name}${item.tier ? ` (Tier ${item.tier})` : ''}\n${TIERS[item.tier]?.name || ''}\nSlot: ${item.slot}${item.stats ? '\n' + Object.entries(item.stats).map(([k,v]) => `${k}: +${v}`).join(', ') : ''}`, e); } }}
                                onMouseMove={e => { if (item) updateTooltipPosition(e); }}
                                onMouseLeave={() => { if (item) { setHoveredItemId(null); hideTooltip(); } }}
                                style={{
                                  aspectRatio: '1',
                                  background: isSelected ? 'rgba(180,160,100,0.25)' : 'rgba(60,48,30,0.6)',
                                  border: `2px solid ${isSelected ? 'rgba(212,169,106,0.8)' : isHovered && item ? 'rgba(180,160,100,0.5)' : 'rgba(100,80,50,0.5)'}`,
                                  borderRadius: 4,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  cursor: item && itemCanEquip ? 'pointer' : item ? 'not-allowed' : 'default',
                                  position: 'relative',
                                  opacity: item ? (itemCanEquip ? 1 : 0.35) : 0.5,
                                  transition: 'all 0.15s',
                                  imageRendering: 'pixelated',
                                }}
                              >
                                {item && spriteIcon ? (
                                  <img src={spriteIcon} alt={item.name} style={{
                                    width: '70%', height: '70%', objectFit: 'contain',
                                    imageRendering: 'pixelated',
                                    filter: `drop-shadow(0 0 2px rgba(0,0,0,0.8))${isHovered ? ' brightness(1.3)' : ''}`,
                                  }} />
                                ) : item ? (
                                  <InlineIcon name={item.icon} size={18} style={{ filter: 'drop-shadow(0 0 2px rgba(0,0,0,0.8))' }} />
                                ) : null}
                                {item && r && (
                                  <div style={{
                                    position: 'absolute', bottom: 2, left: 3, right: 3,
                                    height: 2, background: r.color || 'rgba(139,115,85,0.4)', borderRadius: 1,
                                    boxShadow: `0 0 4px ${r.color || 'transparent'}`,
                                  }} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div style={sectionStyle}>
                {sectionTitle('scroll', 'Warlord Profile')}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Class</span>
                    <span style={{ color: cls?.color || 'var(--accent)', fontWeight: 600 }}>{cls?.name || '?'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Race</span>
                    <span style={{ color: 'var(--gold)', fontWeight: 600 }}>{race?.name || '?'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Level</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontFamily: 'monospace' }}>{hero.level}/20</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Power</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontFamily: 'monospace' }}>{cp.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Build Rank</span>
                    <span style={{ color: build.tierColor, fontWeight: 600 }}>{build.tier} #{build.rank}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Rating</span>
                    <span style={{ color: build.rating.startsWith('S') ? '#fbbf24' : build.rating === 'A' ? '#a855f7' : 'var(--text)', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.75rem' }}>{build.rating}</span>
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem' }}>
                    <span style={{ color: 'var(--muted)' }}>Title</span>
                    <span className="font-cinzel" style={{ color: build.tierColor, fontWeight: 600, fontSize: '0.6rem' }}>{build.name}</span>
                  </div>
                </div>
              </div>

              <div style={sectionStyle}>
                {sectionTitle('crossed_swords', 'Combat Record')}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, textAlign: 'center' }}>
                  {[
                    { label: 'Victories', val: rec.wins, color: '#22c55e' },
                    { label: 'Defeats', val: rec.losses, color: '#ef4444' },
                    { label: 'Win Rate', val: `${winRate}%`, color: winRate >= 70 ? '#22c55e' : winRate >= 40 ? '#f59e0b' : '#ef4444' },
                    { label: 'Boss Kills', val: rec.bossKills, color: '#a855f7' },
                  ].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
                      <div style={{ fontSize: '0.5rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                {totalBattles === 0 && (
                  <div style={{ fontSize: '0.55rem', color: '#6b5c47', fontStyle: 'italic', textAlign: 'center', marginTop: 4 }}>
                    No battles fought yet
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ ...sectionStyle, flex: 1, marginBottom: 6 }}>
                  {sectionTitle('sword', `Gear (${equippedCount}/7)`)}
                  {equippedCount === 0 ? (
                    <div style={{ fontSize: '0.55rem', color: '#6b5c47', fontStyle: 'italic' }}>No gear equipped</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {Object.entries(eq).filter(([, v]) => v).map(([slot, item]) => {
                        const t = TIERS[item.tier] || TIERS[1];
                        return (
                          <div key={slot} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.6rem' }}>
                            <InlineIcon name={item.icon} size={14} />
                            <span style={{ color: t.color, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</span>
                            <span style={{ color: '#7ec87e', fontSize: '0.5rem', whiteSpace: 'nowrap' }}>
                              {Object.entries(item.stats).slice(0, 2).map(([k, v]) => `+${v} ${k}`).join(', ')}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div style={{ ...sectionStyle, flex: 1, marginBottom: 6 }}>
                  {sectionTitle('chart', 'Core Stats')}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {mainStats.map(s => (
                      <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem' }}>
                        <span style={{ color: 'var(--muted)' }}><InlineIcon name={s.icon} size={10} /> {s.label}</span>
                        <span style={{ color: s.color, fontWeight: 700, fontFamily: 'monospace' }}>{Math.floor(stats[s.key])}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={sectionStyle}>
                {sectionTitle('sparkle', `Ability Loadout`)}
                <div style={{ display: 'flex', gap: 4 }}>
                  {loadout.map((abilityId, i) => {
                    const ability = abilityMap[abilityId];
                    return (
                      <div key={i} style={{
                        flex: 1, textAlign: 'center', padding: '4px 2px',
                        backgroundImage: `url(${UI_SLOTS.empty})`,
                        backgroundSize: '100%', imageRendering: 'pixelated',
                        borderRadius: 4, minHeight: 40,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {ability ? (
                          <>
                            <span><AbilityIcon ability={ability} size={22} /></span>
                            <div style={{ fontSize: '0.45rem', color: 'var(--accent)', marginTop: 2, lineHeight: 1.1 }}>{ability.name}</div>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.9rem', opacity: 0.2 }}>—</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={sectionStyle}>
                {sectionTitle('nature', `Skills (${totalSkillPoints}/${maxSkillPoints})`)}
                {totalSkillPoints === 0 ? (
                  <div style={{ fontSize: '0.55rem', color: '#6b5c47', fontStyle: 'italic' }}>No skills unlocked yet</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {tree && tree.tiers.map(tier =>
                      tier.skills.filter(sk => (heroSkills[sk.id] || 0) > 0).map(sk => (
                        <div key={sk.id} style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          background: 'rgba(110,231,183,0.08)', borderRadius: 4, padding: '2px 6px',
                          border: '1px solid rgba(110,231,183,0.15)',
                        }}>
                          <span style={{ fontSize: '0.7rem' }}>{sk.icon}</span>
                          <span style={{ fontSize: '0.55rem', color: 'var(--accent)' }}>{sk.name}</span>
                          <span style={{ fontSize: '0.5rem', color: 'var(--muted)', fontFamily: 'monospace' }}>{heroSkills[sk.id]}/{sk.maxPoints}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <div style={sectionStyle}>
                {sectionTitle('chart', 'Attribute Spread')}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3px 6px' }}>
                  {ATTRIBUTES.map(attr => {
                    const pts = (hero.attributePoints || {})[attr] || 0;
                    const def = attributeDefinitions[attr];
                    const maxPts = Object.values(hero.attributePoints || {}).reduce((a, b) => a + b, 0);
                    const pct = maxPts > 0 ? (pts / maxPts) * 100 : 0;
                    return (
                      <div key={attr} style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center' }}><img src={def.icon} alt={attr} style={{ width: 16, height: 16, imageRendering: 'pixelated' }} /></div>
                        <div style={{ height: 3, background: 'rgba(0,0,0,0.4)', borderRadius: 2, overflow: 'hidden', margin: '1px 0' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: def.color, borderRadius: 2 }} />
                        </div>
                        <div style={{ fontSize: '0.5rem', color: 'var(--muted)' }}>{pts}</div>
                      </div>
                    );
                  })}
                </div>
                {(hero.unspentPoints || 0) > 0 && (
                  <div style={{ textAlign: 'center', marginTop: 4, fontSize: '0.55rem', color: '#ef4444' }}>
                    {hero.unspentPoints} unspent attribute points!
                  </div>
                )}
              </div>

              {race && (
                <div style={sectionStyle}>
                  {sectionTitle(race.icon ? '' : 'gift', `Racial Trait — ${race.name}`)}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {race.icon && <img src={race.icon} alt={race.name} style={{ width: 20, height: 20, borderRadius: '50%', objectFit: 'cover' }} />}
                    <div>
                      <div style={{ fontSize: '0.6rem', color: 'var(--gold)', fontWeight: 600 }}>{race.trait}</div>
                      <div style={{ fontSize: '0.55rem', color: 'var(--muted)' }}>{race.traitDescription}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {tab === 'abilities' && (
          <LoadoutEditor hero={hero} cls={cls} selectingSlot={selectingSlot} setSelectingSlot={setSelectingSlot} setHeroLoadout={setHeroLoadout} />
        )}

        {tab === 'skills' && tree && (() => {
          const allSkills = [];
          const skillPositions = {};
          const NODE_W = 80;
          const NODE_H = 72;
          const TIER_GAP = 100;
          const SKILL_GAP = 95;
          const maxCols = tree.tiers.reduce((m, t) => Math.max(m, t.skills.length), 0);

          tree.tiers.forEach((tier, tierIdx) => {
            const tierY = tierIdx * TIER_GAP + 36;
            const totalWidth = tier.skills.length * SKILL_GAP;
            const startX = Math.max(0, (Math.max(3, maxCols) * SKILL_GAP - totalWidth) / 2);
            tier.skills.forEach((skill, skillIdx) => {
              const x = startX + skillIdx * SKILL_GAP + SKILL_GAP / 2;
              const y = tierY;
              skillPositions[skill.id] = { x, y };
              allSkills.push({ ...skill, tier, tierIdx });
            });
          });

          const connections = [];
          allSkills.forEach(skill => {
            if (skill.requires && skillPositions[skill.requires] && skillPositions[skill.id]) {
              const from = skillPositions[skill.requires];
              const to = skillPositions[skill.id];
              const parentUnlocked = (heroSkills[skill.requires] || 0) > 0;
              const childUnlocked = (heroSkills[skill.id] || 0) > 0;
              connections.push({ from, to, active: parentUnlocked, complete: childUnlocked });
            }
          });

          const posValues = Object.values(skillPositions);
          const treeW = Math.max(3, maxCols) * SKILL_GAP + 20;
          const maxY = posValues.length > 0 ? Math.max(...posValues.map(p => p.y)) + NODE_H + 20 : 100;

          const effectTypeLabel = (t) => {
            const labels = { bleed: 'Bleed', burn: 'Burn', poison: 'Poison', stun: 'Stun', sleep: 'Sleep', confuse: 'Confuse', lower_attack: 'Lower Attack', lower_defense: 'Lower Defense', dot: 'DOT', extra_attack: 'Bonus Attack', random_debuff: 'Random Debuff', multi_dot: 'Multi-DOT' };
            return labels[t] || t;
          };

          const hSkill = hoveredSkill;
          const hCurrent = hSkill ? (heroSkills[hSkill.id] || 0) : 0;
          const hMaxed = hSkill ? hCurrent >= hSkill.maxPoints : false;
          const hUnlocked = hSkill ? hCurrent > 0 : false;

          return (
            <div style={{ display: 'flex', gap: 0 }}>
              <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <h4 className="font-cinzel" style={{ color: tree.color, fontSize: '0.85rem', margin: 0 }}>
                    {tree.className} Skills
                  </h4>
                  <div style={{
                    background: (hero.skillPoints || 0) > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(110,231,183,0.1)',
                    border: `1px solid ${(hero.skillPoints || 0) > 0 ? 'var(--danger)' : 'var(--accent)'}`,
                    borderRadius: 6, padding: '2px 8px', fontSize: '0.7rem',
                    color: (hero.skillPoints || 0) > 0 ? 'var(--danger)' : 'var(--accent)', fontWeight: 700,
                  }}>
                    {hero.skillPoints || 0} SP
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: treeW, minHeight: maxY }}>
                    <svg width={treeW} height={maxY} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                      <defs>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                          <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                      </defs>
                      {connections.map((conn, i) => {
                        const fx = conn.from.x;
                        const fy = conn.from.y + NODE_H / 2 + 4;
                        const tx = conn.to.x;
                        const ty = conn.to.y - NODE_H / 2 + 14;
                        const midY = (fy + ty) / 2;
                        return (
                          <g key={i}>
                            <path
                              d={`M ${fx} ${fy} C ${fx} ${midY}, ${tx} ${midY}, ${tx} ${ty}`}
                              fill="none"
                              stroke={conn.complete ? tree.color : conn.active ? 'rgba(255,215,0,0.5)' : 'rgba(80,80,100,0.3)'}
                              strokeWidth={conn.complete ? 3 : 2}
                              strokeDasharray={conn.active || conn.complete ? 'none' : '4 4'}
                              filter={conn.complete ? 'url(#glow)' : 'none'}
                            />
                            {conn.complete && (
                              <circle cx={tx} cy={ty} r={3} fill={tree.color} filter="url(#glow)" />
                            )}
                          </g>
                        );
                      })}
                    </svg>

                    {tree.tiers.map((tier, tierIdx) => {
                      const tierLocked = hero.level < tier.requiredLevel;
                      const tierY = tierIdx * TIER_GAP + 36;
                      return (
                        <React.Fragment key={tierIdx}>
                          <div style={{
                            position: 'absolute', top: tierY - 24, left: 0, right: 0,
                            fontSize: '0.5rem', color: tierLocked ? 'rgba(120,120,140,0.5)' : 'rgba(212,169,106,0.6)',
                            fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5,
                            textAlign: 'center',
                          }}>
                            {tier.name}
                            {tierLocked && <span style={{ color: 'var(--danger)', marginLeft: 4 }}>Lv.{tier.requiredLevel}</span>}
                          </div>

                          {tier.skills.map(skill => {
                            const pos = skillPositions[skill.id];
                            const available = isSkillAvailable(skill, tier);
                            const unlocked = (heroSkills[skill.id] || 0) > 0;
                            const maxed = (heroSkills[skill.id] || 0) >= skill.maxPoints;
                            const current = heroSkills[skill.id] || 0;
                            const locked = tierLocked || (skill.requires && !(heroSkills[skill.requires] > 0));
                            const isHovered = hoveredSkill?.id === skill.id;

                            const borderColor = isHovered ? '#fff' : maxed ? tree.color : unlocked ? 'var(--gold)' : available ? 'var(--accent)' : 'rgba(60,60,80,0.6)';
                            const bgColor = maxed
                              ? `radial-gradient(circle at 50% 30%, ${tree.color}30, rgba(14,22,48,0.9))`
                              : unlocked
                                ? 'radial-gradient(circle at 50% 30%, rgba(255,215,0,0.12), rgba(14,22,48,0.85))'
                                : 'radial-gradient(circle at 50% 30%, rgba(42,49,80,0.4), rgba(14,22,48,0.9))';

                            return (
                              <div key={skill.id}
                                onClick={() => available && unlockHeroSkill(hero.id, skill.id)}
                                onMouseEnter={() => setHoveredSkill(skill)}
                                onMouseLeave={() => setHoveredSkill(null)}
                                style={{
                                  position: 'absolute',
                                  left: pos.x - NODE_W / 2,
                                  top: pos.y - NODE_H / 2 + 14,
                                  width: NODE_W,
                                  height: NODE_H,
                                  background: bgColor,
                                  border: `2px solid ${borderColor}`,
                                  borderRadius: 10,
                                  cursor: available ? 'pointer' : 'default',
                                  opacity: locked ? 0.35 : 1,
                                  transition: 'all 0.2s ease',
                                  display: 'flex', flexDirection: 'column',
                                  alignItems: 'center', justifyContent: 'center',
                                  boxShadow: isHovered ? `0 0 14px ${tree.color}50` : maxed ? `0 0 10px ${tree.color}35, inset 0 0 6px ${tree.color}12` : unlocked ? '0 0 6px rgba(255,215,0,0.12)' : 'none',
                                  zIndex: isHovered ? 5 : 1,
                                  transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                                }}
                              >
                                <div style={{
                                  fontSize: '1.2rem', lineHeight: 1,
                                  filter: maxed ? `drop-shadow(0 0 5px ${tree.color})` : unlocked ? 'drop-shadow(0 0 3px rgba(255,215,0,0.4))' : 'none',
                                }}><InlineIcon name={skill.icon} size={16} /></div>
                                <div style={{
                                  fontWeight: 700, fontSize: '0.55rem', marginTop: 2,
                                  color: maxed ? tree.color : unlocked ? 'var(--gold)' : 'var(--text)',
                                  textAlign: 'center', lineHeight: 1.1,
                                  maxWidth: NODE_W - 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{skill.name}</div>
                                <div style={{
                                  marginTop: 2, fontSize: '0.5rem', fontWeight: 700, fontFamily: 'monospace',
                                  color: maxed ? tree.color : unlocked ? '#fbbf24' : 'var(--muted)',
                                  background: 'rgba(0,0,0,0.35)', borderRadius: 5, padding: '0px 5px',
                                }}>{current}/{skill.maxPoints}</div>
                                {maxed && (
                                  <div style={{
                                    position: 'absolute', top: -4, right: -4,
                                    background: `linear-gradient(135deg, ${tree.color}, ${tree.color}cc)`,
                                    borderRadius: '50%', width: 14, height: 14,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.5rem', color: '#fff', fontWeight: 900,
                                    boxShadow: `0 0 6px ${tree.color}60`,
                                  }}>✓</div>
                                )}
                                {skill.grantedAbility && (
                                  <div style={{
                                    position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)',
                                    background: unlocked ? 'rgba(139,92,246,0.8)' : 'rgba(80,80,100,0.4)',
                                    borderRadius: 3, padding: '0px 3px', fontSize: '0.35rem',
                                    color: '#fff', fontWeight: 700, whiteSpace: 'nowrap',
                                    letterSpacing: 0.5,
                                  }}>ABILITY</div>
                                )}
                                {skill.passive && (
                                  <div style={{
                                    position: 'absolute', top: -3, left: -3,
                                    background: 'rgba(34,197,94,0.7)',
                                    borderRadius: 3, padding: '0px 3px', fontSize: '0.35rem',
                                    color: '#fff', fontWeight: 700, whiteSpace: 'nowrap',
                                  }}>PASSIVE</div>
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{
                width: 180, flexShrink: 0, marginLeft: 6,
                background: 'rgba(14,22,48,0.6)',
                border: '1px solid rgba(60,65,90,0.4)',
                borderRadius: 8, padding: 10,
                alignSelf: 'flex-start',
                position: 'sticky', top: 0,
                minHeight: 200,
              }}>
                {!hSkill ? (
                  <div style={{ textAlign: 'center', padding: '30px 5px' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: 8, opacity: 0.3 }}><InlineIcon name="nature" size={20} /></div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                      Hover over a skill to see details
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <div style={{
                        fontSize: '1.4rem', width: 32, height: 32, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: hMaxed ? `${tree.color}25` : hUnlocked ? 'rgba(255,215,0,0.1)' : 'rgba(42,49,80,0.4)',
                        border: `2px solid ${hMaxed ? tree.color : hUnlocked ? 'var(--gold)' : 'var(--border)'}`,
                        borderRadius: 8,
                      }}>{hSkill.icon}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.7rem', color: hMaxed ? tree.color : hUnlocked ? 'var(--gold)' : 'var(--text)' }}>
                          {hSkill.name}
                        </div>
                        <div style={{ fontSize: '0.5rem', color: 'var(--muted)', fontFamily: 'monospace', fontWeight: 700 }}>
                          {hCurrent}/{hSkill.maxPoints}
                          {hSkill.passive && <span style={{ color: '#22c55e', marginLeft: 4 }}>PASSIVE</span>}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.55rem', color: 'var(--muted)', lineHeight: 1.4, marginBottom: 6 }}>
                      {hSkill.description}
                    </div>

                    <div style={{
                      background: 'rgba(110,231,183,0.06)', border: '1px solid rgba(110,231,183,0.15)',
                      borderRadius: 5, padding: '3px 6px', marginBottom: 6,
                      fontSize: '0.55rem', color: 'var(--accent)', fontWeight: 600,
                    }}>
                      {hSkill.effect}
                    </div>

                    {hSkill.tier && (
                      <div style={{ fontSize: '0.5rem', color: 'var(--muted)', marginBottom: 4 }}>
                        <span style={{ color: 'var(--gold)' }}>{hSkill.tier.name}</span>
                      </div>
                    )}

                    {hSkill.requires && (
                      <div style={{ fontSize: '0.5rem', color: 'var(--muted)', marginBottom: 4 }}>
                        Requires: <span style={{ color: (heroSkills[hSkill.requires] || 0) > 0 ? '#22c55e' : 'var(--danger)' }}>
                          {allSkills.find(s => s.id === hSkill.requires)?.name || hSkill.requires}
                        </span>
                      </div>
                    )}

                    {hSkill.bonuses && Object.keys(hSkill.bonuses).length > 0 && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: '0.5rem', fontWeight: 700, color: 'var(--gold)', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Bonuses</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                          {Object.entries(hSkill.bonuses).map(([k, v]) => (
                            <span key={k} style={{
                              fontSize: '0.5rem', padding: '1px 4px', borderRadius: 3,
                              background: 'rgba(255,215,0,0.08)', border: '1px solid rgba(255,215,0,0.15)',
                              color: 'var(--gold)',
                            }}>+{v} {k.replace(/([A-Z])/g, ' $1').trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {hSkill.procEffect && (
                      <div style={{ marginBottom: 6 }}>
                        <div style={{ fontSize: '0.5rem', fontWeight: 700, color: '#22c55e', marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5 }}>Proc Effect</div>
                        <div style={{
                          background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
                          borderRadius: 4, padding: '3px 5px', fontSize: '0.5rem', color: 'var(--text)',
                        }}>
                          {effectTypeLabel(hSkill.procEffect.type)}
                          {hSkill.procEffect.damage && <span style={{ color: 'var(--danger)' }}> {(hSkill.procEffect.damage * 100).toFixed(0)}%/turn</span>}
                          {hSkill.procEffect.duration && <span style={{ color: 'var(--muted)' }}> {hSkill.procEffect.duration}T</span>}
                          {hSkill.procEffect.percent && <span style={{ color: '#f59e0b' }}> {(hSkill.procEffect.percent * 100).toFixed(0)}%</span>}
                          {hSkill.procEffect.chance && <span style={{ color: 'var(--muted)' }}> ({(hSkill.procEffect.chance * 100).toFixed(0)}% chance)</span>}
                        </div>
                      </div>
                    )}

                    {hSkill.grantedAbility && (
                      <div style={{
                        background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                        borderRadius: 5, padding: 5, marginTop: 4,
                      }}>
                        <div style={{ fontSize: '0.5rem', fontWeight: 700, color: '#a78bfa', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Granted Ability
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                          <span style={{ fontSize: '0.9rem' }}>{hSkill.grantedAbility.icon}</span>
                          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#a78bfa' }}>{hSkill.grantedAbility.name}</span>
                        </div>
                        <div style={{ fontSize: '0.5rem', color: 'var(--muted)', lineHeight: 1.3, marginBottom: 4 }}>
                          {hSkill.grantedAbility.description}
                        </div>
                        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                          {hSkill.grantedAbility.damage > 0 && (
                            <span style={{ fontSize: '0.45rem', padding: '1px 3px', borderRadius: 2, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                              {hSkill.grantedAbility.damage}x DMG
                            </span>
                          )}
                          {hSkill.grantedAbility.manaCost > 0 && (
                            <span style={{ fontSize: '0.45rem', padding: '1px 3px', borderRadius: 2, background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                              {hSkill.grantedAbility.manaCost} MP
                            </span>
                          )}
                          {hSkill.grantedAbility.staminaCost > 0 && (
                            <span style={{ fontSize: '0.45rem', padding: '1px 3px', borderRadius: 2, background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                              {hSkill.grantedAbility.staminaCost} SP
                            </span>
                          )}
                          {hSkill.grantedAbility.cooldown > 0 && (
                            <span style={{ fontSize: '0.45rem', padding: '1px 3px', borderRadius: 2, background: 'rgba(100,100,120,0.15)', color: 'var(--muted)' }}>
                              {hSkill.grantedAbility.cooldown}T CD
                            </span>
                          )}
                          <span style={{ fontSize: '0.45rem', padding: '1px 3px', borderRadius: 2, background: 'rgba(100,100,120,0.1)', color: 'var(--muted)' }}>
                            {hSkill.grantedAbility.target}
                          </span>
                        </div>
                        {hSkill.grantedAbility.effect && (
                          <div style={{ marginTop: 3, fontSize: '0.45rem', color: '#a78bfa' }}>
                            {hSkill.grantedAbility.effect.type && effectTypeLabel(hSkill.grantedAbility.effect.type)}
                            {hSkill.grantedAbility.effect.damage && <span style={{ color: 'var(--danger)' }}> {(hSkill.grantedAbility.effect.damage * 100).toFixed(0)}%/turn</span>}
                            {hSkill.grantedAbility.effect.duration && <span style={{ color: 'var(--muted)' }}> {hSkill.grantedAbility.effect.duration}T</span>}
                            {hSkill.grantedAbility.effect.flat && <span style={{ color: 'var(--accent)' }}> +{hSkill.grantedAbility.effect.flat}</span>}
                            {hSkill.grantedAbility.effect.multiplier && <span style={{ color: 'var(--accent)' }}> x{hSkill.grantedAbility.effect.multiplier}</span>}
                            {hSkill.grantedAbility.effect.percent && <span style={{ color: '#f59e0b' }}> {(hSkill.grantedAbility.effect.percent * 100).toFixed(0)}%</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

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
                      <img src={def.icon} alt={attr} style={{ width: 20, height: 20, imageRendering: 'pixelated', verticalAlign: 'middle', marginRight: 4 }} />{attr}
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

const TERRAIN_BG = {
  green: '/backgrounds/wc_green.png',
  red: '/backgrounds/wc_red.png',
  gold: '/backgrounds/wc_gold.png',
  purple: '/backgrounds/wc_purple.png',
  blue: '/backgrounds/wc_blue.png',
};

export default function AccountPage() {
  const { setScreen, heroRoster, activeHeroIds, maxHeroSlots, level, currentLocation } = useGameStore();
  const [selectedHeroId, setSelectedHeroId] = useState(heroRoster[0]?.id || null);

  const selectedHero = heroRoster.find(h => h.id === selectedHeroId);
  const canRecruit = heroRoster.length < maxHeroSlots;
  const terrain = getZoneTerrain(currentLocation);
  const bgImage = TERRAIN_BG[terrain] || TERRAIN_BG.green;

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: 'radial-gradient(circle at 30% 20%, rgba(110,231,183,0.04), transparent 50%), rgba(11,16,32,0.85)',
      overflow: 'hidden',
    }}>
      <header style={{
        backgroundImage: `linear-gradient(135deg, rgba(14,22,48,0.7), rgba(20,26,43,0.6)), url(${bgImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
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
          flex: '0 0 auto', width: 220, display: 'flex', flexDirection: 'column', gap: 10,
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
