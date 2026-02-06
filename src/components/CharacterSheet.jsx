import React from 'react';
import useGameStore from '../stores/gameStore';
import { attributeDefinitions, calculateCombatPower } from '../data/attributes';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';

export default function CharacterSheet() {
  const {
    setScreen, playerName, playerClass, playerRace, level, xp, xpToNext, gold,
    attributePoints, unspentPoints, allocatePoint, deallocatePoint,
    getStats, victories, losses, playerHealth, playerMaxHealth
  } = useGameStore();

  const cls = classDefinitions[playerClass];
  const raceDef = playerRace ? raceDefinitions[playerRace] : null;
  const stats = getStats();
  const cp = calculateCombatPower(stats);

  const mainStats = [
    { key: 'health', label: 'Health', icon: '❤️', color: '#22c55e' },
    { key: 'mana', label: 'Mana', icon: '💧', color: '#3b82f6' },
    { key: 'stamina', label: 'Stamina', icon: '⚡', color: '#f59e0b' },
    { key: 'damage', label: 'Damage', icon: '⚔️', color: '#ef4444' },
    { key: 'defense', label: 'Defense', icon: '🛡️', color: '#6b7280' },
  ];

  const combatStats = [
    { key: 'criticalChance', label: 'Crit %', format: v => v.toFixed(1) + '%' },
    { key: 'criticalDamage', label: 'Crit DMG', format: v => v.toFixed(0) + '%' },
    { key: 'block', label: 'Block %', format: v => v.toFixed(1) + '%' },
    { key: 'evasion', label: 'Evasion', format: v => v.toFixed(1) + '%' },
    { key: 'accuracy', label: 'Accuracy', format: v => v.toFixed(1) + '%' },
    { key: 'attackSpeed', label: 'Atk Speed', format: v => v.toFixed(1) + '%' },
    { key: 'drainHealth', label: 'Lifesteal', format: v => v.toFixed(1) + '%' },
    { key: 'resistance', label: 'Resist', format: v => v.toFixed(1) + '%' },
    { key: 'damageReduction', label: 'DMG Redux', format: v => v.toFixed(1) + '%' },
    { key: 'armorPenetration', label: 'Armor Pen', format: v => v.toFixed(1) + '%' },
    { key: 'healthRegen', label: 'HP Regen', format: v => v.toFixed(1) + '/s' },
    { key: 'manaRegen', label: 'MP Regen', format: v => v.toFixed(1) + '/s' },
    { key: 'cooldownReduction', label: 'CDR', format: v => v.toFixed(1) + '%' },
  ];

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'rgba(11,16,32,0.75)'
    }}>
      <header style={{
        background: 'linear-gradient(135deg, rgba(14,22,48,0.9), rgba(20,26,43,0.7))',
        borderBottom: '2px solid var(--border)', padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <button onClick={() => setScreen('world')} style={{
          background: 'var(--border)', border: 'none', borderRadius: 8,
          padding: '8px 16px', color: 'var(--text)', cursor: 'pointer'
        }}>← Back</button>
        <h1 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>Character Sheet</h1>
        <div style={{ width: 80 }} />
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: 'rgba(20,26,43,0.8)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
              <SpriteAnimation spriteData={getPlayerSprite(playerClass)} animation="idle" scale={2} speed={150} />
            </div>
            <h2 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.3rem' }}>{playerName}</h2>
            <div style={{ color: cls?.color, fontSize: '0.9rem' }}>Level {level} {raceDef ? raceDef.name + ' ' : ''}{cls?.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 4 }}>
              XP: {xp}/{xpToNext} | Gold: {gold}
            </div>
            <div style={{
              marginTop: 10, background: 'rgba(255,215,0,0.1)', border: '1px solid var(--gold)',
              borderRadius: 8, padding: '8px 16px', display: 'inline-block'
            }}>
              <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Combat Power: </span>
              <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1.2rem' }}>{cp.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <h3 style={{ color: 'var(--accent)', fontSize: '1rem', marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
              Core Stats
            </h3>
            {mainStats.map(s => (
              <div key={s.key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)'
              }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{s.icon} {s.label}</span>
                <span style={{ color: s.color, fontWeight: 700, fontFamily: 'monospace' }}>
                  {Math.floor(stats[s.key])}
                </span>
              </div>
            ))}
          </div>

          <div>
            <h3 style={{ color: 'var(--accent)', fontSize: '1rem', marginBottom: 10, borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
              Combat Stats
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
              {combatStats.map(s => (
                <div key={s.key} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '4px 0', fontSize: '0.8rem'
                }}>
                  <span style={{ color: 'var(--muted)' }}>{s.label}</span>
                  <span style={{ color: 'var(--accent)', fontFamily: 'monospace' }}>
                    {s.format(stats[s.key] || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(20,26,43,0.8)', border: '1px solid var(--border)', borderRadius: 14, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ color: 'var(--gold)', fontSize: '1.1rem' }}>Attributes</h3>
            <div style={{
              background: unspentPoints > 0 ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)',
              border: `1px solid ${unspentPoints > 0 ? 'var(--danger)' : 'var(--success)'}`,
              borderRadius: 8, padding: '4px 12px', fontSize: '0.85rem',
              color: unspentPoints > 0 ? 'var(--danger)' : 'var(--success)', fontWeight: 600
            }}>
              {unspentPoints} pts
            </div>
          </div>

          {Object.entries(attributeDefinitions).map(([name, def]) => (
            <div key={name} style={{
              padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: def.color }}>
                  {def.icon} {name}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => deallocatePoint(name)} disabled={attributePoints[name] <= 0} style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: attributePoints[name] > 0 ? 'var(--danger)' : 'var(--border)',
                    border: 'none', color: 'white', fontWeight: 700, fontSize: '0.85rem',
                    cursor: attributePoints[name] > 0 ? 'pointer' : 'not-allowed'
                  }}>-</button>
                  <span style={{
                    color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace',
                    fontSize: '1rem', minWidth: 30, textAlign: 'center'
                  }}>
                    {attributePoints[name]}
                  </span>
                  <button onClick={() => allocatePoint(name)} disabled={unspentPoints <= 0} style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: unspentPoints > 0 ? 'var(--success)' : 'var(--border)',
                    border: 'none', color: 'white', fontWeight: 700, fontSize: '0.85rem',
                    cursor: unspentPoints > 0 ? 'pointer' : 'not-allowed'
                  }}>+</button>
                </div>
              </div>
              <div style={{
                height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(100, (attributePoints[name] / 50) * 100)}%`,
                  height: '100%', background: def.color, borderRadius: 3, transition: 'width 0.2s'
                }} />
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.7rem', marginTop: 4 }}>
                {def.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
