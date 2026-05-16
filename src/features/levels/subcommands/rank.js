import { Events, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import Client from '../../../structures/extendedClient.js';
import User_Level_Cache from '../cache/userLevels.cache.js';
import { ExpForLevel, progressBar } from '../utils/levels.js';

/**
 * @typedef {import('../models/guildLevels.js').LevelConfigType} LevelConfigType
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 * @param { LevelConfigType } guildConfig
 */

export async function execute(interaction, guildConfig) {
    const { client, options, guild, member } = interaction;

    // const type = options.getString('log-type');
    // const enabled = options.getBoolean('enabled');
    // const channel = options.getChannel('channel') || null;

    if(!guildConfig) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), client.utils.Translate('errors.no_config_found_generic', interaction.locale), { flags: MessageFlags.Ephemeral });

    if(!guildConfig.enabled) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), client.utils.Translate('commands.level_rank.not_configured_prompt', interaction.locale));

    const user = options.getUser('user') || interaction.user;

    if(user.bot) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), client.utils.Translate('commands.level_rank.not_configured_prompt', interaction.locale, { user }));

    const userConfig = await User_Level_Cache.get(guild.id, user.id);
    if(!userConfig) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), client.utils.Translate('commands.level_rank.not_levelled_yet', interaction.locale, { user }));

    if(userConfig.level === 0 && userConfig.xp === 0) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), client.utils.Translate('commands.level_rank.not_levelled_yet', interaction.locale, { user }));


    const xpNextLevel = ExpForLevel(userConfig.level + 1) - ExpForLevel(userConfig.level)

    const title = `@${user.username}'s Rank`;
    const fields = [
        { name: 'Level', value: `**${userConfig.level}**`, inline: true },
        { name: 'XP', value: `**${progressBar(userConfig.xp, xpNextLevel)}**`, inline: true },
        { name: 'Messages', value: `**${userConfig.totalMessages.toLocaleString()}**`, inline: true },
        { name: 'Voice', value: `**${Math.floor(userConfig.totalVoice / 60)}h ${userConfig.totalVoice % 60}m**`, inline: true },
    ]

    const embed = new EmbedBuilder()
        .setColor('DarkPurple')
        .setTitle(title)
        .setThumbnail(user.displayAvatarURL())
        .addFields(
            { name: 'Level', value: `**${userConfig.level}**`, inline: true },
            { name: 'XP', value: `**${progressBar(userConfig.xp, xpNextLevel)}**`, inline: true },
            { name: 'Messages', value: `**${userConfig.totalMessages.toLocaleString()}**`, inline: true },
            { name: 'Voice', value: `**${Math.floor(userConfig.totalVoice / 60)}h ${userConfig.totalVoice % 60}m**`, inline: true }
        )
        .setImage('https://i.sstatic.net/Fzh0w.png');

    interaction.reply({ embeds: [embed] })





}