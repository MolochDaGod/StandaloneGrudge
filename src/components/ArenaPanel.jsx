import React, { useEffect, useMemo, useState } from 'react';
import useGameStore from '../stores/gameStore';

function fetchJson(url, opts) {
  return fetch(url, opts).then(async r => {
    const t = await r.text();
    try { return JSON.parse(t); } catch { return { ok: r.ok, status: r.status, text: t }; }
  });
}

export default function ArenaPanel({ onClose }) {
  const heroRoster = useGameStore(s => s.heroRoster) || [];
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [posting, setPosting] = useState(false);
  const [postResult, setPostResult] = useState(null);
  const [lobby, setLobby] = useState([]);
  const [loadingLobby, setLoadingLobby] = useState(true);
  const [challenging, setChallenging] = useState(null); // teamId | null
  const [challengeResult, setChallengeResult] = useState(null);

  const top3 = useMemo(() => {
    return [...heroRoster].sort((a, b) => (b.level || 1) - (a.level || 1)).slice(0, 3);
  }, [heroRoster]);

  useEffect(() => {
    // Auto-select top3 initially
    const s = new Set(top3.map(h => h.id));
    setSelectedIds(s);
  }, [top3.map(h => h.id).join(',')]);

  useEffect(() => {
    setLoadingLobby(true);
    fetchJson('/api/arena/lobby').then(d => {
      setLobby(d.teams || []);
      setLoadingLobby(false);
    }).catch(() => setLoadingLobby(false));
  }, []);

  const selectedHeroes = useMemo(() => heroRoster.filter(h => selectedIds.has(h.id)).slice(0, 3), [heroRoster, selectedIds]);

  const canPost = selectedHeroes.length >= 1 && selectedHeroes.length <= 3 && !posting;

  const toServerHero = (h) => ({ name: h.name, raceId: h.race || h.raceId, classId: h.classId, level: h.level || 1 });

  async function postSquad() {
    if (!canPost) return;
    setPosting(true);
    setPostResult(null);
    try {
      const res = await fetchJson('/api/arena/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerId: (JSON.parse(localStorage.getItem('grudge-session') || '{}').discordId) || 'guest',
          ownerName: (JSON.parse(localStorage.getItem('grudge-session') || '{}').username) || 'Guest',
          heroes: selectedHeroes.map(toServerHero),
        }),
      });
      setPostResult(res);
      // Refresh lobby
      const lb = await fetchJson('/api/arena/lobby');
      setLobby(lb.teams || []);
    } catch (e) {
      setPostResult({ error: e.message || 'Failed to post squad' });
    }
    setPosting(false);
  }

  async function challengeTeam(teamId) {
    setChallenging(teamId);
    setChallengeResult(null);
    try {
      const t = await fetchJson(`/api/arena/team/${encodeURIComponent(teamId)}`);
      const token = t.challengeToken;
      if (!token) throw new Error('No challenge token');
      const heroes = t.heroes || [];
      if (heroes.length === 0) throw new Error('No heroes on team');
      // Open real visual BattleScreen against the saved arena team
      useGameStore.getState().startArenaChallenge({
        teamId,
        challengeToken: token,
        ownerName: t.ownerName || 'Unknown',
        heroes,
      });
      onClose();
    } catch (e) { setChallengeResult({ error: e.message || 'Failed to challenge' }); }
    setChallenging(null);
  }

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(5,8,16,0.9)', zIndex: 99998,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const card = {
    background: 'linear-gradient(180deg, #0f172a, #0b1222)', width: '92%', maxWidth: 900,
    border: '1px solid rgba(250,172,71,0.2)', borderRadius: 14, padding: 16,
    boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
  };
  const section = {
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 12,
  };
  const hdr = { color: 'var(--accent)', fontFamily: 'Cinzel, serif', fontSize: '1.1rem', marginBottom: 10 };

  return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>GRUDA Arena</div>
          <button onClick={onClose} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: 'var(--muted)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer' }}>Close</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={section}>
            <div style={hdr}>Post Squad</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 8 }}>
              Choose up to 3 heroes to post as your Ranked Arena team.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto', marginBottom: 8 }}>
              {heroRoster.map(h => {
                const checked = selectedIds.has(h.id);
                return (
                  <label key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: '#e5e7eb' }}>
                    <input type="checkbox" checked={checked} onChange={e => {
                      setSelectedIds(prev => { const n = new Set(prev); if (e.target.checked) { if (n.size < 3) n.add(h.id); } else { n.delete(h.id); } return n; });
                    }} />
                    <span style={{ color: '#93c5fd' }}>{h.name}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>{h.race || h.raceId} {h.classId}</span>
                    <span style={{ marginLeft: 'auto', color: '#fbbf24', fontFamily: 'monospace' }}>Lv.{h.level || 1}</span>
                  </label>
                );
              })}
            </div>
            <button disabled={!canPost} onClick={postSquad} style={{
              background: canPost ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(34,197,94,0.2)',
              border: 'none', borderRadius: 8, padding: '10px 16px', color: '#fff', fontWeight: 800, cursor: canPost ? 'pointer' : 'not-allowed'
            }}>
              {posting ? 'Posting…' : 'Post Squad to Arena'}
            </button>
            {postResult && (
              <div style={{ marginTop: 8, fontSize: '0.75rem', color: postResult.success ? '#22c55e' : '#ef4444' }}>
                {postResult.success ? (
                  <>Team submitted! ID: <code style={{ fontFamily: 'monospace', color: '#93c5fd' }}>{postResult.teamId}</code></>
                ) : (
                  <>Failed: {postResult.error || JSON.stringify(postResult)}</>
                )}
              </div>
            )}
          </div>

          <div style={section}>
            <div style={hdr}>Challenge</div>
            {loadingLobby ? (
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Loading lobby…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                {lobby.length === 0 && (
                  <div style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>No ranked teams yet.</div>
                )}
                {lobby.map(t => (
                  <div key={t.teamId} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 8 }}>
                    <div style={{ color: '#e5e7eb', fontWeight: 700 }}>{t.ownerName}</div>
                    <div style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>Lv.{t.avgLevel} • {t.heroCount} hero(s)</div>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <button disabled={challenging === t.teamId} onClick={() => challengeTeam(t.teamId)} style={{
                        background: challenging === t.teamId ? 'rgba(59,130,246,0.2)' : 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                        border: 'none', borderRadius: 6, color: '#fff', padding: '6px 10px', cursor: challenging === t.teamId ? 'wait' : 'pointer', fontSize: '0.8rem', fontWeight: 700,
                      }}>
                        {challenging === t.teamId ? 'Challenging…' : 'Challenge'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {challengeResult && (
              <div style={{ marginTop: 8, fontSize: '0.75rem', color: challengeResult.success ? '#22c55e' : '#ef4444' }}>
                {challengeResult.success ? (
                  <>Battle {challengeResult.battleId}: {challengeResult.result === 'team_won' ? 'Defender Lost' : 'Defender Won'} • W:{challengeResult.wins} L:{challengeResult.losses}</>
                ) : (
                  <>Failed: {challengeResult.error || JSON.stringify(challengeResult)}</>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}