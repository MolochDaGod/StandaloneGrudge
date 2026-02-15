import React, { useState, useEffect } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import { classDefinitions } from '../data/classes';
import { PLAYER_ROWS } from '../data/battleRows';
import { loadBattlePositions, saveBattlePositions } from '../utils/battlePositionsStorage';

const ROW_IDS = ['protection', 'battle', 'back'];
const ROW_LABELS = { protection: 'P', battle: 'B', back: 'R' };
const ROW_NAMES = { protection: 'Protection', battle: 'Battle Line', back: 'Back Row' };
const ROW_COLORS = { protection: '#3b82f6', battle: '#ef4444', back: '#22c55e' };

function HeroPortrait({ hero, size = 50, selected, onClick, assigned }) {
  const spriteData = getPlayerSprite(hero.classId, hero.raceId, hero.namedHeroId);
  const fw = spriteData?.frameWidth || 100;
  const fh = spriteData?.frameHeight || 100;
  const scale = (size / Math.max(fw, fh)) * 2.2;
  const cls = classDefinitions[hero.classId];
  const race = raceDefinitions[hero.raceId];

  return (
    <div
      onClick={onClick}
      style={{
        width: size + 8, height: size + 20,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        cursor: 'pointer',
        opacity: assigned ? 0.4 : 1,
        transition: 'all 0.15s',
      }}
    >
      <div style={{
        width: size, height: size,
        borderRadius: 4,
        overflow: 'hidden',
        border: selected ? '2px solid #ffd700' : '2px solid rgba(139,0,0,0.6)',
        background: selected
          ? 'linear-gradient(180deg, rgba(255,215,0,0.15), rgba(0,0,0,0.8))'
          : 'linear-gradient(180deg, rgba(20,15,30,0.6), rgba(0,0,0,0.9))',
        boxShadow: selected ? '0 0 10px rgba(255,215,0,0.3)' : 'inset 0 0 8px rgba(0,0,0,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <SpriteAnimation spriteData={spriteData} animation="idle" scale={scale} speed={200} containerless={false} />
        </div>
      </div>
      <span style={{
        fontSize: '0.4rem', fontWeight: 700,
        color: selected ? '#ffd700' : '#aaa',
        textAlign: 'center',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: size + 8,
        fontFamily: "'Cinzel', serif",
      }}>
        {hero.name?.split(' ')[0] || 'Hero'}
      </span>
    </div>
  );
}

function PositionSlot({ rowId, col, heroInSlot, onClick, isTarget }) {
  const rowColor = ROW_COLORS[rowId] || '#888';

  return (
    <div
      onClick={onClick}
      style={{
        width: 42, height: 42,
        borderRadius: 3,
        border: isTarget ? '2px solid #ffd700' : heroInSlot ? `2px solid ${rowColor}88` : '2px solid rgba(180,150,50,0.3)',
        background: heroInSlot
          ? `linear-gradient(180deg, ${rowColor}22, ${rowColor}11)`
          : 'linear-gradient(180deg, rgba(200,170,50,0.35), rgba(180,150,30,0.2))',
        boxShadow: isTarget ? '0 0 8px rgba(255,215,0,0.4)' : heroInSlot ? `inset 0 0 6px ${rowColor}33` : 'inset 0 1px 3px rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.15s',
        position: 'relative',
      }}
    >
      {heroInSlot ? (
        <MiniHeroInSlot hero={heroInSlot} />
      ) : null}
    </div>
  );
}

function MiniHeroInSlot({ hero }) {
  const spriteData = getPlayerSprite(hero.classId, hero.raceId, hero.namedHeroId);
  const fw = spriteData?.frameWidth || 100;
  const scale = (28 / fw) * 2;

  return (
    <div style={{
      width: 28, height: 28, borderRadius: '50%', overflow: 'hidden',
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <SpriteAnimation spriteData={spriteData} animation="idle" scale={scale} speed={200} containerless={false} />
    </div>
  );
}

export default function BattlePositions({ compact = false }) {
  const { heroRoster, activeHeroIds } = useGameStore();
  const partyHeroes = heroRoster.filter(h => h.id === 'player' || activeHeroIds.includes(h.id));

  const [positions, setPositions] = useState(() => loadBattlePositions());
  const [selectedHeroId, setSelectedHeroId] = useState(null);

  useEffect(() => {
    saveBattlePositions(positions);
  }, [positions]);

  const getHeroAtPosition = (rowId, col) => {
    return partyHeroes.find(h => positions[h.id] === rowId && (positions[`${h.id}_col`] || 1) === col) || null;
  };

  const isHeroAssigned = (heroId) => {
    return !!positions[heroId];
  };

  const assignHero = (heroId, rowId, col) => {
    const existingHero = getHeroAtPosition(rowId, col);
    const newPos = { ...positions };

    if (existingHero && existingHero.id !== heroId) {
      delete newPos[existingHero.id];
      delete newPos[`${existingHero.id}_col`];
    }

    newPos[heroId] = rowId;
    newPos[`${heroId}_col`] = col;
    setPositions(newPos);
    setSelectedHeroId(null);
  };

  const clearHero = (heroId) => {
    const newPos = { ...positions };
    delete newPos[heroId];
    delete newPos[`${heroId}_col`];
    setPositions(newPos);
  };

  const handleSlotClick = (rowId, col) => {
    const heroInSlot = getHeroAtPosition(rowId, col);

    if (heroInSlot) {
      clearHero(heroInSlot.id);
      return;
    }

    if (selectedHeroId) {
      assignHero(selectedHeroId, rowId, col);
    }
  };

  const handleHeroClick = (heroId) => {
    if (isHeroAssigned(heroId)) {
      clearHero(heroId);
    } else {
      setSelectedHeroId(selectedHeroId === heroId ? null : heroId);
    }
  };

  const autoAssign = () => {
    const newPos = {};
    partyHeroes.forEach((hero, i) => {
      const cls = classDefinitions[hero.classId];
      let row = 'battle';
      if (hero.classId === 'ranger' || hero.classId === 'mage') row = 'back';
      if (hero.classId === 'warrior') row = 'protection';

      const col = (i % 3) + 1;
      newPos[hero.id] = row;
      newPos[`${hero.id}_col`] = col;
    });
    setPositions(newPos);
    setSelectedHeroId(null);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%', height: '100%',
      backgroundImage: 'url(/ui/battle_positions_panel.png)',
      backgroundSize: '100% 100%',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      padding: '12% 5% 8% 5%',
      gap: 8,
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center',
        width: 70, flexShrink: 0,
      }}>
        {partyHeroes.map(hero => (
          <HeroPortrait
            key={hero.id}
            hero={hero}
            size={40}
            selected={selectedHeroId === hero.id}
            assigned={isHeroAssigned(hero.id)}
            onClick={() => handleHeroClick(hero.id)}
          />
        ))}
      </div>

      <div style={{
        flex: 1,
        display: 'flex', flexDirection: 'column', gap: 4, justifyContent: 'center',
        alignItems: 'center',
      }}>
        {ROW_IDS.map(rowId => (
          <div key={rowId} style={{
            display: 'flex', gap: 4, alignItems: 'center',
          }}>
            <span style={{
              width: 12, fontSize: '0.5rem', fontWeight: 900,
              color: ROW_COLORS[rowId],
              textAlign: 'center',
              fontFamily: "'Cinzel', serif",
              textShadow: `0 0 6px ${ROW_COLORS[rowId]}66`,
            }}>
              {ROW_LABELS[rowId]}
            </span>
            {[1, 2, 3].map(col => (
              <PositionSlot
                key={`${rowId}_${col}`}
                rowId={rowId}
                col={col}
                heroInSlot={getHeroAtPosition(rowId, col)}
                onClick={() => handleSlotClick(rowId, col)}
                isTarget={!!selectedHeroId && !getHeroAtPosition(rowId, col)}
              />
            ))}
          </div>
        ))}

        <div style={{
          display: 'flex', gap: 4, marginTop: 2,
          justifyContent: 'center',
        }}>
          <span style={{ width: 12 }} />
          {[1, 2, 3].map(col => (
            <span key={col} style={{
              width: 42, textAlign: 'center',
              fontSize: '0.5rem', fontWeight: 900,
              color: '#c44', fontFamily: "'Cinzel', serif",
            }}>
              {col}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={autoAssign}
        title="Auto-assign heroes to recommended positions"
        style={{
          position: 'absolute', top: '12%', right: '6%',
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,215,0,0.3)',
          borderRadius: 3,
          padding: '2px 6px',
          cursor: 'pointer',
          color: '#ffd700',
          fontSize: '0.4rem',
          fontFamily: "'Cinzel', serif",
          fontWeight: 700,
        }}
      >
        AUTO
      </button>
    </div>
  );
}
