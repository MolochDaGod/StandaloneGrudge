import React, { useState, useEffect, useRef, useCallback } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite, SCENE_NPCS } from '../data/spriteMap';
import { getItemPrice, getSellPrice, generateShopInventory } from '../data/equipment';
import { InlineIcon } from '../data/uiSprites';
import { setBgm } from '../utils/audioManager';
import NpcSprite from './NpcSprite';
import { SCENE } from '../constants/layers';
import useWASD from '../hooks/useWASD';

const PORTAL_NODES = [
  { id: 'forge', name: 'Void Forge', icon: 'hammer', x: 25, y: 30, color: '#f97316', description: 'Upgrade equipment using resources' },
  { id: 'enchanter', name: 'Arcane Enchanter', icon: 'crystal', x: 75, y: 30, color: '#a78bfa', description: 'Enchant gear with harvested materials' },
  { id: 'soul_shop', name: 'Soul Vendor', icon: 'skull', x: 50, y: 20, color: '#ef4444', description: 'Trade for endgame equipment' },
  { id: 'salvage', name: 'Salvage Pit', icon: 'gold', x: 25, y: 60, color: '#fbbf24', description: 'Break down equipment for resources' },
  { id: 'void_dungeon', name: 'Void Rift', icon: 'portal', x: 75, y: 60, color: '#c026d3', description: 'Enter the Void Dungeon' },
  { id: 'lava_dungeon', name: 'Infernal Gate', icon: 'fire', x: 50, y: 50, color: '#dc2626', description: 'Descend into the Lava Depths' },
];

const ENCHANT_RECIPES = [
  { id: 'sharpen', name: 'Sharpen Weapon', stat: 'damage', bonus: 5, cost: { ore: 10, crystals: 3 }, icon: 'crossed_swords' },
  { id: 'reinforce', name: 'Reinforce Armor', stat: 'defense', bonus: 5, cost: { ore: 8, wood: 5 }, icon: 'shield' },
  { id: 'empower', name: 'Empower Magic', stat: 'mana', bonus: 20, cost: { crystals: 8, herbs: 5 }, icon: 'crystal' },
  { id: 'vitalize', name: 'Vitalize', stat: 'health', bonus: 30, cost: { herbs: 10, wood: 5 }, icon: 'heart' },
  { id: 'quicken', name: 'Quicken', stat: 'speed', bonus: 3, cost: { crystals: 5, herbs: 3 }, icon: 'lightning' },
];

const VOID_WHISPERS = [
  "The void stirs... ancient power beckons.",
  "Reality fractures around you...",
  "Dark energy pulses through the nexus.",
  "Whispers of the Void Archon echo...",
  "The abyss gazes back at you...",
  "Power untold awaits the worthy...",
];

const SPAWN_POS = { x: 50, y: 82 };

