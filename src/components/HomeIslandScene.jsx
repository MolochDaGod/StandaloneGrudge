import React, { useRef, useEffect, useState, useCallback } from 'react';
import useGameStore from '../stores/gameStore';
import SpriteAnimation from './SpriteAnimation';
import { getPlayerSprite } from '../data/spriteMap';
import { setBgm } from '../utils/audioManager';
import IslandSidebar from './IslandSidebar';
import { SCENE } from '../constants/layers';

const GRID = 4; // pixels per terrain cell on canvas
const ISLAND_W = 140;
const ISLAND_H = 110;
const CANVAS_W = ISLAND_W * GRID;
const CANVAS_H = ISLAND_H * GRID;

const TERRAIN_COLORS = [
  '#1a4d7a', // 0 water
  '#f4e4c1', // 1 beach
  '#5fa354', // 2 grass
  '#2d5016', // 3 forest
  '#696969', // 4 mountain
];

const BUILDING_META = {
  camp:     { emoji: '⛺', label: 'Camp',       color: '#ff6b35', size: 2 },
  mine:     { emoji: '⛏️', label: 'Mine',       color: '#888888', size: 1 },
  lumber:   { emoji: '🪓', label: 'Lumber Mill', color: '#8b4513', size: 1 },
  herb:     { emoji: '🌿', label: 'Herb Garden', color: '#4ade80', size: 1 },
  kitchen:  { emoji: '🍳', label: 'Kitchen',     color: '#ffdd00', size: 1 },
  workshop: { emoji: '🔧', label: 'Workshop',    color: '#a78bfa', size: 1 },
  farm:     { emoji: '🌾', label: 'Farm',        color: '#f59e0b', size: 1 },
};

