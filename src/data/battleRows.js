export const PLAYER_ROWS = {
  protection: {
    id: 'protection',
    name: 'Protection Pocket',
    icon: 'shield',
    index: 0,
    description: 'Defensive stance. +Evasion, +Block, but -Damage, -Crit, -Accuracy.',
    modifiers: {
      evasionBonus: 12,
      blockBonus: 10,
      damageMult: 0.8,
      critMult: 0.7,
      accuracyPenalty: 10,
    },
  },
  battle: {
    id: 'battle',
    name: 'Battle Line',
    icon: 'crossed_swords',
    index: 1,
    description: 'Standard combat position. No bonuses or penalties.',
    modifiers: {},
  },
  back: {
    id: 'back',
    name: 'Back Row',
    icon: 'bow',
    index: 2,
    description: 'Rear position. +Speed, ranged counter vs melee. Melee attacks from here lose accuracy.',
    modifiers: {
      speedBonus: 4,
      meleeAccuracyPenalty: 15,
      rangedCounterChance: 25,
    },
  },
};

export const ENEMY_ROWS = {
  vanguard: {
    id: 'vanguard',
    name: 'Vanguard',
    icon: 'crossed_swords',
    index: 0,
    description: 'Front-line enemy position.',
    modifiers: {},
  },
  formation: {
    id: 'formation',
    name: 'Formation',
    icon: 'shield',
    index: 1,
    description: 'Standard enemy position. Bosses command from here.',
    modifiers: {
      defenseBonus: 5,
    },
  },
  charge: {
    id: 'charge',
    name: 'Charge',
    icon: 'skull',
    index: 2,
    description: 'Aggressive assault. +Damage, +Crit, but -Defense, -Block.',
    modifiers: {
      damageMult: 1.25,
      critBonus: 10,
      defenseMult: 0.7,
      blockPenalty: 10,
    },
  },
};

export const RANGED_WEAPON_TYPES = ['bow', 'crossbow', 'gun', 'staff', 'tome'];

export function isUnitRanged(unit) {
  if (unit.classId === 'ranger' || unit.classId === 'mage') return true;
  const wt = unit.weaponType;
  if (wt && RANGED_WEAPON_TYPES.includes(wt)) return true;
  if (unit.templateId === 'dark_mage' || unit.templateId === 'lich') return true;
  if (unit.templateId === 'water_elemental' || unit.templateId === 'nature_elemental') return true;
  if (unit.templateId === 'corrupted_grove_keeper') return true;
  return false;
}

export function getRowModifiers(unit) {
  if (!unit.row) return {};
  if (unit.team === 'player') {
    return PLAYER_ROWS[unit.row]?.modifiers || {};
  }
  return ENEMY_ROWS[unit.row]?.modifiers || {};
}

export function getRowConfig(unit) {
  if (!unit.row) return null;
  if (unit.team === 'player') return PLAYER_ROWS[unit.row] || null;
  return ENEMY_ROWS[unit.row] || null;
}

export function getRowName(unit) {
  const cfg = getRowConfig(unit);
  return cfg?.name || 'Unknown';
}

export function getDefaultRow(unit) {
  if (unit.team === 'player') {
    if (isUnitRanged(unit)) return 'back';
    return 'battle';
  }
  if (unit.isBoss) return 'formation';
  return 'vanguard';
}

export function getAdjacentRows(unit) {
  const rows = unit.team === 'player'
    ? ['protection', 'battle', 'back']
    : ['vanguard', 'formation', 'charge'];
  const currentIndex = rows.indexOf(unit.row);
  if (currentIndex === -1) return [];
  const adjacent = [];
  if (currentIndex > 0) adjacent.push(rows[currentIndex - 1]);
  if (currentIndex < rows.length - 1) adjacent.push(rows[currentIndex + 1]);
  return adjacent;
}

