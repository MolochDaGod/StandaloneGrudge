import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { query } from './db.js';

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID;

const COLORS = {
  primary: 0x6366f1,
  gold: 0xd4a96a,
  success: 0x10b981,
  danger: 0xef4444,
  info: 0x3b82f6,
  purple: 0x8b5cf6,
  fire: 0xf97316,
  ice: 0x22d3ee,
  nature: 0x4ade80,
  dark: 0x1e1b4b,
};

const RANK_TIERS = [
  { name: 'Bronze', emoji: '🥉', minWins: 0 },
  { name: 'Silver', emoji: '🥈', minWins: 5 },
  { name: 'Gold', emoji: '🥇', minWins: 15 },
  { name: 'Platinum', emoji: '💎', minWins: 30 },
  { name: 'Diamond', emoji: '💠', minWins: 50 },
  { name: 'Legend', emoji: '🏆', minWins: 100 },
];

function getRank(wins) {
  let rank = RANK_TIERS[0];
  for (const t of RANK_TIERS) {
    if (wins >= t.minWins) rank = t;
  }
  return rank;
}

const RACE_EMOJI = {
  human: '🧑', orc: '👹', elf: '🧝', undead: '💀', barbarian: '🪓', dwarf: '⛏️',
};
const CLASS_EMOJI = {
  warrior: '⚔️', mage: '🔮', worge: '🐺', ranger: '🏹',
};
const CLASS_NAMES = {
  warrior: 'Warrior', mage: 'Mage Priest', worge: 'Worge', ranger: 'Ranger',
};
const RACE_NAMES = {
  human: 'Human', orc: 'Orc', elf: 'Elf', undead: 'Undead', barbarian: 'Barbarian', dwarf: 'Dwarf',
};
const RACE_COLORS = {
  human: 0x94a3b8, orc: 0x65a30d, elf: 0x22d3ee, undead: 0xa78bfa, barbarian: 0xf43f5e, dwarf: 0xf59e0b,
};
const RACE_LORE = {
  human: 'The most numerous of the Grudge War survivors, Humans thrive through sheer adaptability. Where other races rely on innate gifts, Humans forge their destiny through will and cunning.',
  orc: 'Born in the blood pits of the Shattered Wastes, Orcs know nothing but battle. Their bones are dense as stone, their muscles forged by a lifetime of brutality.',
  elf: 'The Elves walked this world before the first grudge was spoken. Their mastery of magic and movement is unrivaled, though their arrogance has earned them many enemies.',
  undead: 'Neither alive nor truly dead, the Undead are sustained by the grudges that bind them to this world. Their rotting flesh hides an unbreakable will and dark power.',
  barbarian: 'From the frozen steppes and scorched badlands, Barbarians reject civilization and embrace primal rage. Their ferocity in battle is unmatched.',
  dwarf: 'Deep beneath the mountains, the Dwarves forged their kingdoms in stone and iron. Generations of mining and warfare have made them nearly unbreakable.',
};
const CLASS_LORE = {
  warrior: 'Forged in the crucible of the Grudge Wars, Warriors are the backbone of any warband. Their strength and endurance are unmatched on the battlefield.',
  mage: 'Drawing power from ancient ley lines and forgotten gods, Mage Priests wield destructive magic alongside sacred healing — a balance few can master.',
  worge: 'Worges walk between worlds — scholars of storm and root in mortal guise, unstoppable predators in beast form.',
  ranger: 'Silent and patient, Rangers strike from the shadows with lethal precision. Their arrows find gaps in even the thickest armor.',
};

const TIER_NAMES = { 1: 'Common', 2: 'Uncommon', 3: 'Rare', 4: 'Epic', 5: 'Legendary', 6: 'Mythic', 7: 'Divine', 8: 'Celestial' };
const TIER_EMOJI = { 1: '⬜', 2: '🟢', 3: '🔵', 4: '🟣', 5: '🟡', 6: '🔴', 7: '🔷', 8: '💗' };
const SLOT_EMOJI = { weapon: '⚔️', offhand: '🛡️', helmet: '🪖', armor: '🦺', feet: '👢', ring: '💍', relic: '🔮' };

