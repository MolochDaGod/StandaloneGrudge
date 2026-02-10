const IDLE_CHATTER = [
  { trigger: 'low_health', lines: [
    "{name}: I could use a rest... my wounds haven't healed.",
    "{name}: Anyone got a potion? I'm hurting over here.",
    "{name}: We should find an inn before the next fight.",
  ]},
  { trigger: 'high_gold', lines: [
    "{name}: Our purse is getting heavy. Time to upgrade some gear!",
    "{name}: With this gold we could buy something legendary.",
    "{name}: The merchants will be pleased to see us.",
  ]},
  { trigger: 'low_gold', lines: [
    "{name}: We're running low on coin... need more hunts.",
    "{name}: Can't afford anything at this rate.",
    "{name}: Maybe we should sell some old gear.",
  ]},
  { trigger: 'boss_nearby', lines: [
    "{name}: I can feel something powerful lurking here...",
    "{name}: Stay sharp. The boss of this area is still alive.",
    "{name}: We should prepare before challenging the boss.",
  ]},
  { trigger: 'boss_defeated', lines: [
    "{name}: That boss didn't stand a chance!",
    "{name}: Another tyrant falls. The land is safer now.",
    "{name}: Victory feels good. What's next?",
  ]},
  { trigger: 'high_conquer', lines: [
    "{name}: We own this territory now. Time to push further.",
    "{name}: The locals look relieved. Our work here is nearly done.",
    "{name}: This zone is almost fully conquered. Onward!",
  ]},
  { trigger: 'new_zone', lines: [
    "{name}: Never been here before. Stay on guard.",
    "{name}: New territory... I wonder what treasures await.",
    "{name}: The air feels different here. Let's explore carefully.",
  ]},
];

const RESPONSES = [
  { trigger: 'low_health', lines: [
    "{name}: Agreed, let's find shelter.",
    "{name}: I'll cover you. Hang in there.",
    "{name}: Here, take my last potion.",
  ]},
  { trigger: 'high_gold', lines: [
    "{name}: I've had my eye on a new weapon!",
    "{name}: Let's hit the shops then.",
    "{name}: Dibs on the first upgrade!",
  ]},
  { trigger: 'low_gold', lines: [
    "{name}: The grind never stops...",
    "{name}: More battles, more loot. Simple.",
    "{name}: I know a good hunting spot.",
  ]},
  { trigger: 'boss_nearby', lines: [
    "{name}: I'm ready. Let's take it down.",
    "{name}: We need better gear first, maybe.",
    "{name}: Together we can handle anything.",
  ]},
  { trigger: 'boss_defeated', lines: [
    "{name}: Let's celebrate at the inn!",
    "{name}: I'll drink to that!",
    "{name}: We make a great team.",
  ]},
  { trigger: 'high_conquer', lines: [
    "{name}: The harvest output here is incredible now.",
    "{name}: Let's leave workers behind and move on.",
    "{name}: New challenges await beyond these borders.",
  ]},
  { trigger: 'new_zone', lines: [
    "{name}: I've heard rumors about this place...",
    "{name}: Keep your weapons ready.",
    "{name}: Exciting! New enemies, new loot!",
  ]},
];

