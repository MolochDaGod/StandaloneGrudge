import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { InlineIcon } from '../data/uiSprites.jsx';
import { showTooltip, hideTooltip, updateTooltipPosition } from './GameTooltip';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import RadarChart from './RadarChart';
import InventoryModal from './InventoryModal';
import { setMusicMuted, setSfxMuted, getMusicMuted } from '../utils/audioManager';
import { BOTTOM_BAR, BOTTOM_BAR_POPUPS } from '../constants/layers';
import { getBuildClassification, attributeDefinitions, TOTAL_POINTS_AT_LEVEL, calculateCombatPower } from '../data/attributes';
import BattlePositions from './BattlePositions';

const BAR_HEIGHT = '26%';
const POPUP_BOTTOM = 'calc(26% + 8px)';

function ChatAvatar({ race, heroClass, namedHeroId, size = 20 }) {
  if (!race || !heroClass) return null;
  const spriteData = getPlayerSprite(heroClass, race, namedHeroId);
  const idleAnim = spriteData?.idle;
  if (!idleAnim) return null;
  const frameWidth = spriteData?.frameWidth || 100;
  const frameHeight = spriteData?.frameHeight || 100;
  const scale = size / Math.min(frameWidth, frameHeight) * 2.4;

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      flexShrink: 0, position: 'relative',
      border: '1.5px solid rgba(255,215,0,0.4)',
      background: 'rgba(0,0,0,0.6)',
      boxShadow: '0 0 4px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        width: frameWidth * scale,
        height: frameHeight * scale,
        backgroundImage: `url(${idleAnim.src})`,
        backgroundSize: `${frameWidth * (idleAnim.frames || 1) * scale}px ${frameHeight * scale}px`,
        backgroundPosition: `0px -${frameHeight * scale * 0.05}px`,
        imageRendering: 'pixelated',
        transform: 'translate(-28%, -12%)',
        filter: spriteData?.filter || 'none',
      }} />
    </div>
  );
}