const LOCATIONS = {
  verdant_plains: { name: 'Verdant Plains', desc: 'Peaceful grasslands on the edge of civilization. A good place to begin your journey.', level: '1-3', region: 'Verdant Wilds', emoji: '🌿' },
  dark_forest: { name: 'Dark Forest', desc: 'Ancient trees block out the sun. Dangerous creatures lurk in every shadow.', level: '3-5', region: 'Verdant Wilds', emoji: '🌲' },
  mystic_grove: { name: 'Mystic Grove', desc: 'An enchanted woodland where ancient elves once practiced their arcane arts.', level: '4-6', region: 'Verdant Wilds', emoji: '✨' },
  whispering_caverns: { name: 'Whispering Caverns', desc: 'Twisting underground tunnels. Strange echoes and glowing fungi light the way.', level: '3-5', region: 'Verdant Wilds', emoji: '🕳️' },
  haunted_marsh: { name: 'Haunted Marsh', desc: 'A fog-choked swamp where the dead refuse to stay buried.', level: '5-7', region: 'Verdant Wilds', emoji: '🌫️' },
  cursed_ruins: { name: 'Cursed Ruins', desc: 'Remnants of a fallen kingdom, haunted by undead and dark magic.', level: '6-9', region: 'Verdant Wilds', emoji: '🏚️' },
  crystal_caves: { name: 'Crystal Caves', desc: 'Glittering caverns filled with enchanted minerals and cave dwellers.', level: '5-7', region: 'Frozen Peaks', emoji: '💎' },
  thornwood_pass: { name: 'Thornwood Pass', desc: 'A treacherous mountain path tangled with thorny vines.', level: '6-8', region: 'Verdant Wilds', emoji: '🌹' },
  sunken_temple: { name: 'Sunken Temple', desc: 'A partially submerged ancient temple with forgotten treasures.', level: '6-9', region: 'Verdant Wilds', emoji: '🏛️' },
  iron_peaks: { name: 'Iron Peaks', desc: 'Jagged mountain range rich in ore and danger.', level: '8-10', region: 'Frozen Peaks', emoji: '⛰️' },
  blood_canyon: { name: 'Blood Canyon', desc: 'Red-stained cliffs where countless battles have been fought.', level: '9-11', region: 'Volcanic Wastes', emoji: '🩸' },
  frozen_tundra: { name: 'Frozen Tundra', desc: 'Endless snow and ice, home to frost beasts and storm giants.', level: '9-11', region: 'Frozen Peaks', emoji: '❄️' },
  dragon_peaks: { name: 'Dragon Peaks', desc: 'Ancient mountains where dragons once nested among the clouds.', level: '10-12', region: 'Frozen Peaks', emoji: '🐉' },
  ashen_battlefield: { name: 'Ashen Battlefield', desc: 'A scorched warzone where armies once clashed in final battle.', level: '10-12', region: 'Volcanic Wastes', emoji: '💀' },
  windswept_ridge: { name: 'Windswept Ridge', desc: 'High altitude ridge battered by eternal storms.', level: '11-13', region: 'Frozen Peaks', emoji: '🌬️' },
  molten_core: { name: 'Molten Core', desc: 'Volcanic depths where rivers of lava flow beneath crumbling stone.', level: '11-13', region: 'Volcanic Wastes', emoji: '🌋' },
  shadow_forest: { name: 'Shadow Forest', desc: 'A darkened woodland where light itself fears to enter.', level: '10-12', region: 'Shadow Realm', emoji: '🌑' },
  obsidian_wastes: { name: 'Obsidian Wastes', desc: 'Fields of shattered black glass under a crimson sky.', level: '12-14', region: 'Volcanic Wastes', emoji: '🖤' },
  ruins_of_ashenmoor: { name: 'Ruins of Ashenmoor', desc: 'The fallen capital of a once-great civilization.', level: '12-14', region: 'Ashenmoor', emoji: '🏰' },
  blight_hollow: { name: 'Blight Hollow', desc: 'A corrupted valley where dark magic poisons everything.', level: '12-14', region: 'Shadow Realm', emoji: '☠️' },
  shadow_citadel: { name: 'Shadow Citadel', desc: 'A fortress of darkness, stronghold of the Shadow Lord.', level: '13-15', region: 'Shadow Realm', emoji: '🏯' },
  stormspire_peak: { name: 'Stormspire Peak', desc: 'The tallest peak, struck by eternal lightning storms.', level: '13-15', region: 'Frozen Peaks', emoji: '⚡' },
  demon_gate: { name: 'Demon Gate', desc: 'A rift between realms where demons pour into the world.', level: '14-16', region: 'Shadow Realm', emoji: '👿' },
  abyssal_depths: { name: 'Abyssal Depths', desc: 'The deepest chasm, where ancient horrors slumber.', level: '14-16', region: 'Shadow Realm', emoji: '🕳️' },
  infernal_forge: { name: 'Infernal Forge', desc: 'A demonic foundry that crafts weapons of pure destruction.', level: '15-17', region: 'Volcanic Wastes', emoji: '🔥' },
  dreadmaw_canyon: { name: 'Dreadmaw Canyon', desc: 'A living canyon that devours the unwary.', level: '15-17', region: 'Shadow Realm', emoji: '🦷' },
  void_threshold: { name: 'Void Threshold', desc: 'The boundary between reality and the Void. Reality warps here.', level: '16-18', region: 'Shadow Realm', emoji: '🌀' },
  corrupted_spire: { name: 'Corrupted Spire', desc: 'A once-holy tower now twisted by Void energy.', level: '17-19', region: 'Shadow Realm', emoji: '🗼' },
  void_throne: { name: 'Void Throne', desc: 'The seat of the Void King. The final challenge awaits.', level: '18-20', region: 'Shadow Realm', emoji: '👑' },
  hall_of_odin: { name: 'Hall of Odin', desc: 'The celestial hall of the All-Father. A god fight awaits.', level: '20', region: 'God Realm', emoji: '⚡' },
  maw_of_madra: { name: 'Maw of Madra', desc: 'The consuming maw of the chaos god. A god fight awaits.', level: '20', region: 'God Realm', emoji: '🔥' },
  sanctum_of_omni: { name: 'Sanctum of Omni', desc: 'The transcendent sanctum of the all-seeing. A god fight awaits.', level: '20', region: 'God Realm', emoji: '🔮' },
};

const REGIONS = {
  'Verdant Wilds': { emoji: '🌿', desc: 'Lush grasslands and ancient forests — the starting region.' },
  'Frozen Peaks': { emoji: '❄️', desc: 'Snow-capped mountains and frozen wastelands.' },
  'Volcanic Wastes': { emoji: '🌋', desc: 'Scorched earth, lava rivers, and infernal fortresses.' },
  'Shadow Realm': { emoji: '🌑', desc: 'A realm of darkness, demons, and the Void King.' },
  'Ashenmoor': { emoji: '🏰', desc: 'Ruins of a fallen empire, caught between fire and shadow.' },
  'God Realm': { emoji: '✨', desc: 'The domain of the gods. Only the mightiest may enter.' },
};

const GAME_STORY = `*In an age before memory, three gods — Odin the All-Father, Madra the Flame Eternal, and Omni the All-Seeing — waged war for dominion over creation. Their conflict shattered the world into fragments, each piece carrying a grudge so deep it poisoned the land itself.*

*From the ashes rose six races, each bearing the mark of their creators' wrath. Humans adapted. Orcs raged. Elves schemed. The Undead refused death. Barbarians embraced chaos. Dwarves endured.*

*Now the Void King stirs on his throne at the edge of reality. The grudges of a broken world have fed his power for millennia. Only a Warlord — a champion who can unite heroes across all races and classes — can challenge the Void and reclaim what was lost.*

*Your grudge is your weapon. Your war party is your shield. The Void King awaits.*`;