const GENERIC_CHATTER = [
  ["{a}: Think we'll ever find the Void Throne?", "{b}: Only if we're strong enough to survive it."],
  ["{a}: My sword arm is getting stronger every day.", "{b}: Just don't cut yourself showing off."],
  ["{a}: Do you think we'll be remembered?", "{b}: Legends are made, not born. Keep fighting."],
  ["{a}: I miss a warm meal by the fire.", "{b}: After the next battle. Promise."],
  ["{a}: What drives you to keep fighting?", "{b}: Grudges don't settle themselves."],
  ["{a}: The stars look different out here.", "{b}: That's the corruption spreading. We have to stop it."],
  ["{a}: Ever wonder what's beyond the Void Throne?", "{b}: Nothing good. But we'll face it together."],
  ["{a}: My gear could use an upgrade.", "{b}: Mine too. Let's find a city soon."],
  ["{a}: How many battles have we survived?", "{b}: Lost count. But each one made us stronger."],
  ["{a}: I heard the Demon Gate hides ancient weapons.", "{b}: Then let's go claim them!"],
  ["{a}: You fight well for someone your size.", "{b}: Size isn't everything. Speed is."],
  ["{a}: This land is cursed...", "{b}: Then we'll be the ones to cleanse it."],
  ["{a}: Ready for another round?", "{b}: Always. Let's go hunt."],
  ["{a}: I need to learn some new skills.", "{b}: The skill tree has so much potential."],
  ["{a}: Remember that last boss fight?", "{b}: How could I forget? That was intense!"],
  ["{a}: Our party is getting stronger.", "{b}: Strong enough to take on anything."],
  ["{a}: What should we do next?", "{b}: Push into harder territory. We can handle it."],
  ["{a}: I found a rare drop earlier!", "{b}: Nice! Equip it and let's test it out."],
];

const GOAL_CHATTER = [
  ["{a}: We need better weapons. Let's find a merchant.", "{b}: Good idea. Our current gear won't cut it much longer."],
  ["{a}: That zone isn't conquered yet. Let's finish it.", "{b}: More conquering means better harvest yields too."],
  ["{a}: We should challenge that boss soon.", "{b}: Agreed. Time to prove our worth."],
  ["{a}: Let's grind some levels before moving on.", "{b}: Smart. No point rushing to our deaths."],
  ["{a}: The harder zones have the best loot.", "{b}: Risk and reward... I like it."],
  ["{a}: We should recruit another hero.", "{b}: More allies means more firepower!"],
];

export function generateDialogue(heroes, gameState) {
  if (!heroes || heroes.length < 2) return null;

  const { gold, level, currentZone, zoneConquer, bossesDefeated, locationsCleared, victories } = gameState;
  const hero1 = heroes[0];
  const hero2 = heroes[1 + Math.floor(Math.random() * (heroes.length - 1))];

  const currentConquer = (zoneConquer || {})[currentZone] || 0;
  const currentLoc = gameState.locations?.find(l => l.id === currentZone);
  const hasBoss = currentLoc?.boss && !bossesDefeated?.includes(currentLoc.boss);
  const bossJustDefeated = currentLoc?.boss && bossesDefeated?.includes(currentLoc.boss);

  let trigger = null;
  const healthRatio = hero1.currentHealth / (hero1.maxHealth || 100);

  if (healthRatio < 0.4) trigger = 'low_health';
  else if (gold > 500 && Math.random() > 0.5) trigger = 'high_gold';
  else if (gold < 30) trigger = 'low_gold';
  else if (hasBoss && Math.random() > 0.4) trigger = 'boss_nearby';
  else if (bossJustDefeated && Math.random() > 0.5) trigger = 'boss_defeated';
  else if (currentConquer > 70) trigger = 'high_conquer';
  else if (currentConquer < 10 && Math.random() > 0.6) trigger = 'new_zone';

  if (trigger) {
    const chatter = IDLE_CHATTER.find(c => c.trigger === trigger);
    const response = RESPONSES.find(r => r.trigger === trigger);
    if (chatter && response) {
      const line1 = chatter.lines[Math.floor(Math.random() * chatter.lines.length)].replace('{name}', hero1.name);
      const line2 = response.lines[Math.floor(Math.random() * response.lines.length)].replace('{name}', hero2.name);
      return { speaker1: hero1, speaker2: hero2, line1, line2 };
    }
  }

  if (Math.random() > 0.4) {
    const goalPool = GOAL_CHATTER;
    const genericPool = GENERIC_CHATTER;
    const pool = Math.random() > 0.5 ? goalPool : genericPool;
    const pair = pool[Math.floor(Math.random() * pool.length)];
    return {
      speaker1: hero1,
      speaker2: hero2,
      line1: pair[0].replace('{a}', hero1.name).replace('{b}', hero2.name),
      line2: pair[1].replace('{a}', hero1.name).replace('{b}', hero2.name),
    };
  }

  return null;
}
