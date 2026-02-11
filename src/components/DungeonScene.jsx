import React, { useState } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, getEnemySprite } from '../data/spriteMap';

const DUNGEON_CONFIGS = {
  default: {
    name: 'Dark Dungeon',
    nodes: [
      { type: 'battle', name: 'Entrance Guard', y: 82, enemies: 2 },
      { type: 'battle', name: 'Dungeon Patrol', y: 65, enemies: 3 },
      { type: 'elite', name: 'Elite Sentry', y: 48, enemies: 2 },
      { type: 'battle', name: 'Inner Chamber', y: 32, enemies: 3 },
      { type: 'boss', name: 'Dungeon Lord', y: 16, enemies: 1 },
    ],
  },
};

export default function DungeonScene() {
  const exitScene = useGameStore(s => s.exitScene);
  const dungeonProgress = useGameStore(s => s.dungeonProgress);
  const startBattle = useGameStore(s => s.startBattle);
  const playerRace = useGameStore(s => s.playerRace);
  const playerClass = useGameStore(s => s.playerClass);
  const level = useGameStore(s => s.level);

  const [heroPos, setHeroPos] = useState(null);

  const config = DUNGEON_CONFIGS.default;
  const currentNode = dungeonProgress?.currentNode || 0;
  const completed = dungeonProgress?.completed || [];
  const locationId = dungeonProgress?.locationId || 'dark_forest';

  const primarySprite = getPlayerSprite(playerRace, playerClass);

  const handleNodeClick = (nodeIdx) => {
    if (nodeIdx !== currentNode) return;
    if (completed.includes(nodeIdx)) return;

    useGameStore.setState({ currentLocation: locationId });
    startBattle(locationId);
  };

  const allCleared = currentNode >= config.nodes.length;
  const heroY = allCleared ? 10 : (config.nodes[Math.min(currentNode, config.nodes.length - 1)]?.y || 82);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/scene_dungeon.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', pointerEvents: 'none' }} />

      <div style={{
        position: 'absolute', top: 8, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20,
      }}>
        <div className="font-cinzel" style={{ color: '#f97316', fontSize: '0.9rem', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
          {config.name}
        </div>
        <div style={{ color: allCleared ? '#6ee7b3' : '#94a3b8', fontSize: '0.6rem', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          {allCleared ? 'Cleared!' : `Floor ${currentNode + 1} / ${config.nodes.length}`}
        </div>
      </div>

      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
        {config.nodes.map((node, idx) => {
          if (idx === config.nodes.length - 1) return null;
          const nextNode = config.nodes[idx + 1];
          return (
            <line key={`path_${idx}`}
              x1="50%" y1={`${node.y}%`}
              x2="50%" y2={`${nextNode.y}%`}
              stroke={completed.includes(idx) ? 'rgba(110,231,183,0.4)' : 'rgba(255,255,255,0.1)'}
              strokeWidth="2" strokeDasharray={completed.includes(idx) ? 'none' : '4,4'}
            />
          );
        })}
      </svg>

      {config.nodes.map((node, idx) => {
        const isCompleted = completed.includes(idx);
        const isCurrent = idx === currentNode;
        const isLocked = idx > currentNode;
        const nodeColor = node.type === 'boss' ? '#ef4444' : node.type === 'elite' ? '#f59e0b' : '#6ee7b3';

        return (
          <div key={idx} onClick={() => handleNodeClick(idx)} style={{
            position: 'absolute', left: '50%', top: `${node.y}%`,
            transform: 'translate(-50%, -50%)', cursor: isCurrent ? 'pointer' : 'default',
            zIndex: 15, textAlign: 'center', opacity: isLocked ? 0.4 : 1,
          }}>
            <div style={{
              width: node.type === 'boss' ? 52 : 40, height: node.type === 'boss' ? 52 : 40,
              borderRadius: node.type === 'boss' ? 8 : '50%',
              background: isCompleted
                ? 'rgba(110,231,183,0.2)'
                : `radial-gradient(circle, ${nodeColor}40, ${nodeColor}15)`,
              border: `2px solid ${isCompleted ? '#6ee7b3' : nodeColor}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: node.type === 'boss' ? '1.3rem' : '1rem',
              boxShadow: isCurrent ? `0 0 16px ${nodeColor}60` : 'none',
              animation: isCurrent ? 'pulse 2s infinite' : 'none',
            }}>
              {isCompleted ? '✓' : node.type === 'boss' ? '💀' : node.type === 'elite' ? '⚔️' : '👹'}
            </div>
            <div style={{
              color: isCompleted ? '#6ee7b3' : nodeColor,
              fontSize: '0.5rem', fontWeight: 700, marginTop: 2,
              textShadow: '0 1px 4px rgba(0,0,0,0.9)', whiteSpace: 'nowrap',
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
          position: 'absolute', left: '38%', top: `${heroY}%`,
          transform: 'translate(-50%, -50%)', zIndex: 12,
          transition: 'top 0.6s ease',
        }}>
          <SpriteAnimation
            src={primarySprite.src}
            frameWidth={primarySprite.frameWidth || 100}
            frameHeight={primarySprite.frameHeight || 100}
            totalFrames={primarySprite.idle?.frames || 4}
            row={primarySprite.idle?.row || 0}
            fps={6}
            scale={2}
          />
        </div>
      )}

      {currentNode >= config.nodes.length && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          background: 'rgba(10,15,30,0.95)', border: '2px solid #fbbf24',
          borderRadius: 12, padding: 20, textAlign: 'center', zIndex: 50,
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏆</div>
          <div className="font-cinzel" style={{ color: '#fbbf24', fontSize: '0.9rem', marginBottom: 8 }}>
            Dungeon Cleared!
          </div>
          <button onClick={exitScene} style={{
            background: 'rgba(251,191,36,0.2)', border: '1px solid #fbbf24',
            borderRadius: 8, padding: '6px 16px', color: '#fbbf24', cursor: 'pointer',
            fontSize: '0.65rem', fontWeight: 700,
          }}>Return to World</button>
        </div>
      )}

      <div onClick={exitScene} style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        zIndex: 30, cursor: 'pointer', textAlign: 'center',
      }}>
        <div style={{
          width: 50, height: 50, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.4), rgba(249,115,22,0.1))',
          border: '2px solid #f97316',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', boxShadow: '0 0 20px rgba(249,115,22,0.4)',
          animation: 'pulse 2s infinite',
        }}>
          🌀
        </div>
        <div style={{
          color: '#f97316', fontSize: '0.5rem', fontWeight: 700, marginTop: 3,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>Retreat</div>
      </div>
    </div>
  );
}
