import React, { useState } from 'react';
import useGameStore from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { skillTrees } from '../data/skillTrees';
import { attributeDefinitions } from '../data/attributes';
import SpriteAnimation from './SpriteAnimation';

export default function TrainingScreen() {
  const trainingPhase = useGameStore(s => s.trainingPhase);
  const heroRoster = useGameStore(s => s.heroRoster);
  const startTrainingBattle = useGameStore(s => s.startTrainingBattle);
  const playerName = useGameStore(s => s.playerName);
  const playerClass = useGameStore(s => s.playerClass);
  const level = useGameStore(s => s.level);
  const skillPoints = useGameStore(s => s.skillPoints);
  const unlockedSkills = useGameStore(s => s.unlockedSkills);
  const unlockSkill = useGameStore(s => s.unlockSkill);
  const unspentPoints = useGameStore(s => s.unspentPoints);
  const attributePoints = useGameStore(s => s.attributePoints);
  const allocatePoint = useGameStore(s => s.allocatePoint);
  const deallocatePoint = useGameStore(s => s.deallocatePoint);
  const continueFromSkillTutorial = useGameStore(s => s.continueFromSkillTutorial);

  const [tutorialStep, setTutorialStep] = useState(0);

  const mainHero = heroRoster.find(h => h.id === 'player');
  const cls = classDefinitions[playerClass];
  const tree = skillTrees[playerClass];

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

  const tipBoxStyle = {
    background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '12px 16px', margin: '15px 0',
    border: '1px solid rgba(255,215,0,0.2)', textAlign: 'left',
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
          <div style={tipBoxStyle}>
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

  if (trainingPhase === 'skill_tutorial') {
    const tutorialSteps = [
      { title: 'Attribute Points', icon: '📊' },
      { title: 'Skill Tree', icon: '🌳' },
      { title: 'Action Bar', icon: '⚔️' },
    ];

    return (
      <div style={{ width: '100%', height: '100%', overflow: 'auto',
        background: 'radial-gradient(circle at 30% 20%, rgba(110,231,183,0.04), transparent 50%), rgba(11,16,32,0.85)',
      }}>
        <header style={{
          background: 'linear-gradient(135deg, rgba(14,22,48,0.9), rgba(20,26,43,0.7))',
          borderBottom: '2px solid var(--gold)', padding: '12px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.5rem' }}>📖</span>
            <div>
              <h2 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '1.1rem', margin: 0 }}>Warlord Training</h2>
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Learn to grow stronger</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {tutorialSteps.map((s, i) => (
              <div key={i} onClick={() => setTutorialStep(i)} style={{
                background: tutorialStep === i ? 'rgba(255,215,0,0.2)' : 'rgba(42,49,80,0.4)',
                border: `1px solid ${tutorialStep === i ? 'var(--gold)' : 'var(--border)'}`,
                borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
              }}>
                <span style={{ fontSize: '1rem' }}>{s.icon}</span>
                <span style={{ color: tutorialStep === i ? 'var(--gold)' : 'var(--muted)', fontSize: '0.75rem', fontWeight: 600 }}>{s.title}</span>
              </div>
            ))}
          </div>
        </header>

        <div style={{ maxWidth: 700, margin: '0 auto', padding: 20 }}>
          {tutorialStep === 0 && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <div style={tipBoxStyle}>
                <div style={{ color: 'var(--gold)', fontSize: '0.9rem', marginBottom: 6, fontWeight: 'bold' }}>
                  Step 1: Attribute Points
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  After each battle you earn <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Attribute Points</span> from leveling up.
                  These make your hero permanently stronger. Spend them on the 8 core attributes below.
                  Each attribute boosts different combat stats like damage, health, or critical chance.
                </div>
              </div>

              <div style={{
                background: 'rgba(20,26,43,0.8)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 20, marginTop: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1rem', margin: 0 }}>
                    Allocate Attributes
                  </h3>
                  <div style={{
                    background: 'rgba(110,231,183,0.15)', border: '1px solid var(--accent)',
                    borderRadius: 8, padding: '4px 12px',
                  }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>Points: </span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem' }}>{unspentPoints}</span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(attributeDefinitions).map(([attrName, attr]) => {
                    const val = attributePoints[attrName] || 0;
                    return (
                      <div key={attrName} style={{
                        background: 'rgba(42,49,80,0.4)', border: '1px solid var(--border)',
                        borderRadius: 8, padding: '8px 12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <div>
                          <div style={{ color: 'var(--text)', fontSize: '0.8rem', fontWeight: 600 }}>
                            {attr.icon} {attrName}
                          </div>
                          <div style={{ color: 'var(--muted)', fontSize: '0.6rem' }}>{attr.description}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button onClick={() => deallocatePoint(attrName)} style={{
                            background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 4, width: 24, height: 24, color: '#ef4444',
                            cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>-</button>
                          <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '1rem', minWidth: 20, textAlign: 'center' }}>{val}</span>
                          <button onClick={() => allocatePoint(attrName)} disabled={unspentPoints <= 0} style={{
                            background: unspentPoints > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(100,100,100,0.2)',
                            border: `1px solid ${unspentPoints > 0 ? 'rgba(34,197,94,0.3)' : 'rgba(100,100,100,0.2)'}`,
                            borderRadius: 4, width: 24, height: 24,
                            color: unspentPoints > 0 ? '#22c55e' : 'var(--muted)',
                            cursor: unspentPoints > 0 ? 'pointer' : 'not-allowed',
                            fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {unspentPoints > 0 && (
                  <div style={{
                    marginTop: 12, padding: '8px 12px', background: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.3)', borderRadius: 8,
                    color: 'var(--gold)', fontSize: '0.8rem', textAlign: 'center',
                    animation: 'glow 2s infinite',
                  }}>
                    You have {unspentPoints} unspent point{unspentPoints > 1 ? 's' : ''}! Click + to allocate them.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <button onClick={() => setTutorialStep(1)} style={{
                  ...btnStyle, marginTop: 0, padding: '10px 30px', fontSize: '0.95rem',
                }}>
                  Next: Skill Tree →
                </button>
              </div>
            </div>
          )}

          {tutorialStep === 1 && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <div style={tipBoxStyle}>
                <div style={{ color: 'var(--gold)', fontSize: '0.9rem', marginBottom: 6, fontWeight: 'bold' }}>
                  Step 2: Skill Tree
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>Skill Points</span> unlock passive bonuses in your class skill tree.
                  These give permanent stat boosts like extra damage, defense, or special effects.
                  Click a skill below to invest your points. Higher tiers unlock as you level up.
                </div>
              </div>

              <div style={{
                background: 'rgba(20,26,43,0.8)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 20, marginTop: 16,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 className="font-cinzel" style={{ color: tree?.color || 'var(--accent)', fontSize: '1rem', margin: 0 }}>
                    {tree?.className} Skill Tree
                  </h3>
                  <div style={{
                    background: 'rgba(110,231,183,0.15)', border: '1px solid var(--accent)',
                    borderRadius: 8, padding: '4px 12px',
                  }}>
                    <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>Skill Points: </span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.1rem' }}>{skillPoints}</span>
                  </div>
                </div>

                {tree && tree.tiers.filter(tier => tier.requiredLevel <= level).map((tier, tierIdx) => (
                  <div key={tierIdx} style={{ marginBottom: 16 }}>
                    <div style={{
                      color: 'var(--gold)', fontSize: '0.75rem', fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
                    }}>
                      {tier.name}
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {tier.skills.map(skill => {
                        const current = unlockedSkills[skill.id] || 0;
                        const maxed = current >= skill.maxPoints;
                        const available = skillPoints > 0 && !maxed && level >= tier.requiredLevel
                          && (!skill.requires || (unlockedSkills[skill.requires] || 0) > 0);

                        return (
                          <div key={skill.id} onClick={() => available && unlockSkill(skill.id)} style={{
                            background: maxed
                              ? `linear-gradient(135deg, ${tree.color}30, ${tree.color}10)`
                              : available ? 'rgba(42,49,80,0.8)' : 'rgba(20,26,43,0.5)',
                            border: `2px solid ${maxed ? tree.color : available ? 'var(--accent)' : 'var(--border)'}`,
                            borderRadius: 10, padding: 12, flex: '1 1 180px', maxWidth: 220,
                            cursor: available ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            animation: available ? 'glow 2s infinite' : 'none',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: '1.3rem' }}>{skill.icon}</span>
                              <div>
                                <div style={{ color: current > 0 ? 'var(--gold)' : 'var(--text)', fontSize: '0.8rem', fontWeight: 600 }}>
                                  {skill.name}
                                </div>
                                <div style={{ color: 'var(--muted)', fontSize: '0.6rem' }}>{skill.description}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                              <span style={{ color: 'var(--accent)', fontSize: '0.7rem' }}>{skill.effect}</span>
                              <span style={{
                                background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '2px 8px',
                                fontSize: '0.7rem', color: maxed ? tree.color : 'var(--gold)', fontWeight: 700,
                              }}>
                                {current}/{skill.maxPoints}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {skillPoints > 0 && (
                  <div style={{
                    marginTop: 12, padding: '8px 12px', background: 'rgba(255,215,0,0.1)',
                    border: '1px solid rgba(255,215,0,0.3)', borderRadius: 8,
                    color: 'var(--gold)', fontSize: '0.8rem', textAlign: 'center',
                    animation: 'glow 2s infinite',
                  }}>
                    You have {skillPoints} skill point{skillPoints > 1 ? 's' : ''}! Click a glowing skill to unlock it.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button onClick={() => setTutorialStep(0)} style={{
                  background: 'var(--border)', border: 'none', borderRadius: 10,
                  padding: '10px 24px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.9rem',
                }}>
                  ← Attributes
                </button>
                <button onClick={() => setTutorialStep(2)} style={{
                  ...btnStyle, marginTop: 0, padding: '10px 30px', fontSize: '0.95rem',
                }}>
                  Next: Action Bar →
                </button>
              </div>
            </div>
          )}

          {tutorialStep === 2 && (
            <div style={{ animation: 'fadeIn 0.4s ease' }}>
              <div style={tipBoxStyle}>
                <div style={{ color: 'var(--gold)', fontSize: '0.9rem', marginBottom: 6, fontWeight: 'bold' }}>
                  Step 3: Your Action Bar
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                  In battle, your <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>abilities</span> appear on the action bar at the bottom of the screen.
                  Each ability has a <span style={{ color: '#3b82f6' }}>mana</span> or <span style={{ color: '#eab308' }}>stamina</span> cost and a cooldown.
                  Press <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>1-5</span> on your keyboard or click to use them. Choose wisely!
                </div>
              </div>

              <div style={{
                background: 'rgba(20,26,43,0.8)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 20, marginTop: 16,
              }}>
                <h3 className="font-cinzel" style={{ color: cls?.color || 'var(--accent)', fontSize: '1rem', marginBottom: 16 }}>
                  {cls?.name} Abilities
                </h3>

                <div style={{
                  display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap',
                  padding: '16px 10px',
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.6))',
                  borderRadius: 12, border: '1px solid rgba(255,215,0,0.15)',
                }}>
                  {cls?.abilities.map((ability, idx) => (
                    <div key={ability.id} style={{
                      background: 'linear-gradient(180deg, rgba(42,49,80,0.9), rgba(20,26,43,0.9))',
                      border: '2px solid rgba(255,215,0,0.3)',
                      borderRadius: 10, padding: '10px 12px', width: 110, textAlign: 'center',
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', top: -8, left: -8,
                        background: 'var(--gold)', color: '#000', borderRadius: '50%',
                        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.7rem', fontWeight: 'bold',
                      }}>
                        {idx + 1}
                      </div>
                      <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{ability.icon}</div>
                      <div style={{ color: 'var(--text)', fontSize: '0.7rem', fontWeight: 600, marginBottom: 2 }}>
                        {ability.name}
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.6rem', marginBottom: 4 }}>
                        {ability.description}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, fontSize: '0.6rem' }}>
                        {ability.manaCost > 0 && (
                          <span style={{ color: '#3b82f6' }}>{ability.manaCost} MP</span>
                        )}
                        {ability.staminaCost > 0 && (
                          <span style={{ color: '#eab308' }}>{ability.staminaCost} SP</span>
                        )}
                        {ability.cooldown > 0 && (
                          <span style={{ color: '#ef4444' }}>{ability.cooldown}T CD</span>
                        )}
                      </div>
                      {ability.effect && (
                        <div style={{
                          marginTop: 4, fontSize: '0.55rem', color: '#f59e0b',
                          background: 'rgba(245,158,11,0.1)', borderRadius: 4, padding: '2px 4px',
                        }}>
                          {ability.effect.type === 'dot' ? 'DoT' :
                           ability.effect.type === 'stun' ? 'Stun' :
                           ability.effect.stat === 'damage' && ability.effect.multiplier > 1 ? 'Buff' :
                           ability.effect.stat === 'damage' && ability.effect.multiplier < 1 ? 'Debuff' :
                           ability.effect.stat === 'evasion' ? 'Evasion' :
                           ability.effect.stat === 'defense' ? 'Defense' :
                           'Effect'}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{
                  marginTop: 16, padding: '10px 14px', background: 'rgba(0,0,0,0.3)',
                  borderRadius: 8, border: '1px solid var(--border)',
                }}>
                  <div style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: 6 }}>
                    Quick Reference:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    <div><span style={{ color: '#3b82f6' }}>MP</span> = Mana cost (magic abilities)</div>
                    <div><span style={{ color: '#eab308' }}>SP</span> = Stamina cost (physical abilities)</div>
                    <div><span style={{ color: '#ef4444' }}>CD</span> = Cooldown in turns</div>
                    <div><span style={{ color: '#f59e0b' }}>DoT</span> = Damage over time effect</div>
                    <div><span style={{ color: '#22c55e' }}>Buff</span> = Boosts your stats</div>
                    <div><span style={{ color: '#a855f7' }}>Debuff</span> = Weakens the enemy</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button onClick={() => setTutorialStep(1)} style={{
                  background: 'var(--border)', border: 'none', borderRadius: 10,
                  padding: '10px 24px', color: 'var(--text)', cursor: 'pointer', fontSize: '0.9rem',
                }}>
                  ← Skill Tree
                </button>
                <button onClick={continueFromSkillTutorial} style={{
                  ...btnStyle, marginTop: 0, padding: '10px 30px', fontSize: '0.95rem',
                }}>
                  Continue →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (trainingPhase === 'pre_training_2') {
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
          <div style={tipBoxStyle}>
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
