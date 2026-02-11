import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateStats, TOTAL_POINTS_AT_LEVEL, POINTS_PER_LEVEL, calculateCombatPower } from '../data/attributes';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { locations, createEnemy, createRaceClassEnemy, getZoneEnemyPresets } from '../data/enemies';
import { skillTrees } from '../data/skillTrees';
import { generateLoot, getEquipmentStatBonuses, getStartingEquipment, EQUIPMENT_SLOTS, canClassEquip, upgradeItem, UPGRADE_COSTS, getItemPrice, getSellPrice, generateShopInventory, WEAPON_TYPES } from '../data/equipment';
import { getDefaultLoadout, resolveLoadout, getAllAbilityMap } from '../utils/abilityLoadout';
import { missionTemplates, arenaTemplates } from '../data/missions';
import { cities } from '../data/cities';
import { getDefaultRow, getRowPositions, applyRowCombatModifiers, getAdjacentRows, getRowName, getAIRowPreference, isUnitRanged, PLAYER_ROWS, ENEMY_ROWS } from '../data/battleRows';

function getHeroSkillBonuses(hero) {
  const bonuses = {};
  if (!hero.classId) return bonuses;
  const tree = skillTrees[hero.classId];
  if (!tree) return bonuses;
  const heroSkills = hero.unlockedSkills || {};
  tree.tiers.forEach(tier => {
    tier.skills.forEach(skill => {
      const points = heroSkills[skill.id] || 0;
      if (points > 0 && skill.bonuses) {
        Object.entries(skill.bonuses).forEach(([stat, val]) => {
          bonuses[stat] = (bonuses[stat] || 0) + val * points;
        });
      }
    });
  });
  return bonuses;
}

function getHeroStatsWithBonuses(hero) {
  const stats = calculateStats(hero.attributePoints, hero.level);
  const skillBonuses = getHeroSkillBonuses(hero);
  Object.entries(skillBonuses).forEach(([key, val]) => {
    if (stats[key] !== undefined) stats[key] += val;
  });
  const equipBonuses = getEquipmentStatBonuses(hero.equipment || {});
  Object.entries(equipBonuses).forEach(([key, val]) => {
    if (stats[key] !== undefined) stats[key] += val;
    else stats[key] = val;
  });
  if (hero.enchantBonuses) {
    Object.entries(hero.enchantBonuses).forEach(([key, val]) => {
      if (stats[key] !== undefined) stats[key] += val;
      else stats[key] = val;
    });
  }
  return stats;
}

function getSkillTreeAbilities(hero) {
  const tree = skillTrees[hero.classId];
  if (!tree) return [];
  const abilities = [];
  const heroSkills = hero.unlockedSkills || {};
  for (const tier of tree.tiers) {
    for (const skill of tier.skills) {
      if (skill.grantedAbility && (heroSkills[skill.id] || 0) > 0) {
        abilities.push(skill.grantedAbility);
      }
    }
  }
  return abilities;
}

function createHeroBattleUnit(hero) {
  const cls = classDefinitions[hero.classId];
  if (!cls) return null;
  const stats = getHeroStatsWithBonuses(hero);
  const heroWeaponType = hero.equipment?.weapon?.weaponType || null;
  const unit = {
    id: hero.id,
    name: hero.name,
    team: 'player',
    isPlayerControlled: true,
    classId: hero.classId,
    raceId: hero.raceId,
    templateId: null,
    weaponType: heroWeaponType,
    bearForm: false,
    demonBlade: false,
    health: Math.min(hero.currentHealth, Math.floor(stats.health)),
    maxHealth: Math.floor(stats.health),
    mana: Math.min(hero.currentMana, Math.floor(stats.mana)),
    maxMana: Math.floor(stats.mana),
    stamina: Math.min(hero.currentStamina, Math.floor(stats.stamina)),
    maxStamina: Math.floor(stats.stamina),
    physicalDamage: stats.physicalDamage || 0,
    magicDamage: stats.magicDamage || 0,
    defense: stats.defense,
    speed: 20 + Math.floor((hero.attributePoints.Agility || 0) * 0.3),
    critChance: stats.criticalChance || 5,
    criticalDamage: stats.criticalDamage || 50,
    evasion: stats.evasion || 0,
    block: stats.block || 0,
    blockEffect: stats.blockEffect || 0,
    damageReduction: stats.damageReduction || 0,
    drainHealth: stats.drainHealth || 0,
    healthRegen: stats.healthRegen || 0,
    manaRegen: stats.manaRegen || 0,
    defenseBreak: stats.defenseBreak || 0,
    criticalEvasion: stats.criticalEvasion || 0,
    abilityLoadout: hero.abilityLoadout || getDefaultLoadout(hero.classId, heroWeaponType),
    abilities: Object.values(getAllAbilityMap(hero.classId, heroWeaponType, hero.unlockedSkills || {})),
    cooldowns: {},
    buffs: [], dots: [], stunned: false, alive: true,
    level: hero.level,
    focusStacks: 0,
    guaranteedCrit: false,
    grudge: 0,
  };
  unit.row = getDefaultRow(unit);
  return unit;
}

function calculateAttackDamage(attacker, defender, ability) {
  let evasionBonus = 0;
  (defender.buffs || []).forEach(b => {
    if (b.stat === 'evasion' && b.flat) evasionBonus += b.flat;
  });
  const isInvincible = (defender.buffs || []).some(b => b.source === 'Invincible');
  if (isInvincible) {
    return { totalDmg: 0, isCrit: false, blocked: false, evaded: false, drained: 0, absorbed: true };
  }
  const totalEvasion = (defender.evasion || 0) + evasionBonus;
  if (Math.random() * 100 < totalEvasion) {
    return { totalDmg: 0, isCrit: false, blocked: false, evaded: true, drained: 0 };
  }

  const isMagic = ability.type === 'magical';
  let baseDmg = isMagic
    ? (attacker.magicDamage || attacker.damage || 0)
    : (attacker.physicalDamage || attacker.damage || 0);
  baseDmg += (attacker.level || 1) * 2;

  let dmgMult = 1;
  (attacker.buffs || []).forEach(b => {
    if (b.stat === 'damage' && b.multiplier) dmgMult *= b.multiplier;
  });
  baseDmg = Math.floor(baseDmg * dmgMult);

  let totalDmg = Math.floor(baseDmg * (ability.damage || 1));

  let defenseVal = defender.defense || 0;
  (defender.buffs || []).forEach(b => {
    if (b.stat === 'defense' && b.flat) defenseVal += b.flat;
  });
  const attackerDefBreak = attacker.defenseBreak || 0;
  if (attackerDefBreak > 0) {
    defenseVal = Math.max(0, defenseVal * (1 - attackerDefBreak / 100));
  }
  const defReduction = Math.min(80, Math.sqrt(Math.max(0, defenseVal)));
  totalDmg = Math.floor(totalDmg * (100 - defReduction) / 100);

  if (defender.damageReduction > 0) {
    totalDmg = Math.floor(totalDmg * (1 - defender.damageReduction / 100));
  }

  const variance = 0.75 + Math.random() * 0.5;
  totalDmg = Math.floor(totalDmg * variance);

  let blocked = false;
  let isCrit = false;

  if (Math.random() * 100 < (defender.block || 0)) {
    const blockFactor = Math.min(90, defender.blockEffect || 0) / 100;
    const reduction = blockFactor > 0 ? blockFactor : 0.6;
    totalDmg = Math.floor(totalDmg * (1 - reduction));
    blocked = true;
  }

  if (!blocked) {
    let effectiveCritChance = attacker.critChance || 5;
    const critEvasion = defender.criticalEvasion || 0;
    effectiveCritChance = Math.max(0, effectiveCritChance - critEvasion);
    if (attacker.focusStacks > 0) {
      effectiveCritChance += attacker.focusStacks * 10;
    }
    isCrit = ability.guaranteedCrit || attacker.guaranteedCrit || Math.random() * 100 < effectiveCritChance;
    if (isCrit) {
      const critFactor = 1 + ((attacker.criticalDamage || 50) / 100);
      totalDmg = Math.floor(totalDmg * critFactor);
      if (attacker.focusStacks > 0) {
        attacker.focusStacks = 0;
        attacker.guaranteedCrit = false;
      }
    }
  }

  totalDmg = Math.max(1, totalDmg);

  let drained = 0;
  if ((attacker.drainHealth || 0) > 0 && totalDmg > 0 && !blocked) {
    drained = Math.floor(totalDmg * (attacker.drainHealth / 100));
  }

  let result = { totalDmg, isCrit, blocked, evaded: false, drained };
  result = applyRowCombatModifiers(attacker, defender, ability, result);
  return result;
}

function chooseAIAction(unit, allUnits) {
  const allies = allUnits.filter(u => u.team === unit.team && u.alive && u.health > 0);
  const enemies = allUnits.filter(u => u.team !== unit.team && u.alive && u.health > 0);
  if (enemies.length === 0) return null;
  if (!unit.abilities || unit.abilities.length === 0) return null;

  if (unit.team === 'player' && (unit.classId === 'mage' || unit.classId === 'priest')) {
    const lowAlly = allies.find(a => a.health / a.maxHealth < 0.45);
    const healAbility = unit.abilities.find(a =>
      (a.type === 'heal' || a.type === 'heal_over_time') &&
      (unit.cooldowns[a.id] || 0) <= 0 && (a.manaCost || 0) <= unit.mana
    );
    if (lowAlly && healAbility) {
      return { abilityId: healAbility.id, targetId: lowAlly.id };
    }
  }

  const cls = classDefinitions[unit.classId];
  const bearSwapIds = cls?.bearFormAbilities ? Object.keys(cls.bearFormAbilities) : [];
  const bearReplacementIds = cls?.bearFormAbilities ? Object.values(cls.bearFormAbilities).map(a => a.id) : [];

  const availableAbilities = unit.abilities.filter(a =>
    (unit.cooldowns[a.id] || 0) <= 0 &&
    (a.manaCost || 0) <= unit.mana &&
    (a.staminaCost || 0) <= unit.stamina &&
    !(a.isBearForm && unit.bearForm) &&
    !(a.isDemonBlade && unit.demonBlade) &&
    !(unit.bearForm && bearSwapIds.includes(a.id)) &&
    !(!unit.bearForm && (bearReplacementIds.includes(a.id) || a.type === 'revert_form'))
  );
  if (availableAbilities.length === 0) return null;

  const attackAbilities = availableAbilities.filter(a => a.type === 'physical' || a.type === 'magical');
  const buffAbilities = availableAbilities.filter(a => a.type === 'buff');
  const hotAbilities = availableAbilities.filter(a => a.type === 'heal_over_time');
  const healAbilities = availableAbilities.filter(a => a.type === 'heal');

  if (buffAbilities.length > 0 && unit.buffs.length === 0 && Math.random() < 0.3) {
    return { abilityId: buffAbilities[0].id, targetId: unit.id };
  }

  const resAbilities = availableAbilities.filter(a => a.type === 'resurrect' || a.isResurrect);
  if (resAbilities.length > 0) {
    const allBattleUnits = [...allies, ...enemies];
    const deadAlly = allBattleUnits.find(a => a.team === unit.team && !a.alive && a.id !== unit.id);
    if (deadAlly && Math.random() < 0.7) {
      return { abilityId: resAbilities[0].id, targetId: deadAlly.id };
    }
  }

  if (healAbilities.length > 0) {
    if (unit.team === 'player') {
      const lowAlly = allies.find(a => a.health / a.maxHealth < 0.45);
      if (lowAlly) return { abilityId: healAbilities[0].id, targetId: lowAlly.id };
    } else {
      const lowAlly = allies.filter(a => a.alive && a.id !== unit.id).sort((a, b) => (a.health / a.maxHealth) - (b.health / b.maxHealth))[0];
      if (lowAlly && lowAlly.health / lowAlly.maxHealth < 0.5 && Math.random() < 0.6) {
        return { abilityId: healAbilities[0].id, targetId: lowAlly.id };
      }
      if (unit.health / unit.maxHealth < 0.5 && Math.random() < 0.6) {
        return { abilityId: healAbilities[0].id, targetId: unit.id };
      }
    }
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
    ability = availableAbilities[0];
  }

  if (!ability) return null;

  const preferredRow = getAIRowPreference(unit, allUnits);
  if (preferredRow && preferredRow !== unit.row && Math.random() < 0.4) {
    return { type: 'move_row', targetRow: preferredRow };
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
  };
  const maxCount = side === 'player' ? 3 : 4;
  return p[side][Math.min(count, maxCount)] || p[side][1];
}

