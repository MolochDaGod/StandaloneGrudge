import React, { useState, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions, raceList } from '../data/races';
import { attributeDefinitions } from '../data/attributes';
import SpriteAnimation from './SpriteAnimation';
import WorgeMorphPreview from './WorgeMorphPreview';
import { getPlayerSprite, namedHeroes } from '../data/spriteMap';
import { HERO_CREATE_MODAL } from '../constants/layers';

const stepLabels = ['Name', 'Race', 'Class', 'Attributes'];

const RACE_BG = {
  human: '/backgrounds/card_divine.png',
  elf: '/backgrounds/card_beach.png',
  dwarf: '/backgrounds/card_green_hills.png',
  undead: '/backgrounds/card_dark.png',
  orc: '/backgrounds/blood_canyon.png',
  barbarian: '/backgrounds/volcanic_field.png',
};

export default function CharacterCreate() {
  const {
    setScreen, setPlayerName, selectRace, selectClass,
    playerClass, playerRace, playerName,
    attributePoints, baseAttributePoints, unspentPoints, allocatePoint, deallocatePoint, startGame,
  } = useGameStore();

  const [step, setStep] = useState(1);
  const [nameInput, setNameInput] = useState('');
  const [selectedRace, setSelectedRace] = useState(null);
  const [selectedFaction, setSelectedFaction] = useState(null);
  const [detectedNamedHero, setDetectedNamedHero] = useState(null);
  const [showUnlockCinematic, setShowUnlockCinematic] = useState(false);
  const [cinematicFading, setCinematicFading] = useState(false);
  const videoRef = useRef(null);
  const cinematicFinishing = useRef(false);

  const checkSecretUnlock = (raceId, classId) => {
    const currentName = playerName || nameInput.trim();
    if (!currentName || !raceId || !classId) return null;
    const heroName = currentName.toLowerCase().replace(/\s+/g, ' ');
    const matched = Object.keys(namedHeroes).find(key => {
      const nh = namedHeroes[key];
      const matchName = (nh.unlockName || nh.name).toLowerCase().replace(/\s+/g, ' ');
      return nh.race === raceId && nh.class === classId && nh.unlocked && heroName === matchName;
    });
    return matched || null;
  };

  const handleStep1 = () => {
    if (nameInput.trim()) {
      setPlayerName(nameInput.trim());
      setStep(2);
    }
  };

  const handleStep2 = () => {
    if (selectedRace) {
      selectRace(selectedRace);
      setStep(3);
    }
  };

  const handleStep3 = () => {
    if (selectedFaction) {
      selectClass(selectedFaction);
      const matched = checkSecretUnlock(selectedRace, selectedFaction);
      if (matched) {
        setDetectedNamedHero(matched);
        setShowUnlockCinematic(true);
      }
      setStep(4);
    }
  };

  const finishCinematic = () => {
    if (cinematicFinishing.current) return;
    cinematicFinishing.current = true;
    setCinematicFading(true);
    setTimeout(() => {
      setShowUnlockCinematic(false);
      setCinematicFading(false);
      cinematicFinishing.current = false;
    }, 800);
  };

  const handleStart = () => {
    if (playerClass) startGame(detectedNamedHero || null);
  };

  const goBack = (toStep) => {
    if (toStep <= 3) {
      setSelectedFaction(null);
      selectClass(null);
      setDetectedNamedHero(null);
    }
    if (toStep <= 2) {
      setSelectedRace(null);
      selectRace(null);
    }
    setStep(toStep);
  };

  const selectedRaceDef = selectedRace ? raceDefinitions[selectedRace] : null;
  const selectedCls = selectedFaction ? classDefinitions[selectedFaction] : null;

  const nhData = detectedNamedHero ? namedHeroes[detectedNamedHero] : null;

  if (showUnlockCinematic && nhData) {
    const videoSrc = nhData.unlockVideo || '/videos/hero_creation_cinematic.mp4';
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
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute', bottom: '15%', left: 0, right: 0,
          textAlign: 'center', animation: 'fadeIn 1.5s ease forwards',
          pointerEvents: 'none',
        }}>
          <div className="font-lifecraft" style={{
            fontSize: '2.5rem', color: nhData.color || 'var(--gold)',
            textShadow: `0 0 30px ${nhData.color || 'var(--gold)'}60, 0 0 60px ${nhData.color || 'var(--gold)'}30, 0 2px 6px rgba(0,0,0,0.9)`,
            letterSpacing: 4, marginBottom: 8,
          }}>
            SECRET HERO UNLOCKED
          </div>
          <div className="font-cinzel" style={{
            fontSize: '1.8rem', color: '#fff',
            textShadow: '0 0 20px rgba(255,215,0,0.4), 0 2px 4px rgba(0,0,0,0.9)',
          }}>
            {nhData.fullName}
          </div>
          <div style={{
            fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: 8,
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          }}>
            {nhData.passive}
          </div>
        </div>
        <button onClick={finishCinematic} style={{
          position: 'absolute', bottom: 30, right: 30,
          background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 8, padding: '8px 20px', color: '#fff',
          cursor: 'pointer', fontSize: '0.9rem', backdropFilter: 'blur(4px)',
        }}>
          Skip
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'radial-gradient(circle at 50% 0%, rgba(110,231,183,0.05), transparent 50%), rgba(11,16,32,0.75)',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: 'url(/backgrounds/character_create.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.35, zIndex: 0, pointerEvents: 'none',
      }} />
      <header style={{
        background: 'linear-gradient(135deg, rgba(14,22,48,0.95), rgba(20,26,43,0.9))',
        borderBottom: '2px solid var(--border)', padding: '14px 20px', textAlign: 'center',
        position: 'sticky', top: 0, zIndex: 10,
        backdropFilter: 'blur(8px)',
      }}>
        <h1 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.4rem', marginBottom: 10 }}>
          Create Your Warlord
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
          {stepLabels.map((label, i) => {
            const s = i + 1;
            const active = step === s;
            const done = step > s;
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                {i > 0 && <div style={{ width: 16, height: 2, background: done ? 'var(--accent)' : 'var(--border)' }} />}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: done ? 'var(--accent)' : active ? 'var(--gold)' : 'var(--border)',
                  color: done || active ? '#0b1020' : 'var(--muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.7rem', transition: 'all 0.3s'
                }}>{done ? '✓' : s}</div>
                <span style={{
                  color: active ? 'var(--text)' : done ? 'var(--accent)' : 'var(--muted)',
                  fontSize: '0.75rem', fontWeight: active ? 600 : 400
                }}>{label}</span>
              </div>
            );
          })}
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20, position: 'relative', zIndex: 1 }}>

        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.4s ease', textAlign: 'center', paddingTop: 40 }}>
            <h2 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.3rem', marginBottom: 20 }}>
              Name Your Warlord
            </h2>
            <input
              type="text" value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStep1()}
              placeholder="Enter your name..."
              maxLength={20} autoFocus
              style={{
                background: 'rgba(14,22,48,0.8)', border: '2px solid var(--border)',
                borderRadius: 10, padding: '14px 28px', fontSize: '1.2rem',
                color: 'var(--text)', textAlign: 'center', width: 340,
                outline: 'none', fontFamily: "'Jost', sans-serif"
              }}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
            <div style={{ marginTop: 30 }}>
              <button onClick={handleStep1} disabled={!nameInput.trim()} style={{
                background: nameInput.trim() ? 'linear-gradient(135deg, var(--accent), #10b981)' : 'var(--border)',
                border: 'none', borderRadius: 10, padding: '14px 50px',
                color: nameInput.trim() ? '#0b1020' : 'var(--muted)',
                fontWeight: 700, fontSize: '1rem', cursor: nameInput.trim() ? 'pointer' : 'not-allowed',
                fontFamily: "'Cinzel', serif", letterSpacing: 1, transition: 'all 0.3s'
              }}>Continue</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <h2 className="font-cinzel" style={{ color: 'var(--gold)', textAlign: 'center', marginBottom: 6, fontSize: '1.3rem' }}>
              Choose Your Race
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 20 }}>
              6 Races &times; 4 Classes = 24 Warlord Combinations
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {raceList.map(race => {
                const isSelected = selectedRace === race.id;
                return (
                  <div key={race.id} onClick={() => setSelectedRace(race.id)} style={{
                    backgroundImage: `linear-gradient(135deg, ${isSelected ? race.color + '35' : 'rgba(20,26,43,0.85)'}, rgba(11,16,32,0.88)), url(${RACE_BG[race.id] || RACE_BG.human})`,
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    border: `2px solid ${isSelected ? race.color : race.color + '30'}`,
                    borderRadius: 12, padding: 16, cursor: 'pointer',
                    transition: 'all 0.25s', textAlign: 'center', position: 'relative',
                    boxShadow: isSelected ? `0 0 20px ${race.color}25, inset 0 0 30px ${race.color}08` : 'none',
                    transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                    minHeight: 160,
                  }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = race.color + '80'; e.currentTarget.style.transform = 'translateY(-2px)'; }}}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = race.color + '30'; e.currentTarget.style.transform = 'none'; }}}
                  >
                    {isSelected && <div style={{
                      position: 'absolute', top: 6, right: 8, color: race.color, fontSize: '0.8rem', fontWeight: 700
                    }}>&#10003;</div>}
                    {isSelected && <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: 6,
                      borderRadius: '0 0 10px 10px',
                      background: `linear-gradient(90deg, transparent, ${race.color}88 30%, ${race.color} 50%, ${race.color}88 70%, transparent)`,
                      boxShadow: `0 0 12px ${race.color}66, 0 -2px 8px ${race.color}33`,
                    }} />}
                    <img src={race.icon} alt={race.name} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginBottom: 6 }} />
                    <h3 className="font-cinzel" style={{ color: race.color, marginBottom: 4, fontSize: '1rem' }}>{race.name}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: '0.73rem', marginBottom: 6, lineHeight: 1.4 }}>{race.description}</p>
                    <div style={{
                      background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '4px 8px',
                      fontSize: '0.65rem', color: race.color, display: 'inline-block'
                    }}>
                      {race.passive}
                    </div>
                    <div style={{
                      marginTop: 6, fontSize: '0.6rem', color: 'var(--muted)', fontStyle: 'italic', opacity: 0.7
                    }}>
                      Trait: {race.trait}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: 16, background: 'rgba(14,22,48,0.8)',
              border: `1px solid ${selectedRaceDef ? selectedRaceDef.color + '40' : 'var(--border)'}`,
              borderRadius: 10, padding: 14, textAlign: 'center',
              minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {selectedRaceDef ? (
                <p style={{ color: 'var(--text)', fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.8, margin: 0 }}>
                  "{selectedRaceDef.lore}"
                </p>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.5, margin: 0 }}>
                  Select a race to learn more
                </p>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button onClick={() => goBack(1)} style={{
                background: 'var(--border)', border: 'none', borderRadius: 10,
                padding: '12px 28px', color: 'var(--text)', fontWeight: 600,
                cursor: 'pointer', fontSize: '0.9rem'
              }}>Back</button>
              <button onClick={handleStep2} disabled={!selectedRace} style={{
                background: selectedRace ? 'linear-gradient(135deg, var(--accent), #10b981)' : 'var(--border)',
                border: 'none', borderRadius: 10, padding: '12px 40px',
                color: selectedRace ? '#0b1020' : 'var(--muted)',
                fontWeight: 700, fontSize: '1rem', cursor: selectedRace ? 'pointer' : 'not-allowed',
                fontFamily: "'Cinzel', serif", letterSpacing: 1, transition: 'all 0.3s'
              }}>Continue</button>
            </div>
          </div>
        )}

        {step === 3 && (() => {
          const CLASS_ICONS = {
            warrior: '/sprites/ui/icons/icon_warrior.png',
            mage: '/sprites/ui/icons/icon_mage.png',
            worge: '/sprites/ui/icons/icon_worge.png',
            ranger: '/sprites/ui/icons/icon_ranger.png',
          };
          const ATTR_COLORS = {
            Strength: '#ef4444', Vitality: '#22c55e', Endurance: '#f59e0b',
            Dexterity: '#3b82f6', Agility: '#06b6d4', Intellect: '#8b5cf6',
            Wisdom: '#ec4899', Tactics: '#f97316',
          };
          const maxAttr = 9;
          const cardH = 200;
          return (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <h2 className="font-cinzel" style={{
                color: 'var(--gold)', fontSize: '1.4rem', marginBottom: 6,
                textShadow: '0 0 20px rgba(255,215,0,0.3)', letterSpacing: 2
              }}>
                Choose Your Class
              </h2>
              {selectedRaceDef && (
                <span style={{
                  background: `${selectedRaceDef.color}20`, border: `1px solid ${selectedRaceDef.color}40`,
                  padding: '4px 14px', borderRadius: 20, fontSize: '0.75rem', color: selectedRaceDef.color
                }}>
                  <img src={selectedRaceDef.icon} alt={selectedRaceDef.name} style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', marginRight: 4 }} />{selectedRaceDef.name}
                </span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {Object.entries(classDefinitions).map(([id, cls]) => {
                const isSelected = selectedFaction === id;
                const previewAttrs = { ...cls.startingAttributes };
                if (selectedRaceDef) {
                  Object.entries(selectedRaceDef.bonuses).forEach(([attr, val]) => {
                    if (previewAttrs[attr] !== undefined) previewAttrs[attr] += val;
                  });
                }
                const topAttrs = Object.entries(previewAttrs).sort((a, b) => b[1] - a[1]).slice(0, 4);
                const spriteData = id !== 'worge' ? getPlayerSprite(id, selectedRace) : null;
                const frameH = spriteData?.frameHeight || 128;
                const targetH = cardH - 20;
                const baseScale = Math.min(Math.max(targetH / frameH, 1), 4);
                const finalScale = baseScale * (spriteData?.scale || 1);
                return (
                  <div key={id} onClick={() => setSelectedFaction(id)} style={{
                    position: 'relative', overflow: 'hidden', cursor: 'pointer',
                    height: cardH,
                    background: isSelected
                      ? `linear-gradient(180deg, ${cls.color}15, rgba(10,14,30,0.95) 50%)`
                      : 'linear-gradient(180deg, rgba(16,20,36,0.95), rgba(10,14,30,0.85))',
                    border: `2px solid ${isSelected ? cls.color : cls.color + '25'}`,
                    borderRadius: 14, padding: 0,
                    transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: isSelected
                      ? `0 0 25px ${cls.color}25, inset 0 0 30px ${cls.color}08`
                      : '0 2px 8px rgba(0,0,0,0.3)',
                  }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = cls.color + '70'; e.currentTarget.style.boxShadow = `0 4px 16px ${cls.color}15`; }}}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = cls.color + '25'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'; }}}
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                        background: `linear-gradient(90deg, transparent, ${cls.color}, transparent)`,
                        animation: 'shimmer 2s infinite', zIndex: 3,
                      }} />
                    )}

                    <div style={{
                      position: 'absolute', right: 0, bottom: 20, zIndex: 1,
                      display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
                      width: '65%', height: '100%', pointerEvents: 'none',
                    }}>
                      {id === 'worge' ? (
                        <WorgeMorphPreview raceId={selectedRace} scale={finalScale} speed={150} />
                      ) : (
                        <SpriteAnimation spriteData={spriteData} animation="idle" scale={finalScale} speed={150} containerless={false} />
                      )}
                    </div>

                    <div style={{
                      position: 'absolute', right: 0, bottom: 0, left: 0, height: 30,
                      background: `linear-gradient(transparent, rgba(5,8,20,0.7))`,
                      pointerEvents: 'none', zIndex: 2,
                    }} />

                    <div style={{ position: 'relative', zIndex: 2, padding: '10px 10px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <img src={CLASS_ICONS[id]} alt={cls.name} style={{
                          width: 18, height: 18, imageRendering: 'pixelated',
                          filter: isSelected ? `drop-shadow(0 0 3px ${cls.color})` : 'none',
                        }} />
                        <h3 className="font-cinzel" style={{
                          color: isSelected ? cls.color : '#e2e8f0', margin: 0, fontSize: '0.9rem',
                          textShadow: isSelected ? `0 0 8px ${cls.color}40` : '0 1px 3px rgba(0,0,0,0.8)',
                        }}>{cls.name}</h3>
                        {isSelected && <span style={{ color: cls.color, fontSize: '0.75rem', fontWeight: 700 }}>&#10003;</span>}
                      </div>
                      <p style={{
                        color: 'var(--muted)', fontSize: '0.62rem', margin: '0 0 8px 0',
                        lineHeight: 1.3, opacity: 0.75, maxWidth: '70%',
                        textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                      }}>{cls.description}</p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: '55%' }}>
                        {topAttrs.map(([attr, val]) => (
                          <div key={attr} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{
                              fontSize: '0.55rem', color: ATTR_COLORS[attr] || '#94a3b8',
                              width: 22, textAlign: 'right', fontWeight: 600,
                              textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                            }}>
                              {attr.slice(0, 3)}
                            </span>
                            <div style={{
                              flex: 1, height: 5, borderRadius: 3, overflow: 'hidden',
                              background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                              <div style={{
                                width: `${Math.min((val / maxAttr) * 100, 100)}%`, height: '100%',
                                borderRadius: 3, transition: 'width 0.4s ease',
                                background: `linear-gradient(90deg, ${ATTR_COLORS[attr] || '#94a3b8'}80, ${ATTR_COLORS[attr] || '#94a3b8'})`,
                                boxShadow: isSelected ? `0 0 4px ${ATTR_COLORS[attr] || '#94a3b8'}40` : 'none',
                              }} />
                            </div>
                            <span style={{ fontSize: '0.55rem', color: '#94a3b8', width: 10, fontWeight: 600 }}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: 12, position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(14,22,48,0.9), rgba(10,14,30,0.95))',
              border: `1px solid ${selectedCls ? selectedCls.color + '30' : 'var(--border)'}`,
              borderRadius: 12, padding: '12px 16px', textAlign: 'center',
              minHeight: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {selectedCls ? (<>
                <p style={{
                  color: selectedCls.color, fontSize: '0.72rem', fontStyle: 'italic',
                  opacity: 0.9, margin: 0, lineHeight: 1.5,
                  textShadow: `0 0 20px ${selectedCls.color}20`,
                }}>
                  &ldquo;{selectedCls.lore}&rdquo;
                </p>
                <img src={CLASS_ICONS[selectedFaction]} alt="" style={{
                  width: 32, height: 32, imageRendering: 'pixelated', opacity: 0.6,
                  filter: `drop-shadow(0 0 6px ${selectedCls.color}60)`,
                }} />
              </>) : (
                <p style={{ color: 'var(--muted)', fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.5, margin: 0 }}>
                  Select a class to learn more
                </p>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: 16, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button onClick={() => goBack(2)} style={{
                background: 'rgba(30,40,60,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                padding: '12px 28px', color: 'var(--text)', fontWeight: 600,
                cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s',
              }}>Back</button>
              <button onClick={handleStep3} disabled={!selectedFaction} style={{
                background: selectedFaction ? `linear-gradient(135deg, ${selectedCls?.color || 'var(--accent)'}, ${selectedCls?.color || 'var(--accent)'}aa)` : 'var(--border)',
                border: selectedFaction ? `1px solid ${selectedCls?.color || 'var(--accent)'}60` : '1px solid transparent',
                borderRadius: 10, padding: '12px 40px',
                color: selectedFaction ? '#fff' : 'var(--muted)',
                fontWeight: 700, fontSize: '1rem', cursor: selectedFaction ? 'pointer' : 'not-allowed',
                fontFamily: "'Cinzel', serif", letterSpacing: 1, transition: 'all 0.3s',
                boxShadow: selectedFaction ? `0 0 20px ${selectedCls?.color || 'var(--accent)'}30` : 'none',
                textShadow: selectedFaction ? '0 1px 2px rgba(0,0,0,0.3)' : 'none',
              }}>Continue</button>
            </div>
          </div>
          );
        })()}

        {step === 4 && playerClass && (() => {
          const cls = classDefinitions[playerClass];
          const raceDef = playerRace ? raceDefinitions[playerRace] : null;
          return (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20,
              background: 'linear-gradient(135deg, rgba(14,22,48,0.9), rgba(20,26,43,0.7))',
              border: `2px solid ${cls.color}40`, borderRadius: 14, padding: 18,
              flexWrap: 'wrap', justifyContent: 'center'
            }}>
              <div style={{
                width: 120, height: 120, borderRadius: 14,
                background: `radial-gradient(circle, ${cls.color}15, transparent)`,
                border: `2px solid ${cls.color}30`,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                flexShrink: 0,
                overflow: 'hidden',
              }}>
                <SpriteAnimation spriteData={nhData ? nhData.sprite : getPlayerSprite(playerClass, playerRace)} animation="idle" scale={1.1} speed={150} containerless={false} />
              </div>
              <div style={{ flex: 1, minWidth: 180, textAlign: 'center' }}>
                <h2 className="font-cinzel" style={{ color: nhData ? (nhData.color || 'var(--gold)') : 'var(--gold)', fontSize: '1.2rem', marginBottom: 4 }}>
                  {nhData ? nhData.fullName : playerName}
                </h2>
                {nhData && (
                  <div style={{
                    background: `linear-gradient(135deg, ${nhData.color || 'var(--gold)'}15, transparent)`,
                    border: `1px solid ${nhData.color || 'var(--gold)'}50`,
                    borderRadius: 8, padding: '6px 14px', marginBottom: 8,
                    display: 'inline-block',
                  }}>
                    <span className="font-cinzel" style={{
                      fontSize: '0.7rem', color: nhData.color || 'var(--gold)',
                      fontWeight: 700, letterSpacing: 2,
                    }}>SECRET HERO</span>
                    <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 2 }}>{nhData.passive}</div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
                  {raceDef && (
                    <span style={{
                      background: `${raceDef.color}20`, border: `1px solid ${raceDef.color}40`,
                      padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', color: raceDef.color
                    }}><img src={raceDef.icon} alt={raceDef.name} style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', marginRight: 4 }} />{raceDef.name}</span>
                  )}
                  <span style={{
                    background: `${cls.color}20`, border: `1px solid ${cls.color}40`,
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', color: cls.color
                  }}>{cls.icon} {cls.name}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 6 }}>
                  Base stats: 20 from Race + Class
                </div>
                <div style={{
                  background: unspentPoints === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  border: `2px solid ${unspentPoints === 0 ? 'var(--success)' : 'var(--gold)'}`,
                  borderRadius: 10, padding: '6px 16px', display: 'inline-block'
                }}>
                  <span style={{
                    fontSize: '1.1rem', fontWeight: 700,
                    color: unspentPoints === 0 ? 'var(--success)' : 'var(--gold)'
                  }}>{unspentPoints}</span>
                  <span style={{ color: 'var(--muted)', fontSize: '0.7rem', marginLeft: 6 }}>points to allocate</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
              {Object.entries(attributeDefinitions).map(([name, def]) => {
                const base = (baseAttributePoints && baseAttributePoints[name]) || 0;
                const current = attributePoints[name];
                const added = current - base;
                const canRemove = current > base;
                return (
                <div key={name} style={{
                  background: 'rgba(20,26,43,0.8)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 12, borderLeft: `4px solid ${def.color}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      <img src={def.icon} alt={name} style={{ width: 22, height: 22, imageRendering: 'pixelated', verticalAlign: 'middle', marginRight: 4 }} />{name}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontSize: '1.05rem' }}>
                      <span style={{ color: 'var(--muted)' }}>{base}</span>
                      {added > 0 && <span style={{ color: 'var(--accent)', fontWeight: 700 }}> +{added}</span>}
                      <span style={{ color: 'var(--text)', fontWeight: 700, marginLeft: 6 }}>= {current}</span>
                    </span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.7rem', marginBottom: 6 }}>{def.description}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => deallocatePoint(name)} style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: canRemove ? 'var(--danger)' : 'var(--border)',
                      border: 'none', color: 'white', fontWeight: 700, fontSize: '1rem',
                      cursor: canRemove ? 'pointer' : 'not-allowed', opacity: canRemove ? 1 : 0.4
                    }}>-</button>
                    <div style={{
                      flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', position: 'relative'
                    }}>
                      <div style={{
                        width: `${(base / 20) * 100}%`, height: '100%',
                        background: `${def.color}50`,
                        borderRadius: 4, position: 'absolute'
                      }} />
                      <div style={{
                        width: `${(current / 20) * 100}%`, height: '100%',
                        background: `linear-gradient(90deg, ${def.color}, ${def.color}80)`,
                        borderRadius: 4, transition: 'width 0.2s', position: 'relative'
                      }} />
                    </div>
                    <button onClick={() => allocatePoint(name)} style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: unspentPoints > 0 ? 'var(--success)' : 'var(--border)',
                      border: 'none', color: 'white', fontWeight: 700, fontSize: '1rem',
                      cursor: unspentPoints > 0 ? 'pointer' : 'not-allowed', opacity: unspentPoints > 0 ? 1 : 0.4
                    }}>+</button>
                  </div>
                </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button onClick={() => goBack(3)} style={{
                background: 'var(--border)', border: 'none', borderRadius: 10,
                padding: '12px 28px', color: 'var(--text)', fontWeight: 600,
                cursor: 'pointer', fontSize: '0.9rem'
              }}>Back</button>
              <button onClick={handleStart} style={{
                background: 'linear-gradient(135deg, var(--accent), #10b981)',
                border: 'none', borderRadius: 10, padding: '14px 50px',
                color: '#0b1020', fontWeight: 700, fontSize: '1.05rem',
                cursor: 'pointer', fontFamily: "'Cinzel', serif", letterSpacing: 1
              }}>Begin Adventure</button>
            </div>
          </div>
          );
        })()}
      </div>
    </div>
  );
}
