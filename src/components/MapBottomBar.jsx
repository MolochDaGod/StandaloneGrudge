import React, { useState, useRef, useEffect } from 'react';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { InlineIcon } from '../data/uiSprites.jsx';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import RadarChart from './RadarChart';
import { setMusicMuted, setSfxMuted } from '../utils/audioManager';

const BAR_HEIGHT = '26.2%';
const POPUP_BOTTOM_OFFSET = 'calc(26.2% + 8px)';

function HarvestingPopup({ onClose }) {
  const {
    harvestNodes, activeHarvests, harvestResources,
    assignHarvest, recallHarvest, heroRoster, activeHeroIds, level
  } = useGameStore();

  const harvestingHeroIds = Object.values(activeHarvests);
  const idleHeroes = heroRoster.filter(h =>
    !activeHeroIds.includes(h.id) && !harvestingHeroIds.includes(h.id)
  );
  const unlockedNodes = (harvestNodes || []).filter(n => level >= n.unlockLevel);

  return (
    <div style={{
      position: 'absolute', bottom: POPUP_BOTTOM_OFFSET, right: 10, zIndex: 10100,
      background: 'rgba(14,22,48,0.97)', border: '1px solid rgba(251,191,36,0.3)',
      borderRadius: 12, padding: 16, width: 360, maxHeight: 400, overflowY: 'auto',
      boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
      animation: 'fadeIn 0.15s ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.9rem', margin: 0 }}>
          <InlineIcon name="pickaxe" size={14} /> Harvest Sites
        </h4>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 4, fontSize: '0.55rem', flexWrap: 'wrap', marginBottom: 12 }}>
        {Object.entries(harvestResources).filter(([, v]) => v > 0).map(([k, v]) => (
          <span key={k} style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(251,191,36,0.15)', color: 'var(--gold)' }}>
            {k === 'gold' ? <InlineIcon name="gold" size={12} /> : k === 'herbs' ? <InlineIcon name="nature" size={12} /> : k === 'wood' ? <InlineIcon name="wood" size={12} /> : k === 'ore' ? <InlineIcon name="ore" size={12} /> : <InlineIcon name="diamond" size={12} />} {Math.floor(v)}
          </span>
        ))}
      </div>

      {unlockedNodes.length > 0 ? (
        <div style={{ display: 'grid', gap: 6 }}>
          {unlockedNodes.map(node => {
            const assignedHeroId = activeHarvests[node.id];
            const assignedHero = assignedHeroId ? heroRoster.find(h => h.id === assignedHeroId) : null;
            return (
              <div key={node.id} style={{
                background: assignedHero ? 'rgba(251,191,36,0.06)' : 'rgba(42,49,80,0.2)',
                border: `1px solid ${assignedHero ? 'rgba(251,191,36,0.25)' : 'var(--border)'}`,
                borderRadius: 6, padding: '8px 10px',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: '1rem' }}>{node.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ color: 'var(--text)', fontSize: '0.7rem', fontWeight: 600 }}>{node.name}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.5rem' }}>+{node.baseRate} {node.resource}/s</div>
                  </div>
                  {assignedHero ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{ color: 'var(--gold)', fontSize: '0.6rem', fontWeight: 600 }}>
                        {assignedHero.name} (Lv.{assignedHero.level})
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); recallHarvest(node.id); }} style={{
                        background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: 4, padding: '2px 6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.55rem',
                      }}>Recall</button>
                    </div>
                  ) : (
                    <div style={{ marginTop: 4 }}>
                      {idleHeroes.length > 0 ? (
                        <select
                          onChange={(e) => { if (e.target.value) assignHarvest(node.id, e.target.value); e.target.value = ''; }}
                          defaultValue=""
                          style={{
                            background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
                            borderRadius: 4, padding: '3px 6px', color: 'var(--text)',
                            fontSize: '0.6rem', width: '100%', cursor: 'pointer',
                          }}
                        >
                          <option value="">Assign idle hero...</option>
                          {idleHeroes.map(h => (
                            <option key={h.id} value={h.id}>{h.name} (Lv.{h.level})</option>
                          ))}
                        </select>
                      ) : (
                        <div style={{ color: 'var(--muted)', fontSize: '0.55rem', fontStyle: 'italic' }}>No idle heroes</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ color: 'var(--muted)', fontSize: '0.65rem', textAlign: 'center', padding: 12 }}>No harvest nodes unlocked yet</div>
      )}
    </div>
  );
}

