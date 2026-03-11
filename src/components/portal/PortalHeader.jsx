import React from 'react';

const DiscordSvg = ({ size = 16, color = 'currentColor' }) => (
  <svg width={size} height={Math.round(size * 0.77)} viewBox="0 0 71 55" fill={color}>
    <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4c.4-.3.7-.6 1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.3 45.6v-.1c1.4-15.1-2.4-28.2-10.1-39.8a.2.2 0 00-.1-.1zM23.7 37.3c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.2 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z"/>
  </svg>
);

export default function PortalHeader({ session, onSignOut }) {
  const isLoggedIn = session && ['discord', 'grudge', 'puter'].includes(session.type);

  const avatarBg = session?.type === 'discord'
    ? '#5865F2'
    : 'linear-gradient(135deg, #DB6331, #FAAC47)';

  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '16px 28px',
      background: 'rgba(0,0,0,0.5)',
      borderBottom: '1px solid rgba(212,169,106,0.15)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img
          src="/sprites/ui/grudge_logo.png" alt="Grudge Studio"
          style={{ width: 36, height: 36, objectFit: 'contain' }}
        />
        <div>
          <div style={{
            fontFamily: "'Cinzel', serif", fontSize: '1.1rem', fontWeight: 700,
            color: '#d4a96a', letterSpacing: 2,
          }}>
            GRUDGE STUDIO
          </div>
          <div style={{
            fontFamily: "'Jost', sans-serif", fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.35)', letterSpacing: 3, textTransform: 'uppercase',
          }}>
            Player Portal
          </div>
        </div>
      </div>

      {isLoggedIn ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: avatarBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {session.type === 'discord'
                ? <DiscordSvg size={18} color="#fff" />
                : <img src="/sprites/ui/grudge_logo.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />}
            </div>
            <div>
              <div style={{
                fontFamily: "'Jost', sans-serif", fontSize: '0.85rem',
                color: '#e8dcc8', fontWeight: 600,
              }}>
                {session.username}
              </div>
              {session.grudgeId && (
                <div style={{
                  fontFamily: "'Jost', sans-serif", fontSize: '0.6rem',
                  color: 'rgba(255,255,255,0.3)', letterSpacing: 0.5,
                }}>
                  {session.grudgeId}
                </div>
              )}
            </div>
          </div>
          <button onClick={onSignOut} style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '6px 14px',
            color: '#888', fontSize: '0.75rem', cursor: 'pointer',
            fontFamily: "'Jost', sans-serif", transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#888'; }}
          >
            Sign Out
          </button>
        </div>
      ) : (
        <div style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#888' }}>
          Not signed in
        </div>
      )}
    </header>
  );
}
