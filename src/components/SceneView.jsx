import React from 'react';
import useGameStore from '../stores/gameStore';
import CampScene from './CampScene';
import DungeonScene from './DungeonScene';
import TradingPostScene from './TradingPostScene';
import OpenFieldScene from './OpenFieldScene';

export default function SceneView() {
  const currentScene = useGameStore(s => s.currentScene);

  switch (currentScene) {
    case 'camp': return <CampScene />;
    case 'dungeon': return <DungeonScene />;
    case 'trading': return <TradingPostScene />;
    case 'field': return <OpenFieldScene />;
    default: return <CampScene />;
  }
}
