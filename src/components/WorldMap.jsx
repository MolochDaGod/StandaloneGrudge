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

const bossMapSprites = {
  nature_elemental: { filter: 'hue-rotate(80deg) saturate(2.5) brightness(0.7) contrast(1.3)', glow: 'rgba(0,255,80,0.5)' },
  water_elemental: { filter: 'hue-rotate(200deg) saturate(2.0) brightness(0.6) contrast(1.4)', glow: 'rgba(60,100,255,0.5)' },
  lich: { filter: 'hue-rotate(270deg) saturate(2.5) brightness(0.5) contrast(1.5)', glow: 'rgba(130,50,255,0.6)' },
  demon_lord: { filter: 'hue-rotate(340deg) saturate(3.0) brightness(0.5) contrast(1.6)', glow: 'rgba(255,30,30,0.6)' },
  void_king: { filter: 'hue-rotate(280deg) saturate(2.0) brightness(0.4) contrast(1.8) drop-shadow(0 0 8px rgba(200,100,255,0.8))', glow: 'rgba(200,100,255,0.7)' },
};

const locationPositions = {
  verdant_plains:  { x: 18, y: 78 },
  dark_forest:     { x: 30, y: 60 },
  cursed_ruins:    { x: 50, y: 72 },
  blood_canyon:    { x: 65, y: 55 },
  dragon_peaks:    { x: 45, y: 38 },
  shadow_citadel:  { x: 72, y: 30 },
  demon_gate:      { x: 55, y: 18 },
  void_throne:     { x: 80, y: 10 },
};

const pathConnections = [
  ['verdant_plains', 'dark_forest'],
  ['dark_forest', 'cursed_ruins'],
  ['cursed_ruins', 'blood_canyon'],
  ['blood_canyon', 'dragon_peaks'],
  ['dragon_peaks', 'shadow_citadel'],
  ['shadow_citadel', 'demon_gate'],
  ['demon_gate', 'void_throne'],
  ['dark_forest', 'dragon_peaks'],
  ['cursed_ruins', 'shadow_citadel'],
];

const locationIcons = {
  verdant_plains: { symbol: '🌿', color: '#4ade80', glow: 'rgba(74,222,128,0.4)' },
  dark_forest:    { symbol: '🌲', color: '#22d3ee', glow: 'rgba(34,211,238,0.4)' },
  cursed_ruins:   { symbol: '🏚️', color: '#a78bfa', glow: 'rgba(167,139,250,0.4)' },
  blood_canyon:   { symbol: '🏔️', color: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
  dragon_peaks:   { symbol: '🌋', color: '#f97316', glow: 'rgba(249,115,22,0.4)' },
  shadow_citadel: { symbol: '🏰', color: '#818cf8', glow: 'rgba(129,140,248,0.4)' },
  demon_gate:     { symbol: '🌀', color: '#f43f5e', glow: 'rgba(244,63,94,0.4)' },
  void_throne:    { symbol: '👑', color: '#fbbf24', glow: 'rgba(251,191,36,0.5)' },
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
                width: 40, height: 40, overflow: 'hidden',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.7))',
              }}>
                <SpriteAnimation
                  spriteData={getPlayerSprite(hero.classId, hero.raceId)}
                  animation={isWalking ? 'walk' : 'idle'}
                  flip={isWalking && flipX}
                  scale={1.0}
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
                    color="var(--gold)" disabled
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
                    icon="🔧" label="Upgrade" sublabel="Enhance equipment"
                    color="#22d3ee" disabled
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
