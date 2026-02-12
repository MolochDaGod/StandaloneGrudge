const STORAGE_KEY = 'grudge_ui_layouts';

const CANVAS_W = 1280;
const CANVAS_H = 720;

const UI_ELEMENTS = {
  world: [
    { id: 'bottomBar', label: 'Bottom Bar Container', defaultRect: { x: 0, y: 546, w: 1280, h: 174 } },
    { id: 'chatPanel', label: 'Chat Panel (Left)', defaultRect: { x: 0, y: 0, w: 282, h: 174 } },
    { id: 'hotbar', label: 'Hotbar (Center)', defaultRect: { x: 282, y: 88, w: 716, h: 86 } },
    { id: 'warParty', label: 'War Party (Right)', defaultRect: { x: 998, y: 0, w: 282, h: 174 } },
    { id: 'minimap', label: 'Minimap', defaultRect: { x: 1090, y: 10, w: 180, h: 140 } },
    { id: 'zoneLabel', label: 'Zone Label', defaultRect: { x: 490, y: 8, w: 300, h: 40 } },
  ],
  battle: [
    { id: 'battleActionBar', label: 'Battle Action Bar', defaultRect: { x: 256, y: 610, w: 768, h: 80 } },
    { id: 'battleEnemyInfo', label: 'Enemy Info Panel', defaultRect: { x: 1048, y: 8, w: 220, h: 100 } },
    { id: 'battlePartyInfo', label: 'Party Status', defaultRect: { x: 12, y: 8, w: 200, h: 120 } },
    { id: 'battleLog', label: 'Battle Log', defaultRect: { x: 12, y: 460, w: 280, h: 160 } },
  ],
  scene: [
    { id: 'sceneHeader', label: 'Scene Header', defaultRect: { x: 440, y: 8, w: 400, h: 48 } },
    { id: 'sceneActions', label: 'Scene Actions Panel', defaultRect: { x: 390, y: 628, w: 500, h: 80 } },
    { id: 'sceneNpcPanel', label: 'NPC Interaction', defaultRect: { x: 1004, y: 210, w: 260, h: 300 } },
  ],
};

function getDefaults(screen) {
  const elements = UI_ELEMENTS[screen] || [];
  const layout = {};
  elements.forEach(el => {
    layout[el.id] = {
      locked: false,
      visible: true,
      customX: null,
      customY: null,
      customWidth: null,
      customHeight: null,
    };
  });
  return layout;
}

export function getElementRegistry(screen) {
  return UI_ELEMENTS[screen] || [];
}

export function getAllScreens() {
  return Object.keys(UI_ELEMENTS);
}

export function loadAllLayouts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function loadLayout(screen) {
  const all = loadAllLayouts();
  if (all[screen]) return all[screen];
  return getDefaults(screen);
}

export function saveLayout(screen, layout) {
  const all = loadAllLayouts();
  all[screen] = layout;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function resetLayout(screen) {
  const all = loadAllLayouts();
  delete all[screen];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  return getDefaults(screen);
}

export function resetAllLayouts() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getElementRect(screen, elementId) {
  const layout = loadLayout(screen);
  const config = layout[elementId];
  const elements = UI_ELEMENTS[screen] || [];
  const el = elements.find(e => e.id === elementId);
  if (!config || !el) return null;

  if (config.visible === false) return null;

  const def = el.defaultRect;
  return {
    x: config.customX !== null ? config.customX : def.x,
    y: config.customY !== null ? config.customY : def.y,
    w: config.customWidth !== null ? config.customWidth : def.w,
    h: config.customHeight !== null ? config.customHeight : def.h,
  };
}

export function getElementStyle(screen, elementId) {
  const rect = getElementRect(screen, elementId);
  if (!rect) return { display: 'none' };

  return {
    left: ((rect.x / CANVAS_W) * 100).toFixed(2) + '%',
    top: ((rect.y / CANVAS_H) * 100).toFixed(2) + '%',
    width: ((rect.w / CANVAS_W) * 100).toFixed(2) + '%',
    height: ((rect.h / CANVAS_H) * 100).toFixed(2) + '%',
  };
}

export function exportLayouts() {
  return JSON.stringify(loadAllLayouts(), null, 2);
}

export function importLayouts(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
