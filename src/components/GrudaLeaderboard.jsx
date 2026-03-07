import React, { useState, useEffect } from 'react';
import RankBadge, { RankBadgeInline, getRankForWins } from './RankBadge';
import { InlineIcon } from '../data/uiSprites';
import { classDefinitions } from '../data/classes';

export default function GrudaLeaderboard({ onClose }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/arena/leaderboard?limit=20').then(r => r.json()),
      fetch('/api/arena/stats').then(r => r.json()),
    ]).then(([lb, st]) => {
      setLeaderboard(lb.leaderboard || []);
      setStats(st);
      setLoading(false);
    }).catch(err => {
      setError('Failed to load leaderboard');
      setLoading(false);
    });
  }, []);

  const getRankStyle = (rank) => {
    if (rank === 1) return { bg: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,215,0,0.05))', border: 'rgba(255,215,0,0.4)' };
    if (rank === 2) return { bg: 'linear-gradient(135deg, rgba(192,192,192,0.12), rgba(192,192,192,0.04))', border: 'rgba(192,192,192,0.3)' };
    if (rank === 3) return { bg: 'linear-gradient(135deg, rgba(205,127,50,0.12), rgba(205,127,50,0.04))', border: 'rgba(205,127,50,0.3)' };
    return { bg: 'rgba(20,30,60,0.6)', border: 'rgba(255,255,255,0.06)' };
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(5,8,16,0.92)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #0e1630 0%, #0a0f20 100%)',
        border: '1px solid rgba(250,172,71,0.2)',
        borderRadius: 16,
        width: '90%',
        maxWidth: 600,
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 12px 50px rgba(0,0,0,0.7), 0 0 40px rgba(250,172,71,0.08)',
      }}>
        <div style={{
          padding: '16px 20px 12px',
          borderBottom: '1px solid rgba(250,172,71,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(180deg, rgba(250,172,71,0.06) 0%, transparent 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <InlineIcon name="skull" size={18} />
            <h3 className="font-cinzel" style={{
              margin: 0,
              fontSize: '1.1rem',
              background: 'linear-gradient(135deg, #FAAC47, #DB6331)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: 1.5,
            }}>
              GRUDA LEADERBOARD
            </h3>
          </div>
          <button onClick={onClose} style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'var(--muted)',
            cursor: 'pointer',
            fontSize: '0.8rem',
            borderRadius: 6,
            padding: '3px 10px',
          }}>ESC</button>
        </div>

        {stats && (
          <div style={{
            display: 'flex',
            gap: 12,
            padding: '10px 20px',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            {[
              { label: 'Ranked', value: stats.rankedTeams, color: '#22c55e' },
              { label: 'Total Teams', value: stats.totalTeams, color: 'var(--accent)' },
              { label: 'Battles', value: stats.totalBattles, color: '#3b82f6' },
            ].map(s => (
              <div key={s.label} style={{
                flex: 1,
                textAlign: 'center',
                padding: '6px 0',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 8,
              }}>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.5rem', color: 'var(--muted)', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          display: 'flex',
          padding: '8px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          fontSize: '0.5rem',
          color: 'var(--muted)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          <div style={{ width: 36, textAlign: 'center' }}>#</div>
          <div style={{ width: 50, textAlign: 'center' }}>Rank</div>
          <div style={{ flex: 1 }}>Warlord</div>
          <div style={{ width: 50, textAlign: 'center' }}>W/L</div>
          <div style={{ width: 40, textAlign: 'center' }}>Win%</div>
        </div>

        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '4px 12px',
        }}>
          {loading && (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: 'var(--muted)',
              fontSize: '0.7rem',
            }}>
              <div style={{
                width: 24, height: 24,
                border: '2px solid var(--accent)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 10px',
              }} />
              Loading leaderboard...
            </div>
          )}

          {error && (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: '#ef4444',
              fontSize: '0.7rem',
            }}>
              {error}
            </div>
          )}

          {!loading && !error && leaderboard.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: 'var(--muted)',
              fontSize: '0.7rem',
            }}>
              No arena battles yet. Be the first to compete!
            </div>
          )}

          {leaderboard.map((entry) => {
            const rankStyle = getRankStyle(entry.rank);
            const tier = getRankForWins(entry.wins);
            return (
              <div key={entry.teamId} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px',
                marginBottom: 3,
                borderRadius: 8,
                background: rankStyle.bg,
                border: `1px solid ${rankStyle.border}`,
                transition: 'all 0.15s',
              }}>
                <div style={{
                  width: 36,
                  textAlign: 'center',
                  fontSize: entry.rank <= 3 ? '0.9rem' : '0.7rem',
                  fontWeight: 800,
                  color: entry.rank === 1 ? '#ffd700' : entry.rank === 2 ? '#c0c0c0' : entry.rank === 3 ? '#cd7f32' : 'var(--muted)',
                  fontFamily: "'Cinzel', serif",
                }}>
                  {entry.rank}
                </div>

                <div style={{ width: 50, display: 'flex', justifyContent: 'center' }}>
                  <RankBadge wins={entry.wins} size="xs" showLabel={false} showStars={false} compact />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <span>{entry.ownerName}</span>
                    <span style={{
                      fontSize: '0.4rem',
                      color: tier.color,
                      fontFamily: "'Cinzel', serif",
                      opacity: 0.8,
                    }}>{tier.name}</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 4,
                    marginTop: 2,
                  }}>
                    {entry.heroes.map((h, i) => {
                      const cls = classDefinitions[h.classId];
                      return (
                        <span key={i} style={{
                          fontSize: '0.45rem',
                          color: 'var(--muted)',
                          background: 'rgba(255,255,255,0.04)',
                          padding: '1px 4px',
                          borderRadius: 3,
                        }}>
                          {cls?.icon || ''} {h.name} L{h.level}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div style={{
                  width: 50,
                  textAlign: 'center',
                  fontSize: '0.6rem',
                }}>
                  <span style={{ color: '#22c55e', fontWeight: 700 }}>{entry.wins}</span>
                  <span style={{ color: 'var(--muted)' }}>/</span>
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>{entry.losses}</span>
                </div>

                <div style={{
                  width: 40,
                  textAlign: 'center',
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  color: entry.winRate >= 60 ? '#22c55e' : entry.winRate >= 40 ? 'var(--accent)' : '#ef4444',
                }}>
                  {entry.winRate}%
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          padding: '10px 20px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '0.5rem', color: 'var(--muted)' }}>
            Ranks: Bronze (0) → Silver (5) → Gold (15) → Platinum (30) → Diamond (50) → Legend (100)
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend'].map((id, i) => {
              const tier = getRankForWins([0, 5, 15, 30, 50, 100][i]);
              return (
                <div key={id} style={{
                  width: 8, height: 8,
                  borderRadius: '50%',
                  background: tier.color,
                  boxShadow: `0 0 4px ${tier.glow}`,
                }} />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
