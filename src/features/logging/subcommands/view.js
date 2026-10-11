import { MessageFlags, EmbedBuilder } from 'discord.js';
import Logs_Cache from '../cache/logs.cache.js';
import { LOG_TYPES, logSettings } from '../models/logging.js';
import { brandColour } from '../../../shared/cache/guildSettings.cache.js';

/**
 * @typedef {import('../../../core/extendedClient.js').default} Client
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 */

export async function execute(interaction) {
    const { client, options, guild, user } = interaction;

    const type = /** @type {import('../models/logging.js').LogType | 'all'} */ (options.getString('log-type'));
    const currentConfig = await Logs_Cache.get(guild.id);

    if (!currentConfig) {
        const errorMsg = client.utils.Translate('commands.log_ignore_view.no_log_config', interaction.locale, { type });
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            errorMsg,
            { flags: MessageFlags.Ephemeral }
        );
    }

    if (type === 'all') {
        const embed = new EmbedBuilder()
            .setColor(await brandColour(interaction.guildId))
            .setTitle(client.utils.Translate('commands.log_view.all_title', interaction.locale))
            .setFooter({
                text: client.utils.Translate('commands.log_view.requested_by', interaction.locale, {
                    user: user.tag,
                }),
                iconURL: user.displayAvatarURL(),
            })
            .setTimestamp();

        for (const logType of LOG_TYPES) {
            const config = logSettings(currentConfig, logType);
            if (!config) continue; // Not set up
            embed.addFields({
                name: logType.charAt(0).toUpperCase() + logType.slice(1),
                value: `${config.enabled ? client.customEmojis.reactions.Yes : client.customEmojis.reactions.No}\n${config.channelId ? `<#${config.channelId}>` : ''}`,
                inline: true,
            });
        }

        return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    }

    const config = logSettings(currentConfig, type);
    if (!config) {
        const errorMsg = client.utils.Translate('commands.log_ignore_view.no_log_config', interaction.locale, { type });
        return client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            errorMsg,
            { flags: MessageFlags.Ephemeral }
        );
    }

    const enabledName = client.utils.Translate('commands.log_view.field_enabled', interaction.locale);
    const channelName = client.utils.Translate('commands.log_view.field_channel', interaction.locale);
    const notSet = client.utils.Translate('commands.log_view.not_set', interaction.locale);

    const fields = [
        {
            name: enabledName,
            value: `${config.enabled ? client.customEmojis.reactions.Yes : client.customEmojis.reactions.No}`,
            inline: true,
        },
        { name: channelName, value: config.channelId ? `<#${config.channelId}>` : notSet, inline: true },
    ];

    const footerText = client.utils.Translate('commands.log_view.requested_by', interaction.locale, {
        user: user.tag,
    });
    const footerIconURL = user.displayAvatarURL();

    const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
    const title = client.utils.Translate('commands.log_view.single_title', interaction.locale, { type: formattedType });

    client.utils.Embed(interaction, 'Brand', title, '', {
        fields,
        footer: { text: footerText, iconURL: footerIconURL },
        flags: MessageFlags.Ephemeral,
        timestamp: true,
    });
}
