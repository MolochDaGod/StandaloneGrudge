import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  getElementRegistry, getAllScreens, loadLayout, saveLayout,
  resetLayout, exportLayouts, importLayouts,
  ICON_GROUPS, getIconPlacement, saveIconPlacement, resetIconPlacement,
} from '../utils/uiLayoutConfig';

const CANVAS_W = 1280;
const CANVAS_H = 720;

const SCREEN_COLORS = {
  world: '#2563eb',
  battle: '#dc2626',
  scene: '#16a34a',
};

const SCREEN_LABELS = {
  world: 'World Map',
  battle: 'Battle Screen',
  scene: 'Scene Views',
};

const SCREEN_BGS = {
  world: 'linear-gradient(180deg, #0a1628 0%, #162a4a 40%, #1a3a2a 100%)',
  battle: 'linear-gradient(180deg, #1a0a0a 0%, #2a1414 40%, #1a0a1a 100%)',
  scene: 'linear-gradient(180deg, #0a1a0a 0%, #1a2a1a 40%, #0a1a28 100%)',
};

const SCREEN_BG_IMAGES = {
  world: '/backgrounds/world_map.png',
  battle: '/backgrounds/scene_field.png',
  scene: '/backgrounds/scene_camp.png',
};

const PANEL_BG_MAP = {
  chatPanel: '/ui/chat-background.png',
  hotbar: '/ui/hotbar-background.png',
  warParty: '/ui/bar-background.png',
  battleActionBar: '/ui/hotbar-background.png',
  battleEnemyInfo: '/ui/bar-background.png',
  battlePartyInfo: '/ui/bar-background.png',
  battleLog: '/ui/chat-background.png',
  sceneNpcPanel: '/ui/chat-background.png',
};

function MiniBar({ pct, color, width = '100%' }) {
  return (
    <div style={{
      width, height: 3, background: '#1a1a2e', borderRadius: 1,
      overflow: 'hidden', border: '0.5px solid #2a2a3e',
    }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 1 }} />
    </div>
  );
}

function MockChatPanel({ scale }) {
  const fs = Math.max(5, 7 / scale);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 4 / scale, overflow: 'hidden' }}>
      <div style={{ fontSize: fs, color: '#ffd700', fontWeight: 700, marginBottom: 2 / scale, fontFamily: "'Cinzel', serif" }}>Party Log</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5 / scale, justifyContent: 'flex-end', overflow: 'hidden' }}>
        {['Hero attacks Goblin for 12 dmg', 'Goblin strikes back!', 'Mage casts Fireball', 'Enemy defeated!', '+15 XP, +8 Gold'].map((msg, i) => (
          <div key={i} style={{ fontSize: fs * 0.8, color: i === 4 ? '#22c55e' : 'rgba(255,255,255,0.5)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockHotbar({ scale }) {
  const slotSize = Math.max(10, 28 / scale);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 / scale }}>
      {[1,2,3,4,5,6,7,8].map(i => (
        <div key={i} style={{
          width: slotSize, height: slotSize,
          border: `1px solid ${i <= 5 ? 'rgba(255,215,0,0.5)' : 'rgba(255,255,255,0.15)'}`,
          borderRadius: 2, background: i <= 5 ? 'rgba(255,215,0,0.08)' : 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: Math.max(5, 8 / scale), color: 'rgba(255,255,255,0.3)',
        }}>
          {i}
        </div>
      ))}
    </div>
  );
}

function MockWarParty({ scale }) {
  const fs = Math.max(4, 6 / scale);
  const heroes = [
    { name: 'Knight', hp: 85, mp: 60, sp: 70, color: '#22c55e' },
    { name: 'Mage', hp: 55, mp: 90, sp: 40, color: '#3b82f6' },
    { name: 'Ranger', hp: 72, mp: 45, sp: 80, color: '#f59e0b' },
  ];
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 3 / scale, gap: 2 / scale }}>
      <div style={{ fontSize: fs * 1.1, color: '#ffd700', fontWeight: 700, fontFamily: "'Cinzel', serif" }}>War Party</div>
      {heroes.map((h, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 / scale }}>
          <div style={{
            width: Math.max(8, 16 / scale), height: Math.max(8, 16 / scale),
            borderRadius: '50%', border: '1px solid rgba(255,215,0,0.4)',
            background: 'rgba(0,0,0,0.5)', flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: fs, color: '#e2e8f0', fontWeight: 600, marginBottom: 1 }}>{h.name}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MiniBar pct={h.hp} color="#22c55e" />
              <MiniBar pct={h.mp} color="#3b82f6" />
              <MiniBar pct={h.sp} color="#f59e0b" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MockMinimap({ scale }) {
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: 4 / scale, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a3a2a, #0a2818)', opacity: 0.8 }} />
      <div style={{ position: 'absolute', top: '20%', left: '30%', width: 4 / scale, height: 4 / scale, background: '#ffd700', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '50%', left: '60%', width: 3 / scale, height: 3 / scale, background: '#ef4444', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', top: '70%', left: '40%', width: 3 / scale, height: 3 / scale, background: '#3b82f6', borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: 2 / scale, right: 3 / scale, fontSize: Math.max(4, 6 / scale), color: 'rgba(255,255,255,0.4)' }}>MAP</div>
    </div>
  );
}

function MockZoneLabel({ scale }) {
  const fs = Math.max(6, 12 / scale);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: fs, color: '#ffd700', fontFamily: "'Cinzel', serif", fontWeight: 700, letterSpacing: 1, textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
        Eldertree Forest
      </span>
    </div>
  );
}

function MockBattleActionBar({ scale }) {
  const slotSize = Math.max(12, 32 / scale);
  const fs = Math.max(4, 6 / scale);
  const abilities = ['ATK', 'MAG', 'DEF', 'ITM', 'SPL'];
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 / scale }}>
      {abilities.map((a, i) => (
        <div key={i} style={{
          width: slotSize, height: slotSize,
          border: '1px solid rgba(255,215,0,0.4)', borderRadius: 3 / scale,
          background: 'linear-gradient(180deg, rgba(255,215,0,0.12), rgba(0,0,0,0.4))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: fs, color: '#ffd700', fontWeight: 700,
        }}>
          {a}
        </div>
      ))}
    </div>
  );
}

