import React, { useEffect, useState, useRef, useCallback } from 'react';
import useGameStore, { getHeroStatsWithBonuses } from '../stores/gameStore';
import { locations } from '../data/enemies';
import { cities, cityPositions, cityConnections } from '../data/cities';
import { missionTemplates, arenaTemplates } from '../data/missions';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, getEnemySprite } from '../data/spriteMap';
import { setBgm } from '../utils/audioManager';
import { TIERS, UPGRADE_COSTS, EQUIPMENT_SLOTS, WEAPON_TYPES, ARMOR_TYPES, getItemPrice, getSellPrice } from '../data/equipment';

const bossMapSprites = {
  nature_elemental: { filter: 'hue-rotate(80deg) saturate(2.5) brightness(0.7) contrast(1.3)', glow: 'rgba(0,255,80,0.5)' },
  water_elemental: { filter: 'hue-rotate(200deg) saturate(2.0) brightness(0.6) contrast(1.4)', glow: 'rgba(60,100,255,0.5)' },
  lich: { filter: 'hue-rotate(270deg) saturate(2.5) brightness(0.5) contrast(1.5)', glow: 'rgba(130,50,255,0.6)' },
  demon_lord: { filter: 'hue-rotate(340deg) saturate(3.0) brightness(0.5) contrast(1.6)', glow: 'rgba(255,30,30,0.6)' },
  void_king: { filter: 'hue-rotate(280deg) saturate(2.0) brightness(0.4) contrast(1.8) drop-shadow(0 0 8px rgba(200,100,255,0.8))', glow: 'rgba(200,100,255,0.7)' },
  grand_shaman: { filter: 'hue-rotate(120deg) saturate(2.0) brightness(0.65) contrast(1.3)', glow: 'rgba(0,200,100,0.5)' },
  canyon_warlord: { filter: 'hue-rotate(15deg) saturate(2.5) brightness(0.6) contrast(1.4)', glow: 'rgba(220,100,30,0.5)' },
  frost_wyrm: { filter: 'hue-rotate(190deg) saturate(2.2) brightness(0.55) contrast(1.4)', glow: 'rgba(100,180,255,0.5)' },
  shadow_beast: { filter: 'hue-rotate(260deg) saturate(2.0) brightness(0.45) contrast(1.5)', glow: 'rgba(100,50,200,0.6)' },
  void_sentinel: { filter: 'hue-rotate(290deg) saturate(2.5) brightness(0.4) contrast(1.7) drop-shadow(0 0 6px rgba(180,80,255,0.7))', glow: 'rgba(180,80,255,0.6)' },
};

const locationPositions = {
  verdant_plains:     { x: 10, y: 88 },
  dark_forest:        { x: 22, y: 78 },
  mystic_grove:       { x: 12, y: 68 },
  whispering_caverns: { x: 28, y: 88 },
  haunted_marsh:      { x: 38, y: 78 },
  cursed_ruins:       { x: 35, y: 65 },
  crystal_caves:      { x: 20, y: 55 },
  thornwood_pass:     { x: 48, y: 72 },
  sunken_temple:      { x: 50, y: 85 },
  iron_peaks:         { x: 30, y: 45 },
  blood_canyon:       { x: 60, y: 65 },
  frozen_tundra:      { x: 42, y: 38 },
  dragon_peaks:       { x: 55, y: 50 },
  ashen_battlefield:  { x: 68, y: 75 },
  windswept_ridge:    { x: 45, y: 28 },
  molten_core:        { x: 72, y: 58 },
  shadow_forest:      { x: 25, y: 35 },
  obsidian_wastes:    { x: 78, y: 68 },
  ruins_of_ashenmoor: { x: 58, y: 38 },
  blight_hollow:      { x: 35, y: 22 },
  shadow_citadel:     { x: 65, y: 28 },
  stormspire_peak:    { x: 50, y: 15 },
  demon_gate:         { x: 80, y: 42 },
  abyssal_depths:     { x: 75, y: 30 },
  infernal_forge:     { x: 88, y: 52 },
  dreadmaw_canyon:    { x: 85, y: 38 },
  void_threshold:     { x: 72, y: 18 },
  corrupted_spire:    { x: 88, y: 22 },
  void_throne:        { x: 82, y: 8 },
};

const pathConnections = [
  ['verdant_plains', 'dark_forest'],
  ['verdant_plains', 'whispering_caverns'],
  ['dark_forest', 'mystic_grove'],
  ['dark_forest', 'haunted_marsh'],
  ['dark_forest', 'cursed_ruins'],
  ['mystic_grove', 'crystal_caves'],
  ['whispering_caverns', 'haunted_marsh'],
  ['whispering_caverns', 'sunken_temple'],
  ['haunted_marsh', 'cursed_ruins'],
  ['haunted_marsh', 'thornwood_pass'],
  ['cursed_ruins', 'crystal_caves'],
  ['cursed_ruins', 'thornwood_pass'],
  ['crystal_caves', 'iron_peaks'],
  ['thornwood_pass', 'blood_canyon'],
  ['thornwood_pass', 'sunken_temple'],
  ['sunken_temple', 'ashen_battlefield'],
  ['iron_peaks', 'frozen_tundra'],
  ['iron_peaks', 'shadow_forest'],
  ['blood_canyon', 'dragon_peaks'],
  ['blood_canyon', 'ashen_battlefield'],
  ['blood_canyon', 'molten_core'],
  ['frozen_tundra', 'windswept_ridge'],
  ['frozen_tundra', 'dragon_peaks'],
  ['dragon_peaks', 'ruins_of_ashenmoor'],
  ['dragon_peaks', 'molten_core'],
  ['ashen_battlefield', 'obsidian_wastes'],
  ['windswept_ridge', 'blight_hollow'],
  ['windswept_ridge', 'shadow_citadel'],
  ['molten_core', 'obsidian_wastes'],
  ['molten_core', 'demon_gate'],
  ['shadow_forest', 'blight_hollow'],
  ['obsidian_wastes', 'demon_gate'],
  ['ruins_of_ashenmoor', 'shadow_citadel'],
  ['blight_hollow', 'stormspire_peak'],
  ['shadow_citadel', 'abyssal_depths'],
  ['shadow_citadel', 'void_threshold'],
  ['stormspire_peak', 'void_threshold'],
  ['demon_gate', 'infernal_forge'],
  ['demon_gate', 'dreadmaw_canyon'],
  ['abyssal_depths', 'dreadmaw_canyon'],
  ['abyssal_depths', 'void_threshold'],
  ['infernal_forge', 'dreadmaw_canyon'],
  ['dreadmaw_canyon', 'corrupted_spire'],
  ['void_threshold', 'corrupted_spire'],
  ['void_threshold', 'void_throne'],
  ['corrupted_spire', 'void_throne'],
];

