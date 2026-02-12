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
import AdminMap from './components/AdminMap';
import AdminBattle from './components/AdminBattle';
import AdminSprite from './components/AdminSprite';
import AdminUI from './components/AdminUI';
import AdminDashboard from './components/AdminDashboard';
import AdminIcons from './components/AdminIcons';
import SceneView from './components/SceneView';
import IntroCinematic from './components/IntroCinematic';
import DiscordAuth from './components/DiscordAuth';
import { InlineIcon } from './data/uiSprites';
import AdminGizmo from './components/AdminGizmo';
import { FrameMaskLayer } from './components/FrameEditor';
import GameTooltipRenderer from './components/GameTooltip';
import GameContextMenuRenderer from './components/GameContextMenu';
import { HERO_CREATE_MODAL } from './constants/layers';

function GameApp() {
  const screen = useGameStore(s => s.screen);
  const gameMessage = useGameStore(s => s.gameMessage);
  const clearMessage = useGameStore(s => s.clearMessage);
  const pendingLoot = useGameStore(s => s.pendingLoot);

  const [ready, setReady] = useState(isReady());
  const [progress, setProgress] = useState({ loaded: 0, total: 1 });
  const prevScreenRef = useRef(screen);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState('fade');
  const [screenShake, setScreenShake] = useState(false);

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
      } else if ((prev === 'title' && screen === 'intro') || (prev === 'intro' && screen === 'lobby') || (prev === 'title' && screen === 'lobby')) {
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

  const fullBleedScreens = ['title', 'world', 'battle', 'intro', 'lobby'];
  const isFullBleed = fullBleedScreens.includes(screen);

  const frameVisibleScreens = ['title', 'create', 'character', 'skills', 'account', 'training', 'heroCreate'];
  const showFrame = frameVisibleScreens.includes(screen);

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
      case 'battleEntry': return 'battleEntry 0.6s ease-out both';
      case 'battleExit': return 'cinematicFade 0.5s ease-out both';
      case 'cinematic': return 'cinematicFade 0.7s ease-out both';
      case 'scaleIn': return 'scaleIn 0.5s ease-out both';
      default: return 'fadeIn 0.4s ease both';
    }
  };

  const contentStyle = isFullBleed ? {
    position: 'relative', zIndex: 10501, width: '100%', height: '100%',
    animation: transitioning ? 'none' : getScreenAnimation(),
    opacity: transitioning ? 0 : undefined,
  } : {
    position: 'absolute', zIndex: 10501,
    top: 'var(--frame-inset-top)',
    left: 'var(--frame-inset-side)',
    right: 'var(--frame-inset-side)',
    bottom: 'var(--frame-inset-bottom)',
    animation: transitioning ? 'none' : getScreenAnimation(),
    opacity: transitioning ? 0 : undefined,
    overflow: 'hidden',
    borderRadius: 2,
  };

  return (
    <div className={`game-frame${showFrame ? '' : ' hide-frame'}`}>
      <div style={{
        width: '100%', height: '100%', position: 'relative', overflow: 'hidden',
        animation: screenShake ? `screenShake 0.3s ease-out` : 'none',
      }}>
        <div style={contentStyle}>
          {renderScreen()}
        </div>
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
  if (path === '/adminmap') return <AdminMap />;
  if (path === '/adminbattle') return <AdminBattle />;
  if (path === '/adminsprite') return <AdminSprite />;
  if (path === '/adminui') return <AdminUI />;
  if (path === '/adminicons') return <AdminIcons />;
  if (path === '/discordauth') return <DiscordAuth />;

  return <GameApp />;
}
