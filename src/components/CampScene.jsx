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

const RESOURCE_NODES = [
  { id: 'gold_mine', name: 'Gold Mine', icon: 'pickaxe', resource: 'gold', x: 18, y: 30, color: '#fbbf24', img: '/images/buildings/gold_mine.png' },
  { id: 'herb_garden', name: 'Herb Garden', icon: 'nature', resource: 'herbs', x: 72, y: 28, color: '#4ade80', img: '/images/buildings/herb_garden.png' },
  { id: 'lumber_yard', name: 'Lumber Yard', icon: 'wood', resource: 'wood', x: 12, y: 58, color: '#a3764a', img: '/images/buildings/lumber_yard.png' },
  { id: 'ore_vein', name: 'Ore Vein', icon: 'ore', resource: 'ore', x: 80, y: 55, color: '#94a3b8', img: '/images/buildings/ore_vein.png' },
  { id: 'crystal_cave', name: 'Crystal Cave', icon: 'diamond', resource: 'crystals', x: 50, y: 22, color: '#a78bfa', img: '/images/buildings/crystal_cave.png' },
];

const SELL_PRICES = { gold: 1, herbs: 2, wood: 2, ore: 4, crystals: 8 };

const CAMP_AMBIENCE = [
  "The campfire crackles warmly...",
  "A distant wolf howls...",
  "The night sky glimmers with stars.",
  "Ironhand hammers at the anvil.",
  "Sage Aldor reads ancient scrolls.",
  "The wind carries the scent of pine.",
];

const SPAWN_POS = { x: 45, y: 75 };

