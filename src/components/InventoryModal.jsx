import React, { useState, useCallback, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import { InlineIcon } from '../data/uiSprites';
import { TIERS, EQUIPMENT_SLOTS, getEquipmentStatBonuses, canClassEquip } from '../data/equipment';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { showTooltip, hideTooltip, updateTooltipPosition } from './GameTooltip';
import { getIconPlacement } from '../utils/uiLayoutConfig';

const PANEL_BG = '/ui/inventory-panel-bg.png';

const SLOT_MAP = [
  { key: 'helmet', label: 'Head', icon: 'helm', gridArea: 'head' },
  { key: 'armor', label: 'Chest', icon: 'armor', gridArea: 'chest' },
  { key: 'weapon', label: 'Main Hand', icon: 'sword', gridArea: 'mainhand' },
  { key: 'offhand', label: 'Off Hand', icon: 'shield', gridArea: 'offhand' },
  { key: 'feet', label: 'Feet', icon: 'boots', gridArea: 'feet' },
  { key: 'ring', label: 'Ring', icon: 'ring', gridArea: 'acc1' },
  { key: 'relic', label: 'Relic', icon: 'crystal', gridArea: 'acc2' },
];

const ITEMS_PER_PAGE = 20;

const PARCHMENT = '#e5d6a1';
const PARCHMENT_DARK = '#cdb677';
const LEATHER = '#603820';
const LEATHER_LIGHT = '#704830';
const TEAL = '#509070';
const TEAL_DARK = '#294040';
const TEAL_LIGHT = '#57c767';
const SLOT_BG = '#8a6a3e';
const SLOT_BORDER = '#5a3a1e';
const SLOT_EMPTY = '#6b4c2a';

function getItemTooltipContent(item) {
  if (!item) return null;
  const tier = TIERS[item.tier] || TIERS[1];
  const stats = item.stats || {};
  const statLines = Object.entries(stats)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => {
      const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
      return `${v > 0 ? '+' : ''}${v} ${label}`;
    });

  return {
    title: item.name || 'Unknown Item',
    titleColor: tier.color,
    lines: [
      { text: `${tier.name} ${item.slot || ''}`, color: tier.color },
      ...statLines.map(t => ({ text: t, color: '#d4d4d4' })),
    ],
  };
}

function EquipSlot({ slotDef, item, onDrop, onUnequip, onHover, heroClassId, dragItem }) {
  const [over, setOver] = useState(false);
  const tier = item ? (TIERS[item.tier] || TIERS[1]) : null;
  const canDrop = dragItem && dragItem.slot === slotDef.key;

  return (
    <div
      style={{
        width: 46,
        height: 46,
        position: 'relative',
        cursor: item ? 'pointer' : 'default',
      }}
      onDragOver={(e) => {
        if (canDrop) {
          e.preventDefault();
          setOver(true);
        }
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (canDrop) onDrop(dragItem);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        if (item) onUnequip(slotDef.key);
      }}
      onMouseEnter={(e) => {
        if (item) {
          const tip = getItemTooltipContent(item);
          if (tip) showTooltip(e, tip.title, tip.lines, tip.titleColor);
        }
      }}
      onMouseMove={(e) => item && updateTooltipPosition(e)}
      onMouseLeave={() => hideTooltip()}
    >
      <div style={{
        position: 'absolute', inset: '13%',
        background: over && canDrop
          ? 'rgba(87,199,103,0.35)'
          : item
            ? `linear-gradient(145deg, rgba(50,40,25,0.95), rgba(30,22,12,0.98))`
            : 'linear-gradient(145deg, rgba(35,28,18,0.9), rgba(20,15,8,0.95))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        imageRendering: 'pixelated', borderRadius: 1,
        boxShadow: over && canDrop ? `inset 0 0 8px rgba(87,199,103,0.4)` : item && tier ? `inset 0 0 6px rgba(0,0,0,0.6), 0 0 4px ${tier.color}25` : item ? `inset 0 0 6px rgba(0,0,0,0.6)` : 'none',
      }}>
        {item ? (
          (() => { const ip = getIconPlacement('equipIcons'); return <InlineIcon name={item.icon || slotDef.icon} size={ip.iconSize} style={{ marginRight: 0, transform: `translate(${ip.offsetX}px, ${ip.offsetY}px)`, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />; })()
        ) : (
          (() => { const ip = getIconPlacement('equipIcons'); return <InlineIcon name={slotDef.icon} size={Math.round(ip.iconSize * 0.83)} style={{ opacity: 0.25, filter: 'grayscale(1) drop-shadow(0 1px 2px rgba(0,0,0,0.3))', marginRight: 0, transform: `translate(${ip.offsetX}px, ${ip.offsetY}px)` }} />; })()
        )}
      </div>
      <img src="/ui/inventory-slot-frame.png" alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 2, imageRendering: 'auto',
        filter: item && tier ? `drop-shadow(0 0 4px ${tier.color}40)` : 'none',
      }} />
      {!item && (
        <div style={{
          position: 'absolute', bottom: -13, left: '50%', transform: 'translateX(-50%)',
          fontSize: 7, color: PARCHMENT_DARK,
          fontFamily: 'Cinzel, serif', whiteSpace: 'nowrap', textAlign: 'center',
          letterSpacing: '0.03em', zIndex: 3,
        }}>
          {slotDef.label}
        </div>
      )}
      {item && tier && (
        <div style={{
          position: 'absolute', top: 1, right: 1, width: 8, height: 8,
          background: tier.color, borderRadius: 1, border: `1px solid ${SLOT_BORDER}`,
          zIndex: 3, boxShadow: `0 0 4px ${tier.color}80`,
        }} />
      )}
    </div>
  );
}

