import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, SCENE_NPCS } from '../data/spriteMap';
import { getItemPrice, getSellPrice } from '../data/equipment';
import { InlineIcon } from '../data/uiSprites';
import { setBgm } from '../utils/audioManager';
import NpcSprite from './NpcSprite';
import { SCENE } from '../constants/layers';
import { useDraggableNodes } from '../hooks/useSceneDrag';

const TRADER_NODES = [
  { id: 'weapons', name: 'Weapons', icon: 'crossed_swords', x: 18, y: 42, color: '#ef4444', filter: 'weapon', img: '/sprites/buildings/shop_cart.png' },
  { id: 'armor', name: 'Armor', icon: 'shield', x: 82, y: 42, color: '#3b82f6', filter: 'armor', img: '/sprites/buildings/shop_cart.png' },
  { id: 'potions', name: 'Potions', icon: 'crystal', x: 22, y: 68, color: '#a78bfa', filter: 'consumable', img: '/sprites/buildings/potion_cart.png' },
  { id: 'relics', name: 'Relics', icon: 'diamond', x: 78, y: 68, color: '#fbbf24', filter: 'accessory', img: '/sprites/buildings/shop_cart.png' },
];

const SPAWN_POS = { x: 50, y: 82 };

export default function TradingPostScene() {
  useEffect(() => { setBgm('tavern'); }, []);
  const exitScene = useGameStore(s => s.exitScene);
  const gold = useGameStore(s => s.gold);
  const shopInventory = useGameStore(s => s.shopInventory);
  const inventory = useGameStore(s => s.inventory);
  const refreshShop = useGameStore(s => s.refreshShop);
  const buyItem = useGameStore(s => s.buyItem);
  const sellItem = useGameStore(s => s.sellItem);
  const playerRace = useGameStore(s => s.playerRace);
  const playerClass = useGameStore(s => s.playerClass);
  const sceneReturnTo = useGameStore(s => s.sceneReturnTo);

  const [selectedTrader, setSelectedTrader] = useState(null);
  const [heroX, setHeroX] = useState(SPAWN_POS.x);
  const [heroY, setHeroY] = useState(SPAWN_POS.y);
  const [walking, setWalking] = useState(false);
  const [facingLeft, setFacingLeft] = useState(false);
  const [tab, setTab] = useState('buy');
  const walkTimeout = useRef(null);

  const allNodes = [
    ...TRADER_NODES.map(n => ({ id: n.id, x: n.x, y: n.y })),
    ...(SCENE_NPCS.trading || []).map(n => ({ id: n.id, x: n.x, y: n.y })),
  ];
  const { positions, onMouseDown: onNodeDragStart, containerRef: sceneRef, adminMode } = useDraggableNodes(allNodes);

  useEffect(() => {
    if (shopInventory.length === 0) refreshShop();
  }, []);

  useEffect(() => { return () => { if (walkTimeout.current) clearTimeout(walkTimeout.current); }; }, []);

  const primarySprite = getPlayerSprite(playerRace, playerClass);

  const handleTraderClick = (traderId) => {
    if (walkTimeout.current) clearTimeout(walkTimeout.current);
    const trader = TRADER_NODES.find(t => t.id === traderId);
    if (!trader) return;
    const targetX = trader.x - 6;
    const targetY = trader.y + 6;
    setFacingLeft(targetX < heroX);
    setWalking(true);
    setHeroX(targetX);
    setHeroY(targetY);
    walkTimeout.current = setTimeout(() => {
      setWalking(false);
      setSelectedTrader(traderId);
    }, 500);
  };

  const getFilteredShop = () => {
    if (!selectedTrader) return shopInventory;
    const trader = TRADER_NODES.find(t => t.id === selectedTrader);
    if (!trader) return shopInventory;
    if (trader.filter === 'weapon') return shopInventory.filter(i => i.slot === 'weapon');
    if (trader.filter === 'armor') return shopInventory.filter(i => ['armor', 'helmet', 'feet', 'offhand'].includes(i.slot));
    if (trader.filter === 'consumable') return shopInventory.filter(i => i.isConsumable);
    if (trader.filter === 'accessory') return shopInventory.filter(i => ['ring', 'relic'].includes(i.slot));
    return shopInventory;
  };

  const getSellItems = () => {
    if (!selectedTrader) return inventory;
    const trader = TRADER_NODES.find(t => t.id === selectedTrader);
    if (!trader) return inventory;
    if (trader.filter === 'weapon') return inventory.filter(i => i.slot === 'weapon');
    if (trader.filter === 'armor') return inventory.filter(i => ['armor', 'helmet', 'feet', 'offhand'].includes(i.slot));
    if (trader.filter === 'consumable') return inventory.filter(i => i.isConsumable);
    if (trader.filter === 'accessory') return inventory.filter(i => ['ring', 'relic'].includes(i.slot));
    return inventory;
  };

  const tierColors = { 1: '#9ca3af', 2: '#4ade80', 3: '#3b82f6', 4: '#a78bfa', 5: '#f59e0b', 6: '#ef4444', 7: '#ec4899', 8: '#fbbf24' };

  return (
    <div ref={sceneRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/scene_trading.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.1)', pointerEvents: 'none' }} />

      <div style={{
        position: 'absolute', top: 8, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: SCENE.HEADER,
      }}>
        <div className="font-cinzel" style={{ color: '#fbbf24', fontSize: '0.9rem', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
          Trading Post
        </div>
        <span style={{ color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          {gold} Gold
        </span>
      </div>

      {TRADER_NODES.map(trader => {
        const pos = positions[trader.id] || { x: trader.x, y: trader.y };
        return (
          <div key={trader.id}
            onClick={() => !adminMode && handleTraderClick(trader.id)}
            onMouseDown={(e) => onNodeDragStart(trader.id, e)}
            style={{
              position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: adminMode ? 'grab' : 'pointer',
              zIndex: SCENE.NODES, textAlign: 'center',
              outline: adminMode ? '2px dashed #f59e0b' : 'none',
            }}>
            <div style={{
              width: 96, height: 96,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              filter: selectedTrader === trader.id ? `drop-shadow(0 0 12px ${trader.color})` : `drop-shadow(0 0 6px ${trader.color}60)`,
              animation: selectedTrader === trader.id ? 'pulse 1.5s infinite' : 'none',
              transition: 'filter 0.3s ease',
            }}>
              <img src={trader.img} alt={trader.name} style={{ width: 88, height: 88, objectFit: 'contain', imageRendering: 'pixelated' }} />
            </div>
            <div className="font-cinzel" style={{
              color: trader.color, fontSize: '0.9rem', fontWeight: 700, marginTop: 4,
              textShadow: `0 2px 6px rgba(0,0,0,0.95), 0 0 10px ${trader.color}40`,
            }}>{trader.name}</div>
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
          zIndex: SCENE.LABELS,
          transition: 'left 0.5s ease, top 0.5s ease',
        }}>
          <SpriteAnimation
            spriteData={primarySprite}
            animation={walking ? 'walk' : 'idle'}
            scale={3}
            flip={facingLeft}
          />
        </div>
      )}

      {selectedTrader && (
        <div style={{
          position: 'absolute', top: '8%', left: '50%', transform: 'translateX(-50%)',
          width: '80%', maxWidth: 340, maxHeight: '70%',
          background: 'rgba(10,15,30,0.95)', border: '2px solid #fbbf24',
          borderRadius: 12, zIndex: SCENE.POPUP, backdropFilter: 'blur(8px)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="font-cinzel" style={{ color: TRADER_NODES.find(t => t.id === selectedTrader)?.color || '#fff', fontSize: '0.75rem' }}>
              {TRADER_NODES.find(t => t.id === selectedTrader)?.name} Trader
            </div>
            <button onClick={() => { setSelectedTrader(null); setHeroX(SPAWN_POS.x); setHeroY(SPAWN_POS.y); }} style={{
              background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.9rem',
            }}>✕</button>
          </div>

          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            {['buy', 'sell'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '5px 0', background: tab === t ? 'rgba(251,191,36,0.15)' : 'transparent',
                border: 'none', borderBottom: tab === t ? '2px solid #fbbf24' : '2px solid transparent',
                color: tab === t ? '#fbbf24' : '#888', cursor: 'pointer',
                fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase',
              }}>{t}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 8 }}>
            {tab === 'buy' ? (
              getFilteredShop().length === 0 ? (
                <div style={{ color: '#666', fontSize: '0.55rem', textAlign: 'center', padding: 16 }}>No items available</div>
              ) : (
                getFilteredShop().map(item => {
                  const price = getItemPrice(item);
                  const canAfford = gold >= price;
                  return (
                    <div key={item.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '4px 6px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}>
                      <div>
                        <span style={{ color: tierColors[item.tier] || '#ccc', fontSize: '0.55rem', fontWeight: 600 }}>
                          {item.icon ? <InlineIcon name={item.icon} /> : <InlineIcon name="bag" />} {item.name}
                        </span>
                        <span style={{ color: '#666', fontSize: '0.4rem', marginLeft: 4 }}>T{item.tier}</span>
                      </div>
                      <button disabled={!canAfford} onClick={() => buyItem(item.id)} style={{
                        background: canAfford ? 'rgba(251,191,36,0.2)' : 'rgba(50,50,50,0.3)',
                        border: '1px solid rgba(251,191,36,0.3)', borderRadius: 4,
                        padding: '2px 8px', color: canAfford ? '#fbbf24' : '#555',
                        cursor: canAfford ? 'pointer' : 'default', fontSize: '0.45rem', fontWeight: 700,
                      }}>{price}g</button>
                    </div>
                  );
                })
              )
            ) : (
              getSellItems().length === 0 ? (
                <div style={{ color: '#666', fontSize: '0.55rem', textAlign: 'center', padding: 16 }}>No items to sell</div>
              ) : (
                getSellItems().map(item => {
                  const price = getSellPrice(item);
                  return (
                    <div key={item.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '4px 6px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}>
                      <div>
                        <span style={{ color: tierColors[item.tier] || '#ccc', fontSize: '0.55rem', fontWeight: 600 }}>
                          {item.icon ? <InlineIcon name={item.icon} /> : <InlineIcon name="bag" />} {item.name}
                        </span>
                      </div>
                      <button onClick={() => sellItem(item.id)} style={{
                        background: 'rgba(110,231,183,0.2)', border: '1px solid rgba(110,231,183,0.3)',
                        borderRadius: 4, padding: '2px 8px', color: '#6ee7b3',
                        cursor: 'pointer', fontSize: '0.45rem', fontWeight: 700,
                      }}>{price}g</button>
                    </div>
                  );
                })
              )
            )}
          </div>

          <div style={{ padding: '4px 8px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
            <button onClick={refreshShop} style={{
              background: 'rgba(100,100,100,0.2)', border: '1px solid #555',
              borderRadius: 4, padding: '3px 10px', color: '#aaa', cursor: 'pointer',
              fontSize: '0.5rem',
            }}>Refresh Stock</button>
          </div>
        </div>
      )}

      {(SCENE_NPCS.trading || []).map(npc => {
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
          background: 'radial-gradient(circle, rgba(251,191,36,0.4), rgba(251,191,36,0.1))',
          border: '2px solid #fbbf24',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', boxShadow: '0 0 20px rgba(251,191,36,0.4)',
          animation: 'pulse 2s infinite',
        }}>
          <InlineIcon name="portal" />
        </div>
        <div style={{
          color: '#fbbf24', fontSize: '0.5rem', fontWeight: 700, marginTop: 3,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>Return to City</div>
      </div>
    </div>
  );
}