function assignRowsAndPositions(playerTeam, enemyUnits) {
  playerTeam.forEach(u => {
    if (!u.row) u.row = getDefaultRow(u);
  });
  enemyUnits.forEach(u => {
    if (!u.row) u.row = getDefaultRow(u);
  });

  const pPos = getRowPositions(playerTeam, 'player');
  const ePos = getRowPositions(enemyUnits, 'enemy');
  playerTeam.forEach(u => { if (pPos[u.id]) u.position = pPos[u.id]; });
  enemyUnits.forEach(u => { if (ePos[u.id]) u.position = ePos[u.id]; });
}

function recalcRowPositions(units) {
  const playerUnits = units.filter(u => u.team === 'player' && u.alive);
  const enemyUnits = units.filter(u => u.team === 'enemy' && u.alive);
  const pPos = getRowPositions(playerUnits, 'player');
  const ePos = getRowPositions(enemyUnits, 'enemy');
  return units.map(u => {
    const newPos = pPos[u.id] || ePos[u.id];
    if (newPos) return { ...u, position: newPos };
    return u;
  });
}

const useGameStore = create(persist((set, get) => ({
  screen: 'title',
  playerName: 'Hero',
  playerRace: null,
  playerClass: null,
  level: 1,
  xp: 0,
  xpToNext: 50,
  gold: 0,
  attributePoints: { Strength: 0, Vitality: 0, Endurance: 0, Dexterity: 0, Agility: 0, Intellect: 0, Wisdom: 0, Tactics: 0 },
  baseAttributePoints: { Strength: 0, Vitality: 0, Endurance: 0, Dexterity: 0, Agility: 0, Intellect: 0, Wisdom: 0, Tactics: 0 },
  unspentPoints: 7,
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
  heroRoster: [],
  activeHeroIds: [],
  heroCreationPending: false,
  maxHeroSlots: 1,
  locationsCleared: [],
  zoneConquer: {},
  zoneStats: {},
  completedQuests: {},
  inventory: [],
  shopInventory: [],
  shopLastRefresh: 0,
  pendingLoot: [],
  harvestNodes: [
    { id: 'gold_mine', name: 'Gold Mine', icon: '⛏️', resource: 'gold', baseRate: 3, unlockLevel: 1 },
    { id: 'herb_garden', name: 'Herb Garden', icon: '🌿', resource: 'herbs', baseRate: 2, unlockLevel: 2 },
    { id: 'lumber_yard', name: 'Lumber Yard', icon: '🪵', resource: 'wood', baseRate: 2, unlockLevel: 3 },
    { id: 'ore_vein', name: 'Ore Vein', icon: '🪨', resource: 'ore', baseRate: 1, unlockLevel: 5 },
    { id: 'crystal_cave', name: 'Crystal Cave', icon: '💎', resource: 'crystals', baseRate: 1, unlockLevel: 8 },
  ],
  activeHarvests: {},
  harvestResources: { gold: 0, herbs: 0, wood: 0, ore: 0, crystals: 0 },
  lastHarvestTick: Date.now(),
  randomEvents: [],
  lastEventSpawn: Date.now(),
  eventBonusRewards: null,
  trainingPhase: null,
  activeMission: null,
  completedMissions: [],
  arenaLastRotation: 0,
  currentArenaPool: [],
  currentScene: null,
  sceneReturnTo: null,
  dungeonProgress: null,

  setScreen: (screen) => set({ screen }),

  setPlayerName: (name) => set({ playerName: name }),

  selectRace: (raceId) => set({ playerRace: raceId }),

  selectClass: (classId) => {
    const zero = { Strength: 0, Vitality: 0, Endurance: 0, Dexterity: 0, Agility: 0, Intellect: 0, Wisdom: 0, Tactics: 0 };
    if (!classId) {
      set({ playerClass: null, attributePoints: { ...zero }, baseAttributePoints: { ...zero }, unspentPoints: 7 });
      return;
    }
    const state = get();
    const classDef = classDefinitions[classId];
    if (!classDef) return;
    const raceDef = state.playerRace ? raceDefinitions[state.playerRace] : null;
    const attrs = { ...classDef.startingAttributes };
    if (raceDef) {
      Object.entries(raceDef.bonuses).forEach(([attr, val]) => {
        if (attrs[attr] !== undefined) attrs[attr] += val;
      });
    }
    set({
      playerClass: classId,
      attributePoints: { ...attrs },
      baseAttributePoints: { ...attrs },
      unspentPoints: 7,
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
    const floor = (state.baseAttributePoints && state.baseAttributePoints[attr]) || 0;
    if (state.attributePoints[attr] <= floor) return;
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
    const startingEquipment = getStartingEquipment(state.playerClass);
    const primaryHero = {
      id: 'player',
      name: state.playerName,
      raceId: state.playerRace,
      classId: state.playerClass,
      level: state.level,
      attributePoints: { ...state.attributePoints },
      baseAttributePoints: { ...state.baseAttributePoints },
      currentHealth: Math.floor(stats.health),
      currentMana: Math.floor(stats.mana),
      currentStamina: Math.floor(stats.stamina),
      unspentPoints: 0,
      skillPoints: 0,
      unlockedSkills: {},
      equipment: startingEquipment,
      abilityLoadout: getDefaultLoadout(state.playerClass, startingEquipment?.weapon?.weaponType),
    };
    set({
      screen: 'training',
      trainingPhase: 'pre_training_1',
      playerHealth: Math.floor(stats.health),
      playerMaxHealth: Math.floor(stats.health),
      playerMana: Math.floor(stats.mana),
      playerMaxMana: Math.floor(stats.mana),
      playerStamina: Math.floor(stats.stamina),
      playerMaxStamina: Math.floor(stats.stamina),
      skillPoints: 1,
      heroRoster: [primaryHero],
      activeHeroIds: ['player'],
      maxHeroSlots: 1,
    });
  },

  addHeroToRoster: (hero) => {
    const state = get();
    const hasEquipment = hero.equipment && Object.keys(hero.equipment).length > 0;
    const equip = hasEquipment ? hero.equipment : getStartingEquipment(hero.classId);
    const heroWithSkills = {
      ...hero,
      skillPoints: Math.max(0, hero.level),
      unlockedSkills: hero.unlockedSkills || {},
      unspentPoints: hero.unspentPoints || 0,
      equipment: equip,
      abilityLoadout: hero.abilityLoadout || getDefaultLoadout(hero.classId, equip?.weapon?.weaponType),
    };
    const newRoster = [...state.heroRoster, heroWithSkills];
    const newActiveIds = state.activeHeroIds.length < 3
      ? [...state.activeHeroIds, heroWithSkills.id]
      : state.activeHeroIds;

    if (state.trainingPhase === 'create_hero_2') {
      set({
        heroRoster: newRoster,
        activeHeroIds: newActiveIds,
        heroCreationPending: false,
        screen: 'training',
        trainingPhase: 'pre_training_2',
      });
    } else if (state.trainingPhase === 'create_hero_3') {
      set({
        heroRoster: newRoster,
        activeHeroIds: newActiveIds,
        heroCreationPending: false,
        trainingPhase: null,
        screen: 'world',
        gameMessage: 'Your War Party is formed! The world awaits, Warlord.',
      });
    } else {
      set({
        heroRoster: newRoster,
        activeHeroIds: newActiveIds,
        heroCreationPending: false,
        screen: 'world',
      });
    }
  },

  setActiveHeroes: (heroIds) => {
    set({ activeHeroIds: heroIds.slice(0, 3) });
  },

  getAvailableHeroSlots: () => {
    const state = get();
    return state.maxHeroSlots - state.heroRoster.length;
  },

  canCreateHero: () => {
    const state = get();
    return state.heroRoster.length < state.maxHeroSlots;
  },

  setHeroLoadout: (heroId, loadout) => {
    const state = get();
    if (heroId === 'player') {
      const updatedRoster = state.heroRoster.map(h =>
        h.id === 'player' ? { ...h, abilityLoadout: [...loadout] } : h
      );
      set({ heroRoster: updatedRoster });
      return;
    }
    const updatedRoster = state.heroRoster.map(h =>
      h.id === heroId ? { ...h, abilityLoadout: [...loadout] } : h
    );
    set({ heroRoster: updatedRoster });
  },

  unlockHeroSkill: (heroId, skillId) => {
    const state = get();
    if (heroId === 'player') {
      get().unlockSkill(skillId);
      const updatedState = get();
      const updatedRoster = updatedState.heroRoster.map(h =>
        h.id === 'player' ? { ...h, skillPoints: updatedState.skillPoints, unlockedSkills: { ...updatedState.unlockedSkills } } : h
      );
      set({ heroRoster: updatedRoster });
      return;
    }
    const hero = state.heroRoster.find(h => h.id === heroId);
    if (!hero || (hero.skillPoints || 0) <= 0) return;
    const tree = skillTrees[hero.classId];
    if (!tree) return;
    for (const tier of tree.tiers) {
      if (tier.requiredLevel > hero.level) continue;
      for (const skill of tier.skills) {
        if (skill.id === skillId) {
          const heroSkills = hero.unlockedSkills || {};
          const current = heroSkills[skillId] || 0;
          if (current >= skill.maxPoints) return;
          if (skill.requires && !(heroSkills[skill.requires] > 0)) return;
          const updatedRoster = state.heroRoster.map(h =>
            h.id === heroId ? {
              ...h,
              skillPoints: (h.skillPoints || 0) - 1,
              unlockedSkills: { ...(h.unlockedSkills || {}), [skillId]: current + 1 },
            } : h
          );
          set({ heroRoster: updatedRoster });
          return;
        }
      }
    }
  },

  allocateHeroPoint: (heroId, attrName) => {
    const state = get();
    if (heroId === 'player') {
      get().allocatePoint(attrName);
      const updatedState = get();
      const updatedRoster = updatedState.heroRoster.map(h =>
        h.id === 'player' ? { ...h, attributePoints: { ...updatedState.attributePoints }, unspentPoints: updatedState.unspentPoints } : h
      );
      set({ heroRoster: updatedRoster });
      return;
    }
    const hero = state.heroRoster.find(h => h.id === heroId);
    if (!hero || (hero.unspentPoints || 0) <= 0) return;
    const updatedRoster = state.heroRoster.map(h =>
      h.id === heroId ? {
        ...h,
        attributePoints: { ...h.attributePoints, [attrName]: (h.attributePoints[attrName] || 0) + 1 },
        unspentPoints: (h.unspentPoints || 0) - 1,
      } : h
    );
    set({ heroRoster: updatedRoster });
  },

  deallocateHeroPoint: (heroId, attrName) => {
    const state = get();
    if (heroId === 'player') {
      get().deallocatePoint(attrName);
      const updatedState = get();
      const updatedRoster = updatedState.heroRoster.map(h =>
        h.id === 'player' ? { ...h, attributePoints: { ...updatedState.attributePoints }, unspentPoints: updatedState.unspentPoints } : h
      );
      set({ heroRoster: updatedRoster });
      return;
    }
    const hero = state.heroRoster.find(h => h.id === heroId);
    if (!hero || (hero.attributePoints[attrName] || 0) <= 0) return;
    const updatedRoster = state.heroRoster.map(h =>
      h.id === heroId ? {
        ...h,
        attributePoints: { ...h.attributePoints, [attrName]: (h.attributePoints[attrName] || 0) - 1 },
        unspentPoints: (h.unspentPoints || 0) + 1,
      } : h
    );
    set({ heroRoster: updatedRoster });
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

    const primaryHero = state.heroRoster.find(h => h.id === 'player');
    if (primaryHero) {
      primaryHero.currentHealth = state.playerHealth;
      primaryHero.currentMana = state.playerMana;
      primaryHero.currentStamina = state.playerStamina;
      primaryHero.level = state.level;
      primaryHero.attributePoints = { ...state.attributePoints };
    }

    const playerTeam = [];
    for (const heroId of state.activeHeroIds) {
      const hero = state.heroRoster.find(h => h.id === heroId);
      if (hero) {
        const unit = createHeroBattleUnit(hero);
        if (unit) playerTeam.push(unit);
      }
    }

    if (playerTeam.length === 0) return;

    const [minEnemies, maxEnemies] = loc.enemyCount || [2, 3];
    const enemyCount = minEnemies + Math.floor(Math.random() * (maxEnemies - minEnemies + 1));
    const enemyUnits = [];
    const zonePresets = getZoneEnemyPresets(locationId);
    for (let i = 0; i < enemyCount; i++) {
      let enemy = null;
      if (zonePresets && zonePresets.presets && zonePresets.presets.length > 0) {
        const preset = zonePresets.presets[Math.floor(Math.random() * zonePresets.presets.length)];
        const [minLv, maxLv] = preset.levelRange;
        const enemyLevel = minLv + Math.floor(Math.random() * (maxLv - minLv + 1));
        enemy = createRaceClassEnemy(preset.raceId, preset.classId, enemyLevel);
      }
      if (!enemy) {
        const templateId = loc.enemies[Math.floor(Math.random() * loc.enemies.length)];
        enemy = createEnemy(templateId, state.level);
      }
      if (enemy) enemyUnits.push(enemy);
    }

    const allUnits = [...playerTeam, ...enemyUnits];

    assignRowsAndPositions(playerTeam, enemyUnits);

    const turnOrder = [...allUnits]
      .sort((a, b) => b.speed - a.speed)
      .map(u => u.id);

    const mainUnit = playerTeam.find(u => u.id === 'player') || playerTeam[0];

    set({
      screen: 'battle',
      battleState: { phase: 'intro', turnCount: 0, isBoss: false },
      battleUnits: allUnits,
      battleTurnOrder: turnOrder,
      battleCurrentTurn: 0,
      selectedTargetId: enemyUnits[0]?.id || null,
      lastAction: null,
      battleLog: [`Battle begins! ${enemyUnits.length} enemies appear!`],
      playerHealth: mainUnit.health,
      playerMaxHealth: mainUnit.maxHealth,
      playerMana: mainUnit.mana,
      playerMaxMana: mainUnit.maxMana,
      playerStamina: mainUnit.stamina,
      playerMaxStamina: mainUnit.maxStamina,
      cooldowns: {},
      floatingTexts: [],
    });
  },

  startBossBattle: (bossTemplateId) => {
    const state = get();
    const loc = locations.find(l => l.id === state.currentLocation);

    const primaryHero = state.heroRoster.find(h => h.id === 'player');
    if (primaryHero) {
      primaryHero.currentHealth = state.playerHealth;
      primaryHero.currentMana = state.playerMana;
      primaryHero.currentStamina = state.playerStamina;
      primaryHero.level = state.level;
      primaryHero.attributePoints = { ...state.attributePoints };
    }

    const playerTeam = [];
    for (const heroId of state.activeHeroIds) {
      const hero = state.heroRoster.find(h => h.id === heroId);
      if (hero) {
        const unit = createHeroBattleUnit(hero);
        if (unit) playerTeam.push(unit);
      }
    }

    if (playerTeam.length === 0) return;

    const boss = createEnemy(bossTemplateId, state.level + 2);
    boss.maxHealth = Math.floor(boss.maxHealth * 1.8);
    boss.health = boss.maxHealth;
    boss.physicalDamage = Math.floor(boss.physicalDamage * 1.3);
    boss.magicDamage = Math.floor(boss.magicDamage * 1.3);
    boss.defense = Math.floor(boss.defense * 1.3);
    boss.name = '★ ' + boss.name + ' ★';
    boss.xpReward = Math.floor(boss.xpReward * 3);
    boss.goldReward = Math.floor(boss.goldReward * 3);
    boss.speed += 5;

    const addEnemies = [];
    if (loc && loc.bossAdds && loc.bossAdds.length > 0) {
      for (const addTemplateId of loc.bossAdds) {
        const add = createEnemy(addTemplateId, state.level);
        if (add) addEnemies.push(add);
      }
    } else if (loc) {
      const addCount = 1 + Math.floor(Math.random() * 2);
      const zonePresets = getZoneEnemyPresets(state.currentLocation);
      for (let i = 0; i < addCount; i++) {
        let add = null;
        if (zonePresets && zonePresets.presets && zonePresets.presets.length > 0) {
          const preset = zonePresets.presets[Math.floor(Math.random() * zonePresets.presets.length)];
          const [minLv, maxLv] = preset.levelRange;
          const enemyLevel = minLv + Math.floor(Math.random() * (maxLv - minLv + 1));
          add = createRaceClassEnemy(preset.raceId, preset.classId, enemyLevel);
        }
        if (!add) {
          const addPool = loc.enemies.filter(e => e !== bossTemplateId);
          if (addPool.length > 0) {
            const tId = addPool[Math.floor(Math.random() * addPool.length)];
            add = createEnemy(tId, state.level);
          }
        }
        if (add) addEnemies.push(add);
      }
    }

    const enemyUnits = [boss, ...addEnemies];
    const allUnits = [...playerTeam, ...enemyUnits];

    assignRowsAndPositions(playerTeam, enemyUnits);

    const turnOrder = [...allUnits].sort((a, b) => b.speed - a.speed).map(u => u.id);

    const mainUnit = playerTeam.find(u => u.id === 'player') || playerTeam[0];

    set({
      screen: 'battle',
      battleState: { phase: 'intro', turnCount: 0, isBoss: true },
      battleUnits: allUnits,
      battleTurnOrder: turnOrder,
      battleCurrentTurn: 0,
      selectedTargetId: boss.id,
      lastAction: null,
      battleLog: [`BOSS BATTLE: ${boss.name} appears with ${addEnemies.length} allies!`],
      playerHealth: mainUnit.health, playerMaxHealth: mainUnit.maxHealth,
      playerMana: mainUnit.mana, playerMaxMana: mainUnit.maxMana,
      playerStamina: mainUnit.stamina, playerMaxStamina: mainUnit.maxStamina,
      cooldowns: {}, floatingTexts: [],
    });
  },

  getAvailableMissions: (cityId) => {
    const state = get();
    return missionTemplates.filter(m =>
      m.cityId === cityId &&
      state.level >= m.levelRange[0]
    );
  },

  getArenaForCity: (cityId) => {
    const state = get();
    const now = Date.now();
    const SIX_HOURS = 6 * 60 * 60 * 1000;
    let pool = state.currentArenaPool;
    if (!pool || pool.length === 0 || now - state.arenaLastRotation > SIX_HOURS) {
      const cityArenas = arenaTemplates.filter(a => a.cityId === cityId && state.level >= a.levelRange[0]);
      const shuffled = [...cityArenas].sort(() => Math.random() - 0.5);
      pool = shuffled.slice(0, Math.min(3, shuffled.length));
    }
    return pool;
  },

  startMissionBattle: (missionId) => {
    const state = get();
    const mission = missionTemplates.find(m => m.id === missionId);
    if (!mission) return;

    const primaryHero = state.heroRoster.find(h => h.id === 'player');
    if (primaryHero) {
      primaryHero.currentHealth = state.playerHealth;
      primaryHero.currentMana = state.playerMana;
      primaryHero.currentStamina = state.playerStamina;
      primaryHero.level = state.level;
      primaryHero.attributePoints = { ...state.attributePoints };
    }

    const playerTeam = [];
    for (const heroId of state.activeHeroIds) {
      const hero = state.heroRoster.find(h => h.id === heroId);
      if (hero) {
        const unit = createHeroBattleUnit(hero);
        if (unit) playerTeam.push(unit);
      }
    }
    if (playerTeam.length === 0) return;

    const round = mission.rounds[0];
    const enemyUnits = round.enemies.map(templateId => createEnemy(templateId, state.level)).filter(Boolean);

    const allUnits = [...playerTeam, ...enemyUnits];
    assignRowsAndPositions(playerTeam, enemyUnits);

    const turnOrder = [...allUnits].sort((a, b) => b.speed - a.speed).map(u => u.id);
    const mainUnit = playerTeam.find(u => u.id === 'player') || playerTeam[0];

    set({
      screen: 'battle',
      currentLocation: mission.targetLocation,
      activeMission: { missionId, currentRound: 0, totalRounds: mission.rounds.length },
      battleState: { phase: 'intro', turnCount: 0, isBoss: false, isMission: true, missionRound: 1, missionTotalRounds: mission.rounds.length },
      battleUnits: allUnits,
      battleTurnOrder: turnOrder,
      battleCurrentTurn: 0,
      selectedTargetId: enemyUnits[0]?.id || null,
      lastAction: null,
      battleLog: [`MISSION: ${mission.title}`, `Round 1/${mission.rounds.length}: ${round.description}`],
      playerHealth: mainUnit.health, playerMaxHealth: mainUnit.maxHealth,
      playerMana: mainUnit.mana, playerMaxMana: mainUnit.maxMana,
      playerStamina: mainUnit.stamina, playerMaxStamina: mainUnit.maxStamina,
      cooldowns: {}, floatingTexts: [],
    });
  },

  advanceMissionRound: () => {
    const state = get();
    const mission = missionTemplates.find(m => m.id === state.activeMission?.missionId);
    if (!mission) return;

    const nextRoundIdx = state.activeMission.currentRound + 1;
    if (nextRoundIdx >= mission.rounds.length) return;

    const round = mission.rounds[nextRoundIdx];

    const playerUnits = state.battleUnits.filter(u => u.team === 'player' && u.alive && u.health > 0);
    playerUnits.forEach(u => {
      u.cooldowns = {};
      u.buffs = [];
      u.dots = [];
      u.stunned = false;
    });

    const enemyUnits = round.enemies.map(templateId => createEnemy(templateId, state.level)).filter(Boolean);

    const allUnits = [...playerUnits, ...enemyUnits];
    assignRowsAndPositions(playerUnits, enemyUnits);

    const turnOrder = [...allUnits].sort((a, b) => b.speed - a.speed).map(u => u.id);

    set({
      activeMission: { ...state.activeMission, currentRound: nextRoundIdx },
      battleState: { phase: 'intro', turnCount: 0, isBoss: false, isMission: true, missionRound: nextRoundIdx + 1, missionTotalRounds: mission.rounds.length },
      battleUnits: allUnits,
      battleTurnOrder: turnOrder,
      battleCurrentTurn: 0,
      selectedTargetId: enemyUnits[0]?.id || null,
      lastAction: null,
      battleLog: [`Round ${nextRoundIdx + 1}/${mission.rounds.length}: ${round.description}`],
      cooldowns: {},
      floatingTexts: [],
    });
  },

  startArenaBattle: (arenaId) => {
    const state = get();
    const arena = arenaTemplates.find(a => a.id === arenaId);
    if (!arena) return;

    const primaryHero = state.heroRoster.find(h => h.id === 'player');
    if (primaryHero) {
      primaryHero.currentHealth = state.playerHealth;
      primaryHero.currentMana = state.playerMana;
      primaryHero.currentStamina = state.playerStamina;
      primaryHero.level = state.level;
      primaryHero.attributePoints = { ...state.attributePoints };
    }

    const playerTeam = [];
    for (const heroId of state.activeHeroIds) {
      const hero = state.heroRoster.find(h => h.id === heroId);
      if (hero) {
        const unit = createHeroBattleUnit(hero);
        if (unit) playerTeam.push(unit);
      }
    }
    if (playerTeam.length === 0) return;

    const enemyUnits = arena.enemies.map(templateId => createEnemy(templateId, state.level)).filter(Boolean);

    const allUnits = [...playerTeam, ...enemyUnits];
    assignRowsAndPositions(playerTeam, enemyUnits);

    const turnOrder = [...allUnits].sort((a, b) => b.speed - a.speed).map(u => u.id);
    const mainUnit = playerTeam.find(u => u.id === 'player') || playerTeam[0];

    set({
      screen: 'battle',
      battleState: { phase: 'intro', turnCount: 0, isBoss: false, isArena: true, arenaId },
      battleUnits: allUnits,
      battleTurnOrder: turnOrder,
      battleCurrentTurn: 0,
      selectedTargetId: enemyUnits[0]?.id || null,
      lastAction: null,
      battleLog: [`ARENA: ${arena.title}`, arena.description],
      playerHealth: mainUnit.health, playerMaxHealth: mainUnit.maxHealth,
      playerMana: mainUnit.mana, playerMaxMana: mainUnit.maxMana,
      playerStamina: mainUnit.stamina, playerMaxStamina: mainUnit.maxStamina,
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
      const prevBuffs = updated.buffs || [];
      updated.buffs = prevBuffs
        .map(b => ({ ...b, duration: b.duration - 1 }))
        .filter(b => b.duration > 0);
      if (updated.bearForm && prevBuffs.some(b => b.source === 'Bear Form') && !updated.buffs.some(b => b.source === 'Bear Form')) {
        updated.bearForm = false;
      }
      if (updated.demonBlade && prevBuffs.some(b => b.source === 'Demon Blade') && !updated.buffs.some(b => b.source === 'Demon Blade')) {
        updated.demonBlade = false;
      }

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

      if (updated.classId === 'ranger' && updated.alive && updated.team === 'player') {
        updated.focusStacks = Math.min(5, (updated.focusStacks || 0) + 1);
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

  skipTurn: () => {
    const state = get();
    const bs = state.battleState;
    if (!bs || bs.phase !== 'player_turn') return;
    const currentUnitId = state.battleTurnOrder[state.battleCurrentTurn];
    const unit = state.battleUnits.find(u => u.id === currentUnitId);
    if (!unit) return;
    const log = [...state.battleLog, `⏭️ ${unit.name} skips their turn.`];
    set({
      battleLog: log.slice(-12),
      battleState: { ...bs, phase: 'animating' },
      lastAction: { attackerId: currentUnitId, type: 'skip' },
    });
  },

  defendTurn: () => {
    const state = get();
    const bs = state.battleState;
    if (!bs || bs.phase !== 'player_turn') return;
    const currentUnitId = state.battleTurnOrder[state.battleCurrentTurn];
    const units = state.battleUnits.map(u => ({ ...u, buffs: [...(u.buffs || [])], cooldowns: { ...u.cooldowns } }));
    const unit = units.find(u => u.id === currentUnitId);
    if (!unit || !unit.alive) return;
    unit.buffs.push({ source: 'Defend', stat: 'defense', flat: Math.floor(unit.maxHealth * 0.15), duration: 2 });
    const healAmt = Math.floor(unit.maxHealth * 0.05);
    unit.health = Math.min(unit.maxHealth, unit.health + healAmt);
    unit.mana = Math.min(unit.maxMana, unit.mana + 3);
    unit.stamina = Math.min(unit.maxStamina, unit.stamina + 5);
    const log = [...state.battleLog, `🛡️ ${unit.name} defends! +DEF for 2 turns, recovers ${healAmt} HP.`];
    set({
      battleUnits: units,
      battleLog: log.slice(-12),
      battleState: { ...bs, phase: 'animating' },
      lastAction: { attackerId: currentUnitId, type: 'defend' },
    });
  },

  moveRow: (direction) => {
    const state = get();
    const bs = state.battleState;
    if (!bs || bs.phase !== 'player_turn') return;
    const currentUnitId = state.battleTurnOrder[state.battleCurrentTurn];
    const units = state.battleUnits.map(u => ({ ...u, buffs: [...(u.buffs || [])], cooldowns: { ...u.cooldowns } }));
    const unit = units.find(u => u.id === currentUnitId);
    if (!unit || !unit.alive) return;

    const adjacent = getAdjacentRows(unit);
    const rows = ['protection', 'battle', 'back'];
    const currentIdx = rows.indexOf(unit.row);
    let targetRow = null;

    if (direction === 'forward' && currentIdx > 0) {
      targetRow = rows[currentIdx - 1];
    } else if (direction === 'back' && currentIdx < rows.length - 1) {
      targetRow = rows[currentIdx + 1];
    }

    if (!targetRow || !adjacent.includes(targetRow)) return;

    unit.row = targetRow;
    const updatedUnits = recalcRowPositions(units);
    const rowCfg = PLAYER_ROWS[targetRow];
    const log = [...state.battleLog, `${rowCfg?.icon || '➡️'} ${unit.name} moves to ${rowCfg?.name || targetRow}!`];

    set({
      battleUnits: updatedUnits,
      battleLog: log.slice(-12),
      battleState: { ...bs, phase: 'animating' },
      lastAction: { attackerId: currentUnitId, type: 'move_row', targetRow },
    });
  },

  autoBattleEnabled: false,
  toggleAutoBattle: () => set(s => ({ autoBattleEnabled: !s.autoBattleEnabled })),

  autoAttack: () => {
    const state = get();
    const bs = state.battleState;
    if (!bs || bs.phase !== 'player_turn') return;
    const currentUnitId = state.battleTurnOrder[state.battleCurrentTurn];
    const unit = state.battleUnits.find(u => u.id === currentUnitId);
    if (!unit || !unit.alive) return;
    const action = chooseAIAction(unit, state.battleUnits);
    if (!action) {
      const firstAbility = unit.abilities?.[0];
      if (!firstAbility) return;
      const enemies = state.battleUnits.filter(u => u.team === 'enemy' && u.alive && u.health > 0);
      if (enemies.length === 0) return;
      const target = enemies.reduce((lowest, e) => e.health < lowest.health ? e : lowest, enemies[0]);
      get().useAbility(firstAbility.id, target.id);
      return;
    }
    get().useAbility(action.abilityId, action.targetId);
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
    if (ability.manaGain) attacker.mana = Math.min(attacker.maxMana, attacker.mana + ability.manaGain);
    if (ability.staminaGain) attacker.stamina = Math.min(attacker.maxStamina, attacker.stamina + ability.staminaGain);
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

      if (result.absorbed) {
        log.push(`🛡️ ${actualTarget.name} is INVINCIBLE! ${ability.name} is absorbed!`);
      } else if (result.evaded) {
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

      if (actualTarget.team === 'player' && result.totalDmg > 0 && !result.evaded && !result.absorbed) {
        const grudgeGain = Math.min(30, Math.max(5, Math.floor(result.totalDmg / actualTarget.maxHealth * 100)));
        actualTarget.grudge = Math.min(100, (actualTarget.grudge || 0) + grudgeGain);
        if (actualTarget.grudge >= 100) {
          log.push(`🔥 ${actualTarget.name}'s GRUDGE is full! Revenge awaits!`);
        }
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

      if (result.drained > 0) {
        attacker.health = Math.min(attacker.maxHealth, attacker.health + result.drained);
        log.push(`💜 ${attacker.name} drains ${result.drained} HP!`);
      }
      if (ability.drainPercent && result.totalDmg > 0) {
        const heal = Math.floor(result.totalDmg * ability.drainPercent);
        attacker.health = Math.min(attacker.maxHealth, attacker.health + heal);
        log.push(`💜 ${attacker.name} drains ${heal} HP!`);
      }

    } else if (ability.type === 'heal') {
      let healTargetId = targetIdOverride || currentUnitId;
      if (!targetIdOverride && attacker.team === 'player') {
        const lowAlly = units.filter(u => u.team === 'player' && u.alive).sort((a, b) => (a.health / a.maxHealth) - (b.health / b.maxHealth))[0];
        if (lowAlly) healTargetId = lowAlly.id;
      }
      const healTarget = units.find(u => u.id === healTargetId && u.alive) || attacker;
      const healAmt = Math.floor(healTarget.maxHealth * ability.healPercent);
      healTarget.health = Math.min(healTarget.maxHealth, healTarget.health + healAmt);
      actionResult.targetId = healTarget.id;
      actionResult.healAmt = healAmt;
      log.push(`💚 ${attacker.name} heals ${healTarget.name} for ${healAmt}!`);

    } else if (ability.type === 'heal_over_time') {
      attacker.dots.push({ heal: true, healPercent: ability.healPercent, duration: ability.duration, source: ability.name });
      actionResult.targetId = currentUnitId;
      log.push(`💚 ${attacker.name} uses ${ability.name}!`);

    } else if (ability.type === 'resurrect' || ability.isResurrect) {
      const deadAlly = units.find(u => u.team === attacker.team && !u.alive && u.id !== attacker.id);
      if (deadAlly) {
        deadAlly.alive = true;
        deadAlly.health = Math.floor(deadAlly.maxHealth * 0.4);
        deadAlly.stunned = false;
        deadAlly.dots = [];
        deadAlly.buffs = [];
        actionResult.targetId = deadAlly.id;
        actionResult.healAmt = deadAlly.health;
        log.push(`💚 ${attacker.name} resurrects ${deadAlly.name} with ${deadAlly.health} HP!`);
        const turnOrder = get().battleTurnOrder;
        if (!turnOrder.includes(deadAlly.id)) {
          const newOrder = [...turnOrder, deadAlly.id];
          set({ battleTurnOrder: newOrder });
        }
      } else {
        const fallbackTarget = enemies.length > 0 ? enemies[0] : null;
        if (fallbackTarget) {
          const result = applyDamage(attacker, fallbackTarget, 1.0, ability, units);
          actionResult.targetId = fallbackTarget.id;
          actionResult.damage = result.totalDmg;
          log.push(`${attacker.name} has no allies to resurrect, attacks instead for ${result.totalDmg}!`);
        }
      }

    } else if (ability.type === 'revert_form') {
      attacker.bearForm = false;
      attacker.buffs = attacker.buffs.filter(b => b.source !== 'Bear Form');
      actionResult.targetId = currentUnitId;
      log.push(`🔄 ${attacker.name} reverts to normal form!`);

    } else if (ability.type === 'focus' || ability.isFocus) {
      attacker.focusStacks = Math.min(5, (attacker.focusStacks || 0) * 2);
      if (attacker.focusStacks === 0) attacker.focusStacks = 2;
      attacker.guaranteedCrit = true;
      actionResult.targetId = currentUnitId;
      log.push(`🎯 ${attacker.name} focuses intensely! (${attacker.focusStacks} stacks, next hit guaranteed crit)`);
    } else if (ability.type === 'buff') {
      if (ability.isInvincible) {
        attacker.buffs.push({ ...ability.effect, source: 'Invincible' });
        actionResult.targetId = currentUnitId;
        log.push(`🛡️ ${attacker.name} becomes INVINCIBLE!`);
      } else if (ability.isBearForm) {
        attacker.bearForm = true;
        attacker.buffs.push({ ...ability.effect, source: ability.name });
        if (ability.defenseBoost) {
          attacker.buffs.push({ ...ability.defenseBoost, source: ability.name });
        }
        actionResult.targetId = currentUnitId;
        log.push(`🐻 ${attacker.name} transforms into beast form!`);
      } else if (ability.isDemonBlade) {
        attacker.demonBlade = true;
        attacker.buffs.push({ ...ability.effect, source: ability.name });
        if (ability.defenseBoost) {
          attacker.buffs.push({ ...ability.defenseBoost, source: ability.name });
        }
        actionResult.targetId = currentUnitId;
        log.push(`🗡️ ${attacker.name} transforms into a Demon Swordsman!`);
      } else if (ability.effect) {
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

  useConsumable: (consumableItemId, targetUnitId) => {
    const state = get();
    const bs = state.battleState;
    if (!bs || bs.phase !== 'player_turn') return;

    const currentUnitId = state.battleTurnOrder[state.battleCurrentTurn];
    const units = state.battleUnits.map(u => ({ ...u, buffs: [...(u.buffs || [])], dots: [...(u.dots || [])], cooldowns: { ...u.cooldowns } }));
    const attacker = units.find(u => u.id === currentUnitId);
    if (!attacker || !attacker.alive || attacker.stunned || attacker.team !== 'player') return;

    const itemIdx = state.inventory.findIndex(i => i.id === consumableItemId);
    if (itemIdx === -1) return;
    const item = state.inventory[itemIdx];
    if (item.slot !== 'consumable') return;

    let log = [...state.battleLog];
    let target = targetUnitId ? units.find(u => u.id === targetUnitId) : attacker;
    if (item.consumableType !== 'resurrect' && target && target.team !== 'player') {
      target = attacker;
    }
    let actionResult = { attackerId: currentUnitId, targetId: target?.id, type: 'consumable', consumableType: item.consumableType, abilityName: item.name };

    switch (item.consumableType) {
      case 'health': {
        if (!target || !target.alive) return;
        const healAmt = Math.floor(target.maxHealth * 0.4);
        target.health = Math.min(target.maxHealth, target.health + healAmt);
        actionResult.healAmt = healAmt;
        log.push(`❤️ ${attacker.name} uses ${item.name} on ${target.name}! +${healAmt} HP`);
        break;
      }
      case 'mana': {
        if (!target || !target.alive) return;
        const manaAmt = Math.floor(target.maxMana * 0.4);
        target.mana = Math.min(target.maxMana, target.mana + manaAmt);
        actionResult.healAmt = manaAmt;
        log.push(`💙 ${attacker.name} uses ${item.name} on ${target.name}! +${manaAmt} MP`);
        break;
      }
      case 'stamina': {
        if (!target || !target.alive) return;
        const staminaAmt = Math.floor(target.maxStamina * 0.4);
        target.stamina = Math.min(target.maxStamina, target.stamina + staminaAmt);
        actionResult.healAmt = staminaAmt;
        log.push(`💛 ${attacker.name} uses ${item.name} on ${target.name}! +${staminaAmt} SP`);
        break;
      }
      case 'speed': {
        if (!target || !target.alive) return;
        target.buffs.push({ stat: 'speed', multiplier: 1.5, duration: 3, source: 'Speed Potion' });
        log.push(`⚡ ${attacker.name} uses ${item.name} on ${target.name}! Speed boosted!`);
        break;
      }
      case 'cure': {
        if (!target || !target.alive) return;
        target.dots = [];
        target.buffs = target.buffs.filter(b => !b.multiplier || b.multiplier >= 1);
        target.stunned = false;
        log.push(`✨ ${attacker.name} uses ${item.name} on ${target.name}! Status cleared!`);
        break;
      }
      case 'resurrect': {
        const deadAlly = units.find(u => u.team === 'player' && !u.alive && u.id === targetUnitId);
        if (!deadAlly) {
          const anyDead = units.find(u => u.team === 'player' && !u.alive);
          if (!anyDead) return;
          target = anyDead;
          actionResult.targetId = anyDead.id;
        } else {
          target = deadAlly;
        }
        target.alive = true;
        target.health = Math.floor(target.maxHealth * 0.3);
        log.push(`🔱 ${attacker.name} uses ${item.name}! ${target.name} is revived with ${target.health} HP!`);
        break;
      }
      default:
        return;
    }

    if (attacker.id === 'player') {
      set({
        playerHealth: attacker.health,
        playerMana: attacker.mana,
        playerStamina: attacker.stamina,
      });
    }

    const newInventory = [...state.inventory];
    newInventory.splice(itemIdx, 1);

    set({
      inventory: newInventory,
      battleUnits: units,
      battleLog: log.slice(-12),
      battleState: { ...bs, phase: 'animating', turnCount: bs.turnCount + 1 },
      lastAction: actionResult,
    });
  },

  useGrudge: () => {
    const state = get();
    if (!state.battleState || state.battleState.phase !== 'player_turn') return;
    const currentUnitId = state.battleTurnOrder[state.battleCurrentTurn];
    const units = [...state.battleUnits].map(u => ({ ...u, buffs: [...(u.buffs || [])], dots: [...(u.dots || [])] }));
    const attacker = units.find(u => u.id === currentUnitId);
    if (!attacker || !attacker.isPlayerControlled || (attacker.grudge || 0) < 100) return;

    const enemies = units.filter(u => u.team === 'enemy' && u.alive);
    if (enemies.length === 0) return;

    let log = [...state.battleLog];
    log.push(`🔥💀 ${attacker.name} unleashes GRUDGE REVENGE!`);

    const baseDmg = Math.floor((attacker.physicalDamage + attacker.magicDamage) * 2.5 + attacker.level * 5);
    enemies.forEach(enemy => {
      const dmg = Math.max(1, Math.floor(baseDmg * (0.8 + Math.random() * 0.4)));
      enemy.health = Math.max(0, enemy.health - dmg);
      log.push(`💥 Revenge hits ${enemy.name} for ${dmg}!`);
      if (enemy.health <= 0) {
        enemy.alive = false;
        log.push(`☠️ ${enemy.name} has been slain!`);
      }
    });

    attacker.grudge = 0;

    const allDead = units.filter(u => u.team === 'enemy').every(u => !u.alive);
    const bs = state.battleState;

    if (attacker.id === 'player') {
      set({ playerHealth: attacker.health, playerMana: attacker.mana, playerStamina: attacker.stamina });
    }

    set({
      battleUnits: units,
      battleLog: log.slice(-12),
      battleState: { ...bs, phase: 'animating', turnCount: bs.turnCount + 1 },
      lastAction: {
        attackerId: currentUnitId,
        targetId: enemies[0]?.id,
        abilityId: 'grudge_revenge',
        abilityType: 'magical',
        abilityName: 'Grudge Revenge',
        totalDmg: baseDmg,
        isCrit: true,
        isGrudge: true,
      },
    });

    if (allDead) {
      setTimeout(() => get().handleVictory(), 1500);
    }
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
      const firstAbility = unit.abilities?.[0];
      if (firstAbility) {
        get().useAbility(firstAbility.id);
      } else {
        get().advanceTurn();
      }
      return;
    }

    const action = chooseAIAction(unit, state.battleUnits);
    if (!action) {
      get().advanceTurn();
      return;
    }

    if (action.type === 'move_row') {
      const units = state.battleUnits.map(u => ({ ...u, buffs: [...(u.buffs || [])], cooldowns: { ...u.cooldowns } }));
      const aiUnit = units.find(u => u.id === currentUnitId);
      if (aiUnit) {
        const oldRow = aiUnit.row;
        aiUnit.row = action.targetRow;
        const updatedUnits = recalcRowPositions(units);
        const rowCfg = ENEMY_ROWS[action.targetRow];
        const log = [...state.battleLog, `${rowCfg?.icon || '➡️'} ${aiUnit.name} shifts to ${rowCfg?.name || action.targetRow}!`];
        set({
          battleUnits: updatedUnits,
          battleLog: log.slice(-12),
          battleState: { ...state.battleState, phase: 'animating' },
          lastAction: { attackerId: currentUnitId, type: 'move_row', targetRow: action.targetRow },
        });
      }
      return;
    }

    get().useAbility(action.abilityId, action.targetId);
  },

  handleVictory: () => {
    const state = get();
    if (state.battleState?.isTraining) {
      get().handleTrainingVictory(state.battleState.trainingRound);
      return;
    }

    if (state.battleState?.isMission && state.activeMission) {
      const mission = missionTemplates.find(m => m.id === state.activeMission.missionId);
      if (mission && state.activeMission.currentRound < mission.rounds.length - 1) {
        set({
          battleState: { ...state.battleState, phase: 'missionRoundComplete' },
          battleLog: [...state.battleLog, `Round ${state.activeMission.currentRound + 1} complete! Prepare for the next wave...`],
        });
        return;
      }

      const missionRewards = mission ? mission.rewards : { xp: 0, gold: 0 };
      const enemyUnits = state.battleUnits.filter(u => u.team === 'enemy');
      const totalXp = missionRewards.xp + enemyUnits.reduce((sum, e) => sum + (e.xpReward || 0), 0);
      const totalGold = Math.floor((missionRewards.gold + enemyUnits.reduce((sum, e) => sum + (e.goldReward || 0), 0)) * 0.1);

      let newXp = state.xp + totalXp;
      let newLevel = state.level;
      let newXpToNext = state.xpToNext;
      let newUnspent = state.unspentPoints;
      let newSkillPoints = state.skillPoints;
      let log = [...state.battleLog];

      while (newXp >= newXpToNext && newLevel < 20) {
        newXp -= newXpToNext;
        newLevel++;
        newXpToNext = Math.floor(newXpToNext * 1.4);
        newUnspent += POINTS_PER_LEVEL;
        newSkillPoints += 1;
        log.push(`LEVEL UP! You are now level ${newLevel}!`);
      }

      log.push(`MISSION COMPLETE: ${mission.title}!`);
      log.push(`Earned ${totalXp} XP and ${totalGold} Gold.`);

      const levelsGained = newLevel - state.level;
      const playerUnit = state.battleUnits.find(u => u.id === 'player');
      const updatedRoster = state.heroRoster.map(hero => {
        const battleUnit = state.battleUnits.find(u => u.id === hero.id);
        const updates = {};
        if (battleUnit) {
          updates.currentHealth = battleUnit.health;
          updates.currentMana = battleUnit.mana;
          updates.currentStamina = battleUnit.stamina;
          const rec = hero.battleRecord || { wins: 0, losses: 0, kills: 0, bossKills: 0, damageDealt: 0, healingDone: 0 };
          updates.battleRecord = { ...rec, wins: rec.wins + 1 };
        }
        if (hero.id === 'player') {
          updates.level = newLevel;
          updates.attributePoints = { ...state.attributePoints };
          updates.unspentPoints = newUnspent;
          updates.skillPoints = newSkillPoints;
        } else if (levelsGained > 0) {
          const heroNewLevel = Math.min(20, hero.level + levelsGained);
          const heroLevelsUp = heroNewLevel - hero.level;
          if (heroLevelsUp > 0) {
            updates.level = heroNewLevel;
            updates.unspentPoints = (hero.unspentPoints || 0) + (heroLevelsUp * POINTS_PER_LEVEL);
            updates.skillPoints = (hero.skillPoints || 0) + heroLevelsUp;
          }
        }
        return { ...hero, ...updates };
      });

      const completedMissions = [...state.completedMissions];
      if (!completedMissions.includes(mission.id)) completedMissions.push(mission.id);

      set({
        battleState: { ...state.battleState, phase: 'victory' },
        xp: newXp, level: newLevel, xpToNext: newXpToNext,
        gold: state.gold + totalGold,
        unspentPoints: newUnspent, skillPoints: newSkillPoints,
        victories: state.victories + 1,
        heroRoster: updatedRoster,
        completedMissions,
        activeMission: null,
        battleLog: log.slice(-12),
        playerHealth: playerUnit ? playerUnit.health : state.playerHealth,
        playerMana: playerUnit ? playerUnit.mana : state.playerMana,
        playerStamina: playerUnit ? playerUnit.stamina : state.playerStamina,
      });
      return;
    }

    if (state.battleState?.isArena) {
      const arena = arenaTemplates.find(a => a.id === state.battleState.arenaId);
      const arenaRewards = arena ? arena.rewards : { xp: 0, gold: 0 };
      const totalXp = arenaRewards.xp;
      const totalGold = Math.floor(arenaRewards.gold * 0.1);

      let newXp = state.xp + totalXp;
      let newLevel = state.level;
      let newXpToNext = state.xpToNext;
      let newUnspent = state.unspentPoints;
      let newSkillPoints = state.skillPoints;
      let log = [...state.battleLog];

      while (newXp >= newXpToNext && newLevel < 20) {
        newXp -= newXpToNext;
        newLevel++;
        newXpToNext = Math.floor(newXpToNext * 1.4);
        newUnspent += POINTS_PER_LEVEL;
        newSkillPoints += 1;
        log.push(`LEVEL UP! You are now level ${newLevel}!`);
      }

      log.push(`ARENA VICTORY: ${arena?.title}!`);
      log.push(`Earned ${totalXp} XP and ${totalGold} Gold.`);

      const levelsGained = newLevel - state.level;
      const playerUnit = state.battleUnits.find(u => u.id === 'player');
      const updatedRoster = state.heroRoster.map(hero => {
        const battleUnit = state.battleUnits.find(u => u.id === hero.id);
        const updates = {};
        if (battleUnit) {
          updates.currentHealth = battleUnit.health;
          updates.currentMana = battleUnit.mana;
          updates.currentStamina = battleUnit.stamina;
          const rec = hero.battleRecord || { wins: 0, losses: 0, kills: 0, bossKills: 0, damageDealt: 0, healingDone: 0 };
          updates.battleRecord = { ...rec, wins: rec.wins + 1 };
        }
        if (hero.id === 'player') {
          updates.level = newLevel;
          updates.attributePoints = { ...state.attributePoints };
          updates.unspentPoints = newUnspent;
          updates.skillPoints = newSkillPoints;
        } else if (levelsGained > 0) {
          const heroNewLevel = Math.min(20, hero.level + levelsGained);
          const heroLevelsUp = heroNewLevel - hero.level;
          if (heroLevelsUp > 0) {
            updates.level = heroNewLevel;
            updates.unspentPoints = (hero.unspentPoints || 0) + (heroLevelsUp * POINTS_PER_LEVEL);
            updates.skillPoints = (hero.skillPoints || 0) + heroLevelsUp;
          }
        }
        return { ...hero, ...updates };
      });

      set({
        battleState: { ...state.battleState, phase: 'victory' },
        xp: newXp, level: newLevel, xpToNext: newXpToNext,
        gold: state.gold + totalGold,
        unspentPoints: newUnspent, skillPoints: newSkillPoints,
        victories: state.victories + 1,
        heroRoster: updatedRoster,
        battleLog: log.slice(-12),
        playerHealth: playerUnit ? playerUnit.health : state.playerHealth,
        playerMana: playerUnit ? playerUnit.mana : state.playerMana,
        playerStamina: playerUnit ? playerUnit.stamina : state.playerStamina,
      });
      return;
    }

    const enemyUnits = state.battleUnits.filter(u => u.team === 'enemy');
    const locId = state.currentLocation;
    const zoneConquer = { ...state.zoneConquer };
    const currentConquer = zoneConquer[locId] || 0;

    const conquerGain = state.battleState?.isBoss ? 25 : Math.max(1, Math.floor(8 - currentConquer * 0.06));
    zoneConquer[locId] = Math.min(100, currentConquer + conquerGain);

    const xpReduction = currentConquer / 100 * 0.7;
    const rawXp = enemyUnits.reduce((sum, e) => sum + (e.xpReward || 0), 0);
    const totalXp = Math.max(1, Math.floor(rawXp * (1 - xpReduction)));
    const eventBonus = state.eventBonusRewards || null;
    const bonusGold = eventBonus?.gold || 0;
    const bonusXp = eventBonus?.xp || 0;
    const totalGold = Math.floor(enemyUnits.reduce((sum, e) => sum + (e.goldReward || 0), 0) * 0.1) + bonusGold;
    const adjustedTotalXp = totalXp + bonusXp;

    let newXp = state.xp + adjustedTotalXp;
    let newLevel = state.level;
    let newXpToNext = state.xpToNext;
    let newUnspent = state.unspentPoints;
    let newSkillPoints = state.skillPoints;
    let leveledUp = false;
    let log = [...state.battleLog];
    let bossesDefeated = [...state.bossesDefeated];
    let locationsCleared = [...state.locationsCleared];

    if (state.battleState.isBoss) {
      const bossUnit = enemyUnits.find(u => u.name.includes('★'));
      if (bossUnit?.templateId) {
        bossesDefeated.push(bossUnit.templateId);
        if (state.currentLocation && !locationsCleared.includes(state.currentLocation)) {
          locationsCleared.push(state.currentLocation);
        }
      }
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

    const zoneStatsMap = { ...state.zoneStats };
    if (locId) {
      const prev = zoneStatsMap[locId] || { kills: 0, flawless: 0 };
      const heroUnits = state.battleUnits.filter(u => u.team === 'player');
      const allAlive = heroUnits.every(u => u.health > 0);
      zoneStatsMap[locId] = {
        ...prev,
        zoneId: locId,
        kills: (prev.kills || 0) + 1,
        flawless: (prev.flawless || 0) + (allAlive ? 1 : 0),
      };
    }

    const newConquer = zoneConquer[locId] || 0;
    log.push(`✨ Victory! Gained ${adjustedTotalXp} XP and ${totalGold} Gold.${eventBonus ? ' (Event Bonus!)' : ''}`);
    if (locId) log.push(`📊 Zone conquered: ${newConquer}%${xpReduction > 0 ? ` (XP -${Math.floor(xpReduction * 100)}%)` : ''}`);

    const lootDrops = [];
    enemyUnits.forEach(e => {
      const drops = generateLoot(e.templateId, state.level, state.battleState.isBoss);
      lootDrops.push(...drops);
    });
    if (lootDrops.length > 0) {
      log.push(`🎁 Found ${lootDrops.length} item${lootDrops.length > 1 ? 's' : ''}!`);
    }

    const newVictories = state.victories + 1;
    let newMaxSlots = state.maxHeroSlots;
    let heroMsg = null;

    if (newVictories === 1 && newMaxSlots < 2) {
      newMaxSlots = 2;
      heroMsg = 'New hero slot unlocked! You can recruit a second warlord.';
    } else if (newVictories === 2 && newMaxSlots < 3) {
      newMaxSlots = 3;
      heroMsg = 'New hero slot unlocked! You can recruit a third warlord.';
    }

    const newLocCleared = locationsCleared.length;
    const prevLocCleared = state.locationsCleared.length;
    if (newLocCleared > prevLocCleared && newMaxSlots < 3 + newLocCleared) {
      newMaxSlots = Math.min(6, 3 + newLocCleared);
      heroMsg = 'Map cleared! New hero slot unlocked!';
    }

    const playerUnit = state.battleUnits.find(u => u.id === 'player');

    const levelsGained = newLevel - state.level;
    const isBossWin = !!state.battleState?.isBoss;
    const deadEnemyCount = state.battleUnits.filter(u => u.team === 'enemy' && !u.alive).length;
    const participatingHeroes = state.battleUnits.filter(u => u.team === 'player').length;
    const killsPerHero = participatingHeroes > 0 ? Math.ceil(deadEnemyCount / participatingHeroes) : 0;
    const updatedRoster = state.heroRoster.map(hero => {
      const battleUnit = state.battleUnits.find(u => u.id === hero.id);
      const updates = {};
      if (battleUnit) {
        updates.currentHealth = battleUnit.health;
        updates.currentMana = battleUnit.mana;
        updates.currentStamina = battleUnit.stamina;
        const rec = hero.battleRecord || { wins: 0, losses: 0, kills: 0, bossKills: 0, damageDealt: 0, healingDone: 0 };
        updates.battleRecord = {
          ...rec,
          wins: rec.wins + 1,
          kills: rec.kills + killsPerHero,
          bossKills: rec.bossKills + (isBossWin ? 1 : 0),
        };
      }
      if (hero.id === 'player') {
        updates.level = newLevel;
        updates.attributePoints = { ...state.attributePoints };
        updates.unspentPoints = newUnspent;
        updates.skillPoints = newSkillPoints;
        updates.unlockedSkills = { ...state.unlockedSkills };
      } else if (levelsGained > 0) {
        const heroNewLevel = Math.min(20, hero.level + levelsGained);
        const heroLevelsUp = heroNewLevel - hero.level;
        if (heroLevelsUp > 0) {
          updates.level = heroNewLevel;
          updates.unspentPoints = (hero.unspentPoints || 0) + (heroLevelsUp * POINTS_PER_LEVEL);
          updates.skillPoints = (hero.skillPoints || 0) + heroLevelsUp;
        }
      }
      return { ...hero, ...updates };
    });

    set({
      battleState: { ...state.battleState, phase: 'victory' },
      xp: newXp,
      level: newLevel,
      xpToNext: newXpToNext,
      gold: state.gold + totalGold,
      unspentPoints: newUnspent,
      skillPoints: newSkillPoints,
      victories: newVictories,
      bossesDefeated,
      locationsCleared,
      zoneConquer,
      zoneStats: zoneStatsMap,
      maxHeroSlots: newMaxSlots,
      heroRoster: updatedRoster,
      pendingLoot: lootDrops,
      battleLog: log.slice(-12),
      gameMessage: heroMsg || (leveledUp ? `Level Up! You are now level ${newLevel}!` : null),
      playerHealth: playerUnit ? playerUnit.health : state.playerHealth,
      playerMana: playerUnit ? playerUnit.mana : state.playerMana,
      playerStamina: playerUnit ? playerUnit.stamina : state.playerStamina,
      eventBonusRewards: null,
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
    const updatedRoster = state.heroRoster.map(hero => {
      const battleUnit = state.battleUnits.find(u => u.id === hero.id);
      if (battleUnit) {
        const rec = hero.battleRecord || { wins: 0, losses: 0, kills: 0, bossKills: 0, damageDealt: 0, healingDone: 0 };
        return { ...hero, battleRecord: { ...rec, losses: rec.losses + 1 } };
      }
      return hero;
    });
    set({
      battleState: { ...state.battleState, phase: 'defeat' },
      losses: state.losses + 1,
      heroRoster: updatedRoster,
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

    let updatedRoster = state.heroRoster;

    if (wasBattle) {
      if (wasDefeat) {
        newHealth = Math.floor(stats.health * 0.5);
        newMana = Math.floor(stats.mana);
        newStamina = Math.floor(stats.stamina);
        goldLost = Math.floor(state.gold * 0.1);
        msg = `You retreat wounded. Lost ${goldLost} gold.`;
        updatedRoster = state.heroRoster.map(hero => {
          const hStats = getHeroStatsWithBonuses(hero);
          return {
            ...hero,
            currentHealth: Math.floor(hStats.health * 0.5),
            currentMana: Math.floor(hStats.mana),
            currentStamina: Math.floor(hStats.stamina),
          };
        });
      } else {
        if (playerUnit) {
          newHealth = playerUnit.health;
          newMana = playerUnit.mana;
          newStamina = playerUnit.stamina;
        }
        updatedRoster = state.heroRoster.map(hero => {
          const battleUnit = state.battleUnits.find(u => u.id === hero.id);
          if (battleUnit) {
            return {
              ...hero,
              currentHealth: battleUnit.health,
              currentMana: battleUnit.mana,
              currentStamina: battleUnit.stamina,
            };
          }
          return hero;
        });
      }
    }

    const returnScreen = state.dungeonProgress ? 'scene' : 'world';

    const updates = {
      screen: returnScreen,
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
      heroRoster: updatedRoster,
    };

    if (state.dungeonProgress && !wasDefeat) {
      const dp = state.dungeonProgress;
      const next = dp.currentNode + 1;
      if (next >= dp.totalNodes) {
        updates.dungeonProgress = { ...dp, currentNode: next, completed: [...dp.completed, dp.currentNode] };
      } else {
        updates.dungeonProgress = { ...dp, currentNode: next, completed: [...dp.completed, dp.currentNode] };
      }
    }
    if (state.dungeonProgress && wasDefeat) {
      updates.dungeonProgress = null;
      updates.currentScene = null;
      updates.screen = 'world';
    }

    set(updates);
  },

  restAtInn: (customCost) => {
    const state = get();
    const cost = customCost != null ? customCost : state.level * 5;
    if (state.gold < cost) return;
    const stats = state.getStats();
    const healedRoster = state.heroRoster.map(hero => {
      const hStats = getHeroStatsWithBonuses(hero);
      return {
        ...hero,
        currentHealth: Math.floor(hStats.health),
        currentMana: Math.floor(hStats.mana),
        currentStamina: Math.floor(hStats.stamina),
      };
    });
    set({
      gold: state.gold - cost,
      playerHealth: Math.floor(stats.health),
      playerMana: Math.floor(stats.mana),
      playerStamina: Math.floor(stats.stamina),
      heroRoster: healedRoster,
      gameMessage: 'Your party rests at the inn and recovers fully!',
    });
  },

  clearMessage: () => set({ gameMessage: null }),

  getUnlockedLocations: () => {
    const state = get();
    return locations.filter(l => {
      if (l.unlocked) return true;
      if (!l.unlockLevel || state.level < l.unlockLevel) return false;
      if (l.unlockBoss && !state.bossesDefeated.includes(l.unlockBoss)) return false;
      if (l.unlockRequiredBosses && !l.unlockRequiredBosses.every(b => state.bossesDefeated.includes(b))) return false;
      return true;
    });
  },

  equipItem: (heroId, item) => {
    const state = get();
    const hero = state.heroRoster.find(h => h.id === heroId);
    if (!hero) return;
    if (!canClassEquip(hero.classId, item)) return;

    const eq = hero.equipment || {};
    if (item.slot === 'offhand' && eq.weapon?.weaponType) {
      const wt = WEAPON_TYPES[eq.weapon.weaponType];
      if (wt?.hand === '2h') return;
    }

    const currentEquip = eq[item.slot];
    let newInventory = state.inventory.filter(i => i.id !== item.id);
    if (currentEquip) newInventory.push(currentEquip);

    let newEquipment = { ...eq, [item.slot]: item };
    if (item.slot === 'weapon' && item.weaponType) {
      const wt = WEAPON_TYPES[item.weaponType];
      if (wt?.hand === '2h' && eq.offhand) {
        newInventory.push(eq.offhand);
        delete newEquipment.offhand;
      }
    }

    const updatedRoster = state.heroRoster.map(h =>
      h.id === heroId ? { ...h, equipment: newEquipment } : h
    );
    set({ heroRoster: updatedRoster, inventory: newInventory });
  },

  unequipItem: (heroId, slot) => {
    const state = get();
    const hero = state.heroRoster.find(h => h.id === heroId);
    if (!hero || !hero.equipment?.[slot]) return;

    const item = hero.equipment[slot];
    const newEquipment = { ...(hero.equipment || {}) };
    delete newEquipment[slot];

    const updatedRoster = state.heroRoster.map(h =>
      h.id === heroId ? { ...h, equipment: newEquipment } : h
    );
    set({ heroRoster: updatedRoster, inventory: [...state.inventory, item] });
  },

  addToInventory: (items) => {
    const state = get();
    set({ inventory: [...state.inventory, ...items] });
  },

  removeFromInventory: (itemId) => {
    const state = get();
    set({ inventory: state.inventory.filter(i => i.id !== itemId) });
  },

  setPendingLoot: (loot) => set({ pendingLoot: loot }),
  clearPendingLoot: () => {
    const state = get();
    set({ inventory: [...state.inventory, ...state.pendingLoot], pendingLoot: [] });
  },
  discardPendingLoot: () => set({ pendingLoot: [] }),

  refreshShop: () => {
    const state = get();
    const primaryHero = state.heroRoster.find(h => h.id === 'player');
    const classId = primaryHero?.classId || state.playerClass || 'warrior';
    const inventory = generateShopInventory(state.level, classId);
    set({ shopInventory: inventory, shopLastRefresh: Date.now() });
  },

  buyItem: (itemId) => {
    const state = get();
    const item = state.shopInventory.find(i => i.id === itemId);
    if (!item) return;
    const price = getItemPrice(item);
    if (state.gold < price) return;
    set({
      gold: state.gold - price,
      inventory: [...state.inventory, { ...item, id: `bought_${item.templateId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}` }],
      shopInventory: state.shopInventory.filter(i => i.id !== itemId),
    });
  },

  sellItem: (itemId) => {
    const state = get();
    const item = state.inventory.find(i => i.id === itemId);
    if (!item) return;
    const price = getSellPrice(item);
    set({
      gold: state.gold + price,
      inventory: state.inventory.filter(i => i.id !== itemId),
    });
  },

  completeQuest: (zoneId, questId, rewards, conquerBonus) => {
    const state = get();
    const completed = { ...state.completedQuests };
    if (!completed[zoneId]) completed[zoneId] = [];
    if (completed[zoneId].includes(questId)) return;
    completed[zoneId] = [...completed[zoneId], questId];
    const zoneConquer = { ...state.zoneConquer };
    if (conquerBonus && zoneId) {
      zoneConquer[zoneId] = Math.min(100, (zoneConquer[zoneId] || 0) + conquerBonus);
    }
    set({
      completedQuests: completed,
      gold: state.gold + (rewards?.gold || 0),
      xp: state.xp + (rewards?.xp || 0),
      zoneConquer,
    });
  },

  upgradeEquipment: (heroId, slot) => {
    const state = get();
    const hero = state.heroRoster.find(h => h.id === heroId);
    if (!hero || !hero.equipment?.[slot]) return { success: false, reason: 'No item equipped' };

    const item = hero.equipment[slot];
    if (item.tier >= 8) return { success: false, reason: 'Already at max tier' };

    const cost = UPGRADE_COSTS[item.tier];
    if (!cost) return { success: false, reason: 'Cannot upgrade further' };
    if (state.gold < cost) return { success: false, reason: 'Not enough gold' };

    const upgraded = upgradeItem(item);
    if (!upgraded) return { success: false, reason: 'Upgrade failed' };

    const updatedRoster = state.heroRoster.map(h =>
      h.id === heroId ? { ...h, equipment: { ...(h.equipment || {}), [slot]: upgraded } } : h
    );
    set({ heroRoster: updatedRoster, gold: state.gold - cost });
    return { success: true, newTier: upgraded.tier, cost };
  },

  upgradeInventoryItem: (itemId) => {
    const state = get();
    const itemIdx = state.inventory.findIndex(i => i.id === itemId);
    if (itemIdx === -1) return { success: false, reason: 'Item not found' };

    const item = state.inventory[itemIdx];
    if (item.tier >= 8) return { success: false, reason: 'Already at max tier' };

    const cost = UPGRADE_COSTS[item.tier];
    if (!cost) return { success: false, reason: 'Cannot upgrade further' };
    if (state.gold < cost) return { success: false, reason: 'Not enough gold' };

    const upgraded = upgradeItem(item);
    if (!upgraded) return { success: false, reason: 'Upgrade failed' };

    const newInventory = [...state.inventory];
    newInventory[itemIdx] = upgraded;
    set({ inventory: newInventory, gold: state.gold - cost });
    return { success: true, newTier: upgraded.tier, cost };
  },

  assignHarvest: (nodeId, heroId) => {
    const state = get();
    const hero = state.heroRoster.find(h => h.id === heroId);
    if (!hero) return;
    const alreadyHarvesting = Object.values(state.activeHarvests).includes(heroId);
    if (alreadyHarvesting) return;
    set({
      activeHarvests: { ...state.activeHarvests, [nodeId]: heroId },
      lastHarvestTick: Date.now(),
    });
  },

  recallHarvest: (nodeId) => {
    const state = get();
    const newHarvests = { ...state.activeHarvests };
    delete newHarvests[nodeId];
    set({ activeHarvests: newHarvests });
  },

  tickHarvests: () => {
    const state = get();
    const now = Date.now();
    const elapsed = (now - state.lastHarvestTick) / 1000;
    if (elapsed < 1) return;

    const newResources = { ...state.harvestResources };
    let goldGained = 0;

    const maxConquer = Math.max(0, ...Object.values(state.zoneConquer || {}));
    const conquerHarvestMult = 1 + (maxConquer / 100) * 3;

    Object.entries(state.activeHarvests).forEach(([nodeId, heroId]) => {
      const node = state.harvestNodes.find(n => n.id === nodeId);
      const hero = state.heroRoster.find(h => h.id === heroId);
      if (!node || !hero) return;
      const heroMult = 1 + (hero.level * 0.1);
      const amount = node.baseRate * heroMult * conquerHarvestMult * elapsed;
      if (node.resource === 'gold') {
        goldGained += Math.floor(amount);
      } else {
        newResources[node.resource] = (newResources[node.resource] || 0) + amount;
      }
    });

    const updates = { lastHarvestTick: now, harvestResources: newResources };
    if (goldGained > 0) updates.gold = state.gold + goldGained;
    set(updates);
  },

  enterScene: (sceneType, returnTo) => {
    set({ currentScene: sceneType, sceneReturnTo: returnTo || 'world', screen: 'scene' });
  },

  exitScene: () => {
    set({ currentScene: null, sceneReturnTo: null, dungeonProgress: null, screen: 'world' });
  },

  startDungeon: (locationId, theme) => {
    const totalNodes = theme === 'void' ? 6 : theme === 'lava' ? 6 : 5;
    set({
      currentScene: 'dungeon',
      sceneReturnTo: 'world',
      dungeonProgress: { locationId, currentNode: 0, totalNodes, completed: [], theme: theme || 'default' },
      screen: 'scene',
    });
  },

  advanceDungeon: () => {
    const state = get();
    if (!state.dungeonProgress) return;
    const next = state.dungeonProgress.currentNode + 1;
    const completed = [...state.dungeonProgress.completed, state.dungeonProgress.currentNode];
    set({
      dungeonProgress: { ...state.dungeonProgress, currentNode: next, completed },
      screen: 'scene',
    });
  },

  sellResource: (resource, amount) => {
    const state = get();
    const prices = { herbs: 2, wood: 2, ore: 4, crystals: 8 };
    const available = Math.floor(state.harvestResources[resource] || 0);
    const toSell = Math.min(amount, available);
    if (toSell <= 0) return;
    const goldGain = toSell * (prices[resource] || 1);
    set({
      harvestResources: { ...state.harvestResources, [resource]: (state.harvestResources[resource] || 0) - toSell },
      gold: state.gold + goldGain,
    });
  },

  addRandomEvent: (event) => {
    const state = get();
    const now = Date.now();
    const filtered = (state.randomEvents || []).filter(e => e.expiresAt > now);
    if (filtered.length < 3) {
      set({ randomEvents: [...filtered, event], lastEventSpawn: now });
    }
  },

  cleanExpiredEvents: () => {
    const state = get();
    const now = Date.now();
    const filtered = (state.randomEvents || []).filter(e => e.expiresAt > now);
    if (filtered.length !== (state.randomEvents || []).length) {
      set({ randomEvents: filtered });
    }
  },

  startEventBattle: (eventId) => {
    const state = get();
    const event = (state.randomEvents || []).find(e => e.id === eventId);
    if (!event) return;
    const remaining = state.randomEvents.filter(e => e.id !== eventId);
    set({ randomEvents: remaining, eventBonusRewards: event.rewards || null });
    useGameStore.setState({ currentLocation: event.locationId });
    state.startBattle(event.locationId);
  },

  setTrainingPhase: (phase) => set({ trainingPhase: phase }),

  startTrainingBattle: (round) => {
    const state = get();
    const primaryHero = state.heroRoster.find(h => h.id === 'player');
    if (primaryHero) {
      primaryHero.currentHealth = state.playerHealth;
      primaryHero.currentMana = state.playerMana;
      primaryHero.currentStamina = state.playerStamina;
      primaryHero.level = state.level;
      primaryHero.attributePoints = { ...state.attributePoints };
    }

    const playerTeam = [];
    for (const heroId of state.activeHeroIds) {
      const hero = state.heroRoster.find(h => h.id === heroId);
      if (hero) {
        const unit = createHeroBattleUnit(hero);
        if (unit) playerTeam.push(unit);
      }
    }
    if (playerTeam.length === 0) return;

    const enemyTemplateId = round === 1 ? 'goblin' : 'skeleton';
    const enemyCount = round === 1 ? 1 : 2;
    const enemyUnits = [];
    for (let i = 0; i < enemyCount; i++) {
      const enemy = createEnemy(enemyTemplateId, 1);
      if (round === 1) {
        enemy.maxHealth = Math.floor(enemy.maxHealth * 0.5);
        enemy.health = enemy.maxHealth;
        enemy.physicalDamage = Math.floor(enemy.physicalDamage * 0.5);
        enemy.magicDamage = Math.floor(enemy.magicDamage * 0.5);
      } else {
        enemy.maxHealth = Math.floor(enemy.maxHealth * 0.7);
        enemy.health = enemy.maxHealth;
        enemy.physicalDamage = Math.floor(enemy.physicalDamage * 0.7);
        enemy.magicDamage = Math.floor(enemy.magicDamage * 0.7);
      }
      if (enemy) enemyUnits.push(enemy);
    }

    const allUnits = [...playerTeam, ...enemyUnits];
    assignRowsAndPositions(playerTeam, enemyUnits);

    const turnOrder = [...allUnits].sort((a, b) => b.speed - a.speed).map(u => u.id);
    const mainUnit = playerTeam.find(u => u.id === 'player') || playerTeam[0];

    set({
      screen: 'battle',
      battleState: { phase: 'intro', turnCount: 0, isBoss: false, isTraining: true, trainingRound: round },
      battleUnits: allUnits,
      battleTurnOrder: turnOrder,
      battleCurrentTurn: 0,
      selectedTargetId: enemyUnits[0]?.id || null,
      lastAction: null,
      battleLog: [round === 1
        ? 'Training Round 1: Defeat the practice dummy! Use abilities 1-5 to attack.'
        : 'Training Round 2: Fight alongside your team! Coordinate your heroes.'],
      playerHealth: mainUnit.health,
      playerMaxHealth: mainUnit.maxHealth,
      playerMana: mainUnit.mana,
      playerMaxMana: mainUnit.maxMana,
      playerStamina: mainUnit.stamina,
      playerMaxStamina: mainUnit.maxStamina,
      cooldowns: {},
      floatingTexts: [],
    });
  },

  handleTrainingVictory: (round) => {
    const state = get();
    const totalXp = 25;
    const totalGold = 10;
    let newXp = state.xp + totalXp;
    let newLevel = state.level;
    let newXpToNext = state.xpToNext;
    let newUnspent = state.unspentPoints;
    let newSkillPoints = state.skillPoints;
    let log = [...state.battleLog];

    while (newXp >= newXpToNext && newLevel < 20) {
      newXp -= newXpToNext;
      newLevel++;
      newXpToNext = Math.floor(newXpToNext * 1.4);
      newUnspent += POINTS_PER_LEVEL;
      newSkillPoints += 1;
    }

    log.push(`Training complete! Gained ${totalXp} XP and ${totalGold} Gold.`);

    const updatedRoster = state.heroRoster.map(hero => {
      const battleUnit = state.battleUnits.find(u => u.id === hero.id);
      const updates = {};
      if (battleUnit) {
        updates.currentHealth = battleUnit.health;
        updates.currentMana = battleUnit.mana;
        updates.currentStamina = battleUnit.stamina;
      }
      if (hero.id === 'player') {
        updates.level = newLevel;
        updates.unspentPoints = newUnspent;
        updates.skillPoints = newSkillPoints;
      }
      return { ...hero, ...updates };
    });

    set({
      battleState: { ...state.battleState, phase: 'victory' },
      xp: newXp,
      level: newLevel,
      xpToNext: newXpToNext,
      gold: state.gold + totalGold,
      unspentPoints: newUnspent,
      skillPoints: newSkillPoints,
      heroRoster: updatedRoster,
      battleLog: log.slice(-12),
      victories: state.victories + 1,
    });
  },

  returnFromTraining: (round) => {
    const state = get();
    const stats = state.getStats();
    const healedRoster = state.heroRoster.map(hero => {
      const hStats = getHeroStatsWithBonuses(hero);
      return {
        ...hero,
        currentHealth: Math.floor(hStats.health),
        currentMana: Math.floor(hStats.mana),
        currentStamina: Math.floor(hStats.stamina),
      };
    });

    if (round === 1) {
      const ensureSkillPoints = Math.max(state.skillPoints, 1);
      const ensureUnspent = Math.max(state.unspentPoints, 2);
      const rosterWithPoints = healedRoster.map(h =>
        h.id === 'player' ? { ...h, skillPoints: ensureSkillPoints, unspentPoints: ensureUnspent } : h
      );
      set({
        screen: 'training',
        battleState: null, battleUnits: [], battleTurnOrder: [],
        battleCurrentTurn: 0, selectedTargetId: null, lastAction: null,
        floatingTexts: [],
        playerHealth: Math.floor(stats.health),
        playerMana: Math.floor(stats.mana),
        playerStamina: Math.floor(stats.stamina),
        heroRoster: rosterWithPoints,
        trainingPhase: 'skill_tutorial',
        skillPoints: ensureSkillPoints,
        unspentPoints: ensureUnspent,
        maxHeroSlots: 2,
      });
    } else {
      set({
        screen: 'heroCreate',
        battleState: null, battleUnits: [], battleTurnOrder: [],
        battleCurrentTurn: 0, selectedTargetId: null, lastAction: null,
        floatingTexts: [],
        playerHealth: Math.floor(stats.health),
        playerMana: Math.floor(stats.mana),
        playerStamina: Math.floor(stats.stamina),
        heroRoster: healedRoster,
        trainingPhase: 'create_hero_3',
        maxHeroSlots: 3,
        gameMessage: 'Training complete! Recruit your third warlord to form your War Party.',
      });
    }
  },

  continueFromSkillTutorial: () => {
    set({
      screen: 'heroCreate',
      trainingPhase: 'create_hero_2',
      gameMessage: 'Well done! Now recruit your second warlord.',
    });
  },

  completeTraining: () => {
    const state = get();
    const stats = state.getStats();
    set({
      screen: 'world',
      trainingPhase: null,
      playerHealth: Math.floor(stats.health),
      playerMana: Math.floor(stats.mana),
      playerStamina: Math.floor(stats.stamina),
      gameMessage: 'Your War Party is formed! The world awaits, Warlord.',
    });
  },

  resetGame: () => {
    localStorage.removeItem('grudge-warlords-save');
    const zero = { Strength: 0, Vitality: 0, Endurance: 0, Dexterity: 0, Agility: 0, Intellect: 0, Wisdom: 0, Tactics: 0 };
    set({
      screen: 'title',
      playerName: 'Hero',
      playerRace: null,
      playerClass: null,
      level: 1,
      xp: 0,
      xpToNext: 50,
      gold: 0,
      attributePoints: { ...zero },
      baseAttributePoints: { ...zero },
      unspentPoints: 7,
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
      heroRoster: [],
      activeHeroIds: [],
      heroCreationPending: false,
      maxHeroSlots: 1,
      locationsCleared: [],
      zoneConquer: {},
      zoneStats: {},
      completedQuests: {},
      inventory: [],
      shopInventory: [],
      shopLastRefresh: 0,
      pendingLoot: [],
      activeHarvests: {},
      harvestResources: { gold: 0, herbs: 0, wood: 0, ore: 0, crystals: 0 },
      lastHarvestTick: Date.now(),
      randomEvents: [],
      lastEventSpawn: Date.now(),
      trainingPhase: null,
    });
  },
}), {
  name: 'grudge-warlords-save',
  version: 4,
  migrate: (persistedState, version) => {
    if (version < 2) {
      const rarityToTier = { common: 1, uncommon: 2, rare: 3, epic: 4, legendary: 5 };
      const migrateItem = (item) => {
        if (item && item.rarity && !item.tier) {
          return { ...item, tier: rarityToTier[item.rarity] || 1 };
        }
        return item;
      };
      if (persistedState.heroRoster) {
        persistedState.heroRoster = persistedState.heroRoster.map(hero => {
          if (hero.equipment) {
            const newEquip = {};
            Object.entries(hero.equipment).forEach(([slot, item]) => {
              newEquip[slot] = migrateItem(item);
            });
            hero = { ...hero, equipment: newEquip };
          }
          return hero;
        });
      }
      if (persistedState.inventory) {
        persistedState.inventory = persistedState.inventory.map(migrateItem);
      }
      if (persistedState.pendingLoot) {
        persistedState.pendingLoot = persistedState.pendingLoot.map(migrateItem);
      }
    }
    if (version < 3) {
      const migrateAccessorySlot = (item) => {
        if (!item || item.slot !== 'accessory') return item;
        const rt = item.relicType;
        if (rt === 'amulet' || rt === 'crystal' || rt === 'totem') {
          return { ...item, slot: 'relic' };
        }
        return { ...item, slot: 'ring' };
      };
      if (persistedState.heroRoster) {
        persistedState.heroRoster = persistedState.heroRoster.map(hero => {
          if (hero.equipment) {
            const newEquip = {};
            Object.entries(hero.equipment).forEach(([slot, item]) => {
              if (slot === 'accessory') {
                const migrated = migrateAccessorySlot(item);
                newEquip[migrated.slot] = migrated;
              } else {
                newEquip[slot] = item;
              }
            });
            hero = { ...hero, equipment: newEquip };
          }
          return hero;
        });
      }
      if (persistedState.inventory) {
        persistedState.inventory = persistedState.inventory.map(migrateAccessorySlot);
      }
      if (persistedState.pendingLoot) {
        persistedState.pendingLoot = persistedState.pendingLoot.map(migrateAccessorySlot);
      }
      if (persistedState.shopInventory) {
        persistedState.shopInventory = persistedState.shopInventory.map(migrateAccessorySlot);
      }
    }
    if (version < 4) {
      if (!persistedState.zoneStats) persistedState.zoneStats = {};
      if (!persistedState.completedQuests) persistedState.completedQuests = {};
    }
    return persistedState;
  },
  partialize: (state) => ({
    screen: state.screen === 'battle' ? 'world' : state.screen,
    playerName: state.playerName,
    playerRace: state.playerRace,
    playerClass: state.playerClass,
    level: state.level,
    xp: state.xp,
    xpToNext: state.xpToNext,
    gold: state.gold,
    attributePoints: state.attributePoints,
    baseAttributePoints: state.baseAttributePoints,
    unspentPoints: state.unspentPoints,
    skillPoints: state.skillPoints,
    unlockedSkills: state.unlockedSkills,
    playerHealth: state.playerHealth,
    playerMaxHealth: state.playerMaxHealth,
    playerMana: state.playerMana,
    playerMaxMana: state.playerMaxMana,
    playerStamina: state.playerStamina,
    playerMaxStamina: state.playerMaxStamina,
    victories: state.victories,
    losses: state.losses,
    bossesDefeated: state.bossesDefeated,
    heroRoster: state.heroRoster,
    activeHeroIds: state.activeHeroIds,
    maxHeroSlots: state.maxHeroSlots,
    locationsCleared: state.locationsCleared,
    zoneConquer: state.zoneConquer,
    zoneStats: state.zoneStats,
    completedQuests: state.completedQuests,
    inventory: state.inventory,
    shopInventory: state.shopInventory,
    shopLastRefresh: state.shopLastRefresh,
    harvestResources: state.harvestResources,
    activeHarvests: state.activeHarvests,
    randomEvents: state.randomEvents,
    lastEventSpawn: state.lastEventSpawn,
    trainingPhase: state.trainingPhase,
    dungeonProgress: state.dungeonProgress,
  }),
}));

export default useGameStore;
export { getHeroSkillBonuses, getHeroStatsWithBonuses };