function InventorySlot({ item, index, onDragStart, onRightClickEquip }) {
  const [dragging, setDragging] = useState(false);
  const tier = item ? (TIERS[item.tier] || TIERS[1]) : null;

  return (
    <div
      draggable={!!item}
      onDragStart={(e) => {
        if (!item) return;
        setDragging(true);
        onDragStart(item);
        e.dataTransfer.effectAllowed = 'move';
        const ghost = document.createElement('div');
        ghost.style.width = '1px';
        ghost.style.height = '1px';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => document.body.removeChild(ghost), 0);
      }}
      onDragEnd={() => setDragging(false)}
      onContextMenu={(e) => {
        e.preventDefault();
        if (item) onRightClickEquip(item);
      }}
      onMouseEnter={(e) => {
        if (item) {
          const tip = getItemTooltipContent(item);
          if (tip) showTooltip(e, tip.title, tip.lines, tip.titleColor);
        }
      }}
      onMouseMove={(e) => item && updateTooltipPosition(e)}
      onMouseLeave={() => hideTooltip()}
      style={{
        width: 42,
        height: 42,
        position: 'relative',
        cursor: item ? 'grab' : 'default',
        opacity: dragging ? 0.4 : 1,
      }}
    >
      <div style={{
        position: 'absolute', inset: '13%',
        background: item
          ? `linear-gradient(145deg, rgba(50,40,25,0.95), rgba(30,22,12,0.98))`
          : 'linear-gradient(145deg, rgba(35,28,18,0.85), rgba(20,15,8,0.9))',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        imageRendering: 'pixelated', borderRadius: 1,
        boxShadow: item && tier ? `inset 0 0 5px rgba(0,0,0,0.5), 0 0 3px ${tier.color}20` : item ? `inset 0 0 5px rgba(0,0,0,0.5)` : 'none',
      }}>
        {item && (() => { const ip = getIconPlacement('invGridIcons'); return <InlineIcon name={item.icon || 'chest'} size={ip.iconSize} style={{ marginRight: 0, transform: `translate(${ip.offsetX}px, ${ip.offsetY}px)`, filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />; })()}
      </div>
      <img src="/ui/inventory-slot-frame.png" alt="" style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 2, imageRendering: 'auto',
        filter: item && tier ? `drop-shadow(0 0 3px ${tier.color}35)` : 'none',
      }} />
      {item && tier && (
        <div style={{
          position: 'absolute', top: 1, right: 1, width: 7, height: 7,
          background: tier.color, borderRadius: 1, border: `1px solid ${SLOT_BORDER}`,
          zIndex: 3, boxShadow: `0 0 3px ${tier.color}60`,
        }} />
      )}
    </div>
  );
}

