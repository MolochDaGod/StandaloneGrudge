import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import { InlineIcon, EssentialIcon } from '../data/uiSprites';
import SpriteAnimation from './SpriteAnimation';
import { getRaceClassSprite, worgTransformSprite, effectSprites } from '../data/spriteMap';
import { raceDefinitions } from '../data/races';
import { classDefinitions } from '../data/classes';
import {
  setBgm, getMusicMuted, setMusicMuted, getSfxMuted, setSfxMuted,
} from '../utils/audioManager';
import GrudgeOnlinePage from './GrudgeOnlinePage';

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
  const [isMuted, setIsMuted] = useState(() => getMusicMuted() && getSfxMuted());

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

  const handleMuteToggle = () => {
    const next = !isMuted;
    setIsMuted(next);
    setMusicMuted(next);
    setSfxMuted(next);
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
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/backgrounds/tavern_bg.png)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        zIndex: 0,
      }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 0 }} />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 24px',
        background: 'rgba(0,0,0,0.6)',
        borderBottom: '1px solid rgba(110,231,183,0.1)',
        position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="font-cinzel" style={{
            fontSize: '1.2rem',
            background: 'linear-gradient(90deg, #6ee7b7 0%, #ffd700 30%, #fff 50%, #ffd700 70%, #6ee7b7 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'titleShimmer 8s linear infinite',
          }}>
            GRUDGE WARLORDS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => window.dispatchEvent(new Event('toggleSettings'))} style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '4px 14px',
            color: 'var(--muted)', fontSize: '0.75rem',
            cursor: 'pointer', fontFamily: "'Cinzel', serif",
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s',
          }}>
            <EssentialIcon name="Gear" size={14} />
            SETTINGS
          </button>
          <button onClick={handleMuteToggle} style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 6, padding: '4px 12px',
            color: isMuted ? '#ef4444' : 'var(--muted)', fontSize: '0.75rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            transition: 'all 0.2s',
          }} title={isMuted ? 'Unmute' : 'Mute'}>
            <EssentialIcon name={isMuted ? 'SpeakerMute' : 'SpeakerOn'} size={14} />
          </button>
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
        position: 'relative', zIndex: 1,
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
        position: 'relative',
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 20px',
        background: active ? 'rgba(110,231,183,0.1)' : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
        border: 'none',
        borderLeft: active ? '3px solid var(--accent)' : '3px solid transparent',
        color: active ? 'var(--accent)' : hovered ? '#ccc' : 'var(--muted)',
        fontSize: '0.75rem',
        fontFamily: "'Cinzel', serif",
        letterSpacing: 2,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        width: '100%',
        textAlign: 'left',
        transform: hovered && !active ? 'translateX(3px)' : 'translateX(0)',
        boxShadow: active ? 'inset 4px 0 12px rgba(110,231,183,0.1)' : 'none',
      }}
    >
      <EssentialIcon name={essentialIcon} size={16} />
      {label}
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
          borderColor="rgba(139,55,46,0.3)"
          bgImage="/backgrounds/shadow_citadel.png"
          tagColor="rgba(139,55,46,0.7)"
          tag="WEB3"
          titleColor="#8B372E"
          title="Wallet"
          subtitle={<>GBUX &bull; SOL &bull; Coming Soon</>}
          cardStyle={cardStyle}
          disabled
        />
      </div>

      <HeroSlideshow />

      {showInfo && <GrudgeOnlinePage onClose={() => setShowInfo(false)} />}
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
  warrior: '/sprites/ui/icons/icon_crossed_swords.png',
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
  human_warrior: '/icons/pack/misc/Human_Warrior.png',
  human_mage: '/icons/pack/misc/human_mage.png',
  human_worge: '/icons/pack/misc/human_paladin.png',
  human_ranger: '/icons/pack/misc/human_archer.png',
  orc_warrior: '/icons/pack/misc/orc_warrior.png',
  orc_mage: '/icons/pack/misc/orc_mage.png',
  orc_worge: '/icons/pack/misc/orc_paladin.png',
  orc_ranger: '/icons/pack/misc/orc_archer.png',
  elf_warrior: '/icons/pack/misc/elf_warrior.png',
  elf_mage: '/icons/pack/misc/elf_mage.png',
  elf_worge: '/icons/pack/misc/elf_paladin.png',
  elf_ranger: '/icons/pack/misc/elf_archer.png',
  undead_warrior: '/icons/pack/misc/undead_warrior.png',
  undead_mage: '/icons/pack/misc/undead_mage.png',
  undead_worge: '/icons/pack/misc/undead_paladin.png',
  undead_ranger: '/icons/pack/misc/undead_archer.png',
  barbarian_warrior: '/icons/pack/misc/barb_warrior.png',
  barbarian_mage: '/icons/pack/misc/barbarian_Mage.png',
  barbarian_worge: '/icons/pack/misc/barb_paladin.png',
  barbarian_ranger: '/icons/pack/misc/barb_archer.png',
  dwarf_warrior: '/icons/pack/misc/dwarf_warrior.png',
  dwarf_mage: '/icons/pack/misc/dwarf_mage.png',
  dwarf_worge: '/icons/pack/misc/dwarf_paladin.png',
  dwarf_ranger: '/icons/pack/misc/dwarf_archer.png',
};

