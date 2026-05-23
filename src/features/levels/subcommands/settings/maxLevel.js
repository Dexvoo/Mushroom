import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import Guild_Level_Cache from '../../cache/guildLevels.cache.js';

/**
 * @typedef {import('../../../../core/extendedClient.js').default} Client
 * @typedef {import('../../models/guildLevels.js').GuildLevelsType} GuildLevelsType
 * @param { import('discord.js').ChatInputCommandInteraction & { client: Client }} interaction
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
    const maxLevel = options.getInteger('level') ?? 100;

    const fields = [
        { name: 'Old', value: `${guildConfig.maxLevel || 'Not Configured'}`, inline: false },
        { name: 'New', value: `${maxLevel}`, inline: false },
    ];

    await Guild_Level_Cache.setType(guild.id, 'maxLevel', maxLevel);
    client.utils.Embed(interaction, 'DarkPurple', 'Maximum Level Edited', '', { fields });
}
