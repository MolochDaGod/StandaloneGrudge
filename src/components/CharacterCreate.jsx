import React, { useState } from 'react';
import useGameStore from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { attributeDefinitions } from '../data/attributes';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';

export default function CharacterCreate() {
  const { setScreen, setPlayerName, selectClass, playerClass, playerName, attributePoints, unspentPoints, allocatePoint, deallocatePoint, startGame } = useGameStore();
  const [step, setStep] = useState(1);
  const [nameInput, setNameInput] = useState('');
  const [selectedFaction, setSelectedFaction] = useState(null);

  const handleStep1Submit = () => {
    if (nameInput.trim() && selectedFaction) {
      setPlayerName(nameInput.trim());
      selectClass(selectedFaction);
      setStep(2);
    }
  };

  const handleStart = () => {
    if (playerClass) startGame();
  };

  const selectedCls = selectedFaction ? classDefinitions[selectedFaction] : null;

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'radial-gradient(circle at 50% 0%, rgba(110,231,183,0.05), transparent 50%), var(--bg)',
    }}>
      <header style={{
        background: 'linear-gradient(135deg, rgba(14,22,48,0.8), rgba(20,26,43,0.6))',
        borderBottom: '2px solid var(--border)', padding: '16px 20px', textAlign: 'center'
      }}>
        <h1 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.6rem' }}>Create Your Warlord</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 12 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              display: 'flex', alignItems: 'center', gap: 8
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: step >= s ? 'var(--accent)' : 'var(--border)',
                color: step >= s ? '#0b1020' : 'var(--muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.85rem',
                transition: 'all 0.3s'
              }}>{s}</div>
              <span style={{
                color: step >= s ? 'var(--text)' : 'var(--muted)',
                fontSize: '0.85rem', fontWeight: step === s ? 600 : 400
              }}>
                {s === 1 ? 'Name & Faction' : 'Attributes'}
              </span>
            </div>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.3rem', marginBottom: 12 }}>
                Name Your Warlord
              </h2>
              <input
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="Enter your name..."
                maxLength={20}
                autoFocus
                style={{
                  background: 'rgba(14,22,48,0.8)', border: '2px solid var(--border)',
                  borderRadius: 10, padding: '12px 24px', fontSize: '1.1rem',
                  color: 'var(--text)', textAlign: 'center', width: 320,
                  outline: 'none', fontFamily: "'Jost', sans-serif"
                }}
                onFocus={e => e.target.style.borderColor = 'var(--accent)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>

            <h2 className="font-cinzel" style={{ color: 'var(--gold)', textAlign: 'center', marginBottom: 20, fontSize: '1.3rem' }}>
              Choose Your Faction
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {Object.entries(classDefinitions).map(([id, cls]) => {
                const isSelected = selectedFaction === id;
                return (
                  <div key={id} onClick={() => setSelectedFaction(id)} style={{
                    background: isSelected
                      ? `linear-gradient(135deg, ${cls.color}20, ${cls.color}10)`
                      : 'linear-gradient(135deg, rgba(20,26,43,0.95), rgba(20,26,43,0.7))',
                    border: `2px solid ${isSelected ? cls.color : cls.color + '40'}`,
                    borderRadius: 14, padding: 20,
                    cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center',
                    boxShadow: isSelected ? `0 0 20px ${cls.color}30, inset 0 0 30px ${cls.color}10` : 'none',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                  }}
                  onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.borderColor = cls.color; e.currentTarget.style.transform = 'translateY(-3px)'; }}}
                  onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.borderColor = `${cls.color}40`; e.currentTarget.style.transform = 'none'; }}}
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: 8, right: 12,
                        color: cls.color, fontSize: '1.2rem', fontWeight: 700
                      }}>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, position: 'relative' }}>
                      <SpriteAnimation spriteData={getPlayerSprite(id)} animation="idle" scale={2} speed={150} />
                    </div>
                    <h3 className="font-cinzel" style={{ color: cls.color, marginBottom: 6 }}>{cls.name}</h3>
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: 8 }}>{cls.description}</p>
                    <p style={{ color: 'var(--text)', fontSize: '0.7rem', fontStyle: 'italic', opacity: 0.6 }}>{cls.lore}</p>
                  </div>
                );
              })}
            </div>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button
                onClick={handleStep1Submit}
                disabled={!nameInput.trim() || !selectedFaction}
                style={{
                  background: (nameInput.trim() && selectedFaction)
                    ? `linear-gradient(135deg, var(--accent), #10b981)`
                    : 'var(--border)',
                  border: 'none', borderRadius: 10, padding: '14px 50px',
                  color: (nameInput.trim() && selectedFaction) ? '#0b1020' : 'var(--muted)',
                  fontWeight: 700, fontSize: '1.05rem',
                  cursor: (nameInput.trim() && selectedFaction) ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s', fontFamily: "'Cinzel', serif", letterSpacing: 1
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && playerClass && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
              flexWrap: 'wrap', gap: 12
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 10,
                  background: `${classDefinitions[playerClass].color}20`,
                  border: `2px solid ${classDefinitions[playerClass].color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                }}>
                  <SpriteAnimation spriteData={getPlayerSprite(playerClass)} animation="idle" scale={0.9} speed={150} />
                </div>
                <div>
                  <h2 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.2rem' }}>
                    Allocate Attributes
                  </h2>
                  <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
                    {playerName} the {classDefinitions[playerClass].name}
                  </div>
                </div>
              </div>
              <div style={{
                background: unspentPoints === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                border: `2px solid ${unspentPoints === 0 ? 'var(--success)' : 'var(--danger)'}`,
                borderRadius: 10, padding: '8px 18px', textAlign: 'center'
              }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Unspent</div>
                <div style={{
                  fontSize: '1.4rem', fontWeight: 700,
                  color: unspentPoints === 0 ? 'var(--success)' : 'var(--danger)'
                }}>
                  {unspentPoints}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
              {Object.entries(attributeDefinitions).map(([name, def]) => (
                <div key={name} style={{
                  background: 'rgba(20,26,43,0.8)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 12, borderLeft: `4px solid ${def.color}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {def.icon} {name}
                    </span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace', fontSize: '1.05rem' }}>
                      {attributePoints[name]}
                    </span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.7rem', marginBottom: 6 }}>{def.description}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => deallocatePoint(name)} style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: attributePoints[name] > 0 ? 'var(--danger)' : 'var(--border)',
                      border: 'none', color: 'white', fontWeight: 700, fontSize: '1rem',
                      cursor: attributePoints[name] > 0 ? 'pointer' : 'not-allowed'
                    }}>-</button>
                    <div style={{
                      flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${(attributePoints[name] / 40) * 100}%`, height: '100%',
                        background: `linear-gradient(90deg, ${def.color}, ${def.color}80)`,
                        borderRadius: 4, transition: 'width 0.2s'
                      }} />
                    </div>
                    <button onClick={() => allocatePoint(name)} style={{
                      width: 30, height: 30, borderRadius: '50%',
                      background: unspentPoints > 0 ? 'var(--success)' : 'var(--border)',
                      border: 'none', color: 'white', fontWeight: 700, fontSize: '1rem',
                      cursor: unspentPoints > 0 ? 'pointer' : 'not-allowed'
                    }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button onClick={() => { setStep(1); }} style={{
                background: 'var(--border)', border: 'none', borderRadius: 10,
                padding: '12px 28px', color: 'var(--text)', fontWeight: 600,
                cursor: 'pointer', marginRight: 12, fontSize: '0.95rem'
              }}>
                Back
              </button>
              <button onClick={handleStart} style={{
                background: 'linear-gradient(135deg, var(--accent), #10b981)',
                border: 'none', borderRadius: 10, padding: '14px 50px',
                color: '#0b1020', fontWeight: 700, fontSize: '1.1rem',
                cursor: 'pointer', fontFamily: "'Cinzel', serif", letterSpacing: 1
              }}>
                Begin Adventure
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
