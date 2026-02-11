import React, { useState, useEffect, useMemo } from 'react';
import useGameStore from '../stores/gameStore';
import { InlineIcon, EssentialIcon } from '../data/uiSprites';
import SpriteAnimation from './SpriteAnimation';
import { getRaceClassSprite } from '../data/spriteMap';
import { setBgm } from '../utils/audioManager';

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
  const [fadeIn, setFadeIn] = useState(false);

  const session = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('grudge-session') || '{}');
    } catch { return {}; }
  }, []);

  const hasExistingSave = playerName && playerName.length > 0;

  useEffect(() => {
    setBgm('intro');
    const t = setTimeout(() => setFadeIn(true), 100);
    return () => clearTimeout(t);
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
      opacity: fadeIn ? 1 : 0,
      transition: 'opacity 0.5s ease',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid rgba(110,231,183,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="font-cinzel" style={{
            fontSize: '1.2rem',
            background: 'linear-gradient(135deg, #6ee7b7, #ffd700)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            GRUDGE WARLORDS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
            {session.type === 'discord' ? 'Discord' : 'Guest'}
          </span>
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '4px 14px',
            color: 'var(--muted)', fontSize: '0.75rem',
            cursor: 'pointer', fontFamily: "'Cinzel', serif",
          }}>
            SIGN OUT
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex', flex: 1, overflow: 'hidden',
      }}>
        <div style={{
          width: 200,
          background: 'rgba(0,0,0,0.4)',
          borderRight: '1px solid rgba(110,231,183,0.08)',
          display: 'flex', flexDirection: 'column',
          padding: '16px 0',
        }}>
          <NavItem essentialIcon="Gamepad" label="PLAY" active={activeTab === 'main'} onClick={() => setActiveTab('main')} />
          <NavItem essentialIcon="Team" label="CHARACTERS" active={activeTab === 'characters'} onClick={() => setActiveTab('characters')} />
          <NavItem essentialIcon="Briefcase" label="ACCOUNT" active={activeTab === 'account'} onClick={() => setActiveTab('account')} />
          <NavItem essentialIcon="Cloud" label="DISCORD" active={activeTab === 'discord'} onClick={() => setActiveTab('discord')} />
          <div style={{ flex: 1 }} />
          <NavItem essentialIcon="Trophy" label="CREDITS" active={activeTab === 'credits'} onClick={() => setActiveTab('credits')} />
        </div>

        <div style={{
          flex: 1, overflow: 'auto', padding: 24,
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
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 20px',
        background: active ? 'rgba(110,231,183,0.1)' : hovered ? 'rgba(255,255,255,0.03)' : 'transparent',
        border: 'none',
        borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
        color: active ? 'var(--accent)' : 'var(--muted)',
        fontSize: '0.75rem',
        fontFamily: "'Cinzel', serif",
        letterSpacing: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        width: '100%',
        textAlign: 'left',
      }}
    >
      <EssentialIcon name={essentialIcon} size={16} />
      {label}
    </button>
  );
}

