import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import useGameStore from '../stores/gameStore';
import { InlineIcon, EssentialIcon } from '../data/uiSprites';
import SpriteAnimation from './SpriteAnimation';
import { getRaceClassSprite, worgTransformSprite, effectSprites } from '../data/spriteMap';
import { raceDefinitions } from '../data/races';
import { classDefinitions } from '../data/classes';
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
    <div>
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

      <HeroSlideshow />
    </div>
  );
}

const ALL_COMBOS = Object.keys(raceDefinitions).flatMap(raceId =>
  Object.keys(classDefinitions).map(classId => ({ raceId, classId }))
);

const ATTACK_ANIMS = ['attack1', 'attack2', 'attack3'];

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

const CLASS_DESCRIPTIONS = {
  warrior: 'Frontline powerhouse with devastating physical attacks. Wields swords and shields with lethal precision. Signature: Invincible — absorbs all damage.',
  mage: 'Arcane scholar channeling destructive spells and divine healing. Masters fire, ice, and holy magic. Signature: Mana Shield — converts magic to armor.',
  worge: 'Dual-natured shapeshifter. Casts storm and root magic in human form, then transforms into a savage beast. Signature: Bear Form — permanent transformation.',
  ranger: 'Deadly marksman with precise long-range attacks and crippling poison. Masters of evasion and critical strikes. Signature: Focus — stacking crit mastery.',
};

