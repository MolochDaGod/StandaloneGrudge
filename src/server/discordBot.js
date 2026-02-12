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
    .setName('leaderboard')
    .setDescription('View the GRUDA Arena leaderboard')
    .addIntegerOption(opt => opt.setName('limit').setDescription('Number of entries (default 10)').setMinValue(1).setMaxValue(25)),
  new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View game server statistics'),
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Get the link to play Grudge Warlords'),
  new SlashCommandBuilder()
    .setName('link')
    .setDescription('Check if your Discord account is linked to the game'),
  new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all available bot commands'),
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
      .setFooter({ text: 'Grudge Warlords' })
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
      const raceLabel = h.race_id.charAt(0).toUpperCase() + h.race_id.slice(1);
      const classLabel = h.class_id.charAt(0).toUpperCase() + h.class_id.slice(1);
      return `**${i + 1}. ${h.name}** — Lv.${h.level} ${raceLabel} ${classLabel}`;
    }).join('\n');

    const embed = new EmbedBuilder()
      .setTitle(`🗡️ ${account.username}'s Heroes`)
      .setColor(COLORS.purple)
      .setDescription(heroList)
      .setFooter({ text: `${charsResult.rows.length} hero(es) | Grudge Warlords` })
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  } catch (err) {
    console.error('[Bot] Characters error:', err.message);
    return interaction.reply({ content: 'Could not load heroes. Try again later.', ephemeral: true });
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
    .setFooter({ text: `${all.length} total teams | Grudge Warlords` })
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
  const domain = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN || 'grudgewarlords.com';
  const embed = new EmbedBuilder()
    .setTitle('⚔️ Play Grudge Warlords')
    .setColor(COLORS.gold)
    .setDescription(`**[Click here to play!](https://${domain})**\n\nLog in with Discord to save your progress, compete in the GRUDA Arena, and earn rewards!`)
    .addFields(
      { name: '🎮 Features', value: '• 24 unique race/class combos\n• Multi-hero tactical combat\n• GRUDA PvP Arena\n• World Map with 32 zones', inline: false },
    )
    .setFooter({ text: 'Grudge Warlords' })
    .setTimestamp();

  return interaction.reply({ embeds: [embed] });
}

async function handleLink(interaction) {
  try {
    const result = await query('SELECT * FROM accounts WHERE discord_id = $1', [interaction.user.id]);
    if (!result.rows[0]) {
      return interaction.reply({
        content: '❌ Your Discord account is **not linked** to Grudge Warlords yet.\nPlay the game and click **Login with Discord** to link your account!',
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

function handleHelp(interaction) {
  const embed = new EmbedBuilder()
    .setTitle('⚔️ Grudge Warlords Bot Commands')
    .setColor(COLORS.primary)
    .setDescription('Here are all the commands you can use:')
    .addFields(
      { name: '`/profile [player]`', value: 'View your or another player\'s game profile', inline: false },
      { name: '`/characters [player]`', value: 'View your or another player\'s hero roster', inline: false },
      { name: '`/leaderboard [limit]`', value: 'View the GRUDA Arena leaderboard', inline: false },
      { name: '`/stats`', value: 'View game server statistics', inline: false },
      { name: '`/play`', value: 'Get the link to play Grudge Warlords', inline: false },
      { name: '`/link`', value: 'Check if your Discord is linked to the game', inline: false },
      { name: '`/help`', value: 'Show this help message', inline: false },
    )
    .setFooter({ text: 'Grudge Warlords | Grudge Studio' })
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
    client.user.setPresence({
      activities: [{ name: 'Grudge Warlords', type: 3 }],
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
        case 'leaderboard':
          await handleLeaderboard(interaction, arenaTeams);
          break;
        case 'stats':
          await handleStats(interaction, arenaTeams, arenaBattles);
          break;
        case 'play':
          await handlePlay(interaction);
          break;
        case 'link':
          await handleLink(interaction);
          break;
        case 'help':
          await handleHelp(interaction);
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
