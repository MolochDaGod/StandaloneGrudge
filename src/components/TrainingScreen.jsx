import React from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';

export default function TrainingScreen() {
  const trainingPhase = useGameStore(s => s.trainingPhase);
  const heroRoster = useGameStore(s => s.heroRoster);
  const startTrainingBattle = useGameStore(s => s.startTrainingBattle);
  const playerName = useGameStore(s => s.playerName);

  const mainHero = heroRoster.find(h => h.id === 'player');

  const panelStyle = {
    background: 'linear-gradient(135deg, rgba(20,26,43,0.95), rgba(30,41,59,0.95))',
    border: '2px solid var(--gold)',
    borderRadius: 16,
    padding: '40px 50px',
    textAlign: 'center',
    maxWidth: 550,
    width: '90%',
    animation: 'slideUp 0.5s ease',
  };

  const btnStyle = {
    background: 'linear-gradient(135deg, #b8860b, #daa520)',
    color: '#000',
    border: 'none',
    borderRadius: 10,
    padding: '14px 40px',
    fontSize: '1.1rem',
    fontFamily: "'Cinzel', serif",
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: 20,
    transition: 'transform 0.2s',
  };

  if (trainingPhase === 'pre_training_1') {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={panelStyle}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>&#9876;</div>
          <h2 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.6rem', marginBottom: 15 }}>
            Training Grounds
          </h2>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 10 }}>
            Welcome, <span style={{ color: 'var(--gold)' }}>{playerName}</span>. Before you venture into the world, you must prove your worth in combat.
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 5 }}>
            <strong style={{ color: '#ef4444' }}>Training Round 1:</strong> A solo battle against a weakened enemy. Learn to use your abilities.
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '12px 16px', margin: '15px 0',
            border: '1px solid rgba(255,215,0,0.2)', textAlign: 'left',
          }}>
            <div style={{ color: 'var(--gold)', fontSize: '0.85rem', marginBottom: 6, fontWeight: 'bold' }}>Combat Tips:</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: 1.5 }}>
              Press <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>1-5</span> to use abilities during your turn.<br />
              Click an enemy to select your target.<br />
              Watch your HP, Mana, and Stamina bars.
            </div>
          </div>
          {mainHero && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '15px 0' }}>
              <SpriteAnimation
                classId={mainHero.classId}
                raceId={mainHero.raceId}
                animation="idle"
                scale={2}
              />
            </div>
          )}
          <button
            style={btnStyle}
            onClick={() => startTrainingBattle(1)}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            Begin Training
          </button>
        </div>
      </div>
    );
  }

  if (trainingPhase === 'pre_training_2') {
    const heroes = heroRoster.filter(h => h.id !== 'player');
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={panelStyle}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>&#9876;&#9876;</div>
          <h2 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.6rem', marginBottom: 15 }}>
            Training Round 2
          </h2>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 10 }}>
            Now fight alongside your ally! Coordinate your heroes to defeat multiple enemies.
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '12px 16px', margin: '15px 0',
            border: '1px solid rgba(255,215,0,0.2)', textAlign: 'left',
          }}>
            <div style={{ color: 'var(--gold)', fontSize: '0.85rem', marginBottom: 6, fontWeight: 'bold' }}>Team Tips:</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: 1.5 }}>
              Each hero takes turns based on speed.<br />
              Use healers to keep your team alive.<br />
              Focus fire on one enemy at a time.
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 15, margin: '15px 0' }}>
            {heroRoster.map(h => (
              <div key={h.id} style={{ textAlign: 'center' }}>
                <SpriteAnimation classId={h.classId} raceId={h.raceId} animation="idle" scale={1.5} />
                <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: 4 }}>{h.name}</div>
              </div>
            ))}
          </div>
          <button
            style={btnStyle}
            onClick={() => startTrainingBattle(2)}
            onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          >
            Begin Team Training
          </button>
        </div>
      </div>
    );
  }

  return null;
}