function SlideshowVFX({ effectKey, playing }) {
  const [frame, setFrame] = useState(0);
  const sprite = effectSprites[effectKey];

  const hasCustomLayout = sprite ? sprite.cols !== undefined : false;
  const cols = hasCustomLayout ? sprite.cols : (sprite ? Math.round(Math.sqrt(sprite.frames)) : 1);
  const frameW = hasCustomLayout ? sprite.frameW : (sprite ? (sprite.size / cols) : 100);
  const frameH = hasCustomLayout ? sprite.frameH : (sprite ? (sprite.size / cols) : 100);
  const totalFrames = sprite ? sprite.frames : 1;

  useEffect(() => {
    if (!playing || !sprite) return;
    let f = 0;
    setFrame(0);
    const interval = setInterval(() => {
      f++;
      if (f >= totalFrames) { clearInterval(interval); return; }
      setFrame(f);
    }, 40);
    return () => clearInterval(interval);
  }, [playing, effectKey, totalFrames]);

  if (!sprite || !playing) return null;

  const displaySize = 200;
  const scaleX = displaySize / frameW;
  const scaleY = displaySize / frameH;
  const col = frame % cols;
  const row = Math.floor(frame / cols);

  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -55%)',
      width: displaySize, height: displaySize,
      overflow: 'hidden', pointerEvents: 'none',
      zIndex: 5, mixBlendMode: 'screen', opacity: 0.9,
    }}>
      <div style={{
        width: displaySize, height: displaySize,
        backgroundImage: `url(${sprite.src})`,
        backgroundSize: `${cols * frameW * scaleX}px ${(sprite.rows || Math.ceil(totalFrames / cols)) * frameH * scaleY}px`,
        backgroundPosition: `-${col * displaySize}px -${row * displaySize}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
      }} />
    </div>
  );
}

function HeroSlideshow() {
  const [index, setIndex] = useState(0);
  const [anim, setAnim] = useState('idle');
  const [phase, setPhase] = useState('enter');
  const [bgIndex, setBgIndex] = useState(0);
  const [prevBgIndex, setPrevBgIndex] = useState(0);
  const [bgFade, setBgFade] = useState(1);
  const [showVfx, setShowVfx] = useState(false);
  const [showTransform, setShowTransform] = useState(false);
  const [transformAnim, setTransformAnim] = useState('idle');
  const [textVisible, setTextVisible] = useState(false);
  const [auraIntensity, setAuraIntensity] = useState(0);
  const attackRef = useRef('attack1');
  const timerRefs = useRef([]);

  const combo = ALL_COMBOS[index];
  const race = raceDefinitions[combo.raceId];
  const cls = classDefinitions[combo.classId];
  const spriteData = getRaceClassSprite(combo.raceId, combo.classId);
  const isWorge = combo.classId === 'worge';
  const classEffect = CLASS_EFFECTS[combo.classId] || CLASS_EFFECTS.warrior;

  const worgeTransformData = isWorge ? worgTransformSprite[combo.raceId] : null;

  const clearTimers = () => {
    timerRefs.current.forEach(t => clearTimeout(t));
    timerRefs.current = [];
  };
  const addTimer = (fn, ms) => {
    const t = setTimeout(fn, ms);
    timerRefs.current.push(t);
    return t;
  };

  useEffect(() => {
    clearTimers();
    setPhase('enter');
    setTextVisible(false);
    setShowVfx(false);
    setShowTransform(false);
    setAuraIntensity(0);

    const availableAttacks = ATTACK_ANIMS.filter(a => spriteData?.[a]);
    const chosen = availableAttacks.length > 0
      ? availableAttacks[Math.floor(Math.random() * availableAttacks.length)]
      : 'idle';
    attackRef.current = chosen;
    setAnim(chosen);

    setPrevBgIndex(bgIndex);
    const newBg = (bgIndex + 1 + Math.floor(Math.random() * (BATTLE_BGS.length - 1))) % BATTLE_BGS.length;
    setBgIndex(newBg);
    setBgFade(0);

    addTimer(() => setBgFade(1), 50);
    addTimer(() => setTextVisible(true), 200);
    addTimer(() => setAuraIntensity(1), 300);

    const attackFrames = spriteData?.[chosen]?.frames || 8;
    const attackSpeed = 80;
    const attackDuration = attackFrames * attackSpeed;

    addTimer(() => setShowVfx(true), Math.min(400, attackDuration * 0.3));

    if (isWorge) {
      addTimer(() => {
        setShowTransform(true);
        setAnim('idle');
        const transformAttacks = ATTACK_ANIMS.filter(a => worgeTransformData?.[a]);
        const tAtk = transformAttacks.length > 0
          ? transformAttacks[Math.floor(Math.random() * transformAttacks.length)]
          : 'idle';
        setTransformAnim(tAtk);
        setShowVfx(false);
        addTimer(() => setShowVfx(true), 200);
      }, Math.min(attackDuration + 200, 2000));

      addTimer(() => {
        setTransformAnim('idle');
        setShowVfx(false);
      }, 3200);

      addTimer(() => {
        setPhase('exit');
        addTimer(() => {
          setIndex(prev => (prev + 1) % ALL_COMBOS.length);
          setShowTransform(false);
        }, 500);
      }, 4500);
    } else {
      const idleAt = attackDuration + 200;
      addTimer(() => {
        setAnim('idle');
        setShowVfx(false);
      }, idleAt);

      addTimer(() => {
        setPhase('exit');
        addTimer(() => setIndex(prev => (prev + 1) % ALL_COMBOS.length), 500);
      }, Math.max(idleAt + 1500, 4200));
    }

    return clearTimers;
  }, [index]);

  const abilities = cls.abilities?.slice(0, 3) || [];

  return (
    <div style={{
      marginTop: 16, position: 'relative', overflow: 'hidden',
      borderRadius: 12, height: 380,
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${BATTLE_BGS[prevBgIndex]})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${BATTLE_BGS[bgIndex]})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        zIndex: 1,
        opacity: bgFade,
        transition: 'opacity 1.2s ease-in-out',
      }} />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.75) 100%)',
      }} />

      <div style={{
        position: 'absolute', inset: 0, zIndex: 3,
        display: 'flex', flexDirection: 'column',
        opacity: phase === 'exit' ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}>
        <div style={{
          textAlign: 'center', padding: '18px 20px 0',
          opacity: textVisible ? 1 : 0,
          transform: textVisible ? 'translateY(0)' : 'translateY(-15px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}>
          <div className="font-cinzel" style={{
            fontSize: '1.5rem', fontWeight: 700,
            background: `linear-gradient(135deg, ${race.color}, ${cls.color})`,
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            letterSpacing: 3,
          }}>
            {race.name} {cls.name}
          </div>
        </div>

        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute',
            width: 300, height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${classEffect.aura}33 0%, ${classEffect.aura}15 30%, transparent 65%)`,
            opacity: auraIntensity,
            transition: 'opacity 0.8s ease',
            animation: auraIntensity > 0 ? 'auraPulse 2s ease-in-out infinite' : 'none',
            zIndex: 1,
          }} />
          <div style={{
            position: 'absolute',
            width: 200, height: 200,
            borderRadius: '50%',
            border: `1px solid ${classEffect.aura}22`,
            opacity: auraIntensity * 0.5,
            animation: auraIntensity > 0 ? 'auraRing 3s linear infinite' : 'none',
            zIndex: 1,
          }} />

          <div style={{
            position: 'relative', zIndex: 3,
            opacity: showTransform ? 0 : 1,
            transform: showTransform ? 'scale(0.6)' : 'scale(1)',
            transition: 'all 0.4s ease',
          }}>
            <SpriteAnimation
              spriteData={spriteData}
              animation={anim}
              scale={5}
              loop={anim === 'idle'}
              speed={anim === 'idle' ? 140 : 80}
              onAnimationEnd={anim !== 'idle' ? () => setAnim('idle') : null}
            />
          </div>

          {isWorge && showTransform && worgeTransformData && (
            <div style={{
              position: 'absolute', zIndex: 4,
              animation: 'transformFlash 0.4s ease-out',
            }}>
              <SpriteAnimation
                spriteData={worgeTransformData}
                animation={transformAnim}
                scale={5}
                loop={transformAnim === 'idle'}
                speed={transformAnim === 'idle' ? 140 : 80}
                onAnimationEnd={transformAnim !== 'idle' ? () => setTransformAnim('idle') : null}
              />
            </div>
          )}

          <SlideshowVFX effectKey={classEffect.effectKey} playing={showVfx} />
        </div>

        <div style={{
          padding: '0 20px 14px',
          opacity: textVisible ? 1 : 0,
          transform: textVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
        }}>
          <div style={{
            display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 8, flexWrap: 'wrap',
          }}>
            <span style={{
              fontSize: '0.6rem', padding: '2px 10px', borderRadius: 20,
              background: `${race.color}22`, color: race.color,
              border: `1px solid ${race.color}44`,
              backdropFilter: 'blur(4px)',
            }}>
              {race.trait}
            </span>
            <span style={{
              fontSize: '0.6rem', padding: '2px 10px', borderRadius: 20,
              background: `${cls.color}22`, color: cls.color,
              border: `1px solid ${cls.color}44`,
              backdropFilter: 'blur(4px)',
            }}>
              {cls.name}
            </span>
            <span style={{
              fontSize: '0.55rem', padding: '2px 10px', borderRadius: 20,
              background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              {race.passive}
            </span>
          </div>

          <div style={{
            fontSize: '0.65rem', color: 'rgba(255,255,255,0.55)', textAlign: 'center',
            lineHeight: 1.5, maxWidth: 500, margin: '0 auto 8px',
          }}>
            {CLASS_DESCRIPTIONS[combo.classId] || cls.description}
          </div>

          <div style={{
            display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap',
          }}>
            {abilities.map((ab, i) => (
              <span key={ab.id} style={{
                fontSize: '0.55rem', padding: '1px 8px', borderRadius: 4,
                background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.45)',
                border: `1px solid ${cls.color}33`,
                opacity: textVisible ? 1 : 0,
                transform: textVisible ? 'translateY(0)' : 'translateY(10px)',
                transition: `all 0.5s ease ${0.3 + i * 0.1}s`,
              }}>
                {ab.name}
              </span>
            ))}
          </div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'center', gap: 3, padding: '0 20px 10px',
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

      <style>{`
        @keyframes auraPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 1; }
        }
        @keyframes auraRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes transformFlash {
          0% { opacity: 0; transform: scale(1.3); filter: brightness(3); }
          50% { opacity: 1; filter: brightness(1.5); }
          100% { opacity: 1; transform: scale(1); filter: brightness(1); }
        }
      `}</style>
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
