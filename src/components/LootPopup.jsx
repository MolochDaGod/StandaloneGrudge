import React from 'react';
import useGameStore from '../stores/gameStore';
import { TIERS, WEAPON_TYPES, ARMOR_TYPES } from '../data/equipment';

export default function LootPopup() {
  const pendingLoot = useGameStore(s => s.pendingLoot);
  const clearPendingLoot = useGameStore(s => s.clearPendingLoot);
  const discardPendingLoot = useGameStore(s => s.discardPendingLoot);

  if (!pendingLoot || pendingLoot.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9998, animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #141a2b, #1e293b)',
        border: '2px solid var(--gold)', borderRadius: 16, padding: '25px 35px',
        maxWidth: 450, width: '90%', animation: 'slideUp 0.3s ease',
      }}>
        <h3 className="font-cinzel" style={{
          color: 'var(--gold)', fontSize: '1.3rem', textAlign: 'center', marginBottom: 15,
        }}>
          Loot Found!
        </h3>
        <div style={{ maxHeight: 300, overflowY: 'auto' }}>
          {pendingLoot.map(item => {
            const isConsumable = item.slot === 'consumable';
            const tierDef = isConsumable ? { color: '#4ade80', name: 'Consumable' } : (TIERS[item.tier] || TIERS[1]);
            return (
              <div key={item.id} style={{
                background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 14px',
                marginBottom: 8, border: `1px solid ${tierDef.color}40`,
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: tierDef.color, fontWeight: 'bold', fontSize: '0.9rem' }}>
                    {item.name}
                    {!isConsumable && (
                      <span style={{ fontSize: '0.7rem', marginLeft: 6, opacity: 0.7 }}>
                        [T{item.tier || 1}]
                      </span>
                    )}
                  </div>
                  {isConsumable ? (
                    <div style={{ color: '#86efac', fontSize: '0.75rem', marginTop: 2 }}>
                      {item.description}
                    </div>
                  ) : (
                    <>
                      <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: 2 }}>
                        {item.weaponType ? (WEAPON_TYPES[item.weaponType]?.name || item.slot) : item.armorType ? (ARMOR_TYPES[item.armorType]?.name + ' Armor') : item.slot.charAt(0).toUpperCase() + item.slot.slice(1)}
                        {item.classReq && <span> | {item.classReq.join(', ')}</span>}
                      </div>
                      <div style={{ color: '#22c55e', fontSize: '0.75rem', marginTop: 2 }}>
                        {Object.entries(item.stats).map(([k, v]) => `+${v} ${k}`).join(', ')}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 15, justifyContent: 'center' }}>
          <button
            onClick={clearPendingLoot}
            style={{
              background: 'linear-gradient(135deg, #b8860b, #daa520)', color: '#000',
              border: 'none', borderRadius: 8, padding: '10px 25px', fontSize: '0.9rem',
              fontFamily: "'Cinzel', serif", fontWeight: 'bold', cursor: 'pointer',
            }}
          >
            Take All
          </button>
          <button
            onClick={discardPendingLoot}
            style={{
              background: 'rgba(100,100,100,0.3)', color: 'var(--text-dim)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              padding: '10px 25px', fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