export function getRowPositions(units, side) {
  const rows = side === 'player'
    ? ['protection', 'battle', 'back']
    : ['charge', 'vanguard', 'formation'];

  const rowUnits = {};
  rows.forEach(r => { rowUnits[r] = []; });
  units.forEach(u => {
    const row = u.row || (side === 'player' ? 'battle' : 'vanguard');
    if (rowUnits[row]) rowUnits[row].push(u);
  });

  const positions = {};

  if (side === 'player') {
    const rowXBase = { protection: 22, battle: 32, back: 18 };
    const rowYBase = { protection: 88, battle: 88, back: 88 };
    rows.forEach(row => {
      const ru = rowUnits[row];
      const xBase = rowXBase[row];
      const yBase = rowYBase[row];
      ru.forEach((u, i) => {
        const ySpread = ru.length > 1 ? (i - (ru.length - 1) / 2) * 10 : 0;
        positions[u.id] = { x: xBase, y: yBase + ySpread };
      });
    });
  } else {
    const rowXBase = { charge: 55, vanguard: 65, formation: 74 };
    const rowYBase = { charge: 88, vanguard: 88, formation: 88 };
    rows.forEach(row => {
      const ru = rowUnits[row];
      const xBase = rowXBase[row];
      const yBase = rowYBase[row];
      ru.forEach((u, i) => {
        const ySpread = ru.length > 1 ? (i - (ru.length - 1) / 2) * 10 : 0;
        positions[u.id] = { x: xBase, y: yBase + ySpread };
      });
    });
  }

  return positions;
}

export function applyRowCombatModifiers(attacker, defender, ability, result) {
  const atkMods = getRowModifiers(attacker);
  const defMods = getRowModifiers(defender);
  const atkRanged = isUnitRanged(attacker);
  const isPhysical = ability?.type === 'physical';
  const isMagic = ability?.type === 'magical';

  if (!isPhysical && !isMagic) return result;

  let { totalDmg, isCrit, blocked, evaded } = result;

  let evasionBonus = 0;
  if (defMods.evasionBonus) evasionBonus += defMods.evasionBonus;

  if (!evaded && evasionBonus > 0) {
    if (Math.random() * 100 < evasionBonus) {
      return { ...result, totalDmg: 0, evaded: true, rowEvaded: true };
    }
  }

  let blockBonus = 0;
  if (defMods.blockBonus) blockBonus += defMods.blockBonus;
  if (atkMods.blockPenalty) blockBonus -= atkMods.blockPenalty;

  if (!blocked && !evaded && blockBonus > 0) {
    if (Math.random() * 100 < blockBonus) {
      totalDmg = Math.floor(totalDmg * 0.4);
      blocked = true;
      result.rowBlocked = true;
    }
  }

  if (atkMods.damageMult) {
    totalDmg = Math.floor(totalDmg * atkMods.damageMult);
  }
  if (atkMods.critMult && isCrit) {
    const critReduction = 1 - atkMods.critMult;
    totalDmg = Math.floor(totalDmg * (1 - critReduction * 0.5));
  }

  if (defMods.defenseMult) {
    totalDmg = Math.floor(totalDmg / defMods.defenseMult);
  }

  if (!atkRanged && atkMods.meleeAccuracyPenalty && isPhysical) {
    if (Math.random() * 100 < atkMods.meleeAccuracyPenalty) {
      return { ...result, totalDmg: 0, evaded: true, rowMiss: true };
    }
  }

  if (atkMods.accuracyPenalty && !evaded) {
    if (Math.random() * 100 < atkMods.accuracyPenalty) {
      return { ...result, totalDmg: 0, evaded: true, rowMiss: true };
    }
  }

  totalDmg = Math.max(1, totalDmg);

  return { ...result, totalDmg, isCrit, blocked, evaded };
}

export function shouldBossShiftRow(boss) {
  if (!boss.isBoss) return null;
  const hpPercent = boss.health / boss.maxHealth;

  if (hpPercent < 0.3 && boss.row === 'charge') {
    return 'formation';
  }
  if (hpPercent < 0.6 && hpPercent >= 0.3 && boss.row !== 'charge') {
    return 'charge';
  }
  return null;
}

export function getAIRowPreference(unit, allUnits) {
  const hpPercent = unit.health / unit.maxHealth;
  const ranged = isUnitRanged(unit);

  if (unit.isBoss) {
    return shouldBossShiftRow(unit);
  }

  if (hpPercent < 0.3 && unit.row === 'vanguard') {
    return 'formation';
  }

  if (ranged && unit.row === 'vanguard') {
    return Math.random() < 0.3 ? 'formation' : null;
  }

  if (!ranged && unit.row === 'formation' && hpPercent > 0.6) {
    return Math.random() < 0.3 ? 'vanguard' : null;
  }

  return null;
}
