import React, { useEffect, useState } from 'react';

export default function DiscordAuth() {
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [guildJoined, setGuildJoined] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');

    if (!code) {
      setStatus('ready');
      return;
    }

    // State is now verified server-side via HMAC signature — clear stale client state
    sessionStorage.removeItem('discord_oauth_state');

    setStatus('exchanging');
    fetch('/api/discord/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, state: returnedState }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
          setStatus('error');
          return;
        }
        setUser(data.user);
        setGuildJoined(data.guildJoined || false);
        if (data.sessionToken) {
          localStorage.setItem('grudge_session_token', data.sessionToken);
        }
        localStorage.setItem('discordUser', JSON.stringify(data.user));
        // Set grudge-session so cloudSync.isLoggedIn() returns true
        localStorage.setItem('grudge-session', JSON.stringify({
          type: 'discord',
          grudgeId: data.user.id,
          discordId: data.user.id,
          username: data.user.username,
        }));
        setStatus('success');
        window.history.replaceState({}, '', '/discordauth');
      })
      .catch(err => {
        setError(err.message);
        setStatus('error');
      });
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch('/api/discord/login');
      const data = await res.json();
      if (data.state) sessionStorage.setItem('discord_oauth_state', data.state);
      window.location.href = data.url;
    } catch (err) {
      setError('Could not connect to server');
      setStatus('error');
    }
  };

  const avatarUrl = user?.avatar
    ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
    : 'https://cdn.discordapp.com/embed/avatars/0.png';

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1025 50%, #0d1117 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Jost', sans-serif", color: '#e8dcc8',
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(20,26,43,0.95), rgba(30,41,59,0.9))',
        border: '2px solid rgba(88,101,242,0.4)', borderRadius: 16,
        padding: '40px 50px', maxWidth: 480, width: '90%',
        textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #5865F2, #7289da, #5865F2)',
        }} />

        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: '1.5rem',
          color: '#d4a96a', marginBottom: 8, fontWeight: 700,
          textShadow: '0 2px 8px rgba(212,169,106,0.3)',
        }}>
          Grudge Warlords
        </div>
        <div style={{
          fontSize: '0.85rem', color: '#7289da', marginBottom: 24,
          fontWeight: 600, letterSpacing: 1,
        }}>
          Beta Tester Program
        </div>

        {status === 'loading' && (
          <div style={{ color: '#a08b6d', fontSize: '0.9rem' }}>Loading...</div>
        )}

        {status === 'ready' && (
          <div>
            <p style={{ color: '#b0a080', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 24 }}>
              Connect your Discord account to join the Grudge Warlords Beta and gain
              exclusive access to our testing channel.
            </p>
            <button onClick={handleLogin} style={{
              background: '#5865F2', border: 'none', borderRadius: 8,
              padding: '14px 32px', color: '#fff', fontSize: '1rem',
              fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
              display: 'inline-flex', alignItems: 'center', gap: 10,
              boxShadow: '0 4px 12px rgba(88,101,242,0.4)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#4752C4'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#5865F2'; e.currentTarget.style.transform = 'none'; }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Login with Discord
            </button>
          </div>
        )}

        {status === 'exchanging' && (
          <div style={{ color: '#7289da', fontSize: '0.95rem' }}>
            <div style={{ animation: 'pulse 1.5s infinite', marginBottom: 8 }}>
              Connecting to Discord...
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
              Verifying your account
            </div>
          </div>
        )}

        {status === 'success' && user && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16,
              background: 'rgba(88,101,242,0.1)', border: '1px solid rgba(88,101,242,0.3)',
              borderRadius: 12, padding: 16, marginBottom: 20, justifyContent: 'center',
            }}>
              <img src={avatarUrl} alt="avatar" style={{
                width: 56, height: 56, borderRadius: '50%',
                border: '3px solid #5865F2',
              }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#e8dcc8' }}>
                  {user.globalName || user.username}
                </div>
                <div style={{ color: '#7289da', fontSize: '0.8rem' }}>
                  @{user.username}
                </div>
              </div>
            </div>

            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 8, padding: 12, marginBottom: 16,
            }}>
              <div style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
                Welcome to Grudge Warlords!
              </div>
              <div style={{ color: '#86efac', fontSize: '0.8rem' }}>
                Your Discord account has been verified.
                {guildJoined && ' You\'ve been added to our Discord server!'}
              </div>
            </div>

            {!guildJoined && (
              <a href="https://discord.gg/KmAC5aXs84" target="_blank" rel="noopener noreferrer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: '#5865F2', border: 'none', borderRadius: 8,
                padding: '12px 28px', color: '#fff', fontSize: '0.95rem',
                fontWeight: 700, cursor: 'pointer', textDecoration: 'none',
                transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(88,101,242,0.4)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#4752C4'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#5865F2'; }}
              >
                Join Our Discord
              </a>
            )}

            <div style={{ marginTop: 20 }}>
              <a href="/" style={{
                color: '#d4a96a', fontSize: '0.85rem', textDecoration: 'none',
                borderBottom: '1px solid rgba(212,169,106,0.3)',
              }}>
                Return to Game
              </a>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: 12, marginBottom: 16,
            }}>
              <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>
                Connection Failed
              </div>
              <div style={{ color: '#fca5a5', fontSize: '0.8rem' }}>
                {error || 'Something went wrong. Please try again.'}
              </div>
            </div>
            <button onClick={handleLogin} style={{
              background: '#5865F2', border: 'none', borderRadius: 8,
              padding: '12px 24px', color: '#fff', fontSize: '0.9rem',
              fontWeight: 700, cursor: 'pointer',
            }}>
              Try Again
            </button>
          </div>
        )}

        <div style={{
          marginTop: 30, paddingTop: 16,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          fontSize: '0.7rem', color: '#4b5563',
        }}>
          Grudge Studio &copy; 2026 &mdash; All Rights Reserved
        </div>
      </div>
    </div>
  );
}