function BarRow({ label, current, max, color }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const fillColors = {
    '#22c55e': { top: '#78e08f', mid: '#38b764', bot: '#1e6f3e', glow: 'rgba(34,197,94,0.35)' },
    '#3b82f6': { top: '#7db8ff', mid: '#3b82f6', bot: '#1d4ed8', glow: 'rgba(59,130,246,0.35)' },
    '#f59e0b': { top: '#fcd34d', mid: '#f59e0b', bot: '#b45309', glow: 'rgba(245,158,11,0.35)' },
    '#dc2626': { top: '#f87171', mid: '#dc2626', bot: '#7f1d1d', glow: 'rgba(220,38,38,0.4)' },
  };
  const fc = fillColors[color] || { top: color, mid: color, bot: color, glow: color + '44' };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <span style={{ width: 14, fontSize: '0.35rem', fontWeight: 800, color: fc.mid, textAlign: 'right', letterSpacing: '-0.02em' }}>{label}</span>
      <div style={{
        flex: 1, height: 4,
        background: 'linear-gradient(180deg, #1a1a2e, #0d0d1a)',
        overflow: 'hidden',
        border: '1px solid #2a2a3e',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.8)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, bottom: 0,
          width: `${pct}%`,
          background: `linear-gradient(180deg, ${fc.top} 0%, ${fc.mid} 40%, ${fc.bot} 100%)`,
          transition: 'width 0.4s ease',
          boxShadow: pct > 0 ? `0 0 4px ${fc.glow}` : 'none',
        }} />
        {pct > 0 && (
          <div style={{
            position: 'absolute', top: 0, left: 0,
            width: `${pct}%`, height: '40%',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.25), rgba(255,255,255,0))',
            transition: 'width 0.4s ease',
          }} />
        )}
      </div>
      <span style={{ width: 22, fontSize: '0.3rem', color: 'rgba(226,232,240,0.5)', textAlign: 'right', fontWeight: 600 }}>{Math.floor(current)}</span>
    </div>
  );
}

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
    <div className="ui-element panel-style" style={{
      position: 'absolute', bottom: POPUP_BOTTOM, right: 10, zIndex: BOTTOM_BAR_POPUPS,
      padding: 16, width: 360, maxHeight: 400, overflowY: 'auto',
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
  const { heroRoster, activeHeroIds } = useGameStore();
  const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
  const [selectedHero, setSelectedHero] = useState(activeHeroes[0]?.id || null);

  return (
    <div className="ui-element" style={{
      position: 'absolute', bottom: POPUP_BOTTOM, right: 10, zIndex: BOTTOM_BAR_POPUPS,
      animation: 'fadeIn 0.15s ease-out',
    }}>
      {heroRoster.length > 1 && (
        <div style={{
          display: 'flex', gap: 3, marginBottom: 4, flexWrap: 'wrap',
          background: 'rgba(41,64,64,0.9)', borderRadius: '4px 4px 0 0',
          padding: '3px 6px', border: '1px solid rgba(96,56,32,0.5)',
          borderBottom: 'none',
        }}>
          {heroRoster.map(h => (
            <button key={h.id} onClick={() => setSelectedHero(h.id)} style={{
              background: selectedHero === h.id ? 'rgba(80,144,112,0.6)' : 'rgba(42,49,80,0.3)',
              border: `1px solid ${selectedHero === h.id ? '#509070' : 'rgba(96,56,32,0.4)'}`,
              borderRadius: 2, padding: '2px 6px', cursor: 'pointer',
              color: selectedHero === h.id ? '#e5d6a1' : 'rgba(229,214,161,0.5)',
              fontSize: '0.55rem', fontWeight: 600, fontFamily: 'Cinzel, serif',
            }}>{h.name}</button>
          ))}
        </div>
      )}
      <InventoryModal heroId={selectedHero} onClose={onClose} compact />
    </div>
  );
}

const ATTR_KEYS = ['Strength', 'Intellect', 'Vitality', 'Dexterity', 'Endurance', 'Wisdom', 'Agility', 'Tactics'];
const ATTR_ABBREV = { Strength: 'STR', Intellect: 'INT', Vitality: 'VIT', Dexterity: 'DEX', Endurance: 'END', Wisdom: 'WIS', Agility: 'AGI', Tactics: 'TAC' };

function getStatTierColor(value, maxPoints) {
  const ratio = maxPoints > 0 ? value / maxPoints : 0;
  if (ratio >= 0.50) return { bar: 'linear-gradient(90deg, #89f7fe, #b0f0ff)', label: '#89f7fe' };
  if (ratio >= 0.35) return { bar: 'linear-gradient(90deg, #ea580c, #f97316)', label: '#f97316' };
  if (ratio >= 0.25) return { bar: 'linear-gradient(90deg, #7c3aed, #a855f7)', label: '#a855f7' };
  if (ratio >= 0.15) return { bar: 'linear-gradient(90deg, #2563eb, #3b82f6)', label: '#3b82f6' };
  if (ratio >= 0.05) return { bar: 'linear-gradient(90deg, #16a34a, #22c55e)', label: '#22c55e' };
  return { bar: 'linear-gradient(90deg, #6b7280, #9ca3af)', label: '#9ca3af' };
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
  const attrs = hero?.attributePoints || {};
  const maxPoints = hero ? TOTAL_POINTS_AT_LEVEL(hero.level || 0) : 1;
  const combatPower = stats ? calculateCombatPower(stats) : 0;
  const buildInfo = stats ? getBuildClassification(stats, attrs) : null;

  const radarLabels = ATTR_KEYS.map(k => ATTR_ABBREV[k]);
  const radarValues = ATTR_KEYS.map(k => Math.min(100, ((attrs[k] || 0) / Math.max(maxPoints * 0.5, 1)) * 100));
  const radarPointColors = ATTR_KEYS.map(k => attributeDefinitions[k]?.color || '#a5b4d0');

  return (
    <div className="ui-element panel-style" style={{
      position: 'absolute', bottom: POPUP_BOTTOM, right: 10, zIndex: BOTTOM_BAR_POPUPS,
      padding: 16, width: 420, maxHeight: 520, overflowY: 'auto',
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
              <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId, hero.namedHeroId)} animation="idle" scale={0.8} speed={150} containerless={false} />
            </div>
            <div>
              <div className="font-cinzel" style={{ color: '#c084fc', fontSize: '0.85rem', fontWeight: 700 }}>{hero.name}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.55rem' }}>
                Lv.{hero.level} {race?.name} {cls?.name}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(251,191,36,0.1))',
                  border: '1px solid rgba(168,85,247,0.3)', borderRadius: 6, padding: '3px 8px',
                }}>
                  <span style={{ color: '#c084fc', fontSize: '0.65rem', fontWeight: 700 }}>CP: {combatPower}</span>
                </div>
                {buildInfo && (
                  <div style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: `1px solid ${buildInfo.tierColor}44`, borderRadius: 6, padding: '3px 8px',
                  }}>
                    <span style={{ color: buildInfo.tierColor, fontSize: '0.65rem', fontWeight: 700 }}>{buildInfo.rating} — {buildInfo.tier}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: '0 0 auto' }}>
              <RadarChart labels={radarLabels} values={radarValues} size={160} color="#a855f7" pointColors={radarPointColors} />
            </div>
            <div style={{ flex: 1, display: 'grid', gap: 5 }}>
              {ATTR_KEYS.map((attrKey) => {
                const val = attrs[attrKey] || 0;
                const tier = getStatTierColor(val, maxPoints);
                const pct = Math.min(100, (val / Math.max(maxPoints * 0.5, 1)) * 100);
                return (
                  <div key={attrKey} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 28, fontSize: '0.55rem', color: tier.label, fontWeight: 700, textAlign: 'right' }}>{ATTR_ABBREV[attrKey]}</span>
                    <div style={{ flex: 1, height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: tier.bar,
                        borderRadius: 3, transition: 'width 0.3s',
                        boxShadow: val > 0 ? `0 0 4px ${tier.label}44` : 'none',
                      }} />
                    </div>
                    <span style={{ width: 20, fontSize: '0.55rem', color: tier.label, fontWeight: 600, textAlign: 'right' }}>{val}</span>
                  </div>
                );
              })}
              <div style={{ marginTop: 6, padding: '4px 6px', background: 'rgba(0,0,0,0.2)', borderRadius: 4 }}>
                <div style={{ fontSize: '0.5rem', color: 'var(--muted)' }}>HP: {Math.floor(hero.currentHealth || 0)}/{Math.floor(stats.health)} | MP: {Math.floor(hero.currentMana || 0)}/{Math.floor(stats.mana)} | SP: {Math.floor(hero.currentStamina || 0)}/{Math.floor(stats.stamina)}</div>
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
  onSelectPartyHero,
}) {
  const {
    heroRoster, activeHeroIds, activeHarvests, level,
    unspentPoints, skillPoints,
  } = useGameStore();

  const [musicMuted, setMusicMutedState] = useState(() => getMusicMuted());
  const [showHarvesting, setShowHarvesting] = useState(false);
  const [showGear, setShowGear] = useState(false);
  const [showCharacter, setShowCharacter] = useState(false);
  const [showFormation, setShowFormation] = useState(false);
  const [selectedPartyHero, setSelectedPartyHeroState] = useState(null);

  const activePartyHeroes = heroRoster.filter(h => h.id === 'player' || activeHeroIds.includes(h.id));

  useEffect(() => {
    if (!selectedPartyHero || !activePartyHeroes.find(h => h.id === selectedPartyHero)) {
      const fallback = activePartyHeroes[0]?.id || null;
      setSelectedPartyHeroState(fallback);
      if (onSelectPartyHero) onSelectPartyHero(fallback);
    }
  }, [heroRoster, activeHeroIds]);

  useEffect(() => {
    if (chatLogRef?.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [chatLog?.length]);

  const setSelectedPartyHero = (id) => {
    setSelectedPartyHeroState(id);
    if (onSelectPartyHero) onSelectPartyHero(id);
  };

  const closeAllPopups = () => {
    setShowHarvesting(false);
    setShowGear(false);
    setShowCharacter(false);
    setShowFormation(false);
  };

  const togglePopup = (which) => {
    closeAllPopups();
    if (which === 'harvest' && !showHarvesting) setShowHarvesting(true);
    else if (which === 'gear' && !showGear) setShowGear(true);
    else if (which === 'character' && !showCharacter) setShowCharacter(true);
    else if (which === 'formation' && !showFormation) setShowFormation(true);
  };

  const hasUnspent = unspentPoints > 0 || skillPoints > 0 || heroRoster.some(h => (h.unspentPoints || 0) > 0 || (h.skillPoints || 0) > 0);

  const buttons = [
    { id: 'camp', label: 'Camp', img: '/ui/icon-camp.png', color: '#4ade80', action: () => enterScene('camp', 'world') },
    { id: 'points', label: 'Points', img: '/ui/icon-points.png', color: hasUnspent ? '#ef4444' : '#94a3b8', action: () => setScreen('account'), pulse: hasUnspent },
    { id: 'council', label: 'Council', img: '/ui/icon-council.png', color: 'var(--gold)', action: () => setScreen('account') },
    { id: 'party', label: 'Party', img: '/ui/icon-party.png', color: 'var(--accent)', action: () => onToggleWarParty(), badge: Object.keys(activeHarvests).length > 0 ? Object.keys(activeHarvests).length : null },
    { id: 'gruda', label: 'Gruda', icon: 'skull', color: '#f87171', action: () => onToggleGruda() },
    { id: 'settings', label: 'Settings', img: '/ui/icon-settings.png', color: '#94a3b8', action: () => setScreen('account') },
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
    { id: 'formation', icon: 'target', color: '#f97316', label: 'Form', active: showFormation },
  ];

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const leader = heroRoster.find(h => activeHeroIds.includes(h.id));
    const name = leader?.name || 'You';
    setChatLog(prev => [...prev.slice(-49), {
      id: Date.now(), speaker: name, line: chatInput.trim(), color: '#a78bfa',
      race: leader?.raceId, heroClass: leader?.classId, namedHeroId: leader?.namedHeroId,
    }]);
    setChatInput('');
  };

  const stopWheelPropagation = (e) => e.stopPropagation();

  const portalTarget = document.getElementById('game-ui-portal');

  const barContent = (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: BAR_HEIGHT,
      zIndex: BOTTOM_BAR,
      pointerEvents: 'none',
      overflow: 'visible',
    }}
    onWheel={stopWheelPropagation}
    onMouseDown={e => e.stopPropagation()}
    onClick={e => e.stopPropagation()}
    onContextMenu={e => e.stopPropagation()}
    >
      {showHarvesting && <div style={{ pointerEvents: 'auto' }}><HarvestingPopup onClose={() => setShowHarvesting(false)} /></div>}
      {showGear && <div style={{ pointerEvents: 'auto' }}><GearPopup onClose={() => setShowGear(false)} /></div>}
      {showCharacter && <div style={{ pointerEvents: 'auto' }}><CharacterPopup onClose={() => setShowCharacter(false)} /></div>}
      {showFormation && (
        <div style={{ pointerEvents: 'auto' }}>
          <div className="ui-element panel-style" style={{
            position: 'absolute', bottom: POPUP_BOTTOM, right: 10, zIndex: BOTTOM_BAR_POPUPS,
            width: 320, height: 220,
            animation: 'fadeIn 0.15s ease-out',
            padding: 0, overflow: 'hidden', borderRadius: 6,
          }}>
            <button onClick={() => setShowFormation(false)} style={{
              position: 'absolute', top: 4, right: 6, zIndex: 2,
              background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '1.1rem',
            }}>×</button>
            <BattlePositions compact />
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, top: 0,
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'stretch',
        backgroundImage: 'url(/ui/bar-background.png)',
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}>

        <div style={{
          flex: '0 0 28%',
          display: 'flex', flexDirection: 'column',
          padding: '20px 8px 10px 24px',
          overflow: 'hidden',
          backgroundImage: 'url(/ui/chat-background.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          borderRadius: 4,
        }}>
          <div style={{
            padding: '2px 8px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span className="font-cinzel" style={{ fontSize: '0.5rem', color: 'rgba(255,215,0,0.5)', fontWeight: 700, letterSpacing: '0.08em' }}>PARTY LOG</span>
          </div>
          <div ref={chatLogRef} style={{
            flex: 1, overflowY: 'auto', padding: '2px 8px',
            fontSize: '0.7rem', lineHeight: 1.4,
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,215,0,0.15) transparent',
            fontFamily: "'Jost', sans-serif",
          }}>
            {chatLog.length > 0 ? chatLog.slice(-8).map(entry => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 2 }}>
                <ChatAvatar race={entry.race} heroClass={entry.heroClass} namedHeroId={entry.namedHeroId} size={18} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, color: entry.color, marginRight: 3, fontSize: '0.6rem', textTransform: 'uppercase' }}>{entry.speaker}</span>
                  <span style={{ color: 'rgba(226,232,240,0.8)', fontWeight: 400, fontSize: '0.6rem' }}>{entry.line}</span>
                </div>
              </div>
            )) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.55rem', color: 'rgba(148,163,184,0.3)', fontStyle: 'italic' }}>Your party is quiet...</div>
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
                color: 'rgba(226,232,240,0.9)', fontSize: '0.65rem',
                fontFamily: "'Jost', sans-serif", outline: 'none', minWidth: 0,
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(255,215,0,0.3)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,215,0,0.1)'}
            />
            <button onClick={sendChat} style={{
              background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.15)',
              borderRadius: 4, padding: '2px 8px', color: 'var(--gold)', fontSize: '0.55rem',
              fontFamily: "'Cinzel', serif", fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>Send</button>
          </div>
        </div>

        <div style={{
          flex: '1 1 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '8px 4px 4px',
          position: 'relative',
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            maxWidth: 520,
            aspectRatio: '1455 / 526',
            backgroundImage: 'url(/ui/hotbar-background.png)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 12.5%',
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '2.2%',
              width: '100%',
              alignItems: 'center',
              paddingTop: '3%',
            }}>
              {buttons.map((btn, idx) => (
                <div key={btn.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <button onClick={btn.action} style={{
                    background: 'rgba(0,0,0,0.6)',
                    border: '2px solid rgba(197,160,89,0.4)',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                    position: 'relative',
                    animation: btn.pulse ? 'glow 2s infinite' : 'none',
                    aspectRatio: '1 / 1',
                    width: '100%',
                    boxShadow: 'inset 0 0 5px rgba(0,0,0,0.8)',
                    borderRadius: 5,
                  }}
                    onMouseEnter={e => { showTooltip(btn.label, e); e.currentTarget.style.borderColor = '#c5a059'; e.currentTarget.style.transform = 'scale(1.08)'; }}
                    onMouseMove={e => updateTooltipPosition(e)}
                    onMouseLeave={e => { hideTooltip(); e.currentTarget.style.borderColor = 'rgba(197,160,89,0.4)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    {btn.img ? (
                      <img src={btn.img} alt={btn.label} style={{ width: '65%', height: '65%', objectFit: 'contain', borderRadius: 2, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
                    ) : (
                      <InlineIcon name={btn.icon} size={20} />
                    )}
                    <span style={{ position: 'absolute', top: 1, left: 3, fontSize: '0.4rem', color: 'rgba(200,200,200,0.5)', fontWeight: 600, fontFamily: "'Cinzel', serif" }}>{idx + 1}</span>
                    {btn.badge && (
                      <span style={{
                        position: 'absolute', top: -2, right: -2,
                        background: 'var(--gold)', color: '#000', fontSize: '0.4rem',
                        fontWeight: 800, borderRadius: '50%', width: 14, height: 14,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{btn.badge}</span>
                    )}
                  </button>
                  <span style={{ fontSize: '0.4rem', color: btn.color, fontWeight: 600, letterSpacing: '0.02em', fontFamily: "'Cinzel', serif", lineHeight: 1, textAlign: 'center' }}>{btn.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{
          flex: '0 0 20%',
          display: 'flex', flexDirection: 'column',
          padding: '20px 24px 12px 8px',
          position: 'relative',
          overflow: 'visible',
        }}>
          <div style={{
            position: 'absolute', top: -2, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', gap: 6,
          }}>
            {popupButtons.map(pb => (
              <button key={pb.id} onClick={() => togglePopup(pb.id)} style={{
                width: 30, height: 30, borderRadius: '50%',
                background: pb.active ? 'rgba(255,215,0,0.25)' : 'rgba(20,24,48,0.9)',
                border: `2px solid ${pb.active ? 'var(--gold)' : 'rgba(255,255,255,0.15)'}`,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
                boxShadow: pb.active ? '0 0 10px rgba(255,215,0,0.3)' : 'none',
              }}
                onMouseEnter={e => { showTooltip(pb.label, e); e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.boxShadow = '0 0 12px rgba(255,215,0,0.3)'; }}
                onMouseMove={e => updateTooltipPosition(e)}
                onMouseLeave={e => { hideTooltip(); if (!pb.active) { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.boxShadow = 'none'; } }}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontFamily: "'Jost', sans-serif" }}>
              {activePartyHeroes.map(hero => {
                const heroCls = classDefinitions[hero.classId];
                const heroRace = raceDefinitions[hero.raceId];
                const heroStats = heroCls ? getHeroStatsWithBonuses(hero) : null;
                const isSelected = selectedPartyHero === hero.id;
                const spriteData = getPlayerSprite(hero.classId, hero.raceId, hero.namedHeroId);
                const circleSize = 32;
                const fw = spriteData?.frameWidth || 100;
                const spriteScale = (circleSize / fw) * 1.1;
                const build = heroStats ? getBuildClassification(heroStats, hero.attributes || {}) : null;
                const swirlColor = build?.tierColor || '#9ca3af';

                return (
                  <div
                    key={`bar_${hero.id}`}
                    onClick={() => setSelectedPartyHero(hero.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      cursor: 'pointer',
                      padding: '4px 6px',
                      borderRadius: 6,
                      background: isSelected ? 'rgba(110,231,183,0.08)' : 'transparent',
                      border: isSelected ? '1px solid rgba(110,231,183,0.25)' : '1px solid transparent',
                      transition: 'background 0.15s, border-color 0.15s',
                    }}
                  >
                    <div style={{
                      width: circleSize, height: circleSize, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
                      border: isSelected ? `2px solid ${swirlColor}` : `1.5px solid ${swirlColor}80`,
                      background: 'rgba(0,0,0,0.7)',
                      boxShadow: isSelected ? `0 0 10px ${swirlColor}50` : `0 0 5px ${swirlColor}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'relative',
                    }}>
                      <div style={{
                        position: 'absolute', inset: 0, borderRadius: '50%',
                        background: `conic-gradient(from 0deg, ${swirlColor}00, ${swirlColor}35, ${swirlColor}00, ${swirlColor}25, ${swirlColor}00)`,
                        animation: 'swirlSpin 4s linear infinite',
                        opacity: 0.7,
                      }} />
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <SpriteAnimation spriteData={spriteData} animation="idle" scale={spriteScale} speed={180} containerless={false} />
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                        <span style={{
                          fontSize: '0.6rem', fontWeight: 700,
                          color: isSelected ? 'var(--accent)' : '#fff',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          flex: 1, minWidth: 0,
                        }}>
                          {hero.name}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                        <span style={{
                          fontSize: '0.45rem', fontWeight: 700, color: 'var(--gold)',
                          background: 'rgba(255,215,0,0.1)', padding: '0px 4px', borderRadius: 3,
                          border: '1px solid rgba(255,215,0,0.15)',
                        }}>
                          Lv.{hero.level}
                        </span>
                        {heroCls && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <InlineIcon name={heroCls.icon} size={11} />
                            <span style={{ fontSize: '0.4rem', color: 'var(--muted)' }}>{heroCls.name}</span>
                          </span>
                        )}
                        {heroRace?.icon && (
                          <img src={heroRace.icon} alt={heroRace.name} style={{
                            width: 13, height: 13, borderRadius: '50%',
                            border: '1px solid rgba(255,255,255,0.1)',
                            imageRendering: 'pixelated',
                          }} />
                        )}
                      </div>

                      {heroStats && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <BarRow label="HP" current={hero.currentHealth} max={heroStats.health} color="#22c55e" />
                          <BarRow label="MP" current={hero.currentMana} max={heroStats.mana} color="#3b82f6" />
                          <BarRow label="SP" current={hero.currentStamina} max={heroStats.stamina} color="#f59e0b" />
                          <BarRow label="GR" current={hero.grudge || 0} max={100} color="#dc2626" />
                        </div>
                      )}
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

  return portalTarget ? createPortal(barContent, portalTarget) : barContent;
}
