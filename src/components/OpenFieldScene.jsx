import React, { useState, useEffect, useRef, useCallback } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, SCENE_NPCS } from '../data/spriteMap';
import { InlineIcon } from '../data/uiSprites';
import { setBgm } from '../utils/audioManager';
import NpcSprite from './NpcSprite';
import { SCENE } from '../constants/layers';
import { useDraggableNodes } from '../hooks/useSceneDrag';
import useWASD from '../hooks/useWASD';

const FIELD_EVENTS = [
  { id: 'patrol', name: 'Wandering Foe', icon: 'battle', x: 65, y: 40, type: 'battle', color: '#ef4444', img: '/images/hunt_battle.png' },
  { id: 'chest', name: 'Treasure Chest', icon: 'gift', x: 30, y: 35, type: 'loot', color: '#fbbf24', img: '/images/buildings/treasure_chest.png' },
  { id: 'shrine', name: 'Healing Shrine', icon: 'sparkle', x: 75, y: 65, type: 'heal', color: '#6ee7b3', img: '/images/buildings/healing_shrine.png' },
  { id: 'camp_rest', name: 'Rest Spot', icon: 'fire', x: 40, y: 70, type: 'rest', color: '#f97316', img: '/images/buildings/campfire.png' },
  { id: 'merchant', name: 'Traveling Merchant', icon: 'diamond', x: 20, y: 55, type: 'shop', color: '#FAAC47', img: '/sprites/buildings/shop_cart.png' },
];

const FIELD_ENCOUNTERS = [
  { msg: "A mysterious fog rolls in...", color: '#a78bfa' },
  { msg: "You hear rustling in the bushes!", color: '#ef4444' },
  { msg: "A bird of prey circles overhead.", color: '#94a3b8' },
  { msg: "Distant drums echo through the valley.", color: '#f97316' },
  { msg: "You spot tracks in the dirt...", color: '#fbbf24' },
  { msg: "The wind shifts... danger is near.", color: '#ef4444' },
];

const SPAWN_POS = { x: 50, y: 82 };

