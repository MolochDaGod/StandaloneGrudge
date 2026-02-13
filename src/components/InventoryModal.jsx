import React, { useState, useCallback, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import { InlineIcon } from '../data/uiSprites.jsx';
import { TIERS, EQUIPMENT_SLOTS, getEquipmentStatBonuses, canClassEquip } from '../data/equipment';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { showTooltip, hideTooltip, updateTooltipPosition } from './GameTooltip';
import { getIconPlacement } from '../utils/uiLayoutConfig';

const BOOK_BG = '/sprites/inventory/book_bg.png';

const SLOT_MAP = [
  { key: 'helmet', label: 'Head', icon: 'helm', gridArea: 'head' },
  { key: 'armor', label: 'Chest', icon: 'armor', gridArea: 'chest' },
  { key: 'weapon', label: 'Main Hand', icon: 'sword', gridArea: 'mainhand' },
  { key: 'offhand', label: 'Off Hand', icon: 'shield', gridArea: 'offhand' },
  { key: 'feet', label: 'Feet', icon: 'boots', gridArea: 'feet' },
  { key: 'ring', label: 'Ring', icon: 'ring', gridArea: 'acc1' },
  { key: 'relic', label: 'Relic', icon: 'crystal', gridArea: 'acc2' },
];

const ITEMS_PER_PAGE = 16;

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
        width: 40,
        height: 40,
        background: over && canDrop
          ? 'rgba(87,199,103,0.35)'
          : item
            ? `linear-gradient(135deg, ${SLOT_BG}, ${SLOT_EMPTY})`
            : SLOT_EMPTY,
        border: `2px solid ${over && canDrop ? TEAL_LIGHT : item ? (tier?.color || SLOT_BORDER) : SLOT_BORDER}`,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: item ? 'pointer' : 'default',
        imageRendering: 'pixelated',
        position: 'relative',
        transition: 'border-color 0.15s',
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
      {item ? (
        (() => { const ip = getIconPlacement('equipIcons'); return <InlineIcon name={item.icon || slotDef.icon} size={ip.iconSize} style={{ marginRight: 0, transform: `translate(${ip.offsetX}px, ${ip.offsetY}px)` }} />; })()
      ) : (
        (() => { const ip = getIconPlacement('equipIcons'); return <InlineIcon name={slotDef.icon} size={Math.round(ip.iconSize * 0.83)} style={{ opacity: 0.3, filter: 'grayscale(1)', marginRight: 0, transform: `translate(${ip.offsetX}px, ${ip.offsetY}px)` }} />; })()
      )}
      {!item && (
        <div style={{
          position: 'absolute', bottom: -14, fontSize: 7, color: PARCHMENT_DARK,
          fontFamily: 'Cinzel, serif', whiteSpace: 'nowrap', textAlign: 'center',
          letterSpacing: '0.03em',
        }}>
          {slotDef.label}
        </div>
      )}
      {item && tier && (
        <div style={{
          position: 'absolute', top: -2, right: -2, width: 8, height: 8,
          background: tier.color, borderRadius: 1, border: `1px solid ${SLOT_BORDER}`,
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
        width: 36,
        height: 36,
        background: item
          ? `linear-gradient(135deg, ${SLOT_BG}, ${SLOT_EMPTY})`
          : SLOT_EMPTY,
        border: `2px solid ${item ? (tier?.color || SLOT_BORDER) : SLOT_BORDER}`,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: item ? 'grab' : 'default',
        opacity: dragging ? 0.4 : 1,
        imageRendering: 'pixelated',
        position: 'relative',
      }}
    >
      {item && (() => { const ip = getIconPlacement('invGridIcons'); return <InlineIcon name={item.icon || 'chest'} size={ip.iconSize} style={{ marginRight: 0, transform: `translate(${ip.offsetX}px, ${ip.offsetY}px)` }} />; })()}
      {item && tier && (
        <div style={{
          position: 'absolute', top: -2, right: -2, width: 7, height: 7,
          background: tier.color, borderRadius: 1, border: `1px solid ${SLOT_BORDER}`,
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

  const panelWidth = compact ? 340 : 420;
  const panelHeight = compact ? 280 : 320;

  return (
    <div
      style={{
        width: panelWidth,
        height: panelHeight,
        background: `linear-gradient(180deg, ${LEATHER} 0%, ${LEATHER_LIGHT} 2%, ${LEATHER} 4%, transparent 4%)`,
        borderRadius: 4,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        imageRendering: 'pixelated',
        boxShadow: '0 4px 20px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(96,56,32,0.8)',
        fontFamily: "'Jost', sans-serif",
      }}
      onDragOver={(e) => e.preventDefault()}
    >
      <div style={{
        background: `linear-gradient(180deg, ${TEAL} 0%, ${TEAL_DARK} 100%)`,
        padding: '4px 8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `2px solid ${LEATHER}`,
        minHeight: 24,
      }}>
        <span style={{
          color: PARCHMENT,
          fontFamily: 'Cinzel, serif',
          fontSize: compact ? 10 : 12,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textShadow: '1px 1px 0 rgba(0,0,0,0.5)',
        }}>
          EQUIPMENT
        </span>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(0,0,0,0.3)',
            border: `1px solid ${LEATHER}`,
            color: PARCHMENT,
            width: 18,
            height: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 1,
            lineHeight: 1,
            padding: 0,
          }}
        >
          x
        </button>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        background: `url(${BOOK_BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: PARCHMENT,
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg, rgba(96,56,32,0.15) 0%, transparent 3%, transparent 48%, rgba(96,56,32,0.12) 49%, rgba(96,56,32,0.12) 51%, transparent 52%, transparent 97%, rgba(96,56,32,0.15) 100%)`,
          pointerEvents: 'none',
        }} />

        <div style={{
          flex: '0 0 50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: compact ? '6px 4px' : '8px 6px',
          borderRight: `2px solid rgba(96,56,32,0.2)`,
          position: 'relative',
        }}>
          <div style={{
            fontSize: 8,
            color: LEATHER,
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            marginBottom: 4,
            letterSpacing: '0.08em',
            textShadow: '0 1px 0 rgba(229,214,161,0.5)',
          }}>
            {hero.name} — Lv.{hero.level}
          </div>

          <div style={{
            position: 'relative',
            width: compact ? 150 : 180,
            height: compact ? 190 : 220,
            display: 'grid',
            gridTemplateColumns: '40px 1fr 40px',
            gridTemplateRows: '40px 1fr 40px',
            gap: compact ? 2 : 4,
            alignItems: 'center',
            justifyItems: 'center',
          }}>
            <div style={{ gridColumn: '2', gridRow: '1' }}>
              <EquipSlot slotDef={SLOT_MAP[0]} item={hero.equipment?.helmet} onDrop={handleEquip} onUnequip={handleUnequip} heroClassId={hero.classId} dragItem={dragItem} />
            </div>

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
                width: 56, height: 56,
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <SpriteAnimation spriteData={spriteData} animation="idle" scale={0.85} speed={200} />
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

        <div style={{
          flex: '0 0 50%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: compact ? '6px 4px' : '8px 6px',
          position: 'relative',
        }}>
          <div style={{
            fontSize: 8,
            color: LEATHER,
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            marginBottom: 4,
            letterSpacing: '0.08em',
            textShadow: '0 1px 0 rgba(229,214,161,0.5)',
          }}>
            INVENTORY ({equipmentItems.length})
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 36px)',
            gridTemplateRows: 'repeat(4, 36px)',
            gap: 3,
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
              gap: 8,
              marginTop: 6,
            }}>
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  background: page > 0 ? TEAL : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${SLOT_BORDER}`,
                  color: PARCHMENT,
                  width: 20,
                  height: 20,
                  cursor: page > 0 ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 1,
                  opacity: page > 0 ? 1 : 0.4,
                  padding: 0,
                }}
              >
                ◀
              </button>
              <span style={{
                fontSize: 8,
                color: LEATHER,
                fontFamily: 'Cinzel, serif',
                fontWeight: 700,
              }}>
                {page + 1}/{totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                style={{
                  background: page < totalPages - 1 ? TEAL : 'rgba(0,0,0,0.2)',
                  border: `1px solid ${SLOT_BORDER}`,
                  color: PARCHMENT,
                  width: 20,
                  height: 20,
                  cursor: page < totalPages - 1 ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
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

      <div style={{
        background: `linear-gradient(180deg, ${LEATHER} 0%, ${LEATHER_LIGHT} 50%, ${LEATHER} 100%)`,
        height: 6,
        borderTop: `1px solid rgba(96,56,32,0.6)`,
      }} />
    </div>
  );
}
