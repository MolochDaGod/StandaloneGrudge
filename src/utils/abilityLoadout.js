import { classDefinitions } from '../data/classes';
import { skillTrees } from '../data/skillTrees';

export function getDefaultLoadout(classId) {
  const cls = classDefinitions[classId];
  if (!cls) return [];
  const abilities = cls.abilities;
  if (classId === 'worge') {
    const first4 = abilities.slice(0, 4).map(a => a.id);
    return [...first4, 'bear_form'];
  }
  return abilities.slice(0, 5).map(a => a.id);
}

export function getAvailableAbilities(classId, unlockedSkills = {}) {
  const cls = classDefinitions[classId];
  if (!cls) return [];

  const abilities = [...cls.abilities];

  const tree = skillTrees[classId];
  if (tree) {
    for (const tier of tree.tiers) {
      for (const skill of tier.skills) {
        if (skill.grantedAbility && (unlockedSkills[skill.id] || 0) > 0) {
          abilities.push(skill.grantedAbility);
        }
      }
    }
  }

  return abilities;
}

export function resolveLoadout(loadoutIds, classId, unlockedSkills = {}) {
  const allAbilities = getAvailableAbilities(classId, unlockedSkills);
  const abilityMap = {};
  for (const ab of allAbilities) {
    abilityMap[ab.id] = ab;
  }

  if (classId === 'worge') {
    const cls = classDefinitions[classId];
    if (cls?.bearFormAbilities) {
      for (const ab of Object.values(cls.bearFormAbilities)) {
        abilityMap[ab.id] = ab;
      }
    }
    abilityMap['revert_form'] = {
      id: 'revert_form', name: 'Revert Form', icon: '🔄',
      description: 'Revert to your normal form',
      type: 'revert_form', damage: 0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'self'
    };
  }

  const resolved = [];
  for (const id of loadoutIds) {
    if (abilityMap[id]) {
      resolved.push(abilityMap[id]);
    }
  }
  return resolved;
}

export function isSlotLocked(classId, slotIndex) {
  return classId === 'worge' && slotIndex === 4;
}
