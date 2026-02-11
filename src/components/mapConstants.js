import { MAP_LAYERS } from '../constants/layers';

export { MAP_LAYERS };

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
