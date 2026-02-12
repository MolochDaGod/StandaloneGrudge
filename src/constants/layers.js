// ============================================================
// GAME Z-INDEX LAYER SYSTEM
// All layers from FURTHEST (back) to CLOSEST (front)
// ============================================================
//
// The game uses two z-index contexts:
//   1. GAME FRAME (.game-frame) - contains all game content
//   2. BODY PORTAL (document.body) - tooltips only
//
// Within .game-frame, the content wrapper in App.jsx is at
// z-index 10501. The ornate border frame (::after) sits at
// UI_FRAME (10505), ABOVE the content so it overlays the
// viewport edges. Internal screen z-indices (map layers,
// battle layers, scene layers) are relative within the
// content wrapper's stacking context.
//
// Overlays (Settings, LootPopup, AdminGizmo) render as siblings
// of the content wrapper and use elevated z-indices (10510+).
//
// Each screen (WorldMap, BattleScreen, Scenes) uses its own
// sub-range within the content wrapper. Since screens never
// coexist, their internal layers don't conflict.
//
// INSIDE content wrapper (relative z-indices):
//   Layers 1-10: Map/scene/battle internals, BOTTOM_BAR
// OUTSIDE content wrapper (absolute z-indices):
//   Settings (10510+), Admin (10515+), Loot (10520+),
//   HeroCreate (10525), Intro (10800), Tooltip (99999)
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
// Content wrapper is at z-index 10501, so these are relative within it
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

// ─── LAYER 10: CHAT BUBBLES (9500) ─────────────────────────
// Speech bubbles on world map, above all map elements
export const CHAT_BUBBLES = 9500;

// ─── LAYER 11: LOADING SCREEN (10505) ──────────────────────
export const LOADING_SCREEN = 10505;

// ─── LAYER 12: FULL-SCREEN OVERLAYS (10520–10530) ──────────
// Loot popup, hero create modal — above frame and settings
export const LOOT_POPUP = 10520;
export const HERO_CREATE_MODAL = 10525;

// ─── LAYER 13: SETTINGS & ADMIN (10510–10520) ──────────────
// Settings and admin UI must appear above the frame border
export const SETTINGS_BUTTON = 10510;
export const SETTINGS_PANEL = 10511;
export const ADMIN_GIZMO = 10515;
export const ADMIN_GIZMO_PANEL = 10516;
export const ADMIN_GIZMO_BUTTON = 10518;

// ─── LAYER 14: MAP BOTTOM BAR & POPUPS (10600–10700) ───────
// MapBottomBar portals into #game-ui-portal (z-index 10600),
// rendering OUTSIDE the content wrapper so it sits ABOVE the
// frame border. Internal z-indices are relative within that portal.
export const BOTTOM_BAR = 10600;
export const BOTTOM_BAR_POPUPS = 10700;

// ─── LAYER 15: UI FRAME BORDER (10500) ─────────────────────
// The ornate fantasy border. Set via CSS custom property.
// Everything below this is "inside" the frame.
// Everything above this appears "on top of" the frame.
export const UI_FRAME = 10505;

// ─── LAYER 16: ABOVE-FRAME UI (10501–10502) ────────────────
// Frame editor mask and controls that overlay the frame itself
export const FRAME_MASK = 10501;
export const FRAME_EDITOR = 10502;

// ─── LAYER 17: INTRO CINEMATIC (10800) ─────────────────────
export const INTRO_CINEMATIC = 10800;

// ─── LAYER 18: CONTEXT MENU (99998) ────────────────────────
// Right-click game context menu, portaled to document.body
export const CONTEXT_MENU = 99998;

// ─── LAYER 19: TOOLTIPS (99999) ────────────────────────────
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
