import React, { useState, useEffect, useMemo } from 'react';
import PortalHeader from './portal/PortalHeader';
import GameCard from './portal/GameCard';
import QuickLinks from './portal/QuickLinks';
import HeroPreview from './portal/HeroPreview';
import { API_BASE } from '../utils/apiBase.js';

const DiscordSvg = ({ size = 20, color = 'currentColor' }) => (
  <svg width={size} height={Math.round(size * 0.77)} viewBox="0 0 71 55" fill={color}>
    <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4c.4-.3.7-.6 1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.3 45.6v-.1c1.4-15.1-2.4-28.2-10.1-39.8a.2.2 0 00-.1-.1zM23.7 37.3c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.2 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z"/>
  </svg>
);

export default function StudioPortal() {
  const [session, setSession] = useState(null);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('grudge-session') || 'null');
      if (s && s.type && s.username) setSession(s);
    } catch {}
  }, []);

  const isLoggedIn = session && ['discord', 'grudge', 'puter'].includes(session.type);

  const handleSignOut = () => {
    localStorage.removeItem('grudge-session');
    localStorage.removeItem('grudge_session_token');
    localStorage.removeItem('discordUser');
    localStorage.removeItem('grudge_studio_session');
    localStorage.removeItem('grudge_studio_user');
    setSession(null);
  };

  const handleDiscordLogin = async () => {
    setDiscordLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/discord/login`);
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {}
    setDiscordLoading(false);
  };

  const handleFormSubmit = async (e) => {
    e?.preventDefault();
    if (!formUsername || !formPassword) { setFormError('Enter username and password'); return; }
    setFormLoading(true); setFormError('');
    try {
      const endpoint = isRegister ? `${API_BASE}/api/auth/register` : `${API_BASE}/api/auth/login`;
      const r = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formUsername, password: formPassword }),
      });
      const data = await r.json();
      if (!r.ok) { setFormError(data.error || 'Failed'); setFormLoading(false); return; }
      if (data.sessionToken) localStorage.setItem('grudge_session_token', data.sessionToken);
      const s = {
        type: 'grudge', username: data.user?.username || formUsername,
        accountId: data.user?.id, grudgeId: data.user?.grudgeId || null,
        loginTime: Date.now(),
      };
      localStorage.setItem('grudge-session', JSON.stringify(s));
      setSession(s);
      setShowLoginForm(false);
    } catch { setFormError('Server unreachable'); }
    setFormLoading(false);
  };

  const handleGuest = () => {
    window.location.href = '/play';
  };

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      background: '#0a0a12',
      color: '#e8dcc8',
      fontFamily: "'Jost', sans-serif",
      display: 'flex', flexDirection: 'column',
    }}>
      <PortalHeader session={session} onSignOut={handleSignOut} />

      <main style={{
        flex: 1, maxWidth: 900, width: '100%', margin: '0 auto',
        padding: '32px 24px',
        display: 'flex', flexDirection: 'column', gap: 28,
      }}>
        {/* Auth section — only when not logged in */}
        {!isLoggedIn && (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(212,169,106,0.15)',
            borderRadius: 12, padding: '28px 32px',
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Cinzel', serif", fontSize: '1.3rem',
              color: '#d4a96a', fontWeight: 700, marginBottom: 6,
            }}>
              Welcome to Grudge Studio
            </div>
            <div style={{
              fontSize: '0.85rem', color: 'rgba(255,255,255,0.45)',
              marginBottom: 24, maxWidth: 400, margin: '0 auto 24px',
            }}>
              Sign in to access your account, heroes, and game progress across all Grudge Studio titles.
            </div>

            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}>
              {!showLoginForm ? (
                <>
                  <button onClick={() => setShowLoginForm(true)} style={{
                    width: 320, padding: '14px 24px',
                    background: 'linear-gradient(135deg, rgba(250,172,71,0.15), rgba(219,99,49,0.05))',
                    border: '2px solid rgba(250,172,71,0.5)',
                    borderRadius: 8, color: '#FAAC47', fontSize: '1rem', fontWeight: 700,
                    fontFamily: "'LifeCraft', 'Cinzel', serif", letterSpacing: 3,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'all 0.2s',
                  }}>
                    <img src="/sprites/ui/grudge_logo.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    LOGIN WITH GRUDGE
                  </button>

                  <button onClick={handleDiscordLogin} disabled={discordLoading} style={{
                    width: 320, padding: '12px 24px',
                    background: 'rgba(88,101,242,0.08)',
                    border: '1px solid rgba(88,101,242,0.4)',
                    borderRadius: 8, color: '#93a4f4', fontSize: '0.95rem', fontWeight: 700,
                    fontFamily: "'LifeCraft', 'Cinzel', serif", letterSpacing: 3,
                    cursor: discordLoading ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    transition: 'all 0.2s', opacity: discordLoading ? 0.6 : 1,
                  }}>
                    <DiscordSvg size={20} color="#7289da" />
                    {discordLoading ? 'CONNECTING...' : 'LOGIN WITH DISCORD'}
                  </button>

                  <button onClick={handleGuest} style={{
                    width: 320, padding: '10px 24px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 8, color: '#888', fontSize: '0.85rem',
                    fontFamily: "'Jost', sans-serif", cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}>
                    Play as Guest
                  </button>
                </>
              ) : (
                <form onSubmit={handleFormSubmit} style={{
                  width: 320, display: 'flex', flexDirection: 'column', gap: 8,
                  background: 'rgba(250,172,71,0.06)', border: '1px solid rgba(250,172,71,0.25)',
                  borderRadius: 8, padding: '16px 20px',
                }}>
                  <div style={{
                    fontFamily: "'Cinzel', serif", fontSize: '0.95rem',
                    color: '#FAAC47', textAlign: 'center', marginBottom: 4,
                  }}>
                    {isRegister ? 'Create Grudge ID' : 'Grudge Login'}
                  </div>
                  <input
                    type="text" placeholder="Username" value={formUsername}
                    onChange={e => setFormUsername(e.target.value)} autoComplete="username"
                    style={{
                      padding: '10px 14px', background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
                      color: '#e8dcc8', fontSize: '0.9rem', fontFamily: "'Jost', sans-serif", outline: 'none',
                    }}
                  />
                  <input
                    type="password" placeholder="Password" value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    autoComplete={isRegister ? 'new-password' : 'current-password'}
                    style={{
                      padding: '10px 14px', background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6,
                      color: '#e8dcc8', fontSize: '0.9rem', fontFamily: "'Jost', sans-serif", outline: 'none',
                    }}
                  />
                  {formError && <div style={{ color: '#ef4444', fontSize: '0.8rem', textAlign: 'center' }}>{formError}</div>}
                  <button type="submit" disabled={formLoading} style={{
                    padding: '10px', background: 'linear-gradient(135deg, #DB6331, #FAAC47)',
                    border: 'none', borderRadius: 6, color: '#0a0a12', fontWeight: 700,
                    fontSize: '0.9rem', fontFamily: "'Cinzel', serif", letterSpacing: 1,
                    cursor: formLoading ? 'wait' : 'pointer', opacity: formLoading ? 0.6 : 1,
                  }}>
                    {formLoading ? 'Connecting...' : isRegister ? 'Create Account' : 'Sign In'}
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" onClick={() => { setIsRegister(!isRegister); setFormError(''); }}
                      style={{ background: 'none', border: 'none', color: '#FAAC47', fontSize: '0.7rem', cursor: 'pointer', fontFamily: "'Jost', sans-serif" }}>
                      {isRegister ? 'Have an account? Sign in' : 'New? Create account'}
                    </button>
                    <button type="button" onClick={() => setShowLoginForm(false)}
                      style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.7rem', cursor: 'pointer', fontFamily: "'Jost', sans-serif" }}>
                      Back
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Game card */}
        <GameCard isLoggedIn={isLoggedIn} />

        {/* Hero preview (only if save exists) */}
        <HeroPreview />

        {/* Quick links */}
        <QuickLinks />

        {/* Footer */}
        <div style={{
          textAlign: 'center', padding: '16px 0',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)',
        }}>
          &copy; 2026 Grudge Studio &mdash; All Rights Reserved
        </div>
      </main>
    </div>
  );
}
