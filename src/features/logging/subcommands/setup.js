import { PermissionFlagsBits, MessageFlags, EmbedBuilder, ChannelType } from 'discord.js';
import Logs_Cache from '../cache/logs.cache.js';
import { LOG_TYPES } from '../models/logging.js';

/**
 * @typedef {import('../../../core/extendedClient.js').default} Client
 * @param {import('discord.js').ChatInputCommandInteraction<'cached'>} interaction
 */

export async function execute(interaction) {
    const { client, options, guild, user } = interaction;

    const type = /** @type {import('../models/logging.js').LogType | 'all'} */ (options.getString('log-type'));
    const enabled = options.getBoolean('enabled');
    const channel = options.getChannel('channel', false, [ChannelType.GuildText]);

    // TODO: server logs
    if (type === 'server') {
        const msg = client.utils.Translate('commands.log_setup.server_logs_soon', interaction.locale);
        return interaction.client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            msg,
            { flags: MessageFlags.Ephemeral }
        );
    }

    if (!channel && enabled) {
        const msg = client.utils.Translate('commands.log_setup.provide_channel', interaction.locale);
        return interaction.client.utils.Embed(
            interaction,
            'Red',
            client.utils.Translate('errors.title', interaction.locale),
            msg,
            { flags: MessageFlags.Ephemeral }
        );
    }

    if (enabled) {
        const botPermissions = [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks,
        ];
        const [hasPermissions, missingPermissions] = client.utils.PermissionCheck(
            channel,
            botPermissions,
            guild.members.me
        );
        if (!hasPermissions) {
            const msg = client.utils.Translate('errors.bot_missing_perms', interaction.locale, {
                perms: missingPermissions.flat().join(', '),
            });
            return client.utils.Embed(
                interaction,
                'Red',
                client.utils.Translate('errors.title', interaction.locale),
                msg,
                { flags: MessageFlags.Ephemeral }
            );
        }

        try {
            const embed = new EmbedBuilder()
                .setColor('DarkPurple')
                .setTitle(client.utils.Translate('commands.log_test.test_embed_title', interaction.locale))
                .setDescription(
                    client.utils.Translate('commands.log_test.test_embed_description', interaction.locale, { type })
                )
                .setFooter({
                    text: client.utils.Translate('commands.log_test.test_embed_footer', interaction.locale, {
                        user: user.tag,
                    }),
                    iconURL: user.displayAvatarURL(),
                })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            const msg = client.utils.Translate('errors.test_log_fail_perms', interaction.locale, {
                channel: channel.toString(),
            });
            return client.utils.Embed(
                interaction,
                'Red',
                client.utils.Translate('errors.title', interaction.locale),
                msg,
                { flags: MessageFlags.Ephemeral }
            );
        }
    }

    const settings = { enabled, channelId: channel ? channel.id : null };

    try {
        if (type === 'all') {
            const updatePromises = LOG_TYPES.map((logType) => Logs_Cache.setType(guild.id, logType, settings));

            await Promise.all(updatePromises);
        } else {
            await Logs_Cache.setType(guild.id, type, settings);
        }
    } catch (error) {
        console.error('Failed to update log settings:', error);
        const msg = client.utils.Translate('errors.save_settings_fail', interaction.locale);
        return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), msg, {
            flags: MessageFlags.Ephemeral,
        });
    }

    const statusKey = enabled ? 'commands.log_setup.enabled' : 'commands.log_setup.disabled';
    const statusString = client.utils.Translate(statusKey, interaction.locale);

    const title = client.utils.Translate('commands.log_setup.setup_success_title', interaction.locale);
    const msg = client.utils.Translate('commands.log_setup.setup_success_desc', interaction.locale, {
        status: statusString,
        type,
    });

    client.utils.Embed(interaction, 'Green', title, msg, { flags: MessageFlags.Ephemeral });
}