export default function CampScene() {
  useEffect(() => { setBgm('camp'); }, []);
  const exitScene = useGameStore(s => s.exitScene);
  const harvestResources = useGameStore(s => s.harvestResources);
  const harvestNodes = useGameStore(s => s.harvestNodes);
  const activeHarvests = useGameStore(s => s.activeHarvests);
  const heroRoster = useGameStore(s => s.heroRoster);
  const activeHeroIds = useGameStore(s => s.activeHeroIds);
  const assignHarvest = useGameStore(s => s.assignHarvest);
  const recallHarvest = useGameStore(s => s.recallHarvest);
  const sellResource = useGameStore(s => s.sellResource);
  const gold = useGameStore(s => s.gold);
  const level = useGameStore(s => s.level);
  const playerRace = useGameStore(s => s.playerRace);
  const playerClass = useGameStore(s => s.playerClass);
  const tickHarvests = useGameStore(s => s.tickHarvests);

  const [selectedNode, setSelectedNode] = useState(null);
  const [showSellPanel, setShowSellPanel] = useState(false);
  const [ambientMsg, setAmbientMsg] = useState(null);

  const allDragNodes = [
    ...RESOURCE_NODES.map(n => ({ id: n.id, x: n.x, y: n.y })),
    ...(SCENE_NPCS.camp || []).map(n => ({ id: n.id, x: n.x, y: n.y })),
  ];
  const { positions, onMouseDown: onNodeDragStart, containerRef: sceneRef, adminMode } = useDraggableNodes(allDragNodes);

  const interactNodes = RESOURCE_NODES.filter(n => {
    const storeNode = harvestNodes.find(sn => sn.id === n.id);
    return storeNode && level >= storeNode.unlockLevel;
  }).map(n => {
    const pos = positions[n.id] || { x: n.x, y: n.y };
    return { ...n, x: pos.x, y: pos.y };
  });

  const handleInteract = useCallback((node) => {
    if (adminMode) return;
    if (selectedNode === node.id) {
      setSelectedNode(null);
    } else {
      setSelectedNode(node.id);
    }
  }, [adminMode, selectedNode]);

  const { heroX, heroY, walking, facingLeft, nearbyNode } = useWASD(SPAWN_POS, interactNodes, handleInteract);

  React.useEffect(() => {
    const interval = setInterval(() => tickHarvests(), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedNode || showSellPanel) return;
      setAmbientMsg(CAMP_AMBIENCE[Math.floor(Math.random() * CAMP_AMBIENCE.length)]);
      setTimeout(() => setAmbientMsg(null), 3500);
    }, 10000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, [selectedNode, showSellPanel]);

  const availableHeroes = heroRoster.filter(h => {
    const isHarvesting = Object.values(activeHarvests).includes(h.id);
    return !isHarvesting;
  });

  const playerName = useGameStore(s => s.playerName);
  const activeHero0 = heroRoster.find(h => h.name === playerName && h.classId === playerClass && h.raceId === playerRace);
  const primarySprite = getPlayerSprite(playerClass, playerRace, activeHero0?.namedHeroId);

  const handleNodeClick = (node) => {
    if (adminMode) return;
    if (selectedNode === node.id) {
      setSelectedNode(null);
      return;
    }
    setSelectedNode(node.id);
  };

  return (
    <div ref={sceneRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/scene_camp.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', pointerEvents: 'none' }} />

      <div style={{
        position: 'absolute', top: 8, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: SCENE.HEADER,
      }}>
        <div style={{ color: '#4ade80', fontSize: '1.3rem', textShadow: '0 2px 8px rgba(0,0,0,0.8)', fontFamily: "'LifeCraft', 'Cinzel', serif" }}>
          Camp
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)', fontFamily: "'LifeCraft', 'Cinzel', serif" }}>
            {gold} Gold
          </span>
          <button onClick={() => { exitScene(); useGameStore.getState().enterScene('island', 'world'); }} style={{
            background: 'rgba(0,200,100,0.15)', border: '1px solid #00ff88', borderRadius: 8,
            padding: '4px 12px', color: '#00ff88', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
            backdropFilter: 'blur(4px)', fontFamily: "'LifeCraft', 'Cinzel', serif",
          }}>🏝️ Island</button>
          <button onClick={() => setShowSellPanel(!showSellPanel)} style={{
            background: 'rgba(0,0,0,0.6)', border: '1px solid #fbbf24', borderRadius: 8,
            padding: '4px 12px', color: '#fbbf24', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
            backdropFilter: 'blur(4px)', fontFamily: "'LifeCraft', 'Cinzel', serif",
          }}>Sell Resources</button>
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        zIndex: SCENE.HEADER, display: 'flex', gap: 6, alignItems: 'center',
        background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '3px 10px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>WASD move</span>
        <span style={{ color: '#4ade80', fontSize: '0.7rem', fontWeight: 700 }}>E interact</span>
        {nearbyNode && (
          <span style={{ color: '#6ee7b3', fontSize: '0.7rem', fontWeight: 700, animation: 'pulse 1s infinite' }}>
            [{nearbyNode.name}]
          </span>
        )}
      </div>

      {ambientMsg && (
        <div style={{
          position: 'absolute', top: '14%', left: '50%', transform: 'translateX(-50%)',
          zIndex: SCENE.TOOLTIP, background: 'rgba(10,15,30,0.8)', border: '1px solid rgba(110,231,183,0.3)',
          borderRadius: 8, padding: '4px 12px',
          color: '#94a3b8', fontSize: '0.75rem', fontStyle: 'italic',
          textShadow: '0 1px 4px rgba(0,0,0,0.8)', whiteSpace: 'nowrap',
          animation: 'fadeIn 0.5s ease', pointerEvents: 'none',
        }}>
          {ambientMsg}
        </div>
      )}

      {primarySprite && (
        <div style={{
          position: 'absolute', left: `${heroX}%`, top: `${heroY}%`,
          transform: `translate(-50%, -50%)`,
          zIndex: SCENE.LABELS,
        }}>
          <SpriteAnimation
            spriteData={primarySprite}
            animation={walking ? 'walk' : 'idle'}
            scale={3}
            flip={facingLeft}
          />
        </div>
      )}

      {RESOURCE_NODES.map(node => {
        const storeNode = harvestNodes.find(n => n.id === node.id);
        if (!storeNode || level < storeNode.unlockLevel) return null;
        const assignedHeroId = activeHarvests[node.id];
        const assignedHero = assignedHeroId ? heroRoster.find(h => h.id === assignedHeroId) : null;
        const resourceAmount = Math.floor(harvestResources[node.resource] || 0);
        const pos = positions[node.id] || { x: node.x, y: node.y };
        const isNearby = nearbyNode?.id === node.id;

        return (
          <div key={node.id}
            onClick={() => handleNodeClick(node)}
            onMouseDown={(e) => onNodeDragStart(node.id, e)}
            style={{
              position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: adminMode ? 'grab' : 'pointer',
              zIndex: SCENE.NODES,
              textAlign: 'center',
              outline: adminMode ? '2px dashed #f59e0b' : 'none',
            }}>
            <div style={{
              width: 72, height: 72, borderRadius: 10,
              background: `radial-gradient(circle, ${node.color}25, rgba(0,0,0,0.3))`,
              border: isNearby ? `2px solid ${node.color}` : `2px solid ${node.color}80`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isNearby
                ? `0 0 24px ${node.color}60, inset 0 0 20px rgba(0,0,0,0.3)`
                : `0 0 16px ${node.color}40, inset 0 0 20px rgba(0,0,0,0.3)`,
              animation: assignedHero ? 'pulse 2s infinite' : isNearby ? 'pulse 1.2s infinite' : 'none',
              overflow: 'hidden',
              transition: 'box-shadow 0.3s ease, border 0.3s ease',
            }}>
              <img src={node.img} alt={node.name} style={{ width: 60, height: 60, objectFit: 'contain', imageRendering: 'auto' }} />
            </div>
            <div style={{
              color: node.color, fontSize: '1.1rem', fontWeight: 700, marginTop: 4,
              textShadow: `0 2px 6px rgba(0,0,0,0.95), 0 0 10px ${node.color}40`,
              whiteSpace: 'nowrap', fontFamily: "'LifeCraft', 'Cinzel', serif",
            }}>
              {node.name}
            </div>
            {resourceAmount > 0 && (
              <div style={{
                color: '#fff', fontSize: '0.7rem', fontWeight: 600,
                background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '1px 4px',
                marginTop: 1,
              }}>
                {resourceAmount}
              </div>
            )}
            {assignedHero && (
              <div style={{
                color: '#6ee7b3', fontSize: '0.65rem', fontWeight: 600, marginTop: 1,
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}>
                {assignedHero.name}
              </div>
            )}
            {isNearby && !selectedNode && (
              <div style={{
                color: '#fbbf24', fontSize: '0.7rem', fontWeight: 700, marginTop: 2,
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

            {selectedNode === node.id && (
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(10,15,30,0.95)', border: `1px solid ${node.color}`,
                borderRadius: 8, padding: 8, minWidth: 120, marginTop: 4,
                backdropFilter: 'blur(8px)', zIndex: SCENE.BACK_BUTTON,
              }} onClick={e => e.stopPropagation()}>
                {assignedHero ? (
                  <div>
                    <div style={{ color: '#6ee7b3', fontSize: '0.8rem', marginBottom: 4 }}>
                      {assignedHero.name} harvesting
                    </div>
                    <button onClick={() => recallHarvest(node.id)} style={{
                      width: '100%', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444',
                      borderRadius: 6, padding: '3px 8px', color: '#ef4444', cursor: 'pointer',
                      fontSize: '0.75rem', fontWeight: 700,
                    }}>Recall</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: 4 }}>Assign Hero:</div>
                    {availableHeroes.length === 0 ? (
                      <div style={{ color: '#666', fontSize: '0.7rem' }}>No heroes available</div>
                    ) : (
                      availableHeroes.map(hero => (
                        <button key={hero.id} onClick={() => { assignHarvest(node.id, hero.id); setSelectedNode(null); }} style={{
                          width: '100%', background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.3)',
                          borderRadius: 4, padding: '2px 6px', color: '#6ee7b3', cursor: 'pointer',
                          fontSize: '0.75rem', fontWeight: 600, marginBottom: 2, textAlign: 'left',
                        }}>
                          {hero.name} (Lv{hero.level})
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {showSellPanel && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(10,15,30,0.95)', border: '2px solid #fbbf24',
          borderRadius: 12, padding: 16, minWidth: 220, zIndex: SCENE.POPUP,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ color: '#fbbf24', fontSize: '1.05rem', marginBottom: 8, textAlign: 'center', fontFamily: "'LifeCraft', 'Cinzel', serif" }}>
            Sell Resources
          </div>
          {Object.entries(SELL_PRICES).map(([res, price]) => {
            const amount = Math.floor(harvestResources[res] || 0);
            return (
              <div key={res} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}>
                <div>
                  <span style={{ color: '#e2e8f0', fontSize: '0.85rem', textTransform: 'capitalize' }}>{res}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: 6 }}>x{amount}</span>
                  <span style={{ color: '#fbbf24', fontSize: '0.7rem', marginLeft: 4 }}>({price}g ea)</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button disabled={amount < 10} onClick={() => sellResource(res, 10)} style={{
                    background: amount >= 10 ? 'rgba(251,191,36,0.2)' : 'rgba(50,50,50,0.3)',
                    border: '1px solid rgba(251,191,36,0.3)', borderRadius: 4,
                    padding: '2px 6px', color: amount >= 10 ? '#fbbf24' : '#555', cursor: amount >= 10 ? 'pointer' : 'default',
                    fontSize: '0.7rem', fontWeight: 700,
                  }}>x10</button>
                  <button disabled={amount < 1} onClick={() => sellResource(res, amount)} style={{
                    background: amount >= 1 ? 'rgba(251,191,36,0.2)' : 'rgba(50,50,50,0.3)',
                    border: '1px solid rgba(251,191,36,0.3)', borderRadius: 4,
                    padding: '2px 6px', color: amount >= 1 ? '#fbbf24' : '#555', cursor: amount >= 1 ? 'pointer' : 'default',
                    fontSize: '0.7rem', fontWeight: 700,
                  }}>All</button>
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowSellPanel(false)} style={{
            width: '100%', background: 'rgba(100,100,100,0.2)', border: '1px solid #555',
            borderRadius: 6, padding: '4px 0', color: '#aaa', cursor: 'pointer',
            fontSize: '0.8rem', marginTop: 8,
          }}>Close</button>
        </div>
      )}

      {(SCENE_NPCS.camp || []).map(npc => {
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
        <div style={{
          color: '#6ee7b3', fontSize: '0.75rem', fontWeight: 700, marginTop: 3,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>Return to Map</div>
      </div>
    </div>
  );
}