export default function OpenFieldScene() {
  useEffect(() => { setBgm('scene'); }, []);
  const exitScene = useGameStore(s => s.exitScene);
  const enterScene = useGameStore(s => s.enterScene);
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

  const [interacted, setInteracted] = useState([]);
  const [message, setMessage] = useState(null);
  const [encounter, setEncounter] = useState(null);

  const allDragNodes = [
    ...FIELD_EVENTS.map(n => ({ id: n.id, x: n.x, y: n.y })),
    ...(SCENE_NPCS.field || []).map(n => ({ id: n.id, x: n.x, y: n.y })),
  ];
  const { positions, onMouseDown: onNodeDragStart, containerRef: sceneRef, adminMode } = useDraggableNodes(allDragNodes);

  const interactNodes = FIELD_EVENTS.filter(e => !interacted.includes(e.id)).map(e => {
    const pos = positions[e.id] || { x: e.x, y: e.y };
    return { ...e, x: pos.x, y: pos.y };
  });

  const doInteract = useCallback((evt) => {
    if (adminMode) return;
    if (interacted.includes(evt.id)) return;

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
    } else if (evt.type === 'shop') {
      enterScene('trading', sceneReturnTo || 'world');
    }
  }, [adminMode, interacted, sceneReturnTo, startBattle, addGold, playerMaxHealth, playerMaxMana, restAtInn, enterScene]);

  const { heroX, heroY, walking, facingLeft, nearbyNode } = useWASD(SPAWN_POS, interactNodes, doInteract);

  const primarySprite = getPlayerSprite(playerRace, playerClass);

  useEffect(() => {
    const interval = setInterval(() => {
      if (message) return;
      const enc = FIELD_ENCOUNTERS[Math.floor(Math.random() * FIELD_ENCOUNTERS.length)];
      setEncounter(enc);
      setTimeout(() => setEncounter(null), 3500);
    }, 8000 + Math.random() * 6000);
    return () => clearInterval(interval);
  }, [message]);

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

      <div style={{
        position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        zIndex: SCENE.HEADER, display: 'flex', gap: 6, alignItems: 'center',
        background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '3px 10px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{ color: '#94a3b8', fontSize: '0.45rem' }}>WASD move</span>
        <span style={{ color: '#e2e8f0', fontSize: '0.45rem', fontWeight: 700 }}>E interact</span>
        {nearbyNode && (
          <span style={{ color: '#6ee7b3', fontSize: '0.45rem', fontWeight: 700, animation: 'pulse 1s infinite' }}>
            [{nearbyNode.name}]
          </span>
        )}
      </div>

      {encounter && !message && (
        <div style={{
          position: 'absolute', top: '14%', left: '50%', transform: 'translateX(-50%)',
          zIndex: SCENE.TOOLTIP, background: 'rgba(10,15,30,0.85)', border: `1px solid ${encounter.color}40`,
          borderRadius: 8, padding: '4px 12px',
          color: encounter.color, fontSize: '0.5rem', fontStyle: 'italic',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)', whiteSpace: 'nowrap',
          animation: 'fadeIn 0.5s ease', pointerEvents: 'none',
        }}>
          {encounter.msg}
        </div>
      )}

      {FIELD_EVENTS.map(evt => {
        const done = interacted.includes(evt.id);
        const pos = positions[evt.id] || { x: evt.x, y: evt.y };
        const isNearby = nearbyNode?.id === evt.id;
        return (
          <div key={evt.id}
            onClick={() => !adminMode && doInteract(evt)}
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
              width: evt.type === 'shop' ? 96 : 72, height: evt.type === 'shop' ? 96 : 72,
              borderRadius: evt.type === 'shop' ? 0 : 10,
              background: done
                ? 'rgba(100,100,100,0.2)'
                : evt.type === 'shop' ? 'none' : `radial-gradient(circle, ${evt.color}25, rgba(0,0,0,0.3))`,
              border: done ? '2px solid #55580'
                : isNearby ? `2px solid ${evt.color}` : evt.type === 'shop' ? 'none' : `2px solid ${evt.color}80`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: !done && isNearby
                ? `0 0 24px ${evt.color}60, inset 0 0 20px rgba(0,0,0,0.3)`
                : !done && evt.type !== 'shop' ? `0 0 16px ${evt.color}40, inset 0 0 20px rgba(0,0,0,0.3)` : 'none',
              animation: isNearby && !done ? 'pulse 1.2s infinite' : !done ? 'pulse 2s infinite' : 'none',
              overflow: 'hidden',
              filter: done ? 'grayscale(0.8)' : evt.type === 'shop' ? `drop-shadow(0 0 8px ${evt.color}80)` : 'none',
              transition: 'box-shadow 0.3s ease, border 0.3s ease',
            }}>
              {done ? <span style={{ fontSize: '1.5rem', color: '#6ee7b3' }}>✓</span> : <img src={evt.img} alt={evt.name} style={{ width: evt.type === 'shop' ? 88 : 60, height: evt.type === 'shop' ? 88 : 60, objectFit: 'contain', imageRendering: evt.type === 'shop' ? 'pixelated' : 'auto' }} />}
            </div>
            <div className="font-cinzel" style={{
              color: done ? '#666' : evt.color,
              fontSize: '0.85rem', fontWeight: 700, marginTop: 4,
              textShadow: `0 2px 6px rgba(0,0,0,0.95), 0 0 10px ${evt.color}40`, whiteSpace: 'nowrap',
            }}>
              {evt.name}
            </div>
            {isNearby && !done && (
              <div style={{
                color: '#fbbf24', fontSize: '0.45rem', fontWeight: 700, marginTop: 2,
                background: 'rgba(0,0,0,0.7)', padding: '1px 6px', borderRadius: 4,
                animation: 'pulse 1s infinite',
              }}>Press E</div>
            )}
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
          zIndex: SCENE.HERO,
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
            <NpcSprite npcId={npc.npc} scale={2.5} flip={npc.flip} name={npc.name} />
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
        position: 'absolute', bottom: 16, left: 16,
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
