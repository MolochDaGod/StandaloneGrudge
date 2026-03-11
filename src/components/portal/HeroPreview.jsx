import React from 'react';
import useGameStore from '../../stores/gameStore';
import { classDefinitions } from '../../data/classes';
import { raceDefinitions } from '../../data/races';

const CLASS_COLORS = {
  warrior: '#ef4444', mage: '#a78bfa', ranger: '#22d3ee', worge: '#f59e0b',
};

export default function HeroPreview() {
  const heroRoster = useGameStore(s => s.heroRoster);
  const playerName = useGameStore(s => s.playerName);

  if (!heroRoster || heroRoster.length === 0 || !playerName) return null;

  return (
    <div>
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: '0.85rem',
        color: '#d4a96a', fontWeight: 600, letterSpacing: 2,
        marginBottom: 12, textTransform: 'uppercase',
      }}>
        Your Heroes
      </div>
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'wrap',
      }}>
        {heroRoster.slice(0, 6).map((hero, i) => {
          const cls = classDefinitions[hero.classId];
          const race = raceDefinitions[hero.raceId];
          const color = CLASS_COLORS[hero.classId] || '#888';

          return (
            <div key={hero.name + i} style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8, padding: '10px 14px',
              minWidth: 130, flex: '0 0 auto',
            }}>
              <div style={{
                fontFamily: "'Cinzel', serif", fontSize: '0.8rem',
                color: '#e8dcc8', fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: 120,
              }}>
                {hero.name}
              </div>
              <div style={{
                fontFamily: "'Jost', sans-serif", fontSize: '0.65rem',
                color, marginTop: 2,
              }}>
                Lv.{hero.level} {race?.name || ''} {cls?.name || ''}
              </div>
            </div>
          );
        })}
        {heroRoster.length > 6 && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8, padding: '10px 14px',
            display: 'flex', alignItems: 'center',
            fontFamily: "'Jost', sans-serif", fontSize: '0.75rem',
            color: 'rgba(255,255,255,0.3)',
          }}>
            +{heroRoster.length - 6} more
          </div>
        )}
      </div>
    </div>
  );
}
