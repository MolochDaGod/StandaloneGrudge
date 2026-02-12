import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import useGameStore from '../stores/gameStore';
import { locations } from '../data/enemies';
import { locationPositions, locationIcons, pathConnections, terrainRegions, portalLocations, godFightLocations } from '../data/worldMapData';

export default function MapOverlay({ isOpen, onClose, onSelectLocation, currentZone }) {
  const level = useGameStore(s => s.level);
  const locationsCleared = useGameStore(s => s.locationsCleared);
  const zoneConquer = useGameStore(s => s.zoneConquer);
  const bossesDefeated = useGameStore(s => s.bossesDefeated);
  const [hoveredNode, setHoveredNode] = useState(null);

  const locationMap = useMemo(() => {
    const map = {};
    locations.forEach(loc => { map[loc.id] = loc; });
    return map;
  }, []);

  if (!isOpen) return null;

  const isUnlocked = (locId) => {
    const loc = locationMap[locId];
    if (!loc) return false;
    if (loc.unlocked) return true;
    if (loc.unlockLevel && level >= loc.unlockLevel) return true;
    return false;
  };

  const getNodeType = (locId) => {
    if (godFightLocations.includes(locId)) return 'god';
    if (locId === 'void_throne') return 'boss';
    if (portalLocations.includes(locId)) return 'portal';
    const loc = locationMap[locId];
    if (loc?.boss) return 'boss';
    return 'zone';
  };

  const handleNodeClick = (locId) => {
    if (!isUnlocked(locId)) return;
    if (onSelectLocation) onSelectLocation(locId);
    onClose();
  };

  const portalEl = document.getElementById('game-ui-portal');
  const target = portalEl || document.body;

  const overlay = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'rgba(0,0,0,0.92)',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.2s ease',
    }}
    onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px',
        borderBottom: '1px solid rgba(255,215,0,0.15)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="font-cinzel" style={{
            fontSize: '1.1rem',
            background: 'linear-gradient(135deg, #ffd700, #f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            World Map
          </span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem' }}>
            Press M or ESC to close
          </span>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: '1px solid rgba(255,255,255,0.15)',
          color: '#fff', borderRadius: 6, padding: '4px 12px', cursor: 'pointer',
          fontSize: '0.75rem',
        }}>
          Close
        </button>
      </div>

      <div style={{
        flex: 1, position: 'relative', overflow: 'hidden',
        margin: '8px 12px 12px',
        border: '1px solid rgba(255,215,0,0.1)',
        borderRadius: 8,
        background: 'linear-gradient(180deg, rgba(10,15,25,0.95), rgba(5,8,15,0.98))',
      }}>
        <svg style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          pointerEvents: 'none',
        }} viewBox="0 0 100 100" preserveAspectRatio="none">
          {terrainRegions.map((region, i) => (
            <polygon key={i}
              points={region.points}
              fill={region.fill}
              stroke={region.stroke}
              strokeWidth="0.3"
              opacity="0.6"
            />
          ))}
          {terrainRegions.map((region, i) => (
            <text key={`label-${i}`}
              x={region.labelX} y={region.labelY}
              fill={region.stroke}
              fontSize="1.8"
              fontFamily="Cinzel, serif"
              textAnchor="middle"
              opacity="0.5"
            >
              {region.name}
            </text>
          ))}
        </svg>

        <svg style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          pointerEvents: 'none',
        }} viewBox="0 0 100 100" preserveAspectRatio="none">
          {pathConnections.map(([a, b], i) => {
            const pA = locationPositions[a];
            const pB = locationPositions[b];
            if (!pA || !pB) return null;
            const bothUnlocked = isUnlocked(a) && isUnlocked(b);
            return (
              <line key={i}
                x1={pA.x} y1={pA.y} x2={pB.x} y2={pB.y}
                stroke={bothUnlocked ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)'}
                strokeWidth="0.3"
                strokeDasharray={bothUnlocked ? 'none' : '0.8 0.5'}
              />
            );
          })}
        </svg>

        {Object.entries(locationPositions).map(([locId, pos]) => {
          const loc = locationMap[locId];
          const icon = locationIcons[locId];
          const unlocked = isUnlocked(locId);
          const cleared = locationsCleared.includes(locId);
          const isCurrent = currentZone === locId;
          const isHovered = hoveredNode === locId;
          const conquer = zoneConquer?.[locId] || 0;
          const nodeType = getNodeType(locId);

          return (
            <div
              key={locId}
              onMouseEnter={() => setHoveredNode(locId)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(locId)}
              style={{
                position: 'absolute',
                left: `${pos.x}%`, top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                cursor: unlocked ? 'pointer' : 'not-allowed',
                opacity: unlocked ? 1 : 0.35,
                zIndex: isHovered ? 20 : 10,
                transition: 'transform 0.15s ease, opacity 0.2s ease',
              }}
            >
              <div style={{
                width: isHovered ? 44 : 36,
                height: isHovered ? 44 : 36,
                borderRadius: nodeType === 'god' ? '50%' : 4,
                overflow: 'hidden',
                border: isCurrent
                  ? '2px solid #ffd700'
                  : cleared
                    ? '1.5px solid rgba(74,222,128,0.6)'
                    : `1.5px solid ${icon?.color || '#555'}44`,
                boxShadow: isCurrent
                  ? '0 0 12px rgba(255,215,0,0.5)'
                  : isHovered
                    ? `0 0 10px ${icon?.glow || 'rgba(255,255,255,0.2)'}`
                    : 'none',
                transition: 'all 0.15s ease',
                position: 'relative',
                imageRendering: 'pixelated',
              }}>
                {icon?.img && (
                  <img src={icon.img} alt="" style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover',
                    filter: unlocked ? 'none' : 'grayscale(1) brightness(0.4)',
                  }} />
                )}
                {isCurrent && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    border: '2px solid rgba(255,215,0,0.6)',
                    borderRadius: nodeType === 'god' ? '50%' : 4,
                    animation: 'pulse 2s infinite',
                  }} />
                )}
                {cleared && (
                  <div style={{
                    position: 'absolute', top: -3, right: -3,
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#22c55e', border: '1px solid #0a2618',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '6px', color: '#fff', fontWeight: 'bold',
                  }}>✓</div>
                )}
                {nodeType === 'portal' && unlocked && (
                  <div style={{
                    position: 'absolute', bottom: -2, left: '50%', transform: 'translateX(-50%)',
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'radial-gradient(circle, #a78bfa, transparent)',
                    animation: 'pulse 1.5s infinite',
                  }} />
                )}
              </div>

              <div className="font-cinzel" style={{
                position: 'absolute', top: '100%', left: '50%',
                transform: 'translateX(-50%)',
                whiteSpace: 'nowrap',
                fontSize: isHovered ? '0.5rem' : '0.4rem',
                color: isCurrent ? '#ffd700' : icon?.color || '#999',
                textAlign: 'center',
                marginTop: 2,
                textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                transition: 'font-size 0.15s ease',
              }}>
                {loc?.name || locId.replace(/_/g, ' ')}
              </div>

              {isHovered && loc && unlocked && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%', left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: 6,
                  background: 'rgba(10,12,20,0.95)',
                  border: `1px solid ${icon?.color || '#555'}55`,
                  borderRadius: 6,
                  padding: '6px 10px',
                  minWidth: 140,
                  zIndex: 100,
                  pointerEvents: 'none',
                }}>
                  <div className="font-cinzel" style={{
                    fontSize: '0.65rem', color: icon?.color || '#fff',
                    marginBottom: 3,
                  }}>
                    {loc.name}
                  </div>
                  <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.5)', marginBottom: 3 }}>
                    {loc.description}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.55rem' }}>
                    <span style={{ color: '#f59e0b' }}>
                      Lv.{loc.levelRange[0]}-{loc.levelRange[1]}
                    </span>
                    {conquer > 0 && (
                      <span style={{ color: '#22c55e' }}>
                        {Math.floor(conquer)}% conquered
                      </span>
                    )}
                    {loc.boss && (
                      <span style={{ color: '#ef4444' }}>
                        Boss: {bossesDefeated?.includes(loc.boss) ? '✓' : '!'}
                      </span>
                    )}
                  </div>
                  {nodeType === 'portal' && (
                    <div style={{ fontSize: '0.5rem', color: '#a78bfa', marginTop: 2 }}>
                      Portal Fast Travel
                    </div>
                  )}
                  {nodeType === 'god' && (
                    <div style={{ fontSize: '0.5rem', color: '#fbbf24', marginTop: 2 }}>
                      God Fight (Lv.20)
                    </div>
                  )}
                </div>
              )}

              {!unlocked && isHovered && (
                <div style={{
                  position: 'absolute',
                  bottom: '100%', left: '50%',
                  transform: 'translateX(-50%)',
                  marginBottom: 6,
                  background: 'rgba(10,12,20,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  whiteSpace: 'nowrap',
                  fontSize: '0.5rem',
                  color: '#ef4444',
                  zIndex: 100,
                  pointerEvents: 'none',
                }}>
                  Locked — Reach Lv.{loc?.unlockLevel || '?'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{
        padding: '6px 20px 10px',
        display: 'flex', gap: 16, justifyContent: 'center',
        fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)',
        flexShrink: 0,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, border: '1.5px solid #ffd700', display: 'inline-block' }} />
          Current
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          Cleared
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: 'rgba(255,255,255,0.15)', display: 'inline-block' }} />
          Locked
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'radial-gradient(circle, #a78bfa, transparent)', display: 'inline-block' }} />
          Portal
        </span>
      </div>
    </div>
  );

  return createPortal(overlay, target);
}
