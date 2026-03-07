export const REF_W = 1280;
export const REF_H = 720;
export const REF_ASPECT = REF_W / REF_H;

export const MIN_W = 800;
export const MIN_H = 450;
export const MAX_W = 2560;
export const MAX_H = 1440;

export function getGameScale(containerW, containerH) {
  const scaleX = containerW / REF_W;
  const scaleY = containerH / REF_H;
  return Math.min(scaleX, scaleY);
}

export function refToPercent(refX, refY) {
  return {
    x: (refX / REF_W) * 100,
    y: (refY / REF_H) * 100,
  };
}

export function percentToRef(pctX, pctY) {
  return {
    x: (pctX / 100) * REF_W,
    y: (pctY / 100) * REF_H,
  };
}

export function refToPx(refX, refY, containerW, containerH) {
  const scale = getGameScale(containerW, containerH);
  return {
    x: refX * scale,
    y: refY * scale,
  };
}

export function pxToPercent(px, containerDimension) {
  if (!containerDimension) return 0;
  return (px / containerDimension) * 100;
}

export function scaledSize(refSize, containerW, containerH) {
  const scale = getGameScale(containerW, containerH);
  return Math.round(refSize * scale);
}

export function clampGameDimensions(viewportW, viewportH) {
  const aspect = REF_ASPECT;
  let w = viewportW;
  let h = viewportH;

  const viewAspect = w / h;
  if (viewAspect > aspect) {
    w = Math.round(h * aspect);
  } else if (viewAspect < aspect) {
    h = Math.round(w / aspect);
  }

  w = Math.max(MIN_W, Math.min(MAX_W, w));
  h = Math.max(MIN_H, Math.min(MAX_H, h));

  return { w, h };
}

export function getContainerVars(containerW, containerH) {
  const scale = getGameScale(containerW, containerH);
  const clamped = clampGameDimensions(containerW, containerH);
  return {
    '--game-scale': scale.toFixed(4),
    '--game-w': `${clamped.w}px`,
    '--game-h': `${clamped.h}px`,
    '--game-ref-w': `${REF_W}px`,
    '--game-ref-h': `${REF_H}px`,
    '--game-scale-px': `${scale}px`,
    '--ui-scale': Math.max(0.6, Math.min(1.2, scale)).toFixed(4),
    '--font-scale': Math.max(0.7, Math.min(1.15, scale)).toFixed(4),
  };
}
