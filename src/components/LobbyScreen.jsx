import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import { InlineIcon, EssentialIcon } from '../data/uiSprites';
import SpriteAnimation from './SpriteAnimation';
import { getRaceClassSprite, worgTransformSprite, effectSprites, spriteSheets } from '../data/spriteMap';
import { raceDefinitions } from '../data/races';
import { classDefinitions } from '../data/classes';
import {
  setBgm, getMusicMuted, setMusicMuted, getSfxMuted, setSfxMuted,
} from '../utils/audioManager';
import GrudgeOnlinePage from './GrudgeOnlinePage';
import HeroCodexTab from './HeroCodexTab';

export default function LobbyScreen() {
  const setScreen = useGameStore(s => s.setScreen);
  const heroRoster = useGameStore(s => s.heroRoster);
  const gold = useGameStore(s => s.gold);
  const playerLevel = useGameStore(s => s.level);
  const playerName = useGameStore(s => s.playerName);
  const playerRace = useGameStore(s => s.playerRace);
  const playerClass = useGameStore(s => s.playerClass);
  const resetGame = useGameStore(s => s.resetGame);

  const [activeTab, setActiveTab] = useState('main');
  const [isMuted, setIsMuted] = useState(() => getMusicMuted());

  const session = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('grudge-session') || '{}');
    } catch { return {}; }
  }, []);

  const hasExistingSave = playerName && playerName.length > 0;

  useEffect(() => {
    setBgm('intro');
  }, []);

  const handleContinue = () => {
    if (hasExistingSave) {
      setScreen('world');
    }
  };

  const handleNewGame = () => {
    if (hasExistingSave) {
      if (confirm('Start a new game? Your current progress will be lost.')) {
        resetGame();
        setScreen('create');
      }
    } else {
      setScreen('create');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('grudge-session');
    setScreen('title');
  };

  const handleMuteToggle = () => {
    const next = !isMuted;
    setIsMuted(next);
    setMusicMuted(next);
    if (next) {
      setSfxMuted(true);
    }
  };

  useEffect(() => {
    const syncMute = () => setIsMuted(getMusicMuted());
    window.addEventListener('grudge-music-toggle', syncMute);
    return () => window.removeEventListener('grudge-music-toggle', syncMute);
  }, []);

  const panelStyle = {
    background: 'linear-gradient(180deg, rgba(15,20,35,0.95), rgba(10,14,25,0.98))',
    border: '1px solid rgba(110,231,183,0.15)',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/tavern_bg.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0,
        animation: 'fadeIn 1.2s ease 0.3s both',
      }} />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 24px',
        background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid rgba(110,231,183,0.1)',
        position: 'relative', zIndex: 1,
        minHeight: 80,
        animation: 'warRoomSlideDown 0.6s ease 0.5s both',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/images/grudge_rpg_logo.png" alt="Grudge RPG" style={{
            height: 48, width: 'auto', objectFit: 'contain', imageRendering: 'auto',
          }} />
        </div>
        <div style={{
          position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          <span style={{
            fontSize: '3.2rem',
            fontFamily: "'LifeCraft', 'Cinzel', serif",
            letterSpacing: 6,
            lineHeight: 1,
            background: 'linear-gradient(90deg, #8b0000 0%, #cc1100 25%, #ffd700 50%, #cc1100 75%, #8b0000 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'titleShimmer 8s linear infinite',
            filter: 'drop-shadow(0 0 20px rgba(250,172,71,0.3)) drop-shadow(0 4px 8px rgba(0,0,0,0.8))',
          }}>
            GRUDGE WARLORDS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={handleMuteToggle} style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '8px 16px',
            color: isMuted ? '#ef4444' : 'var(--muted)', fontSize: '0.95rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            fontFamily: "'LifeCraft', 'Cinzel', serif",
            letterSpacing: 1,
            transition: 'all 0.2s',
          }} title={isMuted ? 'Unmute' : 'Mute'}>
            <EssentialIcon name={isMuted ? 'SpeakerMute' : 'SpeakerOn'} size={18} />
          </button>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '8px 18px',
            color: 'var(--muted)', fontSize: '0.95rem',
            cursor: 'pointer', fontFamily: "'LifeCraft', 'Cinzel', serif",
            letterSpacing: 2,
          }}>
            SIGN OUT
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex', flex: 1, overflow: 'hidden',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{
          width: 210,
          backgroundImage: 'url(/ui/sidebar-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRight: 'none',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
          padding: '110px 1px 16px',
          gap: 6,
          position: 'relative',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6), 4px 0 12px rgba(0,0,0,0.5)',
          animation: 'warRoomSlideRight 0.6s ease 0.8s both',
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(5,5,15,0.15) 30%, rgba(5,5,15,0.15) 70%, rgba(0,0,0,0.35) 100%)',
            pointerEvents: 'none', zIndex: 0,
          }} />
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 14,
            backgroundImage: 'url(/ui/sidebar-border.png)',
            backgroundSize: '14px 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            pointerEvents: 'none', zIndex: 2,
            filter: 'brightness(0.8)',
          }} />
          <NavItem essentialIcon="Gamepad" label="PLAY" active={activeTab === 'main'} onClick={() => setActiveTab('main')} />
          <NavItem essentialIcon="Team" label="CHARACTERS" active={activeTab === 'characters'} onClick={() => setActiveTab('characters')} />
          <NavItem essentialIcon="Briefcase" label="ACCOUNT" active={activeTab === 'account'} onClick={() => setActiveTab('account')} />
          <NavItem essentialIcon="Cloud" label="DISCORD" active={activeTab === 'discord'} onClick={() => setActiveTab('discord')} />
          <NavItem essentialIcon="File" label="CODEX" active={activeTab === 'codex'} onClick={() => setActiveTab('codex')} />
          <div style={{ flex: 1 }} />
          <NavItem essentialIcon="Trophy" label="CREDITS" active={activeTab === 'credits'} onClick={() => setActiveTab('credits')} />
        </div>

        <div style={{
          flex: 1, overflow: 'auto', padding: 24,
          animation: 'warRoomFadeUp 0.7s ease 1.1s both',
        }}>
          {activeTab === 'main' && (
            <MainTab
              hasExistingSave={hasExistingSave}
              onContinue={handleContinue}
              onNewGame={handleNewGame}
              playerName={playerName}
              playerLevel={playerLevel}
              playerRace={playerRace}
              playerClass={playerClass}
              gold={gold}
              heroRoster={heroRoster}
              panelStyle={panelStyle}
            />
          )}
          {activeTab === 'characters' && (
            <CharactersTab heroRoster={heroRoster} panelStyle={panelStyle} />
          )}
          {activeTab === 'account' && (
            <AccountTab session={session} panelStyle={panelStyle} hasExistingSave={hasExistingSave} />
          )}
          {activeTab === 'discord' && (
            <DiscordTab panelStyle={panelStyle} />
          )}
          {activeTab === 'codex' && (
            <HeroCodexTab panelStyle={panelStyle} />
          )}
          {activeTab === 'credits' && (
            <CreditsTab panelStyle={panelStyle} />
          )}
        </div>
      </div>
    </div>
  );
}

function NavItem({ essentialIcon, label, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative', zIndex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', backgroundColor: 'transparent',
        border: 'none', borderRadius: 0, padding: 0, margin: '0',
        width: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.25,0.8,0.25,1)',
        transform: hovered ? 'translateY(-2px) scale(1.03)' : 'translateY(0) scale(1)',
        filter: hovered && !active ? 'brightness(1.15)' : 'none',
      }}
    >
      <img
        src={active ? '/ui/wood_light.png' : '/ui/wood_dark.png'}
        alt=""
        style={{
          display: 'block', width: '100%', height: 94,
          objectFit: 'fill',
          pointerEvents: 'none',
        }}
      />
      <span style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        color: '#1a1008', fontSize: '1.2rem',
        fontFamily: "'LifeCraft', 'Cinzel', serif",
        letterSpacing: 3,
        textShadow: '0 1px 0 rgba(255,255,255,0.3)',
        padding: '0 16px',
      }}>
        <span style={{ filter: 'brightness(0.15)', display: 'flex', alignItems: 'center' }}>
          <EssentialIcon name={essentialIcon} size={16} />
        </span>
        {label}
      </span>
    </button>
  );
}

