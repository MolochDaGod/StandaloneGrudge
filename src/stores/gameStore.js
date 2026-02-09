import { create } from 'zustand';
import { calculateStats, TOTAL_POINTS_AT_LEVEL, POINTS_PER_LEVEL, calculateCombatPower } from '../data/attributes';
import { classDefinitions } from '../data/classes';
import { raceDefinitions } from '../data/races';
import { locations, createEnemy } from '../data/enemies';
import { skillTrees } from '../data/skillTrees';
import { generateLoot, getEquipmentStatBonuses, EQUIPMENT_SLOTS } from '../data/equipment';

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
  return stats;
}

function createHeroBattleUnit(hero) {
  const cls = classDefinitions[hero.classId];
  if (!cls) return null;
  const stats = getHeroStatsWithBonuses(hero);
  return {
    id: hero.id,
    name: hero.name,
    team: 'player',
    isPlayerControlled: true,
    classId: hero.classId,
    raceId: hero.raceId,
    templateId: null,
    bearForm: false,
    health: Math.min(hero.currentHealth, Math.floor(stats.health)),
    maxHealth: Math.floor(stats.health),
    mana: Math.min(hero.currentMana, Math.floor(stats.mana)),
    maxMana: Math.floor(stats.mana),
    stamina: Math.min(hero.currentStamina, Math.floor(stats.stamina)),
    maxStamina: Math.floor(stats.stamina),
    damage: stats.damage,
    defense: stats.defense,
    speed: 20 + Math.floor((hero.attributePoints.Agility || 0) * 0.3),
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
    level: hero.level,
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

  const availableAbilities = unit.abilities.filter(a =>
    (unit.cooldowns[a.id] || 0) <= 0 &&
    (a.manaCost || 0) <= unit.mana &&
    (a.staminaCost || 0) <= unit.stamina &&
    !(a.isBearForm && unit.bearForm)
  );
  if (availableAbilities.length === 0) return null;

  const attackAbilities = availableAbilities.filter(a => a.type === 'physical' || a.type === 'magical');
  const buffAbilities = availableAbilities.filter(a => a.type === 'buff');
  const hotAbilities = availableAbilities.filter(a => a.type === 'heal_over_time');
  const healAbilities = availableAbilities.filter(a => a.type === 'heal');

  if (buffAbilities.length > 0 && unit.buffs.length === 0 && Math.random() < 0.3) {
    return { abilityId: buffAbilities[0].id, targetId: unit.id };
  }

  if (unit.team === 'player' && healAbilities.length > 0) {
    const lowAlly = allies.find(a => a.health / a.maxHealth < 0.45);
    if (lowAlly) return { abilityId: healAbilities[0].id, targetId: lowAlly.id };
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
      1: [{x:18,y:68}],
      2: [{x:14,y:58},{x:22,y:78}],
      3: [{x:10,y:50},{x:20,y:68},{x:12,y:82}],
    },
    enemy: {
      1: [{x:82,y:68}],
      2: [{x:78,y:58},{x:86,y:78}],
      3: [{x:76,y:50},{x:86,y:68},{x:78,y:82}],
      4: [{x:72,y:45},{x:84,y:58},{x:74,y:72},{x:86,y:82}],
    }
  };
  const maxCount = side === 'player' ? 3 : 4;
  return p[side][Math.min(count, maxCount)] || p[side][1];
}