export default function InventoryModal({ heroId, onClose, compact = false }) {
  const { heroRoster, inventory, equipItem, unequipItem } = useGameStore();
  const hero = heroRoster.find(h => h.id === heroId);
  const [page, setPage] = useState(0);
  const [dragItem, setDragItem] = useState(null);

  const equipmentItems = inventory.filter(i =>
    i && i.slot && EQUIPMENT_SLOTS.includes(i.slot)
  );
  const totalPages = Math.max(1, Math.ceil(equipmentItems.length / ITEMS_PER_PAGE));
  const pageItems = equipmentItems.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);

  const padded = [...pageItems];
  while (padded.length < ITEMS_PER_PAGE) padded.push(null);

  const handleEquip = useCallback((item) => {
    if (!hero || !item) return;
    if (!canClassEquip(hero.classId, item)) return;
    equipItem(heroId, item);
    setDragItem(null);
  }, [hero, heroId, equipItem]);

  const handleUnequip = useCallback((slot) => {
    if (!hero) return;
    unequipItem(heroId, slot);
  }, [hero, heroId, unequipItem]);

  const handleRightClickEquip = useCallback((item) => {
    handleEquip(item);
  }, [handleEquip]);

  if (!hero) return null;

  const cls = classDefinitions[hero.classId];
  const race = raceDefinitions[hero.raceId];
  const spriteData = getPlayerSprite(hero.classId, hero.raceId, hero.namedHeroId);

  // Scaleable sizing — base unit drives all proportions
  const BASE = compact ? 0.82 : 1;
  const panelWidth = Math.round(480 * BASE);
  const panelHeight = Math.round(310 * BASE);
  const slotSize = Math.round(44 * BASE);
  const invSlotSize = Math.round(40 * BASE);
  const gap = Math.round(3 * BASE);

  return (
    <div
      style={{
        width: panelWidth,
        height: panelHeight,
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        imageRendering: 'pixelated',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(96,56,32,0.8)',
        fontFamily: "'Jost', sans-serif",
        position: 'relative',
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Background image layer */}
      <img
        src={PANEL_BG}
        alt=""
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover',
          pointerEvents: 'none',
          imageRendering: 'pixelated',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 1,
        padding: `${Math.round(4 * BASE)}px ${Math.round(8 * BASE)}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: Math.round(24 * BASE),
        background: 'rgba(0,0,0,0.35)',
        borderBottom: '1px solid rgba(96,56,32,0.5)',
      }}>
        <span style={{
          color: PARCHMENT,
          fontFamily: 'Cinzel, serif',
          fontSize: Math.round(11 * BASE),
          fontWeight: 700,
          letterSpacing: '0.12em',
          textShadow: '1px 1px 0 rgba(0,0,0,0.7)',
        }}>
          {hero.name} — Lv.{hero.level}
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(0,0,0,0.4)',
            border: `1px solid ${LEATHER}`,
            color: PARCHMENT,
            width: Math.round(18 * BASE),
            height: Math.round(18 * BASE),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: Math.round(11 * BASE),
            fontWeight: 700,
            borderRadius: 1,
            lineHeight: 1,
            padding: 0,
          }}
        >
          x
        </button>
      </div>

      {/* Main body */}
      <div style={{
        flex: 1,
        display: 'flex',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Left: Equipment + character */}
        <div style={{
          flex: '0 0 46%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Math.round(6 * BASE),
          position: 'relative',
        }}>
          <div style={{
            position: 'relative',
            width: Math.round(190 * BASE),
            height: Math.round(245 * BASE),
            display: 'grid',
            gridTemplateColumns: `${slotSize}px 1fr ${slotSize}px`,
            gridTemplateRows: `${slotSize}px 1fr ${slotSize}px`,
            gap: gap,
            alignItems: 'center',
            justifyItems: 'center',
          }}>
            {/* Row 1: Head top-center */}
            <div style={{ gridColumn: '2', gridRow: '1' }}>
              <EquipSlot slotDef={SLOT_MAP[0]} item={hero.equipment?.helmet} onDrop={handleEquip} onUnequip={handleUnequip} heroClassId={hero.classId} dragItem={dragItem} />
            </div>

            {/* Row 2: Weapon left, Character+Chest center, Shield right */}
            <div style={{ gridColumn: '1', gridRow: '2' }}>
              <EquipSlot slotDef={SLOT_MAP[2]} item={hero.equipment?.weapon} onDrop={handleEquip} onUnequip={handleUnequip} heroClassId={hero.classId} dragItem={dragItem} />
            </div>

            <div style={{
              gridColumn: '2', gridRow: '2',
              position: 'relative',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div style={{
                width: Math.round(56 * BASE), height: Math.round(56 * BASE),
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <SpriteAnimation spriteData={spriteData} animation="idle" scale={0.85 * BASE} speed={200} containerless={false} />
              </div>
              <div style={{
                position: 'absolute', bottom: 2, right: 2, zIndex: 2,
              }}>
                <EquipSlot slotDef={SLOT_MAP[1]} item={hero.equipment?.armor} onDrop={handleEquip} onUnequip={handleUnequip} heroClassId={hero.classId} dragItem={dragItem} />
              </div>
            </div>

            <div style={{ gridColumn: '3', gridRow: '2' }}>
              <EquipSlot slotDef={SLOT_MAP[3]} item={hero.equipment?.offhand} onDrop={handleEquip} onUnequip={handleUnequip} heroClassId={hero.classId} dragItem={dragItem} />
            </div>

            {/* Row 3: Ring left, Boots center, Relic right */}
            <div style={{ gridColumn: '1', gridRow: '3' }}>
              <EquipSlot slotDef={SLOT_MAP[5]} item={hero.equipment?.ring} onDrop={handleEquip} onUnequip={handleUnequip} heroClassId={hero.classId} dragItem={dragItem} />
            </div>
            <div style={{ gridColumn: '2', gridRow: '3' }}>
              <EquipSlot slotDef={SLOT_MAP[4]} item={hero.equipment?.feet} onDrop={handleEquip} onUnequip={handleUnequip} heroClassId={hero.classId} dragItem={dragItem} />
            </div>
            <div style={{ gridColumn: '3', gridRow: '3' }}>
              <EquipSlot slotDef={SLOT_MAP[6]} item={hero.equipment?.relic} onDrop={handleEquip} onUnequip={handleUnequip} heroClassId={hero.classId} dragItem={dragItem} />
            </div>
          </div>
        </div>

        {/* Right: 5×4 Inventory grid */}
        <div style={{
          flex: '0 0 54%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: Math.round(6 * BASE),
          position: 'relative',
        }}>
          <div style={{
            fontSize: Math.round(8 * BASE),
            color: PARCHMENT,
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            marginBottom: Math.round(4 * BASE),
            letterSpacing: '0.08em',
            textShadow: '0 1px 2px rgba(0,0,0,0.7)',
          }}>
            INVENTORY ({equipmentItems.length})
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(5, ${invSlotSize}px)`,
            gridTemplateRows: `repeat(4, ${invSlotSize}px)`,
            gap: gap,
          }}>
            {padded.map((item, i) => (
              <InventorySlot
                key={item?.id || `empty-${i}`}
                item={item}
                index={i}
                onDragStart={setDragItem}
                onRightClickEquip={handleRightClickEquip}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: Math.round(8 * BASE),
              marginTop: Math.round(6 * BASE),
            }}>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  background: page > 0 ? 'rgba(80,144,112,0.8)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${SLOT_BORDER}`,
                  color: PARCHMENT,
                  width: Math.round(20 * BASE),
                  height: Math.round(20 * BASE),
                  cursor: page > 0 ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: Math.round(12 * BASE),
                  fontWeight: 700,
                  borderRadius: 1,
                  opacity: page > 0 ? 1 : 0.4,
                  padding: 0,
                }}
              >
                ◀
              </button>
              <span style={{
                fontSize: Math.round(8 * BASE),
                color: PARCHMENT,
                fontFamily: 'Cinzel, serif',
                fontWeight: 700,
                textShadow: '0 1px 2px rgba(0,0,0,0.7)',
              }}>
                {page + 1}/{totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  background: page < totalPages - 1 ? 'rgba(80,144,112,0.8)' : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${SLOT_BORDER}`,
                  color: PARCHMENT,
                  width: Math.round(20 * BASE),
                  height: Math.round(20 * BASE),
                  cursor: page < totalPages - 1 ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: Math.round(12 * BASE),
                  fontWeight: 700,
                  borderRadius: 1,
                  opacity: page < totalPages - 1 ? 1 : 0.4,
                  padding: 0,
                }}
              >
                ▶
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
