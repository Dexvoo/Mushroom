import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import Guild_Level_Cache from '../../cache/guildLevels.cache.js';

/**
 * @typedef {import('../../../../core/extendedClient.js').default} Client
 * @typedef {import('../../models/guildLevels.js').GuildLevelsType} GuildLevelsType
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 * @param {GuildLevelsType} guildConfig
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
            client.utils.Translate('commands.level_rank.not_configured_prompt', interaction.locale),
            { flags: MessageFlags.Ephemeral }
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

    const level = options.getInteger('level') || 1;
    const role = options.getRole('role');

    if (level > guildConfig.maxLevel)
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            `Target level (${level}) is above max guild level (${guildConfig.maxLevel})`,
            { flags: MessageFlags.Ephemeral }
        );

    if (!role || role.guild.id !== guild.id)
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            `${role} is not from this server.`,
            { flags: MessageFlags.Ephemeral }
        );

    if (role.position >= guild.members.me.roles.highest.position)
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            'Bot Missing Permissions | `RoleHierarchy`',
            { flags: MessageFlags.Ephemeral }
        );

    const rewards = guildConfig.rewards ?? [];

    if (rewards.some((reward) => reward.roleId === role.id))
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            `${role} already exists in the level rewards`,
            { flags: MessageFlags.Ephemeral }
        );

    if (rewards.some((reward) => reward.level === level))
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            `Level ${level} already exists in the role rewards`,
            { flags: MessageFlags.Ephemeral }
        );

    const updatedRewards = [...rewards, { level, roleId: role.id }];

    await Guild_Level_Cache.setType(guild.id, 'rewards', updatedRewards);

    return client.utils.Embed(
        interaction,
        'Brand',
        'Level Settings',
        `Successfully added level reward for ${role} at level \`${level}\``,
        { flags: MessageFlags.Ephemeral }
    );
}
