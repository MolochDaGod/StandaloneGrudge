const VIDEOS = [
  '/videos/bg-clear.mp4',
  '/videos/bg-blur.mp4',
  '/videos/loading.mp4',
];

const CRITICAL_IMAGES = [
  '/sprites/knight/idle.png',
  '/sprites/priest/idle.png',
  '/sprites/orc-rider/idle.png',
  '/sprites/archer/idle.png',
];

const BACKGROUND_IMAGES = [
  '/backgrounds/verdant_plains.png',
  '/backgrounds/dark_forest.png',
  '/backgrounds/blood_canyon.png',
  '/backgrounds/cursed_ruins.png',
  '/backgrounds/dragon_peaks.png',
  '/backgrounds/shadow_citadel.png',
  '/backgrounds/demon_gate.png',
  '/backgrounds/void_throne.png',
];

const videoCache = {};
const imageCache = {};
let ready = false;
let loadPromise = null;
let progressCallback = null;

function loadVideo(src) {
  return new Promise((resolve) => {
    if (videoCache[src]) {
      resolve(videoCache[src]);
      return;
    }
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.src = src;

    const done = () => {
      videoCache[src] = video;
      resolve(video);
    };

    video.addEventListener('canplaythrough', done, { once: true });
    video.addEventListener('error', done, { once: true });
    video.load();

    setTimeout(done, 8000);
  });
}

function loadImage(src) {
  return new Promise((resolve) => {
    if (imageCache[src]) {
      resolve(imageCache[src]);
      return;
    }
    const img = new Image();
    const done = () => {
      imageCache[src] = img;
      resolve(img);
    };
    img.onload = done;
    img.onerror = done;
    img.src = src;

    setTimeout(done, 8000);
  });
}

export function startPreload(onProgress) {
  if (loadPromise) {
    progressCallback = onProgress;
    return loadPromise;
  }

  progressCallback = onProgress;

  const allAssets = [...VIDEOS, ...CRITICAL_IMAGES, ...BACKGROUND_IMAGES];
  const total = allAssets.length;
  let loaded = 0;

  const tick = () => {
    loaded++;
    if (progressCallback) progressCallback(loaded, total);
  };

  loadPromise = Promise.all([
    ...VIDEOS.map(src => loadVideo(src).then(tick)),
    ...CRITICAL_IMAGES.map(src => loadImage(src).then(tick)),
    ...BACKGROUND_IMAGES.map(src => loadImage(src).then(tick)),
  ]).then(() => {
    ready = true;
  });

  return loadPromise;
}

export function createVideoElement(src) {
  const original = videoCache[src];
  if (!original) return null;

  const clone = original.cloneNode(true);
  clone.muted = true;
  clone.loop = true;
  clone.playsInline = true;
  return clone;
}

export function isReady() {
  return ready;
}

export function getLoadPromise() {
  return loadPromise;
}
