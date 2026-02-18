const REGION_WALK_KEY = 'grudge_region_walks_seen';

export const REGIONS = {
  green: {
    bg: '/backgrounds/wc_green.png',
    title: 'The Verdant Wilds',
    subtitle: 'Where Ancient Roots Run Deep',
    entryFrom: { x: -10, y: 88 },
    pauseAt: { x: 22, y: 70 },
    walkTo: { x: 50, y: 38 },
    endScale: 0.4,
    pauseScale: 1.0,
    flipAtPause: false,
    tint: 'rgba(30,80,30,0.15)',
  },
  gold: {
    bg: '/backgrounds/wc_gold.png',
    title: 'The Iron Highlands',
    subtitle: 'Where Empires Crumble to Dust',
    entryFrom: { x: -10, y: 90 },
    pauseAt: { x: 28, y: 68 },
    walkTo: { x: 55, y: 35 },
    endScale: 0.35,
    pauseScale: 1.0,
    flipAtPause: false,
    tint: 'rgba(120,90,20,0.12)',
  },
  blue: {
    bg: '/backgrounds/wc_blue.png',
    title: 'The Frozen Reaches',
    subtitle: 'Where the Wind Howls Your Name',
    entryFrom: { x: 110, y: 90 },
    pauseAt: { x: 65, y: 68 },
    walkTo: { x: 45, y: 32 },
    endScale: 0.35,
    pauseScale: 1.0,
    flipAtPause: true,
    tint: 'rgba(40,60,120,0.15)',
  },
  red: {
    bg: '/backgrounds/wc_red.png',
    title: 'The Scorched Lands',
    subtitle: 'Where Fire Consumes All',
    entryFrom: { x: -10, y: 92 },
    pauseAt: { x: 25, y: 72 },
    walkTo: { x: 48, y: 40 },
    endScale: 0.35,
    pauseScale: 1.0,
    flipAtPause: false,
    tint: 'rgba(120,30,0,0.15)',
  },
  purple: {
    bg: '/backgrounds/wc_purple.png',
    title: 'The Void Expanse',
    subtitle: 'Where Reality Unravels',
    entryFrom: { x: -10, y: 88 },
    pauseAt: { x: 30, y: 65 },
    walkTo: { x: 52, y: 30 },
    endScale: 0.3,
    pauseScale: 1.0,
    flipAtPause: false,
    tint: 'rgba(80,20,120,0.15)',
  },
};

export const ZONE_TO_REGION = {
  verdant_plains: 'green',
  dark_forest: 'green',
  mystic_grove: 'green',
  whispering_caverns: 'green',
  haunted_marsh: 'green',
  cursed_ruins: 'green',
  crystal_caves: 'green',
  thornwood_pass: 'green',
  sunken_temple: 'green',

  iron_peaks: 'gold',
  shadow_forest: 'gold',
  blood_canyon: 'gold',
  dragon_peaks: 'gold',
  frozen_tundra: 'gold',

  windswept_ridge: 'blue',
  blight_hollow: 'blue',
  stormspire_peak: 'blue',

  ashen_battlefield: 'red',
  molten_core: 'red',
  obsidian_wastes: 'red',
  demon_gate: 'red',
  infernal_forge: 'red',
  dreadmaw_canyon: 'red',
  mothers_den: 'red',

  ruins_of_ashenmoor: 'purple',
  shadow_citadel: 'purple',
  abyssal_depths: 'purple',
  void_threshold: 'purple',
  corrupted_spire: 'purple',
  void_throne: 'purple',
  hall_of_odin: 'purple',
  maw_of_madra: 'purple',
  sanctum_of_omni: 'purple',
};

export function getRegionForZone(zoneId) {
  return ZONE_TO_REGION[zoneId] || null;
}

export function needsRegionWalk(zoneId) {
  const region = ZONE_TO_REGION[zoneId];
  if (!region) return false;
  try {
    const seen = JSON.parse(localStorage.getItem(REGION_WALK_KEY) || '{}');
    return !seen[region];
  } catch { return false; }
}

export function markRegionWalkSeen(regionId) {
  try {
    const seen = JSON.parse(localStorage.getItem(REGION_WALK_KEY) || '{}');
    seen[regionId] = true;
    localStorage.setItem(REGION_WALK_KEY, JSON.stringify(seen));
  } catch {}
}
