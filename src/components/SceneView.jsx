import React from 'react';
import useGameStore from '../stores/gameStore';
import CampScene from './CampScene';
import DungeonScene from './DungeonScene';
import TradingPostScene from './TradingPostScene';
import OpenFieldScene from './OpenFieldScene';
import PortalScene from './PortalScene';
import BossWalkupScene from './BossWalkupScene';
import AirshipScene from './AirshipScene';
import HomeIslandScene from './HomeIslandScene';

export default function SceneView() {
  const currentScene = useGameStore(s => s.currentScene);

  switch (currentScene) {
    case 'camp': return <CampScene />;
    case 'dungeon': return <DungeonScene />;
    case 'trading': return <TradingPostScene />;
    case 'field': return <OpenFieldScene />;
    case 'portal': return <PortalScene />;
    case 'boss_walkup': return <BossWalkupScene />;
    case 'airship': return <AirshipScene />;
    case 'island': return <HomeIslandScene />;
    default: return <CampScene />;
  }
}
