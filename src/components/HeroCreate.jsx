import React, { useState, useMemo, useRef, useCallback } from 'react';
import useGameStore from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { attributeDefinitions, STARTING_POINTS, calculateStats } from '../data/attributes';
import SpriteAnimation from './SpriteAnimation';
import WorgeMorphPreview from './WorgeMorphPreview';
import { getPlayerSprite, namedHeroes } from '../data/spriteMap';
import { HERO_CREATE_MODAL } from '../constants/layers';

const ATTRIBUTES = Object.keys(attributeDefinitions);

const RACE_BG = {
  human: '/backgrounds/card_divine.png',
  elf: '/backgrounds/card_beach.png',
  dwarf: '/backgrounds/card_green_hills.png',
  undead: '/backgrounds/card_dark.png',
  orc: '/backgrounds/blood_canyon.png',
  barbarian: '/backgrounds/volcanic_field.png',
};

export default function HeroCreate() {
  const { addHeroToRoster, setScreen, level, heroRoster } = useGameStore();

  const [step, setStep] = useState(1);
  const [showCinematic, setShowCinematic] = useState(false);
  const [cinematicFading, setCinematicFading] = useState(false);
  const [cinematicPhase, setCinematicPhase] = useState('unlock');
  const videoRef = useRef(null);
  const [name, setName] = useState('');
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [detectedNamedHero, setDetectedNamedHero] = useState(null);
  const [attrPoints, setAttrPoints] = useState(
    ATTRIBUTES.reduce((acc, a) => ({ ...acc, [a]: 0 }), {})
  );
  const pendingHeroRef = useRef(null);
  const cinematicFinishing = useRef(false);

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

  const finishCinematic = useCallback(() => {
    if (cinematicFinishing.current) return;
    cinematicFinishing.current = true;
    setCinematicFading(true);
    setTimeout(() => {
      if (cinematicPhase === 'unlock') {
        setStep(4);
      } else if (pendingHeroRef.current) {
        addHeroToRoster(pendingHeroRef.current);
        pendingHeroRef.current = null;
      }
      setShowCinematic(false);
      setCinematicFading(false);
      cinematicFinishing.current = false;
    }, 800);
  }, [addHeroToRoster, cinematicPhase]);

  const checkSecretUnlock = (classId) => {
    if (!name.trim() || !selectedRace || !classId) return null;
    const heroName = name.trim().toLowerCase().replace(/\s+/g, ' ');
    console.log('[SECRET] checking:', JSON.stringify({ heroName, selectedRace, classId }));
    const matched = Object.keys(namedHeroes).find(key => {
      const nh = namedHeroes[key];
      const matchName = (nh.unlockName || nh.name).toLowerCase().replace(/\s+/g, ' ');
      const result = { key, matchName, nhRace: nh.race, nhClass: nh.class, unlocked: nh.unlocked, nameMatch: heroName === matchName, raceMatch: nh.race === selectedRace, classMatch: nh.class === classId };
      console.log('[SECRET] vs', key, ':', JSON.stringify(result));
      return nh.race === selectedRace && nh.class === classId && nh.unlocked && heroName === matchName;
    });
    console.log('[SECRET] result:', matched);
    return matched || null;
  };

  const handleClassNext = (classId) => {
    if (!classId) return;
    setSelectedClass(classId);
    const matched = checkSecretUnlock(classId);
    if (matched) {
      setDetectedNamedHero(matched);
      setCinematicPhase('unlock');
      setShowCinematic(true);
    } else {
      setDetectedNamedHero(null);
      setStep(4);
    }
  };

  const handleCreate = async () => {
    if (!name.trim() || !selectedRace || !selectedClass) return;
    const { generateGrudgeUuid } = await import('../utils/grudgeUuid.js');
    const heroId = generateGrudgeUuid('hero', `${name.trim()}_${selectedRace}_${selectedClass}`);
    const stats = calculateStats(finalAttributes, heroLevel);

    pendingHeroRef.current = {
      id: heroId,
      name: name.trim(),
      raceId: selectedRace,
      classId: selectedClass,
      level: heroLevel,
      namedHeroId: detectedNamedHero || null,
      attributePoints: { ...finalAttributes },
      currentHealth: Math.floor(stats.health),
      currentMana: Math.floor(stats.mana),
      currentStamina: Math.floor(stats.stamina),
    };
    setCinematicPhase('create');
    setShowCinematic(true);
  };

  const incAttr = (attr) => {
    if (remaining <= 0) return;
    setAttrPoints(prev => ({ ...prev, [attr]: prev[attr] + 1 }));
  };
  const decAttr = (attr) => {
    if (attrPoints[attr] <= 0) return;
    setAttrPoints(prev => ({ ...prev, [attr]: prev[attr] - 1 }));
  };

  if (showCinematic) {
    const nhKey = cinematicPhase === 'unlock' ? detectedNamedHero : pendingHeroRef.current?.namedHeroId;
    const nhData = nhKey ? namedHeroes[nhKey] : null;
    const videoSrc = nhData?.unlockVideo || '/videos/hero_creation_cinematic.mp4';
    const isNamedUnlock = cinematicPhase === 'unlock' && !!nhData?.unlockVideo;
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: HERO_CREATE_MODAL,
        background: '#000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: cinematicFading ? 0 : 1,
        transition: 'opacity 0.8s ease-out',
      }}>
        <video
          ref={videoRef}
          src={videoSrc}
          autoPlay
          muted
          playsInline
          onEnded={finishCinematic}
          onError={finishCinematic}
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
        {isNamedUnlock && (
          <div style={{
            position: 'absolute', top: 32, left: 0, right: 0, textAlign: 'center',
            animation: 'fadeIn 1.5s ease-out',
          }}>
            <div style={{
              color: '#d4a017', fontSize: '1.4rem', fontFamily: "'Cinzel', serif",
              fontWeight: 700, textShadow: '0 0 20px rgba(212,160,23,0.6), 0 2px 4px rgba(0,0,0,0.8)',
              letterSpacing: 3,
            }}>SECRET CHARACTER UNLOCKED</div>
            <div style={{
              color: '#ffd700', fontSize: '2rem', fontFamily: "'LifeCraft', 'Cinzel', serif",
              fontWeight: 700, marginTop: 8,
              textShadow: '0 0 30px rgba(255,215,0,0.5), 0 2px 6px rgba(0,0,0,0.9)',
            }}>{nhData.fullName}</div>
          </div>
        )}
        <button
          onClick={finishCinematic}
          style={{
            position: 'absolute', bottom: 32, right: 32,
            background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,215,0,0.4)',
            borderRadius: 8, padding: '8px 20px',
            color: 'var(--gold)', cursor: 'pointer',
            fontSize: '0.85rem', fontFamily: 'Cinzel, serif',
            backdropFilter: 'blur(4px)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,215,0,0.15)'}
          onMouseLeave={e => e.target.style.background = 'rgba(0,0,0,0.6)'}
        >
          Skip
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      backgroundImage: 'url(/backgrounds/hero_creation_bg.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
    }}>
      <div style={{
        width: '100%', height: '100%', overflow: 'auto',
        background: 'rgba(11,16,32,0.72)',
        backdropFilter: 'blur(2px)',
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
                    backgroundImage: `linear-gradient(135deg, ${selectedRace === id ? (race.color || 'var(--accent)') + '35' : 'rgba(20,26,43,0.85)'}, rgba(11,16,32,0.88)), url(${RACE_BG[id] || RACE_BG.human})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    border: `2px solid ${selectedRace === id ? (race.color || 'var(--accent)') : 'var(--border)'}`,
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
                  <div style={{
                    width: 80, height: 80,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid rgba(110,231,183,0.3)', borderRadius: 10,
                    background: 'rgba(0,0,0,0.25)', flexShrink: 0,
                  }}>
                    {id === 'worge' ? (
                      <WorgeMorphPreview raceId={selectedRace} namedHeroId={(() => { const nh = Object.values(namedHeroes).find(n => n.race === selectedRace && n.class === 'worge' && n.unlocked); return nh?.id || null; })()} scale={0.8} speed={150} />
                    ) : (
                      <SpriteAnimation spriteData={getPlayerSprite(id, selectedRace)} animation="idle" scale={0.8} speed={150} containerless={false} />
                    )}
                  </div>
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
              <button onClick={() => { setDetectedNamedHero(null); setStep(2); }} style={{
                background: 'var(--border)', border: 'none', borderRadius: 10,
                padding: '10px 20px', color: 'var(--text)', cursor: 'pointer',
              }}>← Back</button>
              <button onClick={() => handleClassNext(selectedClass)} disabled={!selectedClass}
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
                      <img src={def.icon} alt={attr} style={{ width: 24, height: 24, imageRendering: 'pixelated' }} />
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
                  {detectedNamedHero && namedHeroes[detectedNamedHero] ? (
                    <div style={{
                      background: 'linear-gradient(135deg, rgba(212,160,23,0.15), rgba(212,160,23,0.05))',
                      border: '1px solid rgba(212,160,23,0.4)', borderRadius: 8,
                      padding: '6px 10px', marginBottom: 8, textAlign: 'center',
                    }}>
                      <div style={{ color: '#d4a017', fontSize: '0.7rem', fontWeight: 700, fontFamily: "'Cinzel', serif" }}>
                        Secret Hero: {namedHeroes[detectedNamedHero].fullName}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.55rem', marginTop: 2 }}>{namedHeroes[detectedNamedHero].passive}</div>
                    </div>
                  ) : null}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <SpriteAnimation spriteData={detectedNamedHero && namedHeroes[detectedNamedHero] ? namedHeroes[detectedNamedHero].sprite : getPlayerSprite(selectedClass, selectedRace)} animation="idle" scale={2.6} speed={150} containerless={false} />
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
              <button onClick={() => { setDetectedNamedHero(null); setStep(3); }} style={{
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
    </div>
  );
}
