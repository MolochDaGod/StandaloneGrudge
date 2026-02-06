import React, { useState, useEffect, useRef } from 'react';
import useGameStore from './stores/gameStore';
import VideoBackground from './components/VideoBackground';
import LoadingScreen from './components/LoadingScreen';
import TitleScreen from './components/TitleScreen';
import CharacterCreate from './components/CharacterCreate';
import WorldMap from './components/WorldMap';
import LocationView from './components/LocationView';
import BattleScreen from './components/BattleScreen';
import CharacterSheet from './components/CharacterSheet';
import SkillTreeView from './components/SkillTreeView';

let appHasLoaded = false;

export default function App() {
  const screen = useGameStore(s => s.screen);
  const gameMessage = useGameStore(s => s.gameMessage);
  const clearMessage = useGameStore(s => s.clearMessage);
  const [loading, setLoading] = useState(!appHasLoaded);
  const [transitioning, setTransitioning] = useState(false);
  const prevScreenRef = useRef(screen);

  useEffect(() => {
    if (!appHasLoaded) {
      appHasLoaded = true;
      const timer = setTimeout(() => setLoading(false), 2200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const prev = prevScreenRef.current;
    if (screen !== prev) {
      const needsTransition = (
        (prev === 'title' && screen === 'create') ||
        (prev === 'create' && screen === 'world') ||
        (screen === 'battle') ||
        (prev === 'battle' && (screen === 'world' || screen === 'location'))
      );
      if (needsTransition) {
        setTransitioning(true);
        const timer = setTimeout(() => setTransitioning(false), 600);
        prevScreenRef.current = screen;
        return () => clearTimeout(timer);
      }
      prevScreenRef.current = screen;
    }
  }, [screen]);

  const bgBlurred = screen !== 'title';

  const renderScreen = () => {
    switch (screen) {
      case 'title': return <TitleScreen />;
      case 'create': return <CharacterCreate />;
      case 'world': return <WorldMap />;
      case 'location': return <LocationView />;
      case 'battle': return <BattleScreen />;
      case 'character': return <CharacterSheet />;
      case 'skills': return <SkillTreeView />;
      default: return <TitleScreen />;
    }
  };

  if (loading) {
    return <LoadingScreen message="Entering the Realm..." />;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <VideoBackground blurred={bgBlurred} />
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', height: '100%',
        opacity: transitioning ? 0 : 1,
        transition: 'opacity 0.3s ease'
      }}>
        {renderScreen()}
      </div>
      {gameMessage && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, animation: 'fadeIn 0.3s ease'
        }} onClick={clearMessage}>
          <div style={{
            background: 'linear-gradient(135deg, #141a2b, #1e293b)',
            border: '2px solid var(--gold)', borderRadius: 16, padding: '30px 50px',
            textAlign: 'center', maxWidth: 400, animation: 'slideUp 0.3s ease'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 10 }}>🎉</div>
            <div className="font-cinzel" style={{ fontSize: '1.2rem', color: 'var(--gold)', marginBottom: 10 }}>
              {gameMessage}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Click to continue</div>
          </div>
        </div>
      )}
    </div>
  );
}