const locationIcons = {
  verdant_plains:     { symbol: '🌿', color: '#4ade80', glow: 'rgba(74,222,128,0.4)' },
  dark_forest:        { symbol: '🌲', color: '#22d3ee', glow: 'rgba(34,211,238,0.4)' },
  mystic_grove:       { symbol: '✨', color: '#a78bfa', glow: 'rgba(167,139,250,0.4)' },
  whispering_caverns: { symbol: '🕳️', color: '#94a3b8', glow: 'rgba(148,163,184,0.4)' },
  haunted_marsh:      { symbol: '💀', color: '#86efac', glow: 'rgba(134,239,172,0.3)' },
  cursed_ruins:       { symbol: '🏚️', color: '#c084fc', glow: 'rgba(192,132,252,0.4)' },
  crystal_caves:      { symbol: '💎', color: '#67e8f9', glow: 'rgba(103,232,249,0.4)' },
  thornwood_pass:     { symbol: '🌳', color: '#6ee7b7', glow: 'rgba(110,231,183,0.3)' },
  sunken_temple:      { symbol: '🏛️', color: '#38bdf8', glow: 'rgba(56,189,248,0.4)' },
  iron_peaks:         { symbol: '⛰️', color: '#9ca3af', glow: 'rgba(156,163,175,0.4)' },
  blood_canyon:       { symbol: '🏔️', color: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
  frozen_tundra:      { symbol: '❄️', color: '#7dd3fc', glow: 'rgba(125,211,252,0.4)' },
  dragon_peaks:       { symbol: '🐉', color: '#f97316', glow: 'rgba(249,115,22,0.4)' },
  ashen_battlefield:  { symbol: '⚔️', color: '#a8a29e', glow: 'rgba(168,162,158,0.3)' },
  windswept_ridge:    { symbol: '🌬️', color: '#93c5fd', glow: 'rgba(147,197,253,0.3)' },
  molten_core:        { symbol: '🔥', color: '#fb923c', glow: 'rgba(251,146,60,0.4)' },
  shadow_forest:      { symbol: '🌑', color: '#818cf8', glow: 'rgba(129,140,248,0.4)' },
  obsidian_wastes:    { symbol: '🌋', color: '#f87171', glow: 'rgba(248,113,113,0.4)' },
  ruins_of_ashenmoor: { symbol: '🏚️', color: '#d4d4d8', glow: 'rgba(212,212,216,0.3)' },
  blight_hollow:      { symbol: '☠️', color: '#a3e635', glow: 'rgba(163,230,53,0.3)' },
  shadow_citadel:     { symbol: '🏰', color: '#a78bfa', glow: 'rgba(167,139,250,0.4)' },
  stormspire_peak:    { symbol: '⚡', color: '#fcd34d', glow: 'rgba(252,211,77,0.4)' },
  demon_gate:         { symbol: '🌀', color: '#f43f5e', glow: 'rgba(244,63,94,0.4)' },
  abyssal_depths:     { symbol: '🕳️', color: '#6366f1', glow: 'rgba(99,102,241,0.4)' },
  infernal_forge:     { symbol: '🔨', color: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
  dreadmaw_canyon:    { symbol: '💀', color: '#d946ef', glow: 'rgba(217,70,239,0.4)' },
  void_threshold:     { symbol: '🌌', color: '#c084fc', glow: 'rgba(192,132,252,0.5)' },
  corrupted_spire:    { symbol: '🗼', color: '#e879f9', glow: 'rgba(232,121,249,0.4)' },
  void_throne:        { symbol: '👑', color: '#fbbf24', glow: 'rgba(251,191,36,0.5)' },
};

export default function WorldMap() {
  const {
    level, xp, xpToNext, gold, playerName, playerClass, playerRace,
    playerHealth, playerMaxHealth, playerMana, playerMaxMana,
    setScreen, startBattle, startBossBattle, getUnlockedLocations, restAtInn,
    victories, unspentPoints, skillPoints, heroRoster, activeHeroIds, maxHeroSlots,
    setActiveHeroes, locationsCleared, bossesDefeated, zoneConquer,
    harvestNodes, activeHarvests, harvestResources, assignHarvest, recallHarvest, tickHarvests,
    startMissionBattle, startArenaBattle, completedMissions,
    upgradeEquipment,
    shopInventory, inventory, buyItem, sellItem, refreshShop,
  } = useGameStore();

  const enterLocation = useGameStore(s => s.enterLocation);
  const raceDef = playerRace ? raceDefinitions[playerRace] : null;
  const cls = classDefinitions[playerClass];
  const unlockedLocs = getUnlockedLocations();
  const canCreateNewHero = heroRoster.length < maxHeroSlots;

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [citySubmenu, setCitySubmenu] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const [showWarParty, setShowWarParty] = useState(false);
  const [showHarvest, setShowHarvest] = useState(false);
  const [upgradeHeroId, setUpgradeHeroId] = useState(null);
  const [upgradeMsg, setUpgradeMsg] = useState(null);
  const [tradeTab, setTradeTab] = useState('buy');
  const [heroPos, setHeroPos] = useState(locationPositions.verdant_plains);
  const [currentZone, setCurrentZone] = useState('verdant_plains');
  const [isMoving, setIsMoving] = useState(false);
  const [wanderOffsets, setWanderOffsets] = useState({});
  const mapRef = useRef(null);
  const menuRef = useRef(null);

  const [heroWalking, setHeroWalking] = useState({});

  useEffect(() => {
    const interval = setInterval(() => {
      const activeHeroes = heroRoster.filter(h => activeHeroIds.includes(h.id));
      const newOffsets = {};
      const newWalking = {};
      activeHeroes.forEach(h => {
        const prevX = wanderOffsets[h.id]?.x || 0;
        const newX = (Math.random() - 0.5) * 4;
        newOffsets[h.id] = {
          x: newX,
          y: (Math.random() - 0.5) * 2,
        };
        newWalking[h.id] = { moving: true, flipX: newX < prevX };
      });
      setWanderOffsets(newOffsets);
      setHeroWalking(newWalking);
      setTimeout(() => {
        setHeroWalking({});
      }, 1800);
    }, 3000);
    return () => clearInterval(interval);
  }, [heroRoster, activeHeroIds, wanderOffsets]);

  useEffect(() => { setBgm('ambient'); }, []);

  useEffect(() => {
    const interval = setInterval(() => { tickHarvests(); }, 2000);
    return () => clearInterval(interval);
  }, [tickHarvests]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setSelectedLocation(null);
        setSelectedCity(null);
        setCitySubmenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationClick = useCallback((e, loc) => {
    e.preventDefault();
    e.stopPropagation();
    const isUnlocked = loc.unlocked || (loc.unlockLevel && level >= loc.unlockLevel);
    if (!isUnlocked) return;

    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pos = locationPositions[loc.id];
    let menuX = (pos.x / 100) * rect.width + rect.left;
    let menuY = (pos.y / 100) * rect.height + rect.top - 10;

    if (menuX + 220 > window.innerWidth) menuX = window.innerWidth - 230;
    if (menuY + 300 > window.innerHeight) menuY -= 200;
    if (menuX < 10) menuX = 10;
    if (menuY < 10) menuY = 60;

    setMenuPos({ x: menuX - rect.left, y: menuY - rect.top });
    setSelectedLocation(loc.id);
    setSelectedCity(null);
    setCitySubmenu(null);

    const target = locationPositions[loc.id];
    if (target && (target.x !== heroPos.x || target.y !== heroPos.y)) {
      setIsMoving(true);
      setHeroPos(target);
      setCurrentZone(loc.id);
      setTimeout(() => setIsMoving(false), 600);
    }
  }, [level, heroPos]);

  const handleCityClick = useCallback((e, city) => {
    e.preventDefault();
    e.stopPropagation();
    const isCityUnlocked = city.unlocked || (city.unlockLevel && level >= city.unlockLevel);
    if (!isCityUnlocked) return;

    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    const pos = cityPositions[city.id];
    let menuX = (pos.x / 100) * rect.width + rect.left;
    let menuY = (pos.y / 100) * rect.height + rect.top - 10;

    if (menuX + 280 > window.innerWidth) menuX = window.innerWidth - 290;
    if (menuY + 400 > window.innerHeight) menuY -= 250;
    if (menuX < 10) menuX = 10;
    if (menuY < 10) menuY = 60;

    setMenuPos({ x: menuX - rect.left, y: menuY - rect.top });
    setSelectedCity(city.id);
    setSelectedLocation(null);
    setCitySubmenu(null);

    const target = cityPositions[city.id];
    if (target && (target.x !== heroPos.x || target.y !== heroPos.y)) {
      setIsMoving(true);
      setHeroPos(target);
      setTimeout(() => setIsMoving(false), 600);
    }
  }, [level, heroPos]);

  const handleBattle = (locId) => {
    useGameStore.setState({ currentLocation: locId });
    startBattle(locId);
    setSelectedLocation(null);
  };

  const handleBoss = (locId, bossId) => {
    useGameStore.setState({ currentLocation: locId });
    startBossBattle(bossId);
    setSelectedLocation(null);
  };

  const handleRest = () => {
    restAtInn();
    setSelectedLocation(null);
  };

  const toggleHeroActive = (heroId) => {
    if (activeHeroIds.includes(heroId)) {
      if (activeHeroIds.length <= 1) return;
      setActiveHeroes(activeHeroIds.filter(id => id !== heroId));
    } else {
      if (activeHeroIds.length >= 3) return;
      setActiveHeroes([...activeHeroIds, heroId]);
    }
  };

  const HealthBar = ({ current, max, color, label }) => (
    <div style={{ marginBottom: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--muted)', marginBottom: 1 }}>
        <span>{label}</span><span>{current}/{max}</span>
      </div>
      <div style={{ height: 5, background: 'var(--border)', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${(current/max)*100}%`, background: color, borderRadius: 3, transition: 'width 0.3s' }} />
      </div>
    </div>
  );

  const selectedLoc = selectedLocation ? locations.find(l => l.id === selectedLocation) : null;
  const bossDefeated = selectedLoc?.boss ? bossesDefeated.includes(selectedLoc.boss) : false;
  const isCleared = selectedLoc ? locationsCleared.includes(selectedLoc.id) : false;

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', background: '#0b1020' }}>
      <div ref={mapRef} style={{
        width: '100%', height: '100%', position: 'relative',
        backgroundImage: 'url(/backgrounds/world_map.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }} />

        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
          {pathConnections.map(([from, to], idx) => {
            const a = locationPositions[from];
            const b = locationPositions[to];
            const fromUnlocked = unlockedLocs.some(l => l.id === from);
            const toUnlocked = unlockedLocs.some(l => l.id === to);
            const bothUnlocked = fromUnlocked && toUnlocked;
            return (
              <line key={idx}
                x1={`${a.x}%`} y1={`${a.y}%`}
                x2={`${b.x}%`} y2={`${b.y}%`}
                stroke={bothUnlocked ? 'rgba(255,215,0,0.35)' : 'rgba(100,100,120,0.2)'}
                strokeWidth={bothUnlocked ? 2.5 : 1.5}
                strokeDasharray={bothUnlocked ? 'none' : '6 4'}
                style={{ filter: bothUnlocked ? 'drop-shadow(0 0 3px rgba(255,215,0,0.3))' : 'none' }}
              />
            );
          })}
          {cityConnections.map(([cityId, locId], idx) => {
            const cityPos = cityPositions[cityId];
            const locPos = locationPositions[locId];
            if (!cityPos || !locPos) return null;
            const city = cities.find(c => c.id === cityId);
            const isCityUnlocked = city && (city.unlocked || (city.unlockLevel && level >= city.unlockLevel));
            const isLocUnlocked = unlockedLocs.some(l => l.id === locId);
            const bothOk = isCityUnlocked && isLocUnlocked;
            return (
              <line key={`cc_${idx}`}
                x1={`${cityPos.x}%`} y1={`${cityPos.y}%`}
                x2={`${locPos.x}%`} y2={`${locPos.y}%`}
                stroke={bothOk ? 'rgba(74,222,128,0.3)' : 'rgba(100,100,120,0.15)'}
                strokeWidth={bothOk ? 2 : 1}
                strokeDasharray={bothOk ? '6 3' : '4 4'}
                style={{ filter: bothOk ? 'drop-shadow(0 0 2px rgba(74,222,128,0.2))' : 'none' }}
              />
            );
          })}
        </svg>

        {locations.map((loc) => {
          const pos = locationPositions[loc.id];
          if (!pos) return null;
          const isUnlocked = loc.unlocked || (loc.unlockLevel && level >= loc.unlockLevel);
          const cleared = locationsCleared.includes(loc.id);
          const icon = locationIcons[loc.id];
          const isSelected = selectedLocation === loc.id;
          const conquer = (zoneConquer || {})[loc.id] || 0;
          const isConquered = conquer >= 100;
          const circumference = 2 * Math.PI * 26;
          const strokeDash = (conquer / 100) * circumference;

          return (
            <div key={loc.id}
              onClick={(e) => handleLocationClick(e, loc)}
              onContextMenu={(e) => handleLocationClick(e, loc)}
              style={{
                position: 'absolute',
                left: `${pos.x}%`, top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 10 : 3,
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                transition: 'transform 0.2s',
              }}
            >
              <div style={{ position: 'relative', width: 62, height: 62 }}>
                {isUnlocked && conquer > 0 && (
                  <svg width="62" height="62" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                    <circle cx="31" cy="31" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
                    <circle cx="31" cy="31" r="26" fill="none"
                      stroke={isConquered ? 'var(--gold)' : icon.color}
                      strokeWidth="4"
                      strokeDasharray={`${strokeDash} ${circumference}`}
                      strokeLinecap="round"
                      style={{ filter: isConquered ? 'drop-shadow(0 0 4px rgba(255,215,0,0.6))' : 'none', transition: 'stroke-dasharray 0.5s' }}
                    />
                  </svg>
                )}
                <div style={{
                  position: 'absolute', top: 3, left: 3,
                  width: 56, height: 56,
                  borderRadius: '50%',
                  background: isUnlocked
                    ? `radial-gradient(circle, ${icon.glow}, rgba(20,26,43,0.9))`
                    : 'rgba(30,30,50,0.8)',
                  border: `3px solid ${isUnlocked ? (isConquered ? 'var(--gold)' : cleared ? 'var(--gold)' : isSelected ? '#fff' : icon.color) : 'rgba(80,80,100,0.4)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isUnlocked ? '1.6rem' : '1.2rem',
                  opacity: isUnlocked ? 1 : 0.4,
                  boxShadow: isSelected
                    ? `0 0 20px ${icon.glow}, 0 0 40px ${icon.glow}`
                    : isUnlocked
                      ? `0 0 10px ${icon.glow}`
                      : 'none',
                  transition: 'all 0.3s',
                  animation: isSelected ? 'pulse 1.5s infinite' : (cleared ? 'none' : (isUnlocked ? 'glow 3s infinite' : 'none')),
                }}>
                  {isUnlocked ? icon.symbol : '🔒'}
                </div>
                {isUnlocked && conquer > 0 && (
                  <div style={{
                    position: 'absolute', top: -8, right: -8,
                    background: isConquered ? 'var(--gold)' : 'rgba(14,22,48,0.95)',
                    border: `1px solid ${isConquered ? 'var(--gold)' : icon.color}`,
                    borderRadius: 6, padding: '1px 4px',
                    fontSize: '0.5rem', fontWeight: 700,
                    color: isConquered ? '#000' : icon.color,
                    whiteSpace: 'nowrap',
                    boxShadow: isConquered ? '0 0 8px rgba(255,215,0,0.5)' : 'none',
                  }}>
                    {conquer}%
                  </div>
                )}
              </div>
              {isConquered && (
                <div style={{
                  position: 'absolute', top: -2, right: -22,
                  width: 32, height: 32, overflow: 'hidden',
                  imageRendering: 'pixelated',
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
                }}>
                  <div style={{
                    width: 256, height: 32,
                    backgroundImage: 'url(/sprites/idle_worker.png)',
                    backgroundSize: '256px 32px',
                    imageRendering: 'pixelated',
                    animation: 'workerIdle 1.6s steps(8) infinite',
                  }} />
                </div>
              )}
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                marginTop: 4, whiteSpace: 'nowrap', textAlign: 'center',
              }}>
                <div className="font-cinzel" style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  color: isUnlocked ? (isConquered ? 'var(--gold)' : cleared ? 'var(--gold)' : '#fff') : 'rgba(150,150,170,0.5)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
                }}>
                  {loc.name}
                </div>
                {isUnlocked && (
                  <div style={{
                    fontSize: '0.55rem', color: icon.color,
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  }}>
                    Lv.{loc.levelRange[0]}-{loc.levelRange[1]}
                    {loc.boss && !bossesDefeated.includes(loc.boss) && ' ⚠'}
                    {cleared && ' ✓'}
                  </div>
                )}
                {!isUnlocked && loc.unlockLevel && (
                  <div style={{
                    fontSize: '0.5rem', color: 'rgba(150,150,170,0.4)',
                    textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                  }}>
                    Lv.{loc.unlockLevel}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {locations.filter(loc => loc.boss && !bossesDefeated.includes(loc.boss)).map(loc => {
          const pos = locationPositions[loc.id];
          if (!pos) return null;
          const isLocUnlocked = loc.unlocked || (loc.unlockLevel && level >= loc.unlockLevel);
          if (!isLocUnlocked) return null;
          const bossStyle = bossMapSprites[loc.boss] || {};
          const spriteData = getEnemySprite(loc.boss);
          const corruptedSprite = { ...spriteData, filter: bossStyle.filter || 'hue-rotate(180deg) saturate(2) brightness(0.5)' };
          const bossX = pos.x + 3.5;
          const bossY = pos.y - 4.5;

          return (
            <div key={`boss_${loc.boss}`} style={{
              position: 'absolute',
              left: `${Math.max(4, Math.min(96, bossX))}%`,
              top: `${Math.max(4, Math.min(96, bossY))}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 4,
              pointerEvents: 'none',
            }}>
              <div style={{
                position: 'relative',
                width: 80, height: 80,
                overflow: 'hidden',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                filter: `drop-shadow(0 0 12px ${bossStyle.glow || 'rgba(255,0,0,0.5)'})`,
                animation: 'glow 2s infinite',
              }}>
                <SpriteAnimation
                  spriteData={corruptedSprite}
                  animation="idle"
                  scale={2.0}
                  flip={true}
                  speed={180}
                />
              </div>
              <div style={{
                width: 30, height: 6, borderRadius: '50%', margin: '-2px auto 0',
                background: `radial-gradient(ellipse, ${bossStyle.glow || 'rgba(255,0,0,0.4)'}, transparent)`,
              }} />
              <div className="font-cinzel" style={{
                textAlign: 'center',
                fontSize: '0.5rem', fontWeight: 700,
                color: bossStyle.glow ? bossStyle.glow.replace('0.5', '1').replace('0.6', '1').replace('0.7', '1') : '#ff4444',
                textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
                whiteSpace: 'nowrap', marginTop: 2,
              }}>
                BOSS
              </div>
            </div>
          );
        })}

        {cities.map((city) => {
          const pos = cityPositions[city.id];
          if (!pos) return null;
          const isCityUnlocked = city.unlocked || (city.unlockLevel && level >= city.unlockLevel);
          const isSelected = selectedCity === city.id;

          return (
            <div key={city.id}
              onClick={(e) => handleCityClick(e, city)}
              style={{
                position: 'absolute',
                left: `${pos.x}%`, top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                zIndex: isSelected ? 10 : 3,
                cursor: isCityUnlocked ? 'pointer' : 'not-allowed',
              }}
            >
              <div style={{ position: 'relative', width: 58, height: 58 }}>
                <div style={{
                  width: 52, height: 52, margin: '3px',
                  borderRadius: '50%',
                  background: isCityUnlocked
                    ? 'radial-gradient(circle, rgba(74,222,128,0.25), rgba(20,26,43,0.9))'
                    : 'rgba(30,30,50,0.8)',
                  border: `3px solid ${isCityUnlocked ? (isSelected ? '#fff' : '#4ade80') : 'rgba(80,80,100,0.4)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isCityUnlocked ? '1.4rem' : '1rem',
                  opacity: isCityUnlocked ? 1 : 0.4,
                  boxShadow: isSelected
                    ? '0 0 20px rgba(74,222,128,0.5), 0 0 40px rgba(74,222,128,0.3)'
                    : isCityUnlocked
                      ? '0 0 10px rgba(74,222,128,0.3)'
                      : 'none',
                  transition: 'all 0.3s',
                  animation: isSelected ? 'pulse 1.5s infinite' : (isCityUnlocked ? 'glow 3s infinite' : 'none'),
                }}>
                  {isCityUnlocked ? city.icon : '🔒'}
                </div>
              </div>
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                marginTop: 4, whiteSpace: 'nowrap', textAlign: 'center',
              }}>
                <div className="font-cinzel" style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  color: isCityUnlocked ? '#4ade80' : 'rgba(150,150,170,0.5)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.9), 0 0 8px rgba(0,0,0,0.7)',
                }}>
                  {city.name}
                </div>
                {isCityUnlocked && (
                  <div style={{ fontSize: '0.5rem', color: 'rgba(74,222,128,0.7)', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                    City
                  </div>
                )}
                {!isCityUnlocked && city.unlockLevel && (
                  <div style={{ fontSize: '0.5rem', color: 'rgba(150,150,170,0.4)', textShadow: '0 1px 3px rgba(0,0,0,0.9)' }}>
                    Lv.{city.unlockLevel}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {heroRoster.filter(h => activeHeroIds.includes(h.id)).map((hero, idx) => {
          const zonePos = cityPositions[currentZone] || locationPositions[currentZone] || locationPositions.verdant_plains;
          const offset = wanderOffsets[hero.id] || { x: 0, y: 0 };
          const baseOffsetX = (idx - 1) * 1.8;
          const baseOffsetY = -2.5 - idx * 1;
          const clampedX = Math.max(4, Math.min(96, zonePos.x + baseOffsetX + offset.x));
          const clampedY = Math.max(8, Math.min(92, zonePos.y + baseOffsetY + offset.y));
          const walk = heroWalking[hero.id];
          const isWalking = walk?.moving;
          const flipX = walk?.flipX;
          return (
            <div key={hero.id} style={{
              position: 'absolute',
              left: `${clampedX}%`,
              top: `${clampedY}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 5,
              transition: 'left 1.8s ease-in-out, top 1.8s ease-in-out',
            }}>
              <div style={{
                width: 48, height: 48, overflow: 'hidden',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))',
              }}>
                <SpriteAnimation
                  spriteData={getPlayerSprite(hero.classId, hero.raceId)}
                  animation={isWalking ? 'walk' : 'idle'}
                  flip={isWalking && flipX}
                  scale={0.48}
                  speed={isWalking ? 100 : (150 + idx * 30)}
                />
              </div>
              <div style={{
                width: 16, height: 4, borderRadius: '50%', margin: '-1px auto 0',
                background: 'radial-gradient(ellipse, rgba(0,0,0,0.5), transparent)',
              }} />
              <div style={{
                textAlign: 'center',
                fontSize: '0.45rem', color: 'var(--accent)', fontWeight: 700, whiteSpace: 'nowrap',
                textShadow: '0 1px 3px rgba(0,0,0,0.9)', marginTop: 1,
              }}>{hero.name}</div>
            </div>
          );
        })}

        {selectedLoc && (
          <div ref={menuRef} style={{
            position: 'absolute',
            left: menuPos.x, top: menuPos.y,
            zIndex: 20,
            background: 'linear-gradient(135deg, rgba(14,22,48,0.97), rgba(20,26,43,0.97))',
            border: `2px solid ${locationIcons[selectedLoc.id]?.color || 'var(--accent)'}`,
            borderRadius: 14,
            padding: 0,
            minWidth: 220,
            boxShadow: `0 8px 40px rgba(0,0,0,0.8), 0 0 20px ${locationIcons[selectedLoc.id]?.glow || 'rgba(110,231,183,0.2)'}`,
            animation: 'fadeIn 0.15s ease-out',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '14px 16px 10px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              background: `linear-gradient(135deg, ${locationIcons[selectedLoc.id]?.glow || 'rgba(0,0,0,0.2)'}, transparent)`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: '1.4rem' }}>{selectedLoc.icon}</span>
                <div>
                  <div className="font-cinzel" style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>
                    {selectedLoc.name}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--muted)' }}>
                    Level {selectedLoc.levelRange[0]}-{selectedLoc.levelRange[1]}
                    {isCleared && <span style={{ color: 'var(--gold)', marginLeft: 6 }}>Cleared</span>}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                {selectedLoc.description}
              </div>
              {(() => {
                const selConquer = (zoneConquer || {})[selectedLoc.id] || 0;
                if (selConquer <= 0) return null;
                const xpMod = Math.floor(selConquer * 0.7);
                const harvestMod = Math.floor((selConquer / 100) * 300);
                return (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>Conquered</span>
                      <span style={{ fontSize: '0.6rem', fontWeight: 700, color: selConquer >= 100 ? 'var(--gold)' : locationIcons[selectedLoc.id]?.color }}>{selConquer}%</span>
                    </div>
                    <div style={{ height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${selConquer}%`, borderRadius: 3,
                        background: selConquer >= 100
                          ? 'linear-gradient(90deg, var(--gold), #ffed4a)'
                          : `linear-gradient(90deg, ${locationIcons[selectedLoc.id]?.color}, ${locationIcons[selectedLoc.id]?.glow})`,
                        transition: 'width 0.3s',
                        boxShadow: selConquer >= 100 ? '0 0 8px rgba(255,215,0,0.5)' : 'none',
                      }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                      <span style={{ fontSize: '0.5rem', color: '#ef4444' }}>XP -{xpMod}%</span>
                      <span style={{ fontSize: '0.5rem', color: '#22c55e' }}>Harvest +{harvestMod}%</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div style={{ padding: '8px' }}>
              <MenuButton
                icon="⚔️" label="Hunt Monsters" sublabel={`Fight Lv.${selectedLoc.levelRange[0]}-${selectedLoc.levelRange[1]} enemies`}
                color="var(--accent)" onClick={() => handleBattle(selectedLoc.id)}
              />

              {selectedLoc.boss && !bossDefeated && (
                <MenuButton
                  icon="👑" label="Challenge Boss" sublabel={`Defeat the ${selectedLoc.boss.replace('_', ' ')}`}
                  color="#ef4444" onClick={() => handleBoss(selectedLoc.id, selectedLoc.boss)}
                  glow
                />
              )}

              {selectedLoc.boss && bossDefeated && (
                <div style={{
                  padding: '8px 12px', margin: '4px 0', borderRadius: 8,
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                  color: 'var(--success)', fontSize: '0.75rem', textAlign: 'center',
                }}>
                  ✅ Boss Defeated
                </div>
              )}

              <MenuButton
                icon="🏨" label="Rest at Inn" sublabel={`Heal party (${level * 5}g)`}
                color="#60a5fa" onClick={handleRest}
              />

              <MenuButton
                icon="🏕️" label="Visit Location" sublabel="Explore this area"
                color="#c084fc" onClick={() => {
                  enterLocation(selectedLoc.id);
                  setSelectedLocation(null);
                }}
              />

              <MenuButton
                icon="🛒" label="Trade" sublabel="Buy supplies & sell loot"
                color="var(--gold)" onClick={() => {
                  setSelectedLocation(null);
                }}
                disabled
              />
            </div>

            <div style={{
              padding: '6px 16px 10px', borderTop: '1px solid rgba(255,255,255,0.05)',
              textAlign: 'center',
            }}>
              <span style={{ fontSize: '0.6rem', color: 'rgba(150,150,170,0.4)' }}>
                Click anywhere to close
              </span>
            </div>
          </div>
        )}

        {selectedCity && (() => {
          const city = cities.find(c => c.id === selectedCity);
          if (!city) return null;

          const cityMissions = missionTemplates.filter(m => m.cityId === city.id && level >= m.levelRange[0]);
          const cityArenas = arenaTemplates.filter(a => a.cityId === city.id && level >= a.levelRange[0]);

          return (
            <div ref={menuRef} style={{
              position: 'absolute',
              left: menuPos.x, top: menuPos.y,
              zIndex: 20,
              background: 'linear-gradient(135deg, rgba(14,22,48,0.97), rgba(20,26,43,0.97))',
              border: '2px solid #4ade80',
              borderRadius: 14,
              padding: 0,
              minWidth: 260, maxWidth: 320,
              maxHeight: '70vh', overflowY: 'auto',
              boxShadow: '0 8px 40px rgba(0,0,0,0.8), 0 0 20px rgba(74,222,128,0.3)',
              animation: 'fadeIn 0.15s ease-out',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '14px 16px 10px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'linear-gradient(135deg, rgba(74,222,128,0.15), transparent)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '1.4rem' }}>{city.icon}</span>
                  <div>
                    <div className="font-cinzel" style={{ color: '#4ade80', fontSize: '0.95rem', fontWeight: 700 }}>
                      {city.name}
                    </div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--muted)' }}>City</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--muted)', lineHeight: 1.4 }}>
                  {city.description}
                </div>
              </div>

              {!citySubmenu && (
                <div style={{ padding: '8px' }}>
                  <MenuButton
                    icon="🏟️" label="Arena" sublabel={`${cityArenas.length} challenge${cityArenas.length !== 1 ? 's' : ''} available`}
                    color="#f97316" onClick={() => setCitySubmenu('arena')}
                    disabled={cityArenas.length === 0}
                  />
                  <MenuButton
                    icon="📜" label="Missions" sublabel={`${cityMissions.length} mission${cityMissions.length !== 1 ? 's' : ''} available`}
                    color="#c084fc" onClick={() => setCitySubmenu('missions')}
                    disabled={cityMissions.length === 0}
                  />
                  <MenuButton
                    icon="🛒" label="Trade" sublabel="Buy supplies & sell loot"
                    color="var(--gold)" onClick={() => {
                      setCitySubmenu('trade');
                      setTradeTab('buy');
                      if (shopInventory.length === 0) refreshShop();
                    }}
                  />
                  <MenuButton
                    icon="🏨" label="Rest" sublabel={`Heal party (${city.innCost}g)`}
                    color="#60a5fa" onClick={() => {
                      restAtInn(city.innCost);
                      setSelectedCity(null);
                      setCitySubmenu(null);
                    }}
                  />
                  <MenuButton
                    icon="🔧" label="Upgrade" sublabel="Enhance equipment tiers"
                    color="#22d3ee" onClick={() => { setCitySubmenu('upgrade'); setUpgradeHeroId(null); setUpgradeMsg(null); }}
                  />
                </div>
              )}

              {citySubmenu === 'arena' && (
                <div style={{ padding: '8px' }}>
                  <button onClick={() => setCitySubmenu(null)} style={{
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                    fontSize: '0.65rem', padding: '4px 8px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    ← Back
                  </button>
                  <div className="font-cinzel" style={{ color: '#f97316', fontSize: '0.8rem', fontWeight: 700, padding: '0 8px 6px' }}>
                    Arena Challenges
                  </div>
                  {cityArenas.length === 0 && (
                    <div style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.7rem', textAlign: 'center', fontStyle: 'italic' }}>
                      No challenges available at your level.
                    </div>
                  )}
                  {cityArenas.map(arena => (
                    <div key={arena.id} style={{
                      background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.15)',
                      borderRadius: 8, padding: '10px 12px', marginBottom: 6, cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                      onClick={() => { startArenaBattle(arena.id); setSelectedCity(null); setCitySubmenu(null); }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.15)'; e.currentTarget.style.borderColor = '#f97316'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.06)'; e.currentTarget.style.borderColor = 'rgba(249,115,22,0.15)'; }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ color: '#f97316', fontWeight: 700, fontSize: '0.75rem' }}>🏟️ {arena.title}</span>
                        <span style={{ color: 'var(--muted)', fontSize: '0.55rem' }}>Lv.{arena.levelRange[0]}-{arena.levelRange[1]}</span>
                      </div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.65rem', marginBottom: 6 }}>{arena.description}</div>
                      <div style={{ display: 'flex', gap: 8, fontSize: '0.55rem' }}>
                        <span style={{ color: 'var(--gold)' }}>💰 {arena.rewards.gold}g</span>
                        <span style={{ color: 'var(--accent)' }}>✨ {arena.rewards.xp} XP</span>
                        <span style={{ color: 'var(--muted)' }}>👹 {arena.enemies.length} enemies</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {citySubmenu === 'missions' && (
                <div style={{ padding: '8px' }}>
                  <button onClick={() => setCitySubmenu(null)} style={{
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                    fontSize: '0.65rem', padding: '4px 8px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    ← Back
                  </button>
                  <div className="font-cinzel" style={{ color: '#c084fc', fontSize: '0.8rem', fontWeight: 700, padding: '0 8px 6px' }}>
                    Available Missions
                  </div>
                  {cityMissions.length === 0 && (
                    <div style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.7rem', textAlign: 'center', fontStyle: 'italic' }}>
                      No missions available at your level.
                    </div>
                  )}
                  {cityMissions.map(mission => {
                    const isCompleted = (completedMissions || []).includes(mission.id);
                    return (
                      <div key={mission.id} style={{
                        background: isCompleted ? 'rgba(34,197,94,0.06)' : 'rgba(192,132,252,0.06)',
                        border: `1px solid ${isCompleted ? 'rgba(34,197,94,0.2)' : 'rgba(192,132,252,0.15)'}`,
                        borderRadius: 8, padding: '10px 12px', marginBottom: 6, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                        onClick={() => { startMissionBattle(mission.id); setSelectedCity(null); setCitySubmenu(null); }}
                        onMouseEnter={e => { e.currentTarget.style.background = isCompleted ? 'rgba(34,197,94,0.12)' : 'rgba(192,132,252,0.15)'; e.currentTarget.style.borderColor = isCompleted ? '#22c55e' : '#c084fc'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = isCompleted ? 'rgba(34,197,94,0.06)' : 'rgba(192,132,252,0.06)'; e.currentTarget.style.borderColor = isCompleted ? 'rgba(34,197,94,0.2)' : 'rgba(192,132,252,0.15)'; }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ color: isCompleted ? '#22c55e' : '#c084fc', fontWeight: 700, fontSize: '0.75rem' }}>
                            📜 {mission.title}
                          </span>
                          {isCompleted && <span style={{ color: '#22c55e', fontSize: '0.55rem', fontWeight: 600 }}>✓ Done</span>}
                        </div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.65rem', marginBottom: 6, lineHeight: 1.3 }}>{mission.description}</div>
                        <div style={{ display: 'flex', gap: 8, fontSize: '0.55rem', flexWrap: 'wrap' }}>
                          <span style={{ color: 'var(--gold)' }}>💰 {mission.rewards.gold}g</span>
                          <span style={{ color: 'var(--accent)' }}>✨ {mission.rewards.xp} XP</span>
                          <span style={{ color: 'var(--muted)' }}>⚔ {mission.rounds.length} round{mission.rounds.length > 1 ? 's' : ''}</span>
                          <span style={{ color: 'var(--muted)' }}>Lv.{mission.levelRange[0]}-{mission.levelRange[1]}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {citySubmenu === 'upgrade' && (
                <div style={{ padding: '8px' }}>
                  <button onClick={() => { setCitySubmenu(null); setUpgradeHeroId(null); setUpgradeMsg(null); }} style={{
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                    fontSize: '0.65rem', padding: '4px 8px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    ← Back
                  </button>
                  <div className="font-cinzel" style={{ color: '#22d3ee', fontSize: '0.8rem', fontWeight: 700, padding: '0 8px 6px' }}>
                    Equipment Upgrade
                  </div>

                  {!upgradeHeroId ? (
                    <div>
                      <div style={{ color: 'var(--muted)', fontSize: '0.65rem', padding: '0 8px 8px' }}>
                        Select a hero to upgrade their gear:
                      </div>
                      {heroRoster.map(hero => (
                        <div key={hero.id} style={{
                          background: 'rgba(34,211,238,0.06)', border: '1px solid rgba(34,211,238,0.15)',
                          borderRadius: 8, padding: '8px 12px', marginBottom: 4, cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                          onClick={() => setUpgradeHeroId(hero.id)}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.15)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(34,211,238,0.06)'; }}
                        >
                          <span style={{ color: '#22d3ee', fontWeight: 700, fontSize: '0.75rem' }}>
                            {hero.name}
                          </span>
                          <span style={{ color: 'var(--muted)', fontSize: '0.6rem', marginLeft: 8 }}>
                            Lv.{hero.level} {classDefinitions[hero.classId]?.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <button onClick={() => { setUpgradeHeroId(null); setUpgradeMsg(null); }} style={{
                        background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                        fontSize: '0.6rem', padding: '2px 8px', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4,
                      }}>
                        ← Heroes
                      </button>
                      {upgradeMsg && (
                        <div style={{
                          background: upgradeMsg.success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                          border: `1px solid ${upgradeMsg.success ? '#22c55e' : '#ef4444'}`,
                          borderRadius: 6, padding: '6px 10px', marginBottom: 8,
                          color: upgradeMsg.success ? '#22c55e' : '#ef4444', fontSize: '0.65rem',
                        }}>
                          {upgradeMsg.text}
                        </div>
                      )}
                      <div style={{ color: 'var(--gold)', fontSize: '0.65rem', padding: '0 4px 6px' }}>
                        Gold: {gold}g
                      </div>
                      {(() => {
                        const upgradeHero = heroRoster.find(h => h.id === upgradeHeroId);
                        if (!upgradeHero) return null;
                        return EQUIPMENT_SLOTS.map(slot => {
                          const item = (upgradeHero.equipment || {})[slot];
                          if (!item) return (
                            <div key={slot} style={{
                              background: 'rgba(0,0,0,0.2)', borderRadius: 6, padding: '8px 10px', marginBottom: 4,
                              border: '1px solid rgba(255,255,255,0.05)', opacity: 0.5,
                            }}>
                              <span style={{ color: 'var(--muted)', fontSize: '0.65rem', textTransform: 'capitalize' }}>
                                {slot}: Empty
                              </span>
                            </div>
                          );
                          const tierDef = TIERS[item.tier] || TIERS[1];
                          const nextTier = item.tier < 8 ? TIERS[item.tier + 1] : null;
                          const cost = UPGRADE_COSTS[item.tier];
                          const canAfford = cost && gold >= cost;
                          const isMaxTier = item.tier >= 8;
                          return (
                            <div key={slot} style={{
                              background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: '8px 10px', marginBottom: 4,
                              border: `1px solid ${tierDef.color}30`,
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <div>
                                  <span style={{ fontSize: '1rem', marginRight: 6 }}>{item.icon}</span>
                                  <span style={{ color: tierDef.color, fontWeight: 700, fontSize: '0.72rem' }}>
                                    {item.name}
                                  </span>
                                  <span style={{
                                    fontSize: '0.6rem', marginLeft: 6, padding: '1px 5px',
                                    background: tierDef.color + '20', color: tierDef.color,
                                    borderRadius: 4, fontWeight: 600,
                                  }}>
                                    T{item.tier || 1}
                                  </span>
                                </div>
                              </div>
                              <div style={{ color: '#22c55e', fontSize: '0.6rem', marginBottom: 4 }}>
                                {Object.entries(item.stats || {}).slice(0, 3).map(([k, v]) => `+${v} ${k}`).join(', ')}
                              </div>
                              {isMaxTier ? (
                                <div style={{ color: '#f472b6', fontSize: '0.6rem', fontWeight: 600 }}>
                                  Max Tier Reached
                                </div>
                              ) : (
                                <button
                                  onClick={() => {
                                    const result = upgradeEquipment(upgradeHeroId, slot);
                                    if (result.success) {
                                      setUpgradeMsg({ success: true, text: `Upgraded to T${result.newTier}! (-${result.cost}g)` });
                                    } else {
                                      setUpgradeMsg({ success: false, text: result.reason });
                                    }
                                  }}
                                  disabled={!canAfford}
                                  style={{
                                    background: canAfford ? 'linear-gradient(135deg, #0891b2, #22d3ee)' : 'rgba(100,100,100,0.3)',
                                    color: canAfford ? '#000' : 'var(--muted)',
                                    border: 'none', borderRadius: 6, padding: '4px 12px',
                                    fontSize: '0.65rem', fontWeight: 700, cursor: canAfford ? 'pointer' : 'not-allowed',
                                    width: '100%',
                                  }}
                                >
                                  Upgrade to T{item.tier + 1} ({cost}g)
                                  {nextTier && <span style={{ opacity: 0.7, marginLeft: 4 }}>→ <span style={{ color: canAfford ? nextTier.color : 'inherit' }}>{nextTier.name}</span></span>}
                                </button>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              )}

              {citySubmenu === 'trade' && (
                <div style={{ padding: '8px' }}>
                  <button onClick={() => { setCitySubmenu(null); setTradeTab('buy'); }} style={{
                    background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                    fontSize: '0.65rem', padding: '4px 8px', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    ← Back
                  </button>
                  <div className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.8rem', fontWeight: 700, padding: '0 8px 6px' }}>
                    Merchant
                  </div>
                  <div style={{ color: 'var(--gold)', fontSize: '0.65rem', padding: '0 8px 6px' }}>
                    Gold: {gold}g
                  </div>

                  <div style={{ display: 'flex', gap: 4, padding: '0 8px 8px' }}>
                    <button onClick={() => setTradeTab('buy')} style={{
                      flex: 1, padding: '5px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                      fontSize: '0.7rem', fontWeight: 700,
                      background: tradeTab === 'buy' ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'rgba(255,255,255,0.06)',
                      color: tradeTab === 'buy' ? '#000' : 'var(--muted)',
                    }}>Buy</button>
                    <button onClick={() => setTradeTab('sell')} style={{
                      flex: 1, padding: '5px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                      fontSize: '0.7rem', fontWeight: 700,
                      background: tradeTab === 'sell' ? 'linear-gradient(135deg, #16a34a, #22c55e)' : 'rgba(255,255,255,0.06)',
                      color: tradeTab === 'sell' ? '#000' : 'var(--muted)',
                    }}>Sell</button>
                    <button onClick={() => refreshShop()} style={{
                      padding: '5px 10px', border: 'none', borderRadius: 6, cursor: 'pointer',
                      fontSize: '0.65rem', fontWeight: 600,
                      background: 'rgba(255,255,255,0.06)', color: 'var(--muted)',
                    }}>Refresh</button>
                  </div>

                  <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                    {tradeTab === 'buy' && (
                      <>
                        {shopInventory.length === 0 && (
                          <div style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.7rem', textAlign: 'center', fontStyle: 'italic' }}>
                            The merchant has nothing for sale. Try refreshing.
                          </div>
                        )}
                        {shopInventory.map(item => {
                          const price = getItemPrice(item);
                          const canAfford = gold >= price;
                          const tierDef = TIERS[item.tier] || TIERS[1];
                          return (
                            <div key={item.id} style={{
                              background: 'rgba(217,119,6,0.06)', border: '1px solid rgba(217,119,6,0.15)',
                              borderRadius: 8, padding: '8px 10px', marginBottom: 4,
                              transition: 'all 0.15s',
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: tierDef.color }}>
                                  {item.icon} {item.name}
                                </span>
                                <span style={{ fontSize: '0.55rem', color: tierDef.color, fontWeight: 600 }}>
                                  T{item.tier} {tierDef.name}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.58rem', color: 'var(--muted)', marginBottom: 4, textTransform: 'capitalize' }}>
                                {item.slot}{item.weaponType ? ` - ${item.weaponType}` : ''}{item.armorType ? ` - ${item.armorType}` : ''}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 8px', fontSize: '0.55rem', color: '#a5b4fc', marginBottom: 6 }}>
                                {item.stats && Object.entries(item.stats).map(([k, v]) => (
                                  <span key={k}>+{v} {k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                ))}
                              </div>
                              <button
                                onClick={() => { if (canAfford) buyItem(item.id); }}
                                disabled={!canAfford}
                                style={{
                                  width: '100%', padding: '4px 0', border: 'none', borderRadius: 6, cursor: canAfford ? 'pointer' : 'not-allowed',
                                  fontSize: '0.65rem', fontWeight: 700,
                                  background: canAfford ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'rgba(100,100,100,0.3)',
                                  color: canAfford ? '#000' : 'var(--muted)',
                                }}
                              >
                                Buy - {price}g
                              </button>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {tradeTab === 'sell' && (
                      <>
                        {inventory.length === 0 && (
                          <div style={{ padding: '12px', color: 'var(--muted)', fontSize: '0.7rem', textAlign: 'center', fontStyle: 'italic' }}>
                            Your inventory is empty.
                          </div>
                        )}
                        {inventory.map(item => {
                          const price = getSellPrice(item);
                          const tierDef = TIERS[item.tier] || TIERS[1];
                          return (
                            <div key={item.id} style={{
                              background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)',
                              borderRadius: 8, padding: '8px 10px', marginBottom: 4,
                              transition: 'all 0.15s',
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: tierDef.color }}>
                                  {item.icon} {item.name}
                                </span>
                                <span style={{ fontSize: '0.55rem', color: tierDef.color, fontWeight: 600 }}>
                                  T{item.tier} {tierDef.name}
                                </span>
                              </div>
                              <div style={{ fontSize: '0.58rem', color: 'var(--muted)', marginBottom: 4, textTransform: 'capitalize' }}>
                                {item.slot}{item.weaponType ? ` - ${item.weaponType}` : ''}{item.armorType ? ` - ${item.armorType}` : ''}
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 8px', fontSize: '0.55rem', color: '#a5b4fc', marginBottom: 6 }}>
                                {item.stats && Object.entries(item.stats).map(([k, v]) => (
                                  <span key={k}>+{v} {k.replace(/([A-Z])/g, ' $1').trim()}</span>
                                ))}
                              </div>
                              <button
                                onClick={() => sellItem(item.id)}
                                style={{
                                  width: '100%', padding: '4px 0', border: 'none', borderRadius: 6, cursor: 'pointer',
                                  fontSize: '0.65rem', fontWeight: 700,
                                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                                  color: '#000',
                                }}
                              >
                                Sell - {price}g
                              </button>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div style={{
                padding: '6px 16px 10px', borderTop: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '0.6rem', color: 'rgba(150,150,170,0.4)' }}>
                  Click anywhere to close
                </span>
              </div>
            </div>
          );
        })()}

        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          background: 'linear-gradient(180deg, rgba(10,14,30,0.92) 0%, rgba(10,14,30,0.7) 70%, transparent 100%)',
          padding: '10px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 8, zIndex: 15,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 60, height: 60, overflow: 'hidden' }}>
              <SpriteAnimation spriteData={getPlayerSprite(playerClass, playerRace)} animation="idle" scale={1.8} speed={150} />
            </div>
            <div>
              <div className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.9rem', fontWeight: 700 }}>{playerName}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.65rem' }}>Lv.{level} {raceDef?.name} {cls?.name}</div>
            </div>
            <div style={{ minWidth: 100, marginLeft: 8 }}>
              <HealthBar current={playerHealth} max={playerMaxHealth} color="#22c55e" label="HP" />
              <HealthBar current={playerMana} max={playerMaxMana} color="#3b82f6" label="MP" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{
              background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '4px 10px',
              border: '1px solid rgba(255,215,0,0.2)',
            }}>
              <span style={{ color: 'var(--gold)', fontWeight: 600, fontSize: '0.8rem' }}>💰 {gold}</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.6rem', marginLeft: 8 }}>XP: {xp}/{xpToNext}</span>
            </div>

            {(unspentPoints > 0 || skillPoints > 0 || heroRoster.some(h => (h.unspentPoints || 0) > 0 || (h.skillPoints || 0) > 0)) && (
              <button onClick={() => setScreen('account')} style={{
                background: 'rgba(239,68,68,0.2)', border: '1px solid var(--danger)',
                borderRadius: 8, padding: '4px 10px', color: 'var(--danger)',
                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, animation: 'glow 2s infinite'
              }}>
                Points!
              </button>
            )}

            <button onClick={() => setScreen('account')} style={{
              background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))',
              border: '1px solid var(--gold)', borderRadius: 8,
              padding: '4px 10px', color: 'var(--gold)', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
            }}>⚔ Council</button>

            <button onClick={() => setShowWarParty(!showWarParty)} style={{
              background: showWarParty ? 'rgba(110,231,183,0.2)' : 'rgba(110,231,183,0.08)',
              border: `1px solid ${showWarParty ? 'var(--accent)' : 'rgba(110,231,183,0.3)'}`,
              borderRadius: 8, padding: '4px 10px', color: 'var(--accent)',
              cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
            }}>🛡 Party ({activeHeroIds.length}/3)</button>

            {harvestNodes && harvestNodes.length > 0 && level >= 1 && (
              <button onClick={() => setShowHarvest(!showHarvest)} style={{
                background: showHarvest ? 'rgba(251,191,36,0.2)' : 'rgba(251,191,36,0.08)',
                border: `1px solid ${showHarvest ? 'var(--gold)' : 'rgba(251,191,36,0.3)'}`,
                borderRadius: 8, padding: '4px 10px', color: 'var(--gold)',
                cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600,
              }}>⛏ Harvest</button>
            )}
          </div>
        </div>

        {showWarParty && (
          <div style={{
            position: 'absolute', top: 70, right: 12, zIndex: 16,
            background: 'rgba(14,22,48,0.95)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 14, maxWidth: 340,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            animation: 'fadeIn 0.15s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h4 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.85rem', margin: 0 }}>
                War Party ({activeHeroIds.length}/3)
              </h4>
              {canCreateNewHero && (
                <button onClick={() => setScreen('heroCreate')} style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,215,0,0.1))',
                  border: '1px solid var(--gold)', borderRadius: 6, padding: '3px 10px',
                  color: 'var(--gold)', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
                }}>+ Recruit</button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {heroRoster.map(hero => {
                const heroCls = classDefinitions[hero.classId];
                const heroRace = hero.raceId ? raceDefinitions[hero.raceId] : null;
                const isActive = activeHeroIds.includes(hero.id);
                const heroStats = heroCls ? getHeroStatsWithBonuses(hero) : null;
                return (
                  <div key={hero.id} onClick={() => toggleHeroActive(hero.id)} style={{
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(110,231,183,0.15), rgba(110,231,183,0.05))'
                      : 'rgba(42,49,80,0.3)',
                    border: `2px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                    borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                    transition: 'all 0.2s', minWidth: 90, textAlign: 'center',
                    opacity: isActive ? 1 : 0.6,
                  }}>
                    <SpriteAnimation spriteData={getPlayerSprite(hero.classId, hero.raceId)} animation="idle" scale={1.4} speed={150} />
                    <div style={{ fontSize: '0.6rem', fontWeight: 700, color: isActive ? 'var(--accent)' : 'var(--muted)', marginTop: 2 }}>
                      {hero.name}
                    </div>
                    <div style={{ fontSize: '0.5rem', color: 'var(--muted)' }}>
                      Lv.{hero.level} {heroRace?.name} {heroCls?.name}
                    </div>
                    {heroStats && (
                      <div style={{ marginTop: 3, height: 3, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(hero.currentHealth / heroStats.health) * 100}%`, background: '#22c55e', borderRadius: 2 }} />
                      </div>
                    )}
                    <div style={{ fontSize: '0.45rem', marginTop: 2, color: isActive ? 'var(--accent)' : 'var(--muted)', fontWeight: 600 }}>
                      {isActive ? 'ACTIVE' : 'RESERVE'}
                    </div>
                  </div>
                );
              })}
              {canCreateNewHero && (
                <div onClick={() => setScreen('heroCreate')} style={{
                  background: 'rgba(255,215,0,0.05)', border: '2px dashed var(--gold)',
                  borderRadius: 8, padding: '6px 8px', cursor: 'pointer',
                  minWidth: 90, textAlign: 'center', opacity: 0.6, minHeight: 70,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ fontSize: '1.2rem', color: 'var(--gold)' }}>+</div>
                  <div style={{ fontSize: '0.55rem', color: 'var(--gold)' }}>Recruit</div>
                  <div style={{ fontSize: '0.45rem', color: 'var(--muted)' }}>{heroRoster.length}/{maxHeroSlots}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {showHarvest && harvestNodes && (
          <div style={{
            position: 'absolute', top: 70, right: 12, zIndex: 16,
            background: 'rgba(14,22,48,0.95)', border: '1px solid var(--border)',
            borderRadius: 12, padding: 14, maxWidth: 360,
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
            animation: 'fadeIn 0.15s ease-out',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h4 className="font-cinzel" style={{ color: 'var(--gold)', fontSize: '0.85rem', margin: 0 }}>Auto Harvest</h4>
              <div style={{ display: 'flex', gap: 6, fontSize: '0.6rem' }}>
                {Object.entries(harvestResources).filter(([k, v]) => v > 0 || k === 'gold').map(([k, v]) => (
                  <span key={k} style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)', color: 'var(--muted)' }}>
                    {k === 'gold' ? '💰' : k === 'herbs' ? '🌿' : k === 'wood' ? '🪵' : k === 'ore' ? '🪨' : '💎'} {Math.floor(v)}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              {harvestNodes.filter(n => level >= n.unlockLevel).map(node => {
                const assignedHeroId = activeHarvests[node.id];
                const assignedHero = assignedHeroId ? heroRoster.find(h => h.id === assignedHeroId) : null;
                const availableHeroes = heroRoster.filter(h =>
                  !activeHeroIds.includes(h.id) && !Object.values(activeHarvests).includes(h.id)
                );
                return (
                  <div key={node.id} style={{
                    background: assignedHero ? 'rgba(34,197,94,0.08)' : 'rgba(42,49,80,0.3)',
                    border: `1px solid ${assignedHero ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                    borderRadius: 6, padding: '8px 10px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: '1rem' }}>{node.icon}</span>
                      <div>
                        <div style={{ color: 'var(--text)', fontSize: '0.7rem', fontWeight: 600 }}>{node.name}</div>
                        <div style={{ color: 'var(--muted)', fontSize: '0.5rem' }}>+{node.baseRate} {node.resource}/s</div>
                      </div>
                    </div>
                    {assignedHero ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <SpriteAnimation spriteData={getPlayerSprite(assignedHero.classId, assignedHero.raceId)} animation="idle" scale={1.0} speed={200} />
                          <span style={{ color: 'var(--accent)', fontSize: '0.6rem', fontWeight: 600 }}>{assignedHero.name}</span>
                        </div>
                        <button onClick={() => recallHarvest(node.id)} style={{
                          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                          borderRadius: 4, padding: '2px 6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.55rem',
                        }}>Recall</button>
                      </div>
                    ) : (
                      <div>
                        {availableHeroes.length > 0 ? (
                          <select
                            onChange={(e) => { if (e.target.value) assignHarvest(node.id, e.target.value); e.target.value = ''; }}
                            defaultValue=""
                            style={{
                              background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border)',
                              borderRadius: 4, padding: '3px 6px', color: 'var(--text)',
                              fontSize: '0.6rem', width: '100%', cursor: 'pointer',
                            }}
                          >
                            <option value="">Assign hero...</option>
                            {availableHeroes.map(h => (
                              <option key={h.id} value={h.id}>{h.name} (Lv.{h.level})</option>
                            ))}
                          </select>
                        ) : (
                          <div style={{ color: 'var(--muted)', fontSize: '0.55rem', fontStyle: 'italic' }}>No idle heroes</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: '0.5rem', fontStyle: 'italic' }}>
              Assign reserve heroes to gather resources.
            </div>
          </div>
        )}

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(0deg, rgba(10,14,30,0.9) 0%, rgba(10,14,30,0.5) 70%, transparent 100%)',
          padding: '20px 16px 10px',
          display: 'flex', justifyContent: 'center', gap: 24, zIndex: 15,
        }}>
          <Stat label="Victories" value={victories} color="var(--accent)" />
          <Stat label="Level" value={level} color="var(--gold)" />
          <Stat label="Gold" value={gold} color="var(--gold)" />
          <Stat label="Heroes" value={`${heroRoster.length}/${maxHeroSlots}`} color="var(--accent)" />
        </div>
      </div>
    </div>
  );
}

function MenuButton({ icon, label, sublabel, color, onClick, glow, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '10px 12px', margin: '3px 0',
        background: disabled ? 'rgba(40,40,60,0.3)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${disabled ? 'rgba(80,80,100,0.2)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
        color: disabled ? 'rgba(150,150,170,0.4)' : '#fff',
        fontSize: '0.8rem', fontWeight: 600, textAlign: 'left',
        transition: 'all 0.15s',
        animation: glow ? 'glow 2s infinite' : 'none',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={e => { if (!disabled) { e.currentTarget.style.background = `${color}22`; e.currentTarget.style.borderColor = color; }}}
      onMouseLeave={e => { if (!disabled) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; }}}
    >
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      <div>
        <div style={{ color: disabled ? 'rgba(150,150,170,0.4)' : color }}>{label}</div>
        {sublabel && <div style={{ fontSize: '0.6rem', color: 'var(--muted)', fontWeight: 400 }}>
          {sublabel}{disabled ? ' (Coming soon)' : ''}
        </div>}
      </div>
    </button>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color, fontWeight: 700, fontSize: '0.9rem' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.6rem' }}>{label}</div>
    </div>
  );
}