function MainTab({ hasExistingSave, onContinue, onNewGame, playerName, playerLevel, playerRace, playerClass, gold, heroRoster, panelStyle }) {
  return (
    <div style={{ maxWidth: 700 }}>
      <h2 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.4rem', marginBottom: 20 }}>
        War Room
      </h2>

      {hasExistingSave && (
        <div style={{ ...panelStyle, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: '0.7rem', letterSpacing: 2, marginBottom: 4 }}>
                SAVED CAMPAIGN
              </div>
              <div className="font-cinzel" style={{ color: '#fff', fontSize: '1.1rem' }}>
                {playerName}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 4 }}>
                Level {playerLevel} {playerRace} {playerClass} &bull;{' '}
                <InlineIcon name="gold" size={12} /> {gold} Gold &bull;{' '}
                <EssentialIcon name="Team" size={12} /> {heroRoster?.length || 0} Heroes
              </div>
            </div>
            <LobbyButton label="CONTINUE" onClick={onContinue} primary icon="Play" />
          </div>
        </div>
      )}

      <div style={{ ...panelStyle }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="font-cinzel" style={{ color: '#fff', fontSize: '1rem' }}>
              New Campaign
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: 4 }}>
              Begin your journey through the realms. Choose your race and class.
            </div>
          </div>
          <LobbyButton label="NEW GAME" onClick={onNewGame} icon="Restart" />
        </div>
      </div>

      <div style={{ ...panelStyle, marginTop: 16 }}>
        <div className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '0.9rem', marginBottom: 12 }}>
          Game Features
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { essentialIcon: 'Hammer', text: '24 Warlord Combinations' },
            { essentialIcon: 'Skull', text: 'Tactical Turn-Based Combat' },
            { essentialIcon: 'Book', text: 'Deep Skill Trees' },
            { essentialIcon: 'ChestTreasure', text: 'Endgame Boss Fights' },
            { essentialIcon: 'Trophy', text: 'Zone Conquest System' },
            { essentialIcon: 'Key', text: 'Void Nexus Portal Hub' },
          ].map(f => (
            <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted)', fontSize: '0.8rem' }}>
              <EssentialIcon name={f.essentialIcon} size={14} /> {f.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CharactersTab({ heroRoster, panelStyle }) {
  if (!heroRoster || heroRoster.length === 0) {
    return (
      <div style={{ maxWidth: 700 }}>
        <h2 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.4rem', marginBottom: 20 }}>
          Characters
        </h2>
        <div style={{ ...panelStyle, textAlign: 'center', padding: 40 }}>
          <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            No heroes yet. Start a new campaign to create your first Warlord.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h2 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.4rem', marginBottom: 20 }}>
        Characters ({heroRoster.length})
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {heroRoster.map(hero => (
          <div key={hero.id} style={{
            ...panelStyle,
            display: 'flex', alignItems: 'center', gap: 16, padding: 16,
          }}>
            <div style={{
              width: 48, height: 48, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <SpriteAnimation
                spriteData={getRaceClassSprite(hero.race, hero.classId)}
                animation="idle"
                scale={0.48}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="font-cinzel" style={{ color: '#fff', fontSize: '0.95rem' }}>
                {hero.name}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>
                Lvl {hero.level || 1} {hero.race} {hero.classId} &bull; HP {hero.hp || 0}/{hero.maxHp || 0}
              </div>
            </div>
            <div style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>
              {hero.battleStats?.wins || 0}W / {hero.battleStats?.losses || 0}L
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountTab({ session, panelStyle, hasExistingSave }) {
  return (
    <div style={{ maxWidth: 700 }}>
      <h2 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.4rem', marginBottom: 20 }}>
        Account
      </h2>
      <div style={{ ...panelStyle }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Login Type</span>
            <span style={{ color: '#fff', fontSize: '0.8rem' }}>
              {session.type === 'discord' ? 'Discord' : 'Guest'}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Status</span>
            <span style={{ color: 'var(--accent)', fontSize: '0.8rem' }}>Active</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Save Data</span>
            <span style={{ color: '#fff', fontSize: '0.8rem' }}>
              {hasExistingSave ? 'Saved (Local Storage)' : 'No save data'}
            </span>
          </div>
        </div>
      </div>

      {session.type === 'guest' && (
        <div style={{ ...panelStyle, marginTop: 16 }}>
          <div className="font-cinzel" style={{ color: '#ffd700', fontSize: '0.85rem', marginBottom: 8 }}>
            Upgrade to Discord Login
          </div>
          <div style={{ color: 'var(--muted)', fontSize: '0.8rem', lineHeight: 1.5 }}>
            Connect your Discord account to save progress across devices and join the Grudge Warlords community.
          </div>
        </div>
      )}
    </div>
  );
}

function DiscordTab({ panelStyle }) {
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
          href="https://discord.gg/grudgewarlords"
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
    </div>
  );
}

function CreditsTab({ panelStyle }) {
  return (
    <div style={{ maxWidth: 700 }}>
      <h2 className="font-cinzel" style={{ color: 'var(--accent)', fontSize: '1.4rem', marginBottom: 20 }}>
        Credits
      </h2>
      <div style={{ ...panelStyle }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <CreditEntry title="Grudge Studio" role="Development & Design" />
          <CreditEntry title="Sprite Artists" role="Character & Monster Sprites" />
          <CreditEntry title="Sound Design" role="Web Audio Synthesized SFX" />
          <CreditEntry title="Special Thanks" role="The Grudge Warlords Community" />
        </div>
      </div>
      <div style={{
        ...panelStyle, marginTop: 16, textAlign: 'center',
      }}>
        <div style={{ color: 'var(--muted)', fontSize: '0.75rem', lineHeight: 1.6 }}>
          Grudge Warlords v1.0<br/>
          &copy; 2026 Grudge Studio. All rights reserved.<br/>
          Inspired by Final Fantasy VII
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

function CreditEntry({ title, role }) {
  return (
    <div>
      <div className="font-cinzel" style={{ color: '#fff', fontSize: '0.9rem' }}>{title}</div>
      <div style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{role}</div>
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
