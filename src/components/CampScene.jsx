import React, { useState } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import { InlineIcon } from '../data/uiSprites';

const RESOURCE_NODES = [
  { id: 'gold_mine', name: 'Gold Mine', icon: 'pickaxe', resource: 'gold', x: 18, y: 30, color: '#fbbf24' },
  { id: 'herb_garden', name: 'Herb Garden', icon: 'nature', resource: 'herbs', x: 72, y: 28, color: '#4ade80' },
  { id: 'lumber_yard', name: 'Lumber Yard', icon: 'wood', resource: 'wood', x: 12, y: 58, color: '#a3764a' },
  { id: 'ore_vein', name: 'Ore Vein', icon: 'ore', resource: 'ore', x: 80, y: 55, color: '#94a3b8' },
  { id: 'crystal_cave', name: 'Crystal Cave', icon: 'diamond', resource: 'crystals', x: 50, y: 22, color: '#a78bfa' },
];

const SELL_PRICES = { gold: 1, herbs: 2, wood: 2, ore: 4, crystals: 8 };

export default function CampScene() {
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

  React.useEffect(() => {
    const interval = setInterval(() => tickHarvests(), 1000);
    return () => clearInterval(interval);
  }, []);

  const availableHeroes = heroRoster.filter(h => {
    const isHarvesting = Object.values(activeHarvests).includes(h.id);
    return !isHarvesting;
  });

  const primarySprite = getPlayerSprite(playerRace, playerClass);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/scene_camp.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', pointerEvents: 'none' }} />

      <div style={{
        position: 'absolute', top: 8, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 20,
      }}>
        <div className="font-cinzel" style={{ color: '#4ade80', fontSize: '0.9rem', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
          Camp
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
            {gold} Gold
          </span>
          <button onClick={() => setShowSellPanel(!showSellPanel)} style={{
            background: 'rgba(0,0,0,0.6)', border: '1px solid #fbbf24', borderRadius: 8,
            padding: '4px 12px', color: '#fbbf24', cursor: 'pointer', fontSize: '0.65rem', fontWeight: 700,
            backdropFilter: 'blur(4px)',
          }}>Sell Resources</button>
        </div>
      </div>

      {primarySprite && (
        <div style={{ position: 'absolute', left: '45%', top: '68%', transform: 'translate(-50%, -50%)', zIndex: 10 }}>
          <SpriteAnimation
            src={primarySprite.src}
            frameWidth={primarySprite.frameWidth || 100}
            frameHeight={primarySprite.frameHeight || 100}
            totalFrames={primarySprite.idle?.frames || 4}
            row={primarySprite.idle?.row || 0}
            fps={6}
            scale={2.5}
          />
        </div>
      )}

      {RESOURCE_NODES.map(node => {
        const storeNode = harvestNodes.find(n => n.id === node.id);
        if (!storeNode || level < storeNode.unlockLevel) return null;
        const assignedHeroId = activeHarvests[node.id];
        const assignedHero = assignedHeroId ? heroRoster.find(h => h.id === assignedHeroId) : null;
        const resourceAmount = Math.floor(harvestResources[node.resource] || 0);

        return (
          <div key={node.id} onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)} style={{
            position: 'absolute', left: `${node.x}%`, top: `${node.y}%`,
            transform: 'translate(-50%, -50%)', cursor: 'pointer', zIndex: 15,
            textAlign: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: `radial-gradient(circle, ${node.color}40, ${node.color}15)`,
              border: `2px solid ${node.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', boxShadow: `0 0 12px ${node.color}60`,
              animation: assignedHero ? 'pulse 2s infinite' : 'none',
            }}>
              <InlineIcon name={node.icon} />
            </div>
            <div style={{
              color: node.color, fontSize: '0.5rem', fontWeight: 700, marginTop: 2,
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              whiteSpace: 'nowrap',
            }}>
              {node.name}
            </div>
            {resourceAmount > 0 && (
              <div style={{
                color: '#fff', fontSize: '0.45rem', fontWeight: 600,
                background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: '1px 4px',
                marginTop: 1,
              }}>
                {resourceAmount}
              </div>
            )}
            {assignedHero && (
              <div style={{
                color: '#6ee7b3', fontSize: '0.4rem', fontWeight: 600, marginTop: 1,
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
              }}>
                {assignedHero.name}
              </div>
            )}

            {selectedNode === node.id && (
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(10,15,30,0.95)', border: `1px solid ${node.color}`,
                borderRadius: 8, padding: 8, minWidth: 120, marginTop: 4,
                backdropFilter: 'blur(8px)', zIndex: 30,
              }} onClick={e => e.stopPropagation()}>
                {assignedHero ? (
                  <div>
                    <div style={{ color: '#6ee7b3', fontSize: '0.55rem', marginBottom: 4 }}>
                      {assignedHero.name} harvesting
                    </div>
                    <button onClick={() => recallHarvest(node.id)} style={{
                      width: '100%', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444',
                      borderRadius: 6, padding: '3px 8px', color: '#ef4444', cursor: 'pointer',
                      fontSize: '0.5rem', fontWeight: 700,
                    }}>Recall</button>
                  </div>
                ) : (
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '0.5rem', marginBottom: 4 }}>Assign Hero:</div>
                    {availableHeroes.length === 0 ? (
                      <div style={{ color: '#666', fontSize: '0.45rem' }}>No heroes available</div>
                    ) : (
                      availableHeroes.map(hero => (
                        <button key={hero.id} onClick={() => { assignHarvest(node.id, hero.id); setSelectedNode(null); }} style={{
                          width: '100%', background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.3)',
                          borderRadius: 4, padding: '2px 6px', color: '#6ee7b3', cursor: 'pointer',
                          fontSize: '0.5rem', fontWeight: 600, marginBottom: 2, textAlign: 'left',
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
          borderRadius: 12, padding: 16, minWidth: 220, zIndex: 50,
          backdropFilter: 'blur(8px)',
        }}>
          <div className="font-cinzel" style={{ color: '#fbbf24', fontSize: '0.8rem', marginBottom: 8, textAlign: 'center' }}>
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
                  <span style={{ color: '#e2e8f0', fontSize: '0.6rem', textTransform: 'capitalize' }}>{res}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.5rem', marginLeft: 6 }}>x{amount}</span>
                  <span style={{ color: '#fbbf24', fontSize: '0.45rem', marginLeft: 4 }}>({price}g ea)</span>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button disabled={amount < 10} onClick={() => sellResource(res, 10)} style={{
                    background: amount >= 10 ? 'rgba(251,191,36,0.2)' : 'rgba(50,50,50,0.3)',
                    border: '1px solid rgba(251,191,36,0.3)', borderRadius: 4,
                    padding: '2px 6px', color: amount >= 10 ? '#fbbf24' : '#555', cursor: amount >= 10 ? 'pointer' : 'default',
                    fontSize: '0.45rem', fontWeight: 700,
                  }}>x10</button>
                  <button disabled={amount < 1} onClick={() => sellResource(res, amount)} style={{
                    background: amount >= 1 ? 'rgba(251,191,36,0.2)' : 'rgba(50,50,50,0.3)',
                    border: '1px solid rgba(251,191,36,0.3)', borderRadius: 4,
                    padding: '2px 6px', color: amount >= 1 ? '#fbbf24' : '#555', cursor: amount >= 1 ? 'pointer' : 'default',
                    fontSize: '0.45rem', fontWeight: 700,
                  }}>All</button>
                </div>
              </div>
            );
          })}
          <button onClick={() => setShowSellPanel(false)} style={{
            width: '100%', background: 'rgba(100,100,100,0.2)', border: '1px solid #555',
            borderRadius: 6, padding: '4px 0', color: '#aaa', cursor: 'pointer',
            fontSize: '0.55rem', marginTop: 8,
          }}>Close</button>
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
        }}>Return to Map</div>
      </div>
    </div>
  );
}
