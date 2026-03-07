const KEYS = {
  formations: 'adminBattleFormations',
  spriteLayout: 'adminBattleSpriteLayout',
  actionBar: 'adminBattleActionBar',
  zones: 'adminBattleZones',
  effectPositions: 'adminEffectPositions',
  mapPositions: 'adminMapPositions',
  spriteLayers: 'adminEffectLayers',
  spriteEditorLayout: 'adminSpriteLayout',
  pvpPlacements: 'grudge-admin-pvp-placements',
  spriteOverrides: 'adminSpriteOverrides',
  bearFormOverride: 'adminBearFormOverride',
  transformOverrides: 'adminTransformOverrides',
  dummyPosition: 'adminDummyPosition',
};

const DEFAULTS = {
  formations: {
    player: {
      1: [{x:35,y:90}],
      2: [{x:32,y:86},{x:38,y:94}],
      3: [{x:30,y:82},{x:36,y:90},{x:32,y:97}],
    },
    enemy: {
      1: [{x:65,y:90}],
      2: [{x:68,y:86},{x:62,y:94}],
      3: [{x:72,y:88},{x:62,y:82},{x:64,y:96}],
      4: [{x:72,y:86},{x:60,y:78},{x:62,y:92},{x:64,y:99}],
    }
  },
  effectPositions: {
    stun: { offsetY: -40, size: 30, opacity: 0.75 },
    poison: { offsetY: -36, size: 28, opacity: 0.7 },
    dot: { offsetY: -36, size: 30, opacity: 0.7 },
    buff: { offsetY: -44, size: 24, opacity: 0.6 },
    nameplate: { offsetY: -30 },
  },
  spriteLayout: {
    shadow: { offsetY: 0, width: 40, height: 8 },
    nameplate: { offsetY: 0 },
    healthBar: { width: 50, height: 4 },
    manaBar: { width: 23, height: 2 },
    staminaBar: { width: 23, height: 2 },
    grudgeBar: { width: 50, height: 3 },
  },
  actionBar: {
    leftPanelWidth: 140,
    rightPanelWidth: 140,
    playerBarWidth: 128,
    playerBarHeight: 5,
    playerManaWidth: 62,
    playerManaHeight: 3,
    playerStaminaWidth: 62,
    playerStaminaHeight: 3,
    playerGrudgeWidth: 128,
    playerGrudgeHeight: 3,
    enemyBarWidth: 128,
    enemyBarHeight: 5,
    enemyManaWidth: 62,
    enemyManaHeight: 3,
    enemyStaminaWidth: 62,
    enemyStaminaHeight: 3,
    enemyGrudgeWidth: 128,
    enemyGrudgeHeight: 3,
  },
};

function load(key) {
  try {
    const raw = localStorage.getItem(KEYS[key]);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(KEYS[key], JSON.stringify(data));
  } catch {}
}

function remove(key) {
  try {
    localStorage.removeItem(KEYS[key]);
  } catch {}
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const k of Object.keys(source)) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])
        && target[k] && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      result[k] = deepMerge(target[k], source[k]);
    } else {
      result[k] = source[k];
    }
  }
  return result;
}

function getWithDefaults(key) {
  const saved = load(key);
  const defaults = DEFAULTS[key];
  if (!defaults) return saved;
  if (!saved) return JSON.parse(JSON.stringify(defaults));
  return deepMerge(JSON.parse(JSON.stringify(defaults)), saved);
}

export const adminConfig = {
  KEYS,
  DEFAULTS,

  getFormations() {
    return getWithDefaults('formations');
  },
  saveFormations(data) {
    save('formations', data);
  },

  getEffectPositions() {
    return getWithDefaults('effectPositions');
  },
  saveEffectPositions(data) {
    save('effectPositions', data);
  },

  getSpriteLayout() {
    return getWithDefaults('spriteLayout');
  },
  saveSpriteLayout(data) {
    save('spriteLayout', data);
  },

  getActionBar() {
    return getWithDefaults('actionBar');
  },
  saveActionBar(data) {
    save('actionBar', data);
  },

  getZones() {
    return load('zones');
  },
  saveZones(data) {
    save('zones', data);
  },

  getMapPositions() {
    return load('mapPositions');
  },
  saveMapPositions(data) {
    save('mapPositions', data);
  },

  getSpriteLayers() {
    return load('spriteLayers');
  },
  saveSpriteLayers(data) {
    save('spriteLayers', data);
  },

  getSpriteEditorLayout() {
    return load('spriteEditorLayout');
  },
  saveSpriteEditorLayout(data) {
    save('spriteEditorLayout', data);
  },

  getPvpPlacements() {
    return load('pvpPlacements');
  },
  savePvpPlacements(data) {
    save('pvpPlacements', data);
  },

  getSpriteOverrides() {
    return load('spriteOverrides') || {};
  },
  saveSpriteOverrides(data) {
    save('spriteOverrides', data);
  },
  getSpriteOverride(raceId, classId) {
    const all = load('spriteOverrides') || {};
    return all[`${raceId}-${classId}`] || null;
  },
  saveSpriteOverride(raceId, classId, override) {
    const all = load('spriteOverrides') || {};
    if (override) {
      all[`${raceId}-${classId}`] = override;
    } else {
      delete all[`${raceId}-${classId}`];
    }
    save('spriteOverrides', all);
  },
  resetSpriteOverride(raceId, classId) {
    const all = load('spriteOverrides') || {};
    delete all[`${raceId}-${classId}`];
    save('spriteOverrides', all);
  },
  resetAllSpriteOverrides() {
    remove('spriteOverrides');
  },

  getBearFormOverride() {
    return load('bearFormOverride') || { offsetX: 0, offsetY: 0, scale: 1.0 };
  },
  saveBearFormOverride(data) {
    save('bearFormOverride', data);
  },
  resetBearFormOverride() {
    remove('bearFormOverride');
  },

  getTransformOverrides() {
    return load('transformOverrides') || {};
  },
  getTransformOverride(raceId, classId, formId) {
    const all = load('transformOverrides') || {};
    return all[`${raceId}-${classId}-${formId}`] || { offsetX: 0, offsetY: 0, scale: 1.0 };
  },
  saveTransformOverride(raceId, classId, formId, data) {
    const all = load('transformOverrides') || {};
    all[`${raceId}-${classId}-${formId}`] = data;
    save('transformOverrides', all);
  },
  resetTransformOverride(raceId, classId, formId) {
    const all = load('transformOverrides') || {};
    delete all[`${raceId}-${classId}-${formId}`];
    save('transformOverrides', all);
  },
  resetAllTransformOverrides() {
    remove('transformOverrides');
  },

  getDummyPosition() {
    return load('dummyPosition') || { x: 0, y: 0, scale: 5 };
  },
  saveDummyPosition(data) {
    save('dummyPosition', data);
  },
  resetDummyPosition() {
    remove('dummyPosition');
  },

  resetAll() {
    Object.values(KEYS).forEach(k => {
      try { localStorage.removeItem(k); } catch {}
    });
  },

  reset(key) {
    remove(key);
  },

  load,
  save,
};

export default adminConfig;