const useGameStore = create((set, get) => ({
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
  inventory: [],
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
  trainingPhase: null,

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
      equipment: {},
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
    const heroWithSkills = {
      ...hero,
      skillPoints: Math.max(0, hero.level),
      unlockedSkills: hero.unlockedSkills || {},
      unspentPoints: hero.unspentPoints || 0,
      equipment: hero.equipment || {},
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
    for (let i = 0; i < enemyCount; i++) {
      const templateId = loc.enemies[Math.floor(Math.random() * loc.enemies.length)];
      const enemy = createEnemy(templateId, state.level);
      if (enemy) enemyUnits.push(enemy);
    }

    const allUnits = [...playerTeam, ...enemyUnits];

    const pPositions = getFormationPositions(playerTeam.length, 'player');
    const ePositions = getFormationPositions(enemyUnits.length, 'enemy');
    playerTeam.forEach((u, i) => { u.position = pPositions[i]; });
    enemyUnits.forEach((u, i) => { u.position = ePositions[i]; });

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
    const allUnits = [...playerTeam, ...enemyUnits];

    const pPositions = getFormationPositions(playerTeam.length, 'player');
    const ePositions = getFormationPositions(enemyUnits.length, 'enemy');
    playerTeam.forEach((u, i) => { u.position = pPositions[i]; });
    enemyUnits.forEach((u, i) => { u.position = ePositions[i]; });

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
      if (ability.isBearForm) {
        attacker.bearForm = true;
        attacker.buffs.push({ ...ability.effect, source: ability.name });
        if (ability.defenseBoost) {
          attacker.buffs.push({ ...ability.defenseBoost, source: ability.name });
        }
        actionResult.targetId = currentUnitId;
        log.push(`🐻 ${attacker.name} transforms into beast form!`);
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

    get().useAbility(action.abilityId, action.targetId);
  },

  handleVictory: () => {
    const state = get();
    if (state.battleState?.isTraining) {
      get().handleTrainingVictory(state.battleState.trainingRound);
      return;
    }
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

    log.push(`✨ Victory! Gained ${totalXp} XP and ${totalGold} Gold.`);

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
      maxHeroSlots: newMaxSlots,
      heroRoster: updatedRoster,
      pendingLoot: lootDrops,
      battleLog: log.slice(-12),
      gameMessage: heroMsg || (leveledUp ? `Level Up! You are now level ${newLevel}!` : null),
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
      heroRoster: updatedRoster,
    });
  },

  restAtInn: () => {
    const state = get();
    const cost = state.level * 5;
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
    return locations.filter(l => l.unlocked || (l.unlockLevel && state.level >= l.unlockLevel));
  },

  equipItem: (heroId, item) => {
    const state = get();
    const hero = state.heroRoster.find(h => h.id === heroId);
    if (!hero) return;
    if (item.levelReq && hero.level < item.levelReq) return;
    if (item.classReq && !item.classReq.includes(hero.classId)) return;

    const currentEquip = (hero.equipment || {})[item.slot];
    let newInventory = state.inventory.filter(i => i.id !== item.id);
    if (currentEquip) newInventory.push(currentEquip);

    const updatedRoster = state.heroRoster.map(h =>
      h.id === heroId ? { ...h, equipment: { ...(h.equipment || {}), [item.slot]: item } } : h
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

  assignHarvest: (nodeId, heroId) => {
    const state = get();
    const hero = state.heroRoster.find(h => h.id === heroId);
    if (!hero) return;
    const alreadyHarvesting = Object.values(state.activeHarvests).includes(heroId);
    if (alreadyHarvesting) return;
    if (state.activeHeroIds.includes(heroId)) return;
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

    Object.entries(state.activeHarvests).forEach(([nodeId, heroId]) => {
      const node = state.harvestNodes.find(n => n.id === nodeId);
      const hero = state.heroRoster.find(h => h.id === heroId);
      if (!node || !hero) return;
      const heroMult = 1 + (hero.level * 0.1);
      const amount = node.baseRate * heroMult * elapsed;
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
        enemy.damage = Math.floor(enemy.damage * 0.5);
      } else {
        enemy.maxHealth = Math.floor(enemy.maxHealth * 0.7);
        enemy.health = enemy.maxHealth;
        enemy.damage = Math.floor(enemy.damage * 0.7);
      }
      if (enemy) enemyUnits.push(enemy);
    }

    const allUnits = [...playerTeam, ...enemyUnits];
    const pPositions = getFormationPositions(playerTeam.length, 'player');
    const ePositions = getFormationPositions(enemyUnits.length, 'enemy');
    playerTeam.forEach((u, i) => { u.position = pPositions[i]; });
    enemyUnits.forEach((u, i) => { u.position = ePositions[i]; });

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
}));

export default useGameStore;
export { getHeroSkillBonuses, getHeroStatsWithBonuses };