function WarRoomCard({ onClick, borderColor, hoverBorderColor, hoverShadow, bgImage, tagColor, tag, titleColor, title, subtitle, cardStyle, disabled }) {
  const [hovered, setHovered] = useState(false);
  const isActive = !disabled && onClick;

  return (
    <div
      onClick={isActive ? onClick : undefined}
      style={{
        ...cardStyle,
        borderColor: hovered && isActive ? (hoverBorderColor || borderColor) : borderColor,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'default' : 'pointer',
        transform: hovered && isActive ? 'scale(1.03) translateY(-2px)' : 'scale(1)',
        boxShadow: hovered && isActive ? (hoverShadow || 'none') : 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', transition: 'transform 0.5s ease', transform: hovered && isActive ? 'scale(1.08)' : 'scale(1)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)' }} />
      {hovered && isActive && (
        <div style={{
          position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
          animation: 'lobbyCardShine 0.8s ease forwards',
          pointerEvents: 'none', zIndex: 2,
        }} />
      )}
      <div style={{ position: 'relative', padding: 16, zIndex: 1 }}>
        <div style={{ color: tagColor, fontSize: '0.6rem', letterSpacing: 3, marginBottom: 4 }}>{tag}</div>
        <div className="font-cinzel" style={{ color: titleColor, fontSize: '1rem' }}>{title}</div>
        {subtitle && (
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', marginTop: 4 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
}

function MainTab({ hasExistingSave, onContinue, onNewGame, playerName, playerLevel, playerRace, playerClass, gold, heroRoster, panelStyle }) {
  const [showInfo, setShowInfo] = useState(false);
  const [walletState, setWalletState] = useState({ loading: true, hasWallet: false, wallet: null, error: null, creating: false });
  const [showWallet, setShowWallet] = useState(false);

  useEffect(() => {
    const session = (() => { try { return JSON.parse(localStorage.getItem('grudge-session') || '{}'); } catch { return {}; } })();
    if (!session.token || session.type !== 'discord') {
      setWalletState({ loading: false, hasWallet: false, wallet: null, error: null, creating: false });
      return;
    }
    fetch('/api/wallet/status', { headers: { 'x-session-token': session.token } })
      .then(r => r.json())
      .then(data => {
        setWalletState({ loading: false, hasWallet: data.hasWallet, wallet: data.wallet || null, error: null, creating: false });
      })
      .catch(() => setWalletState({ loading: false, hasWallet: false, wallet: null, error: null, creating: false }));
  }, []);

  const createWallet = async () => {
    const session = (() => { try { return JSON.parse(localStorage.getItem('grudge-session') || '{}'); } catch { return {}; } })();
    if (!session.token) return;
    setWalletState(s => ({ ...s, creating: true, error: null }));
    try {
      const res = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: { 'x-session-token': session.token, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setWalletState({ loading: false, hasWallet: true, wallet: data.wallet, error: null, creating: false });
    } catch (err) {
      setWalletState(s => ({ ...s, creating: false, error: err.message }));
    }
  };

  const cardStyle = {
    flex: '1 1 0',
    minWidth: 180,
    minHeight: 160,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer',
    border: '1px solid rgba(110,231,183,0.15)',
    transition: 'transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  };

  return (
    <div>
      <h2 className="font-cinzel" style={{
        fontSize: '1.4rem', marginBottom: 16,
        background: 'linear-gradient(90deg, var(--accent), #ffd700, var(--accent))',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        animation: 'titleShimmer 6s linear infinite',
      }}>
        War Room
      </h2>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <WarRoomCard
          onClick={onNewGame}
          borderColor="rgba(250,172,71,0.3)"
          hoverBorderColor="rgba(250,172,71,0.6)"
          hoverShadow="0 0 24px rgba(250,172,71,0.2), 0 8px 32px rgba(0,0,0,0.4)"
          bgImage="/backgrounds/character_create.png"
          tagColor="rgba(250,172,71,0.7)"
          tag="NEW JOURNEY"
          titleColor="#FAAC47"
          title="New Campaign"
          subtitle="Choose your race and class"
          cardStyle={cardStyle}
        />

        <WarRoomCard
          onClick={hasExistingSave ? onContinue : undefined}
          borderColor={hasExistingSave ? 'rgba(110,231,183,0.3)' : 'rgba(255,255,255,0.08)'}
          hoverBorderColor="rgba(110,231,183,0.6)"
          hoverShadow="0 0 24px rgba(110,231,183,0.2), 0 8px 32px rgba(0,0,0,0.4)"
          bgImage="/backgrounds/dark_forest.png"
          tagColor="rgba(110,231,183,0.7)"
          tag={hasExistingSave ? 'SAVED CAMPAIGN' : 'NO SAVE DATA'}
          titleColor={hasExistingSave ? 'var(--accent)' : 'rgba(255,255,255,0.3)'}
          title={hasExistingSave ? playerName : 'Continue'}
          subtitle={hasExistingSave ? <>Lv.{playerLevel} {playerRace} {playerClass} &bull; <InlineIcon name="gold" size={10} /> {gold}</> : null}
          cardStyle={cardStyle}
          disabled={!hasExistingSave}
        />

        <WarRoomCard
          onClick={() => setShowInfo(true)}
          borderColor="rgba(219,99,49,0.3)"
          hoverBorderColor="rgba(219,99,49,0.6)"
          hoverShadow="0 0 24px rgba(219,99,49,0.2), 0 8px 32px rgba(0,0,0,0.4)"
          bgImage="/backgrounds/storm_ruins.png"
          tagColor="rgba(219,99,49,0.7)"
          tag="COMPENDIUM"
          titleColor="#DB6331"
          title="Grudge Online"
          subtitle="Guides, lore & combat info"
          cardStyle={cardStyle}
        />

        <WarRoomCard
          onClick={() => setShowWallet(true)}
          borderColor={walletState.hasWallet ? 'rgba(34,197,94,0.3)' : 'rgba(139,92,246,0.3)'}
          hoverBorderColor={walletState.hasWallet ? 'rgba(34,197,94,0.6)' : 'rgba(139,92,246,0.6)'}
          hoverShadow={walletState.hasWallet ? '0 0 24px rgba(34,197,94,0.2), 0 8px 32px rgba(0,0,0,0.4)' : '0 0 24px rgba(139,92,246,0.2), 0 8px 32px rgba(0,0,0,0.4)'}
          bgImage="/backgrounds/shadow_citadel.png"
          tagColor={walletState.hasWallet ? 'rgba(34,197,94,0.7)' : 'rgba(139,92,246,0.7)'}
          tag="WEB3"
          titleColor={walletState.hasWallet ? '#22c55e' : '#8b5cf6'}
          title="Wallet"
          subtitle={walletState.loading ? 'Loading...' : walletState.hasWallet ? <>SOL &bull; {walletState.wallet?.address?.slice(0, 6)}...{walletState.wallet?.address?.slice(-4)}</> : 'Create your Solana wallet'}
          cardStyle={cardStyle}
        />
      </div>

      <HeroSlideshow />

      {showInfo && <GrudgeOnlinePage onClose={() => setShowInfo(false)} />}

      {showWallet && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)',
        }} onClick={() => setShowWallet(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'linear-gradient(180deg, #1a1428 0%, #0d0a18 100%)',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 16, padding: 28, width: 380, maxWidth: '90vw',
            boxShadow: '0 0 40px rgba(139,92,246,0.15)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 className="font-cinzel" style={{ color: '#8b5cf6', fontSize: '1.2rem', margin: 0 }}>Grudge Wallet</h3>
              <button onClick={() => setShowWallet(false)} style={{
                width: 28, height: 28, borderRadius: '50%', border: '1px solid rgba(139,92,246,0.3)',
                background: 'rgba(20,15,30,0.8)', color: '#8b5cf6', fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>X</button>
            </div>

            {walletState.hasWallet ? (
              <div>
                <div style={{
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 10, padding: 16, marginBottom: 16,
                }}>
                  <div style={{ color: '#22c55e', fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 6 }}>Solana Wallet</div>
                  <div style={{
                    color: '#e2e8f0', fontSize: '0.75rem', fontFamily: 'monospace',
                    wordBreak: 'break-all', lineHeight: 1.5,
                  }}>{walletState.wallet?.address}</div>
                  <button onClick={() => navigator.clipboard.writeText(walletState.wallet?.address)} style={{
                    marginTop: 10, padding: '5px 14px', borderRadius: 6,
                    border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)',
                    color: '#22c55e', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                  }}>Copy Address</button>
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.65rem', textAlign: 'center' }}>
                  Powered by Crossmint &bull; Solana Network
                </div>
              </div>
            ) : (
              <div>
                <div style={{
                  background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)',
                  borderRadius: 10, padding: 16, marginBottom: 16, textAlign: 'center',
                }}>
                  <div style={{ color: '#c4b998', fontSize: '0.8rem', lineHeight: 1.6, marginBottom: 4 }}>
                    Create a Solana wallet linked to your Discord account. This wallet will hold your GBUX tokens and in-game assets.
                  </div>
                </div>
                {walletState.error && (
                  <div style={{ color: '#ef4444', fontSize: '0.7rem', marginBottom: 12, textAlign: 'center' }}>
                    {walletState.error}
                  </div>
                )}
                <button onClick={createWallet} disabled={walletState.creating} style={{
                  width: '100%', padding: '12px 20px', borderRadius: 8,
                  border: '1px solid rgba(139,92,246,0.5)',
                  background: walletState.creating ? 'rgba(139,92,246,0.1)' : 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(168,85,247,0.2))',
                  color: '#a78bfa', fontSize: '0.85rem', fontWeight: 700, cursor: walletState.creating ? 'default' : 'pointer',
                  fontFamily: "'Cinzel', serif", letterSpacing: 1,
                }}>
                  {walletState.creating ? 'Creating Wallet...' : 'Create Solana Wallet'}
                </button>
                <div style={{ color: '#6b7280', fontSize: '0.6rem', textAlign: 'center', marginTop: 10 }}>
                  Requires Discord login &bull; Powered by Crossmint
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const ALL_COMBOS = Object.keys(raceDefinitions).flatMap(raceId =>
  Object.keys(classDefinitions).map(classId => ({ raceId, classId }))
);

const ATTACK_ANIMS = ['attack1', 'attack2', 'attack3', 'runAttack', 'charge', 'shot1', 'shot2'];
const ENTER_ANIMS = ['walk', 'run', 'roll', 'slide', 'charge'];

const BATTLE_BGS = [
  '/backgrounds/dark_forest.png',
  '/backgrounds/blood_canyon.png',
  '/backgrounds/crystal_caves.png',
  '/backgrounds/storm_ruins.png',
  '/backgrounds/volcanic_field.png',
  '/backgrounds/shadow_citadel.png',
  '/backgrounds/infernal_arena.png',
  '/backgrounds/dragon_peaks.png',
  '/backgrounds/corrupted_spire.png',
  '/backgrounds/haunted_marsh.png',
  '/backgrounds/mystic_grove.png',
  '/backgrounds/void_throne.png',
];

const CLASS_EFFECTS = {
  warrior: { effect: 'critSlash', aura: '#ef4444', effectKey: 'flamestrike' },
  mage: { effect: 'arcanebolt', aura: '#8b5cf6', effectKey: 'arcanelighting' },
  worge: { effect: 'hitBurst', aura: '#d97706', effectKey: 'arcanemist' },
  ranger: { effect: 'slashGreenLg', aura: '#22c55e', effectKey: 'frostbolt' },
};

const COMBO_EFFECTS = {
  human_warrior: { projectile: 'firebolt', effect: 'fireExplosion', impact: 'impactFireA', aura: '#ef4444' },
  human_mage: { projectile: null, effect: 'holylight', impact: 'impactYellowA', aura: '#fcd34d' },
  human_worge: { projectile: null, effect: 'healingwave', impact: 'impactGreenA', aura: '#22c55e' },
  human_ranger: { projectile: 'firebolt', effect: 'hitBurst', impact: 'impactOrangeA', aura: '#f97316' },
  orc_warrior: { projectile: null, effect: 'critSlash', impact: 'impactRedA', aura: '#dc2626' },
  orc_mage: { projectile: null, effect: 'felSpell', impact: 'impactPurpleA', aura: '#7c3aed' },
  orc_worge: { projectile: null, effect: 'fireSpin', impact: 'impactFireB', aura: '#f59e0b' },
  orc_ranger: { projectile: 'firebolt', effect: 'fireExplosion2', impact: 'impactRedB', aura: '#ef4444' },
  elf_warrior: { projectile: null, effect: 'beamHoly', impact: 'impactWhiteA', aura: '#e0e7ff' },
  elf_mage: { projectile: null, effect: 'arcanelighting', impact: 'impactYellowB', aura: '#facc15', effect2: 'thunderHit' },
  elf_worge: { projectile: null, effect: 'waterBlast', impact: 'impactTealA', aura: '#2dd4bf' },
  elf_ranger: { projectile: 'firebolt', effect: 'frostbolt', impact: 'impactCyanA', aura: '#22d3ee' },
  undead_warrior: { projectile: null, effect: 'arcaneslash', impact: 'impactPurpleB', aura: '#a855f7' },
  undead_mage: { projectile: null, effect: 'midnight', impact: 'impactMagentaA', aura: '#c026d3' },
  undead_worge: { projectile: null, effect: 'phantom', impact: 'impactPurpleC', aura: '#6366f1' },
  undead_ranger: { projectile: 'firebolt', effect: 'arcanebolt', impact: 'impactBlueA', aura: '#3b82f6' },
  barbarian_warrior: { projectile: null, effect: 'flamestrike', impact: 'impactFireC', aura: '#ea580c' },
  barbarian_mage: { projectile: null, effect: 'magicSpell', impact: 'impactPinkA', aura: '#ec4899' },
  barbarian_worge: { projectile: null, effect: 'vortex', impact: 'impactOrangeB', aura: '#d97706' },
  barbarian_ranger: { projectile: 'firebolt', effect: 'brightFire', impact: 'impactFireD', aura: '#fbbf24' },
  dwarf_warrior: { projectile: null, effect: 'earthBump', impact: 'impactWhiteC', aura: '#a1887f', effect2: 'earthWall' },
  dwarf_mage: { projectile: null, effect: 'nebula', impact: 'impactCyanB', aura: '#818cf8' },
  dwarf_worge: { projectile: null, effect: 'frozenIce', impact: 'impactBlueB', aura: '#38bdf8' },
  dwarf_ranger: { projectile: 'firebolt', effect: 'sunburn', impact: 'impactWhiteD', aura: '#fbbf24' },
};

const CLASS_ICON_MAP = {
  warrior: '/sprites/ui/icons/icon_warrior.png',
  mage: '/sprites/ui/icons/icon_mage.png',
  worge: '/sprites/ui/icons/icon_worge.png',
  ranger: '/sprites/ui/icons/icon_ranger.png',
};

const CLASS_TAG_MAP = {
  warrior: '/sprites/ui/icons/tag_warrior.png',
  mage: '/sprites/ui/icons/tag_mage.png',
  worge: '/sprites/ui/icons/tag_worge.png',
  ranger: '/sprites/ui/icons/tag_ranger.png',
};

const RACE_CLASS_PORTRAIT_MAP = {
  human_warrior: '/heroes/portraits/human_warrior.png',
  human_mage: '/heroes/portraits/human_mage.png',
  human_worge: '/heroes/portraits/human_worg.png',
  human_ranger: '/heroes/portraits/human_ranger.png',
  orc_warrior: '/heroes/portraits/orc_warrior.png',
  orc_mage: '/heroes/portraits/orc_mage.png',
  orc_worge: '/heroes/portraits/orc_worg.png',
  orc_ranger: '/heroes/portraits/orc_ranger.png',
  elf_warrior: '/heroes/portraits/elf_warrior.png',
  elf_mage: '/heroes/portraits/elf_mage.png',
  elf_worge: '/heroes/portraits/elf_worg.png',
  elf_ranger: '/heroes/portraits/elf_ranger.png',
  undead_warrior: '/heroes/portraits/undead_warrior.png',
  undead_mage: '/heroes/portraits/undead_mage.png',
  undead_worge: '/heroes/portraits/undead_worg.png',
  undead_ranger: '/heroes/portraits/undead_ranger.png',
  barbarian_warrior: '/heroes/portraits/barbarian_warrior.png',
  barbarian_mage: '/heroes/portraits/barbarian_mage.png',
  barbarian_worge: '/heroes/portraits/barbarian_worg.png',
  barbarian_ranger: '/heroes/portraits/barbarian_ranger.png',
  dwarf_warrior: '/heroes/portraits/dwarf_warrior.png',
  dwarf_mage: '/heroes/portraits/dwarf_mage.png',
  dwarf_worge: '/heroes/portraits/dwarf_worg.png',
  dwarf_ranger: '/heroes/portraits/dwarf_ranger.png',
};

const FACTION_MAP = {
  human: { name: 'Crusade', god: 'Odin', color: '#fbbf24', icon: '/icons/pack/factions/crusade-emblem.png' },
  barbarian: { name: 'Crusade', god: 'Odin', color: '#fbbf24', icon: '/icons/pack/factions/crusade-emblem.png' },
  orc: { name: 'Legion', god: 'Madra', color: '#ef4444', icon: '/icons/pack/factions/legion-emblem.png' },
  undead: { name: 'Legion', god: 'Madra', color: '#ef4444', icon: '/icons/pack/factions/legion-emblem.png' },
  elf: { name: 'Fabled', god: 'The Omni', color: '#22d3ee', icon: '/icons/pack/factions/fabled-emblem.png' },
  dwarf: { name: 'Fabled', god: 'The Omni', color: '#22d3ee', icon: '/icons/pack/factions/fabled-emblem.png' },
  pirates: { name: 'Pirates', god: 'None — Neutral Mercenaries', color: '#d4a017', icon: '/factions/faction_pirates.png' },
};

const HERO_SLOGANS = {
  human_warrior: "My blade is the will of the Crusade.",
  human_mage: "Knowledge and faith — both are my weapons.",
  human_worge: "The storm within answers to no one.",
  human_ranger: "One shot. One kill. Honor demands precision.",
  orc_warrior: "Blood and iron! I fear nothing!",
  orc_mage: "Dark power flows through these veins.",
  orc_worge: "The beast within hungers for war!",
  orc_ranger: "My arrows carry the Legion's fury.",
  elf_warrior: "Centuries of discipline forged this blade.",
  elf_mage: "The arcane speaks — I merely translate.",
  elf_worge: "Nature's wrath takes many forms.",
  elf_ranger: "The wind guides every arrow I loose.",
  undead_warrior: "Death could not stop me. Neither will you.",
  undead_mage: "I wield the power that destroyed me.",
  undead_worge: "Between life and death, the beast thrives.",
  undead_ranger: "The dead have perfect aim.",
  barbarian_warrior: "RAAAAGH! Come face me, coward!",
  barbarian_mage: "Primal fury needs no fancy spells!",
  barbarian_worge: "Two beasts in one body — twice the carnage!",
  barbarian_ranger: "I hunt what others fear to face.",
  dwarf_warrior: "Forged in mountain stone. Unbreakable.",
  dwarf_mage: "Rune magic runs deeper than any ley line.",
  dwarf_worge: "The mountain's spirit roars through me!",
  dwarf_ranger: "A steady hand and dwarven steel never miss.",
};

const LORE_QUOTES = {
  warrior: "Forged in the crucible of the Grudge Wars — blades drawn, shields raised.",
  mage: "Channeling ancient ley lines and forgotten gods since the first grudge was spoken.",
  worge: "Walking between worlds — scholar in mortal guise, predator unleashed.",
  ranger: "Silent as shadow, deadly as the wind — masters of the killing blow.",
};

function SlideshowVFXSprite({ effectKey, displaySize = 280, style }) {
  const [frame, setFrame] = useState(0);
  const sprite = effectSprites[effectKey];

  const hasCustomLayout = sprite ? sprite.cols !== undefined : false;
  const cols = hasCustomLayout ? sprite.cols : (sprite ? Math.round(Math.sqrt(sprite.frames)) : 1);
  const frameW = hasCustomLayout ? sprite.frameW : (sprite ? (sprite.size / cols) : 100);
  const frameH = hasCustomLayout ? sprite.frameH : (sprite ? (sprite.size / cols) : 100);
  const totalFrames = sprite ? sprite.frames : 1;
  const rows = sprite?.rows || Math.ceil(totalFrames / cols);

  useEffect(() => {
    if (!sprite) return;
    let f = 0;
    setFrame(0);
    const interval = setInterval(() => {
      f++;
      if (f >= totalFrames) { clearInterval(interval); return; }
      setFrame(f);
    }, 40);
    return () => clearInterval(interval);
  }, [effectKey, totalFrames]);

  if (!sprite) return null;

  const aspect = frameW / frameH;
  const dW = Math.round(aspect >= 1 ? displaySize : displaySize * aspect);
  const dH = Math.round(aspect >= 1 ? displaySize / aspect : displaySize);
  const col = frame % cols;
  const row = Math.floor(frame / cols);

  return (
    <div style={{
      width: dW, height: dH,
      overflow: 'hidden', pointerEvents: 'none',
      ...style,
    }}>
      <div style={{
        width: dW, height: dH,
        backgroundImage: `url(${sprite.src})`,
        backgroundSize: `${Math.round(cols * dW)}px ${Math.round(rows * dH)}px`,
        backgroundPosition: `-${Math.round(col * dW)}px -${Math.round(row * dH)}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }} />
    </div>
  );
}

function SlideshowVFX({ comboKey, playing }) {
  const combo = COMBO_EFFECTS[comboKey];
  const [phase, setPhase] = useState('idle');
  const [projX, setProjX] = useState(65);

  useEffect(() => {
    if (!playing || !combo) { setPhase('idle'); setProjX(65); return; }
    const timers = [];
    const intervals = [];
    const addT = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); };

    if (combo.projectile) {
      setPhase('projectile');
      setProjX(30);
      let x = 30;
      const moveInterval = setInterval(() => {
        x += 2.5;
        setProjX(x);
        if (x >= 65) {
          clearInterval(moveInterval);
          setPhase('effect');
          addT(() => setPhase('impact'), 400);
          if (combo.effect2) addT(() => setPhase('effect2'), 700);
          addT(() => setPhase('idle'), 1100);
        }
      }, 30);
      intervals.push(moveInterval);
    } else {
      setPhase('effect');
      addT(() => setPhase('impact'), 500);
      if (combo.effect2) addT(() => setPhase('effect2'), 800);
      addT(() => setPhase('idle'), 1200);
    }

    return () => { timers.forEach(t => clearTimeout(t)); intervals.forEach(i => clearInterval(i)); };
  }, [playing, comboKey]);

  if (!playing || !combo || phase === 'idle') return null;

  return (
    <>
      {phase === 'projectile' && combo.projectile && (
        <div style={{
          position: 'absolute',
          left: `${projX}%`, top: '45%',
          transform: 'translate(-50%, -50%)',
          zIndex: 8, mixBlendMode: 'screen', opacity: 0.95,
        }}>
          <SlideshowVFXSprite effectKey={combo.projectile} displaySize={120} />
        </div>
      )}
      {(phase === 'effect' || phase === 'impact' || phase === 'effect2') && (
        <div style={{
          position: 'absolute',
          left: '65%', top: '45%',
          transform: 'translate(-50%, -50%)',
          zIndex: 8, mixBlendMode: 'screen', opacity: 0.95,
        }}>
          <SlideshowVFXSprite effectKey={combo.effect} displaySize={280} />
        </div>
      )}
      {(phase === 'impact' || phase === 'effect2') && (
        <div style={{
          position: 'absolute',
          left: '65%', top: '45%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9, mixBlendMode: 'screen', opacity: 0.9,
        }}>
          <SlideshowVFXSprite effectKey={combo.impact} displaySize={200} />
        </div>
      )}
      {phase === 'effect2' && combo.effect2 && (
        <div style={{
          position: 'absolute',
          left: '65%', top: '45%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10, mixBlendMode: 'screen', opacity: 0.85,
        }}>
          <SlideshowVFXSprite effectKey={combo.effect2} displaySize={240} />
        </div>
      )}
    </>
  );
}

function ChatBubble({ text, visible, auraColor }) {
  if (!visible || !text) return null;
  const glowColor = auraColor || '#ffd700';
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: 80,
      transform: 'translateX(-50%)',
      zIndex: 12,
      opacity: visible ? 1 : 0,
      animation: visible ? 'bubbleFadeIn 0.4s ease-out forwards' : 'none',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(15,10,30,0.92) 0%, rgba(30,20,50,0.95) 100%)',
        border: `1px solid ${glowColor}55`,
        borderRadius: 4,
        padding: '12px 18px',
        maxWidth: 280,
        minWidth: 140,
        textAlign: 'center',
        boxShadow: `0 0 20px ${glowColor}22, inset 0 0 30px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.6)`,
      }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 4, overflow: 'hidden', pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, ${glowColor}66, transparent)`,
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 1,
            background: `linear-gradient(90deg, transparent, ${glowColor}33, transparent)`,
          }} />
        </div>

        <div style={{
          position: 'absolute', top: -6, left: 12,
          fontSize: '0.55rem', color: glowColor, letterSpacing: 2,
          textTransform: 'uppercase', opacity: 0.7,
          fontFamily: 'Cinzel, serif',
        }}>&#x2756;</div>

        <div style={{
          fontSize: '0.72rem', color: '#e8dcc8',
          fontStyle: 'italic', lineHeight: 1.5,
          textShadow: `0 0 8px ${glowColor}33, 0 1px 3px rgba(0,0,0,0.9)`,
          fontFamily: 'Jost, sans-serif',
          letterSpacing: 0.3,
        }}>
          &ldquo;{text}&rdquo;
        </div>

        <div style={{
          position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
          width: 0, height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: `10px solid rgba(15,10,30,0.92)`,
        }} />
        <div style={{
          position: 'absolute', left: -11, top: '50%', transform: 'translateY(-50%)',
          width: 0, height: 0,
          borderTop: '7px solid transparent',
          borderBottom: '7px solid transparent',
          borderRight: `11px solid ${glowColor}55`,
        }} />
      </div>
    </div>
  );
}

function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const [anim, setAnim] = useState('walk');
  const [phase, setPhase] = useState('enter');
  const [bgIndex, setBgIndex] = useState(0);
  const [prevBgIndex, setPrevBgIndex] = useState(0);
  const [bgFade, setBgFade] = useState(1);
  const [showVfx, setShowVfx] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [transformAnim, setTransformAnim] = useState('idle');
  const [showTransformVfx, setShowTransformVfx] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [auraIntensity, setAuraIntensity] = useState(0);
  const [spriteX, setSpriteX] = useState(-30);
  const [spriteY, setSpriteY] = useState(0);
  const [spriteRotation, setSpriteRotation] = useState(0);
  const [showBubble, setShowBubble] = useState(false);
  const [dummyAnim, setDummyAnim] = useState('idle');
  const [dummyVisible, setDummyVisible] = useState(true);
  const [dummyShake, setDummyShake] = useState(0);

  const [editorMode, setEditorMode] = useState(false);
  const [editorX, setEditorX] = useState(0);
  const [editorY, setEditorY] = useState(0);
  const [editorScale, setEditorScale] = useState(1);
  const [editorSaved, setEditorSaved] = useState(false);
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ mx: 0, my: 0, sx: 0, sy: 0 });
  const containerRef = useRef(null);
  const attackRef = useRef('attack1');
  const timerRefs = useRef([]);
  const indexRef = useRef(index);
  indexRef.current = index;
  const editorXRef = useRef(0);
  const editorYRef = useRef(0);
  const editorScaleRef = useRef(1);

  const getSavedPositions = () => {
    try {
      return JSON.parse(localStorage.getItem('slideshow_positions') || '{}');
    } catch { return {}; }
  };
  const saveSpritePosition = (comboKey, x, y, scale) => {
    const saved = getSavedPositions();
    saved[comboKey] = { x, y, scale };
    localStorage.setItem('slideshow_positions', JSON.stringify(saved));
  };
  const loadSpritePosition = (comboKey) => {
    const saved = getSavedPositions();
    return saved[comboKey] || null;
  };

  const combo = ALL_COMBOS[index];
  const race = raceDefinitions[combo.raceId];
  const cls = classDefinitions[combo.classId];
  const spriteData = getRaceClassSprite(combo.raceId, combo.classId);
  const isWorge = combo.classId === 'worge';
  const classEffect = CLASS_EFFECTS[combo.classId] || CLASS_EFFECTS.warrior;
  const comboEffect = COMBO_EFFECTS[`${combo.raceId}_${combo.classId}`];
  const auraColor = comboEffect?.aura || classEffect.aura;
  const faction = FACTION_MAP[combo.raceId];
  const slogan = HERO_SLOGANS[`${combo.raceId}_${combo.classId}`] || "My grudge runs deeper than any blade.";

  const worgeTransformData = isWorge ? worgTransformSprite[combo.raceId] : null;

  const BATTLE_SCALE_OVERRIDES = {};
  const SPRITE_SCALE_OVERRIDES = {
  };
  const SPRITE_Y_OFFSETS = {
  };
  const SPRITE_X_OFFSETS = {
  };
  const comboKey = `${combo.raceId}_${combo.classId}`;
  const savedPos = loadSpritePosition(comboKey);
  const spriteYOffset = savedPos ? savedPos.y : (SPRITE_Y_OFFSETS[comboKey] || 0);
  const spriteXOffset = savedPos ? savedPos.x : (SPRITE_X_OFFSETS[comboKey] || 0);
  const scaleOverride = savedPos ? savedPos.scale : (SPRITE_SCALE_OVERRIDES[comboKey] || null);

  const battleTargetSize = 200;
  const spriteFrameH = spriteData?.frameHeight || 100;
  const baseFrameSize = spriteFrameH;
  const battleComboScale = BATTLE_SCALE_OVERRIDES[comboKey] || 1;
  const battleScale = (battleTargetSize / baseFrameSize) * battleComboScale;
  const spriteScale = scaleOverride ? battleScale * scaleOverride : battleScale;
  const transformFrameH = worgeTransformData?.frameHeight || 100;
  const transformScaleBase = (spriteFrameH * spriteScale) / transformFrameH;
  const transformScale = transformScaleBase * (worgeTransformData?.transformScaleMult || 1);

  const intervalRefs = useRef([]);

  useEffect(() => {
    if (!editorMode) return;
    const handleKey = (e) => {
      const step = e.shiftKey ? 10 : 1;
      const updateEditorX = (fn) => { setEditorX(prev => { const v = typeof fn === 'function' ? fn(prev) : fn; editorXRef.current = v; return v; }); };
      const updateEditorY = (fn) => { setEditorY(prev => { const v = typeof fn === 'function' ? fn(prev) : fn; editorYRef.current = v; return v; }); };
      const updateEditorScale = (fn) => { setEditorScale(prev => { const v = typeof fn === 'function' ? fn(prev) : fn; editorScaleRef.current = v; return v; }); };
      const resetEditor = () => { updateEditorX(0); updateEditorY(0); updateEditorScale(1); };

      if (e.key === '+' || e.key === '=' || e.code === 'NumpadAdd') {
        e.preventDefault();
        updateEditorScale(s => Math.round((s + 0.05) * 100) / 100);
      } else if (e.key === '-' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        updateEditorScale(s => Math.max(0.1, Math.round((s - 0.05) * 100) / 100));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updateEditorX(x => x - step);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        updateEditorX(x => x + step);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        updateEditorY(y => y + step);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        updateEditorY(y => y - step);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        const ck = `${ALL_COMBOS[indexRef.current].raceId}_${ALL_COMBOS[indexRef.current].classId}`;
        const curSaved = getSavedPositions();
        const curX = curSaved[ck] != null ? (curSaved[ck].x ?? 0) : (SPRITE_X_OFFSETS[ck] ?? 0);
        const curY = curSaved[ck] != null ? (curSaved[ck].y ?? 0) : (SPRITE_Y_OFFSETS[ck] ?? 0);
        const curScaleOv = curSaved[ck] != null ? (curSaved[ck].scale ?? 1) : (SPRITE_SCALE_OVERRIDES[ck] ?? 1);
        const finalX = curX + editorXRef.current;
        const finalY = curY + editorYRef.current;
        const finalScale = Math.round(curScaleOv * editorScaleRef.current * 100) / 100;
        saveSpritePosition(ck, finalX, finalY, finalScale);
        resetEditor();
        setEditorSaved(true);
        setTimeout(() => setEditorSaved(false), 1500);
      } else if (e.key === 'Escape') {
        setEditorMode(false);
      } else if (e.key === '>' || e.key === '.') {
        setIndex(prev => (prev + 1) % ALL_COMBOS.length);
        resetEditor();
      } else if (e.key === '<' || e.key === ',') {
        setIndex(prev => (prev - 1 + ALL_COMBOS.length) % ALL_COMBOS.length);
        resetEditor();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [editorMode]);

  const handleEditorMouseDown = (e) => {
    if (!editorMode) return;
    e.preventDefault();
    draggingRef.current = true;
    dragStartRef.current = { mx: e.clientX, my: e.clientY, sx: editorX, sy: editorY };
  };
  const handleEditorMouseMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.mx;
    const dy = e.clientY - dragStartRef.current.my;
    const newX = dragStartRef.current.sx + dx;
    const newY = dragStartRef.current.sy - dy;
    editorXRef.current = newX;
    editorYRef.current = newY;
    setEditorX(newX);
    setEditorY(newY);
  }, []);
  const handleEditorMouseUp = useCallback(() => { draggingRef.current = false; }, []);

  useEffect(() => {
    if (!editorMode) return;
    window.addEventListener('mousemove', handleEditorMouseMove);
    window.addEventListener('mouseup', handleEditorMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleEditorMouseMove);
      window.removeEventListener('mouseup', handleEditorMouseUp);
    };
  }, [editorMode, handleEditorMouseMove, handleEditorMouseUp]);

  const clearTimers = () => {
    timerRefs.current.forEach(t => clearTimeout(t));
    timerRefs.current = [];
    intervalRefs.current.forEach(i => clearInterval(i));
    intervalRefs.current = [];
  };
  const addTimer = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timerRefs.current.push(t);
    return t;
  };

  useEffect(() => {
    if (editorMode) {
      clearTimers();
      setPhase('idle');
      setAnim('idle');
      setTextVisible(true);
      setAuraIntensity(1);
      setSpriteX(22);
      setSpriteY(0);
      setSpriteRotation(0);
      setShowVfx(false);
      setShowTransform(false);
      setShowTransformVfx(false);
      setShowBubble(false);
      return;
    }
    clearTimers();
    setPhase('enter');
    setTextVisible(false);
    setShowVfx(false);
    setShowTransform(false);
    setShowTransformVfx(false);
    setShowBubble(false);
    setAuraIntensity(0);
    setSpriteX(-30);
    setSpriteY(0);
    setSpriteRotation(0);
    setDummyAnim('idle');
    setDummyVisible(true);
    setDummyShake(0);

    const IDLE_ENTER_COMBOS = ['undead_ranger'];
    const comboId = `${combo.raceId}_${combo.classId}`;
    const forceIdle = IDLE_ENTER_COMBOS.includes(comboId);
    const enterAnim = forceIdle ? 'idle' : (spriteData?.walk ? 'walk' : (spriteData?.run ? 'run' : 'idle'));
    setAnim(enterAnim);

    setPrevBgIndex(bgIndex);
    const newBg = (bgIndex + 1 + Math.floor(Math.random() * (BATTLE_BGS.length - 1))) % BATTLE_BGS.length;
    setBgIndex(newBg);
    setBgFade(0);

    addTimer(() => setBgFade(1), 50);

    const walkDuration = 1200;
    let elapsed = 0;
    const walkStep = 16;
    const targetX = 22;
    const walkInterval = setInterval(() => {
      elapsed += walkStep;
      const progress = Math.min(elapsed / walkDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setSpriteX(-30 + (targetX - (-30)) * eased);
      if (progress >= 1) clearInterval(walkInterval);
    }, walkStep);
    intervalRefs.current.push(walkInterval);

    const PREFERRED_ATTACKS = {
      human_warrior: 'attack2',
      human_ranger: 'attack1',
    };
    const comboKey = `${combo.raceId}_${combo.classId}`;
    const preferredAttack = PREFERRED_ATTACKS[comboKey];
    const availableAttacks = ATTACK_ANIMS.filter(a => spriteData?.[a]);
    const shortAttacks = availableAttacks.filter(a => (spriteData?.[a]?.frames || 8) <= 15);
    const attackPool = shortAttacks.length > 0 ? shortAttacks : availableAttacks;
    const chosenAttack = preferredAttack && spriteData?.[preferredAttack]
      ? preferredAttack
      : attackPool.length > 0
        ? attackPool[Math.floor(Math.random() * attackPool.length)]
        : 'attack1';
    attackRef.current = chosenAttack;
    const maxFrames = 24;
    const attackFrames = Math.min(spriteData?.[chosenAttack]?.frames || 8, maxFrames);
    const attackDuration = attackFrames * 80;

    const isArcaneArcher = comboId === 'human_ranger';

    if (isArcaneArcher && spriteData?.jump && spriteData?.doublejump && spriteData?.wallslide) {
      addTimer(() => {
        setAnim('idle');
        setTextVisible(true);
        setAuraIntensity(1);
      }, walkDuration);

      const seqStart = walkDuration + 800;

      const runDuration = 600;
      const runStep = 16;
      const runStartX = 22;
      const runTargetX = 45;
      addTimer(() => {
        setAnim('run');
        let runElapsed = 0;
        const runInterval = setInterval(() => {
          runElapsed += runStep;
          const p = Math.min(runElapsed / runDuration, 1);
          setSpriteX(runStartX + (runTargetX - runStartX) * p);
          if (p >= 1) clearInterval(runInterval);
        }, runStep);
        intervalRefs.current.push(runInterval);
      }, seqStart);

      const jumpStart = seqStart + runDuration;
      const jumpDuration = 400;
      addTimer(() => {
        setAnim('jump');
        let jElapsed = 0;
        const jInterval = setInterval(() => {
          jElapsed += runStep;
          if (jElapsed <= jumpDuration) {
            const jp = jElapsed / jumpDuration;
            const arcY = Math.sin(jp * Math.PI) * 120;
            setSpriteY(arcY);
            setSpriteX(runTargetX + (55 - runTargetX) * jp);
          }
          if (jElapsed >= jumpDuration) clearInterval(jInterval);
        }, runStep);
        intervalRefs.current.push(jInterval);
      }, jumpStart);

      const djStart = jumpStart + jumpDuration;
      const djDuration = 600;
      addTimer(() => {
        setAnim('doublejump');
        setSpriteRotation(-15);
        let dElapsed = 0;
        const dInterval = setInterval(() => {
          dElapsed += runStep;
          if (dElapsed <= djDuration) {
            const dp = dElapsed / djDuration;
            const arcY = Math.sin(dp * Math.PI) * 200;
            setSpriteY(arcY);
            setSpriteX(55 + (70 - 55) * dp);
            setSpriteRotation(-15 + (-30 - (-15)) * dp * 0.5);
          }
          if (dElapsed >= djDuration) clearInterval(dInterval);
        }, runStep);
        intervalRefs.current.push(dInterval);
      }, djStart);

      const wsStart = djStart + djDuration;
      const wsDuration = 500;
      addTimer(() => {
        setAnim('wallslide');
        setSpriteRotation(0);
        let wElapsed = 0;
        const wInterval = setInterval(() => {
          wElapsed += runStep;
          if (wElapsed <= wsDuration) {
            const wp = wElapsed / wsDuration;
            const eased = wp * wp;
            setSpriteY(200 * (1 - eased));
            setSpriteX(70 + (65 - 70) * wp);
          }
          if (wElapsed >= wsDuration) clearInterval(wInterval);
        }, runStep);
        intervalRefs.current.push(wInterval);
      }, wsStart);

      const attackStart = wsStart + wsDuration;
      addTimer(() => {
        setSpriteY(0);
        setSpriteRotation(0);
        setAnim('attack1');
        addTimer(() => {
          setShowVfx(true);
          setDummyAnim('hurt');
          setDummyShake(1);
          addTimer(() => setDummyShake(0), 300);
          addTimer(() => setDummyAnim('idle'), 400);
        }, 150);
      }, attackStart);

      const atkDuration = (spriteData?.attack1?.frames || 7) * 80;
      addTimer(() => {
        setAnim('idle');
        setShowVfx(false);
        setSpriteX(65);
      }, attackStart + atkDuration + 100);

      addTimer(() => {
        setShowBubble(true);
      }, attackStart + atkDuration + 300);

      addTimer(() => {
        setPhase('exit');
        setShowBubble(false);
        setSpriteY(0);
        setSpriteRotation(0);
        addTimer(() => setIndex(prev => (prev + 1) % ALL_COMBOS.length), 600);
      }, attackStart + atkDuration + 3000);
    } else {
      addTimer(() => {
        setAnim('idle');
        setTextVisible(true);
        setAuraIntensity(1);
      }, walkDuration);

      addTimer(() => {
        setAnim(chosenAttack);
        addTimer(() => {
          setShowVfx(true);
          setDummyAnim('hurt');
          setDummyShake(1);
          addTimer(() => setDummyShake(0), 300);
          addTimer(() => setDummyAnim('idle'), 400);
        }, 200);
      }, walkDuration + 800);

      addTimer(() => {
        setAnim('idle');
        setShowVfx(false);
      }, walkDuration + 800 + attackDuration + 200);

      if (!isWorge) {
        addTimer(() => {
          setShowBubble(true);
        }, walkDuration + 800 + attackDuration + 400);
      }

      if (isWorge) {
        const transformAttacks = ATTACK_ANIMS.filter(a => worgeTransformData?.[a]);
        const tAtk = transformAttacks.length > 0
          ? transformAttacks[Math.floor(Math.random() * transformAttacks.length)]
          : 'attack1';
        const tAtkFrames = worgeTransformData?.[tAtk]?.frames || 8;
        const tAtkDuration = tAtkFrames * 80;

        addTimer(() => {
          setShowTransformVfx(true);
          setAnim('idle');
          setShowVfx(false);
        }, walkDuration + 800 + attackDuration + 1400);

        addTimer(() => {
          setShowTransform(true);
          setTransformAnim('idle');
          setShowTransformVfx(false);
        }, walkDuration + 800 + attackDuration + 1800);

        addTimer(() => {
          setTransformAnim(tAtk);
          addTimer(() => {
            setShowVfx(true);
            setDummyAnim('hurt');
            setDummyShake(1);
            addTimer(() => setDummyShake(0), 300);
            addTimer(() => setDummyAnim('idle'), 400);
          }, 200);
        }, walkDuration + 800 + attackDuration + 2000);

        addTimer(() => {
          setTransformAnim('idle');
          setShowVfx(false);
          setShowBubble(true);
        }, walkDuration + 800 + attackDuration + 2000 + tAtkDuration + 200);

        addTimer(() => {
          setPhase('exit');
          setShowBubble(false);
          addTimer(() => {
            setIndex(prev => (prev + 1) % ALL_COMBOS.length);
            setShowTransform(false);
          }, 600);
        }, walkDuration + 800 + attackDuration + 2000 + tAtkDuration + 2000);
      } else {
        addTimer(() => {
          setPhase('exit');
          setShowBubble(false);
          addTimer(() => setIndex(prev => (prev + 1) % ALL_COMBOS.length), 600);
        }, walkDuration + 800 + attackDuration + 3000);
      }
    }

    return clearTimers;
  }, [index, editorMode]);

  return (
    <div style={{
      marginTop: 16, position: 'relative', overflow: 'hidden',
      borderRadius: 12, height: 420,
      border: '1px solid rgba(255,255,255,0.08)',
      willChange: 'contents',
      contain: 'layout paint',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${BATTLE_BGS[prevBgIndex]})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        zIndex: 0, willChange: 'opacity',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${BATTLE_BGS[bgIndex]})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        zIndex: 1,
        opacity: bgFade,
        transition: 'opacity 1.2s ease-in-out',
        willChange: 'opacity',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.7) 100%)',
      }} />

      <div style={{
        position: 'absolute', inset: 0, zIndex: 3,
        opacity: phase === 'exit' ? 0 : 1,
        transition: 'opacity 0.6s ease',
      }}>
        {textVisible && (
          <div style={{
            position: 'absolute', top: 10, left: 12, zIndex: 10,
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'ssSlideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}>
            <div style={{
              width: 84, height: 84, borderRadius: '50%',
              background: `radial-gradient(circle, ${race.color}44, rgba(0,0,0,0.7))`,
              border: `3px solid ${race.color}88`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 18px ${race.color}44`,
              overflow: 'hidden',
            }}>
              <img src={RACE_CLASS_PORTRAIT_MAP[`${combo.raceId}_${combo.classId}`]} alt={race.name} style={{
                width: 76, height: 76, objectFit: 'cover', borderRadius: '50%',
              }} />
            </div>
            <div style={{
              width: 72, height: 72, borderRadius: 8,
              background: `radial-gradient(circle, ${faction.color}33, rgba(0,0,0,0.6))`,
              border: `3px solid ${faction.color}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 14px ${faction.color}33`,
              overflow: 'hidden',
            }}>
              <img src={faction.icon} alt={faction.name} style={{
                width: 56, height: 56, objectFit: 'contain', filter: 'brightness(1.2)',
              }} />
            </div>
            <div style={{
              width: 72, height: 72, borderRadius: 8,
              background: `radial-gradient(circle, ${auraColor}33, rgba(0,0,0,0.6))`,
              border: `3px solid ${auraColor}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 14px ${auraColor}33`,
              overflow: 'hidden',
            }}>
              <img src={CLASS_ICON_MAP[combo.classId]} alt={cls.name} style={{
                width: 56, height: 56, objectFit: 'contain',
                imageRendering: 'pixelated',
                filter: 'brightness(1.3)',
              }} />
            </div>
          </div>
        )}

        {textVisible && (
          <div style={{
            position: 'absolute', top: 16, left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center', zIndex: 4,
            animation: 'ssTitleDrop 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both',
            pointerEvents: 'none',
          }}>
            <div className="font-warcraft" style={{
              fontSize: '2.4rem',
              color: '#ffd700',
              textShadow: `0 0 20px ${cls.color}88, 0 2px 8px rgba(0,0,0,0.9), 0 0 40px ${cls.color}44`,
              letterSpacing: 4,
              lineHeight: 1,
            }}>
              {race.name} {cls.name}
            </div>
            <div style={{
              fontSize: '0.6rem', color: 'rgba(255,255,255,0.5)',
              marginTop: 4, fontStyle: 'italic',
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              maxWidth: 350, margin: '4px auto 0',
              lineHeight: 1.3,
              animation: 'ssFadeUp 0.6s ease 0.4s both',
            }}>
              {LORE_QUOTES[combo.classId]}
            </div>
          </div>
        )}

        <div style={{
          position: 'absolute',
          left: 0, right: 0, bottom: 0,
          height: '75%',
          zIndex: 7,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}>
          <div style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            width: '80%',
            height: '100%',
          }}>
            <div style={{
              position: 'absolute',
              left: `calc(${spriteX}% + ${spriteXOffset + (editorMode ? editorX : 0)}px)`,
              bottom: 60 - spriteYOffset + (editorMode ? editorY : 0) + spriteY,
              willChange: 'left, bottom',
              cursor: editorMode ? 'grab' : undefined,
              transform: spriteRotation ? `rotate(${spriteRotation}deg)` : undefined,
              transformOrigin: 'bottom center',
            }}
            onMouseDown={handleEditorMouseDown}>
              <div style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
              }}>
                <div style={{
                  position: 'absolute',
                  width: 250, height: 250,
                  left: '50%', bottom: 0,
                  transform: 'translate(-50%, 20%)',
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${auraColor}28 0%, ${auraColor}10 40%, transparent 65%)`,
                  opacity: auraIntensity,
                  transition: 'opacity 0.8s ease',
                  animation: auraIntensity > 0 ? 'ssAuraPulse 2s ease-in-out infinite' : 'none',
                  pointerEvents: 'none',
                }} />

                <div style={{
                  opacity: (showTransform || showTransformVfx) ? 0 : 1,
                  transform: (showTransform || showTransformVfx) ? 'scale(0.6)' : 'scale(1)',
                  transformOrigin: 'bottom center',
                  transition: 'all 0.4s ease',
                }}>
                  <SpriteAnimation
                    spriteData={spriteData}
                    animation={anim}
                    scale={spriteScale * (editorMode ? editorScale : 1)}
                    flip={!!spriteData?.facesLeft}
                    loop={['idle', 'walk', 'run', 'wallslide'].includes(anim)}
                    speed={anim === 'idle' ? 140 : anim === 'walk' || anim === 'run' ? 100 : 80}
                    onAnimationEnd={!['idle', 'walk', 'run', 'jump', 'doublejump', 'wallslide', 'roll', 'land'].includes(anim) ? () => setAnim('idle') : null}
                  />
                </div>

                {isWorge && showTransformVfx && (
                  <div style={{
                    position: 'absolute',
                    left: '50%', bottom: 0,
                    transform: 'translateX(-50%)',
                    transformOrigin: 'bottom center',
                    zIndex: 12,
                    pointerEvents: 'none',
                    animation: 'ssTornadoIn 0.3s ease-out forwards',
                  }}>
                    <SlideshowVFXSprite effectKey="worgeTornado" displaySize={300} />
                  </div>
                )}

                {isWorge && showTransform && worgeTransformData && (() => {
                  return (
                    <div style={{
                      position: 'absolute',
                      left: '50%', bottom: 0,
                      transform: 'translateX(-50%)',
                      transformOrigin: 'bottom center',
                      animation: 'ssTransformFlash 0.4s ease-out forwards',
                    }}>
                      <SpriteAnimation
                        spriteData={worgeTransformData}
                        animation={transformAnim}
                        scale={transformScale}
                        loop={transformAnim === 'idle'}
                        speed={transformAnim === 'idle' ? 140 : 80}
                        onAnimationEnd={transformAnim !== 'idle' ? () => setTransformAnim('idle') : null}
                      />
                    </div>
                  );
                })()}

              </div>
            </div>

            <SlideshowVFX comboKey={`${combo.raceId}_${combo.classId}`} playing={showVfx} />

            {dummyVisible && (
              <div style={{
                position: 'absolute',
                right: 'calc(8% + 200px)',
                bottom: 60,
                transform: 'scaleX(-1)',
                transformOrigin: 'bottom center',
                zIndex: 6,
                animation: dummyShake ? 'ssDummyShake 0.1s linear 3' : 'none',
              }}>
                <SpriteAnimation
                  spriteData={spriteSheets['training-dummy']}
                  animation={dummyAnim}
                  scale={5}
                  loop={dummyAnim === 'idle'}
                  speed={dummyAnim === 'idle' ? 200 : 120}
                  onAnimationEnd={dummyAnim !== 'idle' ? () => setDummyAnim('idle') : null}
                />
              </div>
            )}
          </div>
        </div>

        <ChatBubble text={slogan} visible={showBubble} auraColor={auraColor} />

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 9,
          padding: '0 16px 14px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7) 40%)',
        }}>
          <div style={{
            display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 10, flexWrap: 'wrap',
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.6s ease 0.2s',
          }}>
            <span style={{
              fontSize: '0.9rem', padding: '5px 16px', borderRadius: 20,
              background: `${race.color}22`, color: race.color,
              border: `1px solid ${race.color}44`,
              fontWeight: 600,
            }}>
              {race.trait}
            </span>
            <span style={{
              fontSize: '0.9rem', padding: '5px 16px', borderRadius: 20,
              background: `${cls.color}22`, color: cls.color,
              border: `1px solid ${cls.color}44`,
              fontWeight: 600,
            }}>
              {cls.name}
            </span>
            <span style={{
              fontSize: '0.85rem', padding: '5px 16px', borderRadius: 20,
              background: `${faction.color}15`, color: faction.color,
              border: `1px solid ${faction.color}33`,
              fontWeight: 600,
            }}>
              {faction.name} &bull; {faction.god}
            </span>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 2,
          }}>
            {ALL_COMBOS.map((c, i) => {
              const r = raceDefinitions[c.raceId];
              return (
                <div key={i} style={{
                  width: i === index ? 22 : 7, height: 7, borderRadius: 4,
                  background: i === index ? r.color : 'rgba(255,255,255,0.15)',
                  transition: 'all 0.4s ease',
                  cursor: 'pointer',
                }}
                onClick={() => setIndex(i)}
                />
              );
            })}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ssAuraPulse {
          0%, 100% { transform: translate(-50%, 20%) scale(1); opacity: 0.7; }
          50% { transform: translate(-50%, 20%) scale(1.08); opacity: 1; }
        }
        @keyframes ssTransformFlash {
          0% { opacity: 0; transform: translateX(-50%) scaleX(1.3); filter: brightness(3); }
          50% { opacity: 1; filter: brightness(1.5); }
          100% { opacity: 1; transform: translateX(-50%) scaleX(1); filter: brightness(1); }
        }
        @keyframes ssTornadoIn {
          0% { opacity: 0; transform: translateX(-50%) scale(0.3); filter: brightness(2) hue-rotate(60deg); }
          40% { opacity: 1; transform: translateX(-50%) scale(1.1); filter: brightness(1.5) hue-rotate(30deg); }
          100% { opacity: 1; transform: translateX(-50%) scale(1); filter: brightness(1) hue-rotate(0deg); }
        }
        @keyframes bubbleFadeIn {
          0% { opacity: 0; transform: translateX(-50%) scale(0.9); }
          100% { opacity: 1; transform: translateX(-50%) scale(1); }
        }
        @keyframes ssSlideInLeft {
          0% { opacity: 0; transform: translateX(-30px) scale(0.7); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes ssSlideInRight {
          0% { opacity: 0; transform: translateX(30px) scale(0.7); }
          100% { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes ssTitleDrop {
          0% { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.9); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes ssFadeUp {
          0% { opacity: 0; transform: translateY(8px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes ssDummyShake {
          0% { transform: scaleX(-1) translateX(0); }
          25% { transform: scaleX(-1) translateX(-6px); }
          50% { transform: scaleX(-1) translateX(6px); }
          75% { transform: scaleX(-1) translateX(-4px); }
          100% { transform: scaleX(-1) translateX(0); }
        }
      `}</style>

      <button
        onClick={() => {
          setEditorMode(e => !e);
          if (!editorMode) {
            setEditorX(0);
            setEditorY(0);
            setEditorScale(1);
          }
        }}
        style={{
          position: 'absolute', top: 8, right: 8, zIndex: 20,
          background: editorMode ? '#FAAC47' : 'rgba(0,0,0,0.5)',
          color: editorMode ? '#000' : '#fff',
          border: 'none', borderRadius: 4, padding: '4px 10px',
          fontSize: '0.7rem', cursor: 'pointer',
          fontFamily: 'Jost, sans-serif', fontWeight: 600,
        }}
      >
        {editorMode ? 'EXIT EDITOR' : 'EDIT'}
      </button>

      {editorMode && (
        <div style={{
          position: 'absolute', bottom: 8, left: 8, zIndex: 20,
          background: 'rgba(0,0,0,0.85)', border: '1px solid #FAAC47',
          borderRadius: 6, padding: '8px 12px',
          fontFamily: 'monospace', fontSize: '0.7rem', color: '#fff',
          lineHeight: 1.6, pointerEvents: 'none', userSelect: 'none',
        }}>
          <div style={{ color: '#FAAC47', fontWeight: 700, marginBottom: 4, fontSize: '0.75rem' }}>
            Sprite Editor — {combo.raceId}_{combo.classId}
          </div>
          <div>X: <span style={{ color: '#6f6' }}>{editorX}</span> | Y: <span style={{ color: '#6f6' }}>{editorY}</span> | Scale: <span style={{ color: '#6f6' }}>{editorScale.toFixed(2)}</span></div>
          <div style={{ color: '#aaa', marginTop: 4 }}>
            Drag to move | +/- scale | Arrows to nudge (Shift=10x)
          </div>
          <div style={{ color: '#aaa' }}>
            {'< > to cycle heroes | S to save | Esc to exit'}
          </div>
          {editorSaved && (
            <div style={{
              color: '#22c55e', fontWeight: 700, marginTop: 4, fontSize: '0.8rem',
              animation: 'ssFadeIn 0.3s ease',
            }}>
              SAVED {comboKey}
            </div>
          )}
          {savedPos && !editorSaved && (
            <div style={{ color: '#22d3ee', marginTop: 4, fontSize: '0.65rem' }}>
              Has saved position
            </div>
          )}
          <div style={{ color: '#FAAC47', marginTop: 4 }}>
            X: {spriteXOffset + editorX} | Y: {spriteYOffset + editorY} | Scale: {((scaleOverride || 1) * editorScale).toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
}

function HeroStatBar({ label, current, max, color, icon }) {
  const pct = max > 0 ? Math.min(100, (current / max) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {icon && <EssentialIcon name={icon} size={12} style={{ opacity: 0.7 }} />}
      <span style={{ color: 'var(--muted)', fontSize: '0.65rem', width: 24, textAlign: 'right' }}>{label}</span>
      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ color: '#ccc', fontSize: '0.6rem', width: 50, textAlign: 'right', fontFamily: 'monospace' }}>{current}/{max}</span>
    </div>
  );
}

function HeroCard({ hero, panelStyle, expanded, onToggle }) {
  const [hovered, setHovered] = useState(false);
  const rec = hero.battleRecord || { wins: 0, losses: 0, kills: 0, bossKills: 0, damageDealt: 0, healingDone: 0 };
  const raceDef = raceDefinitions[hero.race] || {};
  const classDef = classDefinitions[hero.classId] || {};
  const totalBattles = rec.wins + rec.losses;
  const winRate = totalBattles > 0 ? Math.round((rec.wins / totalBattles) * 100) : 0;
  const equipCount = hero.equipment ? Object.keys(hero.equipment).filter(k => hero.equipment[k]).length : 0;

  const raceColor = {
    human: '#6ee7b7', elf: '#93c5fd', dwarf: '#f59e0b', orc: '#ef4444', worge: '#a78bfa', undead: '#94a3b8'
  }[hero.race] || '#fff';

  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...panelStyle,
        padding: 0, cursor: 'pointer', overflow: 'hidden',
        border: hovered ? `1px solid ${raceColor}44` : panelStyle.border,
        transition: 'all 0.25s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? `0 4px 20px ${raceColor}15` : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'stretch' }}>
        <div style={{
          width: 80, minHeight: 80, overflow: 'hidden',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `linear-gradient(135deg, ${raceColor}15, transparent)`,
          borderRight: `1px solid ${raceColor}15`,
          position: 'relative',
        }}>
          <SpriteAnimation
            spriteData={getRaceClassSprite(hero.race, hero.classId)}
            animation="idle"
            scale={0.55}
            containerless={false}
          />
          <div style={{
            position: 'absolute', bottom: 2, left: 0, right: 0, textAlign: 'center',
            fontSize: '0.5rem', color: raceColor, letterSpacing: 1, opacity: 0.8,
            textTransform: 'uppercase', fontWeight: 700,
          }}>Lv.{hero.level || 1}</div>
        </div>

        <div style={{ flex: 1, padding: '10px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span className="font-cinzel" style={{ color: '#fff', fontSize: '0.95rem' }}>{hero.name}</span>
              <span style={{ color: 'var(--muted)', fontSize: '0.7rem', marginLeft: 8 }}>
                {raceDef.name || hero.race} {classDef.name || hero.classId}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ color: '#6ee7b7', fontSize: '0.7rem', fontFamily: 'monospace' }}>{rec.wins}W</span>
              <span style={{ color: '#ef4444', fontSize: '0.7rem', fontFamily: 'monospace' }}>{rec.losses}L</span>
              {totalBattles > 0 && (
                <span style={{
                  background: winRate >= 60 ? 'rgba(110,231,183,0.15)' : winRate >= 40 ? 'rgba(250,172,71,0.15)' : 'rgba(239,68,68,0.15)',
                  color: winRate >= 60 ? '#6ee7b7' : winRate >= 40 ? '#FAAC47' : '#ef4444',
                  fontSize: '0.6rem', padding: '2px 6px', borderRadius: 4, fontWeight: 700,
                }}>{winRate}%</span>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <HeroStatBar label="HP" current={hero.hp ?? hero.maxHp ?? 250} max={hero.maxHp ?? 250} color="#ef4444" />
            <HeroStatBar label="MP" current={hero.mana ?? hero.maxMana ?? 100} max={hero.maxMana ?? 100} color="#3b82f6" />
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{
          padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            <StatBox label="Kills" value={rec.kills || 0} color="#ef4444" />
            <StatBox label="Boss Kills" value={rec.bossKills || 0} color="#FAAC47" />
            <StatBox label="Damage Dealt" value={formatNum(rec.damageDealt || 0)} color="#f97316" />
            <StatBox label="Healing Done" value={formatNum(rec.healingDone || 0)} color="#6ee7b7" />
            <StatBox label="Equipment" value={`${equipCount}/7`} color="#93c5fd" />
            <StatBox label="Total Battles" value={totalBattles} color="#a78bfa" />
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '6px 8px',
      border: '1px solid rgba(255,255,255,0.04)', textAlign: 'center',
    }}>
      <div style={{ color, fontSize: '0.9rem', fontWeight: 700, fontFamily: 'monospace' }}>{value}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    </div>
  );
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

function CharactersTab({ heroRoster, panelStyle }) {
  const setScreen = useGameStore(s => s.setScreen);
  const [expandedId, setExpandedId] = useState(null);

  const totalWins = (heroRoster || []).reduce((sum, h) => sum + (h.battleRecord?.wins || 0), 0);
  const totalLosses = (heroRoster || []).reduce((sum, h) => sum + (h.battleRecord?.losses || 0), 0);
  const totalKills = (heroRoster || []).reduce((sum, h) => sum + (h.battleRecord?.kills || 0), 0);
  const maxLevel = (heroRoster || []).reduce((max, h) => Math.max(max, h.level || 1), 0);

  if (!heroRoster || heroRoster.length === 0) {
    return (
      <div style={{ maxWidth: 800 }}>
        <h2 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.4rem', marginBottom: 20 }}>
          War Council
        </h2>
        <div style={{
          ...panelStyle,
          textAlign: 'center',
          padding: '60px 50px',
          position: 'relative',
          overflow: 'hidden',
          minHeight: 220,
        }}>
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0,
            width: '50%',
            backgroundImage: 'url(/sprites/209cf40e-0369-46cc-9701-3caf1b4a7112.png)',
            backgroundSize: 'auto 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right center',
            pointerEvents: 'none',
            opacity: 0.7,
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to right, rgba(13,10,16,0.97) 25%, rgba(13,10,16,0.75) 55%, rgba(13,10,16,0.3) 85%, transparent 100%)',
            pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <EssentialIcon name="Team" size={40} style={{ opacity: 0.3, marginBottom: 16 }} />
            <div className="font-cinzel" style={{ color: '#fff', fontSize: '1.1rem', marginBottom: 8 }}>No Warlords Recruited</div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: 24, lineHeight: 1.5 }}>
              Begin a new campaign to create your first hero and build your war party.
            </div>
            <button
              onClick={() => setScreen('create')}
              style={{
                background: 'linear-gradient(135deg, rgba(250,172,71,0.25), rgba(219,99,49,0.15))',
                border: '1px solid rgba(250,172,71,0.5)', borderRadius: 8,
                color: '#FAAC47', padding: '12px 28px', cursor: 'pointer',
                fontFamily: "'LifeCraft', 'Cinzel', serif", fontSize: '1.1rem', letterSpacing: 2,
              }}
            >
              BEGIN CAMPAIGN
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.4rem', margin: 0 }}>
          War Council
        </h2>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
            <span style={{ color: '#fff' }}>{heroRoster.length}</span> Heroes
          </span>
          <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
            Best Lv.<span style={{ color: '#FAAC47' }}>{maxLevel}</span>
          </span>
          <span style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
            <span style={{ color: '#6ee7b7' }}>{totalWins}</span>W / <span style={{ color: '#ef4444' }}>{totalLosses}</span>L
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        <StatBox label="Total Battles" value={totalWins + totalLosses} color="#a78bfa" />
        <StatBox label="Total Wins" value={totalWins} color="#6ee7b7" />
        <StatBox label="Total Kills" value={totalKills} color="#ef4444" />
        <StatBox label="Heroes" value={heroRoster.length} color="#FAAC47" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {heroRoster.map(hero => (
          <HeroCard
            key={hero.id}
            hero={hero}
            panelStyle={panelStyle}
            expanded={expandedId === hero.id}
            onToggle={() => setExpandedId(expandedId === hero.id ? null : hero.id)}
          />
        ))}
      </div>
    </div>
  );
}

function AccountInfoRow({ label, value, valueColor = '#fff', icon }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span style={{ color: 'var(--muted)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
        {icon && <EssentialIcon name={icon} size={14} style={{ opacity: 0.5 }} />}
        {label}
      </span>
      <span style={{ color: valueColor, fontSize: '0.8rem', fontWeight: 600 }}>{value}</span>
    </div>
  );
}

function AccountTab({ session, panelStyle, hasExistingSave }) {
  const gold = useGameStore(s => s.gold);
  const level = useGameStore(s => s.level);
  const heroRoster = useGameStore(s => s.heroRoster);
  const zoneConquer = useGameStore(s => s.zoneConquer);
  const completedQuests = useGameStore(s => s.completedQuests);
  const harvestResources = useGameStore(s => s.harvestResources);
  const playerName = useGameStore(s => s.playerName);
  const resetGame = useGameStore(s => s.resetGame);
  const setScreen = useGameStore(s => s.setScreen);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);

  const conqueredCount = Object.values(zoneConquer || {}).filter(v => v >= 100).length;
  const exploredCount = Object.keys(zoneConquer || {}).length;
  const questCount = Object.values(completedQuests || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);
  const totalWins = (heroRoster || []).reduce((s, h) => s + (h.battleRecord?.wins || 0), 0);
  const totalLosses = (heroRoster || []).reduce((s, h) => s + (h.battleRecord?.losses || 0), 0);
  const totalKills = (heroRoster || []).reduce((s, h) => s + (h.battleRecord?.kills || 0), 0);
  const totalResources = Object.values(harvestResources || {}).reduce((s, v) => s + v, 0);

  const handleExport = () => {
    try {
      const saveData = localStorage.getItem('grudge-warlords-storage');
      if (saveData) {
        navigator.clipboard.writeText(saveData);
        setExportCopied(true);
        setTimeout(() => setExportCopied(false), 2000);
      }
    } catch {}
  };

  const handleImport = () => {
    const data = prompt('Paste your save data below:');
    if (data) {
      try {
        JSON.parse(data);
        localStorage.setItem('grudge-warlords-storage', data);
        window.location.reload();
      } catch {
        alert('Invalid save data format.');
      }
    }
  };

  const handleDeleteSave = () => {
    resetGame();
    setShowDeleteConfirm(false);
    setScreen('title');
  };

  const sectionTitle = (text) => (
    <div className="font-cinzel" style={{
      color: '#FAAC47', fontSize: '0.8rem', letterSpacing: 2, textTransform: 'uppercase',
      marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid rgba(250,172,71,0.15)',
    }}>{text}</div>
  );

  return (
    <div style={{ maxWidth: 800 }}>
      <h2 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.4rem', marginBottom: 20 }}>
        Account
      </h2>

      <div style={{ ...panelStyle }}>
        {sectionTitle('Profile')}
        <AccountInfoRow icon="Briefcase" label="Player" value={playerName || 'Adventurer'} />
        <AccountInfoRow icon="Cloud" label="Login" value={session.type === 'discord' ? 'Discord' : 'Guest'} valueColor={session.type === 'discord' ? '#5865F2' : '#FAAC47'} />
        <AccountInfoRow icon="CheckCircle" label="Status" value="Active" valueColor="#6ee7b7" />
        <AccountInfoRow icon="File" label="Save Data" value={hasExistingSave ? 'Local Storage' : 'No save'} valueColor={hasExistingSave ? '#6ee7b7' : '#ef4444'} />
        {session.loginTime && (
          <AccountInfoRow icon="Clock" label="Session Started" value={new Date(session.loginTime).toLocaleString()} />
        )}
      </div>

      <div style={{ ...panelStyle, marginTop: 12 }}>
        {sectionTitle('Campaign Stats')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          <StatBox label="Level" value={level || 1} color="#FAAC47" />
          <StatBox label="Gold" value={formatNum(gold || 0)} color="#ffd700" />
          <StatBox label="Heroes" value={(heroRoster || []).length} color="#a78bfa" />
          <StatBox label="Quests" value={questCount} color="#6ee7b7" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8 }}>
          <StatBox label="Battles Won" value={totalWins} color="#6ee7b7" />
          <StatBox label="Battles Lost" value={totalLosses} color="#ef4444" />
          <StatBox label="Total Kills" value={totalKills} color="#f97316" />
          <StatBox label="Resources" value={formatNum(totalResources)} color="#93c5fd" />
        </div>
      </div>

      <div style={{ ...panelStyle, marginTop: 12 }}>
        {sectionTitle('World Progress')}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <StatBox label="Zones Explored" value={`${exploredCount}/32`} color="#93c5fd" />
          <StatBox label="Zones Conquered" value={`${conqueredCount}/32`} color="#6ee7b7" />
        </div>
        {exploredCount > 0 && (
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                width: `${(conqueredCount / 32) * 100}%`, height: '100%',
                background: 'linear-gradient(90deg, #6ee7b7, #FAAC47)', borderRadius: 3,
                transition: 'width 0.4s ease',
              }} />
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.65rem', textAlign: 'right', marginTop: 4 }}>
              {Math.round((conqueredCount / 32) * 100)}% world domination
            </div>
          </div>
        )}
      </div>

      <div style={{ ...panelStyle, marginTop: 12 }}>
        {sectionTitle('Save Management')}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={handleExport} style={{
            background: 'rgba(110,231,183,0.1)', border: '1px solid rgba(110,231,183,0.3)',
            borderRadius: 6, color: '#6ee7b7', padding: '8px 16px', cursor: 'pointer',
            fontSize: '0.8rem', fontFamily: "'Jost', sans-serif",
          }}>
            {exportCopied ? 'Copied!' : 'Export Save'}
          </button>
          <button onClick={handleImport} style={{
            background: 'rgba(147,197,253,0.1)', border: '1px solid rgba(147,197,253,0.3)',
            borderRadius: 6, color: '#93c5fd', padding: '8px 16px', cursor: 'pointer',
            fontSize: '0.8rem', fontFamily: "'Jost', sans-serif",
          }}>
            Import Save
          </button>
          {hasExistingSave && !showDeleteConfirm && (
            <button onClick={() => setShowDeleteConfirm(true)} style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 6, color: '#ef4444', padding: '8px 16px', cursor: 'pointer',
              fontSize: '0.8rem', fontFamily: "'Jost', sans-serif", marginLeft: 'auto',
            }}>
              Delete Save
            </button>
          )}
        </div>
        {showDeleteConfirm && (
          <div style={{
            marginTop: 10, padding: 12, background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
          }}>
            <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: 8, fontWeight: 600 }}>
              Are you sure? This will permanently delete all your progress.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleDeleteSave} style={{
                background: '#ef4444', border: 'none', borderRadius: 6, color: '#fff',
                padding: '6px 16px', cursor: 'pointer', fontSize: '0.8rem',
              }}>Yes, Delete Everything</button>
              <button onClick={() => setShowDeleteConfirm(false)} style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 6, color: '#ccc', padding: '6px 16px', cursor: 'pointer', fontSize: '0.8rem',
              }}>Cancel</button>
            </div>
          </div>
        )}
      </div>

      {session.type === 'guest' && (
        <div style={{
          ...panelStyle, marginTop: 12,
          background: 'linear-gradient(135deg, rgba(88,101,242,0.1), rgba(88,101,242,0.05))',
          border: '1px solid rgba(88,101,242,0.25)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <svg width="20" height="16" viewBox="0 0 71 55" fill="#5865F2">
              <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4c.4-.3.7-.6 1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.3 45.6v-.1c1.4-15.1-2.4-28.2-10.1-39.8a.2.2 0 00-.1-.1zM23.7 37.3c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.2 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z"/>
            </svg>
            <span className="font-cinzel" style={{ color: '#5865F2', fontSize: '0.9rem' }}>
              Connect Discord
            </span>
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
            Link your Discord account to save progress across devices, join the community, and appear on leaderboards.
          </div>
        </div>
      )}
    </div>
  );
}

function DiscordTab({ panelStyle }) {
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState('');
  const [adminVerified, setAdminVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [webhookType, setWebhookType] = useState('update');
  const [webhookFields, setWebhookFields] = useState({});
  const [sending, setSending] = useState(false);
  const [webhookResult, setWebhookResult] = useState(null);

  const verifyAdmin = async () => {
    setVerifying(true);
    try {
      const res = await fetch('/api/discord/webhook/verify', {
        headers: { 'x-admin-token': adminToken },
      });
      const data = await res.json();
      setAdminVerified(data.authorized === true);
      if (!data.authorized) setWebhookResult({ ok: false, msg: 'Invalid admin token' });
    } catch { setAdminVerified(false); }
    setVerifying(false);
  };

  const WEBHOOK_TYPES = {
    update: { label: 'Game Update', icon: 'battle', fields: ['title', 'description', 'version', 'features'] },
    patch: { label: 'Patch Notes', icon: 'scroll', fields: ['version', 'changes', 'bugfixes'] },
    challenge: { label: 'Community Challenge', icon: 'trophy', fields: ['title', 'description', 'reward', 'deadline'] },
    event: { label: 'Live Event', icon: 'fire', fields: ['title', 'description', 'startTime', 'endTime'] },
    lore: { label: 'Lore Drop', icon: 'crystal', fields: ['title', 'story', 'character'] },
    tip: { label: 'Tip of the Day', icon: 'target', fields: ['title', 'tip', 'category'] },
    custom: { label: 'Custom Message', icon: 'sparkle', fields: ['content', 'title', 'description'] },
  };

  const FIELD_LABELS = {
    title: 'Title', description: 'Description', version: 'Version', features: 'Features (one per line)',
    changes: 'Changes (one per line)', bugfixes: 'Bug Fixes (one per line)', reward: 'Reward',
    deadline: 'Deadline', startTime: 'Start Time', endTime: 'End Time', story: 'Story / Lore Text',
    character: 'Featured Character', tip: 'Tip Content', category: 'Category', content: 'Message Content',
  };

  const MULTILINE_FIELDS = ['features', 'changes', 'bugfixes', 'description', 'story', 'tip', 'content'];

  const sendWebhook = async () => {
    setSending(true);
    setWebhookResult(null);
    try {
      const payload = { ...webhookFields };
      ['features', 'changes', 'bugfixes'].forEach(key => {
        if (payload[key] && typeof payload[key] === 'string') {
          payload[key] = payload[key].split('\n').filter(l => l.trim());
        }
      });
      const res = await fetch(`/api/discord/webhook/${webhookType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': adminToken },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setWebhookResult({ ok: true, msg: 'Message sent to OG channel!' });
        setWebhookFields({});
      } else {
        setWebhookResult({ ok: false, msg: data.error || 'Failed to send' });
      }
    } catch (err) {
      setWebhookResult({ ok: false, msg: err.message });
    }
    setSending(false);
  };

  const inputStyle = {
    width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(88,101,242,0.3)',
    borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: '0.75rem',
    fontFamily: "'Jost', sans-serif", outline: 'none', resize: 'vertical',
  };

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.4rem', marginBottom: 20 }}>
        Discord Community
      </h2>
      <div style={{ ...panelStyle }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <svg width="28" height="22" viewBox="0 0 71 55" fill="#5865F2">
            <path d="M60.1 4.9A58.5 58.5 0 0045.4.2a.2.2 0 00-.2.1 40.7 40.7 0 00-1.8 3.7 54 54 0 00-16.2 0A26.4 26.4 0 0025.4.3a.2.2 0 00-.2-.1A58.4 58.4 0 0010.5 4.9a.2.2 0 00-.1.1C1.5 18.7-.9 32.2.3 45.5v.1a58.8 58.8 0 0017.7 9a.2.2 0 00.3-.1 42 42 0 003.6-5.9.2.2 0 00-.1-.3 38.8 38.8 0 01-5.5-2.6.2.2 0 01 0-.4c.4-.3.7-.6 1.1-.9a.2.2 0 01.2 0 42 42 0 0035.6 0 .2.2 0 01.2 0l1.1.9a.2.2 0 010 .4 36.4 36.4 0 01-5.5 2.6.2.2 0 00-.1.3 47.2 47.2 0 003.6 5.9.2.2 0 00.3.1A58.6 58.6 0 0070.3 45.6v-.1c1.4-15.1-2.4-28.2-10.1-39.8a.2.2 0 00-.1-.1zM23.7 37.3c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7zm23.2 0c-3.4 0-6.3-3.2-6.3-7s2.8-7 6.3-7 6.4 3.2 6.3 7-2.8 7-6.3 7z"/>
          </svg>
          <div>
            <div className="font-cinzel" style={{ color: '#5865F2', fontSize: '1rem' }}>
              Grudge Warlords Discord
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
              Join the community
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <InfoRow icon="battle" label="Game Updates" value="Latest patches and balance changes" />
          <InfoRow icon="scroll" label="Strategy Guides" value="Community tips and build guides" />
          <InfoRow icon="trophy" label="Leaderboards" value="Compete with other Warlords" />
          <InfoRow icon="target" label="Bug Reports" value="Help us improve the game" />
        </div>

        <a
          href="https://discord.gg/KmAC5aXs84"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#5865F2',
            border: 'none', borderRadius: 8,
            padding: '10px 24px',
            color: '#fff', fontSize: '0.85rem',
            fontFamily: "'Cinzel', serif",
            letterSpacing: 2,
            cursor: 'pointer',
            textDecoration: 'none',
          }}
        >
          JOIN DISCORD SERVER
        </a>
      </div>

      <div style={{ ...panelStyle, marginTop: 16 }}>
        <div className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.9rem', marginBottom: 12 }}>
          Grudge Bot
        </div>
        <div style={{ color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
          Our Discord bot provides character lookups, battle stats, and community events.
          Use <span style={{ color: '#fff', fontFamily: 'monospace' }}>/grudge help</span> in any channel to get started.
        </div>
      </div>

      <div style={{ ...panelStyle, marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showAdmin ? 16 : 0 }}>
          <div className="font-cinzel" style={{ color: '#f59e0b', fontSize: '0.9rem' }}>
            OG Channel Broadcaster
          </div>
          <button onClick={() => setShowAdmin(!showAdmin)} style={{
            background: showAdmin ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(245,158,11,0.4)', borderRadius: 6,
            padding: '4px 14px', color: '#f59e0b', cursor: 'pointer',
            fontSize: '0.65rem', fontWeight: 700, fontFamily: "'Cinzel', serif",
          }}>
            {showAdmin ? 'CLOSE' : 'OPEN'}
          </button>
        </div>

        {showAdmin && !adminVerified && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <input
              type="password"
              value={adminToken}
              onChange={e => { setAdminToken(e.target.value); setWebhookResult(null); }}
              placeholder="Enter admin token..."
              style={{
                flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 6, padding: '8px 12px', color: '#e2e8f0', fontSize: '0.75rem',
                fontFamily: "'Jost', sans-serif", outline: 'none',
              }}
            />
            <button onClick={verifyAdmin} disabled={verifying || !adminToken} style={{
              background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none', borderRadius: 6,
              padding: '8px 18px', color: '#fff', fontSize: '0.7rem', fontWeight: 700,
              fontFamily: "'Cinzel', serif", cursor: verifying ? 'wait' : 'pointer',
              opacity: verifying || !adminToken ? 0.5 : 1,
            }}>
              {verifying ? 'VERIFYING...' : 'LOGIN'}
            </button>
            {webhookResult && !webhookResult.ok && (
              <span style={{ color: '#ef4444', fontSize: '0.65rem' }}>{webhookResult.msg}</span>
            )}
          </div>
        )}

        {showAdmin && adminVerified && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {Object.entries(WEBHOOK_TYPES).map(([key, { label, icon }]) => (
                <button key={key} onClick={() => { setWebhookType(key); setWebhookFields({}); setWebhookResult(null); }} style={{
                  background: webhookType === key ? 'rgba(88,101,242,0.3)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${webhookType === key ? '#5865F2' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: 6, padding: '6px 12px', cursor: 'pointer',
                  color: webhookType === key ? '#fff' : 'var(--muted)', fontSize: '0.65rem',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  <InlineIcon name={icon} size={12} /> {label}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {WEBHOOK_TYPES[webhookType].fields.map(field => (
                <div key={field}>
                  <label style={{ color: 'var(--muted)', fontSize: '0.65rem', fontWeight: 600, marginBottom: 4, display: 'block' }}>
                    {FIELD_LABELS[field] || field}
                  </label>
                  {MULTILINE_FIELDS.includes(field) ? (
                    <textarea
                      value={webhookFields[field] || ''}
                      onChange={e => setWebhookFields(f => ({ ...f, [field]: e.target.value }))}
                      rows={field === 'description' || field === 'story' || field === 'tip' || field === 'content' ? 4 : 3}
                      style={inputStyle}
                      placeholder={`Enter ${FIELD_LABELS[field] || field}...`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={webhookFields[field] || ''}
                      onChange={e => setWebhookFields(f => ({ ...f, [field]: e.target.value }))}
                      style={inputStyle}
                      placeholder={`Enter ${FIELD_LABELS[field] || field}...`}
                    />
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={sendWebhook}
                disabled={sending}
                style={{
                  background: sending ? 'rgba(88,101,242,0.2)' : 'linear-gradient(135deg, #5865F2, #7c3aed)',
                  border: 'none', borderRadius: 8, padding: '10px 28px',
                  color: '#fff', fontSize: '0.8rem', fontWeight: 700,
                  fontFamily: "'Cinzel', serif", letterSpacing: 1,
                  cursor: sending ? 'wait' : 'pointer',
                  opacity: sending ? 0.6 : 1,
                }}
              >
                {sending ? 'SENDING...' : 'BROADCAST TO OG'}
              </button>
              {webhookResult && (
                <div style={{
                  color: webhookResult.ok ? '#4ade80' : '#ef4444',
                  fontSize: '0.7rem', fontWeight: 600,
                }}>
                  {webhookResult.msg}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CreditsTab({ panelStyle }) {
  const [legalTab, setLegalTab] = useState(null);

  const sectionHeader = (text) => (
    <div className="font-cinzel" style={{
      color: 'var(--accent)', fontSize: '0.7rem', letterSpacing: 3,
      textTransform: 'uppercase', marginBottom: 8, marginTop: 4,
      borderBottom: '1px solid rgba(110,231,183,0.15)', paddingBottom: 6,
    }}>{text}</div>
  );

  const divider = <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(110,231,183,0.2), transparent)', margin: '12px 0' }} />;

  if (legalTab) {
    return (
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <button onClick={() => setLegalTab(null)} style={{
          background: 'none', border: 'none', color: 'var(--accent)',
          cursor: 'pointer', fontFamily: "'Cinzel', serif", fontSize: '0.8rem',
          marginBottom: 12, padding: 0, letterSpacing: 1,
        }}>&larr; Back to Credits</button>
        <h2 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.3rem', marginBottom: 16, textAlign: 'center' }}>
          {legalTab === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
        </h2>
        <div style={{ ...panelStyle, maxHeight: 420, overflowY: 'auto', lineHeight: 1.7, fontSize: '0.78rem', color: '#ccc' }}>
          {legalTab === 'privacy' ? (
            <div>
              <p style={{ color: 'var(--muted)', marginBottom: 12 }}>Last updated: February 2026</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#fff' }}>1. Information We Collect</strong><br/>
              Grudge Warlords collects minimal data to provide the game experience. When you log in via Discord, we receive your Discord user ID, username, and avatar. We do not collect or store passwords. Game progress (characters, inventory, arena stats) is stored server-side and linked to your account.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#fff' }}>2. How We Use Your Data</strong><br/>
              Your data is used solely to provide and improve the game experience, including saving your progress, displaying leaderboards, and enabling multiplayer features like the GRUDA Arena.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#fff' }}>3. Data Sharing</strong><br/>
              We do not sell or share your personal data with third parties. Your Discord username may appear on public leaderboards if you participate in ranked PvP.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#fff' }}>4. Cookies & Local Storage</strong><br/>
              The game uses browser local storage to save preferences and session tokens. No tracking cookies are used.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#fff' }}>5. Data Retention & Deletion</strong><br/>
              Your game data is retained as long as your account is active. You may request deletion of your account and associated data by contacting us through our Discord server.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#fff' }}>6. Children's Privacy</strong><br/>
              Grudge Warlords is not directed at children under 13. We do not knowingly collect data from children under 13.</p>
              <p><strong style={{ color: '#fff' }}>7. Contact</strong><br/>
              For privacy-related inquiries, reach us via the Grudge Warlords Discord server or at grudgestudio@proton.me.</p>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--muted)', marginBottom: 12 }}>Last updated: February 2026</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#fff' }}>1. Acceptance of Terms</strong><br/>
              By playing Grudge Warlords, you agree to these Terms of Service. If you do not agree, please do not use the game.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#fff' }}>2. Game Access</strong><br/>
              Grudge Warlords is provided as-is. We reserve the right to modify, suspend, or discontinue the game at any time without notice. Guest accounts may be wiped periodically.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#fff' }}>3. User Conduct</strong><br/>
              You agree not to exploit bugs, use automation tools, or engage in any behavior that disrupts the game experience for others. Abuse of the arena system or leaderboards may result in account suspension.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#fff' }}>4. Intellectual Property</strong><br/>
              All game content including artwork, sprites, music, code, and lore is the property of Grudge Studio. You may not reproduce, distribute, or create derivative works without permission.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#fff' }}>5. Virtual Items & Currency</strong><br/>
              In-game items, gold, and progression have no real-world monetary value. Grudge Studio reserves the right to modify game balance, items, and economy at any time.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#fff' }}>6. Disclaimer of Warranties</strong><br/>
              The game is provided "as is" without warranties of any kind. We do not guarantee uninterrupted access or that the game will be free of errors.</p>
              <p style={{ marginBottom: 10 }}><strong style={{ color: '#fff' }}>7. Limitation of Liability</strong><br/>
              Grudge Studio shall not be liable for any damages arising from the use of or inability to use the game, including loss of game data.</p>
              <p><strong style={{ color: '#fff' }}>8. Changes to Terms</strong><br/>
              We may update these terms at any time. Continued use of the game constitutes acceptance of updated terms.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 className="font-cinzel" style={{
        color: 'var(--accent)', fontSize: '1.4rem', marginBottom: 4, textAlign: 'center',
      }}>Credits</h2>
      <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: 2, marginBottom: 20 }}>
        THE PEOPLE BEHIND THE GRUDGE
      </div>

      <div style={{ ...panelStyle, background: 'linear-gradient(135deg, rgba(20,20,35,0.95), rgba(30,25,45,0.95))', border: '1px solid rgba(110,231,183,0.12)' }}>
        {sectionHeader('Studio')}
        <CreditEntry title="Grudge Studio" role="Development, Design & Direction" highlight />
        <CreditEntry title="Racalvin the Pirate King" role="Creative Lead & Founder" highlight />

        {divider}
        {sectionHeader('Art & Animation')}
        <CreditEntry title="Sprite Artists" role="Character, Monster & Boss Sprites" />
        <CreditEntry title="VFX & Particles" role="Custom Effect Sprite Sheets & CSS Animations" />
        <CreditEntry title="UI Art" role="Pixel Art Interface, Icons & Bar System" />
        <CreditEntry title="World Art" role="Map Illustrations, Scene Backgrounds & Environments" />

        {divider}
        {sectionHeader('Audio')}
        <CreditEntry title="Sound Design" role="Web Audio Synthesized SFX & Combat Sounds" />
        <CreditEntry title="Music" role="Original Background Tracks & Ambient Scores" />

        {divider}
        {sectionHeader('Technology')}
        <CreditEntry title="Engine" role="React 19, Vite, Zustand, Express" />
        <CreditEntry title="Online Services" role="Discord.js, Neon PostgreSQL, Replit" />

        {divider}
        {sectionHeader('Special Thanks')}
        <CreditEntry title="The Grudge Warlords Community" role="Beta testers, feedback & bug reports" />
        <CreditEntry title="Discord Community" role="discord.gg/KmAC5aXs84" />
      </div>

      <div style={{
        ...panelStyle, marginTop: 16, textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(20,20,35,0.9), rgba(30,25,45,0.9))',
        border: '1px solid rgba(110,231,183,0.08)',
      }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.72rem', lineHeight: 1.8 }}>
          <span className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>Grudge Warlords</span>
          <span style={{ margin: '0 6px', opacity: 0.4 }}>|</span>v1.0<br/>
          &copy; 2026 Grudge Studio. All rights reserved.
        </div>
        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center', gap: 24 }}>
          <button onClick={() => setLegalTab('privacy')} style={{
            background: 'none', border: 'none', color: 'rgba(110,231,183,0.6)',
            cursor: 'pointer', fontSize: '0.7rem', letterSpacing: 1, padding: 0,
            textDecoration: 'underline', textUnderlineOffset: 3,
          }}>Privacy Policy</button>
          <button onClick={() => setLegalTab('terms')} style={{
            background: 'none', border: 'none', color: 'rgba(110,231,183,0.6)',
            cursor: 'pointer', fontSize: '0.7rem', letterSpacing: 1, padding: 0,
            textDecoration: 'underline', textUnderlineOffset: 3,
          }}>Terms of Service</button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <InlineIcon name={icon} size={14} />
      <span style={{ color: '#fff', fontSize: '0.8rem', minWidth: 120 }}>{label}</span>
      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{value}</span>
    </div>
  );
}

function CreditEntry({ title, role, highlight }) {
  return (
    <div style={{ padding: '4px 0' }}>
      <div className="font-cinzel" style={{
        color: highlight ? 'var(--accent)' : '#ddd',
        fontSize: highlight ? '0.95rem' : '0.85rem',
        textShadow: highlight ? '0 0 12px rgba(110,231,183,0.3)' : 'none',
      }}>{title}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.72rem', marginTop: 2 }}>{role}</div>
    </div>
  );
}

function LobbyButton({ label, onClick, primary, icon }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: primary
          ? hovered ? 'rgba(110,231,183,0.3)' : 'rgba(110,231,183,0.15)'
          : hovered ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
        border: primary ? '1px solid var(--accent)' : '1px solid rgba(255,255,255,0.15)',
        borderRadius: 8,
        padding: '8px 24px',
        color: primary ? 'var(--accent)' : '#ccc',
        fontSize: '0.8rem',
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: "'Cinzel', serif",
        letterSpacing: 2,
        transition: 'all 0.2s',
        whiteSpace: 'nowrap',
      }}
    >
      {icon && <EssentialIcon name={icon} size={14} style={{ marginRight: 6 }} />}{label}
    </button>
  );
}
