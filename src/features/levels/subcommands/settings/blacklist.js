import { ChatInputCommandInteraction, MessageFlags, PermissionFlagsBits } from 'discord.js';
import Client from '../../../../core/extendedClient.js';
import Guild_Level_Cache from '../../cache/guildLevels.cache.js';

/**
 * @typedef {import('../../models/guildLevels.js').GuildLevelsType} GuildLevelsType
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 * @param { GuildLevelsType } guildConfig
 */

export async function execute(interaction, guildConfig) {
    const { client, options, guild, member } = interaction;

    if (!guildConfig)
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            client.utils.Translate('errors.no_config_found_generic', interaction.locale),
            { flags: MessageFlags.Ephemeral }
        );
    if (!guildConfig.enabled)
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            client.utils.Translate('commands.level_rank.not_configured_prompt', interaction.locale)
        );

    const userPermissions = [PermissionFlagsBits.ManageGuild];
    const [hasPerms, missingPerms] = await client.utils.PermissionCheck(interaction, userPermissions, member);
    if (!hasPerms)
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            client.utils.Translate('errors.user_missing_perms', interaction.locale, {
                perms: missingPerms.flat().join(', '),
            }),
            { flags: MessageFlags.Ephemeral }
        );

    await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
    const role = options.getRole('role');
    const channel = options.getChannel('channel');

    if (!role && !channel) {
        const { roleIds = [], channelIds = [] } = guildConfig.blacklisted || {};

        const roleMentions = roleIds.map((id) => `<@&${id}>`).join('\n') || 'None';
        const channelMentions = channelIds.map((id) => `<@&${id}>`).join('\n') || 'None';

        const fields = [
            { name: 'Blacklisted Roles', value: roleMentions, inline: true },
            { name: 'Blacklisted Channels', value: channelMentions, inline: true },
        ];

        client.utils.Embed(interaction, 'DarkPurple', 'Current Level Blacklist', '', { fields });
        return;
    }

    if (!guildConfig.blacklisted) guildConfig.blacklisted = { roleIds: [], channelIds: [] };
    if (!guildConfig.blacklisted.roleIds) guildConfig.blacklisted.roleIds = [];
    if (!guildConfig.blacklisted.channelIds) guildConfig.blacklisted.channelIds = [];

    const fields = [];

    if (role) {
        const blacklisted = guildConfig.blacklisted.roleIds.includes(role.id);

        if (blacklisted) {
            guildConfig.blacklisted.roleIds = guildConfig.blacklisted.roleIds.filter((id) => id !== role.id);
            fields.push({ name: 'Removed Blacklist', value: `Role: ${role}`, inline: true });
        } else {
            guildConfig.blacklisted.roleIds.push(role.id);
            fields.push({ name: 'Added Blacklist', value: `Role: ${role}`, inline: true });
        }
    }

    if (channel) {
        const blacklisted = guildConfig.blacklisted.channelIds.includes(channel.id);

        if (blacklisted) {
            guildConfig.blacklisted.channelIds = guildConfig.blacklisted.channelIds.filter((id) => id !== channel.id);
            fields.push({ name: 'Removed Blacklist', value: `Channel: ${channel}`, inline: true });
        } else {
            guildConfig.blacklisted.channelIds.push(channel.id);
            fields.push({ name: 'Added Blacklist', value: `Channel: ${channel}`, inline: true });
        }
    }

    await Guild_Level_Cache.setType(guild.id, 'blacklisted', guildConfig.blacklisted);
    client.utils.Embed(interaction, 'DarkPurple', 'Blacklist Edited', '', { fields });
}