const FACTION_MAP = {
  human: { name: 'Crusade', god: 'Odin', color: '#fbbf24', icon: '/icons/pack/factions/crusade-emblem.png' },
  barbarian: { name: 'Crusade', god: 'Odin', color: '#fbbf24', icon: '/icons/pack/factions/crusade-emblem.png' },
  orc: { name: 'Legion', god: 'Madra', color: '#ef4444', icon: '/icons/pack/factions/legion-emblem.png' },
  undead: { name: 'Legion', god: 'Madra', color: '#ef4444', icon: '/icons/pack/factions/legion-emblem.png' },
  elf: { name: 'Fabled', god: 'The Omni', color: '#22d3ee', icon: '/icons/pack/factions/fabled-emblem.png' },
  dwarf: { name: 'Fabled', god: 'The Omni', color: '#22d3ee', icon: '/icons/pack/factions/fabled-emblem.png' },
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
  const dW = aspect >= 1 ? displaySize : displaySize * aspect;
  const dH = aspect >= 1 ? displaySize / aspect : displaySize;
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
        backgroundSize: `${cols * dW}px ${rows * dH}px`,
        backgroundPosition: `-${col * dW}px -${row * dH}px`,
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
      setProjX(65);
      let x = 65;
      const moveInterval = setInterval(() => {
        x -= 2.5;
        setProjX(x);
        if (x <= 10) {
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
          transform: 'translate(-50%, -50%) scaleX(-1)',
          zIndex: 8, mixBlendMode: 'screen', opacity: 0.95,
        }}>
          <SlideshowVFXSprite effectKey={combo.projectile} displaySize={120} />
        </div>
      )}
      {(phase === 'effect' || phase === 'impact' || phase === 'effect2') && (
        <div style={{
          position: 'absolute',
          left: combo.projectile ? '10%' : '65%', top: '45%',
          transform: 'translate(-50%, -50%)',
          zIndex: 8, mixBlendMode: 'screen', opacity: 0.95,
        }}>
          <SlideshowVFXSprite effectKey={combo.effect} displaySize={280} />
        </div>
      )}
      {(phase === 'impact' || phase === 'effect2') && (
        <div style={{
          position: 'absolute',
          left: combo.projectile ? '10%' : '65%', top: '45%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9, mixBlendMode: 'screen', opacity: 0.9,
        }}>
          <SlideshowVFXSprite effectKey={combo.impact} displaySize={200} />
        </div>
      )}
      {phase === 'effect2' && combo.effect2 && (
        <div style={{
          position: 'absolute',
          left: combo.projectile ? '10%' : '65%', top: '45%',
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
      right: '8%', top: '50%',
      transform: 'translateY(-50%)',
      zIndex: 12,
      opacity: visible ? 1 : 0,
      animation: visible ? 'bubblePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
      pointerEvents: 'none',
    }}>
      <div style={{
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(15,10,30,0.92) 0%, rgba(30,20,50,0.95) 100%)',
        border: `1px solid ${glowColor}55`,
        borderRadius: 4,
        padding: '12px 18px',
        maxWidth: 220,
        minWidth: 140,
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
  const [textVisible, setTextVisible] = useState(false);
  const [auraIntensity, setAuraIntensity] = useState(0);
  const [spriteX, setSpriteX] = useState(-30);
  const [spriteY, setSpriteY] = useState(0);
  const [spriteRotation, setSpriteRotation] = useState(0);
  const [showBubble, setShowBubble] = useState(false);

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

  const SPRITE_SCALE_OVERRIDES = {
    undead_warrior: 2,
    human_warrior: 2,
    undead_ranger: 0.75,
    dwarf_worge: 0.5,
  };
  const SPRITE_Y_OFFSETS = {
    human_mage: 30,
    undead_warrior: 60,
    human_warrior: 110,
    human_worge: 0,
    orc_mage: 20,
    orc_worge: 50,
    orc_ranger: 70,
  };
  const SPRITE_X_OFFSETS = {
    human_warrior: -30,
    orc_mage: -70,
    orc_ranger: -30,
    elf_mage: -30,
  };
  const comboKey = `${combo.raceId}_${combo.classId}`;
  const savedPos = loadSpritePosition(comboKey);
  const spriteYOffset = savedPos ? savedPos.y : (SPRITE_Y_OFFSETS[comboKey] || 0);
  const spriteXOffset = savedPos ? savedPos.x : (SPRITE_X_OFFSETS[comboKey] || 0);
  const scaleOverride = savedPos ? savedPos.scale : (SPRITE_SCALE_OVERRIDES[comboKey] || null);

  const targetHeight = 240;
  const spriteFrameH = spriteData?.frameHeight || 100;
  const baseScale = Math.min(Math.max(targetHeight / spriteFrameH, 1.5), 5);
  const spriteScale = scaleOverride ? baseScale * scaleOverride : baseScale;
  const transformFrameH = worgeTransformData?.frameHeight || 100;
  const transformScale = (spriteFrameH * spriteScale) / transformFrameH;

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
      setShowBubble(false);
      return;
    }
    clearTimers();
    setPhase('enter');
    setTextVisible(false);
    setShowVfx(false);
    setShowTransform(false);
    setShowBubble(false);
    setAuraIntensity(0);
    setSpriteX(-30);
    setSpriteY(0);
    setSpriteRotation(0);

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
        addTimer(() => setShowVfx(true), 150);
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
        addTimer(() => setShowVfx(true), 200);
      }, walkDuration + 800);

      addTimer(() => {
        setAnim('idle');
        setShowVfx(false);
      }, walkDuration + 800 + attackDuration + 200);

      addTimer(() => {
        setShowBubble(true);
      }, walkDuration + 800 + attackDuration + 400);

      if (isWorge) {
        const transformAttacks = ATTACK_ANIMS.filter(a => worgeTransformData?.[a]);
        const tAtk = transformAttacks.length > 0
          ? transformAttacks[Math.floor(Math.random() * transformAttacks.length)]
          : 'attack1';
        const tAtkFrames = worgeTransformData?.[tAtk]?.frames || 8;
        const tAtkDuration = tAtkFrames * 80;

        addTimer(() => {
          setShowBubble(false);
          setShowTransform(true);
          setAnim('idle');
          setTransformAnim('idle');
          setShowVfx(false);
        }, walkDuration + 800 + attackDuration + 1400);

        addTimer(() => {
          setTransformAnim(tAtk);
          addTimer(() => setShowVfx(true), 200);
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
            display: 'flex', alignItems: 'center', gap: 5,
            animation: 'ssSlideInLeft 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: `radial-gradient(circle, ${race.color}44, rgba(0,0,0,0.7))`,
              border: `2px solid ${race.color}88`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 14px ${race.color}44`,
              overflow: 'hidden',
            }}>
              <img src={RACE_CLASS_PORTRAIT_MAP[`${combo.raceId}_${combo.classId}`]} alt={race.name} style={{
                width: 38, height: 38, objectFit: 'cover', borderRadius: '50%',
              }} />
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 5,
              background: `radial-gradient(circle, ${faction.color}33, rgba(0,0,0,0.6))`,
              border: `2px solid ${faction.color}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 10px ${faction.color}33`,
              overflow: 'hidden',
            }}>
              <img src={faction.icon} alt={faction.name} style={{
                width: 28, height: 28, objectFit: 'contain', filter: 'brightness(1.2)',
              }} />
            </div>
            <div style={{
              width: 36, height: 36, borderRadius: 5,
              background: `radial-gradient(circle, ${auraColor}33, rgba(0,0,0,0.6))`,
              border: `2px solid ${auraColor}66`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 0 10px ${auraColor}33`,
              overflow: 'hidden',
            }}>
              <img src={CLASS_ICON_MAP[combo.classId]} alt={cls.name} style={{
                width: 28, height: 28, objectFit: 'contain',
                imageRendering: 'pixelated',
                filter: 'brightness(1.3)',
              }} />
            </div>
          </div>
        )}

        {textVisible && (
          <div style={{
            position: 'absolute', top: '15%', left: '50%',
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
              marginTop: 6, fontStyle: 'italic',
              textShadow: '0 1px 4px rgba(0,0,0,0.9)',
              maxWidth: 350, margin: '6px auto 0',
              lineHeight: 1.4,
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
                  opacity: showTransform ? 0 : 1,
                  transform: showTransform ? 'scale(0.6)' : 'scale(1)',
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
          </div>
        </div>

        <ChatBubble text={slogan} visible={showBubble} auraColor={auraColor} />

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 9,
          padding: '0 16px 8px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7) 40%)',
        }}>
          <div style={{
            display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 6, flexWrap: 'wrap',
            opacity: textVisible ? 1 : 0,
            transform: textVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.6s ease 0.2s',
          }}>
            <span style={{
              fontSize: '0.55rem', padding: '2px 10px', borderRadius: 20,
              background: `${race.color}22`, color: race.color,
              border: `1px solid ${race.color}44`,
            }}>
              {race.trait}
            </span>
            <span style={{
              fontSize: '0.55rem', padding: '2px 10px', borderRadius: 20,
              background: `${cls.color}22`, color: cls.color,
              border: `1px solid ${cls.color}44`,
            }}>
              {cls.name}
            </span>
            <span style={{
              fontSize: '0.5rem', padding: '2px 10px', borderRadius: 20,
              background: `${faction.color}15`, color: faction.color,
              border: `1px solid ${faction.color}33`,
            }}>
              {faction.name} &bull; {faction.god}
            </span>
          </div>

          <div style={{
            display: 'flex', justifyContent: 'center', gap: 3,
          }}>
            {ALL_COMBOS.map((c, i) => {
              const r = raceDefinitions[c.raceId];
              return (
                <div key={i} style={{
                  width: i === index ? 14 : 4, height: 4, borderRadius: 2,
                  background: i === index ? r.color : 'rgba(255,255,255,0.12)',
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
        @keyframes bubblePop {
          0% { transform: translateY(-50%) scale(0.3); opacity: 0; }
          60% { transform: translateY(-50%) scale(1.05); }
          100% { transform: translateY(-50%) scale(1); opacity: 1; }
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
