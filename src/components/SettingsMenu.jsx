import React, { useState, useEffect, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import { EssentialIcon } from '../data/uiSprites';
import { SETTINGS_PANEL, SETTINGS_BUTTON } from '../constants/layers';
import {
  setMusicMuted, setSfxMuted, setMusicVolume, setSfxVolume,
  getMusicMuted, getSfxMuted, getMusicVolume, getSfxVolume,
  playClick,
} from '../utils/audioManager';

export default function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [musicOff, setMusicOff] = useState(getMusicMuted());
  const [sfxOff, setSfxOff] = useState(getSfxMuted());
  const [musicVol, setMusicVol] = useState(getMusicVolume());
  const [sfxVol, setSfxVol] = useState(getSfxVolume());
  const resetGame = useGameStore(s => s.resetGame);
  const screen = useGameStore(s => s.screen);
  const playerName = useGameStore(s => s.playerName);
  const level = useGameStore(s => s.level);
  const victories = useGameStore(s => s.victories);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (buttonRef.current && buttonRef.current.contains(e.target)) return;
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
        setConfirmReset(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    setOpen(false);
    setConfirmReset(false);
  }, [screen]);

  useEffect(() => {
    const handler = () => setOpen(o => { setConfirmReset(false); return !o; });
    window.addEventListener('toggleSettings', handler);
    return () => window.removeEventListener('toggleSettings', handler);
  }, []);

  const handleMusicToggle = () => {
    const next = !musicOff;
    setMusicOff(next);
    setMusicMuted(next);
    window.dispatchEvent(new Event('grudge-music-toggle'));
  };

  const handleSfxToggle = () => {
    const next = !sfxOff;
    setSfxOff(next);
    setSfxMuted(next);
    if (!next) playClick();
  };

  const handleMusicVol = (e) => {
    const v = parseFloat(e.target.value);
    setMusicVol(v);
    setMusicVolume(v);
  };

  const handleSfxVol = (e) => {
    const v = parseFloat(e.target.value);
    setSfxVol(v);
    setSfxVolume(v);
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    resetGame();
    setOpen(false);
    setConfirmReset(false);
  };

  const toggleStyle = (active) => ({
    width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
    background: active ? 'var(--accent)' : 'rgba(100,100,100,0.4)',
    position: 'relative', transition: 'background 0.2s',
    display: 'inline-flex', alignItems: 'center', padding: 2,
  });

  const toggleKnob = (active) => ({
    width: 20, height: 20, borderRadius: '50%',
    background: '#fff', transition: 'transform 0.2s',
    transform: active ? 'translateX(20px)' : 'translateX(0)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
  });

  const sliderStyle = {
    width: '100%', height: 4, appearance: 'none', background: 'rgba(255,255,255,0.15)',
    borderRadius: 2, outline: 'none', cursor: 'pointer',
    accentColor: 'var(--accent)',
  };

  const hiddenScreens = ['title', 'intro'];
  const showButton = !hiddenScreens.includes(screen);

  return (
    <>
      {showButton && (
        <button
          ref={buttonRef}
          onClick={() => { setOpen(o => { setConfirmReset(false); return !o; }); }}
          style={{
            position: 'fixed', bottom: 12, left: 14, zIndex: SETTINGS_BUTTON,
            width: 38, height: 38, borderRadius: 8,
            background: open ? 'rgba(110,231,183,0.15)' : 'rgba(0,0,0,0.5)',
            border: open ? '1px solid rgba(110,231,183,0.4)' : '1px solid rgba(255,255,255,0.12)',
            color: open ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(110,231,183,0.12)'; e.currentTarget.style.borderColor = 'rgba(110,231,183,0.3)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'rgba(0,0,0,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'var(--muted)'; } }}
        >
          <EssentialIcon name="Gear" size={18} />
        </button>
      )}
      {open && (
        <div ref={panelRef} style={{
          position: 'fixed', bottom: 56, left: 14, zIndex: SETTINGS_PANEL,
          width: 280,
          background: 'linear-gradient(135deg, rgba(14,22,48,0.97), rgba(20,26,43,0.97))',
          border: '1px solid rgba(110,231,183,0.25)',
          borderRadius: 14, padding: 0, overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7), 0 0 20px rgba(110,231,183,0.08)',
          animation: 'fadeIn 0.15s ease-out',
        }}>
          <div style={{
            padding: '14px 16px 10px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'linear-gradient(135deg, rgba(110,231,183,0.08), transparent)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.95rem', fontWeight: 700 }}>
                <EssentialIcon name="Gear" size={14} style={{ marginRight: 6 }} />Settings
              </span>
              <button onClick={() => { setOpen(false); setConfirmReset(false); }} style={{
                background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.1rem', cursor: 'pointer',
              }}>&times;</button>
            </div>
          </div>

          <div style={{ padding: '12px 16px' }}>
            <div style={{ color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
              <EssentialIcon name="SpeakerOn" size={12} style={{ marginRight: 4 }} />Sound
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: 'var(--text)', fontSize: '0.82rem' }}><EssentialIcon name="MusicNotes" size={12} style={{ marginRight: 4 }} />Music</span>
              <button onClick={handleMusicToggle} style={toggleStyle(!musicOff)}>
                <div style={toggleKnob(!musicOff)} />
              </button>
            </div>
            {!musicOff && (
              <div style={{ marginBottom: 12, paddingLeft: 4 }}>
                <input type="range" min="0" max="0.4" step="0.01" value={musicVol} onChange={handleMusicVol} style={sliderStyle} />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: 'var(--text)', fontSize: '0.82rem' }}><EssentialIcon name="SpeakerOn" size={12} style={{ marginRight: 4 }} />Sound Effects</span>
              <button onClick={handleSfxToggle} style={toggleStyle(!sfxOff)}>
                <div style={toggleKnob(!sfxOff)} />
              </button>
            </div>
            {!sfxOff && (
              <div style={{ marginBottom: 12, paddingLeft: 4 }}>
                <input type="range" min="0" max="0.5" step="0.01" value={sfxVol} onChange={handleSfxVol} style={sliderStyle} />
              </div>
            )}
          </div>

          {playerName && (
            <div style={{ padding: '0 16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
              <div style={{ color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
                <EssentialIcon name="Info" size={12} style={{ marginRight: 4 }} />Game Info
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                <span>Warlord</span><span style={{ color: 'var(--text)' }}>{playerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: 4 }}>
                <span>Level</span><span style={{ color: 'var(--text)' }}>{level}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                <span>Victories</span><span style={{ color: 'var(--text)' }}>{victories}</span>
              </div>
            </div>
          )}

          <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
            <div style={{ color: 'var(--gold)', fontSize: '0.7rem', fontWeight: 700, marginBottom: 10, letterSpacing: 1, textTransform: 'uppercase' }}>
              <EssentialIcon name="Gamepad" size={12} style={{ marginRight: 4 }} />Game
            </div>
            {!confirmReset ? (
              <button onClick={handleReset} style={{
                width: '100%', padding: '9px 0', borderRadius: 8,
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                <EssentialIcon name="Restart" size={14} style={{ marginRight: 6 }} />Restart Game
              </button>
            ) : (
              <div>
                <div style={{ color: '#ef4444', fontSize: '0.78rem', marginBottom: 8, textAlign: 'center' }}>
                  This will erase all progress. Are you sure?
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirmReset(false)} style={{
                    flex: 1, padding: '8px 0', borderRadius: 8,
                    background: 'rgba(100,100,100,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--text-dim)', fontSize: '0.8rem', cursor: 'pointer',
                  }}>Cancel</button>
                  <button onClick={handleReset} style={{
                    flex: 1, padding: '8px 0', borderRadius: 8,
                    background: 'rgba(239,68,68,0.25)', border: '1px solid #ef4444',
                    color: '#ef4444', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  }}>Yes, Restart</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
