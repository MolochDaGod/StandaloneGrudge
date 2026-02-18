import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, racalvinSprite, fireKnightSprite, namedHeroes } from '../data/spriteMap';
import { getItemPrice, getSellPrice } from '../data/equipment';
import { InlineIcon } from '../data/uiSprites';
import { setBgm } from '../utils/audioManager';
import { SCENE } from '../constants/layers';

const PIRATE_BARKS = [
  "Ahoy! Looking for something... special?",
  "We've plundered the finest gear across the skies!",
  "Gold talks, landlubber. What'll it be?",
  "The Pirate King's personal collection — not for the faint of heart.",
  "Captain Wayne handpicked these himself!",
  "Rare wares, fresh from the clouds!",
  "Trade or be traded — pirate's code!",
  "You won't find this quality on the ground, friend.",
];

const cptJohnWayneSprite = { ...fireKnightSprite, filter: 'sepia(0.4) saturate(1.2) hue-rotate(-15deg) brightness(0.95)' };

export default function AirshipScene() {
  useEffect(() => { setBgm('tavern'); }, []);
  const exitScene = useGameStore(s => s.exitScene);
  const gold = useGameStore(s => s.gold);
  const pirateShopInventory = useGameStore(s => s.pirateShopInventory);
  const refreshPirateShop = useGameStore(s => s.refreshPirateShop);
  const buyPirateItem = useGameStore(s => s.buyPirateItem);
  const sellItem = useGameStore(s => s.sellItem);
  const inventory = useGameStore(s => s.inventory);
  const heroRoster = useGameStore(s => s.heroRoster);
  const activeHeroIds = useGameStore(s => s.activeHeroIds);
  const playerRace = useGameStore(s => s.playerRace);
  const playerClass = useGameStore(s => s.playerClass);
  const playerName = useGameStore(s => s.playerName);

  const [shopOpen, setShopOpen] = useState(false);
  const [tab, setTab] = useState('buy');
  const [npcBark, setNpcBark] = useState(null);
  const barkTimer = useRef(null);

  useEffect(() => {
    if (pirateShopInventory.length === 0) refreshPirateShop();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (shopOpen) return;
      setNpcBark(PIRATE_BARKS[Math.floor(Math.random() * PIRATE_BARKS.length)]);
      if (barkTimer.current) clearTimeout(barkTimer.current);
      barkTimer.current = setTimeout(() => setNpcBark(null), 3500);
    }, 7000 + Math.random() * 4000);
    return () => { clearInterval(interval); if (barkTimer.current) clearTimeout(barkTimer.current); };
  }, [shopOpen]);

  const activeHeroes = activeHeroIds
    .map(id => heroRoster.find(h => h.id === id))
    .filter(Boolean)
    .slice(0, 3);

  const racalvinOnTeam = activeHeroes.some(h => h.namedHeroId === 'racalvin');
  const cptOnTeam = activeHeroes.some(h => h.namedHeroId === 'cptjohnwayne');

  const tierColors = { 1: '#9ca3af', 2: '#4ade80', 3: '#3b82f6', 4: '#a78bfa', 5: '#f59e0b', 6: '#ef4444', 7: '#ec4899', 8: '#fbbf24' };

  const pirateMarkup = 1.5;

  const getPiratePrice = (item) => {
    const base = getItemPrice(item);
    return Math.floor(base * pirateMarkup);
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/scene_airship.png)',
        backgroundSize: 'cover', backgroundPosition: 'center bottom',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', pointerEvents: 'none' }} />

      <div style={{
        position: 'absolute', top: 8, left: 16, right: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: SCENE.HEADER,
      }}>
        <div style={{ color: '#d4a017', fontSize: '1.3rem', textShadow: '0 2px 8px rgba(0,0,0,0.8)', fontFamily: "'LifeCraft', 'Cinzel', serif" }}>
          The Grudge — Pirate Airship
        </div>
        <span style={{ color: '#fbbf24', fontSize: '1rem', fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.8)', fontFamily: "'LifeCraft', 'Cinzel', serif" }}>
          {gold} Gold
        </span>
      </div>

      <div style={{
        position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        zIndex: SCENE.HEADER, display: 'flex', gap: 6, alignItems: 'center',
        background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '3px 10px',
        border: '1px solid rgba(212,160,23,0.3)',
      }}>
        <span style={{ color: '#d4a017', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
          onClick={() => setShopOpen(true)}>
          Click pirates to trade
        </span>
        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>|</span>
        <span style={{ color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer' }}
          onClick={exitScene}>
          Leave Ship
        </span>
      </div>

      {activeHeroes.map((hero, i) => {
        const sprite = getPlayerSprite(hero.classId, hero.raceId, hero.namedHeroId);
        if (!sprite) return null;
        const yPositions = [68, 72, 76];
        const xPositions = [10, 18, 14];
        return (
          <div key={hero.id} style={{
            position: 'absolute',
            left: `${xPositions[i]}%`, top: `${yPositions[i]}%`,
            transform: 'translate(-50%, -100%)',
            zIndex: SCENE.NODES + i,
          }}>
            <SpriteAnimation
              spriteData={sprite}
              action="idle"
              containerless={false}
              style={{ imageRendering: 'pixelated' }}
            />
            <div style={{
              textAlign: 'center', marginTop: 2,
              fontSize: '0.6rem', color: '#fbbf24',
              fontFamily: 'Cinzel, serif', fontWeight: 600,
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
            }}>
              {hero.name}
            </div>
          </div>
        );
      })}

      {!racalvinOnTeam && (
        <div
          onClick={() => setShopOpen(true)}
          style={{
            position: 'absolute',
            left: '72%', top: '62%',
            transform: 'translate(-50%, -100%)',
            zIndex: SCENE.NODES + 5,
            cursor: 'pointer',
          }}
        >
          <SpriteAnimation
            spriteData={racalvinSprite}
            action="idle"
            containerless={false}
            flip={true}
            style={{ imageRendering: 'pixelated' }}
          />
          <div style={{
            textAlign: 'center', marginTop: 2,
            fontSize: '0.65rem', color: '#d4a017',
            fontFamily: "'LifeCraft', Cinzel, serif", fontWeight: 700,
            textShadow: '0 0 8px rgba(212,160,23,0.6), 0 2px 4px rgba(0,0,0,0.9)',
          }}>
            Racalvin
          </div>
          <div style={{
            textAlign: 'center', fontSize: '0.5rem', color: '#fbbf24',
            fontFamily: 'Jost, sans-serif',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          }}>
            The Pirate King
          </div>
        </div>
      )}

      {racalvinOnTeam && (
        <div style={{
          position: 'absolute',
          left: '72%', top: '62%',
          transform: 'translate(-50%, -100%)',
          zIndex: SCENE.NODES + 5,
          cursor: 'pointer',
        }} onClick={() => setShopOpen(true)}>
          <div style={{
            width: 60, height: 80,
            background: 'radial-gradient(circle, rgba(212,160,23,0.3), transparent)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(212,160,23,0.3)',
          }}>
            <span style={{ fontSize: '2rem' }}>🏴‍☠️</span>
          </div>
          <div style={{
            textAlign: 'center', marginTop: 2,
            fontSize: '0.55rem', color: '#d4a017',
            fontFamily: 'Cinzel, serif', fontWeight: 600,
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          }}>
            Pirate Crew
          </div>
        </div>
      )}

      {!cptOnTeam && (
        <div
          onClick={() => setShopOpen(true)}
          style={{
            position: 'absolute',
            left: '84%', top: '66%',
            transform: 'translate(-50%, -100%)',
            zIndex: SCENE.NODES + 4,
            cursor: 'pointer',
          }}
        >
          <SpriteAnimation
            spriteData={cptJohnWayneSprite}
            action="idle"
            containerless={false}
            flip={true}
            style={{ imageRendering: 'pixelated' }}
          />
          <div style={{
            textAlign: 'center', marginTop: 2,
            fontSize: '0.65rem', color: '#c97b2a',
            fontFamily: "'LifeCraft', Cinzel, serif", fontWeight: 700,
            textShadow: '0 0 8px rgba(201,123,42,0.6), 0 2px 4px rgba(0,0,0,0.9)',
          }}>
            Cpt John Wayne
          </div>
          <div style={{
            textAlign: 'center', fontSize: '0.5rem', color: '#fbbf24',
            fontFamily: 'Jost, sans-serif',
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          }}>
            The Sky Captain
          </div>
        </div>
      )}

      {cptOnTeam && (
        <div style={{
          position: 'absolute',
          left: '84%', top: '66%',
          transform: 'translate(-50%, -100%)',
          zIndex: SCENE.NODES + 4,
          cursor: 'pointer',
        }} onClick={() => setShopOpen(true)}>
          <div style={{
            width: 60, height: 80,
            background: 'radial-gradient(circle, rgba(201,123,42,0.3), transparent)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid rgba(201,123,42,0.3)',
          }}>
            <span style={{ fontSize: '2rem' }}>⚔️</span>
          </div>
          <div style={{
            textAlign: 'center', marginTop: 2,
            fontSize: '0.55rem', color: '#c97b2a',
            fontFamily: 'Cinzel, serif', fontWeight: 600,
            textShadow: '0 1px 3px rgba(0,0,0,0.9)',
          }}>
            First Mate
          </div>
        </div>
      )}

      {npcBark && !shopOpen && (
        <div style={{
          position: 'absolute', left: '72%', top: '48%',
          transform: 'translateX(-50%)',
          background: 'rgba(30,20,5,0.95)', border: '1px solid #d4a017',
          borderRadius: 10, padding: '6px 14px', maxWidth: 220,
          color: '#fbbf24', fontSize: '0.75rem', fontFamily: 'Jost, sans-serif',
          textAlign: 'center', zIndex: SCENE.POPUPS,
          animation: 'fadeIn 0.3s ease-out',
          boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
        }}>
          {npcBark}
          <div style={{
            position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent',
            borderTop: '6px solid #d4a017',
          }} />
        </div>
      )}

      {shopOpen && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: SCENE.POPUPS + 1,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onClick={() => setShopOpen(false)}
        >
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(135deg, rgba(30,20,5,0.98), rgba(50,35,10,0.98))',
            border: '2px solid #d4a017',
            borderRadius: 16, width: '90%', maxWidth: 600, maxHeight: '80vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
            boxShadow: '0 0 40px rgba(212,160,23,0.3)',
          }}>
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid rgba(212,160,23,0.3)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, rgba(212,160,23,0.1), transparent)',
            }}>
              <div>
                <div style={{
                  fontFamily: "'LifeCraft', Cinzel, serif", fontSize: '1.2rem',
                  color: '#d4a017', textShadow: '0 0 8px rgba(212,160,23,0.4)',
                }}>
                  Pirate's Plunder
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>
                  Premium gear at pirate prices
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ color: '#fbbf24', fontWeight: 700, fontFamily: "'LifeCraft', serif" }}>
                  {gold} Gold
                </span>
                <button onClick={() => setShopOpen(false)} style={{
                  background: 'none', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                  fontSize: '0.8rem',
                }}>
                  Close
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(212,160,23,0.2)' }}>
              {['buy', 'sell'].map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
                  background: tab === t ? 'rgba(212,160,23,0.15)' : 'transparent',
                  color: tab === t ? '#d4a017' : '#94a3b8',
                  fontFamily: 'Cinzel, serif', fontWeight: 700, fontSize: '0.85rem',
                  borderBottom: tab === t ? '2px solid #d4a017' : '2px solid transparent',
                  textTransform: 'uppercase',
                }}>
                  {t === 'buy' ? 'Buy Wares' : 'Sell Items'}
                </button>
              ))}
            </div>

            <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}>
              {tab === 'buy' && (
                <>
                  <div style={{
                    display: 'flex', justifyContent: 'flex-end', marginBottom: 6,
                  }}>
                    <button onClick={refreshPirateShop} style={{
                      background: 'rgba(212,160,23,0.15)', border: '1px solid rgba(212,160,23,0.3)',
                      color: '#d4a017', borderRadius: 6, padding: '4px 12px',
                      cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'Cinzel, serif',
                    }}>
                      Refresh Stock
                    </button>
                  </div>
                  {pirateShopInventory.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20, fontSize: '0.85rem' }}>
                      The pirates are restocking...
                    </div>
                  )}
                  {pirateShopInventory.map(item => {
                    const price = getPiratePrice(item);
                    const canAfford = gold >= price;
                    return (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '6px 8px', marginBottom: 4,
                        background: 'rgba(0,0,0,0.3)', borderRadius: 8,
                        border: `1px solid ${tierColors[item.tier] || '#333'}20`,
                        opacity: canAfford ? 1 : 0.5,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 6,
                          background: `radial-gradient(circle, ${tierColors[item.tier] || '#666'}30, rgba(0,0,0,0.3))`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid ${tierColors[item.tier] || '#666'}40`,
                          flexShrink: 0,
                        }}>
                          {item.icon && <InlineIcon name={item.icon} size={20} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            color: tierColors[item.tier] || '#fff', fontSize: '0.8rem',
                            fontWeight: 600, fontFamily: 'Cinzel, serif',
                          }}>
                            {item.name} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>T{item.tier}</span>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                            {item.slot} {item.isConsumable ? '(consumable)' : ''}
                          </div>
                        </div>
                        <button
                          disabled={!canAfford}
                          onClick={() => {
                            if (!canAfford) return;
                            buyPirateItem(item.id, price);
                          }}
                          style={{
                            background: canAfford ? 'rgba(212,160,23,0.2)' : 'rgba(100,100,100,0.2)',
                            border: `1px solid ${canAfford ? '#d4a017' : '#666'}`,
                            color: canAfford ? '#fbbf24' : '#666',
                            borderRadius: 6, padding: '4px 10px', cursor: canAfford ? 'pointer' : 'not-allowed',
                            fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
                          }}
                        >
                          {price}g
                        </button>
                      </div>
                    );
                  })}
                </>
              )}

              {tab === 'sell' && (
                <>
                  {inventory.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#94a3b8', padding: 20, fontSize: '0.85rem' }}>
                      No items to sell
                    </div>
                  )}
                  {inventory.map(item => {
                    const price = getSellPrice(item);
                    return (
                      <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '6px 8px', marginBottom: 4,
                        background: 'rgba(0,0,0,0.3)', borderRadius: 8,
                        border: `1px solid ${tierColors[item.tier] || '#333'}20`,
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 6,
                          background: `radial-gradient(circle, ${tierColors[item.tier] || '#666'}30, rgba(0,0,0,0.3))`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: `1px solid ${tierColors[item.tier] || '#666'}40`,
                          flexShrink: 0,
                        }}>
                          {item.icon && <InlineIcon name={item.icon} size={20} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            color: tierColors[item.tier] || '#fff', fontSize: '0.8rem',
                            fontWeight: 600, fontFamily: 'Cinzel, serif',
                          }}>
                            {item.name} <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>T{item.tier}</span>
                          </div>
                          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
                            {item.slot}
                          </div>
                        </div>
                        <button
                          onClick={() => sellItem(item.id)}
                          style={{
                            background: 'rgba(34,197,94,0.2)',
                            border: '1px solid #22c55e',
                            color: '#4ade80',
                            borderRadius: 6, padding: '4px 10px', cursor: 'pointer',
                            fontSize: '0.75rem', fontWeight: 700, whiteSpace: 'nowrap',
                          }}
                        >
                          +{price}g
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <button onClick={exitScene} style={{
        position: 'absolute', top: 8, right: 8, zIndex: SCENE.HEADER + 1,
        background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.2)',
        color: '#fff', borderRadius: 8, padding: '6px 14px', cursor: 'pointer',
        fontSize: '0.8rem', fontFamily: 'Cinzel, serif',
      }}>
        Leave Ship
      </button>
    </div>
  );
}
