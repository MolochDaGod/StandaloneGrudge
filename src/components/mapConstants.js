export const MAP_LAYERS = {
  TERRAIN_FILL:     0,
  DAY_NIGHT:        1,
  TERRAIN_SVG:      1,
  CONNECTION_LINES: 1,
  REGION_LABELS:    2,
  ROADS:            2,
  LANDMARKS:        3,
  EFFECTS:          4,
  NODES:            5,
  CITIES:           5,
  HERO:             6,
  EVENTS:           7,
  SELECTED:        10,
  TOOLTIPS:        12,
  HUD_PANELS:      14,
  HUD_BUTTONS:     15,
  HUD_SIDE:        16,
  DEV_TOOLBAR:     30,
  DEV_MENUS:       40,
  POPUPS:          50,
  HOVER_INFO:      60,
  BATTLE_OVERLAY: 100,
  DEBUG_GRID:     999,
  DEV_DRAGGING:   999,
};

export const SVG_OVERLAY_STYLE = {
  position: 'absolute',
  top: 0, left: 0,
  width: '100%', height: '100%',
  pointerEvents: 'none',
};

export function svgOverlayProps(zIndex) {
  return {
    viewBox: '0 0 100 100',
    preserveAspectRatio: 'none',
    style: { ...SVG_OVERLAY_STYLE, zIndex },
  };
}

export function mapNodeStyle(pos, scale, zIndex, extra = {}) {
  return {
    position: 'absolute',
    left: `${pos.x}%`,
    top: `${pos.y}%`,
    transform: `translate(-50%, -50%) scale(${scale})`,
    zIndex,
    ...extra,
  };
}

export function mapCenterStyle(pos, zIndex, extra = {}) {
  return {
    position: 'absolute',
    left: `${pos.x}%`,
    top: `${pos.y}%`,
    transform: 'translate(-50%, -50%)',
    zIndex,
    ...extra,
  };
}

export function fullCoverStyle(zIndex, extra = {}) {
  return {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    pointerEvents: 'none',
    zIndex,
    ...extra,
  };
}

export function nodeScale(camZoom, min = 0.3) {
  return Math.max(min, 1 / camZoom);
}
