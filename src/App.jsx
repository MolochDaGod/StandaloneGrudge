import React, { useState, useEffect, useRef } from 'react';
import useGameStore from './stores/gameStore';
import { startPreload, isReady } from './utils/assetManager';

import LoadingScreen from './components/LoadingScreen';
import TitleScreen from './components/TitleScreen';
import CharacterCreate from './components/CharacterCreate';
import WorldMap from './components/WorldMap';
import LocationView from './components/LocationView';
import BattleScreen from './components/BattleScreen';
import CharacterSheet from './components/CharacterSheet';
import SkillTreeView from './components/SkillTreeView';
import HeroCreate from './components/HeroCreate';
import AccountPage from './components/AccountPage';
import LobbyScreen from './components/LobbyScreen';
import TrainingScreen from './components/TrainingScreen';
import LootPopup from './components/LootPopup';
import SettingsMenu from './components/SettingsMenu';
import AdminDashboard from './components/AdminDashboard';
import SceneView from './components/SceneView';
import IntroCinematic from './components/IntroCinematic';
import DiscordAuth from './components/DiscordAuth';
import { InlineIcon } from './data/uiSprites';
import AdminGizmo from './components/AdminGizmo';
import { FrameMaskLayer } from './components/FrameEditor';
import GameTooltipRenderer from './components/GameTooltip';
import GameContextMenuRenderer from './components/GameContextMenu';
import { HERO_CREATE_MODAL } from './constants/layers';
import GameContainer from './components/GameContainer';

const SCREEN_SLUGS = {
  title: '/',
  intro: '/intro',
  lobby: '/war-room',
  create: '/create-character',
  world: '/world-map',
  location: '/location',
  battle: '/battle',
  character: '/character-sheet',
  skills: '/skill-tree',
  heroCreate: '/recruit-hero',
  account: '/account',
  training: '/training',
  scene: '/scene',
};

const SLUG_TO_SCREEN = Object.fromEntries(
  Object.entries(SCREEN_SLUGS).map(([screen, slug]) => [slug, screen])
);

const SAFE_ENTRY_SCREENS = ['title', 'lobby', 'create', 'world', 'account', 'training'];

function getScreenFromPath(pathname) {
  const screen = SLUG_TO_SCREEN[pathname];
  if (!screen) return null;
  if (SAFE_ENTRY_SCREENS.includes(screen)) return screen;
  return null;
}

