import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, SCENE_NPCS } from '../data/spriteMap';
import { InlineIcon } from '../data/uiSprites';
import { setBgm } from '../utils/audioManager';
import NpcSprite from './NpcSprite';
import { SCENE } from '../constants/layers';
import { useDraggableNodes } from '../hooks/useSceneDrag';

const FIELD_EVENTS = [
  { id: 'patrol', name: 'Wandering Foe', icon: 'battle', x: 65, y: 40, type: 'battle', color: '#ef4444', img: '/images/hunt_battle.png' },
  { id: 'chest', name: 'Treasure Chest', icon: 'gift', x: 30, y: 35, type: 'loot', color: '#fbbf24', img: '/images/buildings/treasure_chest.png' },
  { id: 'shrine', name: 'Healing Shrine', icon: 'sparkle', x: 75, y: 65, type: 'heal', color: '#6ee7b3', img: '/images/buildings/healing_shrine.png' },
  { id: 'camp_rest', name: 'Rest Spot', icon: 'fire', x: 40, y: 70, type: 'rest', color: '#f97316', img: '/images/buildings/campfire.png' },
];

const SPAWN_POS = { x: 50, y: 82 };

export default function OpenFieldScene() {
  useEffect(() => { setBgm('scene'); }, []);
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

  const [heroX, setHeroX] = useState(SPAWN_POS.x);
  const [heroY, setHeroY] = useState(SPAWN_POS.y);
  const [walking, setWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [interacted, setInteracted] = useState([]);
  const [message, setMessage] = useState(null);
  const walkTimeout = useRef(null);

  const allNodes = [
    ...FIELD_EVENTS.map(n => ({ id: n.id, x: n.x, y: n.y })),
    ...(SCENE_NPCS.field || []).map(n => ({ id: n.id, x: n.x, y: n.y })),
  ];
  const { positions, onMouseDown: onNodeDragStart, containerRef: sceneRef, adminMode } = useDraggableNodes(allNodes);

  const primarySprite = getPlayerSprite(playerRace, playerClass);

  useEffect(() => { return () => { if (walkTimeout.current) clearTimeout(walkTimeout.current); }; }, []);

  const handleEventClick = (evt) => {
    if (interacted.includes(evt.id)) return;
    if (walkTimeout.current) clearTimeout(walkTimeout.current);

    const targetX = evt.x - 6;
    const targetY = evt.y;
    setFacingLeft(targetX < heroX);
    setWalking(true);
    setHeroX(targetX);
    setHeroY(targetY);

    walkTimeout.current = setTimeout(() => {
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
    <div ref={sceneRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/scene_field.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', pointerEvents: 'none' }} />

      <div style={{
        position: 'absolute', top: 8, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: SCENE.HEADER,
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
        const pos = positions[evt.id] || { x: evt.x, y: evt.y };
        return (
          <div key={evt.id}
            onClick={() => !adminMode && handleEventClick(evt)}
            onMouseDown={(e) => onNodeDragStart(evt.id, e)}
            style={{
              position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: adminMode ? 'grab' : (done ? 'default' : 'pointer'),
              zIndex: SCENE.NODES, textAlign: 'center', opacity: done ? 0.3 : 1,
              transition: 'opacity 0.3s',
              outline: adminMode ? '2px dashed #f59e0b' : 'none',
            }}>
            <div style={{
              width: 72, height: 72, borderRadius: 10,
              background: done
                ? 'rgba(100,100,100,0.2)'
                : `radial-gradient(circle, ${evt.color}25, rgba(0,0,0,0.3))`,
              border: `2px solid ${done ? '#555' : evt.color}80`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: !done ? `0 0 16px ${evt.color}40, inset 0 0 20px rgba(0,0,0,0.3)` : 'none',
              animation: !done ? 'pulse 2s infinite' : 'none',
              overflow: 'hidden',
              filter: done ? 'grayscale(0.8)' : 'none',
            }}>
              {done ? <span style={{ fontSize: '1.5rem', color: '#6ee7b3' }}>✓</span> : <img src={evt.img} alt={evt.name} style={{ width: 60, height: 60, objectFit: 'contain', imageRendering: 'auto' }} />}
            </div>
            <div className="font-cinzel" style={{
              color: done ? '#666' : evt.color,
              fontSize: '0.85rem', fontWeight: 700, marginTop: 4,
              textShadow: `0 2px 6px rgba(0,0,0,0.95), 0 0 10px ${evt.color}40`, whiteSpace: 'nowrap',
            }}>
              {evt.name}
            </div>
            {adminMode && (
              <div style={{
                color: '#f59e0b', fontSize: '0.45rem', fontWeight: 700, marginTop: 2,
                background: 'rgba(0,0,0,0.8)', padding: '1px 4px', borderRadius: 3,
              }}>x:{pos.x} y:{pos.y}</div>
            )}
          </div>
        );
      })}

      {primarySprite && (
        <div style={{
          position: 'absolute', left: `${heroX}%`, top: `${heroY}%`,
          transform: `translate(-50%, -50%)`,
          zIndex: SCENE.HERO, transition: 'left 0.6s ease, top 0.6s ease',
        }}>
          <SpriteAnimation
            spriteData={primarySprite}
            animation={walking ? 'walk' : 'idle'}
            scale={3}
            flip={facingLeft}
          />
        </div>
      )}

      {message && (
        <div style={{
          position: 'absolute', top: '18%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10,15,30,0.9)', border: '1px solid #fbbf24',
          borderRadius: 8, padding: '6px 14px', zIndex: SCENE.TOOLTIP,
          color: '#fbbf24', fontSize: '0.6rem', fontWeight: 600,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)', whiteSpace: 'nowrap',
          animation: 'fadeIn 0.3s ease',
        }}>
          {message}
        </div>
      )}

      {(SCENE_NPCS.field || []).map(npc => {
        const npcPos = positions[npc.id] || { x: npc.x, y: npc.y };
        return (
          <div key={npc.id}
            onMouseDown={(e) => onNodeDragStart(npc.id, e)}
            style={{
              position: 'absolute', left: `${npcPos.x}%`, top: `${npcPos.y}%`,
              transform: 'translate(-50%, -50%)', zIndex: SCENE.AMBIENT_FX,
              pointerEvents: adminMode ? 'auto' : 'none',
              cursor: adminMode ? 'grab' : 'default',
              outline: adminMode ? '2px dashed #f59e0b' : 'none',
            }}>
            <NpcSprite npcId={npc.npc} scale={3} flip={npc.flip} name={npc.name} />
            {adminMode && (
              <div style={{
                color: '#f59e0b', fontSize: '0.45rem', fontWeight: 700, textAlign: 'center',
                background: 'rgba(0,0,0,0.8)', padding: '1px 4px', borderRadius: 3, marginTop: 2,
              }}>x:{npcPos.x} y:{npcPos.y}</div>
            )}
          </div>
        );
      })}

      <div onClick={exitScene} style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: SCENE.BACK_BUTTON, cursor: 'pointer', textAlign: 'center',
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
        <div className="font-cinzel" style={{
          color: '#6ee7b3', fontSize: '0.85rem', fontWeight: 700, marginTop: 4,
          textShadow: '0 2px 6px rgba(0,0,0,0.95), 0 0 10px rgba(110,231,183,0.4)',
        }}>Return</div>
      </div>
    </div>
  );
}
