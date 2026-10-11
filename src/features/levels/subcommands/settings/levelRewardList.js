import Guild_Level_Cache from '../../cache/guildLevels.cache.js';

/**
 * @typedef {import('../../../../core/extendedClient.js').default} Client
 * @typedef {import('../../models/guildLevels.js').GuildLevelsType} GuildLevelsType
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 * @param { GuildLevelsType } guildConfig
 */

export async function execute(interaction, guildConfig) {
    const { client, guild } = interaction;

    if (!guildConfig)
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            client.utils.Translate('errors.no_config_found_generic', interaction.locale)
        );
    if (!guildConfig.enabled)
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            client.utils.Translate('commands.level_rank.not_configured_prompt', interaction.locale)
        );

    await interaction.deferReply();

    const guildRewards = guildConfig.rewards ?? [];

    if (guildRewards.length === 0)
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            'There are no level rewards, an admin of the server can add them by running the command `/level settings add-level-reward`'
        );

    const sortedRewards = [...guildRewards].sort((a, b) => a.level - b.level);

    const missingRoleIds = new Set();
    const rewardLines = await Promise.all(
        sortedRewards.map(async (reward) => {
            const role = guild.roles.cache.get(reward.roleId);
            if (!role) {
                missingRoleIds.add(reward.roleId);
                return `Level ${reward.level}: Role not found`;
            }

            return `Level ${reward.level}: ${role.toString()}`;
        })
    );

    if (missingRoleIds.size > 0) {
        const updatedRewards = guildRewards.filter((reward) => !missingRoleIds.has(reward.roleId));
        await Guild_Level_Cache.setType(guild.id, 'rewards', updatedRewards);
    }

    return client.utils.Embed(interaction, 'DarkPurple', `${guild.name} | Level Rewards`, rewardLines.join('\n'));
}