function GameApp() {
  const screen = useGameStore(s => s.screen);
  const setScreen = useGameStore(s => s.setScreen);
  const gameMessage = useGameStore(s => s.gameMessage);
  const clearMessage = useGameStore(s => s.clearMessage);
  const pendingLoot = useGameStore(s => s.pendingLoot);

  const [ready, setReady] = useState(isReady());
  const [progress, setProgress] = useState({ loaded: 0, total: 1 });
  const prevScreenRef = useRef(screen);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState('fade');
  const [screenShake, setScreenShake] = useState(false);
  const skipPushRef = useRef(false);

  useEffect(() => {
    const path = window.location.pathname;
    const initialScreen = getScreenFromPath(path);
    if (initialScreen && initialScreen !== screen) {
      skipPushRef.current = true;
      setScreen(initialScreen);
    } else if (!initialScreen && path !== '/' && !SLUG_TO_SCREEN[path]) {
      window.history.replaceState(null, '', SCREEN_SLUGS[screen] || '/');
    }
  }, []);

  const SCREEN_TITLES = {
    title: 'Grudge Warlords',
    intro: 'Grudge Warlords — Intro',
    lobby: 'Grudge Warlords — War Room',
    create: 'Grudge Warlords — Create Character',
    world: 'Grudge Warlords — World Map',
    location: 'Grudge Warlords — Location',
    battle: 'Grudge Warlords — Battle',
    character: 'Grudge Warlords — Character Sheet',
    skills: 'Grudge Warlords — Skill Tree',
    heroCreate: 'Grudge Warlords — Recruit Hero',
    account: 'Grudge Warlords — Account',
    training: 'Grudge Warlords — Training',
    scene: 'Grudge Warlords — Scene',
  };

  useEffect(() => {
    const slug = SCREEN_SLUGS[screen];
    document.title = SCREEN_TITLES[screen] || 'Grudge Warlords';
    if (slug && window.location.pathname !== slug) {
      if (skipPushRef.current) {
        skipPushRef.current = false;
        window.history.replaceState({ screen }, '', slug);
      } else {
        window.history.pushState({ screen }, '', slug);
      }
    }
  }, [screen]);

  useEffect(() => {
    const onPopState = (e) => {
      const targetScreen = e.state?.screen || getScreenFromPath(window.location.pathname) || 'title';
      skipPushRef.current = true;
      setScreen(targetScreen);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [setScreen]);

  useEffect(() => {
    if (isReady()) {
      setReady(true);
      return;
    }

    startPreload((loaded, total) => {
      setProgress({ loaded, total });
    }).then(() => {
      setReady(true);
    });
  }, []);

  useEffect(() => {
    const prev = prevScreenRef.current;
    if (screen !== prev) {
      let type = 'fade';
      let duration = 400;
      const needsTransition = true;

      if (screen === 'battle') {
        type = 'battleEntry';
        duration = 600;
      } else if (prev === 'battle') {
        type = 'battleExit';
        duration = 500;
      } else if (prev === 'title' && screen === 'intro') {
        type = 'cinematic';
        duration = 700;
      } else if (prev === 'intro' && screen === 'lobby') {
        type = 'none';
        duration = 50;
      } else if (prev === 'title' && screen === 'lobby') {
        type = 'cinematic';
        duration = 700;
      } else if ((prev === 'create' && screen === 'world') || (prev === 'lobby' && screen === 'world')) {
        type = 'scaleIn';
        duration = 500;
      } else {
        type = 'fade';
        duration = 350;
      }

      if (needsTransition) {
        setTransitionType(type);
        setTransitioning(true);
        const timer = setTimeout(() => setTransitioning(false), duration);
        prevScreenRef.current = screen;
        return () => clearTimeout(timer);
      }
      prevScreenRef.current = screen;
    }
  }, [screen]);

  const shakeKeyRef = useRef(0);
  useEffect(() => {
    const handleShake = () => {
      setScreenShake(false);
      requestAnimationFrame(() => {
        shakeKeyRef.current++;
        setScreenShake(true);
        setTimeout(() => setScreenShake(false), 300);
      });
    };
    window.addEventListener('game-screen-shake', handleShake);
    return () => window.removeEventListener('game-screen-shake', handleShake);
  }, []);

  if (!ready) {
    return (
      <LoadingScreen
        progress={progress.loaded}
        total={progress.total}
        message="Entering the Realm..."
      />
    );
  }

  const showFrame = false;

  const renderScreen = () => {
    switch (screen) {
      case 'title': return <TitleScreen />;
      case 'intro': return <IntroCinematic />;
      case 'lobby': return <LobbyScreen />;
      case 'create': return <CharacterCreate />;
      case 'world': return <WorldMap />;
      case 'location': return <LocationView />;
      case 'battle': return <BattleScreen />;
      case 'character': return <CharacterSheet />;
      case 'skills': return <SkillTreeView />;
      case 'heroCreate': return <HeroCreate />;
      case 'account': return <AccountPage />;
      case 'training': return <TrainingScreen />;
      case 'scene': return <SceneView />;
      default: return <TitleScreen />;
    }
  };

  const getScreenAnimation = () => {
    switch (transitionType) {
      case 'none': return 'none';
      case 'battleEntry': return 'battleEntry 0.6s ease-out both';
      case 'battleExit': return 'cinematicFade 0.5s ease-out both';
      case 'cinematic': return 'cinematicFade 0.7s ease-out both';
      case 'scaleIn': return 'scaleIn 0.5s ease-out both';
      default: return 'fadeIn 0.4s ease both';
    }
  };

  const contentStyle = {
    position: 'relative', zIndex: 10501, width: '100%', height: '100%',
    animation: transitioning ? 'none' : getScreenAnimation(),
    opacity: (transitioning && transitionType !== 'none') ? 0 : undefined,
  };

  const sessionUsername = (() => {
    try {
      const s = JSON.parse(localStorage.getItem('grudge-session') || '{}');
      return s.puterUsername || s.username || (s.type === 'guest' ? 'Guest' : null);
    } catch { return null; }
  })();
  const showUserBadge = sessionUsername && screen !== 'title' && screen !== 'loading';
  const sessionType = (() => {
    try { return JSON.parse(localStorage.getItem('grudge-session') || '{}').type || 'guest'; } catch { return 'guest'; }
  })();

  return (
    <div className={`game-frame${showFrame ? '' : ' hide-frame'}`}>
      <div style={{
        width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
        animation: screenShake ? `screenShake 0.3s ease-out` : 'none',
      }}>
        <div style={contentStyle}>
          {renderScreen()}
        </div>
        {showUserBadge && (
          <div style={{
            position: 'absolute', top: 8, left: 10, zIndex: 10510,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 6, padding: '4px 10px 4px 6px',
            pointerEvents: 'none',
            animation: 'fadeIn 0.5s ease 0.3s both',
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: 3,
              background: sessionType === 'puter'
                ? 'linear-gradient(135deg, #DB6331, #FAAC47)'
                : sessionType === 'discord'
                  ? '#5865F2'
                  : 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.5rem', fontWeight: 800, color: '#fff',
              overflow: 'hidden',
            }}>
              {sessionType === 'puter' ? <img src="/sprites/ui/grudge_logo.png" alt="G" style={{ width: 14, height: 14, objectFit: 'contain' }} /> : sessionType === 'discord' ? 'D' : '\u2022'}
            </div>
            <span style={{
              color: 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: 500,
              fontFamily: "'Jost', sans-serif", letterSpacing: 0.5,
            }}>
              {sessionUsername}
            </span>
          </div>
        )}
        <div id="game-ui-portal" style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 10600,
        }} />
        <FrameMaskLayer />
        <GameTooltipRenderer />
        <GameContextMenuRenderer />
        <SettingsMenu />
        <AdminGizmo />
        {pendingLoot && pendingLoot.length > 0 && <LootPopup />}
        {gameMessage && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: HERO_CREATE_MODAL, animation: 'fadeIn 0.3s ease'
          }} onClick={clearMessage}>
            <div style={{
              background: 'linear-gradient(135deg, #141a2b, #1e293b)',
              border: '2px solid var(--gold)', borderRadius: 16, padding: '30px 50px',
              textAlign: 'center', maxWidth: 400, animation: 'slideUp 0.3s ease'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: 10 }}><InlineIcon name="sparkle" size={24} /></div>
              <div className="font-cinzel" style={{ fontSize: '1.2rem', color: 'var(--gold)', marginBottom: 10 }}>
                {gameMessage}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Click to continue</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const path = window.location.pathname;

  if (path === '/admin') return <AdminDashboard />;
  if (['/adminmap', '/adminbattle', '/adminsprite', '/adminui', '/adminicons', '/adminpvp'].includes(path)) {
    window.location.href = '/admin';
    return null;
  }
  if (path === '/discordauth') return <DiscordAuth />;

  return (
    <GameContainer>
      <GameApp />
    </GameContainer>
  );
}

export { SCREEN_SLUGS };
