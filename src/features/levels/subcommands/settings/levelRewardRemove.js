import { MessageFlags, PermissionFlagsBits } from 'discord.js';
import Guild_Level_Cache from '../../cache/guildLevels.cache.js';

/**
 * @typedef {import('../../../../core/extendedClient.js').default} Client
 * @typedef {import('../../models/guildLevels.js').GuildLevelsType} GuildLevelsType
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
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

    const level = options.getInteger('level');
    const rewards = guildConfig.rewards ?? [];

    if (!level)
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            'Please provide a level to remove as a level reward',
            { flags: MessageFlags.Ephemeral }
        );

    if (rewards.length === 0)
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            'There are no level rewards to remove',
            { flags: MessageFlags.Ephemeral }
        );

    const reward = rewards.find((reward) => reward.level === level);

    if (!reward)
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            `Level \`${level}\` does not exist in the level rewards`,
            { flags: MessageFlags.Ephemeral }
        );

    const updatedRewards = rewards.filter((reward) => reward.level !== level);

    await Guild_Level_Cache.setType(guild.id, 'rewards', updatedRewards);

    return client.utils.Embed(
        interaction,
        'DarkPurple',
        'Level Settings',
        `Successfully removed level reward for level \`${level}\``,
        { flags: MessageFlags.Ephemeral }
    );
}
