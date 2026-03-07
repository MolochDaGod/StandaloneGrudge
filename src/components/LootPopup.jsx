import React, { useEffect } from 'react';
import useGameStore from '../stores/gameStore';
import { TIERS, WEAPON_TYPES, ARMOR_TYPES } from '../data/equipment';
import { InlineIcon } from '../data/uiSprites';
import { LOOT_POPUP } from '../constants/layers';

const TIER_GLOW = {
  1: 'none',
  2: '0 0 8px rgba(34,197,94,0.3)',
  3: '0 0 10px rgba(59,130,246,0.4), 0 0 20px rgba(59,130,246,0.15)',
  4: '0 0 12px rgba(168,85,247,0.5), 0 0 24px rgba(168,85,247,0.2)',
  5: '0 0 14px rgba(255,215,0,0.6), 0 0 28px rgba(255,215,0,0.25)',
  6: '0 0 16px rgba(239,68,68,0.6), 0 0 32px rgba(239,68,68,0.3)',
};

export default function LootPopup() {
  const pendingLoot = useGameStore(s => s.pendingLoot);
  const clearPendingLoot = useGameStore(s => s.clearPendingLoot);
  const discardPendingLoot = useGameStore(s => s.discardPendingLoot);

  useEffect(() => {
    if (!pendingLoot || pendingLoot.length === 0) return;
    const handler = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        clearPendingLoot();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pendingLoot, clearPendingLoot]);

  if (!pendingLoot || pendingLoot.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: LOOT_POPUP, animation: 'fadeIn 0.3s ease',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #141a2b, #1e293b)',
        border: '2px solid var(--gold)', borderRadius: 16, padding: '25px 35px',
        maxWidth: 450, width: '90%', animation: 'slideUp 0.3s ease',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Shimmer sweep overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          animation: 'lootShimmer 2.5s ease-in-out 0.5s infinite',
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,215,0,0.08) 50%, transparent 60%)',
          zIndex: 1,
        }} />

        <h3 className="font-cinzel" style={{
          color: 'var(--gold)', fontSize: '1.3rem', textAlign: 'center', marginBottom: 15,
          animation: 'lootTitleReveal 0.6s ease-out both',
          textShadow: '0 0 16px rgba(255,215,0,0.4), 0 2px 4px rgba(0,0,0,0.6)',
          position: 'relative', zIndex: 2,
        }}>
          Loot Found!
        </h3>
        <div style={{ maxHeight: 300, overflowY: 'auto', position: 'relative', zIndex: 2 }}>
          {pendingLoot.map((item, idx) => {
            const isConsumable = item.slot === 'consumable';
            const tierDef = isConsumable ? { color: '#4ade80', name: 'Consumable' } : (TIERS[item.tier] || TIERS[1]);
            const tierNum = isConsumable ? 1 : (item.tier || 1);
            const glowShadow = TIER_GLOW[tierNum] || 'none';
            return (
              <div key={item.id} style={{
                background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '10px 14px',
                marginBottom: 8, border: `1px solid ${tierDef.color}40`,
                display: 'flex', alignItems: 'center', gap: 12,
                boxShadow: glowShadow,
                animation: `lootItemReveal 0.45s ease-out ${200 + idx * 120}ms both`,
              }}>
                <InlineIcon name={item.icon} size={20} />
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
        <div style={{ display: 'flex', gap: 10, marginTop: 15, justifyContent: 'center', position: 'relative', zIndex: 2 }}>
          <button
            onClick={clearPendingLoot}
            style={{
              background: 'linear-gradient(135deg, #b8860b, #daa520)', color: '#000',
              border: 'none', borderRadius: 8, padding: '10px 25px', fontSize: '0.9rem',
              fontFamily: "'Cinzel', serif", fontWeight: 'bold', cursor: 'pointer',
              animation: `lootItemReveal 0.4s ease-out ${200 + pendingLoot.length * 120 + 100}ms both`,
            }}
          >
            Take All <span style={{ fontSize: '0.6rem', opacity: 0.6, marginLeft: 4 }}>[Space]</span>
          </button>
          <button
            onClick={discardPendingLoot}
            style={{
              background: 'rgba(100,100,100,0.3)', color: 'var(--text-dim)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
              padding: '10px 25px', fontSize: '0.9rem', cursor: 'pointer',
              animation: `lootItemReveal 0.4s ease-out ${200 + pendingLoot.length * 120 + 200}ms both`,
            }}
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
