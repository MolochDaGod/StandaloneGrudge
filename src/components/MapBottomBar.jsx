import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { InlineIcon } from '../data/uiSprites.jsx';
import { showTooltip, hideTooltip, updateTooltipPosition } from './GameTooltip';
import { showContextMenu } from './GameContextMenu';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import RadarChart from './RadarChart';
import InventoryModal from './InventoryModal';
import { setMusicMuted, setSfxMuted } from '../utils/audioManager';
import { BOTTOM_BAR, BOTTOM_BAR_POPUPS } from '../constants/layers';
import { getBuildClassification } from '../data/attributes';
import { getElementStyle, getElementRect } from '../utils/uiLayoutConfig';

const POPUP_BOTTOM_OFFSET = 'calc(100% + 8px)';

function ChatAvatar({ race, heroClass, size = 20 }) {
  if (!race || !heroClass) return null;
  const spriteData = getPlayerSprite(heroClass, race);
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
        imageRendering: 'pixelated',
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
      position: 'absolute', bottom: POPUP_BOTTOM_OFFSET, right: 10, zIndex: BOTTOM_BAR_POPUPS,
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
      position: 'absolute', bottom: POPUP_BOTTOM_OFFSET, right: 10, zIndex: BOTTOM_BAR_POPUPS,
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
              imageRendering: 'pixelated',
            }}>{h.name}</button>
          ))}
        </div>
      )}
      <InventoryModal heroId={selectedHero} onClose={onClose} compact />
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
    <div className="ui-element panel-style" style={{
      position: 'absolute', bottom: POPUP_BOTTOM_OFFSET, right: 10, zIndex: BOTTOM_BAR_POPUPS,
      padding: 16, width: 400, maxHeight: 500, overflowY: 'auto',
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
  onSelectPartyHero,
}) {
  const {
    heroRoster, activeHeroIds, activeHarvests, level,
    unspentPoints, skillPoints,
  } = useGameStore();

  const [musicMuted, setMusicMutedState] = useState(false);
  const [showHarvesting, setShowHarvesting] = useState(false);
  const [showGear, setShowGear] = useState(false);
  const [showCharacter, setShowCharacter] = useState(false);
  const [hotbarAssignments, setHotbarAssignments] = useState(() => {
    try {
      const saved = localStorage.getItem('grudge_hotbar_assignments');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  const activePartyHeroes = heroRoster.filter(h => h.id === 'player' || activeHeroIds.includes(h.id));
  const [selectedPartyHero, setSelectedPartyHeroState] = useState(() => activePartyHeroes[0]?.id || null);

  useEffect(() => {
    if (selectedPartyHero && !activePartyHeroes.find(h => h.id === selectedPartyHero)) {
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
  };

  const togglePopup = (which) => {
    closeAllPopups();
    if (which === 'harvest' && !showHarvesting) setShowHarvesting(true);
    else if (which === 'gear' && !showGear) setShowGear(true);
    else if (which === 'character' && !showCharacter) setShowCharacter(true);
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

  const allActions = buttons;

  const resolvedSlots = Array.from({ length: 8 }, (_, i) => {
    const assignedId = hotbarAssignments[i];
    if (assignedId) {
      const found = allActions.find(a => a.id === assignedId);
      if (found) return { ...found, slotIndex: i };
    }
    return allActions[i] ? { ...allActions[i], slotIndex: i } : { id: `empty_${i}`, label: 'Empty', icon: null, img: null, action: null, slotIndex: i };
  });

  const assignSlot = (slotIndex, actionId) => {
    const next = { ...hotbarAssignments, [slotIndex]: actionId };
    setHotbarAssignments(next);
    localStorage.setItem('grudge_hotbar_assignments', JSON.stringify(next));
  };

  const handleSlotRightClick = (e, slotIndex) => {
    e.preventDefault();
    e.stopPropagation();
    const items = [
      ...allActions.map(act => ({
        label: act.label,
        icon: act.icon || null,
        action: () => assignSlot(slotIndex, act.id),
      })),
      { label: 'Clear Slot', icon: 'cancel', action: () => {
        const next = { ...hotbarAssignments };
        delete next[slotIndex];
        setHotbarAssignments(next);
        localStorage.setItem('grudge_hotbar_assignments', JSON.stringify(next));
      }},
    ];
    showContextMenu(e.clientX, e.clientY, items);
  };

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
      race: leader?.race, heroClass: leader?.class,
    }]);
    setChatInput('');
  };

  const portalTarget = document.getElementById('game-ui-portal');

  const barStyle = getElementStyle('world', 'bottomBar');
  const chatStyle = getElementStyle('world', 'chatPanel');
  const hotbarStyle = getElementStyle('world', 'hotbar');
  const warPartyStyle = getElementStyle('world', 'warParty');

  const stopWheelPropagation = (e) => {
    e.stopPropagation();
  };

  const activeTab = showHarvesting ? 'harvest' : showGear ? 'gear' : showCharacter ? 'character' : null;

  const overlayContent = (
    <div id="game-ui-overlay" data-ui-id="bottomBar" style={{
      position: 'absolute',
      ...barStyle,
      zIndex: 99999,
      pointerEvents: 'auto',
      overflow: 'visible',
    }}
    onWheel={stopWheelPropagation}
    onMouseDown={e => e.stopPropagation()}
    onClick={e => e.stopPropagation()}
    onContextMenu={e => e.stopPropagation()}
    >
      {showHarvesting && <HarvestingPopup onClose={() => setShowHarvesting(false)} />}
      {showGear && <GearPopup onClose={() => setShowGear(false)} />}
      {showCharacter && <CharacterPopup onClose={() => setShowCharacter(false)} />}

        <div data-ui-id="chatPanel" style={{
          position: 'absolute',
          ...chatStyle,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundImage: 'url(/ui/chat-background.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
        }}>
          <div ref={chatLogRef} style={{
            flex: 1, overflowY: 'auto',
            padding: '8% 8% 2% 8%',
            fontSize: '0.6rem', lineHeight: 1.4,
            scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,215,0,0.15) transparent',
            fontFamily: "'Jost', sans-serif",
          }}>
            {chatLog.length > 0 ? chatLog.map(entry => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 2, padding: '1px 0' }}>
                <ChatAvatar race={entry.race} heroClass={entry.heroClass} size={18} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, color: entry.color, marginRight: 3, fontSize: '0.5rem', textTransform: 'uppercase' }}>{entry.speaker}</span>
                  <span style={{ color: 'rgba(226,232,240,0.75)', fontWeight: 400, fontSize: '0.5rem' }}>{entry.line}</span>
                </div>
              </div>
            )) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '0.5rem', color: 'rgba(148,163,184,0.3)', fontStyle: 'italic' }}>Your party is quiet...</div>
            )}
          </div>
          <div style={{
            display: 'flex', gap: 0, alignItems: 'stretch',
            padding: '0 7% 8% 7%',
            height: '22%', minHeight: 0,
          }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendChat(); }}
              placeholder="Say something..."
              style={{
                flex: 1, background: 'rgba(0,0,0,0.3)',
                border: 'none',
                borderRadius: 0, padding: '2px 6px',
                color: 'rgba(226,232,240,0.9)', fontSize: '0.55rem',
                fontFamily: "'Jost', sans-serif", outline: 'none', minWidth: 0,
              }}
            />
            <button
              onClick={sendChat}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.92)'; e.currentTarget.style.filter = 'brightness(1.4)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
              onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.filter = 'brightness(1)'; }}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                height: '100%',
                transition: 'transform 0.1s, filter 0.15s',
              }}
            >
              <img src="/ui/send-button.png" alt="Send" style={{
                height: '100%',
                width: 'auto',
                display: 'block',
              }} />
            </button>
          </div>
        </div>

        <div data-ui-id="hotbar" style={{
          position: 'absolute',
          ...hotbarStyle,
          backgroundImage: 'url(/ui/hotbar-background.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
        }}>
          <div style={{
            position: 'absolute',
            top: '48%',
            left: '5.5%',
            right: '5.5%',
            height: '48%',
            display: 'grid',
            gridTemplateColumns: 'repeat(8, 1fr)',
            gap: '2%',
          }}>
            {resolvedSlots.map(btn => (
              <button key={btn.slotIndex} onClick={btn.action || undefined}
                onContextMenu={e => handleSlotRightClick(e, btn.slotIndex)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderRadius: 2,
                  padding: 0,
                  cursor: btn.action ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                  position: 'relative',
                  animation: btn.pulse ? 'glow 2s infinite' : 'none',
                  width: '100%',
                  height: '100%',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => { showTooltip(btn.label + (btn.action ? '' : ' (right-click to assign)'), e); e.currentTarget.style.background = 'rgba(255,215,0,0.15)'; }}
                onMouseMove={e => updateTooltipPosition(e)}
                onMouseLeave={e => { hideTooltip(); e.currentTarget.style.background = 'transparent'; }}
              >
                {btn.img ? (
                  <img src={btn.img} alt={btn.label} style={{ width: '85%', height: '85%', objectFit: 'contain', imageRendering: 'auto' }} />
                ) : btn.icon ? (
                  <InlineIcon name={btn.icon} size={24} />
                ) : (
                  <span style={{ fontSize: '0.5rem', color: 'rgba(255,255,255,0.15)' }}>{btn.slotIndex + 1}</span>
                )}
                {btn.badge && (
                  <span style={{
                    position: 'absolute', top: -1, right: -1,
                    background: 'var(--gold)', color: '#000', fontSize: '0.35rem',
                    fontWeight: 800, borderRadius: '50%', width: 12, height: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>{btn.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div data-ui-id="warParty" style={{
          position: 'absolute',
          ...warPartyStyle,
          display: 'flex',
          flexDirection: 'column',
          backgroundImage: 'url(/ui/bar-background.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
          borderRadius: '0 4px 4px 0',
          overflow: 'visible',
        }}>
          <div style={{
            position: 'absolute',
            top: -24, left: 0, right: 0,
            display: 'flex', gap: 0, justifyContent: 'center',
            pointerEvents: 'auto',
          }}>
            {popupButtons.map(pb => {
              const isActive = activeTab === pb.id;
              return (
                <button
                  key={pb.id}
                  onClick={() => togglePopup(pb.id)}
                  onMouseEnter={e => showTooltip(pb.label, e)}
                  onMouseMove={e => updateTooltipPosition(e)}
                  onMouseLeave={() => hideTooltip()}
                  style={{
                    background: isActive
                      ? 'linear-gradient(180deg, rgba(255,215,0,0.25) 0%, rgba(20,15,30,0.95) 100%)'
                      : 'linear-gradient(180deg, rgba(60,50,35,0.7) 0%, rgba(20,15,30,0.85) 100%)',
                    border: `1px solid ${isActive ? 'rgba(255,215,0,0.5)' : 'rgba(180,150,90,0.25)'}`,
                    borderBottom: isActive ? '1px solid transparent' : '1px solid rgba(180,150,90,0.25)',
                    borderRadius: '6px 6px 0 0',
                    padding: '3px 12px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    color: isActive ? '#ffd700' : 'rgba(180,150,90,0.6)',
                    fontSize: '0.5rem', fontWeight: 700,
                    fontFamily: "'Cinzel', serif",
                    transition: 'all 0.15s',
                    letterSpacing: '0.03em',
                  }}
                >
                  <InlineIcon name={pb.icon} size={12} />
                  {pb.label}
                </button>
              );
            })}
          </div>

          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            padding: '6px 8px 4px 6px',
          }}>
            <div className="font-cinzel" style={{ fontSize: '0.5rem', color: 'var(--accent)', fontWeight: 700, marginBottom: 4, letterSpacing: '0.05em', textAlign: 'center' }}>
              WAR PARTY
            </div>
            <div style={{ flex: 1, overflowY: 'auto', scrollbarWidth: 'thin', scrollbarColor: 'rgba(110,231,183,0.15) transparent' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: "'Jost', sans-serif" }}>
                {heroRoster.filter(h => h.id === 'player' || activeHeroIds.includes(h.id)).map(hero => {
                  const heroCls = classDefinitions[hero.classId];
                  const heroRace = raceDefinitions[hero.raceId];
                  const heroStats = heroCls ? getHeroStatsWithBonuses(hero) : null;
                  const isSelected = selectedPartyHero === hero.id;
                  const spriteData = getPlayerSprite(hero.classId, hero.raceId);
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
                          <SpriteAnimation spriteData={spriteData} animation="idle" scale={spriteScale} speed={180} />
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

  return portalTarget ? createPortal(overlayContent, portalTarget) : overlayContent;
}
