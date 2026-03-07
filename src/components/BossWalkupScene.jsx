import React, { useState, useEffect } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, getEnemySprite } from '../data/spriteMap';
import { BOSS_WALKUP } from '../constants/layers';

export default function BossWalkupScene() {
  const startBossBattle = useGameStore(s => s.startBossBattle);
  const playerRace = useGameStore(s => s.playerRace);
  const playerClass = useGameStore(s => s.playerClass);
  const dungeonProgress = useGameStore(s => s.dungeonProgress);
  const locationId = dungeonProgress?.locationId || 'corrupted_spire';

  const [phase, setPhase] = useState('walk');
  const [heroY, setHeroY] = useState(85);

  const heroRoster = useGameStore(s => s.heroRoster);
  const playerName = useGameStore(s => s.playerName);
  const activeHero0 = heroRoster.find(h => h.name === playerName && h.classId === playerClass && h.raceId === playerRace);
  const primarySprite = getPlayerSprite(playerClass, playerRace, activeHero0?.namedHeroId);
  const bossSprite = getEnemySprite('evil_wizard');

  useEffect(() => {
    const walkTimer = setTimeout(() => {
      setHeroY(55);
    }, 200);

    const arriveTimer = setTimeout(() => {
      setPhase('confront');
    }, 1500);

    return () => {
      clearTimeout(walkTimer);
      clearTimeout(arriveTimer);
    };
  }, []);

  const handleChallenge = () => {
    setPhase('charging');
    setTimeout(() => {
      useGameStore.setState({ currentScene: 'dungeon', currentLocation: locationId });
      startBossBattle('evil_wizard');
    }, 800);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/lava_boss_walkup.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        background: phase === 'charging'
          ? 'rgba(239,68,68,0.3)'
          : 'rgba(0,0,0,0.15)',
        pointerEvents: 'none',
        transition: 'background 0.5s ease',
      }} />

      {phase === 'charging' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: BOSS_WALKUP.AMBIENT, pointerEvents: 'none',
          background: 'radial-gradient(circle at 50% 25%, rgba(192,38,211,0.4), transparent 60%)',
          animation: 'pulse 0.5s infinite',
        }} />
      )}

      <div style={{
        position: 'absolute', top: '15%', left: '50%',
        transform: 'translate(-50%, -50%) scaleX(-1)', zIndex: BOSS_WALKUP.HERO,
      }}>
        {bossSprite && (
          <SpriteAnimation
            src={bossSprite.src || bossSprite.idle?.src}
            frameWidth={bossSprite.frameWidth || 150}
            frameHeight={bossSprite.frameHeight || 150}
            totalFrames={phase === 'charging' ? (bossSprite.attack1?.frames || 8) : (bossSprite.idle?.frames || 8)}
            row={bossSprite.attack1 ? undefined : (phase === 'charging' ? 2 : 0)}
            animationSrc={phase === 'charging' ? bossSprite.attack1?.src : bossSprite.idle?.src}
            fps={phase === 'charging' ? 12 : 6}
            scale={3.5}
          />
        )}
        <div style={{
          textAlign: 'center', marginTop: -4,
        }}>
          <div className="font-cinzel" style={{
            color: '#c026d3', fontSize: '0.8rem', fontWeight: 700,
            textShadow: '0 2px 12px rgba(192,38,211,0.8), 0 0 20px rgba(192,38,211,0.4)',
            animation: phase === 'confront' ? 'pulse 1.5s infinite' : 'none',
          }}>
            Malachar the Undying
          </div>
          <div style={{
            color: '#ef4444', fontSize: '0.5rem', fontWeight: 600,
            textShadow: '0 1px 6px rgba(0,0,0,0.8)',
          }}>
            Endgame Boss
          </div>
        </div>
      </div>

      <div style={{
        position: 'absolute', left: '50%', top: `${heroY}%`,
        transform: 'translate(-50%, -50%)', zIndex: BOSS_WALKUP.BOSS,
        transition: 'top 1.2s ease-in-out',
      }}>
        {primarySprite && (
          <SpriteAnimation
            src={primarySprite.src || primarySprite.idle?.src}
            frameWidth={primarySprite.frameWidth || 150}
            frameHeight={primarySprite.frameHeight || 150}
            totalFrames={phase === 'walk' ? (primarySprite.walk?.frames || 6) : (primarySprite.idle?.frames || 4)}
            row={primarySprite.walk ? undefined : (phase === 'walk' ? 1 : 0)}
            animationSrc={phase === 'walk' ? primarySprite.walk?.src : primarySprite.idle?.src}
            fps={phase === 'walk' ? 10 : 6}
            scale={2.5}
          />
        )}
      </div>

      {phase === 'confront' && (
        <>
          <div style={{
            position: 'absolute', top: '35%', left: '50%', transform: 'translateX(-50%)',
            zIndex: BOSS_WALKUP.TEXT, textAlign: 'center',
          }}>
            <div style={{
              background: 'rgba(10,10,25,0.9)', border: '2px solid #c026d3',
              borderRadius: 12, padding: '10px 20px',
              backdropFilter: 'blur(8px)',
            }}>
              <div style={{
                color: '#c026d3', fontSize: '0.6rem', fontStyle: 'italic',
                textShadow: '0 1px 6px rgba(192,38,211,0.5)',
                marginBottom: 8,
              }}>
                "You dare trespass in my domain? Your souls will fuel my eternal flame!"
              </div>
              <button onClick={handleChallenge} style={{
                background: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(192,38,211,0.3))',
                border: '2px solid #ef4444',
                borderRadius: 8, padding: '8px 20px', color: '#ef4444', cursor: 'pointer',
                fontSize: '0.7rem', fontWeight: 700, fontFamily: "'Cinzel', serif",
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                boxShadow: '0 0 20px rgba(239,68,68,0.3)',
                animation: 'pulse 2s infinite',
              }}>
                CHALLENGE BOSS
              </button>
            </div>
          </div>

          <div style={{
            position: 'absolute', bottom: 12, right: 12, zIndex: BOSS_WALKUP.SKIP_BUTTON,
          }}>
            <button onClick={() => {
              useGameStore.setState({ currentScene: 'dungeon', screen: 'scene' });
            }} style={{
              background: 'rgba(100,100,100,0.3)', border: '1px solid #666',
              borderRadius: 6, padding: '4px 12px', color: '#999', cursor: 'pointer',
              fontSize: '0.5rem',
            }}>
              Retreat
            </button>
          </div>
        </>
      )}

      {phase !== 'confront' && phase !== 'charging' && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translateX(-50%)',
          zIndex: BOSS_WALKUP.DIALOGUE, color: '#e2e8f0', fontSize: '0.55rem',
          textShadow: '0 1px 6px rgba(0,0,0,0.8)',
          animation: 'pulse 1.5s infinite',
        }}>
          Approaching the boss chamber...
        </div>
      )}
    </div>
  );
}