const commands = [
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View your Grudge Warlords profile')
    .addUserOption(opt => opt.setName('player').setDescription('View another player\'s profile')),
  new SlashCommandBuilder()
    .setName('characters')
    .setDescription('View your hero roster')
    .addUserOption(opt => opt.setName('player').setDescription('View another player\'s heroes')),
  new SlashCommandBuilder()
    .setName('hero')
    .setDescription('View a detailed hero card with stats, gear, and power level')
    .addIntegerOption(opt => opt.setName('slot').setDescription('Hero slot number (1-10)').setMinValue(1).setMaxValue(10))
    .addUserOption(opt => opt.setName('player').setDescription('View another player\'s hero')),
  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View the GRUDA Arena leaderboard')
    .addIntegerOption(opt => opt.setName('limit').setDescription('Number of entries (default 10)').setMinValue(1).setMaxValue(25)),
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View game server statistics'),
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Get the link to play Grudge Warlords')
    .addStringOption(opt =>
      opt.setName('mode')
        .setDescription('Start a new campaign or continue saved')
        .addChoices(
          { name: 'New Campaign', value: 'new' },
          { name: 'Continue Saved', value: 'saved' },
        )
    ),
  new SlashCommandBuilder()
    .setName('world')
    .setDescription('Explore the world map — view zones, regions, and lore')
    .addStringOption(opt =>
      opt.setName('zone')
        .setDescription('Zone name to look up (e.g. "verdant_plains" or "Verdant Plains")')
    )
    .addStringOption(opt =>
      opt.setName('region')
        .setDescription('View all zones in a region')
        .addChoices(
          { name: 'Verdant Wilds', value: 'Verdant Wilds' },
          { name: 'Frozen Peaks', value: 'Frozen Peaks' },
          { name: 'Volcanic Wastes', value: 'Volcanic Wastes' },
          { name: 'Shadow Realm', value: 'Shadow Realm' },
          { name: 'Ashenmoor', value: 'Ashenmoor' },
          { name: 'God Realm', value: 'God Realm' },
        )
    ),
  new SlashCommandBuilder()
    .setName('lore')
    .setDescription('Discover the story, races, and factions of Grudge Warlords')
    .addStringOption(opt =>
      opt.setName('topic')
        .setDescription('What lore to view')
        .addChoices(
          { name: 'The Story', value: 'story' },
          { name: 'Races', value: 'races' },
          { name: 'Classes', value: 'classes' },
          { name: 'The Void King', value: 'voidking' },
          { name: 'The Gods', value: 'gods' },
        )
    ),
  new SlashCommandBuilder()
    .setName('link')
    .setDescription('Check if your Discord account is linked to the game'),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available bot commands'),
  // ── Management Commands ──
  new SlashCommandBuilder()
    .setName('services')
    .setDescription('Check health of all Grudge Studio services'),
  new SlashCommandBuilder()
    .setName('wallet')
    .setDescription('View your Solana wallet info'),
  new SlashCommandBuilder()
    .setName('grudgeid')
    .setDescription('View your Grudge ID and cross-platform link status'),
  new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin tools (restricted)')
    .addSubcommand(sub =>
      sub.setName('lookup')
        .setDescription('Look up a player')
        .addStringOption(opt => opt.setName('query').setDescription('Username, Discord ID, or Grudge ID').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('gold')
        .setDescription('Give or remove gold from a player')
        .addStringOption(opt => opt.setName('player').setDescription('Username or Grudge ID').setRequired(true))
        .addIntegerOption(opt => opt.setName('amount').setDescription('Amount (negative to remove)').setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName('announce')
        .setDescription('Send a webhook announcement to Discord')
        .addStringOption(opt =>
          opt.setName('type').setDescription('Announcement type').setRequired(true)
            .addChoices(
              { name: 'Update', value: 'update' },
              { name: 'Patch Notes', value: 'patch' },
              { name: 'Event', value: 'event' },
              { name: 'Milestone', value: 'milestone' },
            )
        )
        .addStringOption(opt => opt.setName('title').setDescription('Announcement title').setRequired(true))
        .addStringOption(opt => opt.setName('message').setDescription('Announcement body').setRequired(true))
    ),
];

async function registerCommands() {
  if (!DISCORD_BOT_TOKEN || !DISCORD_CLIENT_ID) {
    console.warn('[Bot] Missing DISCORD_BOT_TOKEN or DISCORD_CLIENT_ID, skipping command registration');
    return;
  }
  const rest = new REST({ version: '10' }).setToken(DISCORD_BOT_TOKEN);
  try {
    const body = commands.map(c => c.toJSON());
    if (DISCORD_GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(DISCORD_CLIENT_ID, DISCORD_GUILD_ID), { body });
      console.log(`[Bot] Registered ${body.length} guild commands`);
    } else {
      await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body });
      console.log(`[Bot] Registered ${body.length} global commands`);
    }
  } catch (err) {
    console.error('[Bot] Failed to register commands:', err.message);
  }
}

function getDomain() {
  // Check for configured public URL first
  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
  // Check platform-specific env vars
  return process.env.VERCEL_URL 
    || process.env.RAILWAY_PUBLIC_DOMAIN 
    || process.env.RENDER_EXTERNAL_URL
    || process.env.REPLIT_DOMAINS 
    || process.env.REPLIT_DEV_DOMAIN 
    || 'grudgewarlords.com';
}

