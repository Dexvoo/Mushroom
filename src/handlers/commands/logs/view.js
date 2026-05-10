import { Events, ChatInputCommandInteraction, PermissionFlagsBits, MessageFlags, EmbedBuilder, Colors } from 'discord.js';
import Client from '../../../core/client.js';
import Logs_Cache from '../../../constants/cache/logs.js';
import { LogsConfig } from '../../../models/guild/logs.js';

/**
 * @param { ChatInputCommandInteraction & { client: Client }} interaction
 */

export async function execute(interaction) {
    const { client, options, guild, member } = interaction;

    const type = options.getString('log-type');
    const currentConfig = await Logs_Cache.get(guild.id);

    if(!currentConfig) {
        const errorMsg = client.utils.Translate('commands.log_ignore_view.no_log_config', interaction.locale, { type });
        return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), errorMsg, { flags: [ MessageFlags.Ephemeral ] });
    }

    if(type === 'all') {
        const embed = new EmbedBuilder()
            .setColor(Colors.DarkPurple)
            .setTitle(client.utils.Translate('commands.log_view.all_title', interaction.locale))
            .setFooter({
                text: client.utils.Translate('commands.log_view.requested_by', interaction.locale, { user: interaction.user.tag }),
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

        for (const [logType, config] of Object.entries(currentConfig)) {
            if (config.enabled === undefined) continue;
            embed.addFields({
                name: logType.charAt(0).toUpperCase() + logType.slice(1),
                value: `${config.enabled ? client.customEmojis.reactions.Yes : client.customEmojis.reactions.No}\n${config.channelId ? `<#${config.channelId}>` : ''}`,
                inline: true,
            });
        }

        return interaction.reply({ embeds: [embed] });
    }

    const config = currentConfig[type];
    if(!config) {
        const errorMsg = client.utils.Translate('commands.log_ignore_view.no_log_config', interaction.locale, { type });
        return client.utils.Embed(interaction, 'Red', client.utils.Translate('errors.title', interaction.locale), errorMsg, { flags: [ MessageFlags.Ephemeral ] });
    }

    const enabledName = client.utils.Translate('commands.log_view.field_enabled', interaction.locale);
    const channelName = client.utils.Translate('commands.log_view.field_channel', interaction.locale);
    const notSet = client.utils.Translate('commands.log_view.not_set', interaction.locale);

    const fields =[
        { name: enabledName, value: `${config.enabled}`, inline: true },
        { name: channelName, value: config.channelId ? `<#${config.channelId}>` : notSet, inline: true },
    ];
    
    const footerText = client.utils.Translate('commands.log_view.requested_by', interaction.locale, { user: interaction.user.tag });
    const footerIconURL = interaction.user.displayAvatarURL();
    
    const formattedType = type.charAt(0).toUpperCase() + type.slice(1);
    const title = client.utils.Translate('commands.log_view.single_title', interaction.locale, { type: formattedType });

    client.utils.Embed(interaction, 'DarkPurple', title, '', { fields, footer: { text: footerText, iconURL: footerIconURL }, flags: [ MessageFlags.Ephemeral ], timestamp: true });
}