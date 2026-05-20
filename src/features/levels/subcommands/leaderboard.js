import { ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import Client from '../../../structures/extendedClient.js';
import User_Level_Cache from '../cache/userLevels.cache.js';

/**
 * @typedef {import('../models/guildLevels.js').GuildLevelsType} GuildLevelsType
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 * @param { GuildLevelsType } guildConfig
 */

export async function execute(interaction, guildConfig) {
    const { client, options, guild } = interaction;

    
    if(!guildConfig) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), client.utils.Translate('errors.no_config_found_generic', interaction.locale), { flags: MessageFlags.Ephemeral });
    
    if(!guildConfig.enabled) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), client.utils.Translate('commands.level_rank.not_configured_prompt', interaction.locale));
    
    await interaction.deferReply();
    const type = options.getString('type') || 'level';

    const typeConfig = {
        level: {
            type: 'Levels',
            format: (user, data) => {
                const rank = formatRank(data);
                const name = formatName(user);
                const level = `${client.customEmojis.levelling.Level} \`${data.level.toString().padEnd(3)}\``;
                const messages = `⌨️ \`${data.totalMessages.toLocaleString().padEnd(6)}\``;
                const voice = `🎙️ \`${(data.totalVoice / 60).toFixed(1).padEnd(5)}h\``;
                const commands = `🤖 \`${data.totalCommands.toLocaleString().padEnd(6)}\``;
                
                return `${rank} ${name} | ${level} | ${messages} ${voice} ${commands}`;
            },
        },
        totalMessages: {
            type: 'Messages',
            format: (user, data) => {
                const rank = formatRank(data);
                const name = formatName(user);
                const messages = `⌨️ \`${data.totalMessages.toLocaleString().padEnd(15)}\``;
                const xp = ` ${client.customEmojis.levelling.XP} \`${data.messageXP.toLocaleString().padEnd(15)}\``
                return `${rank} ${name} | ${messages} ${xp}`;
            },
        },
        totalVoice: {
            type: 'Voice',
            format: (user, data) => {
                const rank = formatRank(data);
                const name = formatName(user);
                const voice = `🎙️ \`${(data.totalVoice / 60).toFixed(1).padEnd(15)}h\``;
                const xp = `${client.customEmojis.levelling.XP} \`${data.voiceXP.toLocaleString().padEnd(10)}\``;
                return `${rank} ${name} | ${voice} ${xp}`;
            },
        },
        totalCommands: {
            type: 'Commands',
            format: (user, data) => {
                const rank = formatRank(data);
                const name = formatName(user);
                const commands = `🤖 \`${data.totalCommands.toLocaleString().padEnd(15)}\``;
                return `${rank} ${name} | ${commands}`;
            },
        },
    };

    const config = typeConfig[type];
    if(!config) return client.utils.Embed(interaction, 'Red', 'Leaderboard Failed', 'Invalid leaderboard type');
    const topUsers = await User_Level_Cache.getTopUsers(guild.id, type);

    const userPromises = topUsers.map(async (data, i) => {
        try {
            const user = client.users.cache.get(data.userId) || (await client.users.fetch(data.userId));
            const rankedData = { ...data, rank: `${i + 1}`.padStart(2, ' ') };
            return config.format(user, rankedData);
        } catch (error) {
            console.error(`Could not fetch user ${data.userId} for leaderboard:`, error);
            return `${formatRank(rankedData)} \`@Unknown User\``;
        }
    });

    const settledResults = await Promise.allSettled(userPromises);
    const leaderboardLines = settledResults
        .filter((result) => result.status === 'fulfilled' && result.value !== null)
        .map((result) => result.value);
    
    if(leaderboardLines.length === 0) return client.utils.Embed(interaction, 'Orange', 'Leaderboard Empty', 'There is no data to display on the leaderboard yet.');

    const leaderboard = leaderboardLines.join('\n');

    try {
        const title = `${guild.name} | ${config.type} Leaderboard 🏆`;
        const description = leaderboard.length > 4096 ? leaderboard.substring(0, 4093) + '...' : leaderboard;

        await client.utils.Embed(interaction, 'DarkPurple', title, description);
    } catch (error) {
        console.error(error);
    }
}




function formatRank(data) {
    return `\`${data.rank}.\``.padEnd(4);
}

function formatName(user) {
    return `\`@${trimName(user.username).padEnd(15)}\``;
}

function trimName(name, max = 15) {
    return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}