export default function HomeIslandScene() {
  useEffect(() => { setBgm('camp'); }, []);

  const exitScene = useGameStore(s => s.exitScene);
  const islandTerrain = useGameStore(s => s.islandTerrain);
  const islandBuildings = useGameStore(s => s.islandBuildings);
  const islandHeroes = useGameStore(s => s.islandHeroes);
  const islandResources = useGameStore(s => s.islandResources);
  const heroRoster = useGameStore(s => s.heroRoster);
  const generateIslandTerrain = useGameStore(s => s.generateIslandTerrain);
  const placeIslandBuilding = useGameStore(s => s.placeIslandBuilding);
  const tickIslandHarvests = useGameStore(s => s.tickIslandHarvests);
  const collectIslandResources = useGameStore(s => s.collectIslandResources);

  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [selectedBuildingType, setSelectedBuildingType] = useState(null);
  const [hoverCell, setHoverCell] = useState(null);
  const [notification, setNotification] = useState(null);
  const panRef = useRef({ dragging: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });

  // Generate terrain once
  const terrain = islandTerrain || generateIslandTerrain(42);

  // Tick harvests
  useEffect(() => {
    const interval = setInterval(() => tickIslandHarvests(), 1000);
    return () => clearInterval(interval);
  }, []);

  // Draw terrain + buildings on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !terrain) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    // Terrain
    for (let y = 0; y < ISLAND_H; y++) {
      for (let x = 0; x < ISLAND_W; x++) {
        ctx.fillStyle = TERRAIN_COLORS[terrain[y]?.[x] || 0];
        ctx.fillRect(x * GRID, y * GRID, GRID, GRID);
      }
    }

    // Grid overlay (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= ISLAND_W; x += 4) {
      ctx.beginPath();
      ctx.moveTo(x * GRID, 0);
      ctx.lineTo(x * GRID, CANVAS_H);
      ctx.stroke();
    }
    for (let y = 0; y <= ISLAND_H; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y * GRID);
      ctx.lineTo(CANVAS_W, y * GRID);
      ctx.stroke();
    }

    // Buildings
    islandBuildings.forEach(b => {
      const meta = BUILDING_META[b.type];
      if (!meta) return;
      const px = b.gridX * GRID;
      const py = b.gridY * GRID;
      const sz = meta.size * GRID * 4; // 4 grid cells per building unit
      ctx.fillStyle = meta.color + '99';
      ctx.fillRect(px, py, sz, sz);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, sz, sz);
      ctx.fillStyle = '#fff';
      ctx.font = `${sz * 0.5}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(meta.emoji, px + sz / 2, py + sz / 2);
    });

    // Hover placement preview
    if (selectedBuildingType && hoverCell) {
      const meta = BUILDING_META[selectedBuildingType];
      if (meta) {
        const sz = meta.size * GRID * 4;
        const px = hoverCell.x * GRID;
        const py = hoverCell.y * GRID;
        // Check if placement valid (on land)
        let valid = true;
        for (let dy = 0; dy < meta.size * 4; dy++) {
          for (let dx = 0; dx < meta.size * 4; dx++) {
            const tx = hoverCell.x + dx;
            const ty = hoverCell.y + dy;
            if (tx >= ISLAND_W || ty >= ISLAND_H || (terrain[ty]?.[tx] || 0) < 2) {
              valid = false;
            }
          }
        }
        ctx.fillStyle = valid ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,102,0.3)';
        ctx.fillRect(px, py, sz, sz);
        ctx.strokeStyle = valid ? '#00ff88' : '#ff3366';
        ctx.lineWidth = 2;
        ctx.strokeRect(px, py, sz, sz);
      }
    }
  }, [terrain, islandBuildings, selectedBuildingType, hoverCell]);

  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const canvasToGrid = useCallback((clientX, clientY) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;
    return { x: Math.floor(x / GRID), y: Math.floor(y / GRID) };
  }, [zoom]);

  const handleCanvasClick = useCallback((e) => {
    if (panRef.current.dragging) return;
    if (!selectedBuildingType) return;
    const cell = canvasToGrid(e.clientX, e.clientY);
    if (!cell) return;

    const result = placeIslandBuilding(selectedBuildingType, cell.x, cell.y);
    if (result.success) {
      showNotify(`✅ ${BUILDING_META[selectedBuildingType]?.label} built!`);
      setSelectedBuildingType(null);
    } else {
      showNotify(`❌ ${result.reason}`);
    }
  }, [selectedBuildingType, canvasToGrid, placeIslandBuilding]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (panRef.current.dragging) {
      const dx = e.clientX - panRef.current.startX;
      const dy = e.clientY - panRef.current.startY;
      setPan({ x: panRef.current.startPanX + dx, y: panRef.current.startPanY + dy });
      return;
    }
    if (selectedBuildingType) {
      const cell = canvasToGrid(e.clientX, e.clientY);
      setHoverCell(cell);
    }
  }, [selectedBuildingType, canvasToGrid]);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 2 || (e.button === 0 && !selectedBuildingType)) {
      panRef.current = { dragging: true, startX: e.clientX, startY: e.clientY, startPanX: pan.x, startPanY: pan.y };
    }
  }, [pan, selectedBuildingType]);

  const handleMouseUp = useCallback(() => {
    panRef.current.dragging = false;
  }, []);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(3, z + (e.deltaY > 0 ? -0.1 : 0.1))));
  }, []);

  const handleCollect = () => {
    const result = collectIslandResources();
    if (result.success) {
      showNotify(`🎉 Collected ${result.total} resources!`);
    } else {
      showNotify('⚠️ No resources to collect');
    }
  };

  // Hero sprites overlaid on buildings
  const heroOverlays = islandHeroes
    .filter(h => h.buildingId)
    .map(h => {
      const building = islandBuildings.find(b => b.id === h.buildingId);
      const hero = heroRoster.find(r => r.id === h.heroId);
      if (!building || !hero) return null;
      const meta = BUILDING_META[building.type];
      const spriteData = getPlayerSprite(hero.classId, hero.raceId, hero.namedHeroId);
      if (!spriteData) return null;
      const sz = (meta?.size || 1) * GRID * 4;
      const px = building.gridX * GRID * zoom + pan.x + sz * zoom / 2;
      const py = building.gridY * GRID * zoom + pan.y + sz * zoom - 10;
      return { key: h.heroId, hero, spriteData, px, py };
    })
    .filter(Boolean);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', overflow: 'hidden', background: '#0a0e1a' }}>
      {/* Main canvas area */}
      <div ref={containerRef} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onMouseMove={handleCanvasMouseMove}
        onWheel={handleWheel}
        onContextMenu={e => e.preventDefault()}
      >
        {/* Header */}
        <div style={{
          position: 'absolute', top: 8, left: 16, right: 340, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', zIndex: SCENE.HEADER,
        }}>
          <div style={{
            color: '#00ff88', fontSize: '1.3rem', fontFamily: "'LifeCraft', 'Cinzel', serif",
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}>
            Home Island
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleCollect} style={{
              background: 'rgba(0,255,136,0.15)', border: '1px solid #00ff88', borderRadius: 6,
              padding: '4px 12px', color: '#00ff88', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
            }}>🔄 Collect All</button>
            <span style={{
              color: '#a0a0c0', fontSize: '0.75rem', padding: '4px 8px',
              background: 'rgba(0,0,0,0.5)', borderRadius: 4,
            }}>Zoom: {zoom.toFixed(1)}x</span>
          </div>
        </div>

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onClick={handleCanvasClick}
          style={{
            position: 'absolute',
            left: pan.x,
            top: pan.y,
            width: CANVAS_W * zoom,
            height: CANVAS_H * zoom,
            imageRendering: 'pixelated',
            cursor: selectedBuildingType ? 'crosshair' : 'grab',
          }}
        />

        {/* Hero sprite overlays */}
        {heroOverlays.map(h => (
          <div key={h.key} style={{
            position: 'absolute', left: h.px, top: h.py,
            transform: 'translate(-50%, -100%)', pointerEvents: 'none', zIndex: 20,
          }}>
            <SpriteAnimation spriteData={h.spriteData} animation="idle" scale={1.5} />
            <div style={{
              color: '#6ee7b3', fontSize: '0.55rem', fontWeight: 700, textAlign: 'center',
              textShadow: '0 1px 3px rgba(0,0,0,0.9)', whiteSpace: 'nowrap',
            }}>{h.hero.name}</div>
          </div>
        ))}

        {/* Notification */}
        {notification && (
          <div style={{
            position: 'absolute', bottom: 60, right: 350, background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
            color: '#fff', padding: '8px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600,
            zIndex: 200, boxShadow: '0 4px 16px rgba(255,107,53,0.5)',
          }}>{notification}</div>
        )}

        {/* Back button */}
        <div onClick={exitScene} style={{
          position: 'absolute', bottom: 16, left: 16, zIndex: SCENE.BACK_BUTTON, cursor: 'pointer',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(110,231,183,0.4), rgba(110,231,183,0.1))',
            border: '2px solid #6ee7b3', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 16px rgba(110,231,183,0.3)', fontSize: '1.2rem',
          }}>⬅</div>
          <div style={{ color: '#6ee7b3', fontSize: '0.6rem', textAlign: 'center', marginTop: 2 }}>Back</div>
        </div>
      </div>

      {/* Sidebar */}
      <IslandSidebar
        selectedBuildingType={selectedBuildingType}
        onSelectBuilding={setSelectedBuildingType}
        onCollect={handleCollect}
      />
    </div>
  );
}
