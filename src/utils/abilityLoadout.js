import { classDefinitions } from '../data/classes';
import { skillTrees } from '../data/skillTrees';
import { WEAPON_SKILLS } from '../data/equipment';

export function getSignatureAbility(classId) {
  const cls = classDefinitions[classId];
  return cls?.signatureAbility || null;
}

export function getWeaponSkillsForSlot(weaponType, slotType) {
  if (!weaponType || !WEAPON_SKILLS[weaponType]) return [];
  const ws = WEAPON_SKILLS[weaponType];
  if (slotType === 'slot1') return ws.slot1 || [];
  if (slotType === 'slot23') return ws.slot23 || [];
  return [];
}

export function getClassActiveAbilities(classId) {
  const cls = classDefinitions[classId];
  if (!cls) return [];
  return [...cls.abilities];
}

export function getSkillTreeAbilities(classId, unlockedSkills = {}) {
  const tree = skillTrees[classId];
  if (!tree) return [];
  const abilities = [];
  for (const tier of tree.tiers) {
    for (const skill of tier.skills) {
      if (skill.grantedAbility && (unlockedSkills[skill.id] || 0) > 0) {
        abilities.push(skill.grantedAbility);
      }
    }
  }
  return abilities;
}

export function getAbilitiesForSlot(slotIndex, classId, weaponType, unlockedSkills = {}) {
  if (slotIndex === 0) {
    return getWeaponSkillsForSlot(weaponType, 'slot1');
  }
  if (slotIndex === 1 || slotIndex === 2) {
    const weaponSlot23 = getWeaponSkillsForSlot(weaponType, 'slot23');
    const classAbilities = getClassActiveAbilities(classId);
    return [...weaponSlot23, ...classAbilities];
  }
  if (slotIndex === 3) {
    const treeAbilities = getSkillTreeAbilities(classId, unlockedSkills);
    const classAbilities = getClassActiveAbilities(classId);
    return [...classAbilities, ...treeAbilities];
  }
  if (slotIndex === 4) {
    return [];
  }
  return [];
}

export function getDefaultLoadout(classId, weaponType) {
  const cls = classDefinitions[classId];
  if (!cls) return [];

  const sig = cls.signatureAbility;
  const slot1Skills = getWeaponSkillsForSlot(weaponType, 'slot1');
  const slot23Skills = getWeaponSkillsForSlot(weaponType, 'slot23');

  const slot1 = slot1Skills.length > 0 ? slot1Skills[0].id : (cls.abilities[0]?.id || null);
  const slot2 = slot23Skills.length > 0 ? slot23Skills[0].id : (cls.abilities[1]?.id || null);
  const slot3 = cls.abilities.length > 1 ? cls.abilities[1].id : (slot23Skills[1]?.id || null);
  const slot4 = cls.abilities.length > 2 ? cls.abilities[2].id : null;
  const slot5 = sig ? sig.id : null;

  return [slot1, slot2, slot3, slot4, slot5].filter(Boolean);
}

export function getAllAbilityMap(classId, weaponType, unlockedSkills = {}) {
  const cls = classDefinitions[classId];
  if (!cls) return {};

  const map = {};

  const ws1 = getWeaponSkillsForSlot(weaponType, 'slot1');
  const ws23 = getWeaponSkillsForSlot(weaponType, 'slot23');
  for (const ab of [...ws1, ...ws23]) map[ab.id] = ab;

  for (const ab of cls.abilities) map[ab.id] = ab;

  const treeAbs = getSkillTreeAbilities(classId, unlockedSkills);
  for (const ab of treeAbs) map[ab.id] = ab;

  if (cls.signatureAbility) map[cls.signatureAbility.id] = cls.signatureAbility;

  if (classId === 'worge' && cls.bearFormAbilities) {
    for (const ab of Object.values(cls.bearFormAbilities)) {
      map[ab.id] = ab;
    }
    map['revert_form'] = {
      id: 'revert_form', name: 'Revert Form', icon: '🔄',
      description: 'Revert to your normal form',
      type: 'revert_form', damage: 0, manaCost: 0, staminaCost: 0, cooldown: 0, target: 'self'
    };
  }

  return map;
}

export function getAvailableAbilities(classId, unlockedSkills = {}, weaponType = null) {
  const cls = classDefinitions[classId];
  if (!cls) return [];

  const abilities = [...cls.abilities];

  if (cls.signatureAbility) {
    abilities.push(cls.signatureAbility);
  }

  if (weaponType && WEAPON_SKILLS[weaponType]) {
    const ws = WEAPON_SKILLS[weaponType];
    abilities.push(...(ws.slot1 || []), ...(ws.slot23 || []));
  }

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

export function resolveLoadout(loadoutIds, classId, unlockedSkills = {}, weaponType = null) {
  const abilityMap = getAllAbilityMap(classId, weaponType, unlockedSkills);

  const resolved = [];
  for (const id of loadoutIds) {
    if (abilityMap[id]) {
      resolved.push(abilityMap[id]);
    }
  }
  return resolved;
}

export function isSlotLocked(classId, slotIndex) {
  return slotIndex === 4;
}
