import React, { useState, useMemo } from 'react';
import useGameStore from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { attributeDefinitions, STARTING_POINTS, calculateStats } from '../data/attributes';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';

const ATTRIBUTES = Object.keys(attributeDefinitions);

export default function HeroCreate() {
  const { addHeroToRoster, setScreen, level, heroRoster } = useGameStore();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attrPoints, setAttrPoints] = useState(
    ATTRIBUTES.reduce((acc, a) => ({ ...acc, [a]: 0 }), {})
  );

  const heroLevel = Math.max(1, level - 2);

  const raceBonuses = useMemo(() => {
    if (!selectedRace) return {};
    return raceDefinitions[selectedRace]?.bonuses || {};
  }, [selectedRace]);

  const classBonuses = useMemo(() => {
    if (!selectedClass) return {};
    return classDefinitions[selectedClass]?.startingAttributes || {};
  }, [selectedClass]);

  const totalUsed = ATTRIBUTES.reduce((sum, a) => sum + attrPoints[a], 0);
  const totalAvailable = STARTING_POINTS;
  const remaining = totalAvailable - totalUsed;

  const finalAttributes = useMemo(() => {
    const result = {};
    ATTRIBUTES.forEach(a => {
      result[a] = (attrPoints[a] || 0) + (raceBonuses[a] || 0) + (classBonuses[a] || 0);
    });
    return result;
  }, [attrPoints, raceBonuses, classBonuses]);

  const previewStats = useMemo(() => {
    if (!selectedClass) return null;
    return calculateStats(finalAttributes, heroLevel);
  }, [finalAttributes, heroLevel, selectedClass]);

  const handleCreate = () => {
    if (!name.trim() || !selectedRace || !selectedClass) return;
    const heroId = `hero_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const stats = calculateStats(finalAttributes, heroLevel);
    addHeroToRoster({
      id: heroId,
      name: name.trim(),
      raceId: selectedRace,
      classId: selectedClass,
      level: heroLevel,
      attributePoints: { ...finalAttributes },
      currentHealth: Math.floor(stats.health),
      currentMana: Math.floor(stats.mana),
      currentStamina: Math.floor(stats.stamina),
    });
  };

  const incAttr = (attr) => {
    if (remaining <= 0) return;
    setAttrPoints(prev => ({ ...prev, [attr]: prev[attr] + 1 }));
  };
  const decAttr = (attr) => {
    if (attrPoints[attr] <= 0) return;
    setAttrPoints(prev => ({ ...prev, [attr]: prev[attr] - 1 }));
  };

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'radial-gradient(circle at 50% 30%, rgba(255,215,0,0.06), transparent 50%), rgba(11,16,32,0.85)',
    }}>
      <header style={{
        background: 'rgba(14,22,48,0.9)', borderBottom: '2px solid var(--gold)',
        padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <h1 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.3rem' }}>
          Recruit New Warlord
        </h1>
        <button onClick={() => setScreen('world')} style={{
          background: 'var(--border)', border: 'none', borderRadius: 8,
          padding: '6px 14px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.8rem'
        }}>← Back</button>
      </header>

      <div style={{
        display: 'flex', justifyContent: 'center', gap: 6, padding: '12px 20px',
        background: 'rgba(0,0,0,0.3)',
      }}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} style={{
            width: 80, height: 4, borderRadius: 2,
            background: s <= step ? 'var(--gold)' : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
        <div style={{
          fontSize: '0.7rem', color: 'var(--muted)', textAlign: 'center', marginBottom: 16,
        }}>
          This hero will start at level {heroLevel}
        </div>

        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <h2 className="font-cinzel" style={{ color: 'var(--text)', marginBottom: 20 }}>Name Your Warlord</h2>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="Enter hero name..."
              maxLength={20}
              autoFocus
              style={{
                background: 'rgba(42,49,80,0.5)', border: '2px solid var(--accent)',
                borderRadius: 10, padding: '12px 20px', color: 'var(--text)',
                fontSize: '1.2rem', textAlign: 'center', width: '80%', maxWidth: 400,
                outline: 'none',
              }}
              onKeyDown={e => { if (e.key === 'Enter' && name.trim()) setStep(2); }}
            />
            <div style={{ marginTop: 20 }}>
              <button onClick={() => name.trim() && setStep(2)} disabled={!name.trim()}
                style={{
                  background: name.trim() ? 'linear-gradient(135deg, var(--accent), #10b981)' : 'var(--border)',
                  border: 'none', borderRadius: 10, padding: '10px 30px',
                  color: name.trim() ? '#0b1020' : 'var(--muted)', fontWeight: 700,
                  cursor: name.trim() ? 'pointer' : 'not-allowed', fontSize: '1rem',
                }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-cinzel" style={{ color: 'var(--text)', marginBottom: 16, textAlign: 'center' }}>Choose Race</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {Object.entries(raceDefinitions).map(([id, race]) => (
                <div key={id} onClick={() => setSelectedRace(id)}
                  style={{
                    background: selectedRace === id
                      ? 'linear-gradient(135deg, rgba(110,231,183,0.15), rgba(110,231,183,0.05))'
                      : 'rgba(42,49,80,0.3)',
                    border: `2px solid ${selectedRace === id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s',
                  }}>
                  <img src={race.icon} alt={race.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', marginBottom: 6 }} />
                  <div className="font-cinzel" style={{ color: selectedRace === id ? 'var(--accent)' : 'var(--text)', fontSize: '1rem' }}>
                    {race.name}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.7rem', marginTop: 4 }}>{race.description}</div>
                  <div style={{ color: 'var(--gold)', fontSize: '0.65rem', marginTop: 6 }}>
                    {Object.entries(race.bonuses || {}).map(([attr, val]) => val > 0 ? `+${val} ${attr}` : null).filter(Boolean).join(', ')}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <button onClick={() => setStep(1)} style={{
                background: 'var(--border)', border: 'none', borderRadius: 10,
                padding: '10px 20px', color: 'var(--text)', cursor: 'pointer',
              }}>← Back</button>
              <button onClick={() => selectedRace && setStep(3)} disabled={!selectedRace}
                style={{
                  background: selectedRace ? 'linear-gradient(135deg, var(--accent), #10b981)' : 'var(--border)',
                  border: 'none', borderRadius: 10, padding: '10px 30px',
                  color: selectedRace ? '#0b1020' : 'var(--muted)', fontWeight: 700,
                  cursor: selectedRace ? 'pointer' : 'not-allowed',
                }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="font-cinzel" style={{ color: 'var(--text)', marginBottom: 16, textAlign: 'center' }}>Choose Class</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {Object.entries(classDefinitions).map(([id, cls]) => (
                <div key={id} onClick={() => setSelectedClass(id)}
                  style={{
                    background: selectedClass === id
                      ? 'linear-gradient(135deg, rgba(110,231,183,0.15), rgba(110,231,183,0.05))'
                      : 'rgba(42,49,80,0.3)',
                    border: `2px solid ${selectedClass === id ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'all 0.2s',
                    display: 'flex', gap: 12, alignItems: 'center',
                  }}>
                  <SpriteAnimation spriteData={getPlayerSprite(id, selectedRace)} animation="idle" scale={2.4} speed={150} />
                  <div>
                    <div className="font-cinzel" style={{ color: selectedClass === id ? 'var(--accent)' : 'var(--text)', fontSize: '1rem' }}>
                      {cls.name}
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.7rem', marginTop: 2 }}>{cls.description}</div>
                    <div style={{ color: 'var(--gold)', fontSize: '0.6rem', marginTop: 4 }}>
                      {cls.abilities.slice(0, 3).map(a => a.name).join(', ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <button onClick={() => setStep(2)} style={{
                background: 'var(--border)', border: 'none', borderRadius: 10,
                padding: '10px 20px', color: 'var(--text)', cursor: 'pointer',
              }}>← Back</button>
              <button onClick={() => selectedClass && setStep(4)} disabled={!selectedClass}
                style={{
                  background: selectedClass ? 'linear-gradient(135deg, var(--accent), #10b981)' : 'var(--border)',
                  border: 'none', borderRadius: 10, padding: '10px 30px',
                  color: selectedClass ? '#0b1020' : 'var(--muted)', fontWeight: 700,
                  cursor: selectedClass ? 'pointer' : 'not-allowed',
                }}>
                Next →
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <h2 className="font-cinzel" style={{ color: 'var(--text)', marginBottom: 8, textAlign: 'center' }}>Allocate Attributes</h2>
            <div style={{ textAlign: 'center', marginBottom: 16, color: remaining > 0 ? 'var(--gold)' : 'var(--accent)', fontSize: '0.9rem', fontWeight: 700 }}>
              Points Remaining: {remaining}/{totalAvailable}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                {ATTRIBUTES.map(attr => {
                  const def = attributeDefinitions[attr];
                  const base = (raceBonuses[attr] || 0) + (classBonuses[attr] || 0);
                  const total = finalAttributes[attr];
                  return (
                    <div key={attr} style={{
                      display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
                      background: 'rgba(42,49,80,0.3)', borderRadius: 8, padding: '6px 10px',
                    }}>
                      <span style={{ fontSize: '1rem' }}>{def.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text)', fontWeight: 600 }}>{attr}</div>
                        <div style={{ fontSize: '0.55rem', color: 'var(--muted)' }}>{def.description}</div>
                      </div>
                      <button onClick={() => decAttr(attr)} disabled={attrPoints[attr] <= 0}
                        style={{
                          width: 24, height: 24, borderRadius: 4,
                          background: attrPoints[attr] > 0 ? 'rgba(239,68,68,0.3)' : 'var(--border)',
                          border: 'none', color: 'var(--text)', cursor: attrPoints[attr] > 0 ? 'pointer' : 'not-allowed',
                          fontSize: '0.8rem', fontWeight: 700,
                        }}>-</button>
                      <div style={{
                        minWidth: 36, textAlign: 'center', color: def.color, fontWeight: 700, fontSize: '0.9rem',
                      }}>
                        {total}
                        {base > 0 && <span style={{ fontSize: '0.5rem', color: 'var(--muted)' }}> ({base}+{attrPoints[attr]})</span>}
                      </div>
                      <button onClick={() => incAttr(attr)} disabled={remaining <= 0}
                        style={{
                          width: 24, height: 24, borderRadius: 4,
                          background: remaining > 0 ? 'rgba(110,231,183,0.3)' : 'var(--border)',
                          border: 'none', color: 'var(--text)', cursor: remaining > 0 ? 'pointer' : 'not-allowed',
                          fontSize: '0.8rem', fontWeight: 700,
                        }}>+</button>
                    </div>
                  );
                })}
              </div>

              {previewStats && (
                <div style={{
                  background: 'rgba(20,26,43,0.8)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 16,
                }}>
                  <h3 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.9rem', marginBottom: 12 }}>
                    Preview - {name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <SpriteAnimation spriteData={getPlayerSprite(selectedClass, selectedRace)} animation="idle" scale={2.6} speed={150} />
                    <div>
                      <div style={{ color: 'var(--text)', fontWeight: 700 }}>{name}</div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>
                        Lv.{heroLevel} {raceDefinitions[selectedRace]?.name} {classDefinitions[selectedClass]?.name}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    {[
                      ['HP', Math.floor(previewStats.health), '#22c55e'],
                      ['MP', Math.floor(previewStats.mana), '#3b82f6'],
                      ['SP', Math.floor(previewStats.stamina), '#f59e0b'],
                      ['DMG', Math.floor(Math.max(previewStats.physicalDamage || 0, previewStats.magicDamage || 0)), '#ef4444'],
                      ['DEF', Math.floor(previewStats.defense), '#6b7280'],
                      ['SPD', Math.floor(20 + (finalAttributes.Agility || 0) * 0.3), '#a855f7'],
                      ['CRIT', `${(previewStats.criticalChance || 5).toFixed(1)}%`, '#fbbf24'],
                      ['EVD', `${(previewStats.evasion || 0).toFixed(1)}%`, '#22d3ee'],
                    ].map(([label, value, color]) => (
                      <div key={label} style={{
                        display: 'flex', justifyContent: 'space-between',
                        fontSize: '0.7rem', padding: '2px 0',
                      }}>
                        <span style={{ color: 'var(--muted)' }}>{label}</span>
                        <span style={{ color, fontWeight: 700 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <button onClick={() => setStep(3)} style={{
                background: 'var(--border)', border: 'none', borderRadius: 10,
                padding: '10px 20px', color: 'var(--text)', cursor: 'pointer',
              }}>← Back</button>
              <button onClick={handleCreate} disabled={remaining > 0}
                style={{
                  background: remaining === 0 ? 'linear-gradient(135deg, var(--gold), #f59e0b)' : 'var(--border)',
                  border: 'none', borderRadius: 10, padding: '10px 30px',
                  color: remaining === 0 ? '#0b1020' : 'var(--muted)', fontWeight: 700,
                  cursor: remaining === 0 ? 'pointer' : 'not-allowed', fontSize: '1rem',
                }}>
                Recruit Warlord!
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