function MockEnemyInfo({ scale }) {
  const fs = Math.max(5, 7 / scale);
  return (
    <div style={{ width: '100%', height: '100%', padding: 3 / scale, display: 'flex', flexDirection: 'column', gap: 2 / scale }}>
      <div style={{ fontSize: fs * 1.1, color: '#ef4444', fontWeight: 700, fontFamily: "'Cinzel', serif" }}>Goblin Lv.5</div>
      <MiniBar pct={65} color="#ef4444" />
      <div style={{ fontSize: fs * 0.85, color: 'rgba(255,255,255,0.4)' }}>HP: 65/100</div>
      <div style={{ fontSize: fs * 0.85, color: 'rgba(255,255,255,0.4)' }}>ATK: 12 | DEF: 8</div>
    </div>
  );
}

function MockPartyInfo({ scale }) {
  const fs = Math.max(4, 6 / scale);
  return (
    <div style={{ width: '100%', height: '100%', padding: 3 / scale, display: 'flex', flexDirection: 'column', gap: 2 / scale }}>
      <div style={{ fontSize: fs * 1.1, color: '#22c55e', fontWeight: 700, fontFamily: "'Cinzel', serif" }}>Party</div>
      {['Knight', 'Mage'].map((name, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <div style={{ fontSize: fs, color: '#e2e8f0' }}>{name}</div>
          <MiniBar pct={i === 0 ? 80 : 55} color="#22c55e" />
          <MiniBar pct={i === 0 ? 50 : 90} color="#3b82f6" />
        </div>
      ))}
    </div>
  );
}

function MockBattleLog({ scale }) {
  const fs = Math.max(4, 6 / scale);
  return (
    <div style={{ width: '100%', height: '100%', padding: 3 / scale, display: 'flex', flexDirection: 'column' }}>
      <div style={{ fontSize: fs * 1.1, color: '#f59e0b', fontWeight: 700, marginBottom: 2 / scale, fontFamily: "'Cinzel', serif" }}>Battle Log</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'flex-end', overflow: 'hidden' }}>
        {['Turn 3 begins', 'Knight uses Slash!', 'Critical Hit! 24 damage', 'Goblin is stunned', 'Mage prepares spell...'].map((msg, i) => (
          <div key={i} style={{ fontSize: fs * 0.85, color: i === 2 ? '#f59e0b' : 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {msg}
          </div>
        ))}
      </div>
    </div>
  );
}

function MockSceneHeader({ scale }) {
  const fs = Math.max(7, 14 / scale);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize: fs, color: '#ffd700', fontFamily: "'Cinzel', serif", fontWeight: 700, letterSpacing: 2 }}>
        Merchant Camp
      </span>
    </div>
  );
}

function MockSceneActions({ scale }) {
  const fs = Math.max(5, 8 / scale);
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 / scale }}>
      {['Trade', 'Rest', 'Train', 'Leave'].map((a, i) => (
        <div key={i} style={{
          padding: `${2 / scale}px ${6 / scale}px`,
          border: '1px solid rgba(255,215,0,0.3)', borderRadius: 3 / scale,
          background: 'rgba(255,215,0,0.08)',
          fontSize: fs, color: '#ffd700', fontWeight: 600,
        }}>
          {a}
        </div>
      ))}
    </div>
  );
}

