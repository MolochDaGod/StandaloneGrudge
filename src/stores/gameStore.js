import { create } from 'zustand';
import { calculateStats, TOTAL_POINTS_AT_LEVEL, POINTS_PER_LEVEL, calculateCombatPower } from '../data/attributes';
import { classDefinitions } from '../data/classes';
import { locations, createEnemy } from '../data/enemies';
import { skillTrees } from '../data/skillTrees';

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
    const enemyPool = loc.enemies;
    const templateId = enemyPool[Math.floor(Math.random() * enemyPool.length)];
    const enemy = createEnemy(templateId, state.level);
    const stats = state.getStats();
    set({
      screen: 'battle',
      battleState: { enemy, phase: 'player_turn', turnCount: 0 },
      battleLog: [`A wild ${enemy.name} appears!`],
      playerHealth: Math.min(state.playerHealth, Math.floor(stats.health)),
      playerMaxHealth: Math.floor(stats.health),
      playerMana: Math.min(state.playerMana, Math.floor(stats.mana)),
      playerMaxMana: Math.floor(stats.mana),
      playerStamina: Math.min(state.playerStamina, Math.floor(stats.stamina)),
      playerMaxStamina: Math.floor(stats.stamina),
      playerBuffs: [],
      playerDots: [],
      playerStunned: false,
      cooldowns: {},
      turnCount: 0,
      floatingTexts: [],
    });
  },

  startBossBattle: (bossTemplateId) => {
    const state = get();
    const enemy = createEnemy(bossTemplateId, state.level + 2);
    enemy.maxHealth = Math.floor(enemy.maxHealth * 1.8);
    enemy.health = enemy.maxHealth;
    enemy.damage = Math.floor(enemy.damage * 1.3);
    enemy.defense = Math.floor(enemy.defense * 1.3);
    enemy.name = '★ ' + enemy.name + ' ★';
    enemy.xpReward = Math.floor(enemy.xpReward * 3);
    enemy.goldReward = Math.floor(enemy.goldReward * 3);
    const stats = state.getStats();
    set({
      screen: 'battle',
      battleState: { enemy, phase: 'player_turn', turnCount: 0, isBoss: true },
      battleLog: [`BOSS BATTLE: ${enemy.name} challenges you!`],
      playerHealth: Math.floor(stats.health),
      playerMaxHealth: Math.floor(stats.health),
      playerMana: Math.floor(stats.mana),
      playerMaxMana: Math.floor(stats.mana),
      playerStamina: Math.floor(stats.stamina),
      playerMaxStamina: Math.floor(stats.stamina),
      playerBuffs: [],
      playerDots: [],
      playerStunned: false,
      cooldowns: {},
      turnCount: 0,
      floatingTexts: [],
    });
  },

  useAbility: (abilityId) => {
    const state = get();
    if (!state.battleState || state.battleState.phase !== 'player_turn') return;
    const classDef = classDefinitions[state.playerClass];
    const ability = classDef.abilities.find(a => a.id === abilityId);
    if (!ability) return;
    if ((state.cooldowns[abilityId] || 0) > 0) return;
    if (ability.manaCost > state.playerMana) return;
    if (ability.staminaCost > state.playerStamina) return;

    const stats = state.getStats();
    const enemy = { ...state.battleState.enemy };
    let log = [...state.battleLog];
    let newHealth = state.playerHealth;
    let newMana = state.playerMana - ability.manaCost;
    let newStamina = state.playerStamina - ability.staminaCost;
    let newBuffs = [...state.playerBuffs];
    let newDots = [...state.playerDots];
    let cooldowns = { ...state.cooldowns };
    let floats = [];

    cooldowns[abilityId] = ability.cooldown || 0;

    if (ability.type === 'physical' || ability.type === 'magical') {
      let baseDmg = stats.damage + (state.level * 2);
      let totalDmg = Math.floor(baseDmg * ability.damage);
      let isCrit = ability.guaranteedCrit || Math.random() * 100 < stats.criticalChance;
      if (isCrit) {
        totalDmg = Math.floor(totalDmg * 1.5);
        floats.push({ text: `CRIT! ${totalDmg}`, color: '#fbbf24', x: 60, y: 30 });
        log.push(`💥 CRITICAL HIT! ${ability.name} deals ${totalDmg} damage!`);
      } else {
        let mitigated = Math.max(0, totalDmg - Math.floor(enemy.defense * 0.5));
        totalDmg = Math.max(1, mitigated);
        floats.push({ text: `-${totalDmg}`, color: '#ef4444', x: 60, y: 30 });
        log.push(`⚔️ ${ability.name} deals ${totalDmg} damage to ${enemy.name}.`);
      }
      enemy.health = Math.max(0, enemy.health - totalDmg);
      if (stats.drainHealth > 0) {
        const heal = Math.floor(totalDmg * stats.drainHealth / 100);
        newHealth = Math.min(state.playerMaxHealth, newHealth + heal);
        if (heal > 0) log.push(`💚 Lifesteal heals you for ${heal} HP.`);
      }
      if (ability.effect?.type === 'stun') {
        enemy.stunned = true;
        log.push(`💫 ${enemy.name} is stunned!`);
      }
      if (ability.effect?.type === 'dot') {
        enemy.dots = [...(enemy.dots || []), { damage: ability.effect.damage, duration: ability.effect.duration, source: ability.name }];
        log.push(`🩸 ${enemy.name} is bleeding!`);
      }
      if (ability.effect?.stat) {
        enemy.buffs = [...(enemy.buffs || [])];
        if (ability.effect.multiplier && ability.effect.multiplier < 1) {
          enemy.buffs.push({ ...ability.effect, source: ability.name });
          log.push(`❄️ ${enemy.name}'s ${ability.effect.stat} is reduced!`);
        }
      }
    } else if (ability.type === 'heal') {
      const healAmt = Math.floor(state.playerMaxHealth * ability.healPercent);
      newHealth = Math.min(state.playerMaxHealth, newHealth + healAmt);
      floats.push({ text: `+${healAmt}`, color: '#22c55e', x: 20, y: 30 });
      log.push(`💚 ${ability.name} heals you for ${healAmt} HP!`);
    } else if (ability.type === 'heal_over_time') {
      newDots.push({ heal: true, healPercent: ability.healPercent, duration: ability.duration, source: ability.name });
      log.push(`💚 ${ability.name} will heal you over ${ability.duration} turns.`);
    } else if (ability.type === 'buff') {
      if (ability.effect) {
        newBuffs.push({ ...ability.effect, source: ability.name });
        log.push(`⬆️ ${ability.name} activated! ${ability.description}`);
        floats.push({ text: 'BUFF!', color: '#6ee7b7', x: 20, y: 30 });
      }
    }

    const newBattleState = {
      ...state.battleState,
      enemy,
      phase: enemy.health <= 0 ? 'victory' : 'enemy_turn',
      turnCount: state.battleState.turnCount + 1,
    };

    set({
      battleState: newBattleState,
      battleLog: log.slice(-8),
      playerHealth: newHealth,
      playerMana: newMana,
      playerStamina: newStamina,
      playerBuffs: newBuffs,
      playerDots: newDots,
      cooldowns,
      turnCount: state.turnCount + 1,
      floatingTexts: floats,
    });

    if (enemy.health <= 0) {
      setTimeout(() => get().handleVictory(), 800);
    } else {
      setTimeout(() => get().enemyTurn(), 1000);
    }
  },

  enemyTurn: () => {
    const state = get();
    if (!state.battleState || state.battleState.phase !== 'enemy_turn') return;
    const enemy = { ...state.battleState.enemy };
    let log = [...state.battleLog];
    let newHealth = state.playerHealth;
    let floats = [];
    let newBuffs = [...state.playerBuffs];
    let newDots = [...state.playerDots];
    let cooldowns = { ...state.cooldowns };

    Object.keys(cooldowns).forEach(k => {
      if (cooldowns[k] > 0) cooldowns[k]--;
    });

    newBuffs = newBuffs.map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0);
    newDots = newDots.filter(d => {
      if (d.heal && d.duration > 0) {
        const healAmt = Math.floor(state.playerMaxHealth * d.healPercent);
        newHealth = Math.min(state.playerMaxHealth, newHealth + healAmt);
        log.push(`💚 ${d.source} heals you for ${healAmt} HP.`);
        d.duration--;
        return d.duration > 0;
      }
      return true;
    });

    if (enemy.dots && enemy.dots.length > 0) {
      enemy.dots = enemy.dots.filter(d => {
        if (d.duration > 0) {
          const dotDmg = Math.floor(enemy.maxHealth * d.damage * 0.1);
          enemy.health = Math.max(0, enemy.health - dotDmg);
          log.push(`🩸 ${d.source} deals ${dotDmg} to ${enemy.name}.`);
          d.duration--;
          return d.duration > 0;
        }
        return false;
      });
    }

    enemy.buffs = (enemy.buffs || []).map(b => ({ ...b, duration: b.duration - 1 })).filter(b => b.duration > 0);

    if (enemy.health <= 0) {
      set({
        battleState: { ...state.battleState, enemy, phase: 'victory' },
        battleLog: log.slice(-8),
        playerHealth: newHealth,
        playerBuffs: newBuffs,
        playerDots: newDots,
        cooldowns,
      });
      setTimeout(() => get().handleVictory(), 800);
      return;
    }

    if (enemy.stunned) {
      enemy.stunned = false;
      log.push(`💫 ${enemy.name} is stunned and cannot act!`);
      set({
        battleState: { ...state.battleState, enemy, phase: 'player_turn' },
        battleLog: log.slice(-8),
        playerHealth: newHealth,
        playerBuffs: newBuffs,
        playerDots: newDots,
        cooldowns,
      });
      return;
    }

    const availableAbilities = enemy.abilities.filter(a => (a.currentCooldown || 0) <= 0);
    const specialAbilities = availableAbilities.filter(a => a.cooldown && a.cooldown > 0);
    let chosenAbility;
    if (specialAbilities.length > 0 && Math.random() < 0.5) {
      chosenAbility = specialAbilities[Math.floor(Math.random() * specialAbilities.length)];
    } else {
      chosenAbility = availableAbilities[0] || enemy.abilities[0];
    }

    enemy.abilities = enemy.abilities.map(a => {
      if (a.id === chosenAbility.id) return { ...a, currentCooldown: a.cooldown || 0 };
      return { ...a, currentCooldown: Math.max(0, (a.currentCooldown || 0) - 1) };
    });

    const stats = state.getStats();
    let buffedDmgMult = 1;
    (enemy.buffs || []).forEach(b => {
      if (b.stat === 'damage' && b.multiplier) buffedDmgMult *= b.multiplier;
    });
    let playerDefMult = 1;
    newBuffs.forEach(b => {
      if (b.stat === 'evasion' && b.flat) { /* evasion handled below */ }
    });

    if (chosenAbility.type === 'buff' && chosenAbility.effect) {
      enemy.buffs = [...(enemy.buffs || []), { ...chosenAbility.effect, source: chosenAbility.name }];
      log.push(`⬆️ ${enemy.name} uses ${chosenAbility.name}!`);
      floats.push({ text: 'BUFF!', color: '#fbbf24', x: 60, y: 50 });
    } else {
      let evasionChance = stats.evasion;
      newBuffs.forEach(b => { if (b.stat === 'evasion' && b.flat) evasionChance += b.flat; });
      if (Math.random() * 100 < evasionChance) {
        log.push(`💨 You dodge ${enemy.name}'s ${chosenAbility.name}!`);
        floats.push({ text: 'DODGE!', color: '#6ee7b7', x: 20, y: 50 });
      } else {
        let rawDmg = Math.floor(enemy.damage * (chosenAbility.damage || 1) * buffedDmgMult);
        let reduction = Math.floor(stats.defense * 0.3);
        let finalDmg = Math.max(1, rawDmg - reduction);
        if (stats.damageReduction > 0) {
          finalDmg = Math.floor(finalDmg * (1 - stats.damageReduction / 100));
        }
        if (Math.random() * 100 < stats.block) {
          finalDmg = Math.floor(finalDmg * 0.4);
          log.push(`🛡️ You block! ${chosenAbility.name} deals only ${finalDmg} damage.`);
          floats.push({ text: `BLOCK! -${finalDmg}`, color: '#3b82f6', x: 20, y: 50 });
        } else {
          log.push(`${chosenAbility.icon || '⚔️'} ${enemy.name} uses ${chosenAbility.name} for ${finalDmg} damage!`);
          floats.push({ text: `-${finalDmg}`, color: '#ef4444', x: 20, y: 50 });
        }
        newHealth = Math.max(0, newHealth - finalDmg);
        if (chosenAbility.drainPercent) {
          const heal = Math.floor(finalDmg * chosenAbility.drainPercent);
          enemy.health = Math.min(enemy.maxHealth, enemy.health + heal);
          log.push(`💜 ${enemy.name} drains ${heal} HP!`);
        }
      }
    }

    const newPhase = newHealth <= 0 ? 'defeat' : 'player_turn';

    let regenHealth = newHealth;
    let regenMana = state.playerMana;
    let regenStamina = state.playerStamina;
    if (newPhase === 'player_turn') {
      regenHealth = Math.min(state.playerMaxHealth, newHealth + Math.floor(stats.healthRegen));
      regenMana = Math.min(state.playerMaxMana, regenMana + Math.floor(stats.manaRegen) + 5);
      regenStamina = Math.min(state.playerMaxStamina, regenStamina + 8);
    }

    set({
      battleState: { ...state.battleState, enemy, phase: newPhase },
      battleLog: log.slice(-8),
      playerHealth: regenHealth,
      playerMana: regenMana,
      playerStamina: regenStamina,
      playerBuffs: newBuffs,
      playerDots: newDots,
      cooldowns,
      floatingTexts: floats,
    });

    if (newHealth <= 0) {
      setTimeout(() => get().handleDefeat(), 1000);
    }
  },

  handleVictory: () => {
    const state = get();
    const enemy = state.battleState.enemy;
    const xpGained = enemy.xpReward;
    const goldGained = enemy.goldReward;
    let newXp = state.xp + xpGained;
    let newLevel = state.level;
    let newXpToNext = state.xpToNext;
    let newUnspent = state.unspentPoints;
    let newSkillPoints = state.skillPoints;
    let leveledUp = false;
    let log = [...state.battleLog];
    let bossesDefeated = [...state.bossesDefeated];

    if (state.battleState.isBoss && enemy.templateId) {
      bossesDefeated.push(enemy.templateId);
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

    log.push(`✨ Victory! Gained ${xpGained} XP and ${goldGained} Gold.`);

    set({
      battleState: { ...state.battleState, phase: 'victory' },
      xp: newXp,
      level: newLevel,
      xpToNext: newXpToNext,
      gold: state.gold + goldGained,
      unspentPoints: newUnspent,
      skillPoints: newSkillPoints,
      victories: state.victories + 1,
      bossesDefeated,
      battleLog: log.slice(-8),
      gameMessage: leveledUp ? `Level Up! You are now level ${newLevel}!` : null,
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
      battleLog: [...state.battleLog, '💀 You have been defeated...'],
    });
  },

  returnToWorld: () => {
    const state = get();
    const stats = state.getStats();
    const wasDefeat = state.battleState?.phase === 'defeat';
    const recoveredHealth = wasDefeat
      ? Math.floor(stats.health * 0.5)
      : Math.floor(stats.health);
    const goldLost = wasDefeat ? Math.floor(state.gold * 0.1) : 0;
    set({
      screen: 'world',
      battleState: null,
      currentLocation: null,
      playerHealth: recoveredHealth,
      playerMana: Math.floor(stats.mana),
      playerStamina: Math.floor(stats.stamina),
      gold: Math.max(0, state.gold - goldLost),
      gameMessage: wasDefeat ? `You retreat wounded. Lost ${goldLost} gold.` : null,
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