function GearPopup({ onClose }) {
  const { heroRoster, activeHeroIds, inventory } = useGameStore();
  const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
  const [selectedHero, setSelectedHero] = useState(activeHeroes[0]?.id || null);
  const hero = heroRoster.find(h => h.id === selectedHero);

  const slotNames = ['weapon', 'helmet', 'armor', 'boots', 'ring', 'shield', 'accessory'];

  return (
    <div style={{
      position: 'absolute', bottom: POPUP_BOTTOM_OFFSET, right: 10, zIndex: 10100,
      background: 'rgba(14,22,48,0.97)', border: '1px solid rgba(110,231,183,0.3)',
      borderRadius: 12, padding: 16, width: 380, maxHeight: 450, overflowY: 'auto',
      boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
      animation: 'fadeIn 0.15s ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.9rem', margin: 0 }}>
          <InlineIcon name="shield" size={14} /> Gear Overview
        </h4>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {heroRoster.map(h => (
          <button key={h.id} onClick={() => setSelectedHero(h.id)} style={{
            background: selectedHero === h.id ? 'rgba(110,231,183,0.2)' : 'rgba(42,49,80,0.3)',
            border: `1px solid ${selectedHero === h.id ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
            color: selectedHero === h.id ? 'var(--accent)' : 'var(--muted)',
            fontSize: '0.6rem', fontWeight: 600,
          }}>{h.name}</button>
        ))}
      </div>

      {hero && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 56, height: 56, overflow: 'hidden', borderRadius: 8, border: '2px solid var(--accent)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={0.7} speed={150} />
            </div>
            <div>
              <div className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 700 }}>{hero.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.55rem' }}>
                Lv.{hero.level} {raceDefinitions[hero.raceId]?.name} {classDefinitions[hero.classId]?.name}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {slotNames.map(slot => {
              const eq = hero.equipment?.[slot];
              return (
                <div key={slot} style={{
                  background: eq ? 'rgba(110,231,183,0.06)' : 'rgba(42,49,80,0.15)',
                  border: `1px solid ${eq ? 'rgba(110,231,183,0.2)' : 'var(--border)'}`,
                  borderRadius: 6, padding: '6px 8px',
                }}>
                  <div style={{ fontSize: '0.5rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{slot}</div>
                  {eq ? (
                    <div style={{ fontSize: '0.6rem', color: 'var(--text)', fontWeight: 600 }}>{eq.name || `T${eq.tier} ${slot}`}</div>
                  ) : (
                    <div style={{ fontSize: '0.55rem', color: 'rgba(148,163,184,0.4)', fontStyle: 'italic' }}>Empty</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function CharacterPopup({ onClose }) {
  const { heroRoster, activeHeroIds } = useGameStore();
  const [selectedHero, setSelectedHero] = useState(() => {
    const active = heroRoster.filter(h => activeHeroIds.includes(h.id));
    return active[0]?.id || heroRoster[0]?.id || null;
  });
  const hero = heroRoster.find(h => h.id === selectedHero);
  const stats = hero ? getHeroStatsWithBonuses(hero) : null;
  const cls = hero ? classDefinitions[hero.classId] : null;
  const race = hero ? raceDefinitions[hero.raceId] : null;

  const statLabels = ['STR', 'AGI', 'INT', 'VIT', 'LCK', 'DEF', 'SPD', 'CHA'];
  const statKeys = ['strength', 'agility', 'intellect', 'vitality', 'luck', 'defense', 'speed', 'charisma'];
  const maxStat = 100;

  const radarValues = stats ? statKeys.map(k => Math.min(100, ((stats[k] || 0) / maxStat) * 100)) : [];

  const totalPower = stats ? statKeys.reduce((sum, k) => sum + (stats[k] || 0), 0) + (hero.level || 1) * 10 : 0;

  return (
    <div style={{
      position: 'absolute', bottom: POPUP_BOTTOM_OFFSET, right: 10, zIndex: 10100,
      background: 'rgba(14,22,48,0.97)', border: '1px solid rgba(168,85,247,0.3)',
      borderRadius: 12, padding: 16, width: 400, maxHeight: 500, overflowY: 'auto',
      boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
      animation: 'fadeIn 0.15s ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 className="font-cinzel" style={{ color: '#c084fc', fontSize: '0.9rem', margin: 0 }}>
          <InlineIcon name="chart" size={14} /> Character Power
        </h4>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
        {heroRoster.map(h => (
          <button key={h.id} onClick={() => setSelectedHero(h.id)} style={{
            background: selectedHero === h.id ? 'rgba(168,85,247,0.2)' : 'rgba(42,49,80,0.3)',
            border: `1px solid ${selectedHero === h.id ? '#a855f7' : 'var(--border)'}`,
            borderRadius: 6, padding: '3px 8px', cursor: 'pointer',
            color: selectedHero === h.id ? '#c084fc' : 'var(--muted)',
            fontSize: '0.6rem', fontWeight: 600,
          }}>{h.name}</button>
        ))}
      </div>

      {hero && stats && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ width: 64, height: 64, overflow: 'hidden', borderRadius: 10, border: '2px solid #a855f7', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
              <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={0.8} speed={150} />
            </div>
            <div>
              <div className="font-cinzel" style={{ color: '#c084fc', fontSize: '0.85rem', fontWeight: 700 }}>{hero.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.55rem' }}>
                Lv.{hero.level} {race?.name} {cls?.name}
              </div>
              <div style={{
                marginTop: 4, background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(251,191,36,0.1))',
                border: '1px solid rgba(168,85,247,0.3)', borderRadius: 6, padding: '3px 8px',
                display: 'inline-block',
              }}>
                <span style={{ color: '#c084fc', fontSize: '0.7rem', fontWeight: 700 }}>Power: {totalPower}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 auto' }}>
              <RadarChart labels={statLabels} values={radarValues} size={160} color="#a855f7" />
            </div>
            <div style={{ flex: 1, display: 'grid', gap: 4 }}>
              {statKeys.map((k, i) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 28, fontSize: '0.55rem', color: '#c084fc', fontWeight: 700, textAlign: 'right' }}>{statLabels[i]}</span>
                  <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${Math.min(100, (stats[k] / maxStat) * 100)}%`,
                      background: 'linear-gradient(90deg, #7c3aed, #c084fc)',
                      borderRadius: 3, transition: 'width 0.3s',
                    }} />
                  </div>
                  <span style={{ width: 24, fontSize: '0.55rem', color: 'var(--text)', fontWeight: 600, textAlign: 'right' }}>{stats[k]}</span>
                </div>
              ))}
              <div style={{ marginTop: 6, padding: '4px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                <div style={{ fontSize: '0.5rem', color: 'var(--muted)' }}>HP: {hero.currentHealth}/{stats.health} | MP: {hero.currentMana}/{stats.mana}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MapBottomBar({
  chatLog,
  chatInput,
  setChatInput,
  setChatLog,
  chatLogRef,
  enterScene,
  setScreen,
  onToggleWarParty,
  onToggleGruda,
  showWarParty,
  showGruda,
}) {
  const {
    heroRoster, activeHeroIds, activeHarvests, level,
    unspentPoints, skillPoints,
  } = useGameStore();

  const [musicMuted, setMusicMutedState] = useState(false);
  const [showHarvesting, setShowHarvesting] = useState(false);
  const [showGear, setShowGear] = useState(false);
  const [showCharacter, setShowCharacter] = useState(false);

  const closeAllPopups = () => {
    setShowHarvesting(false);
    setShowGear(false);
    setShowCharacter(false);
  };

  const togglePopup = (which) => {
    closeAllPopups();
    if (which === 'harvest' && !showHarvesting) setShowHarvesting(true);
    else if (which === 'gear' && !showGear) setShowGear(true);
    else if (which === 'character' && !showCharacter) setShowCharacter(true);
  };

  const hasUnspent = unspentPoints > 0 || skillPoints > 0 || heroRoster.some(h => (h.unspentPoints || 0) > 0 || (h.skillPoints || 0) > 0);

  const buttons = [
    { id: 'camp', label: 'Camp', icon: 'camp', color: '#4ade80', action: () => enterScene('camp', 'world') },
    { id: 'points', label: 'Points', icon: 'star', color: hasUnspent ? '#ef4444' : '#94a3b8', action: () => setScreen('account'), pulse: hasUnspent },
    { id: 'council', label: 'Council', icon: 'battle', color: 'var(--gold)', action: () => setScreen('account') },
    { id: 'party', label: 'Party', icon: 'shield', color: 'var(--accent)', action: () => onToggleWarParty(), badge: Object.keys(activeHarvests).length > 0 ? Object.keys(activeHarvests).length : null },
    { id: 'gruda', label: 'Gruda', icon: 'skull', color: '#f87171', action: () => onToggleGruda() },
    { id: 'settings', label: 'Settings', icon: 'scroll', color: '#94a3b8', action: () => setScreen('account') },
    { id: 'music', label: musicMuted ? 'Unmute' : 'Mute', icon: 'energy', color: musicMuted ? '#ef4444' : '#6ee7b7', action: () => {
      const newVal = !musicMuted;
      setMusicMutedState(newVal);
      setMusicMuted(newVal);
      setSfxMuted(newVal);
    }},
    { id: 'quests', label: 'Quests', icon: 'scroll', color: '#fbbf24', action: () => setScreen('account') },
  ];

  const popupButtons = [
    { id: 'harvest', icon: 'pickaxe', color: 'var(--gold)', label: 'Harvest', active: showHarvesting },
    { id: 'gear', icon: 'shield', color: 'var(--accent)', label: 'Gear', active: showGear },
    { id: 'character', icon: 'chart', color: '#a855f7', label: 'Power', active: showCharacter },
  ];

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const leader = heroRoster.find(h => activeHeroIds.includes(h.id));
    const name = leader?.name || 'You';
    setChatLog(prev => [...prev.slice(-49), {
      id: Date.now(), speaker: name, line: chatInput.trim(), color: '#a78bfa',
    }]);
    setChatInput('');
  };

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: BAR_HEIGHT,
      zIndex: 10000,
      pointerEvents: 'none',
    }}>
      {showHarvesting && <div style={{ pointerEvents: 'auto' }}><HarvestingPopup onClose={() => setShowHarvesting(false)} /></div>}
      {showGear && <div style={{ pointerEvents: 'auto' }}><GearPopup onClose={() => setShowGear(false)} /></div>}
      {showCharacter && <div style={{ pointerEvents: 'auto' }}><CharacterPopup onClose={() => setShowCharacter(false)} /></div>}

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: BAR_HEIGHT,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'stretch',
        padding: '0',
      }}>
        <div style={{
          flex: '0 0 28%',
          display: 'flex', flexDirection: 'column',
          padding: '24px 8px 12px 28px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '3px 8px 2px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span className="font-cinzel" style={{ fontSize: '0.55rem', color: 'rgba(255,215,0,0.5)', fontWeight: 700, letterSpacing: '0.08em' }}>PARTY LOG</span>
          </div>
          <div ref={chatLogRef} style={{
            flex: 1, overflowY: 'auto', padding: '2px 8px',
            fontSize: '0.65rem', lineHeight: 1.5,
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,215,0,0.15) transparent',
          }}>
            {chatLog.length > 0 ? chatLog.slice(-8).map(entry => (
              <div key={entry.id} style={{ marginBottom: 2 }}>
                <span style={{ fontWeight: 700, color: entry.color, marginRight: 4, fontSize: '0.6rem', textTransform: 'uppercase' }}>{entry.speaker}</span>
                <span style={{ color: 'rgba(226,232,240,0.8)', fontWeight: 400 }}>{entry.line}</span>
              </div>
            )) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.6rem', color: 'rgba(148,163,184,0.3)', fontStyle: 'italic' }}>Your party is quiet...</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 4, padding: '2px 6px 0', alignItems: 'center' }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
              placeholder="Say something..."
              style={{
                flex: 1, background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,215,0,0.1)',
                borderRadius: 4, padding: '3px 6px',
                color: 'rgba(226,232,240,0.9)', fontSize: '0.6rem',
                fontFamily: "'Jost', sans-serif", outline: 'none', minWidth: 0,
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(255,215,0,0.3)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,215,0,0.1)'}
            />
            <button onClick={sendChat} style={{
              background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.15)',
              borderRadius: 4, padding: '2px 6px', color: 'var(--gold)', fontSize: '0.55rem',
              fontFamily: "'Cinzel', serif", fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>Send</button>
          </div>
        </div>

        <div style={{
          flex: '1 1 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '28px 4px 12px',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: 3,
            width: '100%',
            maxWidth: 480,
          }}>
            {buttons.map(btn => (
              <button key={btn.id} onClick={btn.action} title={btn.label} style={{
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 6,
                padding: '6px 2px 4px',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2,
                transition: 'all 0.15s',
                position: 'relative',
                animation: btn.pulse ? 'glow 2s infinite' : 'none',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,215,0,0.15)'; e.currentTarget.style.borderColor = 'rgba(255,215,0,0.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}
              >
                <InlineIcon name={btn.icon} size={18} />
                <span style={{ fontSize: '0.45rem', color: btn.color, fontWeight: 600, letterSpacing: '0.02em', fontFamily: "'Cinzel', serif" }}>{btn.label}</span>
                {btn.badge && (
                  <span style={{
                    position: 'absolute', top: -2, right: -2,
                    background: 'var(--gold)', color: '#000', fontSize: '0.4rem',
                    fontWeight: 800, borderRadius: '50%', width: 14, height: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{btn.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          flex: '0 0 20%',
          display: 'flex', flexDirection: 'column',
          padding: '20px 28px 14px 8px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 6,
          }}>
            {popupButtons.map(pb => (
              <button key={pb.id} onClick={() => togglePopup(pb.id)} title={pb.label} style={{
                width: 30, height: 30, borderRadius: '50%',
                background: pb.active ? 'rgba(255,215,0,0.25)' : 'rgba(20,24,48,0.9)',
                border: `2px solid ${pb.active ? 'var(--gold)' : 'rgba(255,255,255,0.15)'}`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                boxShadow: pb.active ? '0 0 10px rgba(255,215,0,0.3)' : 'none',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(255,215,0,0.3)'; }}
                onMouseLeave={e => { if (!pb.active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = 'none'; } }}
              >
                <InlineIcon name={pb.icon} size={14} />
              </button>
            ))}
          </div>

          <div style={{
            flex: 1, overflowY: 'auto', paddingTop: 18,
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(110,231,183,0.15) transparent',
          }}>
            <div className="font-cinzel" style={{ fontSize: '0.5rem', color: 'var(--accent)', fontWeight: 700, marginBottom: 4, letterSpacing: '0.05em', textAlign: 'center' }}>
              WAR PARTY
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {heroRoster.filter(h => h.id === 'player' || activeHeroIds.includes(h.id)).map(hero => {
                const heroCls = classDefinitions[hero.classId];
                const heroStats = heroCls ? getHeroStatsWithBonuses(hero) : null;
                const hpPercent = heroStats ? Math.round((hero.currentHealth / heroStats.health) * 100) : 100;
                return (
                  <div key={`bar_${hero.id}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 28, height: 28, overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                      <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={0.36} speed={180} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.5rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {hero.name}
                      </div>
                      <div style={{ fontSize: '0.4rem', color: 'var(--muted)' }}>Lv.{hero.level} {heroCls?.name}</div>
                      <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${hpPercent}%`, background: hpPercent > 50 ? '#22c55e' : hpPercent > 25 ? '#f59e0b' : '#ef4444', borderRadius: 2, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
