import React, { useState } from 'react';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { attributeDefinitions, calculateCombatPower } from '../data/attributes';
import { skillTrees } from '../data/skillTrees';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';

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
          <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={1.4} speed={150} />
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

function HeroDetailPanel({ hero, onClose }) {
  const { unlockHeroSkill, allocateHeroPoint, deallocateHeroPoint, activeHeroIds, setActiveHeroes } = useGameStore();
  const [tab, setTab] = useState('stats');

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
    { key: 'damage', label: 'Damage', icon: '⚔️', color: '#ef4444' },
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
          <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={2} speed={150} />
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
          <button key={t.id} onClick={() => setTab(t.id)} style={{
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
        {tab === 'stats' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <MiniBar current={hero.currentHealth} max={stats.health} color="#22c55e" height={8} label="HP" />
              <MiniBar current={hero.currentMana} max={stats.mana} color="#3b82f6" height={6} label="MP" />
              <MiniBar current={hero.currentStamina} max={stats.stamina} color="#f59e0b" height={6} label="SP" />
            </div>

            <h4 style={{ color: 'var(--accent)', fontSize: '0.85rem', marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
              Core Stats
            </h4>
            {mainStats.map(s => (
              <div key={s.key} style={{
                display: 'flex', justifyContent: 'space-between', padding: '5px 0',
                borderBottom: '1px solid rgba(255,255,255,0.03)',
              }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{s.icon} {s.label}</span>
                <span style={{ color: s.color, fontWeight: 700, fontFamily: 'monospace' }}>{Math.floor(stats[s.key])}</span>
              </div>
            ))}

            <h4 style={{ color: 'var(--accent)', fontSize: '0.85rem', marginTop: 16, marginBottom: 8, borderBottom: '1px solid var(--border)', paddingBottom: 4 }}>
              Combat Stats
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px' }}>
              {combatStats.map(s => (
                <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--muted)' }}>{s.label}</span>
                  <span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>{s.format(stats[s.key])}</span>
                </div>
              ))}
            </div>

            {race && (
              <div style={{
                marginTop: 16, padding: 12, background: 'rgba(42,49,80,0.3)',
                borderRadius: 10, border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--gold)', fontWeight: 600, marginBottom: 4 }}>
                  {race.icon} {race.name} — {race.trait}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>{race.traitDescription}</div>
              </div>
            )}
          </div>
        )}

        {tab === 'abilities' && (
          <div>
            <h4 style={{ color: 'var(--accent)', fontSize: '0.85rem', marginBottom: 12 }}>
              {cls?.name} Abilities
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cls?.abilities.map((ability, idx) => (
                <div key={ability.id} style={{
                  background: 'rgba(42,49,80,0.4)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: 14, display: 'flex', gap: 14, alignItems: 'flex-start',
                }}>
                  <div style={{
                    fontSize: '1.8rem', width: 50, height: 50,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.3)', borderRadius: 10,
                    border: `1px solid ${cls?.color || 'var(--border)'}`,
                    position: 'relative',
                  }}>
                    {ability.icon}
                    <div style={{
                      position: 'absolute', top: -4, left: -4, width: 16, height: 16,
                      background: cls?.color || 'var(--accent)', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.55rem', fontWeight: 700, color: '#0b1020',
                    }}>{idx + 1}</div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: 2 }}>
                      {ability.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 6 }}>
                      {ability.description}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                      }}>
                        {ability.damage > 0 ? `${(ability.damage * 100).toFixed(0)}% DMG` : ability.type === 'heal' ? `${(ability.healPercent * 100)}% Heal` : ability.type}
                      </span>
                      {ability.manaCost > 0 && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                          {ability.manaCost} MP
                        </span>
                      )}
                      {ability.staminaCost > 0 && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                          {ability.staminaCost} SP
                        </span>
                      )}
                      {ability.cooldown > 0 && (
                        <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(107,114,128,0.15)', color: '#9ca3af' }}>
                          {ability.cooldown}T CD
                        </span>
                      )}
                    </div>
                    {ability.effect && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--gold)', marginTop: 4 }}>
                        Effect: {ability.effect.type === 'stun' ? 'Stun' : ability.effect.type === 'dot' ? 'DoT' : ability.effect.stat}{' '}
                        {ability.effect.duration && `(${ability.effect.duration} turns)`}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
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
