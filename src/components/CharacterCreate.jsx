import React, { useState } from 'react';
import useGameStore from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { attributeDefinitions } from '../data/attributes';

export default function CharacterCreate() {
  const { setScreen, setPlayerName, selectClass, playerClass, playerName, attributePoints, unspentPoints, allocatePoint, deallocatePoint, startGame } = useGameStore();
  const [step, setStep] = useState(1);
  const [nameInput, setNameInput] = useState('');

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      setPlayerName(nameInput.trim());
      setStep(2);
    }
  };

  const handleClassSelect = (classId) => {
    selectClass(classId);
    setStep(3);
  };

  const handleStart = () => {
    if (playerClass) startGame();
  };

  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      background: 'radial-gradient(circle at 50% 0%, rgba(110,231,183,0.05), transparent 50%), var(--bg)',
    }}>
      <header style={{
        background: 'linear-gradient(135deg, rgba(14,22,48,0.8), rgba(20,26,43,0.6))',
        borderBottom: '2px solid var(--border)', padding: 20, textAlign: 'center'
      }}>
        <h1 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.8rem' }}>Create Your Warlord</h1>
        <div style={{ color: 'var(--muted)', fontSize: '0.9rem', marginTop: 4 }}>Step {step} of 3</div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20 }}>
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.5s ease', textAlign: 'center', paddingTop: 60 }}>
            <h2 className="font-cinzel" style={{ color: 'var(--gold)', marginBottom: 30, fontSize: '1.5rem' }}>What is your name, Warlord?</h2>
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
              placeholder="Enter your name..."
              maxLength={20}
              autoFocus
              style={{
                background: 'rgba(14,22,48,0.8)', border: '2px solid var(--border)',
                borderRadius: 10, padding: '14px 24px', fontSize: '1.2rem',
                color: 'var(--text)', textAlign: 'center', width: 320,
                outline: 'none', fontFamily: "'Jost', sans-serif"
              }}
            />
            <div style={{ marginTop: 20 }}>
              <button onClick={handleNameSubmit} disabled={!nameInput.trim()} style={{
                background: nameInput.trim() ? 'linear-gradient(135deg, var(--accent), #10b981)' : 'var(--border)',
                border: 'none', borderRadius: 10, padding: '12px 40px',
                color: nameInput.trim() ? '#0b1020' : 'var(--muted)',
                fontWeight: 700, fontSize: '1rem', cursor: nameInput.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s'
              }}>
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <h2 className="font-cinzel" style={{ color: 'var(--gold)', textAlign: 'center', marginBottom: 30, fontSize: '1.3rem' }}>
              Choose Your Class, {playerName}
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {Object.entries(classDefinitions).map(([id, cls]) => (
                <div key={id} onClick={() => handleClassSelect(id)} style={{
                  background: 'linear-gradient(135deg, rgba(20,26,43,0.95), rgba(20,26,43,0.7))',
                  border: `2px solid ${cls.color}40`, borderRadius: 14, padding: 24,
                  cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = cls.color; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 8px 30px ${cls.color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = `${cls.color}40`; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: 10 }}>{cls.icon}</div>
                  <h3 className="font-cinzel" style={{ color: cls.color, marginBottom: 8 }}>{cls.name}</h3>
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 12 }}>{cls.description}</p>
                  <p style={{ color: 'var(--text)', fontSize: '0.75rem', fontStyle: 'italic', opacity: 0.7 }}>{cls.lore}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && playerClass && (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.3rem' }}>
                Allocate Attributes
              </h2>
              <div style={{
                background: unspentPoints === 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                border: `2px solid ${unspentPoints === 0 ? 'var(--success)' : 'var(--danger)'}`,
                borderRadius: 10, padding: '10px 20px', textAlign: 'center'
              }}>
                <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Unspent Points</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: unspentPoints === 0 ? 'var(--success)' : 'var(--danger)' }}>
                  {unspentPoints}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
              {Object.entries(attributeDefinitions).map(([name, def]) => (
                <div key={name} style={{
                  background: 'rgba(20,26,43,0.8)', border: '1px solid var(--border)',
                  borderRadius: 10, padding: 14, borderLeft: `4px solid ${def.color}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                      {def.icon} {name}
                    </span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'monospace', fontSize: '1.1rem' }}>
                      {attributePoints[name]}
                    </span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '0.75rem', marginBottom: 8 }}>{def.description}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button onClick={() => deallocatePoint(name)} style={{
                      width: 32, height: 32, borderRadius: '50%',
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
                      width: 32, height: 32, borderRadius: '50%',
                      background: unspentPoints > 0 ? 'var(--success)' : 'var(--border)',
                      border: 'none', color: 'white', fontWeight: 700, fontSize: '1rem',
                      cursor: unspentPoints > 0 ? 'pointer' : 'not-allowed'
                    }}>+</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 30 }}>
              <button onClick={() => setStep(2)} style={{
                background: 'var(--border)', border: 'none', borderRadius: 10,
                padding: '12px 30px', color: 'var(--text)', fontWeight: 600,
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
