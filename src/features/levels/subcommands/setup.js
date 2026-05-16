import { Events, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags, EmbedBuilder } from 'discord.js';
import Client from '../../../structures/extendedClient.js';
import User_Level_Cache from '../cache/userLevels.cache.js';
import Guild_Level_Cache from '../cache/guildLevels.cache.js';
import { ExpForLevel, progressBar } from '../utils/levels.js';

/**
 * @typedef {import('../models/guildLevels.js').LevelConfigType} LevelConfigType
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 * @param { LevelConfigType } guildConfig
 */

export async function execute(interaction, guildConfig) {
    const { client, options, guild, member } = interaction;

    const enabled = options.getBoolean('enabled');
    const channel = options.getChannel('channel') || null;

    // User Permissions
    const userpermissions = [ PermissionFlagsBits.ManageGuild ];
    const [hasPerms, missingPerms] = await client.utils.PermissionCheck(interaction, userpermissions, member);
    if (!hasPerms) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), client.utils.Translate('errors.user_missing_perms', interaction.locale, { perms: missingPerms.flat().join(', ') }),  { flags: [ MessageFlags.Ephemeral ] });

    if(!channel && enabled) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), client.utils.Translate('commands.level_setup.provide_channel', interaction.locale),  { flags: [ MessageFlags.Ephemeral ] });


    if(enabled) {
        const botpermissions = [ PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks ];
        const [hasPerms, missingPerms] = await client.utils.PermissionCheck(interaction, botpermissions, client);
        if (!hasPerms) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), client.utils.Translate('errors.bot_missing_perms', interaction.locale, { perms: missingPerms.flat().join(', ') }),  { flags: [ MessageFlags.Ephemeral ] });


        const embed = new EmbedBuilder()
            .setColor('DarkPurple')
            .setTitle(client.utils.Translate('commands.level_setup.test_embed_title', interaction.locale))
            .setDescription(client.utils.Translate('commands.level_setup.test_embed_description', interaction.locale))
            .setFooter({
                text: client.utils.Translate('commands.level_setup.test_embed_footer', interaction.locale, { user: interaction.user.tag }),
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

        const sentMessage = await channel.send({ embeds: [embed] });
        if(!sentMessage) return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), client.utils.Translate('commands.level_setup.test_send_fail', interaction.locale, { channelId: channel.id }),  { flags: [ MessageFlags.Ephemeral ] });
        
    }

    await Guild_Level_Cache.setType(guild.id, 'channelId', channel?.id || null);
    await Guild_Level_Cache.setType(guild.id, 'enabled', enabled);

    client.utils.Embed(interaction, 'DarkPurple', 'Level Setup', `Levels are now ${enabled ? 'enabled' : 'disabled'}`, { flags: [ MessageFlags.Ephemeral ] });

}