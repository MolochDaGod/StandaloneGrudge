// ============================================================
// GAME Z-INDEX LAYER SYSTEM
// All layers from FURTHEST (back) to CLOSEST (front)
// ============================================================
//
// The game uses two z-index contexts:
//   1. GAME FRAME (.game-frame) - contains all game content
//   2. BODY PORTAL (document.body) - tooltips only
//
// Within .game-frame, the ornate border frame (::after) sits
// at UI_FRAME (10500). Anything that must appear ABOVE the
// frame border needs a z-index > 10500.
//
// Each screen (WorldMap, BattleScreen, Scenes) uses its own
// sub-range within the game frame context. Since screens never
// coexist, their internal layers don't conflict.
// ============================================================

// ─── LAYER 1: BACKGROUNDS (0) ──────────────────────────────
// Map terrain, battle/scene backgrounds, video bg
export const BACKGROUND = 0;

// ─── LAYER 2: TERRAIN & ENVIRONMENT (1–4) ──────────────────
// Day/night, terrain SVG, roads, rivers, connection lines
export const DAY_NIGHT = 1;
export const TERRAIN_SVG = 1;
export const CONNECTIONS = 1;
export const REGION_LABELS = 2;
export const ROADS = 2;
export const LANDMARKS = 3;
export const MAP_EFFECTS = 4;

// ─── LAYER 3: MAP OBJECTS (5–9) ────────────────────────────
// Nodes, cities, hero sprite on world map
export const NODES = 5;
export const CITIES = 5;
export const HERO_SPRITE = 6;
export const MAP_EVENTS = 7;
export const SELECTED_NODE = 10;

// ─── LAYER 4: MAP INFO (12–16) ─────────────────────────────
// Hover info panels, HUD elements on world map
export const MAP_TOOLTIPS = 12;
export const HUD_PANELS = 14;
export const HUD_BUTTONS = 15;
export const HUD_SIDE = 16;

// ─── LAYER 5: MAP DEV TOOLS (30–40) ────────────────────────
export const MAP_DEV_TOOLBAR = 30;
export const MAP_DEV_MENUS = 40;

// ─── LAYER 6: MAP POPUPS & OVERLAYS (50–100) ───────────────
export const MAP_POPUPS = 50;
export const MAP_HOVER_INFO = 60;
export const MAP_BATTLE_OVERLAY = 100;

// ─── LAYER 7: SCENE INTERNALS (5–50) ──────────────────────
// Used inside CampScene, DungeonScene, TradingPost, etc.
// These are relative within each scene component.
export const SCENE = {
  AMBIENT_FX: 5,
  PATHS: 5,
  HEADER: 20,
  NODE_GLOW: 12,
  NODES: 15,
  HERO: 12,
  LABELS: 10,
  BACK_BUTTON: 30,
  POPUP: 50,
  TOOLTIP: 40,
};

// ─── LAYER 8: BATTLE INTERNALS (0–500) ─────────────────────
// Used inside BattleScreen. Relative within battle container.
export const BATTLE = {
  BACKGROUND: 0,
  ARENA: 1,
  HEADER: 10,
  UNIT_BASE: 0,
  UNIT_EFFECTS: 15,
  UNIT_BARS: 20,
  UNIT_STATUS: 25,
  PARTICLES: 50,
  DAMAGE_NUMBERS: 100,
  VFX_LAYER: 150,
  ACTION_BAR: 200,
  EFFECT_BEAMS: 210,
  EFFECT_SPRITES: 250,
  EFFECT_FLASH: 260,
  RESULT_OVERLAY: 300,
  ADMIN_CONTROLS: 500,
};

// ─── LAYER 9: BOSS WALKUP SCENE (5–30) ────────────────────
export const BOSS_WALKUP = {
  AMBIENT: 5,
  HERO: 10,
  BOSS: 12,
  DIALOGUE: 20,
  TEXT: 30,
  SKIP_BUTTON: 30,
};

// ─── LAYER 10: CHAT BUBBLES (9500+) ────────────────────────
// Speech bubbles on world map, just below frame
export const CHAT_BUBBLES = 9500;

// ─── LAYER 11: LOADING SCREEN (9998) ───────────────────────
export const LOADING_SCREEN = 9998;

// ─── LAYER 12: FULL-SCREEN OVERLAYS (9998–9999) ────────────
// Loot popup, hero create modal, intro cinematic
export const LOOT_POPUP = 9998;
export const HERO_CREATE_MODAL = 9999;

// ─── LAYER 13: SETTINGS & ADMIN (9990–9999) ────────────────
export const SETTINGS_BUTTON = 9990;
export const SETTINGS_PANEL = 9991;
export const ADMIN_GIZMO = 9998;
export const ADMIN_GIZMO_PANEL = 9993;
export const ADMIN_GIZMO_BUTTON = 10008;

// ─── LAYER 14: MAP BOTTOM BAR & POPUPS (10000–10100) ───────
// Bottom bar sits just below frame, popups just above
export const BOTTOM_BAR = 10000;
export const BOTTOM_BAR_POPUPS = 10100;

// ─── LAYER 15: UI FRAME BORDER (10500) ─────────────────────
// The ornate fantasy border. Set via CSS custom property.
// Everything below this is "inside" the frame.
// Everything above this appears "on top of" the frame.
export const UI_FRAME = 10500;

// ─── LAYER 16: ABOVE-FRAME UI (10501–10502) ────────────────
// Frame editor mask and controls that overlay the frame itself
export const FRAME_MASK = 10501;
export const FRAME_EDITOR = 10502;

// ─── LAYER 17: INTRO CINEMATIC (10600) ─────────────────────
export const INTRO_CINEMATIC = 10600;

// ─── LAYER 18: TOOLTIPS (99999) ────────────────────────────
// Portaled to document.body – outside .game-frame context
export const TOOLTIP = 99999;

// ─── LAYER 19: DEV DEBUG (99999) ───────────────────────────
export const DEBUG_GRID = 999;
export const DEV_DRAGGING = 999;

// ─── CONVENIENCE: Legacy MAP_LAYERS compatibility ──────────
// Drop-in replacement for mapConstants.js MAP_LAYERS
export const MAP_LAYERS = {
  TERRAIN_FILL: BACKGROUND,
  DAY_NIGHT,
  TERRAIN_SVG,
  CONNECTION_LINES: CONNECTIONS,
  REGION_LABELS,
  ROADS,
  LANDMARKS,
  EFFECTS: MAP_EFFECTS,
  NODES,
  CITIES,
  HERO: HERO_SPRITE,
  EVENTS: MAP_EVENTS,
  SELECTED: SELECTED_NODE,
  TOOLTIPS: MAP_TOOLTIPS,
  HUD_PANELS,
  HUD_BUTTONS,
  HUD_SIDE,
  DEV_TOOLBAR: MAP_DEV_TOOLBAR,
  DEV_MENUS: MAP_DEV_MENUS,
  POPUPS: MAP_POPUPS,
  HOVER_INFO: MAP_HOVER_INFO,
  BATTLE_OVERLAY: MAP_BATTLE_OVERLAY,
  DEBUG_GRID,
  DEV_DRAGGING,
};