async function handleProfile(interaction) {
  const targetUser = interaction.options.getUser('player') || interaction.user;
  try {
    const result = await query('SELECT * FROM accounts WHERE discord_id = $1', [targetUser.id]);
    if (!result.rows[0]) {
      return interaction.reply({
        content: `${targetUser.id === interaction.user.id ? 'You haven\'t' : `${targetUser.username} hasn't`} linked a Grudge Warlords account yet. Play the game and log in with Discord to get started!`,
        ephemeral: true,
      });
    }
    const account = result.rows[0];
    const charResult = await query('SELECT COUNT(*) as count, MAX(level) as max_level FROM characters WHERE account_id = $1', [account.id]);
    const charStats = charResult.rows[0];

    const embed = new EmbedBuilder()
      .setTitle(`⚔️ ${account.username}'s Profile`)
      .setColor(COLORS.gold)
      .setThumbnail(account.avatar_url || targetUser.displayAvatarURL({ size: 128 }))
      .addFields(
        { name: '💰 Gold', value: `${(account.gold || 0).toLocaleString()}`, inline: true },
        { name: '📦 Resources', value: `${(account.resources || 0).toLocaleString()}`, inline: true },
        { name: '👑 Premium', value: account.premium ? 'Yes' : 'No', inline: true },
        { name: '🗡️ Heroes', value: `${charStats.count || 0}`, inline: true },
        { name: '📊 Highest Level', value: `${charStats.max_level || 0}`, inline: true },
        { name: '📅 Joined', value: `<t:${Math.floor(new Date(account.created_at).getTime() / 1000)}:R>`, inline: true },
      )
      .setFooter({ text: 'Grudge Warlords • grudgewarlords.com' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error('[Bot] Profile error:', err.message);
    return interaction.reply({ content: 'Could not load profile. Try again later.', ephemeral: true });
  }
}

async function handleCharacters(interaction) {
  const targetUser = interaction.options.getUser('player') || interaction.user;
  try {
    const accountResult = await query('SELECT * FROM accounts WHERE discord_id = $1', [targetUser.id]);
    if (!accountResult.rows[0]) {
      return interaction.reply({
        content: `${targetUser.id === interaction.user.id ? 'You don\'t' : `${targetUser.username} doesn't`} have an account yet. Log in with Discord in the game to create one!`,
        ephemeral: true,
      });
    }
    const account = accountResult.rows[0];
    const charsResult = await query(
      'SELECT name, race_id, class_id, level, experience FROM characters WHERE account_id = $1 ORDER BY slot_index LIMIT 10',
      [account.id]
    );

    if (charsResult.rows.length === 0) {
      return interaction.reply({
        content: `${targetUser.id === interaction.user.id ? 'You don\'t' : `${targetUser.username} doesn't`} have any heroes yet. Start a campaign in the game to create one!`,
        ephemeral: true,
      });
    }

    const heroList = charsResult.rows.map((h, i) => {
      const re = RACE_EMOJI[h.race_id] || '❓';
      const ce = CLASS_EMOJI[h.class_id] || '❓';
      const raceLabel = RACE_NAMES[h.race_id] || h.race_id;
      const classLabel = CLASS_NAMES[h.class_id] || h.class_id;
      return `${re}${ce} **${i + 1}. ${h.name}** — Lv.${h.level} ${raceLabel} ${classLabel}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`🗡️ ${account.username}'s Heroes`)
      .setColor(COLORS.purple)
      .setDescription(heroList)
      .setFooter({ text: `${charsResult.rows.length} hero(es) • Grudge Warlords` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error('[Bot] Characters error:', err.message);
    return interaction.reply({ content: 'Could not load heroes. Try again later.', ephemeral: true });
  }
}

async function handleHero(interaction) {
  const targetUser = interaction.options.getUser('player') || interaction.user;
  const slotNum = interaction.options.getInteger('slot') || 1;

  try {
    const accountResult = await query('SELECT * FROM accounts WHERE discord_id = $1', [targetUser.id]);
    if (!accountResult.rows[0]) {
      return interaction.reply({
        content: `${targetUser.id === interaction.user.id ? 'You haven\'t' : `${targetUser.username} hasn't`} linked an account yet. Play the game and log in with Discord!`,
        ephemeral: true,
      });
    }
    const account = accountResult.rows[0];

    const heroResult = await query(
      'SELECT * FROM characters WHERE account_id = $1 ORDER BY slot_index LIMIT 10',
      [account.id]
    );

    if (heroResult.rows.length === 0) {
      return interaction.reply({ content: 'No heroes found. Create one in-game first!', ephemeral: true });
    }

    const heroIdx = slotNum - 1;
    if (heroIdx >= heroResult.rows.length) {
      return interaction.reply({
        content: `Slot ${slotNum} is empty. You have ${heroResult.rows.length} hero(es). Try \`/hero slot:${heroResult.rows.length}\``,
        ephemeral: true,
      });
    }

    const hero = heroResult.rows[heroIdx];
    const raceLabel = RACE_NAMES[hero.race_id] || hero.race_id;
    const classLabel = CLASS_NAMES[hero.class_id] || hero.class_id;
    const re = RACE_EMOJI[hero.race_id] || '❓';
    const ce = CLASS_EMOJI[hero.class_id] || '❓';
    const raceColor = RACE_COLORS[hero.race_id] || COLORS.gold;

    const attrs = hero.attribute_points || {};
    const attrLines = [
      `⚔️ STR: **${attrs.Strength || 0}**  |  💜 INT: **${attrs.Intellect || 0}**`,
      `❤️ VIT: **${attrs.Vitality || 0}**  |  🧠 WIS: **${attrs.Wisdom || 0}**`,
      `🛡️ END: **${attrs.Endurance || 0}**  |  🎯 DEX: **${attrs.Dexterity || 0}**`,
      `💨 AGI: **${attrs.Agility || 0}**  |  📐 TAC: **${attrs.Tactics || 0}**`,
    ].join('\n');

    const attrTotal = Object.values(attrs).reduce((s, v) => s + (v || 0), 0);

    const gearResult = await query(
      'SELECT item_key, item_type, tier, slot, stats FROM inventory_items WHERE character_id = $1 AND equipped = true ORDER BY slot',
      [hero.id]
    );

    let gearText = '*No gear equipped*';
    let gearPower = 0;
    if (gearResult.rows.length > 0) {
      const gearLines = gearResult.rows.map(item => {
        const se = SLOT_EMOJI[item.slot] || '📦';
        const te = TIER_EMOJI[item.tier] || '⬜';
        const tn = TIER_NAMES[item.tier] || `T${item.tier}`;
        const name = item.item_key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        const stats = item.stats || {};
        const statSum = Object.values(stats).reduce((s, v) => s + Math.abs(v || 0), 0);
        gearPower += statSum * (item.tier || 1);
        return `${se} ${te} **${name}** (${tn})`;
      });
      gearText = gearLines.join('\n');
    }

    const powerLevel = Math.round((hero.level * 100) + (attrTotal * 10) + gearPower);

    const abilities = hero.abilities || [];
    let abilityText = '*Default loadout*';
    if (abilities.length > 0) {
      abilityText = abilities.map(a => {
        if (typeof a === 'string') return `• ${a.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`;
        return `• ${(a.name || a.id || 'Unknown').replace(/_/g, ' ')}`;
      }).join('\n');
    }

    const embed = new EmbedBuilder()
      .setTitle(`${re}${ce} ${hero.name}`)
      .setColor(raceColor)
      .setDescription(`**Level ${hero.level}** ${raceLabel} ${classLabel}\n⭐ Power Level: **${powerLevel.toLocaleString()}**`)
      .addFields(
        { name: '📊 Attributes', value: attrLines, inline: false },
        { name: `🛡️ Equipment (${gearResult.rows.length}/7)`, value: gearText, inline: false },
        { name: '⚡ Abilities', value: abilityText, inline: true },
        { name: '📈 XP', value: `${(hero.experience || 0).toLocaleString()}`, inline: true },
      )
      .setFooter({ text: `Slot ${slotNum} • ${account.username} • Grudge Warlords` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error('[Bot] Hero error:', err.message);
    return interaction.reply({ content: 'Could not load hero details. Try again later.', ephemeral: true });
  }
}

async function handleLeaderboard(interaction, arenaTeams) {
  const limit = interaction.options.getInteger('limit') || 10;

  const all = Array.from(arenaTeams.values());
  const ranked = all
    .filter(t => t.totalBattles > 0)
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses)
    .slice(0, limit);

  if (ranked.length === 0) {
    return interaction.reply({ content: 'No arena entries yet. Be the first to submit a team!', ephemeral: true });
  }

  const lines = ranked.map((t, i) => {
    const rank = getRank(t.wins);
    const pos = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `**${i + 1}.**`;
    const winRate = t.totalBattles > 0 ? Math.round((t.wins / t.totalBattles) * 100) : 0;
    return `${pos} ${rank.emoji} **${t.ownerName}** — ${t.wins}W/${t.losses}L (${winRate}%)`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setTitle('🏟️ GRUDA Arena Leaderboard')
    .setColor(COLORS.info)
    .setDescription(lines)
    .setFooter({ text: `${all.length} total teams • Grudge Warlords` })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

async function handleStats(interaction, arenaTeams, arenaBattles) {
  try {
    const accountCount = await query('SELECT COUNT(*) as count FROM accounts');
    const charCount = await query('SELECT COUNT(*) as count FROM characters');
    const all = Array.from(arenaTeams.values());

    const embed = new EmbedBuilder()
      .setTitle('📊 Grudge Warlords Stats')
      .setColor(COLORS.primary)
      .addFields(
        { name: '👤 Accounts', value: `${accountCount.rows[0].count}`, inline: true },
        { name: '🗡️ Heroes Created', value: `${charCount.rows[0].count}`, inline: true },
        { name: '🏟️ Arena Teams', value: `${all.length}`, inline: true },
        { name: '⚔️ Arena Battles', value: `${arenaBattles.length}`, inline: true },
        { name: '🏆 Ranked Teams', value: `${all.filter(t => t.status === 'ranked').length}`, inline: true },
        { name: '📉 Unranked Teams', value: `${all.filter(t => t.status === 'unranked').length}`, inline: true },
      )
      .setFooter({ text: 'Grudge Warlords' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error('[Bot] Stats error:', err.message);
    return interaction.reply({ content: 'Could not load stats. Try again later.', ephemeral: true });
  }
}

function handlePlay(interaction) {
  const domain = getDomain();
  const mode = interaction.options.getString('mode');

  if (mode === 'new') {
    const embed = new EmbedBuilder()
      .setTitle('🆕 Start New Campaign')
      .setColor(COLORS.success)
      .setDescription(`**[Launch Grudge Warlords](https://${domain})**\n\n🎮 Click the link, log in with Discord, then select **New Campaign** from the War Room to begin your journey!\n\n*Choose your race and class wisely — there are 24 unique Warlord combinations to discover.*`)
      .addFields(
        { name: '🧬 Races', value: 'Human, Orc, Elf, Undead, Barbarian, Dwarf', inline: true },
        { name: '⚔️ Classes', value: 'Warrior, Mage Priest, Worge, Ranger', inline: true },
      )
      .setFooter({ text: 'Grudge Warlords • New Campaign' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }

  if (mode === 'saved') {
    const embed = new EmbedBuilder()
      .setTitle('💾 Continue Saved Game')
      .setColor(COLORS.info)
      .setDescription(`**[Launch Grudge Warlords](https://${domain})**\n\n📂 Click the link, log in with Discord, and your saved progress will load automatically.\n\n*Your heroes, gear, world progress, and arena standings are all preserved.*`)
      .addFields(
        { name: '🔄 Auto-Save', value: 'Progress saves to your Discord account', inline: true },
        { name: '🌍 Cross-Device', value: 'Play anywhere with Discord login', inline: true },
      )
      .setFooter({ text: 'Grudge Warlords • Continue' })
      .setTimestamp();
    return interaction.reply({ embeds: [embed] });
  }

  const embed = new EmbedBuilder()
    .setTitle('⚔️ Play Grudge Warlords')
    .setColor(COLORS.gold)
    .setDescription(`**[Click here to play!](https://${domain})**\n\nLog in with Discord to save your progress, compete in the GRUDA Arena, and earn rewards!`)
    .addFields(
      { name: '🎮 Features', value: '• 24 unique race/class combos\n• Multi-hero tactical combat\n• GRUDA PvP Arena\n• World Map with 32 zones\n• Equipment tiers 1-8\n• Skill trees & abilities', inline: false },
      { name: '🆕 New Game', value: '`/play mode:New Campaign`', inline: true },
      { name: '💾 Continue', value: '`/play mode:Continue Saved`', inline: true },
    )
    .setFooter({ text: 'Grudge Warlords • grudgewarlords.com' })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

function handleWorld(interaction) {
  const zoneName = interaction.options.getString('zone');
  const regionName = interaction.options.getString('region');

  if (regionName) {
    const regionInfo = REGIONS[regionName];
    const zones = Object.entries(LOCATIONS)
      .filter(([, loc]) => loc.region === regionName)
      .map(([id, loc]) => `${loc.emoji} **${loc.name}** — Lv.${loc.level}\n┗ *${loc.desc.slice(0, 60)}...*`)
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setTitle(`${regionInfo?.emoji || '🗺️'} ${regionName}`)
      .setColor(COLORS.gold)
      .setDescription(`*${regionInfo?.desc || 'A region of the world.'}*\n\n${zones || 'No zones found.'}`)
      .setFooter({ text: `World Map • Grudge Warlords` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (zoneName) {
    const zoneId = zoneName.toLowerCase().replace(/\s+/g, '_');
    const loc = LOCATIONS[zoneId];
    if (!loc) {
      const suggestions = Object.entries(LOCATIONS)
        .filter(([id, l]) => id.includes(zoneId) || l.name.toLowerCase().includes(zoneName.toLowerCase()))
        .slice(0, 5)
        .map(([, l]) => `• ${l.emoji} ${l.name}`)
        .join('\n');
      return interaction.reply({
        content: `Zone "${zoneName}" not found.${suggestions ? `\n\nDid you mean:\n${suggestions}` : ''}`,
        ephemeral: true,
      });
    }

    const regionInfo = REGIONS[loc.region];
    const embed = new EmbedBuilder()
      .setTitle(`${loc.emoji} ${loc.name}`)
      .setColor(COLORS.gold)
      .setDescription(loc.desc)
      .addFields(
        { name: '📊 Level Range', value: loc.level, inline: true },
        { name: `${regionInfo?.emoji || '🗺️'} Region`, value: loc.region, inline: true },
      )
      .setFooter({ text: 'World Map • Grudge Warlords' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  const regionList = Object.entries(REGIONS)
    .map(([name, info]) => {
      const count = Object.values(LOCATIONS).filter(l => l.region === name).length;
      return `${info.emoji} **${name}** — ${count} zones\n┗ *${info.desc}*`;
    })
    .join('\n\n');

  const embed = new EmbedBuilder()
    .setTitle('🗺️ World Map of Grudge Warlords')
    .setColor(COLORS.gold)
    .setDescription(`*32 zones across 6 regions. Conquer them all to face the Void King.*\n\n${regionList}`)
    .addFields(
      { name: '🔍 Explore a Zone', value: '`/world zone:verdant_plains`', inline: true },
      { name: '🗺️ View a Region', value: '`/world region:Shadow Realm`', inline: true },
    )
    .setFooter({ text: `${Object.keys(LOCATIONS).length} total zones • Grudge Warlords` })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

function handleLore(interaction) {
  const topic = interaction.options.getString('topic') || 'story';

  if (topic === 'races') {
    const raceList = Object.entries(RACE_NAMES)
      .map(([id, name]) => `${RACE_EMOJI[id]} **${name}**\n*${RACE_LORE[id] || 'Unknown lore.'}*`)
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setTitle('🧬 The Six Races')
      .setColor(COLORS.purple)
      .setDescription(raceList)
      .setFooter({ text: 'Grudge Warlords Lore' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (topic === 'classes') {
    const classList = Object.entries(CLASS_NAMES)
      .map(([id, name]) => `${CLASS_EMOJI[id]} **${name}**\n*${CLASS_LORE[id] || 'Unknown lore.'}*`)
      .join('\n\n');

    const embed = new EmbedBuilder()
      .setTitle('⚔️ The Four Classes')
      .setColor(COLORS.fire)
      .setDescription(classList)
      .setFooter({ text: 'Grudge Warlords Lore' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (topic === 'voidking') {
    const embed = new EmbedBuilder()
      .setTitle('👑 The Void King')
      .setColor(COLORS.dark)
      .setDescription(`*At the edge of reality, where the fabric of creation frays into nothingness, sits the Void Throne. Upon it rests the Void King — a being not born of gods or mortals, but of the grudges themselves.*\n\n*Every hatred, every betrayal, every broken oath across millennia has fed his power. He is the sum of all resentment, given terrible form. His armies of corrupted spires and void-touched horrors guard the approach to his throne.*\n\n*To challenge the Void King is to face the accumulated fury of a shattered world. Only a Warlord who has united heroes from all races, conquered every zone, and mastered the arts of war stands a chance.*\n\n*The question is not whether you have the strength. It is whether you can carry the weight of every grudge that came before you.*`)
      .addFields(
        { name: '📍 Location', value: 'Void Throne (Level 18-20)', inline: true },
        { name: '⚔️ Difficulty', value: 'Final Boss', inline: true },
      )
      .setFooter({ text: 'Grudge Warlords Lore' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (topic === 'gods') {
    const embed = new EmbedBuilder()
      .setTitle('✨ The Three Gods')
      .setColor(COLORS.gold)
      .setDescription('*Before the world broke, three gods ruled all of creation. Their war shattered everything.*')
      .addFields(
        { name: '⚡ Odin, the All-Father', value: '*God of wisdom and war. His Hall stands beyond the Void Throne, where he tests the worthiest Warlords in single combat. Those who survive earn his blessing.*', inline: false },
        { name: '🔥 Madra, the Flame Eternal', value: '*God of destruction and rebirth. The Maw of Madra is a consuming inferno where only the strongest can withstand the heat of creation itself.*', inline: false },
        { name: '🔮 Omni, the All-Seeing', value: '*God of knowledge and transcendence. The Sanctum of Omni holds secrets that can reshape reality — if you can solve the riddles within.*', inline: false },
      )
      .setFooter({ text: 'God Fights unlock after defeating the Void King • Grudge Warlords' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  const embed = new EmbedBuilder()
    .setTitle('📖 The Grudge Warlords Saga')
    .setColor(COLORS.gold)
    .setDescription(GAME_STORY)
    .addFields(
      { name: '🧬 Races', value: '`/lore topic:Races`', inline: true },
      { name: '⚔️ Classes', value: '`/lore topic:Classes`', inline: true },
      { name: '👑 Void King', value: '`/lore topic:The Void King`', inline: true },
      { name: '✨ The Gods', value: '`/lore topic:The Gods`', inline: true },
    )
    .setFooter({ text: 'Grudge Warlords Lore • grudgewarlords.com' })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

async function handleLink(interaction) {
  try {
    const result = await query('SELECT * FROM accounts WHERE discord_id = $1', [interaction.user.id]);
    if (!result.rows[0]) {
      const domain = getDomain();
      return interaction.reply({
        content: `❌ Your Discord account is **not linked** to Grudge Warlords yet.\n\n**[Click here to play and link!](https://${domain})**\nLog in with Discord in-game to connect your account.`,
        ephemeral: true,
      });
    }
    const account = result.rows[0];
    const embed = new EmbedBuilder()
      .setTitle('✅ Account Linked')
      .setColor(COLORS.success)
      .setDescription(`Your Discord account is linked to **${account.username}**`)
      .addFields(
        { name: '🆔 Account ID', value: `${account.id}`, inline: true },
        { name: '📅 Last Login', value: account.last_login ? `<t:${Math.floor(new Date(account.last_login).getTime() / 1000)}:R>` : 'Never', inline: true },
      )
      .setFooter({ text: 'Grudge Warlords' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (err) {
    console.error('[Bot] Link error:', err.message);
    return interaction.reply({ content: 'Could not check link status. Try again later.', ephemeral: true });
  }
}

// ── Management: /services ───────────────────────────────────────────────────
const ECOSYSTEM_SERVICES = [
  { name: 'Grudge Warlords', url: 'https://grudgewarlords.com/api/discord/login', emoji: '🏴' },
  { name: 'Grudge Platform', url: 'https://grudge-platform.vercel.app/api/health', emoji: '⚔️' },
  { name: 'Crafting Suite', url: 'https://warlord-crafting-suite.vercel.app', emoji: '🔨' },
  { name: 'GDevelop Assistant', url: 'https://gdevelop-assistant.vercel.app', emoji: '🎮' },
  { name: 'Nexus Hub', url: 'https://grudachain.grudgestudio.com', emoji: '⚓' },
  { name: 'GRUDA Legion', url: 'https://gruda-legion-production.up.railway.app/health', emoji: '🤖' },
  { name: 'App Gallery', url: 'https://grudachain-app-gallery.vercel.app', emoji: '🖼️' },
];

async function handleServices(interaction) {
  await interaction.deferReply();
  const results = await Promise.all(ECOSYSTEM_SERVICES.map(async (svc) => {
    const start = Date.now();
    try {
      const res = await fetch(svc.url, { method: 'GET', signal: AbortSignal.timeout(8000) });
      const ms = Date.now() - start;
      return { ...svc, ok: res.ok || res.type === 'opaque', ms, status: res.status };
    } catch (e) {
      return { ...svc, ok: false, ms: Date.now() - start, error: e.message };
    }
  }));

  const online = results.filter(r => r.ok).length;
  const lines = results.map(r =>
    `${r.ok ? '🟢' : '🔴'} ${r.emoji} **${r.name}** — ${r.ok ? `${r.ms}ms` : r.error || 'offline'}`
  ).join('\n');

  const embed = new EmbedBuilder()
    .setTitle('📡 Grudge Studio — Service Health')
    .setColor(online === results.length ? COLORS.success : online > 0 ? COLORS.gold : COLORS.danger)
    .setDescription(lines)
    .addFields(
      { name: 'Status', value: `${online}/${results.length} services online`, inline: true },
      { name: 'Checked', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
    )
    .setFooter({ text: 'Grudge Studio Ecosystem' })
    .setTimestamp();

  return interaction.editReply({ embeds: [embed] });
}

// ── Management: /wallet ─────────────────────────────────────────────────────
async function handleWallet(interaction) {
  try {
    const result = await query('SELECT * FROM accounts WHERE discord_id = $1', [interaction.user.id]);
    if (!result.rows[0]) {
      return interaction.reply({ content: '❌ No linked account. Log in with Discord in-game first.', ephemeral: true });
    }
    const account = result.rows[0];

    const embed = new EmbedBuilder()
      .setTitle('💰 Your Wallet')
      .setColor(COLORS.gold)
      .setDescription(`Wallet for **${account.username}**`)
      .addFields(
        { name: '💳 Address', value: account.wallet_address ? `\`${account.wallet_address}\`` : '*No wallet yet — one will be created on next login*', inline: false },
        { name: '⛓️ Chain', value: account.wallet_chain || 'Solana', inline: true },
        { name: '💰 Gold', value: `${(account.gold || 0).toLocaleString()}`, inline: true },
        { name: '👑 Premium', value: account.premium ? 'Yes' : 'No', inline: true },
      )
      .setFooter({ text: 'Grudge Warlords • Powered by Crossmint' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (err) {
    console.error('[Bot] Wallet error:', err.message);
    return interaction.reply({ content: 'Could not load wallet. Try again later.', ephemeral: true });
  }
}

// ── Management: /grudgeid ───────────────────────────────────────────────────
async function handleGrudgeId(interaction) {
  try {
    const result = await query('SELECT * FROM accounts WHERE discord_id = $1', [interaction.user.id]);
    if (!result.rows[0]) {
      return interaction.reply({ content: '❌ No linked account. Log in with Discord in-game first.', ephemeral: true });
    }
    const account = result.rows[0];
    const charCount = await query('SELECT COUNT(*) as count FROM characters WHERE account_id = $1', [account.id]);
    const islandCount = await query('SELECT COUNT(*) as count FROM islands WHERE account_id = $1', [account.id]);

    const embed = new EmbedBuilder()
      .setTitle('🆔 Your Grudge ID')
      .setColor(COLORS.primary)
      .setDescription(`\`${account.grudge_id || 'Not assigned'}\`\n\n*Your Grudge ID is your cross-platform identity across all Grudge Studio services.*`)
      .addFields(
        { name: '👤 Username', value: account.username || 'Unknown', inline: true },
        { name: '🎮 Grudge Username', value: account.grudge_username || '*Not set*', inline: true },
        { name: '🔗 Discord', value: `<@${interaction.user.id}>`, inline: true },
        { name: '🗡️ Heroes', value: `${charCount.rows[0]?.count || 0}`, inline: true },
        { name: '🏝️ Islands', value: `${islandCount.rows[0]?.count || 0}`, inline: true },
        { name: '💳 Wallet', value: account.wallet_address ? `\`${account.wallet_address.slice(0, 8)}...\`` : 'None', inline: true },
        { name: '📅 Created', value: account.created_at ? `<t:${Math.floor(new Date(account.created_at).getTime() / 1000)}:D>` : 'Unknown', inline: true },
        { name: '📅 Last Login', value: account.last_login ? `<t:${Math.floor(new Date(account.last_login).getTime() / 1000)}:R>` : 'Never', inline: true },
      )
      .setFooter({ text: 'Use this Grudge ID to link accounts on grudgeplatform.com' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (err) {
    console.error('[Bot] GrudgeId error:', err.message);
    return interaction.reply({ content: 'Could not load Grudge ID. Try again later.', ephemeral: true });
  }
}

// ── Management: /admin ──────────────────────────────────────────────────────
const ADMIN_DISCORD_IDS = [
  '339541454052474880', // Add your Discord user ID(s) here
];

function isAdmin(interaction) {
  // Check by Discord ID or by server admin permission
  return ADMIN_DISCORD_IDS.includes(interaction.user.id)
    || interaction.memberPermissions?.has('Administrator');
}

async function handleAdmin(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({ content: '🔒 Admin commands are restricted.', ephemeral: true });
  }

  const sub = interaction.options.getSubcommand();

  if (sub === 'lookup') {
    const q = interaction.options.getString('query');
    try {
      const result = await query(
        `SELECT * FROM accounts WHERE discord_id = $1 OR username ILIKE $2 OR grudge_id = $3 OR grudge_username ILIKE $2 LIMIT 1`,
        [q, q, q]
      );
      if (!result.rows[0]) {
        return interaction.reply({ content: `❌ No account found for "${q}"`, ephemeral: true });
      }
      const a = result.rows[0];
      const chars = await query('SELECT COUNT(*) as count, MAX(level) as max FROM characters WHERE account_id = $1', [a.id]);
      const teams = await query('SELECT COUNT(*) as count, SUM(wins) as wins FROM arena_teams WHERE owner_id = $1', [String(a.id)]);

      const embed = new EmbedBuilder()
        .setTitle(`🔍 Admin Lookup: ${a.username}`)
        .setColor(COLORS.info)
        .addFields(
          { name: 'ID', value: `${a.id}`, inline: true },
          { name: 'Grudge ID', value: a.grudge_id || 'None', inline: true },
          { name: 'Discord', value: a.discord_id ? `<@${a.discord_id}>` : 'None', inline: true },
          { name: 'Email', value: a.email || 'None', inline: true },
          { name: 'Auth Type', value: a.auth_type || 'Unknown', inline: true },
          { name: 'Premium', value: a.premium ? '✅' : '❌', inline: true },
          { name: 'Gold', value: `${(a.gold || 0).toLocaleString()}`, inline: true },
          { name: 'Resources', value: `${(a.resources || 0).toLocaleString()}`, inline: true },
          { name: 'Wallet', value: a.wallet_address || 'None', inline: true },
          { name: 'Heroes', value: `${chars.rows[0]?.count || 0} (max lv.${chars.rows[0]?.max || 0})`, inline: true },
          { name: 'Arena Teams', value: `${teams.rows[0]?.count || 0} (${teams.rows[0]?.wins || 0} wins)`, inline: true },
          { name: 'Created', value: a.created_at ? `<t:${Math.floor(new Date(a.created_at).getTime() / 1000)}:f>` : '?', inline: true },
        )
        .setFooter({ text: 'Admin Lookup • Grudge Studio' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error('[Bot] Admin lookup error:', err.message);
      return interaction.reply({ content: `Error: ${err.message}`, ephemeral: true });
    }
  }

  if (sub === 'gold') {
    const playerQuery = interaction.options.getString('player');
    const amount = interaction.options.getInteger('amount');
    try {
      const result = await query(
        `SELECT * FROM accounts WHERE username ILIKE $1 OR grudge_id = $2 LIMIT 1`,
        [playerQuery, playerQuery]
      );
      if (!result.rows[0]) {
        return interaction.reply({ content: `❌ Player "${playerQuery}" not found`, ephemeral: true });
      }
      const a = result.rows[0];
      await query('UPDATE accounts SET gold = GREATEST(0, gold + $1) WHERE id = $2', [amount, a.id]);
      const newGold = Math.max(0, (a.gold || 0) + amount);

      const action = amount >= 0 ? `gave **${amount}** gold to` : `removed **${Math.abs(amount)}** gold from`;
      return interaction.reply({
        content: `✅ ${action} **${a.username}** — new balance: **${newGold.toLocaleString()}g**`,
        ephemeral: true,
      });
    } catch (err) {
      console.error('[Bot] Admin gold error:', err.message);
      return interaction.reply({ content: `Error: ${err.message}`, ephemeral: true });
    }
  }

  if (sub === 'announce') {
    const type = interaction.options.getString('type');
    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const webhookUrl = process.env.DISCORD_GRUDGE_WEBHOOK;

    if (!webhookUrl) {
      return interaction.reply({ content: '❌ Webhook not configured (DISCORD_GRUDGE_WEBHOOK)', ephemeral: true });
    }

    try {
      const typeColors = { update: COLORS.info, patch: COLORS.purple, event: COLORS.fire, milestone: COLORS.gold };
      const color = typeColors[type] || COLORS.gold;
      const typeLabel = { update: '🆕 Game Update', patch: '🔧 Patch Notes', event: '🎉 Event', milestone: '🏆 Milestone' };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Grudge Warlords',
          avatar_url: 'https://grudgewarlords.com/icons/logo.png',
          embeds: [{
            title: `${typeLabel[type] || type}: ${title}`,
            description: message,
            color,
            footer: { text: 'Grudge Warlords | grudgewarlords.com' },
            timestamp: new Date().toISOString(),
          }],
        }),
      });

      return interaction.reply({ content: `✅ Announcement sent: **${title}**`, ephemeral: true });
    } catch (err) {
      console.error('[Bot] Announce error:', err.message);
      return interaction.reply({ content: `Error: ${err.message}`, ephemeral: true });
    }
  }

  return interaction.reply({ content: 'Unknown admin subcommand.', ephemeral: true });
}

// ── Help (updated) ──────────────────────────────────────────────────────────
function handleHelp(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('⚔️ Grudge Warlords Bot Commands')
    .setColor(COLORS.primary)
    .setDescription('All commands for Grudge Warlords & Grudge Studio:')
    .addFields(
      { name: '🎮 Gameplay', value: [
        '`/play` — Launch the game',
        '`/play mode:New Campaign` — Start fresh',
        '`/play mode:Continue Saved` — Resume your adventure',
      ].join('\n'), inline: false },
      { name: '👤 Account', value: [
        '`/profile [player]` — View game profile',
        '`/characters [player]` — View hero roster',
        '`/hero [slot] [player]` — Detailed hero card',
        '`/link` — Check Discord account link',
        '`/grudgeid` — View your Grudge ID & cross-platform info',
        '`/wallet` — View your Solana wallet',
      ].join('\n'), inline: false },
      { name: '🏟️ Arena', value: [
        '`/leaderboard [limit]` — Arena rankings',
        '`/stats` — Server statistics',
      ].join('\n'), inline: false },
      { name: '🌍 World & Lore', value: [
        '`/world` — World map overview',
        '`/world zone:name` — Zone details',
        '`/world region:name` — Region zones',
        '`/lore [topic]` — Game story, races, classes, gods',
      ].join('\n'), inline: false },
      { name: '📡 Platform', value: [
        '`/services` — Health check all Grudge Studio services',
      ].join('\n'), inline: false },
      { name: '🔒 Admin', value: [
        '`/admin lookup <query>` — Look up any player',
        '`/admin gold <player> <amount>` — Give/remove gold',
        '`/admin announce <type> <title> <message>` — Send announcement',
      ].join('\n'), inline: false },
    )
    .setFooter({ text: 'Grudge Warlords • Grudge Studio' })
    .setTimestamp();

  return interaction.reply({ embeds: [embed], ephemeral: true });
}

export async function startBot(arenaTeams, arenaBattles) {
  if (!DISCORD_BOT_TOKEN) {
    console.warn('[Bot] DISCORD_BOT_TOKEN not set, bot will not start');
    return null;
  }

  await registerCommands();

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
    ],
  });

  client.on('ready', () => {
    console.log(`[Bot] Logged in as ${client.user.tag}`);
    console.log(`[Bot] Serving ${commands.length} slash commands`);
    client.user.setPresence({
      activities: [{ name: 'Grudge Warlords | /play', type: 3 }],
      status: 'online',
    });
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    try {
      switch (interaction.commandName) {
        case 'profile':
          await handleProfile(interaction);
          break;
        case 'characters':
          await handleCharacters(interaction);
          break;
        case 'hero':
          await handleHero(interaction);
          break;
        case 'leaderboard':
          await handleLeaderboard(interaction, arenaTeams);
          break;
        case 'stats':
          await handleStats(interaction, arenaTeams, arenaBattles);
          break;
        case 'play':
          await handlePlay(interaction);
          break;
        case 'world':
          await handleWorld(interaction);
          break;
        case 'lore':
          await handleLore(interaction);
          break;
        case 'link':
          await handleLink(interaction);
          break;
        case 'help':
          await handleHelp(interaction);
          break;
        case 'services':
          await handleServices(interaction);
          break;
        case 'wallet':
          await handleWallet(interaction);
          break;
        case 'grudgeid':
          await handleGrudgeId(interaction);
          break;
        case 'admin':
          await handleAdmin(interaction);
          break;
        default:
          await interaction.reply({ content: 'Unknown command.', ephemeral: true });
      }
    } catch (err) {
      console.error(`[Bot] Command error (${interaction.commandName}):`, err.message);
      const reply = { content: 'Something went wrong. Please try again.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(() => {});
      } else {
        await interaction.reply(reply).catch(() => {});
      }
    }
  });

  await client.login(DISCORD_BOT_TOKEN);
  return client;
}

export async function addUserToGuild(accessToken, userId) {
  const botToken = DISCORD_BOT_TOKEN;
  const guildId = DISCORD_GUILD_ID;
  if (!botToken || !guildId) {
    console.warn('[Bot] Cannot auto-join: missing DISCORD_BOT_TOKEN or DISCORD_GUILD_ID');
    return false;
  }
  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bot ${botToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ access_token: accessToken }),
    });
    if (res.status === 201) {
      console.log(`[Bot] Added user ${userId} to guild`);
      return true;
    }
    if (res.status === 204) {
      return true;
    }
    const err = await res.text();
    console.error(`[Bot] Guild join failed (${res.status}):`, err);
    return false;
  } catch (err) {
    console.error('[Bot] Guild join error:', err.message);
    return false;
  }
}