function MockNpcPanel({ scale }) {
  const fs = Math.max(5, 7 / scale);
  return (
    <div style={{ width: '100%', height: '100%', padding: 4 / scale, display: 'flex', flexDirection: 'column', gap: 3 / scale }}>
      <div style={{ fontSize: fs * 1.2, color: '#ffd700', fontWeight: 700, fontFamily: "'Cinzel', serif" }}>Merchant</div>
      <div style={{
        width: Math.max(16, 40 / scale), height: Math.max(16, 40 / scale),
        borderRadius: '50%', border: '1px solid rgba(255,215,0,0.3)',
        background: 'rgba(0,0,0,0.4)', alignSelf: 'center',
      }} />
      <div style={{ fontSize: fs * 0.9, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>
        "Welcome, traveler! Care to browse my wares?"
      </div>
      <div style={{ display: 'flex', gap: 2 / scale, flexWrap: 'wrap' }}>
        {['Buy', 'Sell', 'Talk'].map((b, i) => (
          <div key={i} style={{
            padding: `${1 / scale}px ${4 / scale}px`,
            border: '1px solid rgba(255,215,0,0.2)', borderRadius: 2,
            fontSize: fs * 0.85, color: '#ffd700', background: 'rgba(255,215,0,0.06)',
          }}>
            {b}
          </div>
        ))}
      </div>
    </div>
  );
}

const ELEMENT_PREVIEWS = {
  chatPanel: MockChatPanel,
  hotbar: MockHotbar,
  warParty: MockWarParty,
  minimap: MockMinimap,
  zoneLabel: MockZoneLabel,
  battleActionBar: MockBattleActionBar,
  battleEnemyInfo: MockEnemyInfo,
  battlePartyInfo: MockPartyInfo,
  battleLog: MockBattleLog,
  sceneHeader: MockSceneHeader,
  sceneActions: MockSceneActions,
  sceneNpcPanel: MockNpcPanel,
};

function MockBottomBar({ scale }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', gap: 2 / scale, padding: 2 / scale, opacity: 0.4 }}>
      <div style={{ flex: 1, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 3 / scale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.max(4, 6 / scale), color: 'rgba(255,255,255,0.2)' }}>Chat</div>
      <div style={{ flex: 2, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 3 / scale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.max(4, 6 / scale), color: 'rgba(255,255,255,0.2)' }}>Hotbar</div>
      <div style={{ flex: 1, border: '1px dashed rgba(255,255,255,0.15)', borderRadius: 3 / scale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.max(4, 6 / scale), color: 'rgba(255,255,255,0.2)' }}>Party</div>
    </div>
  );
}

function getElementBox(config, el) {
  const def = el.defaultRect;
  const x = config.customX !== null ? config.customX : def.x;
  const y = config.customY !== null ? config.customY : def.y;
  const w = config.customWidth !== null ? config.customWidth : def.w;
  const h = config.customHeight !== null ? config.customHeight : def.h;
  return { x: Math.round(x), y: Math.round(y), w: Math.max(40, Math.round(w)), h: Math.max(20, Math.round(h)) };
}

const ICON_GROUP_SAMPLES = {
  hotbarIcons: { count: 8, icons: ['sword', 'shield', 'crystal', 'potion', 'sparkle', 'fire', 'ice', 'lightning'], label: 'Hotbar' },
  battleActionIcons: { count: 5, icons: ['sword', 'crystal', 'shield', 'potion', 'sparkle'], label: 'Actions' },
  equipIcons: { count: 7, icons: ['helm', 'armor', 'sword', 'shield', 'boots', 'ring', 'crystal'], label: 'Equip' },
  invGridIcons: { count: 16, icons: ['sword','helm','potion','ring','armor','shield','boots','crystal','wand','bow','dagger','scroll','bomb','herb','gem','staff'], label: 'Inv Grid' },
  warPartyIcons: { count: 3, icons: ['sword', 'crystal', 'bow'], label: 'Party' },
};

const ICON_PARAM_LABELS = {
  offsetX: { label: 'X Offset', unit: 'px', min: -20, max: 20, step: 1 },
  offsetY: { label: 'Y Offset', unit: 'px', min: -20, max: 20, step: 1 },
  iconSize: { label: 'Icon Size', unit: 'px', min: 8, max: 48, step: 1 },
  slotSize: { label: 'Slot Size', unit: 'px', min: 16, max: 64, step: 1 },
  gap: { label: 'Gap', unit: 'px', min: 0, max: 20, step: 1 },
};

const SAMPLE_ICON_SRCS = {
  sword: '/sprites/ui/icons/icon_sword.png',
  shield: '/sprites/ui/icons/icon_shield_blue.png',
  crystal: '/sprites/ui/icons/icon_crystal.png',
  potion: '/sprites/ui/icons/icon_potion_blue.png',
  sparkle: '/sprites/ui/icons/icon_sparkle.png',
  fire: '/sprites/ui/icons/icon_fire.png',
  ice: '/sprites/ui/icons/icon_ice.png',
  lightning: '/sprites/ui/icons/icon_lightning.png',
  helm: '/sprites/ui/icons/item_helm.png',
  armor: '/sprites/ui/icons/item_armor.png',
  boots: '/sprites/ui/icons/icon_boots.png',
  ring: '/sprites/ui/icons/item_ring.png',
  wand: '/sprites/ui/icons/icon_wand.png',
  bow: '/sprites/ui/icons/icon_bow.png',
  dagger: '/sprites/ui/icons/icon_dagger.png',
  scroll: '/sprites/ui/icons/icon_scroll.png',
  bomb: '/sprites/ui/icons/icon_bomb.png',
  herb: '/sprites/ui/icons/icon_herb.png',
  gem: '/sprites/ui/icons/icon_gem_blue.png',
  staff: '/sprites/ui/icons/item_staff.png',
};

function IconPlacementPreview({ groupId, config }) {
  const sample = ICON_GROUP_SAMPLES[groupId];
  if (!sample) return null;
  const { iconSize, slotSize, gap, offsetX, offsetY } = config;
  const isGrid = groupId === 'invGridIcons';
  const cols = isGrid ? 4 : sample.count;
  const rows = isGrid ? 4 : 1;

  return (
    <div style={{
      background: 'linear-gradient(180deg, rgba(10,14,23,0.95), rgba(20,29,51,0.95))',
      border: '1px solid rgba(180,150,90,0.25)',
      borderRadius: 8, padding: 16, position: 'relative',
    }}>
      <div style={{
        fontSize: '0.55rem', color: '#64748b', marginBottom: 8,
        textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1,
      }}>
        {sample.label} Preview — {iconSize}px icons in {slotSize}px slots
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${slotSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${slotSize}px)`,
        gap: gap, justifyContent: 'center', alignItems: 'center',
      }}>
        {sample.icons.slice(0, sample.count).map((icon, i) => (
          <div key={i} style={{
            width: slotSize, height: slotSize,
            border: '1px solid rgba(255,215,0,0.35)',
            borderRadius: 3,
            background: 'linear-gradient(180deg, rgba(255,215,0,0.08), rgba(0,0,0,0.3))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'visible',
          }}>
            <img
              src={SAMPLE_ICON_SRCS[icon] || SAMPLE_ICON_SRCS.sword}
              alt=""
              style={{
                width: iconSize, height: iconSize,
                imageRendering: 'pixelated', objectFit: 'contain',
                transform: `translate(${offsetX}px, ${offsetY}px)`,
                transition: 'all 0.15s',
              }}
            />
          </div>
        ))}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 2, marginTop: 8, fontSize: '0.5rem', color: '#475569',
      }}>
        <span>Offset: {offsetX},{offsetY}px</span>
        <span style={{ textAlign: 'right' }}>Gap: {gap}px</span>
      </div>
    </div>
  );
}

export default function AdminUI() {
  const [activeScreen, setActiveScreen] = useState('world');
  const [layout, setLayout] = useState(() => loadLayout('world'));
  const [selectedId, setSelectedId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [showExport, setShowExport] = useState(false);
  const [importText, setImportText] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [editorMode, setEditorMode] = useState('panels');
  const [activeIconGroup, setActiveIconGroup] = useState('hotbarIcons');
  const [iconConfig, setIconConfig] = useState(() => getIconPlacement('hotbarIcons'));
  const [iconSavedFlash, setIconSavedFlash] = useState(false);
  const canvasRef = useRef(null);
  const dragStart = useRef({ mx: 0, my: 0, ex: 0, ey: 0 });
  const resizeStart = useRef({ mx: 0, my: 0, ew: 0, eh: 0, ex: 0, ey: 0 });

  const elements = getElementRegistry(activeScreen);

  const switchScreen = (screen) => {
    setActiveScreen(screen);
    setLayout(loadLayout(screen));
    setSelectedId(null);
    setDragging(null);
    setResizing(null);
  };

  const updateElement = (id, updates) => {
    setLayout(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  };

  const handleSave = () => {
    saveLayout(activeScreen, layout);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  };

  const handleReset = () => {
    const def = resetLayout(activeScreen);
    setLayout(def);
    setSelectedId(null);
  };

  const handleExport = () => {
    setImportText(exportLayouts());
    setShowExport(true);
  };

  const handleImport = () => {
    if (importLayouts(importText)) {
      setLayout(loadLayout(activeScreen));
      setShowExport(false);
    }
  };

  const getCanvasScale = useCallback(() => {
    if (!canvasRef.current) return 1;
    const rect = canvasRef.current.getBoundingClientRect();
    return rect.width / CANVAS_W;
  }, []);

  const handleMouseDown = (e, elId, type) => {
    const config = layout[elId];
    if (config?.locked) return;
    e.preventDefault();
    e.stopPropagation();

    const el = elements.find(el => el.id === elId);
    const box = getElementBox(config, el);
    const scale = getCanvasScale();

    if (type === 'move') {
      dragStart.current = { mx: e.clientX, my: e.clientY, ex: box.x, ey: box.y };
      setDragging(elId);
    } else {
      resizeStart.current = { mx: e.clientX, my: e.clientY, ew: box.w, eh: box.h, ex: box.x, ey: box.y, corner: type };
      setResizing(elId);
    }
    setSelectedId(elId);
  };

  useEffect(() => {
    if (!dragging) return;
    const scale = getCanvasScale();
    const onMove = (e) => {
      const dx = (e.clientX - dragStart.current.mx) / scale;
      const dy = (e.clientY - dragStart.current.my) / scale;
      updateElement(dragging, {
        customX: Math.round(Math.max(0, Math.min(CANVAS_W - 40, dragStart.current.ex + dx))),
        customY: Math.round(Math.max(0, Math.min(CANVAS_H - 20, dragStart.current.ey + dy))),
      });
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [dragging, getCanvasScale]);

  useEffect(() => {
    if (!resizing) return;
    const scale = getCanvasScale();
    const onMove = (e) => {
      const dx = (e.clientX - resizeStart.current.mx) / scale;
      const dy = (e.clientY - resizeStart.current.my) / scale;
      const c = resizeStart.current.corner;
      let nw = resizeStart.current.ew;
      let nh = resizeStart.current.eh;
      let nx = resizeStart.current.ex;
      let ny = resizeStart.current.ey;

      if (c.includes('r')) nw += dx;
      if (c.includes('b')) nh += dy;
      if (c.includes('l')) { nw -= dx; nx += dx; }
      if (c.includes('t')) { nh -= dy; ny += dy; }

      updateElement(resizing, {
        customWidth: Math.round(Math.max(40, nw)),
        customHeight: Math.round(Math.max(20, nh)),
        customX: Math.round(nx),
        customY: Math.round(ny),
      });
    };
    const onUp = () => setResizing(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [resizing, getCanvasScale]);

  const selectedConfig = selectedId ? layout[selectedId] : null;
  const selectedElement = selectedId ? elements.find(e => e.id === selectedId) : null;
  const selectedBox = selectedId && selectedConfig && selectedElement
    ? getElementBox(selectedConfig, selectedElement)
    : null;

  return (
    <div style={{
      width: '100%', height: '100%', background: '#0a0e17',
      display: 'flex', fontFamily: "'Jost', sans-serif", color: '#e2e8f0',
      overflow: 'hidden', userSelect: 'none',
    }}>
      <div style={{
        width: 280, flexShrink: 0, background: 'linear-gradient(180deg, #0f1629, #141d33)',
        borderRight: '1px solid rgba(180,150,90,0.2)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          padding: '16px 16px 12px', borderBottom: '1px solid rgba(180,150,90,0.15)',
        }}>
          <h1 style={{
            margin: 0, fontSize: '1.1rem', fontFamily: "'Cinzel', serif",
            color: '#ffd700', letterSpacing: '0.08em', fontWeight: 700,
          }}>UI Layout Editor</h1>
          <div style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 4 }}>
            Move, resize, and lock UI elements
          </div>
        </div>

        <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(180,150,90,0.1)' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'panels', label: 'Panels', color: '#3b82f6' },
              { id: 'icons', label: 'Icons', color: '#f59e0b' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setEditorMode(tab.id)}
                style={{
                  flex: 1, padding: '6px 0', borderRadius: 6, cursor: 'pointer',
                  background: editorMode === tab.id ? `${tab.color}22` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${editorMode === tab.id ? tab.color + '55' : 'rgba(255,255,255,0.06)'}`,
                  color: editorMode === tab.id ? tab.color : '#64748b',
                  fontSize: '0.7rem', fontWeight: editorMode === tab.id ? 700 : 400,
                  fontFamily: "'Cinzel', serif", transition: 'all 0.2s',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {editorMode === 'panels' && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(180,150,90,0.1)' }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>
            Screen Context
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {getAllScreens().map(s => (
              <button
                key={s}
                onClick={() => switchScreen(s)}
                style={{
                  background: activeScreen === s
                    ? `linear-gradient(135deg, ${SCREEN_COLORS[s]}33, ${SCREEN_COLORS[s]}11)`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeScreen === s ? SCREEN_COLORS[s] + '66' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 6, padding: '8px 12px', cursor: 'pointer',
                  color: activeScreen === s ? '#fff' : '#94a3b8',
                  fontSize: '0.75rem', fontWeight: activeScreen === s ? 700 : 400,
                  textAlign: 'left', transition: 'all 0.2s',
                  fontFamily: "'Cinzel', serif",
                }}
              >
                <span style={{
                  display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                  background: SCREEN_COLORS[s], marginRight: 8, verticalAlign: 'middle',
                }} />
                {SCREEN_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
        )}

        {editorMode === 'panels' && (
        <div style={{
          flex: 1, overflowY: 'auto', padding: '8px 16px',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,215,0,0.15) transparent',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              Elements ({elements.length})
            </div>
            <button
              onClick={() => setShowPreview(p => !p)}
              style={{
                background: showPreview ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${showPreview ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 4, padding: '2px 6px', cursor: 'pointer',
                color: showPreview ? '#22c55e' : '#64748b',
                fontSize: '0.55rem', fontWeight: 600,
              }}
            >
              {showPreview ? 'Preview ON' : 'Preview OFF'}
            </button>
          </div>
          {elements.map((el) => {
            const config = layout[el.id] || {};
            const isSelected = selectedId === el.id;
            return (
              <div
                key={el.id}
                onClick={() => setSelectedId(el.id)}
                style={{
                  padding: '8px 10px', marginBottom: 4, borderRadius: 6, cursor: 'pointer',
                  background: isSelected ? 'rgba(255,215,0,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isSelected ? 'rgba(255,215,0,0.3)' : 'rgba(255,255,255,0.04)'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: isSelected ? 700 : 400, color: isSelected ? '#ffd700' : '#cbd5e1' }}>
                    {el.label}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !config.visible }); }}
                      style={{
                        width: 22, height: 22, borderRadius: 4, border: 'none', cursor: 'pointer',
                        background: config.visible !== false ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                        color: config.visible !== false ? '#22c55e' : '#475569',
                        fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      title={config.visible !== false ? 'Visible' : 'Hidden'}
                    >
                      {config.visible !== false ? '\u25C9' : '\u25CE'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateElement(el.id, { locked: !config.locked }); }}
                      style={{
                        width: 22, height: 22, borderRadius: 4, border: 'none', cursor: 'pointer',
                        background: config.locked ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.05)',
                        color: config.locked ? '#f59e0b' : '#475569',
                        fontSize: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                      title={config.locked ? 'Locked' : 'Unlocked'}
                    >
                      {config.locked ? '\u{1F512}' : '\u{1F513}'}
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: '0.55rem', color: '#475569', marginTop: 2 }}>
                  {el.id}
                </div>
              </div>
            );
          })}
        </div>
        )}

        {editorMode === 'panels' && selectedId && selectedBox && (
          <div style={{
            padding: '12px 16px', borderTop: '1px solid rgba(180,150,90,0.15)',
            background: 'rgba(0,0,0,0.2)',
          }}>
            <div style={{ fontSize: '0.6rem', color: '#ffd700', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Properties
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { label: 'X', key: 'customX', val: selectedBox.x },
                { label: 'Y', key: 'customY', val: selectedBox.y },
                { label: 'W', key: 'customWidth', val: selectedBox.w },
                { label: 'H', key: 'customHeight', val: selectedBox.h },
              ].map(p => (
                <div key={p.label}>
                  <div style={{ fontSize: '0.5rem', color: '#64748b', marginBottom: 2 }}>{p.label}</div>
                  <input
                    type="number"
                    value={p.val}
                    onChange={e => updateElement(selectedId, { [p.key]: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%', background: '#1e293b', border: '1px solid #334155',
                      borderRadius: 4, color: '#e2e8f0', padding: '4px 6px', fontSize: '0.7rem',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {editorMode === 'icons' && (
        <div style={{
          flex: 1, overflowY: 'auto', padding: '8px 16px',
          scrollbarWidth: 'thin', scrollbarColor: 'rgba(245,158,11,0.15) transparent',
        }}>
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, fontWeight: 700 }}>
            Icon Groups
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
            {Object.entries(ICON_GROUPS).map(([gid, group]) => {
              const isActive = activeIconGroup === gid;
              return (
                <button
                  key={gid}
                  onClick={() => { setActiveIconGroup(gid); setIconConfig(getIconPlacement(gid)); }}
                  style={{
                    background: isActive ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${isActive ? 'rgba(245,158,11,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: 6, padding: '8px 10px', cursor: 'pointer',
                    color: isActive ? '#f59e0b' : '#94a3b8',
                    fontSize: '0.72rem', fontWeight: isActive ? 700 : 400,
                    textAlign: 'left', transition: 'all 0.2s',
                  }}
                >
                  {group.label}
                  <div style={{ fontSize: '0.5rem', color: '#475569', marginTop: 2, fontWeight: 400 }}>
                    {group.description}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
            Placement Controls
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(ICON_PARAM_LABELS).map(([key, param]) => (
              <div key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                  <span style={{ fontSize: '0.6rem', color: '#94a3b8' }}>{param.label}</span>
                  <span style={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 700 }}>{iconConfig[key]}{param.unit}</span>
                </div>
                <input
                  type="range"
                  min={param.min} max={param.max} step={param.step}
                  value={iconConfig[key]}
                  onChange={e => setIconConfig(prev => ({ ...prev, [key]: parseFloat(e.target.value) }))}
                  style={{
                    width: '100%', height: 4, appearance: 'auto',
                    accentColor: '#f59e0b', cursor: 'pointer',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.45rem', color: '#475569' }}>
                  <span>{param.min}{param.unit}</span>
                  <span>{param.max}{param.unit}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
            <button
              onClick={() => {
                saveIconPlacement(activeIconGroup, iconConfig);
                setIconSavedFlash(true);
                setTimeout(() => setIconSavedFlash(false), 1500);
              }}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 6,
                border: '1px solid rgba(34,197,94,0.4)',
                background: iconSavedFlash ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.1)',
                color: '#22c55e', cursor: 'pointer', fontSize: '0.68rem', fontWeight: 700,
                fontFamily: "'Cinzel', serif", transition: 'all 0.3s',
              }}
            >
              {iconSavedFlash ? 'Saved!' : 'Save'}
            </button>
            <button
              onClick={() => {
                const def = resetIconPlacement(activeIconGroup);
                setIconConfig(def);
              }}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 6,
                border: '1px solid rgba(220,38,38,0.3)',
                background: 'rgba(220,38,38,0.08)', color: '#f87171', cursor: 'pointer',
                fontSize: '0.68rem', fontWeight: 700, fontFamily: "'Cinzel', serif",
              }}
            >
              Reset
            </button>
          </div>
        </div>
        )}

        <div style={{
          padding: '12px 16px', borderTop: '1px solid rgba(180,150,90,0.15)',
          display: 'flex', flexDirection: 'column', gap: 6,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleSave} style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid rgba(34,197,94,0.4)',
              background: savedFlash ? 'rgba(34,197,94,0.3)' : 'rgba(34,197,94,0.1)',
              color: '#22c55e', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700,
              transition: 'all 0.3s', fontFamily: "'Cinzel', serif",
            }}>
              {savedFlash ? 'Saved!' : 'Save Layout'}
            </button>
            <button onClick={handleReset} style={{
              flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid rgba(220,38,38,0.3)',
              background: 'rgba(220,38,38,0.08)', color: '#f87171', cursor: 'pointer',
              fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Cinzel', serif",
            }}>
              Reset
            </button>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleExport} style={{
              flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)', color: '#94a3b8', cursor: 'pointer',
              fontSize: '0.65rem',
            }}>
              Export / Import
            </button>
            <a href="/admin" style={{
              flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.03)', color: '#94a3b8', cursor: 'pointer',
              fontSize: '0.65rem', textDecoration: 'none', textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              Admin Hub
            </a>
            <a href="/" style={{
              flex: 1, padding: '6px 0', borderRadius: 6, border: '1px solid rgba(255,215,0,0.2)',
              background: 'rgba(255,215,0,0.05)', color: '#ffd700', cursor: 'pointer',
              fontSize: '0.65rem', textDecoration: 'none', textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              Back to Game
            </a>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{
          padding: '8px 20px', background: 'rgba(0,0,0,0.3)',
          borderBottom: '1px solid rgba(180,150,90,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          {editorMode === 'panels' ? (
            <>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                <span style={{ color: SCREEN_COLORS[activeScreen], fontWeight: 700 }}>{SCREEN_LABELS[activeScreen]}</span>
                <span style={{ margin: '0 8px', color: '#334155' }}>|</span>
                Canvas {CANVAS_W}x{CANVAS_H}
              </div>
              <div style={{ fontSize: '0.6rem', color: '#475569' }}>
                Click to select, drag to move, corner handles to resize
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
                Icon Placement Preview
              </div>
              <div style={{ fontSize: '0.6rem', color: '#475569' }}>
                Adjust sliders to fine-tune icon alignment within slots
              </div>
            </>
          )}
        </div>

        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, overflow: 'hidden',
        }}>
          {editorMode === 'icons' ? (
            <div style={{
              width: '100%', maxWidth: 800, display: 'flex', flexDirection: 'column',
              gap: 24, alignItems: 'center',
            }}>
              <div style={{
                width: '100%', maxWidth: 600,
                background: 'linear-gradient(180deg, rgba(15,22,41,0.98), rgba(10,14,23,0.98))',
                border: '2px solid rgba(180,150,90,0.3)', borderRadius: 12,
                padding: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
              }}>
                <div style={{
                  textAlign: 'center', fontSize: '0.9rem', fontFamily: "'Cinzel', serif",
                  color: '#f59e0b', fontWeight: 700, marginBottom: 16,
                }}>
                  {ICON_GROUPS[activeIconGroup]?.label || activeIconGroup}
                </div>
                <IconPlacementPreview groupId={activeIconGroup} config={iconConfig} />
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12, width: '100%',
              }}>
                {Object.entries(ICON_GROUPS).filter(([gid]) => gid !== activeIconGroup).map(([gid]) => (
                  <div key={gid} style={{
                    background: 'rgba(15,22,41,0.8)', border: '1px solid rgba(180,150,90,0.12)',
                    borderRadius: 8, padding: 12, cursor: 'pointer', opacity: 0.6,
                    transition: 'all 0.2s',
                  }}
                  onClick={() => { setActiveIconGroup(gid); setIconConfig(getIconPlacement(gid)); }}
                  >
                    <div style={{
                      fontSize: '0.6rem', fontFamily: "'Cinzel', serif",
                      color: '#94a3b8', fontWeight: 600, marginBottom: 8, textAlign: 'center',
                    }}>
                      {ICON_GROUPS[gid]?.label}
                    </div>
                    <IconPlacementPreview groupId={gid} config={getIconPlacement(gid)} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
          <div
            ref={canvasRef}
            onClick={() => setSelectedId(null)}
            style={{
              width: '100%', maxWidth: CANVAS_W, aspectRatio: `${CANVAS_W}/${CANVAS_H}`,
              background: SCREEN_BGS[activeScreen],
              border: '2px solid rgba(180,150,90,0.25)',
              borderRadius: 8, position: 'relative', overflow: 'hidden',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), inset 0 0 80px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${SCREEN_BG_IMAGES[activeScreen]})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              opacity: 0.5, pointerEvents: 'none',
            }} />

            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'url(/ui/game-border-frame.png)',
              backgroundSize: '100% 100%', backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center center',
              pointerEvents: 'none', zIndex: 50, opacity: 0.7,
            }} />

            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              pointerEvents: 'none',
            }} />

            <div style={{
              position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
              fontSize: '0.7rem', color: 'rgba(255,255,255,0.08)', fontFamily: "'Cinzel', serif",
              letterSpacing: 2, pointerEvents: 'none',
            }}>
              {SCREEN_LABELS[activeScreen].toUpperCase()} LAYOUT
            </div>

            {elements.map((el) => {
              const config = layout[el.id] || {};
              if (config.visible === false) return null;
              const box = getElementBox(config, el);
              const isSelected = selectedId === el.id;
              const isLocked = config.locked;
              const scale = canvasRef.current ? canvasRef.current.getBoundingClientRect().width / CANVAS_W : 1;

              const elColor = isLocked ? '#f59e0b' : isSelected ? '#ffd700' : SCREEN_COLORS[activeScreen];

              const PreviewComponent = showPreview ? (ELEMENT_PREVIEWS[el.id] || (el.id === 'bottomBar' ? MockBottomBar : null)) : null;
              const panelBg = PANEL_BG_MAP[el.id];

              return (
                <div
                  key={el.id}
                  onMouseDown={(e) => handleMouseDown(e, el.id, 'move')}
                  onClick={(e) => { e.stopPropagation(); setSelectedId(el.id); }}
                  style={{
                    position: 'absolute',
                    left: `${(box.x / CANVAS_W) * 100}%`,
                    top: `${(box.y / CANVAS_H) * 100}%`,
                    width: `${(box.w / CANVAS_W) * 100}%`,
                    height: `${(box.h / CANVAS_H) * 100}%`,
                    border: `2px solid ${elColor}${isSelected ? 'cc' : '55'}`,
                    borderRadius: 4,
                    background: PreviewComponent
                      ? `linear-gradient(180deg, rgba(10,14,23,0.85), rgba(10,14,23,0.92))`
                      : `${elColor}${isSelected ? '18' : '0a'}`,
                    cursor: isLocked ? 'not-allowed' : dragging === el.id ? 'grabbing' : 'grab',
                    transition: dragging === el.id || resizing === el.id ? 'none' : 'all 0.1s',
                    boxShadow: isSelected
                      ? `0 0 16px ${elColor}33, inset 0 0 20px ${elColor}08`
                      : PreviewComponent ? '0 2px 12px rgba(0,0,0,0.5)' : 'none',
                    overflow: 'hidden',
                  }}
                >
                  {panelBg && showPreview && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      backgroundImage: `url(${panelBg})`,
                      backgroundSize: 'cover', backgroundPosition: 'center',
                      opacity: 0.6, pointerEvents: 'none',
                      borderRadius: 3,
                    }} />
                  )}
                  {PreviewComponent && (
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                      <PreviewComponent scale={scale} />
                    </div>
                  )}

                  <div style={{
                    position: 'absolute', top: -1, left: 4,
                    transform: 'translateY(-100%)',
                    fontSize: 10 / scale, fontWeight: 700,
                    color: elColor, whiteSpace: 'nowrap',
                    textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                    pointerEvents: 'none',
                  }}>
                    {isLocked && '\u{1F512} '}{el.label}
                  </div>

                  <div style={{
                    position: 'absolute', bottom: 2 / scale, right: 4 / scale,
                    fontSize: 9 / scale, color: 'rgba(255,255,255,0.3)',
                    pointerEvents: 'none',
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                  }}>
                    {box.w}x{box.h}
                  </div>

                  {isSelected && !isLocked && (
                    <>
                      {[
                        { pos: { top: -4, left: -4 }, cursor: 'nw-resize', corner: 'tl' },
                        { pos: { top: -4, right: -4 }, cursor: 'ne-resize', corner: 'tr' },
                        { pos: { bottom: -4, left: -4 }, cursor: 'sw-resize', corner: 'bl' },
                        { pos: { bottom: -4, right: -4 }, cursor: 'se-resize', corner: 'br' },
                      ].map(({ pos, cursor, corner }) => (
                        <div
                          key={corner}
                          onMouseDown={(e) => handleMouseDown(e, el.id, corner)}
                          style={{
                            position: 'absolute', ...pos,
                            width: 8, height: 8, background: elColor,
                            border: '1px solid rgba(255,255,255,0.6)', borderRadius: 2,
                            cursor, zIndex: 2,
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>

      {showExport && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
        }} onClick={() => setShowExport(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: 500, maxHeight: '70vh', background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            border: '1px solid rgba(180,150,90,0.3)', borderRadius: 12, padding: 24,
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            <h3 style={{ margin: 0, fontFamily: "'Cinzel', serif", color: '#ffd700', fontSize: '1rem' }}>
              Export / Import Layouts
            </h3>
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              style={{
                flex: 1, minHeight: 200, background: '#0a0e17', border: '1px solid #334155',
                borderRadius: 6, color: '#e2e8f0', padding: 12, fontSize: '0.7rem',
                fontFamily: 'monospace', resize: 'vertical', outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleImport} style={{
                flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid rgba(34,197,94,0.4)',
                background: 'rgba(34,197,94,0.1)', color: '#22c55e', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 700,
              }}>
                Import
              </button>
              <button onClick={() => { navigator.clipboard.writeText(importText); }} style={{
                flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid rgba(59,130,246,0.4)',
                background: 'rgba(59,130,246,0.1)', color: '#60a5fa', cursor: 'pointer',
                fontSize: '0.75rem', fontWeight: 700,
              }}>
                Copy to Clipboard
              </button>
              <button onClick={() => setShowExport(false)} style={{
                flex: 1, padding: '8px 0', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.03)', color: '#94a3b8', cursor: 'pointer',
                fontSize: '0.75rem',
              }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
