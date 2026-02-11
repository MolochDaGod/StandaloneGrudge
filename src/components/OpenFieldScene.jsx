import React, { useState, useEffect } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import { InlineIcon } from '../data/uiSprites';

const FIELD_EVENTS = [
  { id: 'patrol', name: 'Wandering Foe', icon: 'battle', x: 65, y: 40, type: 'battle', color: '#ef4444' },
  { id: 'chest', name: 'Treasure Chest', icon: 'gift', x: 30, y: 35, type: 'loot', color: '#fbbf24' },
  { id: 'shrine', name: 'Healing Shrine', icon: 'sparkle', x: 75, y: 65, type: 'heal', color: '#6ee7b3' },
  { id: 'camp_rest', name: 'Rest Spot', icon: 'fire', x: 40, y: 70, type: 'rest', color: '#f97316' },
];

export default function OpenFieldScene() {
  const exitScene = useGameStore(s => s.exitScene);
  const startBattle = useGameStore(s => s.startBattle);
  const playerRace = useGameStore(s => s.playerRace);
  const playerClass = useGameStore(s => s.playerClass);
  const playerHealth = useGameStore(s => s.playerHealth);
  const playerMaxHealth = useGameStore(s => s.playerMaxHealth);
  const playerMana = useGameStore(s => s.playerMana);
  const playerMaxMana = useGameStore(s => s.playerMaxMana);
  const restAtInn = useGameStore(s => s.restAtInn);
  const gold = useGameStore(s => s.gold);
  const addGold = useGameStore(s => s.addGold);
  const sceneReturnTo = useGameStore(s => s.sceneReturnTo);

  const [heroX, setHeroX] = useState(50);
  const [heroY, setHeroY] = useState(80);
  const [walking, setWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [interacted, setInteracted] = useState([]);
  const [message, setMessage] = useState(null);

  const primarySprite = getPlayerSprite(playerRace, playerClass);

  const handleEventClick = (evt) => {
    if (interacted.includes(evt.id)) return;

    setFacingLeft(evt.x < heroX);
    setWalking(true);
    setHeroX(evt.x - 6);
    setHeroY(evt.y);

    setTimeout(() => {
      setWalking(false);

      if (evt.type === 'battle') {
        const loc = sceneReturnTo || 'verdant_plains';
        useGameStore.setState({ currentLocation: loc });
        startBattle(loc);
      } else if (evt.type === 'loot') {
        const lootGold = 15 + Math.floor(Math.random() * 30);
        addGold(lootGold);
        setInteracted(prev => [...prev, evt.id]);
        setMessage(`Found ${lootGold} gold in the chest!`);
        setTimeout(() => setMessage(null), 2500);
      } else if (evt.type === 'heal') {
        useGameStore.setState({
          playerHealth: playerMaxHealth,
          playerMana: playerMaxMana,
        });
        setInteracted(prev => [...prev, evt.id]);
        setMessage('Health and Mana fully restored!');
        setTimeout(() => setMessage(null), 2500);
      } else if (evt.type === 'rest') {
        restAtInn(0);
        setInteracted(prev => [...prev, evt.id]);
        setMessage('Rested by the campfire. Stats restored!');
        setTimeout(() => setMessage(null), 2500);
      }
    }, 600);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/scene_field.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', pointerEvents: 'none' }} />

      <div style={{
        position: 'absolute', top: 8, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20,
      }}>
        <div className="font-cinzel" style={{ color: '#e2e8f0', fontSize: '0.9rem', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
          Open Field
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ color: '#fbbf24', fontSize: '0.55rem' }}>
            {gold} Gold
          </div>
          <div style={{
            width: 60, height: 6, background: 'rgba(0,0,0,0.5)', borderRadius: 3, overflow: 'hidden',
          }}>
            <div style={{
              width: `${(playerHealth / playerMaxHealth) * 100}%`, height: '100%',
              background: 'linear-gradient(90deg, #22c55e, #16a34a)', borderRadius: 3,
            }} />
          </div>
        </div>
      </div>

      {FIELD_EVENTS.map(evt => {
        const done = interacted.includes(evt.id);
        return (
          <div key={evt.id} onClick={() => handleEventClick(evt)} style={{
            position: 'absolute', left: `${evt.x}%`, top: `${evt.y}%`,
            transform: 'translate(-50%, -50%)', cursor: done ? 'default' : 'pointer',
            zIndex: 15, textAlign: 'center', opacity: done ? 0.3 : 1,
            transition: 'opacity 0.3s',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: done
                ? 'rgba(100,100,100,0.2)'
                : `radial-gradient(circle, ${evt.color}40, ${evt.color}15)`,
              border: `2px solid ${done ? '#555' : evt.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem',
              boxShadow: !done ? `0 0 12px ${evt.color}40` : 'none',
              animation: !done ? 'pulse 2s infinite' : 'none',
            }}>
              {done ? '✓' : <InlineIcon name={evt.icon} />}
            </div>
            <div style={{
              color: done ? '#666' : evt.color,
              fontSize: '0.45rem', fontWeight: 700, marginTop: 2,
              textShadow: '0 1px 4px rgba(0,0,0,0.9)', whiteSpace: 'nowrap',
            }}>
              {evt.name}
            </div>
          </div>
        );
      })}

      {primarySprite && (
        <div style={{
          position: 'absolute', left: `${heroX}%`, top: `${heroY}%`,
          transform: `translate(-50%, -50%) scaleX(${facingLeft ? -1 : 1})`,
          zIndex: 12, transition: 'left 0.6s ease, top 0.6s ease',
        }}>
          <SpriteAnimation
            src={primarySprite.src}
            frameWidth={primarySprite.frameWidth || 100}
            frameHeight={primarySprite.frameHeight || 100}
            totalFrames={walking ? (primarySprite.walk?.frames || 6) : (primarySprite.idle?.frames || 4)}
            row={walking ? (primarySprite.walk?.row || 1) : (primarySprite.idle?.row || 0)}
            fps={walking ? 10 : 6}
            scale={2.2}
          />
        </div>
      )}

      {message && (
        <div style={{
          position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10,15,30,0.9)', border: '1px solid #fbbf24',
          borderRadius: 8, padding: '6px 14px', zIndex: 40,
          color: '#fbbf24', fontSize: '0.6rem', fontWeight: 600,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)', whiteSpace: 'nowrap',
          animation: 'fadeIn 0.3s ease',
        }}>
          {message}
        </div>
      )}

      <div onClick={exitScene} style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 30, cursor: 'pointer', textAlign: 'center',
      }}>
        <div style={{
          width: 50, height: 50, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(110,231,183,0.4), rgba(110,231,183,0.1))',
          border: '2px solid #6ee7b3',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', boxShadow: '0 0 20px rgba(110,231,183,0.4)',
          animation: 'pulse 2s infinite',
        }}>
          <InlineIcon name="portal" />
        </div>
        <div style={{
          color: '#6ee7b3', fontSize: '0.5rem', fontWeight: 700, marginTop: 3,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>Return</div>
      </div>
    </div>
  );
}
