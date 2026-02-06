import { create } from 'zustand';
import { calculateStats, TOTAL_POINTS_AT_LEVEL, POINTS_PER_LEVEL, calculateCombatPower } from '../data/attributes';
import { classDefinitions } from '../data/classes';
import { locations, createEnemy } from '../data/enemies';
import { skillTrees } from '../data/skillTrees';

const allyNamePool = {
  warrior: ['Sir Aldric', 'Dame Brenna', 'Rolf', 'Greta'],
  mage: ['Theron', 'Lyra', 'Seraphina', 'Ewan'],
  worg: ['Grukk', 'Snarl', 'Ragnar', 'Ursa'],
  ranger: ['Fenn', 'Elara', 'Hawk', 'Willow'],
};

function createAllyUnit(classId, playerLevel) {
  const cls = classDefinitions[classId];
  if (!cls) return null;
  const names = allyNamePool[classId] || ['Ally'];
  const name = names[Math.floor(Math.random() * names.length)];
  const s = 0.55;
  const lvl = 1 + playerLevel * 0.12;
  return {
    id: `ally_${classId}_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
    name, team: 'player', isPlayerControlled: false,
    classId, templateId: null,
    health: Math.floor(180 * s * lvl), maxHealth: Math.floor(180 * s * lvl),
    mana: 80, maxMana: 80, stamina: 80, maxStamina: 80,
    damage: Math.floor(16 * s * lvl), defense: Math.floor(10 * s * lvl),
    speed: 10 + Math.floor(Math.random() * 10),
    critChance: 6, evasion: 4, block: 3,
    damageReduction: 0, drainHealth: 0, healthRegen: 2, manaRegen: 3,
    abilities: cls.abilities.slice(0, 3),
    cooldowns: {},
    buffs: [], dots: [], stunned: false, alive: true,
    level: Math.max(1, playerLevel - 1),
  };
}

function calculateAttackDamage(attacker, defender, ability) {
  let evasionBonus = 0;
  (defender.buffs || []).forEach(b => {
    if (b.stat === 'evasion' && b.flat) evasionBonus += b.flat;
  });
  const totalEvasion = (defender.evasion || 0) + evasionBonus;
  if (Math.random() * 100 < totalEvasion) {
    return { totalDmg: 0, isCrit: false, blocked: false, evaded: true };
  }

  let baseDmg = (attacker.damage || 0) + ((attacker.level || 1) * 2);
  let dmgMult = 1;
  (attacker.buffs || []).forEach(b => {
    if (b.stat === 'damage' && b.multiplier) dmgMult *= b.multiplier;
  });
  baseDmg = Math.floor(baseDmg * dmgMult);

  let totalDmg = Math.floor(baseDmg * (ability.damage || 1));
  const isCrit = ability.guaranteedCrit || Math.random() * 100 < (attacker.critChance || 5);
  if (isCrit) {
    totalDmg = Math.floor(totalDmg * 1.5);
  }

  if (!isCrit) {
    let defenseVal = defender.defense || 0;
    (defender.buffs || []).forEach(b => {
      if (b.stat === 'defense' && b.flat) defenseVal += b.flat;
    });
    totalDmg = Math.max(1, totalDmg - Math.floor(defenseVal * 0.5));
  }

  if (defender.damageReduction > 0) {
    totalDmg = Math.floor(totalDmg * (1 - defender.damageReduction / 100));
  }

  let blocked = false;
  if (Math.random() * 100 < (defender.block || 0)) {
    totalDmg = Math.floor(totalDmg * 0.4);
    blocked = true;
  }

  totalDmg = Math.max(1, totalDmg);
  return { totalDmg, isCrit, blocked, evaded: false };
}

function chooseAIAction(unit, allUnits) {
  const allies = allUnits.filter(u => u.team === unit.team && u.alive && u.health > 0);
  const enemies = allUnits.filter(u => u.team !== unit.team && u.alive && u.health > 0);
  if (enemies.length === 0) return null;

  if (unit.classId === 'mage' && unit.team === 'player') {
    const lowAlly = allies.find(a => a.health / a.maxHealth < 0.4);
    const healAbility = unit.abilities.find(a =>
      (a.type === 'heal') && (unit.cooldowns[a.id] || 0) <= 0 && (a.manaCost || 0) <= unit.mana
    );
    if (lowAlly && healAbility) {
      return { abilityId: healAbility.id, targetId: lowAlly.id };
    }
  }

  const availableAbilities = unit.abilities.filter(a =>
    (unit.cooldowns[a.id] || 0) <= 0 &&
    (a.manaCost || 0) <= unit.mana &&
    (a.staminaCost || 0) <= unit.stamina
  );

  const attackAbilities = availableAbilities.filter(a => a.type === 'physical' || a.type === 'magical');
  const buffAbilities = availableAbilities.filter(a => a.type === 'buff');
  const hotAbilities = availableAbilities.filter(a => a.type === 'heal_over_time');

  if (buffAbilities.length > 0 && unit.buffs.length === 0 && Math.random() < 0.3) {
    return { abilityId: buffAbilities[0].id, targetId: unit.id };
  }

  if (unit.team === 'player' && hotAbilities.length > 0 && unit.health / unit.maxHealth < 0.5 && Math.random() < 0.5) {
    return { abilityId: hotAbilities[0].id, targetId: unit.id };
  }

  const specials = attackAbilities.filter(a => a.cooldown && a.cooldown > 0);
  let ability;
  if (specials.length > 0 && Math.random() < 0.45) {
    ability = specials[Math.floor(Math.random() * specials.length)];
  } else if (attackAbilities.length > 0) {
    ability = attackAbilities[0];
  } else {
    ability = availableAbilities[0] || unit.abilities[0];
  }

  let target;
  if (Math.random() < 0.6) {
    target = enemies.reduce((low, e) => e.health < low.health ? e : low, enemies[0]);
  } else {
    target = enemies[Math.floor(Math.random() * enemies.length)];
  }

  return { abilityId: ability.id, targetId: target.id };
}

function getFormationPositions(count, side) {
  const p = {
    player: {
      1: [{x:20,y:50}],
      2: [{x:16,y:35},{x:22,y:65}],
      3: [{x:13,y:25},{x:22,y:50},{x:13,y:75}],
    },
    enemy: {
      1: [{x:80,y:50}],
      2: [{x:78,y:35},{x:84,y:65}],
      3: [{x:75,y:25},{x:84,y:50},{x:75,y:75}],
      4: [{x:72,y:18},{x:84,y:36},{x:72,y:56},{x:84,y:76}],
    }
  };
  const maxCount = side === 'player' ? 3 : 4;
  return p[side][Math.min(count, maxCount)] || p[side][1];
}

const useGameStore = create((set, get) => ({
  screen: 'title',
  playerName: 'Hero',
  playerClass: null,
  level: 1,
  xp: 0,
  xpToNext: 50,
  gold: 0,
  attributePoints: { Strength: 0, Vitality: 0, Endurance: 0, Dexterity: 0, Agility: 0, Intellect: 0, Wisdom: 0, Tactics: 0 },
  unspentPoints: 20,
  skillPoints: 0,
  unlockedSkills: {},
  currentLocation: null,
  battleState: null,
  battleUnits: [],
  battleTurnOrder: [],
  battleCurrentTurn: 0,
  selectedTargetId: null,
  lastAction: null,
  battleLog: [],
  playerBuffs: [],
  playerDots: [],
  playerStunned: false,
  playerHealth: 250,
  playerMaxHealth: 250,
  playerMana: 100,
  playerMaxMana: 100,
  playerStamina: 100,
  playerMaxStamina: 100,
  cooldowns: {},
  turnCount: 0,
  floatingTexts: [],
  gameMessage: null,
  victories: 0,
  losses: 0,
  bossesDefeated: [],
  inventory: [],

  setScreen: (screen) => set({ screen }),

  setPlayerName: (name) => set({ playerName: name }),

  selectClass: (classId) => {
    const classDef = classDefinitions[classId];
    if (!classDef) return;
    const attrs = { ...classDef.startingAttributes };
    const totalSpent = Object.values(attrs).reduce((a, b) => a + b, 0);
    set({
      playerClass: classId,
      attributePoints: attrs,
      unspentPoints: 20 - totalSpent,
    });
  },

  allocatePoint: (attr) => {
    const state = get();
    if (state.unspentPoints <= 0) return;
    set({
      attributePoints: { ...state.attributePoints, [attr]: state.attributePoints[attr] + 1 },
      unspentPoints: state.unspentPoints - 1,
    });
  },

  deallocatePoint: (attr) => {
    const state = get();
    if (state.attributePoints[attr] <= 0) return;
    set({
      attributePoints: { ...state.attributePoints, [attr]: state.attributePoints[attr] - 1 },
      unspentPoints: state.unspentPoints + 1,
    });
  },

  getStats: () => {
    const state = get();
    const stats = calculateStats(state.attributePoints, state.level);
    const skillBonuses = get().getSkillBonuses();
    Object.entries(skillBonuses).forEach(([key, val]) => {
      if (stats[key] !== undefined) stats[key] += val;
    });
    return stats;
  },

  getSkillBonuses: () => {
    const state = get();
    const bonuses = {};
    if (!state.playerClass) return bonuses;
    const tree = skillTrees[state.playerClass];
    if (!tree) return bonuses;
    tree.tiers.forEach(tier => {
      tier.skills.forEach(skill => {
        const points = state.unlockedSkills[skill.id] || 0;
        if (points > 0 && skill.bonuses) {
          Object.entries(skill.bonuses).forEach(([stat, val]) => {
            bonuses[stat] = (bonuses[stat] || 0) + val * points;
          });
        }
      });
    });
    return bonuses;
  },

  unlockSkill: (skillId) => {
    const state = get();
    if (state.skillPoints <= 0) return;
    const tree = skillTrees[state.playerClass];
    if (!tree) return;
    for (const tier of tree.tiers) {
      if (tier.requiredLevel > state.level) continue;
      for (const skill of tier.skills) {
        if (skill.id === skillId) {
          const current = state.unlockedSkills[skillId] || 0;
          if (current >= skill.maxPoints) return;
          if (skill.requires && !(state.unlockedSkills[skill.requires] > 0)) return;
          set({
            unlockedSkills: { ...state.unlockedSkills, [skillId]: current + 1 },
            skillPoints: state.skillPoints - 1,
          });
          return;
        }
      }
    }
  },

  startGame: () => {
    const state = get();
    if (!state.playerClass) return;
    const stats = state.getStats();
    set({
      screen: 'world',
      playerHealth: Math.floor(stats.health),
      playerMaxHealth: Math.floor(stats.health),
      playerMana: Math.floor(stats.mana),
      playerMaxMana: Math.floor(stats.mana),
      playerStamina: Math.floor(stats.stamina),
      playerMaxStamina: Math.floor(stats.stamina),
      skillPoints: 1,
    });
  },

  refreshPlayerStats: () => {
    const stats = get().getStats();
    set({
      playerMaxHealth: Math.floor(stats.health),
      playerMaxMana: Math.floor(stats.mana),
      playerMaxStamina: Math.floor(stats.stamina),
    });
  },

  enterLocation: (locationId) => {
    set({ currentLocation: locationId, screen: 'location' });
  },

  startBattle: (locationId) => {
    const state = get();
    const loc = locations.find(l => l.id === locationId);
    if (!loc) return;

    const stats = state.getStats();
    const cls = classDefinitions[state.playerClass];

    const playerUnit = {
      id: 'player',
      name: state.playerName,
      team: 'player',
      isPlayerControlled: true,
      classId: state.playerClass,
      templateId: null,
      health: Math.min(state.playerHealth, Math.floor(stats.health)),
      maxHealth: Math.floor(stats.health),
      mana: Math.min(state.playerMana, Math.floor(stats.mana)),
      maxMana: Math.floor(stats.mana),
      stamina: Math.min(state.playerStamina, Math.floor(stats.stamina)),
      maxStamina: Math.floor(stats.stamina),
      damage: stats.damage,
      defense: stats.defense,
      speed: 20 + Math.floor((state.attributePoints.Agility || 0) * 0.3),
      critChance: stats.criticalChance || 5,
      evasion: stats.evasion || 0,
      block: stats.block || 0,
      damageReduction: stats.damageReduction || 0,
      drainHealth: stats.drainHealth || 0,
      healthRegen: stats.healthRegen || 0,
      manaRegen: stats.manaRegen || 0,
      abilities: cls.abilities,
      cooldowns: {},
      buffs: [], dots: [], stunned: false, alive: true,
      level: state.level,
    };

    const allyCount = loc.allyCount || 1;
    const availableClasses = ['warrior', 'mage', 'worg', 'ranger'].filter(c => c !== state.playerClass);
    const allies = [];
    for (let i = 0; i < allyCount; i++) {
      const allyClass = availableClasses[i % availableClasses.length];
      const ally = createAllyUnit(allyClass, state.level);
      if (ally) allies.push(ally);
    }

    const [minEnemies, maxEnemies] = loc.enemyCount || [2, 3];
    const enemyCount = minEnemies + Math.floor(Math.random() * (maxEnemies - minEnemies + 1));
    const enemyUnits = [];
    for (let i = 0; i < enemyCount; i++) {
      const templateId = loc.enemies[Math.floor(Math.random() * loc.enemies.length)];
      const enemy = createEnemy(templateId, state.level);
      if (enemy) enemyUnits.push(enemy);
    }

    const playerTeam = [playerUnit, ...allies];
    const allUnits = [...playerTeam, ...enemyUnits];

    const pPositions = getFormationPositions(playerTeam.length, 'player');
    const ePositions = getFormationPositions(enemyUnits.length, 'enemy');
    playerTeam.forEach((u, i) => { u.position = pPositions[i]; });
    enemyUnits.forEach((u, i) => { u.position = ePositions[i]; });

    const turnOrder = [...allUnits]
      .sort((a, b) => b.speed - a.speed)
      .map(u => u.id);

    set({
      screen: 'battle',
      battleState: { phase: 'intro', turnCount: 0, isBoss: false },
      battleUnits: allUnits,
      battleTurnOrder: turnOrder,
      battleCurrentTurn: 0,
      selectedTargetId: enemyUnits[0]?.id || null,
      lastAction: null,
      battleLog: [`Battle begins! ${enemyUnits.length} enemies appear!`],
      playerHealth: playerUnit.health,
      playerMaxHealth: playerUnit.maxHealth,
      playerMana: playerUnit.mana,
      playerMaxMana: playerUnit.maxMana,
      playerStamina: playerUnit.stamina,
      playerMaxStamina: playerUnit.maxStamina,
      cooldowns: {},
      floatingTexts: [],
    });
  },

  startBossBattle: (bossTemplateId) => {
    const state = get();
    const loc = locations.find(l => l.id === state.currentLocation);
    const stats = state.getStats();
    const cls = classDefinitions[state.playerClass];

    const playerUnit = {
      id: 'player',
      name: state.playerName,
      team: 'player', isPlayerControlled: true,
      classId: state.playerClass, templateId: null,
      health: Math.floor(stats.health), maxHealth: Math.floor(stats.health),
      mana: Math.floor(stats.mana), maxMana: Math.floor(stats.mana),
      stamina: Math.floor(stats.stamina), maxStamina: Math.floor(stats.stamina),
      damage: stats.damage, defense: stats.defense,
      speed: 20 + Math.floor((state.attributePoints.Agility || 0) * 0.3),
      critChance: stats.criticalChance || 5, evasion: stats.evasion || 0,
      block: stats.block || 0, damageReduction: stats.damageReduction || 0,
      drainHealth: stats.drainHealth || 0, healthRegen: stats.healthRegen || 0,
      manaRegen: stats.manaRegen || 0,
      abilities: cls.abilities, cooldowns: {},
      buffs: [], dots: [], stunned: false, alive: true,
      level: state.level,
    };

    const availableClasses = ['warrior', 'mage', 'worg', 'ranger'].filter(c => c !== state.playerClass);
    const allies = [];
    for (let i = 0; i < 2; i++) {
      const ally = createAllyUnit(availableClasses[i % availableClasses.length], state.level);
      if (ally) allies.push(ally);
    }

    const boss = createEnemy(bossTemplateId, state.level + 2);
    boss.maxHealth = Math.floor(boss.maxHealth * 1.8);
    boss.health = boss.maxHealth;
    boss.damage = Math.floor(boss.damage * 1.3);
    boss.defense = Math.floor(boss.defense * 1.3);
    boss.name = '★ ' + boss.name + ' ★';
    boss.xpReward = Math.floor(boss.xpReward * 3);
    boss.goldReward = Math.floor(boss.goldReward * 3);
    boss.speed += 5;

    const addEnemies = [];
    if (loc) {
      const addPool = loc.enemies.filter(e => e !== bossTemplateId);
      if (addPool.length > 0) {
        const addCount = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < addCount; i++) {
          const tId = addPool[Math.floor(Math.random() * addPool.length)];
          const add = createEnemy(tId, state.level);
          if (add) addEnemies.push(add);
        }
      }
    }

    const enemyUnits = [boss, ...addEnemies];
    const playerTeam = [playerUnit, ...allies];
    const allUnits = [...playerTeam, ...enemyUnits];

    const pPositions = getFormationPositions(playerTeam.length, 'player');
    const ePositions = getFormationPositions(enemyUnits.length, 'enemy');
    playerTeam.forEach((u, i) => { u.position = pPositions[i]; });
    enemyUnits.forEach((u, i) => { u.position = ePositions[i]; });

    const turnOrder = [...allUnits].sort((a, b) => b.speed - a.speed).map(u => u.id);

    set({
      screen: 'battle',
      battleState: { phase: 'intro', turnCount: 0, isBoss: true },
      battleUnits: allUnits,
      battleTurnOrder: turnOrder,
      battleCurrentTurn: 0,
      selectedTargetId: boss.id,
      lastAction: null,
      battleLog: [`BOSS BATTLE: ${boss.name} appears with ${addEnemies.length} allies!`],
      playerHealth: playerUnit.health, playerMaxHealth: playerUnit.maxHealth,
      playerMana: playerUnit.mana, playerMaxMana: playerUnit.maxMana,
      playerStamina: playerUnit.stamina, playerMaxStamina: playerUnit.maxStamina,
      cooldowns: {}, floatingTexts: [],
    });
  },

  setSelectedTarget: (unitId) => set({ selectedTargetId: unitId }),

  advanceTurn: () => {
    const state = get();
    if (!state.battleState) return;
    const units = state.battleUnits;
    const order = state.battleTurnOrder;

    const alivePlayerUnits = units.filter(u => u.team === 'player' && u.alive && u.health > 0);
    const aliveEnemyUnits = units.filter(u => u.team === 'enemy' && u.alive && u.health > 0);

    if (aliveEnemyUnits.length === 0) {
      get().handleVictory();
      return;
    }
    if (alivePlayerUnits.length === 0) {
      get().handleDefeat();
      return;
    }

    let nextIndex = (state.battleCurrentTurn + 1) % order.length;
    let attempts = 0;
    while (attempts < order.length) {
      const unit = units.find(u => u.id === order[nextIndex]);
      if (unit && unit.alive && unit.health > 0) break;
      nextIndex = (nextIndex + 1) % order.length;
      attempts++;
    }

    const nextUnit = units.find(u => u.id === order[nextIndex]);
    if (!nextUnit) return;

    const newUnits = units.map(u => {
      if (u.id !== nextUnit.id) return u;
      const updated = { ...u };
      Object.keys(updated.cooldowns).forEach(k => {
        if (updated.cooldowns[k] > 0) updated.cooldowns[k]--;
      });
      updated.buffs = (updated.buffs || [])
        .map(b => ({ ...b, duration: b.duration - 1 }))
        .filter(b => b.duration > 0);

      let hp = updated.health;
      updated.dots = (updated.dots || []).filter(d => {
        if (d.duration > 0) {
          if (d.heal) {
            const healAmt = Math.floor(updated.maxHealth * d.healPercent);
            hp = Math.min(updated.maxHealth, hp + healAmt);
          } else {
            const dotDmg = Math.floor(updated.maxHealth * d.damage * 0.1);
            hp = Math.max(0, hp - dotDmg);
          }
          d.duration--;
          return d.duration > 0;
        }
        return false;
      });
      updated.health = hp;
      if (hp <= 0) updated.alive = false;

      if (updated.alive && updated.team === 'player') {
        updated.health = Math.min(updated.maxHealth, updated.health + Math.floor(updated.healthRegen || 0));
        updated.mana = Math.min(updated.maxMana, updated.mana + Math.floor(updated.manaRegen || 0) + 3);
        updated.stamina = Math.min(updated.maxStamina, updated.stamina + 5);
      }

      if (updated.stunned) {
        updated.stunned = false;
      }

      return updated;
    });

    const refreshedUnit = newUnits.find(u => u.id === nextUnit.id);
    if (!refreshedUnit || !refreshedUnit.alive) {
      set({ battleUnits: newUnits, battleCurrentTurn: nextIndex });
      setTimeout(() => get().advanceTurn(), 50);
      return;
    }

    const phase = refreshedUnit.isPlayerControlled ? 'player_turn' : 'ai_turn';

    const firstAliveEnemy = newUnits.find(u => u.team === 'enemy' && u.alive && u.health > 0);
    const currentTarget = state.selectedTargetId;
    const targetStillAlive = newUnits.find(u => u.id === currentTarget && u.alive && u.health > 0);
    const selTarget = targetStillAlive ? currentTarget : (firstAliveEnemy?.id || null);

    set({
      battleUnits: newUnits,
      battleCurrentTurn: nextIndex,
      battleState: { ...state.battleState, phase },
      selectedTargetId: selTarget,
      lastAction: null,
    });
  },

  useAbility: (abilityId, targetIdOverride) => {
    const state = get();
    const bs = state.battleState;
    if (!bs || (bs.phase !== 'player_turn' && bs.phase !== 'ai_turn')) return;

    const currentUnitId = state.battleTurnOrder[state.battleCurrentTurn];
    const units = state.battleUnits.map(u => ({ ...u, buffs: [...(u.buffs || [])], dots: [...(u.dots || [])], cooldowns: { ...u.cooldowns } }));
    const attacker = units.find(u => u.id === currentUnitId);
    if (!attacker || !attacker.alive) return;

    if (attacker.stunned) {
      const log = [...state.battleLog, `💫 ${attacker.name} is stunned and cannot act!`];
      set({
        battleUnits: units,
        battleLog: log.slice(-12),
        battleState: { ...bs, phase: 'animating' },
        lastAction: { attackerId: currentUnitId, type: 'stunned' },
      });
      return;
    }

    const ability = attacker.abilities.find(a => a.id === abilityId);
    if (!ability) return;
    if ((attacker.cooldowns[abilityId] || 0) > 0) return;
    if ((ability.manaCost || 0) > attacker.mana) return;
    if ((ability.staminaCost || 0) > attacker.stamina) return;

    attacker.mana -= (ability.manaCost || 0);
    attacker.stamina -= (ability.staminaCost || 0);
    attacker.cooldowns[abilityId] = ability.cooldown || 0;

    let log = [...state.battleLog];
    let targetId = targetIdOverride || state.selectedTargetId;
    let actionResult = {
      attackerId: currentUnitId,
      targetId,
      abilityId,
      abilityType: ability.type,
      abilityName: ability.name,
    };

    if (ability.type === 'physical' || ability.type === 'magical') {
      const target = units.find(u => u.id === targetId);
      if (!target || !target.alive) {
        const fallback = units.find(u => u.team !== attacker.team && u.alive && u.health > 0);
        if (!fallback) return;
        targetId = fallback.id;
        actionResult.targetId = targetId;
      }
      const actualTarget = units.find(u => u.id === targetId);
      if (!actualTarget) return;

      const result = calculateAttackDamage(attacker, actualTarget, ability);
      actionResult = { ...actionResult, ...result };

      if (result.evaded) {
        log.push(`💨 ${actualTarget.name} dodges ${attacker.name}'s ${ability.name}!`);
      } else if (result.blocked) {
        actualTarget.health = Math.max(0, actualTarget.health - result.totalDmg);
        log.push(`🛡️ ${actualTarget.name} blocks! ${ability.name} deals ${result.totalDmg} damage.`);
      } else if (result.isCrit) {
        actualTarget.health = Math.max(0, actualTarget.health - result.totalDmg);
        log.push(`💥 CRIT! ${attacker.name}'s ${ability.name} deals ${result.totalDmg} to ${actualTarget.name}!`);
      } else {
        actualTarget.health = Math.max(0, actualTarget.health - result.totalDmg);
        log.push(`⚔️ ${attacker.name}'s ${ability.name} deals ${result.totalDmg} to ${actualTarget.name}.`);
      }

      if (actualTarget.health <= 0) {
        actualTarget.alive = false;
        log.push(`☠️ ${actualTarget.name} has been slain!`);
      }

      if (ability.effect?.type === 'stun' && actualTarget.alive) {
        actualTarget.stunned = true;
        log.push(`💫 ${actualTarget.name} is stunned!`);
      }
      if (ability.effect?.type === 'dot' && actualTarget.alive) {
        actualTarget.dots.push({ damage: ability.effect.damage, duration: ability.effect.duration, source: ability.name });
        log.push(`🩸 ${actualTarget.name} is bleeding!`);
      }
      if (ability.effect?.stat && ability.effect?.multiplier && ability.effect.multiplier < 1 && actualTarget.alive) {
        actualTarget.buffs.push({ ...ability.effect, source: ability.name });
      }

      if (attacker.drainHealth > 0 && result.totalDmg > 0) {
        const heal = Math.floor(result.totalDmg * attacker.drainHealth / 100);
        attacker.health = Math.min(attacker.maxHealth, attacker.health + heal);
      }
      if (ability.drainPercent && result.totalDmg > 0) {
        const heal = Math.floor(result.totalDmg * ability.drainPercent);
        attacker.health = Math.min(attacker.maxHealth, attacker.health + heal);
        log.push(`💜 ${attacker.name} drains ${heal} HP!`);
      }

    } else if (ability.type === 'heal') {
      let healTargetId = currentUnitId;
      if (attacker.team === 'player') {
        const lowAlly = units.filter(u => u.team === 'player' && u.alive).sort((a, b) => (a.health / a.maxHealth) - (b.health / b.maxHealth))[0];
        if (lowAlly) healTargetId = lowAlly.id;
      }
      const healTarget = units.find(u => u.id === healTargetId) || attacker;
      const healAmt = Math.floor(healTarget.maxHealth * ability.healPercent);
      healTarget.health = Math.min(healTarget.maxHealth, healTarget.health + healAmt);
      actionResult.targetId = healTarget.id;
      actionResult.healAmt = healAmt;
      log.push(`💚 ${attacker.name} heals ${healTarget.name} for ${healAmt}!`);

    } else if (ability.type === 'heal_over_time') {
      attacker.dots.push({ heal: true, healPercent: ability.healPercent, duration: ability.duration, source: ability.name });
      actionResult.targetId = currentUnitId;
      log.push(`💚 ${attacker.name} uses ${ability.name}!`);

    } else if (ability.type === 'buff') {
      if (ability.effect) {
        attacker.buffs.push({ ...ability.effect, source: ability.name });
        actionResult.targetId = currentUnitId;
        log.push(`⬆️ ${attacker.name} uses ${ability.name}!`);
      }
    }

    if (attacker.id === 'player') {
      set({
        playerHealth: attacker.health,
        playerMana: attacker.mana,
        playerStamina: attacker.stamina,
      });
    }

    set({
      battleUnits: units,
      battleLog: log.slice(-12),
      battleState: { ...bs, phase: 'animating', turnCount: bs.turnCount + 1 },
      lastAction: actionResult,
    });
  },

  processAIAction: () => {
    const state = get();
    if (!state.battleState || state.battleState.phase !== 'ai_turn') return;

    const currentUnitId = state.battleTurnOrder[state.battleCurrentTurn];
    const unit = state.battleUnits.find(u => u.id === currentUnitId);
    if (!unit || !unit.alive) {
      get().advanceTurn();
      return;
    }

    if (unit.stunned) {
      get().useAbility(unit.abilities[0]?.id);
      return;
    }

    const action = chooseAIAction(unit, state.battleUnits);
    if (!action) {
      get().advanceTurn();
      return;
    }

    get().useAbility(action.abilityId, action.targetId);
  },

  handleVictory: () => {
    const state = get();
    const enemyUnits = state.battleUnits.filter(u => u.team === 'enemy');
    const totalXp = enemyUnits.reduce((sum, e) => sum + (e.xpReward || 0), 0);
    const totalGold = enemyUnits.reduce((sum, e) => sum + (e.goldReward || 0), 0);

    let newXp = state.xp + totalXp;
    let newLevel = state.level;
    let newXpToNext = state.xpToNext;
    let newUnspent = state.unspentPoints;
    let newSkillPoints = state.skillPoints;
    let leveledUp = false;
    let log = [...state.battleLog];
    let bossesDefeated = [...state.bossesDefeated];

    if (state.battleState.isBoss) {
      const bossUnit = enemyUnits.find(u => u.name.includes('★'));
      if (bossUnit?.templateId) bossesDefeated.push(bossUnit.templateId);
    }

    while (newXp >= newXpToNext && newLevel < 20) {
      newXp -= newXpToNext;
      newLevel++;
      newXpToNext = Math.floor(newXpToNext * 1.4);
      newUnspent += POINTS_PER_LEVEL;
      newSkillPoints += 1;
      leveledUp = true;
      log.push(`🎉 LEVEL UP! You are now level ${newLevel}!`);
    }

    log.push(`✨ Victory! Gained ${totalXp} XP and ${totalGold} Gold.`);

    const playerUnit = state.battleUnits.find(u => u.id === 'player');

    set({
      battleState: { ...state.battleState, phase: 'victory' },
      xp: newXp,
      level: newLevel,
      xpToNext: newXpToNext,
      gold: state.gold + totalGold,
      unspentPoints: newUnspent,
      skillPoints: newSkillPoints,
      victories: state.victories + 1,
      bossesDefeated,
      battleLog: log.slice(-12),
      gameMessage: leveledUp ? `Level Up! You are now level ${newLevel}!` : null,
      playerHealth: playerUnit ? playerUnit.health : state.playerHealth,
      playerMana: playerUnit ? playerUnit.mana : state.playerMana,
      playerStamina: playerUnit ? playerUnit.stamina : state.playerStamina,
    });

    if (leveledUp) {
      const stats = get().getStats();
      set({
        playerMaxHealth: Math.floor(stats.health),
        playerMaxMana: Math.floor(stats.mana),
        playerMaxStamina: Math.floor(stats.stamina),
        playerHealth: Math.floor(stats.health),
        playerMana: Math.floor(stats.mana),
        playerStamina: Math.floor(stats.stamina),
      });
    }
  },

  handleDefeat: () => {
    const state = get();
    set({
      battleState: { ...state.battleState, phase: 'defeat' },
      losses: state.losses + 1,
      battleLog: [...state.battleLog, '💀 Your party has been defeated...'],
    });
  },

  returnToWorld: () => {
    const state = get();
    const stats = state.getStats();
    const wasBattle = state.battleState !== null;
    const wasDefeat = state.battleState?.phase === 'defeat';
    const playerUnit = state.battleUnits.find(u => u.id === 'player');

    let newHealth = state.playerHealth;
    let newMana = state.playerMana;
    let newStamina = state.playerStamina;
    let goldLost = 0;
    let msg = null;

    if (wasBattle) {
      if (wasDefeat) {
        newHealth = Math.floor(stats.health * 0.5);
        newMana = Math.floor(stats.mana);
        newStamina = Math.floor(stats.stamina);
        goldLost = Math.floor(state.gold * 0.1);
        msg = `You retreat wounded. Lost ${goldLost} gold.`;
      } else if (playerUnit) {
        newHealth = playerUnit.health;
        newMana = playerUnit.mana;
        newStamina = playerUnit.stamina;
      }
    }

    set({
      screen: 'world',
      battleState: null,
      battleUnits: [],
      battleTurnOrder: [],
      battleCurrentTurn: 0,
      selectedTargetId: null,
      lastAction: null,
      currentLocation: null,
      playerHealth: newHealth,
      playerMana: newMana,
      playerStamina: newStamina,
      gold: Math.max(0, state.gold - goldLost),
      gameMessage: msg,
      floatingTexts: [],
    });
  },

  restAtInn: () => {
    const state = get();
    const cost = state.level * 5;
    if (state.gold < cost) return;
    const stats = state.getStats();
    set({
      gold: state.gold - cost,
      playerHealth: Math.floor(stats.health),
      playerMana: Math.floor(stats.mana),
      playerStamina: Math.floor(stats.stamina),
      gameMessage: 'You rest at the inn and recover fully!',
    });
  },

  clearMessage: () => set({ gameMessage: null }),

  getUnlockedLocations: () => {
    const state = get();
    return locations.filter(l => l.unlocked || (l.unlockLevel && state.level >= l.unlockLevel));
  },
}));

export default useGameStore;
