const EVENT_TEMPLATES = [
  {
    id: 'treasure_goblin', name: 'Treasure Goblin',
    icon: 'gold', description: 'A treasure-hoarding goblin has appeared!',
    rewardType: 'gold', rewardMultiplier: 3.0,
    enemyCount: 1, color: '#fbbf24',
    mapSprite: 'goblin',
  },
  {
    id: 'elite_patrol', name: 'Elite Patrol',
    icon: 'crossed_swords', description: 'An elite enemy patrol is passing through.',
    rewardType: 'xp', rewardMultiplier: 2.5,
    enemyCount: 2, color: '#ef4444',
    mapSprite: 'orc',
  },
  {
    id: 'wandering_merchant', name: 'Ambushed Merchant',
    icon: 'shield', description: 'A merchant is under attack! Save them for bonus loot.',
    rewardType: 'loot', rewardMultiplier: 2.0,
    enemyCount: 2, color: '#a78bfa',
    mapSprite: 'bandit',
  },
  {
    id: 'dark_rift', name: 'Dark Rift',
    icon: 'chaos', description: 'A dark rift has torn open, spewing enemies!',
    rewardType: 'xp', rewardMultiplier: 3.0,
    enemyCount: 3, color: '#c084fc',
    mapSprite: 'void_walker',
  },
  {
    id: 'bounty_target', name: 'Bounty Target',
    icon: 'target', description: 'A wanted criminal has been spotted nearby!',
    rewardType: 'gold', rewardMultiplier: 2.5,
    enemyCount: 1, color: '#f97316',
    mapSprite: 'rogue',
  },
  {
    id: 'crystal_formation', name: 'Crystal Formation',
    icon: 'crystal', description: 'Rare crystals are growing here... but guarded!',
    rewardType: 'materials', rewardMultiplier: 4.0,
    enemyCount: 2, color: '#22d3ee',
    mapSprite: 'crystal_golem',
  },
  {
    id: 'ancient_chest', name: 'Ancient Chest',
    icon: 'gold', description: 'An ancient chest has surfaced, guarded by spirits.',
    rewardType: 'loot', rewardMultiplier: 3.0,
    enemyCount: 2, color: '#fcd34d',
    mapSprite: 'skeleton',
  },
  {
    id: 'herb_patch', name: 'Rare Herb Patch',
    icon: 'nature', description: 'Rare healing herbs are blooming, but creatures lurk!',
    rewardType: 'potions', rewardMultiplier: 2.0,
    enemyCount: 1, color: '#4ade80',
    mapSprite: 'slime',
  },
];

export function generateRandomEvent(playerLevel, unlockedLocationIds, existingEvents) {
  const existingLocationIds = (existingEvents || []).map(e => e.locationId);

  const availableLocations = unlockedLocationIds.filter(
    id => !existingLocationIds.includes(id)
  );

  if (availableLocations.length === 0) return null;

  const locationId = availableLocations[Math.floor(Math.random() * availableLocations.length)];

  const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];

  const eventLevel = Math.max(1, playerLevel + Math.floor(Math.random() * 3) - 1);

  const baseGold = 20 + eventLevel * 8;
  const baseXp = 15 + eventLevel * 12;

  let rewards = {};
  switch (template.rewardType) {
    case 'gold':
      rewards = { gold: Math.floor(baseGold * template.rewardMultiplier), xp: baseXp };
      break;
    case 'xp':
      rewards = { gold: baseGold, xp: Math.floor(baseXp * template.rewardMultiplier) };
      break;
    case 'loot':
      rewards = { gold: baseGold, xp: baseXp, bonusLootTier: 1 };
      break;
    case 'materials':
      rewards = { gold: baseGold, xp: baseXp, materials: Math.floor(5 * template.rewardMultiplier) };
      break;
    case 'potions':
      rewards = { gold: baseGold, xp: baseXp, potions: Math.floor(2 * template.rewardMultiplier) };
      break;
    default:
      rewards = { gold: baseGold, xp: baseXp };
  }

  return {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    templateId: template.id,
    name: template.name,
    icon: template.icon,
    description: template.description,
    color: template.color,
    locationId,
    level: eventLevel,
    enemyCount: template.enemyCount,
    mapSprite: template.mapSprite,
    rewards,
    rewardType: template.rewardType,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000,
  };
}

export function getRewardDescription(event) {
  const parts = [];
  if (event.rewards.gold) parts.push(`${event.rewards.gold}g`);
  if (event.rewards.xp) parts.push(`${event.rewards.xp} XP`);
  if (event.rewards.bonusLootTier) parts.push('Bonus Loot');
  if (event.rewards.materials) parts.push(`${event.rewards.materials} Materials`);
  if (event.rewards.potions) parts.push(`${event.rewards.potions} Potions`);
  return parts.join('  ');
}

export { EVENT_TEMPLATES };
