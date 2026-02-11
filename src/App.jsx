import React, { useState, useEffect, useRef } from 'react';
import useGameStore from './stores/gameStore';
import { startPreload, isReady } from './utils/assetManager';
import VideoBackground from './components/VideoBackground';
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
import SceneView from './components/SceneView';
import IntroCinematic from './components/IntroCinematic';
import DiscordAuth from './components/DiscordAuth';
import { InlineIcon } from './data/uiSprites';
import AdminGizmo from './components/AdminGizmo';
import { FrameMaskLayer } from './components/FrameEditor';

function GameApp() {
  const screen = useGameStore(s => s.screen);
  const gameMessage = useGameStore(s => s.gameMessage);
  const clearMessage = useGameStore(s => s.clearMessage);
  const pendingLoot = useGameStore(s => s.pendingLoot);

  const [ready, setReady] = useState(isReady());
  const [progress, setProgress] = useState({ loaded: 0, total: 1 });
  const prevScreenRef = useRef(screen);
  const [transitioning, setTransitioning] = useState(false);

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
      const needsTransition = (
        (prev === 'title' && screen === 'intro') ||
        (prev === 'intro' && screen === 'lobby') ||
        (prev === 'title' && screen === 'lobby') ||
        (prev === 'lobby' && screen === 'create') ||
        (prev === 'title' && screen === 'create') ||
        (prev === 'create' && screen === 'world') ||
        (prev === 'lobby' && screen === 'world') ||
        (screen === 'battle') ||
        (prev === 'battle' && (screen === 'world' || screen === 'location'))
      );
      if (needsTransition) {
        setTransitioning(true);
        const timer = setTimeout(() => setTransitioning(false), 300);
        prevScreenRef.current = screen;
        return () => clearTimeout(timer);
      }
      prevScreenRef.current = screen;
    }
  }, [screen]);

  if (!ready) {
    return (
      <LoadingScreen
        progress={progress.loaded}
        total={progress.total}
        message="Entering the Realm..."
      />
    );
  }

  const screensWithOwnBackground = ['world', 'battle', 'location', 'scene', 'intro'];
  const bgVisible = !screensWithOwnBackground.includes(screen);
  const bgBlurred = screen !== 'title' && screen !== 'lobby' && screen !== 'intro';

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

  return (
    <div className="game-frame">
      <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
        <VideoBackground blurred={bgBlurred} visible={bgVisible} />
        <div style={{
          position: 'relative', zIndex: 1, width: '100%', height: '100%',
          opacity: transitioning ? 0 : 1,
          transition: 'opacity 0.3s ease',
          animation: 'fadeIn 0.5s ease'
        }}>
          {renderScreen()}
        </div>
        <FrameMaskLayer />
        <SettingsMenu />
        <AdminGizmo />
        {pendingLoot && pendingLoot.length > 0 && <LootPopup />}
        {gameMessage && (
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9999, animation: 'fadeIn 0.3s ease'
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

  if (path === '/adminmap') return <AdminMap />;
  if (path === '/adminbattle') return <AdminBattle />;
  if (path === '/adminsprite') return <AdminSprite />;
  if (path === '/discordauth') return <DiscordAuth />;

  return <GameApp />;
}
