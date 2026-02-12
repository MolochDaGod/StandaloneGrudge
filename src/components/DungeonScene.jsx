import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import { InlineIcon } from '../data/uiSprites';
import { setBgm } from '../utils/audioManager';
import { SCENE } from '../constants/layers';

const DUNGEON_CONFIGS = {
  default: {
    name: 'Dark Dungeon',
    bg: '/backgrounds/scene_dungeon.png',
    color: '#f97316',
    portalColor: '#f97316',
    nodes: [
      { type: 'battle', name: 'Entrance Guard', y: 82, enemies: 2 },
      { type: 'battle', name: 'Dungeon Patrol', y: 65, enemies: 3 },
      { type: 'elite', name: 'Elite Sentry', y: 48, enemies: 2 },
      { type: 'battle', name: 'Inner Chamber', y: 32, enemies: 3 },
      { type: 'boss', name: 'Dungeon Lord', y: 16, enemies: 1 },
    ],
  },
  void: {
    name: 'Void Rift',
    bg: '/backgrounds/purple_dungeon.png',
    color: '#c026d3',
    portalColor: '#a78bfa',
    nodes: [
      { type: 'battle', name: 'Void Sentinels', y: 84, enemies: 3 },
      { type: 'elite', name: 'Reality Warden', y: 68, enemies: 2 },
      { type: 'battle', name: 'Chaos Swarm', y: 52, enemies: 4 },
      { type: 'elite', name: 'Void Colossus', y: 36, enemies: 2 },
      { type: 'battle', name: 'Abyssal Court', y: 22, enemies: 3 },
      { type: 'boss', name: 'Void Archon', y: 10, enemies: 1 },
    ],
  },
  lava: {
    name: 'Infernal Depths',
    bg: '/backgrounds/lava_dungeon_path.png',
    color: '#ef4444',
    portalColor: '#f97316',
    nodes: [
      { type: 'battle', name: 'Flame Wardens', y: 84, enemies: 3 },
      { type: 'battle', name: 'Molten Patrol', y: 68, enemies: 3 },
      { type: 'elite', name: 'Infernal Knight', y: 52, enemies: 2 },
      { type: 'battle', name: 'Magma Chamber', y: 36, enemies: 4 },
      { type: 'elite', name: 'Fire Titan', y: 22, enemies: 2 },
      { type: 'boss', name: 'Malachar the Undying', y: 10, enemies: 1, bossId: 'evil_wizard' },
    ],
  },
};

