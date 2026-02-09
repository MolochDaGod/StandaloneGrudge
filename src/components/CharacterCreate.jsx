import React, { useState } from 'react';
import useGameStore from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions, raceList } from '../data/races';
import { attributeDefinitions } from '../data/attributes';
import SpriteAnimation from './SpriteAnimation';
import WorgeMorphPreview from './WorgeMorphPreview';
import { getPlayerSprite } from '../data/spriteMap';

const stepLabels = ['Name', 'Race', 'Class', 'Attributes'];

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
      setStep(4);
    }
  };

  const handleStart = () => {
    if (playerClass) startGame();
  };

  const goBack = (toStep) => {
    if (toStep <= 3) {
      setSelectedFaction(null);
      selectClass(null);
    }
    if (toStep <= 2) {
      setSelectedRace(null);
      selectRace(null);
    }
    setStep(toStep);
  };

  const selectedRaceDef = selectedRace ? raceDefinitions[selectedRace] : null;
  const selectedCls = selectedFaction ? classDefinitions[selectedFaction] : null;

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'radial-gradient(circle at 50% 0%, rgba(110,231,183,0.05), transparent 50%), rgba(11,16,32,0.75)',
    }}>
      <header style={{
        background: 'linear-gradient(135deg, rgba(14,22,48,0.8), rgba(20,26,43,0.6))',
        borderBottom: '2px solid var(--border)', padding: '14px 20px', textAlign: 'center'
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

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>

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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
              {raceList.map(race => {
                const isSelected = selectedRace === race.id;
                return (
                  <div key={race.id} onClick={() => setSelectedRace(race.id)} style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${race.color}22, ${race.color}11)`
                      : 'linear-gradient(135deg, rgba(20,26,43,0.95), rgba(20,26,43,0.7))',
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

        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.4s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <h2 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.3rem', marginBottom: 4 }}>
                Choose Your Class
              </h2>
              {selectedRaceDef && (
                <span style={{
                  background: `${selectedRaceDef.color}20`, border: `1px solid ${selectedRaceDef.color}40`,
                  padding: '3px 12px', borderRadius: 20, fontSize: '0.75rem', color: selectedRaceDef.color
                }}>
                  <img src={selectedRaceDef.icon} alt={selectedRaceDef.name} style={{ width: 16, height: 16, borderRadius: '50%', objectFit: 'cover', verticalAlign: 'middle', marginRight: 4 }} />{selectedRaceDef.name}
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {Object.entries(classDefinitions).map(([id, cls]) => {
                const isSelected = selectedFaction === id;
                const previewAttrs = { ...cls.startingAttributes };
                if (selectedRaceDef) {
                  Object.entries(selectedRaceDef.bonuses).forEach(([attr, val]) => {
                    if (previewAttrs[attr] !== undefined) previewAttrs[attr] += val;
                  });
                }
                return (
                  <div key={id} onClick={() => setSelectedFaction(id)} style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${cls.color}20, ${cls.color}10)`
                      : 'linear-gradient(135deg, rgba(20,26,43,0.95), rgba(20,26,43,0.7))',
                    border: `2px solid ${isSelected ? cls.color : cls.color + '40'}`,
                    borderRadius: 14, padding: 18, cursor: 'pointer',
                    transition: 'all 0.25s', textAlign: 'center', position: 'relative',
                    boxShadow: isSelected ? `0 0 20px ${cls.color}30, inset 0 0 30px ${cls.color}10` : 'none',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    minHeight: 240,
                  }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = cls.color; e.currentTarget.style.transform = 'translateY(-3px)'; }}}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = `${cls.color}40`; e.currentTarget.style.transform = 'none'; }}}
                  >
                    {isSelected && <div style={{
                      position: 'absolute', top: 6, right: 10, color: cls.color, fontSize: '0.9rem', fontWeight: 700
                    }}>&#10003;</div>}
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 2, height: 120, overflow: 'hidden' }}>
                      {id === 'worge' ? (
                        <WorgeMorphPreview raceId={selectedRace} scale={3} speed={150} />
                      ) : (
                        <SpriteAnimation spriteData={getPlayerSprite(id, selectedRace)} animation="idle" scale={3} speed={150} />
                      )}
                    </div>
                    <div style={{
                      display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center', marginBottom: 6
                    }}>
                      {Object.entries(previewAttrs).filter(([, v]) => v > 0).map(([attr, val]) => (
                        <span key={attr} style={{
                          background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4,
                          fontSize: '0.6rem', color: 'var(--accent)'
                        }}>{attr.slice(0, 3)} {val}</span>
                      ))}
                    </div>
                    <h3 className="font-cinzel" style={{ color: cls.color, marginBottom: 4, fontSize: '1rem' }}>{cls.name}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 0 }}>{cls.description}</p>
                  </div>
                );
              })}
            </div>

            <div style={{
              marginTop: 16, background: 'rgba(14,22,48,0.8)',
              border: `1px solid ${selectedCls ? selectedCls.color + '40' : 'var(--border)'}`,
              borderRadius: 10, padding: 14, textAlign: 'center',
              minHeight: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {selectedCls ? (
                <p style={{ color: 'var(--text)', fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.8, margin: 0 }}>
                  "{selectedCls.lore}"
                </p>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: '0.8rem', fontStyle: 'italic', opacity: 0.5, margin: 0 }}>
                  Select a class to learn more
                </p>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: 20, display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button onClick={() => goBack(2)} style={{
                background: 'var(--border)', border: 'none', borderRadius: 10,
                padding: '12px 28px', color: 'var(--text)', fontWeight: 600,
                cursor: 'pointer', fontSize: '0.9rem'
              }}>Back</button>
              <button onClick={handleStep3} disabled={!selectedFaction} style={{
                background: selectedFaction ? 'linear-gradient(135deg, var(--accent), #10b981)' : 'var(--border)',
                border: 'none', borderRadius: 10, padding: '12px 40px',
                color: selectedFaction ? '#0b1020' : 'var(--muted)',
                fontWeight: 700, fontSize: '1rem', cursor: selectedFaction ? 'pointer' : 'not-allowed',
                fontFamily: "'Cinzel', serif", letterSpacing: 1, transition: 'all 0.3s'
              }}>Continue</button>
            </div>
          </div>
        )}

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
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <SpriteAnimation spriteData={getPlayerSprite(playerClass, playerRace)} animation="idle" scale={4.4} speed={150} />
              </div>
              <div style={{ flex: 1, minWidth: 180, textAlign: 'center' }}>
                <h2 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.2rem', marginBottom: 4 }}>
                  {playerName}
                </h2>
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
                      {def.icon} {name}
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
