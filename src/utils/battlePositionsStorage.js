const STORAGE_KEY = 'grudge_battle_positions';

export function loadBattlePositions() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
}

export function saveBattlePositions(positions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

export function getSavedBattleRow(heroId) {
  const positions = loadBattlePositions();
  return positions[heroId] || null;
}

export function getSavedBattleColumn(heroId) {
  const positions = loadBattlePositions();
  return positions[`${heroId}_col`] || null;
}