export default function PortalScene() {
  useEffect(() => { setBgm('scene'); }, []);
  const exitScene = useGameStore(s => s.exitScene);
  const gold = useGameStore(s => s.gold);
  const level = useGameStore(s => s.level);
  const playerRace = useGameStore(s => s.playerRace);
  const playerClass = useGameStore(s => s.playerClass);
  const harvestResources = useGameStore(s => s.harvestResources);
  const heroRoster = useGameStore(s => s.heroRoster);
  const upgradeEquipment = useGameStore(s => s.upgradeEquipment);
  const inventory = useGameStore(s => s.inventory);
  const equipItem = useGameStore(s => s.equipItem);
  const addGold = useGameStore(s => s.addGold);

  const [activePanel, setActivePanel] = useState(null);
  const [selectedHero, setSelectedHero] = useState(null);
  const [message, setMessage] = useState(null);
  const [shopItems, setShopItems] = useState(null);
  const [whisper, setWhisper] = useState(null);

  const handleInteract = useCallback((node) => {
    if (activePanel) return;

    if (node.id === 'void_dungeon') {
      useGameStore.getState().startDungeon('void_threshold', 'void');
      return;
    }
    if (node.id === 'lava_dungeon') {
      useGameStore.getState().startDungeon('corrupted_spire', 'lava');
      return;
    }

    if (node.id === 'soul_shop') {
      setShopItems(generateShopInventory(Math.max(level, 15)));
    }

    setActivePanel(node.id);
    const activeHeroes = heroRoster.filter(h => h.isActive);
    if (!selectedHero && activeHeroes.length > 0) {
      setSelectedHero(activeHeroes[0].id);
    }
  }, [activePanel, level, heroRoster, selectedHero]);

  const { heroX, heroY, walking, facingLeft, nearbyNode } = useWASD(SPAWN_POS, PORTAL_NODES, handleInteract);

  const playerName = useGameStore(s => s.playerName);
  const activeHero0 = heroRoster.find(h => h.name === playerName && h.classId === playerClass && h.raceId === playerRace);
  const primarySprite = getPlayerSprite(playerClass, playerRace, activeHero0?.namedHeroId);
  const activeHeroes = heroRoster.filter(h => h.isActive);

  useEffect(() => {
    const interval = setInterval(() => {
      if (activePanel || message) return;
      setWhisper(VOID_WHISPERS[Math.floor(Math.random() * VOID_WHISPERS.length)]);
      setTimeout(() => setWhisper(null), 3500);
    }, 7000 + Math.random() * 5000);
    return () => clearInterval(interval);
  }, [activePanel, message]);

  const showMsg = (text) => {
    setMessage(text);
    setTimeout(() => setMessage(null), 2500);
  };

  const canAfford = (cost) => {
    return Object.entries(cost).every(([res, amt]) => (harvestResources[res] || 0) >= amt);
  };

  const spendResources = (cost) => {
    const newRes = { ...useGameStore.getState().harvestResources };
    Object.entries(cost).forEach(([res, amt]) => { newRes[res] -= amt; });
    useGameStore.setState({ harvestResources: newRes });
  };

  const handleEnchant = (recipe) => {
    if (!selectedHero) return showMsg('Select a hero first');
    if (!canAfford(recipe.cost)) return showMsg('Not enough resources!');

    spendResources(recipe.cost);
    const state = useGameStore.getState();
    const roster = state.heroRoster.map(h => {
      if (h.id !== selectedHero) return h;
      const enchants = h.enchantBonuses || {};
      enchants[recipe.stat] = (enchants[recipe.stat] || 0) + recipe.bonus;
      return { ...h, enchantBonuses: enchants };
    });
    useGameStore.setState({ heroRoster: roster });
    showMsg(`Enchanted! +${recipe.bonus} ${recipe.stat}`);
  };

  const handleForgeUpgrade = (heroId, slot) => {
    const result = upgradeEquipment(heroId, slot);
    if (result?.success) {
      showMsg(`Upgraded ${slot} to ${result.newTier}!`);
    } else {
      showMsg(result?.message || 'Cannot upgrade further');
    }
  };

  const handleSalvage = (itemIdx) => {
    const item = inventory[itemIdx];
    if (!item) return;
    const goldVal = Math.max(1, Math.floor(getSellPrice(item) * 0.5));
    const resourceType = ['herbs', 'wood', 'ore', 'crystals'][Math.floor(Math.random() * 4)];
    const resourceAmt = Math.max(1, Math.floor(item.tier || 1));

    const newInv = [...inventory];
    newInv.splice(itemIdx, 1);
    const newRes = { ...useGameStore.getState().harvestResources };
    newRes[resourceType] = (newRes[resourceType] || 0) + resourceAmt;
    useGameStore.setState({ inventory: newInv, harvestResources: newRes });
    addGold(goldVal);
    showMsg(`Salvaged! +${goldVal} gold, +${resourceAmt} ${resourceType}`);
  };

  const handleBuyItem = (item, idx) => {
    const price = getItemPrice(item);
    if (gold < price) return showMsg('Not enough gold!');
    useGameStore.setState({ gold: gold - price, inventory: [...inventory, item] });
    const newShop = [...shopItems];
    newShop.splice(idx, 1);
    setShopItems(newShop);
    showMsg(`Purchased ${item.name}!`);
  };

  const renderPanel = () => {
    if (!activePanel) return null;

    const panelStyle = {
      position: 'absolute', top: '8%', left: '5%', right: '5%', bottom: '18%',
      background: 'rgba(10,10,25,0.95)', border: '2px solid #c026d3',
      borderRadius: 12, padding: '8px', zIndex: SCENE.TOOLTIP, overflow: 'auto',
      backdropFilter: 'blur(8px)',
    };

    const headerStyle = {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      marginBottom: 6, padding: '0 4px',
    };

    const closeBtn = (
      <button onClick={() => { setActivePanel(null); setShopItems(null); }} style={{
        background: 'rgba(239,68,68,0.3)', border: '1px solid #ef4444',
        borderRadius: 6, padding: '2px 10px', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem',
      }}>Close</button>
    );

    if (activePanel === 'forge') {
      return (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span className="font-cinzel" style={{ color: '#f97316', fontSize: '1rem' }}>Void Forge - Upgrade Equipment</span>
            {closeBtn}
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
            {activeHeroes.map(h => (
              <button key={h.id} onClick={() => setSelectedHero(h.id)} style={{
                background: selectedHero === h.id ? 'rgba(249,115,22,0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${selectedHero === h.id ? '#f97316' : '#333'}`,
                borderRadius: 6, padding: '3px 8px', color: '#e2e8f0', cursor: 'pointer', fontSize: '0.8rem',
              }}>{h.name}</button>
            ))}
          </div>
          {selectedHero && (() => {
            const hero = heroRoster.find(h => h.id === selectedHero);
            if (!hero) return null;
            const slots = Object.entries(hero.equipment || {}).filter(([, v]) => v);
            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {slots.map(([slot, item]) => (
                  <div key={slot} onClick={() => handleForgeUpgrade(hero.id, slot)} style={{
                    background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)',
                    borderRadius: 6, padding: '4px 6px', cursor: 'pointer',
                  }}>
                    <div style={{ color: '#f97316', fontSize: '0.75rem', fontWeight: 700 }}>{slot}</div>
                    <div style={{ color: '#e2e8f0', fontSize: '0.7rem' }}>{item.name} (T{item.tier || 1})</div>
                    <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>Tap to upgrade</div>
                  </div>
                ))}
                {slots.length === 0 && <div style={{ color: '#666', fontSize: '0.75rem', gridColumn: '1/3', textAlign: 'center', padding: 12 }}>No equipment to upgrade</div>}
              </div>
            );
          })()}
        </div>
      );
    }

    if (activePanel === 'enchanter') {
      return (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span className="font-cinzel" style={{ color: '#a78bfa', fontSize: '1rem' }}>Arcane Enchanter</span>
            {closeBtn}
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
            {Object.entries(harvestResources).filter(([k]) => k !== 'gold').map(([res, amt]) => (
              <span key={res} style={{ color: '#94a3b8', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: 4 }}>
                {res}: {Math.floor(amt)}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap' }}>
            {activeHeroes.map(h => (
              <button key={h.id} onClick={() => setSelectedHero(h.id)} style={{
                background: selectedHero === h.id ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${selectedHero === h.id ? '#a78bfa' : '#333'}`,
                borderRadius: 6, padding: '3px 8px', color: '#e2e8f0', cursor: 'pointer', fontSize: '0.8rem',
              }}>{h.name}</button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 4 }}>
            {ENCHANT_RECIPES.map(recipe => (
              <div key={recipe.id} onClick={() => handleEnchant(recipe)} style={{
                background: canAfford(recipe.cost) ? 'rgba(167,139,250,0.1)' : 'rgba(50,50,50,0.3)',
                border: `1px solid ${canAfford(recipe.cost) ? 'rgba(167,139,250,0.4)' : '#333'}`,
                borderRadius: 6, padding: '5px 8px', cursor: canAfford(recipe.cost) ? 'pointer' : 'not-allowed',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <InlineIcon name={recipe.icon} /> 
                  <span style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600 }}>{recipe.name}</span>
                  <span style={{ color: '#6ee7b3', fontSize: '0.7rem', marginLeft: 6 }}>+{recipe.bonus} {recipe.stat}</span>
                </div>
                <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>
                  {Object.entries(recipe.cost).map(([r, a]) => `${a} ${r}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activePanel === 'soul_shop') {
      const items = shopItems || [];
      return (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span className="font-cinzel" style={{ color: '#ef4444', fontSize: '1rem' }}>Soul Vendor</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ color: '#fbbf24', fontSize: '0.8rem' }}>{gold} gold</span>
              {closeBtn}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, maxHeight: '80%', overflow: 'auto' }}>
            {items.map((item, idx) => {
              const price = getItemPrice(item);
              return (
                <div key={idx} onClick={() => handleBuyItem(item, idx)} style={{
                  background: gold >= price ? 'rgba(239,68,68,0.1)' : 'rgba(50,50,50,0.3)',
                  border: `1px solid ${gold >= price ? 'rgba(239,68,68,0.3)' : '#333'}`,
                  borderRadius: 6, padding: '4px 6px', cursor: gold >= price ? 'pointer' : 'not-allowed',
                }}>
                  <div style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 600 }}>{item.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{item.type} T{item.tier || 1}</div>
                  <div style={{ color: '#fbbf24', fontSize: '0.7rem' }}>{price} gold</div>
                </div>
              );
            })}
            {items.length === 0 && <div style={{ color: '#666', fontSize: '0.75rem', gridColumn: '1/3', textAlign: 'center', padding: 12 }}>Shop is empty</div>}
          </div>
        </div>
      );
    }

    if (activePanel === 'salvage') {
      return (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span className="font-cinzel" style={{ color: '#fbbf24', fontSize: '1rem' }}>Salvage Pit</span>
            {closeBtn}
          </div>
          <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: 6 }}>Break down items for gold and resources</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, maxHeight: '80%', overflow: 'auto' }}>
            {inventory.map((item, idx) => (
              <div key={idx} onClick={() => handleSalvage(idx)} style={{
                background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 6, padding: '4px 6px', cursor: 'pointer',
              }}>
                <div style={{ color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 600 }}>{item.name}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{item.type} T{item.tier || 1}</div>
                <div style={{ color: '#fbbf24', fontSize: '0.65rem' }}>Tap to salvage</div>
              </div>
            ))}
            {inventory.length === 0 && <div style={{ color: '#666', fontSize: '0.75rem', gridColumn: '1/3', textAlign: 'center', padding: 12 }}>No items to salvage</div>}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/portal_arena.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)', pointerEvents: 'none' }} />

      <div style={{
        position: 'absolute', top: 6, left: 12, right: 12,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: SCENE.HEADER,
      }}>
        <div className="font-cinzel" style={{ color: '#c026d3', fontSize: '1.1rem', textShadow: '0 2px 8px rgba(192,38,211,0.6)' }}>
          Void Nexus
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#fbbf24', fontSize: '0.75rem' }}>{gold} gold</span>
          {Object.entries(harvestResources).filter(([k]) => k !== 'gold').map(([r, a]) => (
            <span key={r} style={{ color: '#94a3b8', fontSize: '0.65rem' }}>{r}: {Math.floor(a)}</span>
          ))}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
        zIndex: SCENE.HEADER, display: 'flex', gap: 6, alignItems: 'center',
        background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '3px 10px',
        border: '1px solid rgba(192,38,211,0.3)',
      }}>
        <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}>WASD move</span>
        <span style={{ color: '#c026d3', fontSize: '0.7rem', fontWeight: 700 }}>E interact</span>
        {nearbyNode && (
          <span style={{ color: '#6ee7b3', fontSize: '0.7rem', fontWeight: 700, animation: 'pulse 1s infinite' }}>
            [{nearbyNode.name}]
          </span>
        )}
      </div>

      {whisper && !activePanel && (
        <div style={{
          position: 'absolute', top: '12%', left: '50%', transform: 'translateX(-50%)',
          zIndex: SCENE.TOOLTIP, background: 'rgba(10,10,25,0.85)', border: '1px solid rgba(192,38,211,0.3)',
          borderRadius: 8, padding: '4px 12px',
          color: '#c026d3', fontSize: '0.75rem', fontStyle: 'italic',
          textShadow: '0 1px 6px rgba(192,38,211,0.5)', whiteSpace: 'nowrap',
          animation: 'fadeIn 0.5s ease', pointerEvents: 'none',
        }}>
          {whisper}
        </div>
      )}

      {!activePanel && PORTAL_NODES.map(node => {
        const isNearby = nearbyNode?.id === node.id;
        return (
          <div key={node.id} onClick={() => handleInteract(node)} style={{
            position: 'absolute', left: `${node.x}%`, top: `${node.y}%`,
            transform: 'translate(-50%, -50%)', cursor: 'pointer',
            zIndex: SCENE.NODES, textAlign: 'center',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 10,
              background: `radial-gradient(circle, ${node.color}30, rgba(0,0,0,0.3))`,
              border: isNearby ? `2px solid ${node.color}` : `2px solid ${node.color}80`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.6rem',
              boxShadow: isNearby
                ? `0 0 30px ${node.color}60, inset 0 0 20px rgba(0,0,0,0.3)`
                : `0 0 20px ${node.color}50, inset 0 0 20px rgba(0,0,0,0.3)`,
              animation: isNearby ? 'pulse 1.2s infinite' : 'pulse 2s infinite',
              transition: 'box-shadow 0.3s ease, border 0.3s ease',
            }}>
              <InlineIcon name={node.icon} />
            </div>
            <div className="font-cinzel" style={{
              color: node.color, fontSize: '1.1rem', fontWeight: 700, marginTop: 4,
              textShadow: `0 2px 6px rgba(0,0,0,0.95), 0 0 10px ${node.color}40`, whiteSpace: 'nowrap',
            }}>
              {node.name}
            </div>
            <div style={{
              color: '#94a3b8', fontSize: '0.8rem', whiteSpace: 'nowrap',
              textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            }}>
              {node.description}
            </div>
            {isNearby && (
              <div style={{
                color: '#fbbf24', fontSize: '0.7rem', fontWeight: 700, marginTop: 2,
                background: 'rgba(0,0,0,0.7)', padding: '1px 6px', borderRadius: 4,
                animation: 'pulse 1s infinite',
              }}>Press E</div>
            )}
          </div>
        );
      })}

      {primarySprite && !activePanel && (
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

      {renderPanel()}

      {message && (
        <div style={{
          position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(10,15,30,0.9)', border: '1px solid #c026d3',
          borderRadius: 8, padding: '6px 14px', zIndex: SCENE.POPUP,
          color: '#c026d3', fontSize: '0.85rem', fontWeight: 600,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)', whiteSpace: 'nowrap',
        }}>
          {message}
        </div>
      )}

      {(SCENE_NPCS.portal || []).map(npc => (
        <div key={npc.id} style={{
          position: 'absolute', left: `${npc.x}%`, top: `${npc.y}%`,
          transform: 'translate(-50%, -50%)', zIndex: SCENE.AMBIENT_FX, pointerEvents: 'none',
        }}>
          <NpcSprite npcId={npc.npc} scale={2.5} flip={npc.flip} name={npc.name} />
        </div>
      ))}

      <div onClick={exitScene} style={{
        position: 'absolute', bottom: 12, left: 12,
        zIndex: SCENE.BACK_BUTTON, cursor: 'pointer', textAlign: 'center',
      }}>
        <div style={{
          width: 46, height: 46, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(192,38,211,0.4), rgba(192,38,211,0.1))',
          border: '2px solid #c026d3',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.2rem', boxShadow: '0 0 20px rgba(192,38,211,0.4)',
          animation: 'pulse 2s infinite',
        }}>
          <InlineIcon name="portal" />
        </div>
        <div style={{
          color: '#c026d3', fontSize: '0.7rem', fontWeight: 700, marginTop: 2,
          textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        }}>Return</div>
      </div>
    </div>
  );
}