export default function DungeonScene() {
  useEffect(() => { setBgm('dungeon'); }, []);
  const exitScene = useGameStore(s => s.exitScene);
  const dungeonProgress = useGameStore(s => s.dungeonProgress);
  const startBattle = useGameStore(s => s.startBattle);
  const playerRace = useGameStore(s => s.playerRace);
  const playerClass = useGameStore(s => s.playerClass);

  const [heroY, setHeroY] = useState(null);
  const [walking, setWalking] = useState(false);
  const walkTimeout = useRef(null);

  const dungeonTheme = dungeonProgress?.theme || 'default';
  const config = DUNGEON_CONFIGS[dungeonTheme] || DUNGEON_CONFIGS.default;
  const currentNode = dungeonProgress?.currentNode || 0;
  const completed = dungeonProgress?.completed || [];
  const locationId = dungeonProgress?.locationId || 'dark_forest';

  const primarySprite = getPlayerSprite(playerRace, playerClass);

  const allCleared = currentNode >= config.nodes.length;
  const currentNodeY = allCleared ? 6 : (config.nodes[Math.min(currentNode, config.nodes.length - 1)]?.y || 82);

  useEffect(() => {
    if (heroY === null) {
      setHeroY(currentNodeY + 10);
      const entryTimer = setTimeout(() => {
        setWalking(true);
        setHeroY(currentNodeY);
        const arriveTimer = setTimeout(() => setWalking(false), 600);
        walkTimeout.current = arriveTimer;
      }, 100);
      return () => clearTimeout(entryTimer);
    }
  }, []);

  useEffect(() => { return () => { if (walkTimeout.current) clearTimeout(walkTimeout.current); }; }, []);

  const handleNodeClick = (nodeIdx) => {
    if (nodeIdx !== currentNode) return;
    if (completed.includes(nodeIdx)) return;
    if (walkTimeout.current) clearTimeout(walkTimeout.current);

    const node = config.nodes[nodeIdx];
    const targetY = node.y;
    setWalking(true);
    setHeroY(targetY);

    walkTimeout.current = setTimeout(() => {
      setWalking(false);
      useGameStore.setState({ currentLocation: locationId });

      if (node.bossId === 'evil_wizard' || (node.type === 'boss' && dungeonTheme === 'lava')) {
        useGameStore.setState({ currentScene: 'boss_walkup', screen: 'scene' });
        return;
      }

      startBattle(locationId);
    }, 600);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${config.bg})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />

      <div style={{
        position: 'absolute', top: 8, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: SCENE.HEADER,
      }}>
        <div className="font-cinzel" style={{ color: config.color, fontSize: '0.9rem', textShadow: `0 2px 8px ${config.color}60` }}>
          {config.name}
        </div>
        <div style={{ color: allCleared ? '#6ee7b3' : '#94a3b8', fontSize: '0.6rem', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          {allCleared ? 'Cleared!' : `Floor ${currentNode + 1} / ${config.nodes.length}`}
        </div>
      </div>

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: SCENE.PATHS, pointerEvents: 'none' }}>
        {config.nodes.map((node, idx) => {
          if (idx === config.nodes.length - 1) return null;
          const nextNode = config.nodes[idx + 1];
          return (
            <line key={`path_${idx}`}
              x1="50%" y1={`${node.y}%`}
              x2="50%" y2={`${nextNode.y}%`}
              stroke={completed.includes(idx) ? 'rgba(110,231,183,0.4)' : `${config.color}30`}
              strokeWidth="2" strokeDasharray={completed.includes(idx) ? 'none' : '4,4'}
            />
          );
        })}
      </svg>

      {config.nodes.map((node, idx) => {
        const isCompleted = completed.includes(idx);
        const isCurrent = idx === currentNode && !allCleared;
        const isLocked = idx > currentNode;
        const nodeColor = node.type === 'boss' ? '#ef4444' : node.type === 'elite' ? '#f59e0b' : config.color;

        return (
          <div key={idx} onClick={() => handleNodeClick(idx)} style={{
            position: 'absolute', left: '50%', top: `${node.y}%`,
            transform: 'translate(-50%, -50%)', cursor: isCurrent ? 'pointer' : 'default',
            zIndex: SCENE.NODES, textAlign: 'center', opacity: isLocked ? 0.4 : 1,
          }}>
            <div style={{
              width: node.type === 'boss' ? 80 : 68, height: node.type === 'boss' ? 80 : 68,
              borderRadius: 10,
              background: isCompleted
                ? 'rgba(110,231,183,0.15)'
                : `radial-gradient(circle, ${nodeColor}25, rgba(0,0,0,0.3))`,
              border: `2px solid ${isCompleted ? '#6ee7b3' : nodeColor}80`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isCurrent ? `0 0 20px ${nodeColor}60, inset 0 0 20px rgba(0,0,0,0.3)` : 'inset 0 0 20px rgba(0,0,0,0.3)',
              animation: isCurrent ? 'pulse 2s infinite' : 'none',
              overflow: 'hidden',
              filter: isCompleted ? 'grayscale(0.5)' : isLocked ? 'grayscale(0.8)' : 'none',
            }}>
              {isCompleted ? <span style={{ fontSize: '1.5rem', color: '#6ee7b3' }}>✓</span> : <img src={node.type === 'boss' ? '/images/buildings/boss_lair.png' : '/images/hunt_battle.png'} alt={node.name} style={{ width: node.type === 'boss' ? 68 : 56, height: node.type === 'boss' ? 68 : 56, objectFit: 'contain', imageRendering: 'auto', borderRadius: node.type === 'boss' ? 0 : 6 }} />}
            </div>
            <div className="font-cinzel" style={{
              color: isCompleted ? '#6ee7b3' : nodeColor,
              fontSize: '0.85rem', fontWeight: 700, marginTop: 4,
              textShadow: `0 2px 6px rgba(0,0,0,0.95), 0 0 10px ${nodeColor}40`, whiteSpace: 'nowrap',
            }}>
              {node.name}
            </div>
            {isCurrent && !isCompleted && (
              <div style={{
                color: '#fbbf24', fontSize: '0.4rem', fontWeight: 600, marginTop: 1,
                animation: 'pulse 1.5s infinite',
              }}>TAP TO FIGHT</div>
            )}
          </div>
        );
      })}

      {primarySprite && (
        <div style={{
          position: 'absolute', left: '38%', top: `${heroY ?? currentNodeY}%`,
          transform: 'translate(-50%, -50%)', zIndex: SCENE.HERO,
          transition: 'top 0.6s ease',
        }}>
          <SpriteAnimation
            spriteData={primarySprite}
            animation={walking ? 'walk' : 'idle'}
            scale={3}
            flip={false}
          />
        </div>
      )}

      {allCleared && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(10,15,30,0.95)', border: `2px solid ${config.color}`,
          borderRadius: 12, padding: 20, textAlign: 'center', zIndex: SCENE.POPUP,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}><InlineIcon name="trophy" size={16} /></div>
          <div className="font-cinzel" style={{ color: config.color, fontSize: '0.9rem', marginBottom: 8 }}>
            {config.name} Cleared!
          </div>
          <button onClick={exitScene} style={{
            background: `${config.color}30`, border: `1px solid ${config.color}`,
            borderRadius: 8, padding: '6px 16px', color: config.color, cursor: 'pointer',
            fontSize: '0.65rem', fontWeight: 700,
          }}>Return to World</button>
        </div>
      )}

      {!allCleared && (
        <div onClick={exitScene} style={{
          position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: SCENE.BACK_BUTTON, cursor: 'pointer', textAlign: 'center',
        }}>
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            background: `radial-gradient(circle, ${config.portalColor}50, ${config.portalColor}15)`,
            border: `2px solid ${config.portalColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', boxShadow: `0 0 20px ${config.portalColor}40`,
            animation: 'pulse 2s infinite',
          }}>
            <InlineIcon name="portal" />
          </div>
          <div style={{
            color: config.portalColor, fontSize: '0.5rem', fontWeight: 700, marginTop: 3,
            textShadow: '0 1px 4px rgba(0,0,0,0.8)',
          }}>Retreat</div>
        </div>
      )}
    </div>
  );
}
